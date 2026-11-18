import { useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { Segmented, TopBar } from '../components/ui';
import { ANCHORS, LINE_TYPES } from '../lib/format';
import { CITY_CENTER } from '../lib/geo';
import type { Anchors, LineType } from '../store/types';

export function AddSpotScreen({ lat, lng, city }: { lat?: number; lng?: number; city?: string }) {
  const { state, dispatch, toast } = useStore();
  const { replace } = useRouter();
  const area = city ?? state.users[state.meId].city;
  const center = CITY_CENTER[area] ?? CITY_CENTER.Johannesburg;
  const [name, setName] = useState('');
  const [type, setType] = useState<LineType>('park');
  const [gapMin, setGapMin] = useState('15');
  const [gapMax, setGapMax] = useState('30');
  const [anchors, setAnchors] = useState<Anchors>('trees');
  const [note, setNote] = useState('');
  const [rigging, setRigging] = useState('');
  const isRigger = state.users[state.meId].verifiedRigger;
  const needsRigging = type === 'high' || type === 'mid';

  return (
    <>
      <TopBar title="Add a spot" />
      <form
        className="pad stack gap-20"
        onSubmit={(e) => {
          e.preventDefault();
          const id = 's_' + Date.now().toString(36);
          dispatch({
            type: 'ADD_SPOT', id, name, area, lineType: type,
            lat: lat ?? center.lat, lng: lng ?? center.lng,
            gapMin: Number(gapMin), gapMax: Number(gapMax), anchors, accessNote: note,
            riggingInfo: needsRigging && isRigger ? rigging : undefined,
          });
          toast('Spot added — thanks for growing the map!');
          replace({ name: 'spot', spotId: id });
        }}
      >
        <div className="tile small">
          📍 {lat !== undefined ? `Pinned at ${lat.toFixed(4)}, ${lng!.toFixed(4)}` : `Centre of ${area}`} · {area}
        </div>

        <label className="field">Spot name
          <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Westcliff oaks" required />
        </label>

        <fieldset>
          <legend>Line type</legend>
          <Segmented label="Line type" options={LINE_TYPES.map((t) => ({ id: t.id, label: t.short }))} value={type} onChange={setType} />
        </fieldset>

        <div className="grid-2">
          <label className="field">Shortest gap (m)
            <input className="input" type="number" min="1" value={gapMin} onChange={(e) => setGapMin(e.target.value)} required />
          </label>
          <label className="field">Longest gap (m)
            <input className="input" type="number" min="1" value={gapMax} onChange={(e) => setGapMax(e.target.value)} required />
          </label>
        </div>

        <fieldset>
          <legend>Anchors</legend>
          <Segmented label="Anchors" options={ANCHORS} value={anchors} onChange={setAnchors} />
        </fieldset>

        <label className="field">Access notes
          <span className="hint">Public to everyone. Parking, rules, best times, tree protection…</span>
          <textarea className="textarea" value={note} maxLength={400} onChange={(e) => setNote(e.target.value)} />
        </label>

        {needsRigging && (
          isRigger ? (
            <label className="field">Rigging info (verified riggers only)
              <textarea className="textarea" value={rigging} maxLength={600} onChange={(e) => setRigging(e.target.value)} placeholder="Anchor type and condition, backup, inspection date…" />
            </label>
          ) : (
            <div className="notice">Rigging details for mid- and highlines can only be added by verified riggers. Your spot will show as gated until a rigger adds them.</div>
          )
        )}

        <button className="btn block" style={{ height: 52 }} disabled={!name.trim()}>Add spot</button>
      </form>
    </>
  );
}
