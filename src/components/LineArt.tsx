import type { LineType } from '../store/types';

/**
 * Generated illustration for a session without a photo. Deterministic per
 * `seed`, so a post always draws the same scene. Stands in for clips/photos.
 */
export function LineArt({ type, seed, height = 200, label }: { type: LineType; seed: string; height?: number; label: string }) {
  const r = rng(seed);
  const W = 400;
  const H = height;
  const sky = ['#CFE0D8', '#D8E4EE', '#E9E1CF', '#DCE7E1'][Math.floor(r() * 4)];
  const sag = { park: 14, long: 34, mid: 22, high: 26, water: 18 }[type];
  const walker = 0.3 + r() * 0.4;

  let ground: JSX.Element;
  let ax1 = 70, ay1 = H * 0.42, ax2 = W - 70, ay2 = H * 0.42;

  if (type === 'high') {
    ay1 = H * 0.3 + r() * 10; ay2 = H * 0.32 + r() * 10; ax1 = 70; ax2 = W - 70;
    ground = (
      <>
        <path d={`M0 ${H} L0 ${ay1 - 6} L${ax1 + 6} ${ay1} L${ax1 + 30} ${H} Z`} fill="#17362D" />
        <path d={`M${W} ${H} L${W} ${ay2 - 8} L${ax2 - 6} ${ay2} L${ax2 - 30} ${H} Z`} fill="#17362D" />
        <path d={`M${ax1 + 30} ${H} Q${W / 2} ${H * 0.82} ${ax2 - 30} ${H}`} fill="#9DB8AC" />
      </>
    );
  } else if (type === 'water') {
    ground = (
      <>
        <rect x="0" y={H * 0.62} width={W} height={H * 0.38} fill="#8FB9CF" />
        <path d={`M0 ${H * 0.7} Q100 ${H * 0.66} 200 ${H * 0.7} T400 ${H * 0.7}`} stroke="#B9D6E4" strokeWidth="3" fill="none" />
        <rect x={ax1 - 4} y={ay1} width="8" height={H * 0.62 - ay1} fill="#5B4636" />
        <rect x={ax2 - 4} y={ay2} width="8" height={H * 0.62 - ay2} fill="#5B4636" />
      </>
    );
  } else {
    ay1 = type === 'mid' ? H * 0.32 : H * 0.5; ay2 = ay1;
    ground = (
      <>
        <rect x="0" y={H * 0.72} width={W} height={H * 0.28} fill="#A9C9A4" />
        <Tree x={ax1} base={H * 0.72} h={H * 0.6} />
        <Tree x={ax2} base={H * 0.72} h={H * 0.64} />
      </>
    );
  }

  const mx = (ax1 + ax2) / 2;
  const my = (ay1 + ay2) / 2 + sag;
  // Point on the quadratic curve at t = walker
  const t = walker;
  const px = (1 - t) ** 2 * ax1 + 2 * (1 - t) * t * mx + t ** 2 * ax2;
  const py = (1 - t) ** 2 * ay1 + 2 * (1 - t) * t * (my + sag) + t ** 2 * ay2;

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height={H} style={{ display: 'block' }}>
      <rect width={W} height={H} fill={sky} />
      <circle cx={W * (0.15 + r() * 0.7)} cy={H * 0.18} r="16" fill="#F6E7B0" opacity="0.8" />
      {ground}
      <path d={`M${ax1} ${ay1} Q${mx} ${my + sag} ${ax2} ${ay2}`} stroke="#10201B" strokeWidth="2.2" fill="none" />
      <g stroke="#C2410C" strokeWidth="3" strokeLinecap="round" fill="none">
        <circle cx={px} cy={py - 27} r="5" fill="#C2410C" stroke="none" />
        <path d={`M${px} ${py - 22} L${px} ${py - 9}`} />
        <path d={`M${px} ${py - 18} L${px - 13} ${py - 25} M${px} ${py - 18} L${px + 13} ${py - 25}`} />
        <path d={`M${px} ${py - 9} L${px - 5} ${py} M${px} ${py - 9} L${px + 6} ${py - 1}`} />
      </g>
    </svg>
  );
}

function Tree({ x, base, h }: { x: number; base: number; h: number }) {
  return (
    <g>
      <rect x={x - 6} y={base - h * 0.55} width="12" height={h * 0.55} fill="#5B4636" />
      <circle cx={x} cy={base - h * 0.7} r={h * 0.32} fill="#2F5D4A" />
      <circle cx={x - h * 0.2} cy={base - h * 0.58} r={h * 0.22} fill="#3A6E57" />
      <circle cx={x + h * 0.2} cy={base - h * 0.6} r={h * 0.22} fill="#24493E" />
    </g>
  );
}

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
