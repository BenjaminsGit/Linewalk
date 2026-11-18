import { useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { feed, liveCheckIns, myCheckIn, unreadCount, upcomingMeetups } from '../store/selectors';
import { PostCard } from '../components/PostCard';
import { Avatar, Empty, IconButton, Modal } from '../components/ui';
import { Icon } from '../components/Icon';
import { levelLabel, whenLabel } from '../lib/format';

type FeedTab = 'following' | 'nearby' | 'meetups';

export function FeedScreen() {
  const { state } = useStore();
  const { push } = useRouter();
  const [tab, setTab] = useState<FeedTab>('following');
  const [composing, setComposing] = useState(false);
  const me = state.users[state.meId];

  const unread = unreadCount(state);

  return (
    <>
      <header className="topbar">
        <div className="brand">line<span>walk</span></div>
        <IconButton icon="search" label="Find people" onClick={() => push({ name: 'people' })} />
        <IconButton icon="bell" label="Notifications" badge={unread} onClick={() => push({ name: 'notifications' })} />
      </header>

      <div className="chips" role="group" aria-label="Feed">
        {(['following', 'nearby', 'meetups'] as const).map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t === 'following' ? 'Following' : t === 'nearby' ? `Nearby · ${me.city === 'Johannesburg' ? 'Joburg' : me.city}` : 'Meetups'}
          </button>
        ))}
      </div>

      <div className="stack gap-12 pad mt-12">
        {tab !== 'meetups' && <LiveStrip />}

        {tab === 'meetups' ? (
          <MeetupList />
        ) : (
          <>
            <button type="button" className="card card-btn row gap-10" style={{ padding: 12 }} onClick={() => setComposing(true)}>
              <Avatar userId={state.meId} size={36} />
              <span className="muted grow">Ask the crew or share something…</span>
              <Icon name="send" size={20} />
            </button>
            {feed(state, tab).map((p) => <PostCard key={p.id} post={p} />)}
            {feed(state, tab).length === 0 && <Empty>Nothing here yet. Follow a few people or log a session to get things going.</Empty>}
          </>
        )}
      </div>
      {composing && <Composer onClose={() => setComposing(false)} />}
    </>
  );
}

function LiveStrip() {
  const { state, now, dispatch, toast } = useStore();
  const { push } = useRouter();
  const myCity = state.users[state.meId].city;
  const follows = new Set(state.follows[state.meId] ?? []);
  const live = liveCheckIns(state, now).filter((c) => {
    if (c.userId === state.meId) return true;
    const spot = state.spots[c.spotId];
    return follows.has(c.userId) || (spot && spot.area === myCity);
  });
  const mine = myCheckIn(state, now);

  return (
    <section className="live-strip" aria-label="On a line right now">
      <div className="row between">
        <div className="row gap-8 bold small"><span className="pulse" /> On a line right now · {live.length}</div>
        {mine ? (
          <button type="button" className="btn lime sm" style={{ height: 36 }} onClick={() => { dispatch({ type: 'CHECK_OUT' }); toast('Checked out — nice session!'); }}>Check out</button>
        ) : (
          <button type="button" className="btn lime sm" style={{ height: 36 }} onClick={() => push({ name: 'spots' })}>Check in</button>
        )}
      </div>
      {live.length === 0 ? (
        <p className="small" style={{ color: '#D5E0DA', marginTop: 10 }}>Nobody's out yet. Be the first to check in.</p>
      ) : (
        <div className="people">
          {live.map((c) => {
            const u = state.users[c.userId];
            const spot = state.spots[c.spotId];
            return (
              <button key={c.userId} type="button" className="person" onClick={() => push({ name: 'spot', spotId: c.spotId })} aria-label={`${u.name} at ${spot.name}`}>
                <Avatar userId={c.userId} size={50} live />
                <span className="xs bold">{c.userId === state.meId ? 'You' : u.name.split(' ')[0]}</span>
                <span className="where ellipsis">{spot.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MeetupList() {
  const { state, now } = useStore();
  const { push } = useRouter();
  const myCity = state.users[state.meId].city;
  const list = upcomingMeetups(state, now);
  const local = list.filter((m) => state.spots[m.spotId].area === myCity || (myCity === 'Johannesburg' && state.spots[m.spotId].area === 'Magaliesberg'));
  const elsewhere = list.filter((m) => !local.includes(m));

  const Item = ({ id }: { id: string }) => {
    const m = state.meetups[id];
    const spot = state.spots[m.spotId];
    const going = state.rsvps[m.id] ?? [];
    const amGoing = going.includes(state.meId);
    return (
      <button type="button" className="card card-btn pad-14 stack gap-10" onClick={() => push({ name: 'meetup', meetupId: m.id })}>
        <div className="row gap-12">
          <div className="logo-sq" style={{ background: 'var(--forest)', color: 'var(--lime)' }}><Icon name="calendar" size={20} /></div>
          <div className="grow">
            <div className="xs muted bold" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{whenLabel(m.startsAt, now)}</div>
            <div className="bold" style={{ fontSize: 16 }}>{m.title}</div>
          </div>
          {amGoing && <span className="badge">Going</span>}
        </div>
        <div className="small muted">{spot.name} · {levelLabel(m.level)}{m.gearProvided ? ' · gear provided' : ''}</div>
        <div className="row gap-6">
          <div className="row" style={{ marginRight: 4 }}>
            {going.slice(0, 5).map((u, i) => <span key={u} style={{ marginLeft: i ? -8 : 0 }}><Avatar userId={u} size={26} /></span>)}
          </div>
          <span className="small"><b>{going.length}</b> going · {m.capacity - going.length} spots left</span>
        </div>
      </button>
    );
  };

  return (
    <>
      <button type="button" className="btn block" onClick={() => push({ name: 'createMeetup' })}>
        <Icon name="plus" size={20} /> Host a meetup
      </button>
      {local.map((m) => <Item key={m.id} id={m.id} />)}
      {local.length === 0 && <Empty>No meetups near you yet — host the first one.</Empty>}
      {elsewhere.length > 0 && (
        <>
          <div className="section-title" style={{ margin: '12px 0 0' }}>Other cities</div>
          {elsewhere.map((m) => <Item key={m.id} id={m.id} />)}
        </>
      )}
    </>
  );
}

function Composer({ onClose }: { onClose: () => void }) {
  const { dispatch, toast } = useStore();
  const [text, setText] = useState('');
  const [tag, setTag] = useState<string | undefined>();
  const tags = ['Gear question', 'Looking for partners', 'Safety', 'Spot beta'];
  return (
    <Modal title="New post" onClose={onClose}>
      <form
        className="stack gap-12"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'ADD_TEXT_POST', text, tag });
          toast('Posted');
          onClose();
        }}
      >
        <label className="field">
          <span className="sr-only">What's on your mind?</span>
          <textarea className="textarea" autoFocus maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Anyone rigging at Emmarentia tomorrow?" />
        </label>
        <div className="row gap-8 wrap" role="group" aria-label="Topic">
          {tags.map((t) => (
            <button key={t} type="button" className="chip lime" aria-pressed={tag === t} onClick={() => setTag(tag === t ? undefined : t)}>{t}</button>
          ))}
        </div>
        <button className="btn block" disabled={!text.trim()}>Post</button>
      </form>
    </Modal>
  );
}
