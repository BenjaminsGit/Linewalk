import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { myCheckIn } from '../store/selectors';
import { Segmented, TopBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { LINE_TYPES, OUTCOMES } from '../lib/format';
import { resizeImage } from '../lib/image';
import { distanceKm, CITY_CENTER } from '../lib/geo';
import type { ID, LineType, Outcome } from '../store/types';

export function LogSessionScreen({ spotId: initialSpot }: { spotId?: ID }) {
  const { state, now, dispatch, toast } = useStore();
  const { push } = useRouter();
  const me = state.users[state.meId];
  const checkIn = myCheckIn(state, now);

  // Default spot: explicit → current check-in → home spot.
  const [spotId, setSpotId] = useState<ID>(initialSpot ?? checkIn?.spotId ?? me.homeSpotId ?? Object.keys(state.spots)[0]);
  const spot = state.spots[spotId];
  const [type, setType] = useState<LineType>(spot?.type ?? 'park');
  const [length, setLength] = useState(String(spot ? Math.round((spot.gapMin + spot.gapMax) / 2) : 25));
  const [height, setHeight] = useState(spot?.type === 'high' ? '30' : spot?.type === 'mid' ? '4' : '1');
  const [outcome, setOutcome] = useState<Outcome>('walked');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [share, setShare] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const spotsSorted = useMemo(() => {
    const c = CITY_CENTER[me.city] ?? CITY_CENTER.Johannesburg;
    return Object.values(state.spots).sort((a, b) => distanceKm(c, a) - distanceKm(c, b));
  }, [state.spots, me.city]);

  const lengthN = Number(length);
  const heightN = Number(height);
  const valid = spot && lengthN > 0 && lengthN <= 3000 && heightN >= 0 && heightN <= 2000;

  const pickSpot = (id: ID) => {
    setSpotId(id);
    const s = state.spots[id];
    if (s) {
      setType(s.type);
      setLength(String(Math.round((s.gapMin + s.gapMax) / 2)));
      setHeight(s.type === 'high' ? '30' : s.type === 'mid' ? '4' : s.type === 'water' ? '1' : '1');
    }
  };

  return (
    <>
      <TopBar title="Log a session" back={false} />
      <form
        className="pad stack gap-20"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          dispatch({ type: 'LOG_SESSION', spotId, lineType: type, length: lengthN, height: heightN, outcome, notes, photo, visibility: share ? 'public' : 'private' });
          toast(share ? 'Session posted to your feed 🎉' : 'Saved to your private logbook');
          push(share ? { name: 'feed' } : { name: 'profile' });
        }}
      >
        <label className="field">
          Spot
          <select className="select" value={spotId} onChange={(e) => pickSpot(e.target.value)}>
            {spotsSorted.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.area}</option>)}
          </select>
          {checkIn && checkIn.spotId === spotId && <span className="hint">You're checked in here.</span>}
        </label>

        <fieldset>
          <legend>Line type</legend>
          <Segmented label="Line type" options={LINE_TYPES.map((t) => ({ id: t.id, label: t.short }))} value={type} onChange={setType} />
        </fieldset>

        <div className="grid-2">
          <label className="field">Length (m)
            <input className="input" type="number" inputMode="decimal" min="1" max="3000" step="0.5" value={length} onChange={(e) => setLength(e.target.value)} required />
          </label>
          <label className="field">Height (m)
            <input className="input" type="number" inputMode="decimal" min="0" max="2000" step="0.5" value={height} onChange={(e) => setHeight(e.target.value)} required />
          </label>
        </div>

        <fieldset>
          <legend>How did it go?</legend>
          <div className="row gap-8 wrap">
            {OUTCOMES.map((o) => (
              <button key={o.id} type="button" className="chip lime" style={{ height: 44 }} aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)}>{o.label}</button>
            ))}
          </div>
        </fieldset>

        <label className="field">Notes
          <textarea className="textarea" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Wind, tension, what clicked…" />
        </label>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id="photo"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try { setPhoto(await resizeImage(f)); } catch { toast("Couldn't read that image"); }
            }}
          />
          {photo ? (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              <img src={photo} alt="Selected session photo" style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }} />
              <button type="button" className="icon-btn" style={{ position: 'absolute', top: 8, right: 8, background: '#fff' }} aria-label="Remove photo" onClick={() => { setPhoto(undefined); if (fileRef.current) fileRef.current.value = ''; }}>
                <Icon name="close" />
              </button>
            </div>
          ) : (
            <label htmlFor="photo" className="stack center gap-6" style={{ height: 96, border: '2px dashed #A9B7B0', borderRadius: 16, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <Icon name="camera" /> Add a photo
              <span className="xs muted" style={{ fontWeight: 400 }}>Video clips come in the full app</span>
            </label>
          )}
        </div>

        <label className="switch">
          <span>
            <span className="bold" style={{ display: 'block' }}>Share to feed</span>
            <span className="small muted">Off keeps it in your private logbook</span>
          </span>
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
        </label>

        <button className="btn block" style={{ height: 52 }} disabled={!valid}>{share ? 'Post session' : 'Save to logbook'}</button>
      </form>
    </>
  );
}
