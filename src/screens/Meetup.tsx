import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { Avatar, Empty, Segmented, TopBar, UserName } from '../components/ui';
import { Icon } from '../components/Icon';
import { LEVELS, levelLabel, whenLabel } from '../lib/format';
import { nextDow } from '../data/seed';
import { CITY_CENTER, distanceKm } from '../lib/geo';
import type { ID, Level } from '../store/types';

export function MeetupScreen({ meetupId }: { meetupId: ID }) {
  const { state, now, dispatch, toast } = useStore();
  const { push } = useRouter();
  const m = state.meetups[meetupId];
  if (!m) return <><TopBar title="Meetup" /><Empty>Meetup not found.</Empty></>;
  const spot = state.spots[m.spotId];
  const going = state.rsvps[m.id] ?? [];
  const amGoing = going.includes(state.meId);
  const isHost = m.hostId === state.meId;
  const full = going.length >= m.capacity;

  return (
    <>
      <TopBar title="Meetup" />
      <div className="pad stack gap-16">
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ background: 'var(--forest)', color: '#fff', padding: '18px 16px' }}>
            <div className="xs bold" style={{ color: 'var(--lime)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{whenLabel(m.startsAt, now)}</div>
            <h2 className="display" style={{ fontSize: 26, marginTop: 4 }}>{m.title}</h2>
            <div className="row gap-6 wrap mt-12">
              <span className="badge">{levelLabel(m.level)}</span>
              {m.gearProvided && <span className="badge soft">Gear provided</span>}
            </div>
          </div>
          <div className="pad-14 stack gap-12" style={{ padding: 16 }}>
            <button type="button" className="card-btn row gap-12" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => push({ name: 'spot', spotId: spot.id })}>
              <div className="logo-sq"><Icon name="pin" size={20} /></div>
              <div className="grow"><div className="bold">{spot.name}</div><div className="small muted">{spot.area} · tap for spot info</div></div>
            </button>
            <div className="row gap-12">
              <Avatar userId={m.hostId} size={44} onClick={() => push({ name: 'profile', userId: m.hostId })} />
              <div className="grow"><div className="small muted">Hosted by</div><UserName userId={m.hostId} /></div>
            </div>
            {m.description && <p style={{ fontSize: 15, lineHeight: 1.5 }}>{m.description}</p>}
          </div>
        </div>

        <button
          type="button"
          className={'btn block ' + (amGoing ? 'ghost' : 'lime')}
          style={{ height: 52 }}
          disabled={(isHost && amGoing) || (!amGoing && full)}
          onClick={() => {
            dispatch({ type: 'TOGGLE_RSVP', meetupId: m.id });
            toast(amGoing ? "RSVP cancelled" : "You're in! We'll remind you the day before.");
          }}
        >
          {isHost ? "You're hosting" : amGoing ? "Going ✓ — tap to cancel" : full ? 'Full' : "I'm in"}
        </button>

        <section>
          <h2 className="section-title" style={{ margin: '0 0 10px' }}>Going · {going.length}/{m.capacity}</h2>
          <div className="card">
            {going.map((u) => (
              <button key={u} type="button" className="list-row card-btn" style={{ border: 0, background: 'none' }} onClick={() => push({ name: 'profile', userId: u })}>
                <Avatar userId={u} size={36} />
                <div className="grow"><UserName userId={u} /><div className="small muted">{u === m.hostId ? 'Host' : state.users[u].city}</div></div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function CreateMeetupScreen({ spotId: initial }: { spotId?: ID }) {
  const { state, now, dispatch, toast } = useStore();
  const { replace } = useRouter();
  const me = state.users[state.meId];
  const spots = useMemo(() => {
    const c = CITY_CENTER[me.city] ?? CITY_CENTER.Johannesburg;
    return Object.values(state.spots).sort((a, b) => distanceKm(c, a) - distanceKm(c, b));
  }, [state.spots, me.city]);
  const defaultStart = nextDow(now, 6, 9);
  const toLocal = (t: number) => {
    const d = new Date(t - new Date(t).getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  };
  const [spotId, setSpotId] = useState(initial ?? me.homeSpotId ?? spots[0].id);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(toLocal(defaultStart));
  const [level, setLevel] = useState<Level>('all');
  const [gear, setGear] = useState(true);
  const [capacity, setCapacity] = useState('15');
  const [desc, setDesc] = useState('');
  const startsAt = new Date(when).getTime();
  const valid = title.trim() && Number.isFinite(startsAt) && startsAt > now;

  return (
    <>
      <TopBar title="Host a meetup" />
      <form
        className="pad stack gap-20"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          const id = 'm_' + Date.now().toString(36);
          dispatch({ type: 'CREATE_MEETUP', id, spotId, title, startsAt, description: desc, level, gearProvided: gear, capacity: Number(capacity) || 15 });
          toast('Meetup created and shared to the feed');
          replace({ name: 'meetup', meetupId: id });
        }}
      >
        <label className="field">Title
          <input className="input" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Saturday longline session" required />
        </label>
        <label className="field">Spot
          <select className="select" value={spotId} onChange={(e) => setSpotId(e.target.value)}>
            {spots.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.area}</option>)}
          </select>
        </label>
        <div className="grid-2">
          <label className="field">Starts
            <input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
          </label>
          <label className="field">Capacity
            <input className="input" type="number" min="2" max="500" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </label>
        </div>
        {Number.isFinite(startsAt) && startsAt <= now && <p className="small" style={{ color: 'var(--red-ink)' }}>Pick a time in the future.</p>}
        <fieldset>
          <legend>Level</legend>
          <Segmented label="Level" options={LEVELS.map((l) => ({ id: l.id, label: l.id === 'beginner' ? 'Beginner' : l.label }))} value={level} onChange={setLevel} />
        </fieldset>
        <label className="switch">
          <span className="bold">Lines and gear provided</span>
          <input type="checkbox" checked={gear} onChange={(e) => setGear(e.target.checked)} />
        </label>
        <label className="field">Details
          <textarea className="textarea" value={desc} maxLength={500} onChange={(e) => setDesc(e.target.value)} placeholder="What you'll rig, what to bring, where to find you…" />
        </label>
        <button className="btn block" style={{ height: 52 }} disabled={!valid}>Create meetup</button>
      </form>
    </>
  );
}
