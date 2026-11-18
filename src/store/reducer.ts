import type {
  Anchors, GearKind, ID, Level, LineType, Outcome, Report, State, Visibility,
} from './types';
import { createSeed } from '../data/seed';

export type Action =
  | { type: 'ONBOARD'; name: string; city: string }
  | { type: 'UPDATE_PROFILE'; name: string; bio: string; city: string }
  | { type: 'TOGGLE_STOKE'; postId: ID }
  | { type: 'ADD_COMMENT'; postId: ID; text: string }
  | { type: 'DELETE_POST'; postId: ID }
  | { type: 'ADD_TEXT_POST'; text: string; tag?: string }
  | { type: 'CHECK_IN'; spotId: ID }
  | { type: 'CHECK_OUT' }
  | {
      type: 'LOG_SESSION';
      spotId: ID; lineType: LineType; length: number; height: number;
      outcome: Outcome; notes: string; photo?: string; visibility: Visibility;
    }
  | {
      type: 'ADD_SPOT'; id?: ID;
      name: string; area: string; lineType: LineType; lat: number; lng: number;
      gapMin: number; gapMax: number; anchors: Anchors; accessNote: string; riggingInfo?: string;
    }
  | { type: 'ADD_REVIEW'; spotId: ID; rating: number; text: string; hazards: string[] }
  | { type: 'TOGGLE_RSVP'; meetupId: ID }
  | {
      type: 'CREATE_MEETUP'; id?: ID;
      spotId: ID; title: string; startsAt: number; description: string;
      level: Level; gearProvided: boolean; capacity: number;
    }
  | { type: 'TOGGLE_FOLLOW'; userId: ID }
  | { type: 'ADD_GEAR'; kind: GearKind; name: string; length?: number; boughtOn: number; retireOn: number; notes: string }
  | { type: 'REMOVE_GEAR'; gearId: ID }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'REPORT'; targetType: Report['targetType']; targetId: ID; reason: string }
  | { type: 'REQUEST_RIGGER' }
  | { type: 'DEMO_APPROVE_RIGGER' }
  | { type: 'RESET' };

/** Side inputs that keep the reducer pure and testable. */
export interface Ctx {
  now: number;
  id: (prefix: string) => string;
}

export function reduce(state: State, action: Action, ctx: Ctx): State {
  const me = state.meId;

  switch (action.type) {
    case 'ONBOARD': {
      const user = state.users[me];
      return {
        ...state,
        onboarded: true,
        users: { ...state.users, [me]: { ...user, name: action.name.trim() || user.name, city: action.city } },
      };
    }

    case 'UPDATE_PROFILE': {
      const user = state.users[me];
      return {
        ...state,
        users: {
          ...state.users,
          [me]: { ...user, name: action.name.trim() || user.name, bio: action.bio.trim(), city: action.city },
        },
      };
    }

    case 'TOGGLE_STOKE': {
      const cur = state.stokes[action.postId] ?? [];
      const next = cur.includes(me) ? cur.filter((u) => u !== me) : [...cur, me];
      return { ...state, stokes: { ...state.stokes, [action.postId]: next } };
    }

    case 'ADD_COMMENT': {
      const text = action.text.trim();
      if (!text || !state.posts.some((p) => p.id === action.postId)) return state;
      return {
        ...state,
        comments: [...state.comments, { id: ctx.id('c'), postId: action.postId, userId: me, text, createdAt: ctx.now }],
      };
    }

    case 'ADD_TEXT_POST': {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        posts: [{ id: ctx.id('p'), authorId: me, kind: 'text', text, tag: action.tag, createdAt: ctx.now }, ...state.posts],
      };
    }

    case 'DELETE_POST': {
      const post = state.posts.find((p) => p.id === action.postId);
      if (!post || post.authorId !== me) return state;
      const sessions = { ...state.sessions };
      // Deleting a session post keeps the session in the logbook, but makes it private.
      if (post.sessionId && sessions[post.sessionId]) {
        sessions[post.sessionId] = { ...sessions[post.sessionId], visibility: 'private' };
      }
      return {
        ...state,
        sessions,
        posts: state.posts.filter((p) => p.id !== action.postId),
        comments: state.comments.filter((c) => c.postId !== action.postId),
      };
    }

    case 'CHECK_IN': {
      if (!state.spots[action.spotId]) return state;
      const others = state.checkIns.filter((c) => c.userId !== me);
      return { ...state, checkIns: [...others, { userId: me, spotId: action.spotId, startedAt: ctx.now }] };
    }

    case 'CHECK_OUT':
      return { ...state, checkIns: state.checkIns.filter((c) => c.userId !== me) };

    case 'LOG_SESSION': {
      if (!state.spots[action.spotId]) return state;
      const sessionId = ctx.id('se');
      const session = {
        id: sessionId,
        userId: me,
        spotId: action.spotId,
        type: action.lineType,
        length: clamp(action.length, 1, 3000),
        height: clamp(action.height, 0, 2000),
        outcome: action.outcome,
        notes: action.notes.trim(),
        photo: action.photo,
        visibility: action.visibility,
        createdAt: ctx.now,
      };
      const posts = action.visibility === 'public'
        ? [{ id: ctx.id('p'), authorId: me, kind: 'session' as const, sessionId, text: '', createdAt: ctx.now }, ...state.posts]
        : state.posts;
      return { ...state, sessions: { ...state.sessions, [sessionId]: session }, posts };
    }

    case 'ADD_SPOT': {
      const name = action.name.trim();
      if (!name) return state;
      const id = action.id ?? ctx.id('s');
      const gapMin = Math.max(1, Math.min(action.gapMin, action.gapMax));
      const gapMax = Math.max(action.gapMin, action.gapMax, gapMin);
      return {
        ...state,
        spots: {
          ...state.spots,
          [id]: {
            id, name, area: action.area, type: action.lineType, lat: action.lat, lng: action.lng,
            gapMin, gapMax, anchors: action.anchors, accessNote: action.accessNote.trim(),
            riggingInfo: action.riggingInfo?.trim() || undefined,
            createdBy: me, createdAt: ctx.now,
          },
        },
      };
    }

    case 'ADD_REVIEW': {
      if (!state.spots[action.spotId]) return state;
      const rating = clamp(Math.round(action.rating), 1, 5);
      // One review per user per spot: a new review replaces the old one.
      const reviews = state.reviews.filter((r) => !(r.spotId === action.spotId && r.userId === me));
      return {
        ...state,
        reviews: [
          { id: ctx.id('r'), spotId: action.spotId, userId: me, rating, text: action.text.trim(), hazards: action.hazards, createdAt: ctx.now },
          ...reviews,
        ],
      };
    }

    case 'TOGGLE_RSVP': {
      const meetup = state.meetups[action.meetupId];
      if (!meetup) return state;
      const cur = state.rsvps[action.meetupId] ?? [];
      if (cur.includes(me)) {
        if (meetup.hostId === me) return state; // hosts can't un-RSVP their own meetup
        return { ...state, rsvps: { ...state.rsvps, [action.meetupId]: cur.filter((u) => u !== me) } };
      }
      if (cur.length >= meetup.capacity) return state;
      return { ...state, rsvps: { ...state.rsvps, [action.meetupId]: [...cur, me] } };
    }

    case 'CREATE_MEETUP': {
      const title = action.title.trim();
      if (!title || !state.spots[action.spotId]) return state;
      const id = action.id ?? ctx.id('m');
      return {
        ...state,
        meetups: {
          ...state.meetups,
          [id]: {
            id, hostId: me, spotId: action.spotId, title, startsAt: action.startsAt,
            description: action.description.trim(), level: action.level,
            gearProvided: action.gearProvided, capacity: clamp(action.capacity, 2, 500),
          },
        },
        rsvps: { ...state.rsvps, [id]: [me] },
        posts: [{ id: ctx.id('p'), authorId: me, kind: 'meetup', meetupId: id, text: '', createdAt: ctx.now }, ...state.posts],
      };
    }

    case 'TOGGLE_FOLLOW': {
      if (action.userId === me || !state.users[action.userId]) return state;
      const cur = state.follows[me] ?? [];
      const next = cur.includes(action.userId) ? cur.filter((u) => u !== action.userId) : [...cur, action.userId];
      return { ...state, follows: { ...state.follows, [me]: next } };
    }

    case 'ADD_GEAR': {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        gear: [
          ...state.gear,
          { id: ctx.id('g'), userId: me, kind: action.kind, name, length: action.length, boughtOn: action.boughtOn, retireOn: action.retireOn, notes: action.notes.trim() },
        ],
      };
    }

    case 'REMOVE_GEAR':
      return { ...state, gear: state.gear.filter((g) => !(g.id === action.gearId && g.userId === me)) };

    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map((n) => (n.read ? n : { ...n, read: true })) };

    case 'REPORT':
      return {
        ...state,
        reports: [...state.reports, { id: ctx.id('rep'), targetType: action.targetType, targetId: action.targetId, reason: action.reason, createdAt: ctx.now }],
      };

    case 'REQUEST_RIGGER':
      return { ...state, riggerRequestPending: true };

    case 'DEMO_APPROVE_RIGGER':
      return {
        ...state,
        riggerRequestPending: false,
        users: { ...state.users, [me]: { ...state.users[me], verifiedRigger: true } },
      };

    case 'RESET':
      return createSeed(ctx.now);
  }
}

function clamp(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
