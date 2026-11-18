import { useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { canSeeRigging, liveCheckIns, myCheckIn, spotSessions, upcomingMeetups } from '../store/selectors';
import { Avatar, Empty, Modal, ReportDialog, Stars, TopBar, UserName } from '../components/ui';
import { Icon } from '../components/Icon';
import { SpotSummary } from './Spots';
import { fmtM, outcomeLabel, timeAgo, whenLabel } from '../lib/format';
import type { ID } from '../store/types';

export function SpotDetailScreen({ spotId }: { spotId: ID }) {
  const { state, now, dispatch, toast } = useStore();
  const { push } = useRouter();
  const [reviewing, setReviewing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const spot = state.spots[spotId];
  if (!spot) return <><TopBar title="Spot" /><Empty>Spot not found.</Empty></>;

  const here = liveCheckIns(state, now).filter((c) => c.spotId === spotId);
  const mine = myCheckIn(state, now);
  const reviews = state.reviews.filter((r) => r.spotId === spotId).sort((a, b) => b.createdAt - a.createdAt);
  const sessions = spotSessions(state, spotId).slice(0, 5);
  const meetups = upcomingMeetups(state, now).filter((m) => m.spotId === spotId);
  const gated = Boolean(spot.riggingInfo) || spot.type === 'high';
  const canSee = canSeeRigging(state);

  return (
    <>
      <TopBar
        title={spot.name}
        right={<button type="button" className="icon-btn" aria-label="Report this spot" onClick={() => setReporting(true)}><Icon name="flag" /></button>}
      />
      <div className="pad stack gap-16">
        <div className="card pad-14">
          <SpotSummary spot={spot} />
          <p className="mt-12" style={{ fontSize: 15, lineHeight: 1.45 }}>{spot.accessNote}</p>
          <div className="small muted mt-8">Added by {state.users[spot.createdBy]?.name ?? 'someone'} · {timeAgo(spot.createdAt, now)}</div>
          <div className="grid-2 mt-12">
            {mine?.spotId === spotId ? (
              <button type="button" className="btn lime" onClick={() => { dispatch({ type: 'CHECK_OUT' }); toast('Checked out'); }}>Check out</button>
            ) : (
              <button type="button" className="btn lime" onClick={() => { dispatch({ type: 'CHECK_IN', spotId }); toast(`Checked in at ${spot.name}`); }}>Check in</button>
            )}
            <button type="button" className="btn ghost" onClick={() => push({ name: 'log', spotId })}>Log session</button>
          </div>
        </div>

        {spot.type === 'high' && (
          <div className="notice">
            <b>Highline safety:</b> only rig with experienced, verified riggers. Inspect every anchor yourself — never trust beta alone.
          </div>
        )}

        {gated && (
          <section className="card pad-14" aria-label="Rigging info">
            <div className="row gap-8 bold"><Icon name={canSee ? 'shield' : 'lock'} size={20} /> Rigging info</div>
            {canSee ? (
              <p className="mt-8" style={{ fontSize: 15, lineHeight: 1.45 }}>{spot.riggingInfo ?? 'No rigging info added yet.'}</p>
            ) : (
              <div className="lock mt-12">
                <p className="small" style={{ lineHeight: 1.45 }}>Anchor details for midlines and highlines are visible to <b>verified riggers</b> only. This protects access and keeps safety-critical beta accurate.</p>
                {state.riggerRequestPending ? (
                  <p className="small bold mt-8">Verification requested — we'll let you know.</p>
                ) : (
                  <button type="button" className="btn sm mt-12" onClick={() => push({ name: 'settings' })}>Get verified</button>
                )}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="section-title" style={{ margin: '0 0 10px' }}>On a line now · {here.length}</h2>
          {here.length ? (
            <div className="row gap-12 wrap">
              {here.map((c) => (
                <button key={c.userId} type="button" className="stack center gap-4" style={{ border: 0, background: 'none', width: 64 }} onClick={() => push({ name: 'profile', userId: c.userId })}>
                  <Avatar userId={c.userId} size={48} live />
                  <span className="xs bold">{c.userId === state.meId ? 'You' : state.users[c.userId].name.split(' ')[0]}</span>
                  <span className="xs muted">{timeAgo(c.startedAt, now).replace(' ago', '')}</span>
                </button>
              ))}
            </div>
          ) : <p className="small muted">Nobody checked in right now.</p>}
        </section>

        {meetups.length > 0 && (
          <section>
            <h2 className="section-title" style={{ margin: '0 0 10px' }}>Upcoming meetups</h2>
            <div className="stack gap-8">
              {meetups.map((m) => (
                <button key={m.id} type="button" className="card card-btn list-row" onClick={() => push({ name: 'meetup', meetupId: m.id })}>
                  <div className="logo-sq"><Icon name="calendar" size={20} /></div>
                  <div className="grow"><div className="bold">{m.title}</div><div className="small muted">{whenLabel(m.startsAt, now)}</div></div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="row between" style={{ marginBottom: 10 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Reviews · {reviews.length}</h2>
            <button type="button" className="btn sm ghost" onClick={() => setReviewing(true)}>Write a review</button>
          </div>
          <div className="stack gap-8">
            {reviews.map((r) => (
              <div key={r.id} className="card pad-14 stack gap-6">
                <div className="row gap-8">
                  <Avatar userId={r.userId} size={32} />
                  <div className="grow"><UserName userId={r.userId} /><div className="xs muted">{timeAgo(r.createdAt, now)}</div></div>
                  <Stars value={r.rating} size={14} />
                </div>
                {r.text && <p style={{ fontSize: 15, lineHeight: 1.4 }}>{r.text}</p>}
                {r.hazards.length > 0 && <div className="row gap-6 wrap">{r.hazards.map((h) => <span key={h} className="badge amber">{h}</span>)}</div>}
              </div>
            ))}
            {reviews.length === 0 && <p className="small muted">No reviews yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="section-title" style={{ margin: '0 0 10px' }}>Recent sessions</h2>
          <div className="card">
            {sessions.map((s) => (
              <div key={s.id} className="list-row">
                <Avatar userId={s.userId} size={36} />
                <div className="grow"><div className="bold">{state.users[s.userId].name}</div><div className="small muted">{fmtM(s.length)} · {timeAgo(s.createdAt, now)}</div></div>
                <span className="badge soft">{outcomeLabel(s.outcome)}</span>
              </div>
            ))}
            {sessions.length === 0 && <p className="small muted list-row">No public sessions yet.</p>}
          </div>
        </section>
      </div>

      {reviewing && <ReviewDialog spotId={spotId} onClose={() => setReviewing(false)} />}
      {reporting && <ReportDialog targetType="spot" targetId={spotId} onClose={() => setReporting(false)} />}
    </>
  );
}

const HAZARDS = ['Wind', 'Crowds', 'Dogs', 'Exposure', 'Remote', 'Loose rock', 'Access issues'];

function ReviewDialog({ spotId, onClose }: { spotId: ID; onClose: () => void }) {
  const { dispatch, toast } = useStore();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [hazards, setHazards] = useState<string[]>([]);
  return (
    <Modal title="Review this spot" onClose={onClose}>
      <form className="stack gap-16" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'ADD_REVIEW', spotId, rating, text, hazards }); toast('Review posted'); onClose(); }}>
        <fieldset>
          <legend>Rating</legend>
          <div className="row" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} className="star-btn" onClick={() => setRating(i)} style={{ color: i <= rating ? '#B7791F' : '#C9D2CD' }}>
                <Icon name="star" size={30} fill="currentColor" strokeWidth={1.5} />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">What should others know?
          <textarea className="textarea" value={text} maxLength={400} onChange={(e) => setText(e.target.value)} placeholder="Best time to go, anchor condition, parking…" />
        </label>
        <fieldset>
          <legend>Hazards</legend>
          <div className="row gap-8 wrap">
            {HAZARDS.map((h) => (
              <button key={h} type="button" className="chip lime" aria-pressed={hazards.includes(h)} onClick={() => setHazards((x) => (x.includes(h) ? x.filter((y) => y !== h) : [...x, h]))}>{h}</button>
            ))}
          </div>
        </fieldset>
        <button className="btn block" disabled={!rating}>Post review</button>
      </form>
    </Modal>
  );
}
