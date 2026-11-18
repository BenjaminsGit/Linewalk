import type { CheckIn, ID, Meetup, Post, Session, Spot, State } from './types';

export const CHECKIN_TTL = 3 * 3600_000;
const DAY = 24 * 3600_000;

export const liveCheckIns = (s: State, now: number): CheckIn[] =>
  s.checkIns.filter((c) => now - c.startedAt < CHECKIN_TTL);

export const myCheckIn = (s: State, now: number) =>
  liveCheckIns(s, now).find((c) => c.userId === s.meId);

export const isFollowing = (s: State, userId: ID) => (s.follows[s.meId] ?? []).includes(userId);

export const followers = (s: State, userId: ID) =>
  Object.entries(s.follows).filter(([, list]) => list.includes(userId)).map(([id]) => id);

export const following = (s: State, userId: ID) => s.follows[userId] ?? [];

/** Where a post "happens", used for the Nearby feed. */
export function postArea(s: State, p: Post): string {
  if (p.sessionId) {
    const spot = s.spots[s.sessions[p.sessionId]?.spotId];
    if (spot) return spot.area;
  }
  if (p.meetupId) {
    const spot = s.spots[s.meetups[p.meetupId]?.spotId];
    if (spot) return spot.area;
  }
  return s.users[p.authorId]?.city ?? '';
}

export function cityOfArea(area: string): string {
  // Areas outside a city map to their nearest launch city.
  if (area === 'Magaliesberg') return 'Johannesburg';
  return area;
}

export function feed(s: State, tab: 'following' | 'nearby'): Post[] {
  const me = s.meId;
  const myCity = s.users[me].city;
  const follows = new Set(s.follows[me] ?? []);
  const sorted = [...s.posts].sort((a, b) => b.createdAt - a.createdAt);
  if (tab === 'following') return sorted.filter((p) => p.authorId === me || follows.has(p.authorId));
  return sorted.filter((p) => cityOfArea(postArea(s, p)) === myCity);
}

export function upcomingMeetups(s: State, now: number, city?: string): Meetup[] {
  return Object.values(s.meetups)
    .filter((m) => m.startsAt > now - 3 * 3600_000)
    .filter((m) => !city || cityOfArea(s.spots[m.spotId]?.area ?? '') === city)
    .sort((a, b) => a.startsAt - b.startsAt);
}

export function sessionsOf(s: State, userId: ID, viewerIsOwner: boolean): Session[] {
  return Object.values(s.sessions)
    .filter((x) => x.userId === userId && (viewerIsOwner || x.visibility === 'public'))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export interface Stats {
  sessionsThisYear: number;
  totalSessions: number;
  longest: number;
  highest: number;
  streak: number;
  spotsVisited: number;
}

export function userStats(s: State, userId: ID, now: number, includePrivate = true): Stats {
  const list = Object.values(s.sessions).filter(
    (x) => x.userId === userId && (includePrivate || x.visibility === 'public'),
  );
  const year = new Date(now).getFullYear();
  const walkedOutcomes = new Set(['walked', 'full_send', 'new_trick']);
  const walked = list.filter((x) => walkedOutcomes.has(x.outcome));
  return {
    sessionsThisYear: list.filter((x) => new Date(x.createdAt).getFullYear() === year).length,
    totalSessions: list.length,
    longest: walked.reduce((m, x) => Math.max(m, x.length), 0),
    highest: walked.reduce((m, x) => Math.max(m, x.height), 0),
    streak: dayStreak(list.map((x) => x.createdAt), now),
    spotsVisited: new Set(list.map((x) => x.spotId)).size,
  };
}

/** Consecutive days (ending today, or yesterday) with at least one session. */
export function dayStreak(times: number[], now: number): number {
  const dayKey = (t: number) => {
    const d = new Date(t);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY;
  };
  const days = new Set(times.map(dayKey));
  let cur = dayKey(now);
  if (!days.has(cur)) cur -= 1;
  let n = 0;
  while (days.has(cur)) { n++; cur -= 1; }
  return n;
}

export function spotRating(s: State, spotId: ID): { avg: number; count: number } {
  const rs = s.reviews.filter((r) => r.spotId === spotId);
  if (!rs.length) return { avg: 0, count: 0 };
  return { avg: rs.reduce((a, r) => a + r.rating, 0) / rs.length, count: rs.length };
}

export function spotSessions(s: State, spotId: ID): Session[] {
  return Object.values(s.sessions)
    .filter((x) => x.spotId === spotId && x.visibility === 'public')
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function canSeeRigging(s: State): boolean {
  return s.users[s.meId].verifiedRigger;
}

export function spotsInCity(s: State, city: string): Spot[] {
  return Object.values(s.spots).filter((sp) => cityOfArea(sp.area) === city);
}

export const unreadCount = (s: State) => s.notifications.filter((n) => !n.read).length;

export function gearStatus(retireOn: number, now: number): 'ok' | 'soon' | 'retire' {
  if (retireOn <= now) return 'retire';
  if (retireOn - now < 90 * DAY) return 'soon';
  return 'ok';
}
