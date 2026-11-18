import { useState } from 'react';
import { useStore } from '../store/store';
import { useRouter } from '../lib/router';
import { PostCard } from '../components/PostCard';
import { Avatar, Empty, TopBar, UserName } from '../components/ui';
import { Icon } from '../components/Icon';
import { timeAgo } from '../lib/format';
import type { ID } from '../store/types';

export function PostDetailScreen({ postId }: { postId: ID }) {
  const { state, dispatch, now } = useStore();
  const { push } = useRouter();
  const [text, setText] = useState('');
  const post = state.posts.find((p) => p.id === postId);
  const comments = state.comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
  const stokers = state.stokes[postId] ?? [];

  if (!post) {
    return (
      <>
        <TopBar title="Post" />
        <Empty>This post was deleted.</Empty>
      </>
    );
  }

  return (
    <>
      <TopBar title="Post" />
      <div className="pad stack gap-12">
        <PostCard post={post} full />

        {stokers.length > 0 && (
          <div className="row gap-8 small muted">
            <div className="row">
              {stokers.slice(0, 6).map((u, i) => <span key={u} style={{ marginLeft: i ? -8 : 0 }}><Avatar userId={u} size={24} /></span>)}
            </div>
            Stoked by {stokers.map((u) => (u === state.meId ? 'you' : state.users[u].name.split(' ')[0])).slice(0, 3).join(', ')}
            {stokers.length > 3 ? ` and ${stokers.length - 3} more` : ''}
          </div>
        )}

        <h2 className="section-title" style={{ margin: '8px 0 0' }}>Comments · {comments.length}</h2>
        <div className="stack gap-12">
          {comments.map((c) => (
            <div key={c.id} className="row gap-10" style={{ alignItems: 'flex-start' }}>
              <Avatar userId={c.userId} size={34} onClick={() => push({ name: 'profile', userId: c.userId })} />
              <div className="grow card" style={{ padding: '10px 12px', borderRadius: 16 }}>
                <div className="row gap-6">
                  <UserName userId={c.userId} />
                  <span className="xs muted">{timeAgo(c.createdAt, now)}</span>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.4, marginTop: 2, overflowWrap: 'anywhere' }}>{c.text}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="muted small">No comments yet. Say something nice.</p>}
        </div>

        <form
          className="row gap-8 mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'ADD_COMMENT', postId, text });
            setText('');
          }}
        >
          <Avatar userId={state.meId} size={36} />
          <label className="grow">
            <span className="sr-only">Add a comment</span>
            <input className="input" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" />
          </label>
          <button className="icon-btn" style={{ background: 'var(--forest)', color: 'var(--lime)' }} aria-label="Send comment" disabled={!text.trim()}>
            <Icon name="send" size={20} />
          </button>
        </form>
      </div>
    </>
  );
}
