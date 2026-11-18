import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CITY_BOUNDS, WORLD, project, unproject } from '../lib/geo';
import type { Spot } from '../store/types';
import { Icon } from './Icon';

export interface MapPin {
  spot: Spot;
  selected: boolean;
  live: number;
  label: string;
}

interface View { s: number; tx: number; ty: number }

/**
 * A pan/zoom map over a stylised SVG basemap. Production swaps this for
 * MapLibre + vector tiles (see docs/PLAN.md §7); the props stay the same.
 */
export function MapView({
  city, pins, onPinClick, onMapClick, fitTo, safeTop = 110, safeBottom = 280, children, picking = false,
}: {
  city: string;
  pins: MapPin[];
  onPinClick: (spot: Spot) => void;
  onMapClick?: (pos: { lat: number; lng: number }) => void;
  fitTo: Spot[]; // spots to frame when the city changes
  safeTop?: number;
  safeBottom?: number;
  children?: ReactNode;
  picking?: boolean;
}) {
  const bounds = CITY_BOUNDS[city];
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 700 });
  const [view, setView] = useState<View>({ s: 0.4, tx: 0, ty: 0 });
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback((spots: Spot[], all = false) => {
    if (!spots.length) return;
    const pts = spots.map((s) => project(s.lat, s.lng, bounds));
    // Frame the dense core: drop outliers more than 3× the median distance from the centroid.
    const cx0 = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const cy0 = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const d = pts.map((p) => Math.hypot(p.x - cx0, p.y - cy0));
    const med = [...d].sort((a, b) => a - b)[Math.floor(d.length / 2)] || 1;
    const core = all ? pts : pts.filter((_, i) => d[i] <= med * 3 || pts.length <= 2);
    const xs = core.map((p) => p.x);
    const ys = core.map((p) => p.y);
    const minX = Math.min(...xs) - 30, maxX = Math.max(...xs) + 30;
    const minY = Math.min(...ys) - 30, maxY = Math.max(...ys) + 30;
    const availW = size.w - 60;
    const availH = Math.max(160, size.h - safeTop - safeBottom - 40);
    const s = clamp(Math.min(availW / (maxX - minX), availH / (maxY - minY)), 0.35, 8);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({ s, tx: size.w / 2 - cx * s, ty: safeTop + 20 + availH / 2 - cy * s });
  }, [bounds, size.w, size.h, safeTop, safeBottom]);

  // Re-frame when the city (or the container size) changes.
  const fitKey = city + ':' + size.w + 'x' + size.h;
  const lastFit = useRef('');
  useEffect(() => {
    if (lastFit.current === fitKey) return;
    lastFit.current = fitKey;
    fit(fitTo);
  }, [fitKey, fit, fitTo]);

  const zoom = (factor: number, cx = size.w / 2, cy = safeTop + (size.h - safeTop - safeBottom) / 2) => {
    setView((v) => {
      const s = clamp(v.s * factor, 0.35, 12);
      const k = s / v.s;
      return { s, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    if (d.moved) setView((v) => ({ ...v, tx: d.tx + dx, ty: d.ty + dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || !onMapClick) return;
    const rect = ref.current!.getBoundingClientRect();
    const wx = (e.clientX - rect.left - view.tx) / view.s;
    const wy = (e.clientY - rect.top - view.ty) / view.s;
    onMapClick(unproject(wx, wy, bounds));
  };

  return (
    <div
      ref={ref}
      className="map"
      style={{ touchAction: 'none', cursor: picking ? 'crosshair' : drag.current ? 'grabbing' : 'grab', background: city === 'Cape Town' ? '#BFD9E6' : '#E4ECE7' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={(e) => {
        const rect = ref.current!.getBoundingClientRect();
        zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top);
      }}
      role="application"
      aria-label={`Map of slackline spots in ${city}. Drag to pan; use the zoom buttons to zoom.`}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD, height: WORLD, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`, transformOrigin: '0 0' }}>
        <Basemap city={city} />
      </div>

      {pins.map((p) => {
        const w = project(p.spot.lat, p.spot.lng, bounds);
        const x = w.x * view.s + view.tx;
        const y = w.y * view.s + view.ty;
        if (x < -40 || y < -40 || x > size.w + 40 || y > size.h + 40) return null;
        return (
          <button
            key={p.spot.id}
            type="button"
            className="pin"
            style={{ left: x, top: y, zIndex: p.selected ? 3 : 2 }}
            aria-pressed={p.selected}
            aria-label={`${p.spot.name}${p.live ? `, ${p.live} on a line now` : ''}`}
            onClick={() => onPinClick(p.spot)}
          >
            <span>
              {p.label}
              {p.live > 0 && <span className="live-count">{p.live}</span>}
            </span>
          </button>
        );
      })}

      <div style={{ position: 'absolute', right: 12, top: safeTop + 8, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 3 }}>
        <button type="button" className="icon-btn" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(16,32,27,.15)' }} aria-label="Zoom in" onClick={() => zoom(1.5)}><Icon name="plus" /></button>
        <button type="button" className="icon-btn" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(16,32,27,.15)', fontSize: 26, fontWeight: 500 }} aria-label="Zoom out" onClick={() => zoom(1 / 1.5)}>−</button>
        <button type="button" className="icon-btn" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(16,32,27,.15)' }} aria-label="Show all spots" onClick={() => fit(fitTo, true)}><Icon name="locate" /></button>
      </div>
      {children}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, n)); }

/** Stylised basemap: deterministic, no tiles needed. */
function Basemap({ city }: { city: string }) {
  const b = CITY_BOUNDS[city];
  const P = (lat: number, lng: number) => project(lat, lng, b);

  if (city === 'Cape Town') {
    const garden = P(-33.9275, 18.4175);
    const green = P(-33.9035, 18.4065);
    const rond = P(-33.9605, 18.4815);
    return (
      <svg width={WORLD} height={WORLD} viewBox={`0 0 ${WORLD} ${WORLD}`} aria-hidden="true">
        <rect width={WORLD} height={WORLD} fill="#BFD9E6" />
        {/* land */}
        <path d="M120 1000 L150 760 L160 600 L190 470 L215 330 L300 220 L520 190 L640 180 L760 120 L900 60 L1000 40 L1000 1000 Z" fill="#E7EDE6" />
        {/* Table Mountain & Lion's Head */}
        <path d="M250 700 C300 560 420 520 520 560 C600 590 640 680 600 760 C520 820 330 820 250 700 Z" fill="#C9D9C4" />
        <path d="M330 640 C380 600 470 600 520 640" stroke="#A9BFA3" strokeWidth="10" fill="none" />
        <path d="M200 520 C230 470 270 460 300 500 C290 540 240 560 200 520 Z" fill="#C9D9C4" />
        {/* roads */}
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
          <path d="M400 330 L700 300 L1000 260" strokeWidth="12" />
          <path d="M560 400 L640 700 L720 1000" strokeWidth="12" />
          <path d="M300 420 L560 400 L1000 420" strokeWidth="8" />
          <path d="M640 560 L1000 600" strokeWidth="8" />
          <path d="M250 470 L380 380 L520 330" strokeWidth="6" />
          <path d="M760 300 L820 1000" strokeWidth="6" />
        </g>
        <Park x={garden.x} y={garden.y} r={26} />
        <Park x={green.x} y={green.y} r={40} />
        <Park x={rond.x} y={rond.y} r={34} />
        <ellipse cx={rond.x + 10} cy={rond.y + 8} rx="14" ry="9" fill="#A9CBE0" />
        <text x="80" y="300" fill="#7FA5B8" fontSize="28" fontFamily="Inter, sans-serif" fontStyle="italic">Atlantic</text>
        <text x="330" y="720" fill="#7F9A79" fontSize="22" fontFamily="Inter, sans-serif">Table Mountain</text>
      </svg>
    );
  }

  const zoo = P(-26.1607, 28.0305);
  const emm = P(-26.1555, 28.0063);
  const delta = P(-26.1262, 28.0093);
  const kop = P(-26.1733, 28.0012);
  const gorge = P(-25.95, 27.85);
  return (
    <svg width={WORLD} height={WORLD} viewBox={`0 0 ${WORLD} ${WORLD}`} aria-hidden="true">
      <rect width={WORLD} height={WORLD} fill="#E4ECE7" />
      {/* Magaliesberg ridge */}
      <path d={`M0 ${gorge.y + 40} C150 ${gorge.y - 30} 300 ${gorge.y - 10} 460 ${gorge.y - 60} L460 ${gorge.y - 20} C300 ${gorge.y + 40} 150 ${gorge.y + 30} 0 ${gorge.y + 90} Z`} fill="#C3D3BD" />
      <text x="40" y={gorge.y - 40} fill="#7F9A79" fontSize="24" fontFamily="Inter, sans-serif">Magaliesberg</text>
      {/* roads */}
      <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
        <path d={`M0 ${zoo.y - 120} L1000 ${zoo.y - 160}`} strokeWidth="10" />
        <path d={`M${zoo.x + 40} 0 L${zoo.x + 70} 1000`} strokeWidth="10" />
        <path d={`M0 ${zoo.y + 40} L1000 ${zoo.y + 20}`} strokeWidth="6" />
        <path d={`M${emm.x - 40} 300 L${emm.x - 20} 1000`} strokeWidth="6" />
        <path d={`M${gorge.x + 20} ${gorge.y + 30} L${delta.x - 30} ${delta.y - 30} L${zoo.x + 60} ${zoo.y + 140}`} strokeWidth="8" />
        <path d={`M${delta.x - 80} ${delta.y + 10} L1000 ${delta.y - 20}`} strokeWidth="4" />
        <path d={`M${kop.x - 120} ${kop.y + 20} L${zoo.x + 200} ${kop.y + 40}`} strokeWidth="4" />
      </g>
      <Park x={zoo.x} y={zoo.y} r={18} />
      <ellipse cx={zoo.x - 4} cy={zoo.y + 6} rx="7" ry="4" fill="#A9CBE0" />
      <Park x={emm.x} y={emm.y} r={20} />
      <ellipse cx={emm.x + 6} cy={emm.y - 4} rx="9" ry="5" fill="#A9CBE0" />
      <Park x={delta.x} y={delta.y} r={18} />
      <Park x={kop.x} y={kop.y} r={14} />
    </svg>
  );
}

function Park({ x, y, r }: { x: number; y: number; r: number }) {
  return <ellipse cx={x} cy={y} rx={r * 1.3} ry={r} fill="#C3D9C9" />;
}
