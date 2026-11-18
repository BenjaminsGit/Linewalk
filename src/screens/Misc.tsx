import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { followers, isFollowing } from '../store/selectors';
import { Avatar, Empty, Modal, TopBar, UserName } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { CITIES, timeAgo } from '../lib/format';

export function NotificationsScreen() {
  const { state, now, dispatch } = useStore();
  const { push } = useRouter();
  const list = [...state.notifications].sort((a, b) => b.createdAt - a.createdAt);
  // Snapshot unread ids so they stay highlighted while this screen is open.
  const [unread] = useState(() => new Set(state.notifications.filter((n) => !n.read).map((n) => n.id)));
  useEffect(() => { dispatch({ type: 'MARK_NOTIFICATIONS_READ' }); }, [dispatch]);

  const icon: Record<string, IconName> = { stoke: 'bolt', comment: 'chat', follow: 'user', meetup: 'calendar', checkin: 'pin' };

  return (
    <>
      <TopBar title="Notifications" />
      <div className="pad">
        <div className="card">
          {list.map((n) => (
            <button
              key={n.id}
              type="button"
              className="list-row card-btn"
              style={{ border: 0, background: unread.has(n.id) ? 'var(--lime-soft)' : 'none', borderRadius: 0 }}
              onClick={() => {
                if (n.kind === 'stoke' || n.kind === 'comment') push({ name: 'post', postId: n.targetId! });
                else if (n.kind === 'meetup') push({ name: 'meetup', meetupId: n.targetId! });
                else if (n.kind === 'checkin') push({ name: 'spot', spotId: n.targetId! });
                else push({ name: 'profile', userId: n.actorId });
              }}
            >
              <div style={{ position: 'relative' }}>
                <Avatar userId={n.actorId} size={40} />
                <span style={{ position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, background: 'var(--forest)', color: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon[n.kind]} size={12} />
                </span>
              </div>
              <div className="grow small">
                <b>{state.users[n.actorId]?.name}</b> {n.text}
                <div className="xs muted">{timeAgo(n.createdAt, now)}</div>
              </div>
            </button>
          ))}
          {list.length === 0 && <Empty>All caught up.</Empty>}
        </div>
      </div>
    </>
  );
}

export function PeopleScreen() {
  const { state, dispatch } = useStore();
  const { push } = useRouter();
  const [q, setQ] = useState('');
  const people = Object.values(state.users)
    .filter((u) => u.id !== state.meId)
    .filter((u) => !q || (u.name + u.handle + u.city).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.city === state.users[state.meId].city) - Number(a.city === state.users[state.meId].city));
  return (
    <>
      <TopBar title="Find people" />
      <div className="pad stack gap-12">
        <label>
          <span className="sr-only">Search people</span>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, handle or city" autoFocus />
        </label>
        <div className="card">
          {people.map((u) => {
            const f = isFollowing(state, u.id);
            return (
              <div key={u.id} className="list-row">
                <Avatar userId={u.id} size={42} onClick={() => push({ name: 'profile', userId: u.id })} />
                <div className="grow">
                  <UserName userId={u.id} onClick={() => push({ name: 'profile', userId: u.id })} />
                  <div className="small muted ellipsis">@{u.handle} · {u.city} · {followers(state, u.id).length} followers</div>
                </div>
                <button type="button" className={'btn sm ' + (f ? 'ghost' : '')} aria-pressed={f} onClick={() => dispatch({ type: 'TOGGLE_FOLLOW', userId: u.id })}>
                  {f ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
          {people.length === 0 && <Empty>No one matches “{q}”.</Empty>}
        </div>
      </div>
    </>
  );
}

export function SettingsScreen() {
  const { state, dispatch, toast } = useStore();
  const { push, switchTab } = useRouter();
  const me = state.users[state.meId];
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <TopBar title="Settings" />
      <div className="pad stack gap-16">
        <section className="card pad-14 stack gap-12" aria-label="Rigger verification">
          <div className="row gap-8 bold"><Icon name="shield" /> Rigger verification</div>
          {me.verifiedRigger ? (
            <p className="small">You're a verified rigger. You can see and add rigging info on mid- and highline spots.</p>
          ) : state.riggerRequestPending ? (
            <>
              <p className="small">Request received. In the real app, two verified riggers from your scene vouch for you, and a moderator approves the request.</p>
              <button type="button" className="btn sm lime" onClick={() => { dispatch({ type: 'DEMO_APPROVE_RIGGER' }); toast("Verified! Rigging info is now unlocked"); }}>
                Demo: approve me now
              </button>
            </>
          ) : (
            <>
              <p className="small">Verified riggers can see anchor details for mid- and highlines. You'll need two verified riggers to vouch for you.</p>
              <button type="button" className="btn sm" onClick={() => { dispatch({ type: 'REQUEST_RIGGER' }); toast('Verification requested'); }}>Request verification</button>
            </>
          )}
        </section>

        <section className="card">
          <button type="button" className="list-row card-btn" style={{ border: 0, background: 'none' }} onClick={() => push({ name: 'editProfile' })}>
            <Icon name="user" /> <span className="grow bold">Edit profile</span>
          </button>
          <button type="button" className="list-row card-btn" style={{ border: 0, background: 'none' }} onClick={() => push({ name: 'people' })}>
            <Icon name="people" /> <span className="grow bold">Find people</span>
          </button>
          <button type="button" className="list-row card-btn" style={{ border: 0, background: 'none' }} onClick={() => push({ name: 'plan' })}>
            <Icon name="doc" /> <span className="grow bold">About this demo & build plan</span>
          </button>
        </section>

        <section className="card pad-14 stack gap-8">
          <div className="bold">Demo data</div>
          <p className="small muted">Everything you do is saved in this browser only. Reports filed: {state.reports.length}.</p>
          <button type="button" className="btn danger sm" onClick={() => setConfirmReset(true)}><Icon name="refresh" size={18} /> Reset demo data</button>
        </section>
      </div>

      {confirmReset && (
        <Modal title="Reset the demo?" onClose={() => setConfirmReset(false)}>
          <p className="muted">This clears your sessions, posts, spots, gear and follows, and restores the starting data.</p>
          <div className="grid-2 mt-16">
            <button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button type="button" className="btn" onClick={() => { dispatch({ type: 'RESET' }); setConfirmReset(false); switchTab('feed'); toast('Demo reset'); }}>Reset</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function PlanScreen() {
  return (
    <>
      <TopBar title="About this demo" />
      <div className="pad stack gap-16 plan">
        <div className="card pad-14">
          <h2 className="display">Linewalk</h2>
          <p className="mt-8" style={{ lineHeight: 1.5 }}>A social app for slackliners: find lines, log sessions, share sends and meet people to walk with. This is a front-end demo running on seeded Johannesburg and Cape Town data. The full plan is in <code>docs/PLAN.md</code> in the repo.</p>
        </div>
        <div className="card pad-14">
          <h3>What works in this demo</h3>
          <ul>
            <li>Feed with Following / Nearby / Meetups, stokes, comments and text posts</li>
            <li>Live check-ins and the “on a line now” strip</li>
            <li>Spot map with filters, spot detail, reviews, and adding spots</li>
            <li>Session logging with photo, private or shared</li>
            <li>Meetups: browse, RSVP, host</li>
            <li>Profiles with stats from your logbook, follows, and a gear locker</li>
            <li>Safety: verified-rigger gate on rigging info, and reporting</li>
          </ul>
        </div>
        <div className="card pad-14 stack gap-12">
          <h3>Build plan</h3>
          {[
            ['0 · Demo & validation', 'Wk 1–2', 'This demo, interviews at local spots, waitlist'],
            ['1 · Foundations', 'Wk 3–5', 'Expo app, Supabase schema + RLS, auth, profiles'],
            ['2 · Spots & sessions', 'Wk 6–8', 'MapLibre map, spot CRUD, logging, feed v1'],
            ['3 · Live & meetups', 'Wk 9–11', 'Realtime check-ins, RSVPs, push notifications'],
            ['4 · Safety & trust', 'Wk 12–13', 'Rigger verification, moderation, gear reminders'],
            ['5 · Public launch (SA)', 'Wk 14–16', 'Video clips, store listings, launch jam'],
          ].map(([t, w, d]) => (
            <div key={t} className="phase">
              <div className="row between"><b>{t}</b><span className="xs muted">{w}</span></div>
              <div className="small muted">{d}</div>
            </div>
          ))}
        </div>
        <div className="card pad-14">
          <h3>Production stack</h3>
          <ul>
            <li>Expo (React Native) + TypeScript</li>
            <li>Supabase: Postgres + PostGIS, Auth, Storage, Realtime</li>
            <li>MapLibre + vector tiles; Mux for video</li>
            <li>PostHog analytics, Sentry errors, GitHub Actions + EAS</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export function Onboarding() {
  const { state, dispatch } = useStore();
  const [name, setName] = useState('');
  const [city, setCity] = useState(state.users[state.meId].city);
  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label="Welcome to Linewalk">
      <div className="grow stack" style={{ justifyContent: 'center', gap: 20 }}>
        <svg aria-hidden="true" width="100%" height="90" viewBox="0 0 320 90">
          <path d="M10 30 Q160 70 310 30" stroke="#C8F169" strokeWidth="3" fill="none" />
          <rect x="4" y="22" width="8" height="68" fill="#24493E" />
          <rect x="308" y="22" width="8" height="68" fill="#24493E" />
          <g stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none">
            <circle cx="150" cy="22" r="5" fill="#fff" stroke="none" />
            <path d="M150 27 L150 40 M150 31 L136 24 M150 31 L164 24 M150 40 L145 50 M150 40 L156 49" />
          </g>
        </svg>
        <div>
          <div className="display" style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>linewalk</div>
          <p style={{ fontSize: 18, lineHeight: 1.45, color: '#D5E0DA', marginTop: 8 }}>Find lines. Log sessions. Meet your crew.</p>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#E6EEEA', lineHeight: 1.7 }}>
          <li>See who's on a line right now</li>
          <li>Map of parklines, longlines and highlines</li>
          <li>Your logbook, stats and gear in one place</li>
        </ul>
        <form className="stack gap-12" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'ONBOARD', name, city }); }}>
          <label className="field" style={{ color: '#fff' }}>Your name
            <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Ben S." />
          </label>
          <label className="field" style={{ color: '#fff' }}>Your city
            <select className="select" value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <button className="btn lime block" style={{ height: 52, marginTop: 8 }}>Start walking</button>
          <p className="xs" style={{ color: '#A9BDB4', textAlign: 'center' }}>Demo app · data stays in your browser</p>
        </form>
      </div>
    </div>
  );
}
