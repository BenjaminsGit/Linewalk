import type { Anchors, GearKind, Level, LineType, Outcome } from '../store/types';

export function timeAgo(t: number, now: number): string {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function whenLabel(t: number, now: number): string {
  const d = new Date(t);
  const today = new Date(now);
  const tomorrow = new Date(now + 86400_000);
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return `Today · ${time}`;
  if (same(d, tomorrow)) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · ${time}`;
}

export const dateLabel = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const LINE_TYPES: { id: LineType; label: string; short: string }[] = [
  { id: 'park', label: 'Parkline', short: 'Park' },
  { id: 'long', label: 'Longline', short: 'Long' },
  { id: 'mid', label: 'Midline', short: 'Mid' },
  { id: 'high', label: 'Highline', short: 'High' },
  { id: 'water', label: 'Waterline', short: 'Water' },
];
export const lineLabel = (t: LineType) => LINE_TYPES.find((x) => x.id === t)!.label;
export const lineLetter = (t: LineType) => ({ park: 'P', long: 'L', mid: 'M', high: 'H', water: 'W' })[t];

export const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: 'practice', label: 'Practice' },
  { id: 'walked', label: 'Walked it' },
  { id: 'full_send', label: 'Full send' },
  { id: 'new_trick', label: 'New trick' },
];
export const outcomeLabel = (o: Outcome) => OUTCOMES.find((x) => x.id === o)!.label;

export const ANCHORS: { id: Anchors; label: string }[] = [
  { id: 'trees', label: 'Trees' },
  { id: 'posts', label: 'Posts' },
  { id: 'bolts', label: 'Bolts' },
  { id: 'mixed', label: 'Mixed' },
];
export const anchorLabel = (a: Anchors) => ANCHORS.find((x) => x.id === a)!.label;

export const LEVELS: { id: Level; label: string }[] = [
  { id: 'beginner', label: 'Beginner friendly' },
  { id: 'all', label: 'All levels' },
  { id: 'advanced', label: 'Advanced' },
];
export const levelLabel = (l: Level) => LEVELS.find((x) => x.id === l)!.label;

export const GEAR_KINDS: { id: GearKind; label: string }[] = [
  { id: 'webbing', label: 'Webbing' },
  { id: 'tensioning', label: 'Tensioning' },
  { id: 'anchor', label: 'Anchor' },
  { id: 'leash', label: 'Leash / ring' },
  { id: 'other', label: 'Other' },
];
export const gearKindLabel = (k: GearKind) => GEAR_KINDS.find((x) => x.id === k)!.label;

export const fmtM = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} m`;

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

export const CITIES = ['Johannesburg', 'Cape Town'];
