import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { cityOfArea, liveCheckIns, myCheckIn, spotRating } from '../store/selectors';
import { MapView } from '../components/MapView';
import { Icon } from '../components/Icon';
import { Stars } from '../components/ui';
import { CITIES, LINE_TYPES, anchorLabel, lineLabel, lineLetter } from '../lib/format';
import type { LineType, Spot } from '../store/types';

export function SpotsScreen() {
  const { state, now, dispatch, toast } = useStore();
  const { push } = useRouter();
  const [city, setCity] = useState(state.users[state.meId].city);
  const [filter, setFilter] = useState<LineType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const live = liveCheckIns(state, now);
  const mine = myCheckIn(state, now);
  const citySpots = useMemo(() => Object.values(state.spots).filter((s) => cityOfArea(s.area) === city), [state.spots, city]);
  const visible = citySpots.filter(
    (s) => (filter === 'all' || s.type === filter) && (!query || s.name.toLowerCase().includes(query.toLowerCase())),
  );
  const spot: Spot | undefined = selected ? state.spots[selected] : undefined;

  return (
    <div className="map-wrap" style={{ height: '100%' }}>
      <MapView
        city={city}
        fitTo={citySpots}
        picking={picking}
        pins={visible.map((s) => ({ spot: s, selected: s.id === selected, live: live.filter((c) => c.spotId === s.id).length, label: lineLetter(s.type) }))}
        onPinClick={(s) => { setSelected(s.id); setPicking(false); }}
        onMapClick={(pos) => {
          if (picking) {
            setPicking(false);
            push({ name: 'addSpot', lat: pos.lat, lng: pos.lng, city });
          } else {
            setSelected(null);
          }
        }}
        safeTop={112}
        safeBottom={spot ? 330 : 150}
      />

      <div className="map-top">
        <div className="row gap-8 pad">
          <label className="grow row gap-8" style={{ height: 48, background: '#fff', borderRadius: 24, padding: '0 16px', boxShadow: '0 2px 10px rgba(16,32,27,.12)' }}>
            <Icon name="search" size={20} />
            <span className="sr-only">Search spots</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search spots" style={{ border: 0, outline: 'none', flex: 1, fontSize: 16, background: 'transparent', minWidth: 0 }} />
          </label>
          <label className="sr-only" htmlFor="city">City</label>
          <select id="city" className="select" value={city} onChange={(e) => { setCity(e.target.value); setSelected(null); }} style={{ width: 'auto', borderRadius: 24, border: 0, boxShadow: '0 2px 10px rgba(16,32,27,.12)', fontWeight: 600, fontSize: 14 }}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="chips" role="group" aria-label="Line type">
          <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
          {LINE_TYPES.map((t) => (
            <button key={t.id} type="button" className="chip" aria-pressed={filter === t.id} onClick={() => setFilter(filter === t.id ? 'all' : t.id)}>{t.label}</button>
          ))}
        </div>
        {picking && (
          <div className="pad">
            <div className="row gap-8" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 14, padding: '10px 14px' }}>
              <Icon name="pin" size={20} />
              <span className="grow small bold">Tap the map where the line goes</span>
              <button type="button" className="btn sm lime" style={{ height: 34 }} onClick={() => setPicking(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {spot ? (
        <section className="sheet" aria-label={`${spot.name} details`}>
          <div className="grabber" />
          <SpotSummary spot={spot} />
          <div className="grid-2 mt-12">
            <button type="button" className="btn ghost" onClick={() => push({ name: 'spot', spotId: spot.id })}>Details</button>
            {mine?.spotId === spot.id ? (
              <button type="button" className="btn lime" onClick={() => { dispatch({ type: 'CHECK_OUT' }); toast('Checked out'); }}>Check out</button>
            ) : (
              <button type="button" className="btn lime" onClick={() => { dispatch({ type: 'CHECK_IN', spotId: spot.id }); toast(`Checked in at ${spot.name} — your crew can see you're out`); }}>Check in here</button>
            )}
          </div>
        </section>
      ) : (
        <section className="sheet" aria-label="Spots summary">
          <div className="grabber" />
          <div className="row between gap-12">
            <div>
              <div className="bold">{visible.length} spots in {city}</div>
              <div className="small muted">{(() => { const n = live.filter((c) => citySpots.some((s) => s.id === c.spotId)).length; return `${n} ${n === 1 ? 'person' : 'people'} on a line now`; })()} · tap a pin</div>
            </div>
            <button type="button" className="btn sm" onClick={() => { setPicking(true); setSelected(null); }}>
              <Icon name="plus" size={18} /> Add spot
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export function SpotSummary({ spot }: { spot: Spot }) {
  const { state, now } = useStore();
  const { avg, count } = spotRating(state, spot.id);
  const here = liveCheckIns(state, now).filter((c) => c.spotId === spot.id).length;
  return (
    <>
      <div className="row between gap-12" style={{ alignItems: 'flex-start' }}>
        <div className="grow">
          <div className="xs bold muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{lineLabel(spot.type)} · {spot.area}</div>
          <h2 className="display" style={{ fontSize: 22 }}>{spot.name}</h2>
          <div className="row gap-6 small muted mt-8">
            {count ? <><Stars value={avg} size={14} /> {avg.toFixed(1)} ({count})</> : 'No reviews yet'}
          </div>
        </div>
        {spot.type === 'high' && <span className="badge amber"><Icon name="lock" size={14} /> Gated</span>}
      </div>
      <div className="grid-3 mt-12">
        <div className="tile"><div className="k">Gap</div><div className="v">{spot.gapMin}–{spot.gapMax} m</div></div>
        <div className="tile"><div className="k">Anchors</div><div className="v">{anchorLabel(spot.anchors)}</div></div>
        <div className="tile"><div className="k">Here now</div><div className="v">{here}</div></div>
      </div>
    </>
  );
}
