import { useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { followers, following, gearStatus, isFollowing, myCheckIn, sessionsOf, userStats, liveCheckIns } from '../store/selectors';
import { Empty, Segmented, TopBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { GEAR_KINDS, dateLabel, fmtM, gearKindLabel, lineLabel, outcomeLabel, timeAgo } from '../lib/format';
import { initials } from '../lib/format';
import type { GearKind, ID } from '../store/types';

type PTab = 'logbook' | 'posts' | 'gear';

export function ProfileScreen({ userId }: { userId?: ID }) {
  const { state, now, dispatch, toast } = useStore();
  const { push, depth, back } = useRouter();
  const id = userId ?? state.meId;
  const isMe = id === state.meId;
  const u = state.users[id];
  const [tab, setTab] = useState<PTab>('logbook');
  if (!u) return <Empty>User not found.</Empty>;

  const stats = userStats(state, id, now, isMe);
  const sessions = sessionsOf(state, id, isMe);
  const posts = state.posts.filter((p) => p.authorId === id).sort((a, b) => b.createdAt - a.createdAt);
  const gear = state.gear.filter((g) => g.userId === id);
  const live = isMe ? myCheckIn(state, now) : liveCheckIns(state, now).find((c) => c.userId === id);
  const followingThem = isFollowing(state, id);
  const home = u.homeSpotId ? state.spots[u.homeSpotId] : undefined;
  const gearAlerts = gear.filter((g) => gearStatus(g.retireOn, now) !== 'ok').length;

  return (
    <>
      <section className="hero">
        <div className="row" style={{ minHeight: 56 }}>
          {depth > 1 && (
            <button type="button" className="icon-btn" style={{ color: '#fff' }} aria-label="Back" onClick={back}>
              <Icon name="back" />
            </button>
          )}
          <div className="grow" />
          {isMe && (
            <button type="button" className="icon-btn" style={{ color: '#fff' }} aria-label="Settings" onClick={() => push({ name: 'settings' })}>
              <Icon name="menu" />
            </button>
          )}
        </div>
        <div className="row gap-16">
          <span className={'avatar' + (live ? ' live' : '')} style={{ width: 76, height: 76, background: u.color, fontSize: 26, fontFamily: "'Space Grotesk', Inter, sans-serif" }} aria-hidden="true">{initials(u.name)}</span>
          <div className="grow">
            <h1 className="display" style={{ fontSize: 24 }}>{u.name}</h1>
            <div className="small" style={{ color: '#D5E0DA' }}>@{u.handle} · {u.city}</div>
            {u.verifiedRigger && <div className="row gap-4 small bold mt-8" style={{ color: 'var(--lime)' }}><Icon name="shield" size={16} /> Verified rigger</div>}
          </div>
        </div>
        {u.bio && <p className="mt-12" style={{ fontSize: 15, lineHeight: 1.45, color: '#E6EEEA' }}>{u.bio}</p>}
        {live && (
          <button type="button" className="row gap-8 small bold mt-12" style={{ border: 0, background: 'rgba(200,241,105,.15)', color: 'var(--lime)', borderRadius: 12, padding: '8px 12px' }} onClick={() => push({ name: 'spot', spotId: live.spotId })}>
            <span className="pulse" /> On a line at {state.spots[live.spotId].name}
          </button>
        )}
        <div className="row gap-20 mt-16 small" style={{ color: '#D5E0DA' }}>
          <span><b style={{ color: '#fff', fontSize: 16 }}>{followers(state, id).length}</b> followers</span>
          <span><b style={{ color: '#fff', fontSize: 16 }}>{following(state, id).length}</b> following</span>
          {home && <span>Home: <b style={{ color: '#fff' }}>{home.name}</b></span>}
        </div>
        <div className="grid-2 mt-16">
          {isMe ? (
            <>
              <button type="button" className="btn lime" onClick={() => push({ name: 'editProfile' })}>Edit profile</button>
              <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid #5B7A70' }} onClick={() => toast('Profile link copied (demo)')}>Share</button>
            </>
          ) : (
            <>
              <button type="button" className={'btn ' + (followingThem ? '' : 'lime')} style={followingThem ? { background: 'transparent', border: '1px solid #5B7A70' } : undefined} onClick={() => dispatch({ type: 'TOGGLE_FOLLOW', userId: id })} aria-pressed={followingThem}>
                {followingThem ? 'Following ✓' : 'Follow'}
              </button>
              <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid #5B7A70' }} onClick={() => toast('Direct messages are coming after the MVP')}>Message</button>
            </>
          )}
        </div>
      </section>

      <section aria-label="Stats" className="grid-2 pad mt-16">
        <div className="stat"><div className="k">Sessions this year</div><div className="v">{stats.sessionsThisYear}</div></div>
        <div className="stat"><div className="k">Longest walked</div><div className="v">{stats.longest ? fmtM(stats.longest) : '—'}</div></div>
        <div className="stat"><div className="k">Highest line</div><div className="v">{stats.highest ? fmtM(stats.highest) : '—'}</div></div>
        <div className="stat"><div className="k">Day streak</div><div className="v">{stats.streak}</div></div>
      </section>

      <div role="tablist" aria-label="Profile sections" className="tabs mt-20" style={{ gridTemplateColumns: `repeat(${isMe ? 3 : 2}, 1fr)` }}>
        <button role="tab" aria-selected={tab === 'logbook'} onClick={() => setTab('logbook')}>Logbook</button>
        <button role="tab" aria-selected={tab === 'posts'} onClick={() => setTab('posts')}>Posts</button>
        {isMe && <button role="tab" aria-selected={tab === 'gear'} onClick={() => setTab('gear')}>Gear{gearAlerts ? ` · ${gearAlerts}⚠` : ''}</button>}
      </div>

      <div className="pad mt-12 stack gap-10">
        {tab === 'logbook' && (
          sessions.length ? (
            <div className="card">
              {sessions.map((s) => (
                <div key={s.id} className="list-row">
                  <div className="logo-sq">{Math.round(s.length)}m</div>
                  <div className="grow">
                    <div className="bold ellipsis">{state.spots[s.spotId]?.name ?? 'Unknown spot'}</div>
                    <div className="small muted ellipsis">{lineLabel(s.type)} · {timeAgo(s.createdAt, now)}{s.notes ? ` · ${s.notes}` : ''}</div>
                  </div>
                  <div className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
                    <span className="xs bold" style={{ color: 'var(--forest)' }}>{outcomeLabel(s.outcome)}</span>
                    {isMe && s.visibility === 'private' && <span className="xs muted row gap-4"><Icon name="lock" size={12} /> Private</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty>{isMe ? 'No sessions yet. Tap Log to add your first.' : 'No public sessions yet.'}</Empty>
        )}

        {tab === 'posts' && (
          posts.length ? posts.map((p) => {
            const s = p.sessionId ? state.sessions[p.sessionId] : undefined;
            const m = p.meetupId ? state.meetups[p.meetupId] : undefined;
            return (
              <button key={p.id} type="button" className="card card-btn list-row" onClick={() => push({ name: 'post', postId: p.id })}>
                <div className="logo-sq"><Icon name={m ? 'calendar' : s ? 'bolt' : 'chat'} size={20} /></div>
                <div className="grow">
                  <div className="bold ellipsis">{s ? `${fmtM(s.length)} ${lineLabel(s.type).toLowerCase()} · ${outcomeLabel(s.outcome)}` : m ? m.title : p.text}</div>
                  <div className="small muted">{timeAgo(p.createdAt, now)} · {(state.stokes[p.id] ?? []).length} stoked</div>
                </div>
              </button>
            );
          }) : <Empty>No posts yet.</Empty>
        )}

        {tab === 'gear' && isMe && (
          <>
            <button type="button" className="btn block ghost" onClick={() => push({ name: 'addGear' })}><Icon name="plus" size={20} /> Add gear</button>
            {gear.map((g) => {
              const st = gearStatus(g.retireOn, now);
              return (
                <div key={g.id} className="card pad-14 row gap-12">
                  <div className="logo-sq">{gearKindLabel(g.kind)[0]}</div>
                  <div className="grow">
                    <div className="bold">{g.name}</div>
                    <div className="small muted">{gearKindLabel(g.kind)}{g.length ? ` · ${g.length} m` : ''} · retire {dateLabel(g.retireOn)}</div>
                    {g.notes && <div className="xs muted mt-8">{g.notes}</div>}
                  </div>
                  <div className="stack gap-6" style={{ alignItems: 'flex-end' }}>
                    <span className={'badge ' + (st === 'retire' ? 'red' : st === 'soon' ? 'amber' : 'soft')}>{st === 'retire' ? 'Retire now' : st === 'soon' ? 'Retire soon' : 'Good'}</span>
                    <button type="button" className="icon-btn" aria-label={`Remove ${g.name}`} onClick={() => { dispatch({ type: 'REMOVE_GEAR', gearId: g.id }); toast('Gear removed'); }}><Icon name="trash" size={18} /></button>
                  </div>
                </div>
              );
            })}
            {gear.length === 0 && <Empty>Track your webbing, pulleys and slings — we'll remind you when it's time to retire them.</Empty>}
          </>
        )}
      </div>
    </>
  );
}

export function EditProfileScreen() {
  const { state, dispatch, toast } = useStore();
  const { back } = useRouter();
  const me = state.users[state.meId];
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState(me.bio);
  const [city, setCity] = useState(me.city);
  return (
    <>
      <TopBar title="Edit profile" />
      <form className="pad stack gap-20" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'UPDATE_PROFILE', name, bio, city }); toast('Profile saved'); back(); }}>
        <label className="field">Name<input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="field">Bio<textarea className="textarea" value={bio} maxLength={200} onChange={(e) => setBio(e.target.value)} /></label>
        <fieldset>
          <legend>City</legend>
          <Segmented label="City" options={[{ id: 'Johannesburg', label: 'Johannesburg' }, { id: 'Cape Town', label: 'Cape Town' }]} value={city} onChange={setCity} />
        </fieldset>
        <button className="btn block" disabled={!name.trim()}>Save</button>
      </form>
    </>
  );
}

export function AddGearScreen() {
  const { now, dispatch, toast } = useStore();
  const { back } = useRouter();
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const [kind, setKind] = useState<GearKind>('webbing');
  const [name, setName] = useState('');
  const [length, setLength] = useState('');
  const [bought, setBought] = useState(iso(now));
  const [retire, setRetire] = useState(iso(now + 3 * 365 * 86400_000));
  const [notes, setNotes] = useState('');
  return (
    <>
      <TopBar title="Add gear" />
      <form
        className="pad stack gap-20"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'ADD_GEAR', kind, name, length: length ? Number(length) : undefined, boughtOn: new Date(bought).getTime(), retireOn: new Date(retire).getTime(), notes });
          toast('Added to your gear locker');
          back();
        }}
      >
        <fieldset>
          <legend>Type</legend>
          <div className="row gap-8 wrap">
            {GEAR_KINDS.map((k) => <button key={k.id} type="button" className="chip" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>)}
          </div>
        </fieldset>
        <label className="field">Name<input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Brand and model" required /></label>
        {kind === 'webbing' && <label className="field">Length (m)<input className="input" type="number" min="1" value={length} onChange={(e) => setLength(e.target.value)} /></label>}
        <div className="grid-2">
          <label className="field">Bought<input className="input" type="date" value={bought} onChange={(e) => setBought(e.target.value)} /></label>
          <label className="field">Retire by<input className="input" type="date" value={retire} onChange={(e) => setRetire(e.target.value)} /></label>
        </div>
        <p className="small muted" style={{ marginTop: -10 }}>Check the manufacturer's guidance for retirement. UV exposure and heavy use shorten webbing life.</p>
        <label className="field">Notes<textarea className="textarea" value={notes} maxLength={200} onChange={(e) => setNotes(e.target.value)} /></label>
        <button className="btn block" disabled={!name.trim()}>Add gear</button>
      </form>
    </>
  );
}
