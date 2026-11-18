import { useEffect, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { initials } from '../lib/format';
import { useRouter } from '../lib/router';
import { useStore } from '../store/store';
import type { ID } from '../store/types';

export function Avatar({ userId, size = 40, live = false, onClick }: { userId: ID; size?: number; live?: boolean; onClick?: () => void }) {
  const { state } = useStore();
  const u = state.users[userId];
  if (!u) return null;
  const style = { width: size, height: size, background: u.color, fontSize: Math.round(size * 0.36) };
  const cls = 'avatar' + (live ? ' live' : '');
  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick} aria-label={`Open ${u.name}'s profile`}>
        {initials(u.name)}
      </button>
    );
  }
  return <span className={cls} style={style} aria-hidden="true">{initials(u.name)}</span>;
}

export function UserName({ userId, onClick }: { userId: ID; onClick?: () => void }) {
  const { state } = useStore();
  const u = state.users[userId];
  const inner = (
    <>
      {u.name}
      {u.verifiedRigger && (
        <span className="verified" title="Verified rigger">
          <Icon name="shield" size={16} />
          <span className="sr-only">Verified rigger</span>
        </span>
      )}
    </>
  );
  if (!onClick) return <span className="bold">{inner}</span>;
  return (
    <button type="button" onClick={onClick} style={{ border: 0, background: 'none', padding: 0, fontWeight: 600, fontSize: 15, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {inner}
    </button>
  );
}

export function TopBar({
  title, back = true, right, dark = false,
}: { title?: ReactNode; back?: boolean; right?: ReactNode; dark?: boolean }) {
  const { back: goBack, depth } = useRouter();
  return (
    <header className={'topbar' + (dark ? ' dark' : '')}>
      {back && depth > 1 && (
        <button type="button" className="icon-btn" onClick={goBack} aria-label="Back">
          <Icon name="back" />
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  );
}

export function IconButton({ icon, label, onClick, badge }: { icon: IconName; label: string; onClick: () => void; badge?: number }) {
  return (
    <button type="button" className="icon-btn" onClick={onClick} aria-label={badge ? `${label}, ${badge} unread` : label}>
      <Icon name={icon} />
      {badge ? <span className="dot" aria-hidden="true">{badge}</span> : null}
    </button>
  );
}

export function Segmented<T extends string>({
  options, value, onChange, label,
}: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= Math.round(value) ? '#B7791F' : '#C9D2CD', display: 'inline-flex' }}>
          <Icon name="star" size={size} fill="currentColor" strokeWidth={1.5} />
        </span>
      ))}
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="row between">
          <h2 className="display" style={{ fontSize: 20 }}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </div>
  );
}

export function ReportDialog({ targetType, targetId, onClose }: { targetType: 'post' | 'spot' | 'comment'; targetId: ID; onClose: () => void }) {
  const { dispatch, toast } = useStore();
  const reasons = ['Unsafe rigging or beta', 'Access / landowner issue', 'Spam', 'Harassment', 'Something else'];
  return (
    <Modal title="Report" onClose={onClose}>
      <p className="muted small">Reports go to the Linewalk moderation queue. In the real app, moderators respond within 24 hours.</p>
      <div className="stack gap-8 mt-12">
        {reasons.map((r) => (
          <button
            key={r}
            type="button"
            className="btn ghost block"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => { dispatch({ type: 'REPORT', targetType, targetId, reason: r }); toast('Thanks — report sent to moderators'); onClose(); }}
          >
            {r}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
