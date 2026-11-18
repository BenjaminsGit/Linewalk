// Domain types. These mirror the production data model in docs/PLAN.md §6.

export type ID = string;

export type LineType = 'park' | 'long' | 'high' | 'water' | 'mid';
export type Outcome = 'practice' | 'walked' | 'full_send' | 'new_trick';
export type Anchors = 'trees' | 'bolts' | 'posts' | 'mixed';
export type Visibility = 'public' | 'private';

export interface User {
  id: ID;
  name: string;
  handle: string;
  city: string;
  bio: string;
  color: string; // avatar background
  homeSpotId?: ID;
  verifiedRigger: boolean;
}

export interface Spot {
  id: ID;
  name: string;
  area: string;
  type: LineType;
  lat: number;
  lng: number;
  gapMin: number;
  gapMax: number;
  anchors: Anchors;
  accessNote: string;
  riggingInfo?: string; // gated: verified riggers only
  createdBy: ID;
  createdAt: number;
}

export interface Review {
  id: ID;
  spotId: ID;
  userId: ID;
  rating: number; // 1..5
  text: string;
  hazards: string[];
  createdAt: number;
}

export interface CheckIn {
  userId: ID;
  spotId: ID;
  startedAt: number;
}

export interface Session {
  id: ID;
  userId: ID;
  spotId: ID;
  type: LineType;
  length: number;
  height: number;
  outcome: Outcome;
  notes: string;
  photo?: string; // data URL (demo) / storage URL (prod)
  visibility: Visibility;
  createdAt: number;
}

export type PostKind = 'session' | 'text' | 'meetup';

export interface Post {
  id: ID;
  authorId: ID;
  kind: PostKind;
  sessionId?: ID;
  meetupId?: ID;
  text: string;
  tag?: string; // e.g. "Gear question"
  createdAt: number;
}

export interface Comment {
  id: ID;
  postId: ID;
  userId: ID;
  text: string;
  createdAt: number;
}

export type Level = 'beginner' | 'all' | 'advanced';

export interface Meetup {
  id: ID;
  hostId: ID;
  spotId: ID;
  title: string;
  startsAt: number;
  description: string;
  level: Level;
  gearProvided: boolean;
  capacity: number;
}

export type GearKind = 'webbing' | 'tensioning' | 'anchor' | 'leash' | 'other';

export interface Gear {
  id: ID;
  userId: ID;
  kind: GearKind;
  name: string;
  length?: number;
  boughtOn: number;
  retireOn: number;
  notes: string;
}

export type NotificationKind = 'stoke' | 'comment' | 'follow' | 'meetup' | 'checkin';

export interface Notification {
  id: ID;
  kind: NotificationKind;
  actorId: ID;
  targetId?: ID; // post id / meetup id / spot id
  text: string;
  createdAt: number;
  read: boolean;
}

export interface Report {
  id: ID;
  targetType: 'post' | 'spot' | 'comment';
  targetId: ID;
  reason: string;
  createdAt: number;
}

export interface State {
  version: number;
  meId: ID;
  onboarded: boolean;
  users: Record<ID, User>;
  follows: Record<ID, ID[]>; // follower -> followees
  spots: Record<ID, Spot>;
  reviews: Review[];
  checkIns: CheckIn[];
  sessions: Record<ID, Session>;
  posts: Post[];
  stokes: Record<ID, ID[]>; // postId -> userIds
  comments: Comment[];
  meetups: Record<ID, Meetup>;
  rsvps: Record<ID, ID[]>; // meetupId -> userIds
  gear: Gear[];
  notifications: Notification[];
  reports: Report[];
  riggerRequestPending: boolean;
}
