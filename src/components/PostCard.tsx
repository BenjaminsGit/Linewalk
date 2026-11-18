import { useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import type { Post } from '../store/types';
import { Avatar, ReportDialog, UserName } from './ui';
import { Icon } from './Icon';
import { LineArt } from './LineArt';
import { anchorLabel, fmtM, levelLabel, lineLabel, outcomeLabel, timeAgo, whenLabel } from '../lib/format';

export function PostCard({ post, full = false }: { post: Post; full?: boolean }) {
  const { state, dispatch, now, toast } = useStore();
  const { push } = useRouter();
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);

  const author = state.users[post.authorId];
  const stokes = state.stokes[post.id] ?? [];
  const stoked = stokes.includes(state.meId);
  const commentCount = state.comments.filter((c) => c.postId === post.id).length;
  const session = post.sessionId ? state.sessions[post.sessionId] : undefined;
  const meetup = post.meetupId ? state.meetups[post.meetupId] : undefined;
  const spot = session ? state.spots[session.spotId] : meetup ? state.spots[meetup.spotId] : undefined;
  const mine = post.authorId === state.meId;
  const openProfile = () => push({ name: 'profile', userId: post.authorId });
  const openPost = () => push({ name: 'post', postId: post.id });

  if (!author) return null;

  let subtitle = timeAgo(post.createdAt, now);
  if (spot) subtitle = `${spot.name} · ${subtitle}`;
  else if (post.tag) subtitle = `${post.tag} · ${subtitle}`;

  return (
    <article className="card" style={{ overflow: 'hidden' }}>
      <div className="post-head">
        <Avatar userId={author.id} onClick={openProfile} />
        <div className="grow">
          <UserName userId={author.id} onClick={openProfile} />
          <div className="small muted ellipsis">{subtitle}</div>
        </div>
        {session && (
          <span className={'badge' + (session.outcome === 'practice' ? ' gray' : session.outcome === 'walked' ? ' soft' : '')}>
            {outcomeLabel(session.outcome)}
          </span>
        )}
        {meetup && <span className="badge dark">Meetup</span>}
        <button type="button" className="icon-btn" aria-label="More options" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <Icon name="more" size={20} />
        </button>
      </div>

      {menu && (
        <div className="pad" style={{ paddingBottom: 10 }}>
          <div className="row gap-8 wrap">
            {mine ? (
              <button type="button" className="btn danger sm" onClick={() => { dispatch({ type: 'DELETE_POST', postId: post.id }); toast(session ? 'Post removed — session kept in your logbook' : 'Post deleted'); }}>
                <Icon name="trash" size={18} /> Delete post
              </button>
            ) : (
              <button type="button" className="btn ghost sm" onClick={() => { setReporting(true); setMenu(false); }}>
                <Icon name="flag" size={18} /> Report
              </button>
            )}
            {spot && <button type="button" className="btn ghost sm" onClick={() => push({ name: 'spot', spotId: spot.id })}>View spot</button>}
          </div>
        </div>
      )}

      {session && (
        <>
          <button type="button" onClick={openPost} style={{ border: 0, padding: 0, display: 'block', width: '100%', background: 'none' }} aria-label="Open post">
            <div className="media">
              {session.photo ? (
                <img src={session.photo} alt={`Photo from ${author.name}'s session`} />
              ) : (
                <LineArt type={session.type} seed={session.id} label={`${lineLabel(session.type)} illustration`} />
              )}
              <span className="badge dark tag">{lineLabel(session.type)}</span>
            </div>
          </button>
          <div className="grid-3" style={{ padding: '12px 14px' }}>
            <div><div className="xs muted">Length</div><div className="display bold" style={{ fontSize: 18 }}>{fmtM(session.length)}</div></div>
            <div><div className="xs muted">Height</div><div className="display bold" style={{ fontSize: 18 }}>{fmtM(session.height)}</div></div>
            <div><div className="xs muted">Anchors</div><div className="display bold ellipsis" style={{ fontSize: 18 }}>{spot ? anchorLabel(spot.anchors) : '—'}</div></div>
          </div>
          {session.notes && <p className="post-body">{session.notes}</p>}
        </>
      )}

      {meetup && spot && (
        <button type="button" className="card-btn" onClick={() => push({ name: 'meetup', meetupId: meetup.id })} style={{ border: 0, background: 'none', padding: '0 14px 12px' }}>
          <div className="row gap-12">
            <div className="logo-sq" style={{ background: 'var(--forest)', color: 'var(--lime)' }}><Icon name="calendar" size={20} /></div>
            <div className="grow">
              <div className="xs muted bold" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{whenLabel(meetup.startsAt, now)}</div>
              <div className="bold" style={{ fontSize: 16 }}>{meetup.title}</div>
              <div className="small muted">{spot.name} · {levelLabel(meetup.level)} · {(state.rsvps[meetup.id] ?? []).length} going</div>
            </div>
          </div>
        </button>
      )}

      {post.text && <p className="post-body">{post.text}</p>}

      <div className="post-actions">
        <button type="button" className="action" aria-pressed={stoked} onClick={() => dispatch({ type: 'TOGGLE_STOKE', postId: post.id })}>
          <span style={{ color: stoked ? '#7FA32A' : 'inherit', display: 'inline-flex' }}>
            <Icon name="bolt" size={20} fill={stoked ? '#C8F169' : 'none'} />
          </span>
          {stokes.length} stoked
        </button>
        {!full && (
          <button type="button" className="action" onClick={openPost}>
            <Icon name="chat" size={20} /> {commentCount} <span className="sr-only">comments</span>
          </button>
        )}
        {meetup && (
          <button type="button" className="action" style={{ marginLeft: 'auto', color: 'var(--forest)', fontWeight: 700 }} onClick={() => push({ name: 'meetup', meetupId: meetup.id })}>
            {(state.rsvps[meetup.id] ?? []).includes(state.meId) ? 'Going ✓' : 'RSVP'}
          </button>
        )}
      </div>
      {reporting && <ReportDialog targetType="post" targetId={post.id} onClose={() => setReporting(false)} />}
    </article>
  );
}
