import { describe, expect, it } from 'vitest';
import { reduce, type Action, type Ctx } from './reducer';
import { createSeed } from '../data/seed';
import { dayStreak, feed, gearStatus, liveCheckIns, userStats, CHECKIN_TTL } from './selectors';
import type { State } from './types';

const NOW = new Date('2026-11-18T12:00:00Z').getTime();
let n = 0;
const ctx: Ctx = { now: NOW, id: (p) => `${p}_t${n++}` };
const run = (s: State, ...actions: Action[]) => actions.reduce((acc, a) => reduce(acc, a, ctx), s);

describe('reducer', () => {
  it('toggles a stoke on and off', () => {
    const s0 = createSeed(NOW);
    const s1 = run(s0, { type: 'TOGGLE_STOKE', postId: 'p1' });
    expect(s1.stokes.p1).toContain('u_me');
    const s2 = run(s1, { type: 'TOGGLE_STOKE', postId: 'p1' });
    expect(s2.stokes.p1).not.toContain('u_me');
    expect(s2.stokes.p1.length).toBe(s0.stokes.p1.length);
  });

  it('logs a public session as a feed post, and a private one only to the logbook', () => {
    const s0 = createSeed(NOW);
    const base = { type: 'LOG_SESSION' as const, spotId: 's_zoo', lineType: 'park' as const, length: 30, height: 1, outcome: 'walked' as const, notes: ' hi ' };
    const pub = run(s0, { ...base, visibility: 'public' });
    expect(pub.posts.length).toBe(s0.posts.length + 1);
    expect(pub.posts[0].authorId).toBe('u_me');
    expect(pub.sessions[pub.posts[0].sessionId!].notes).toBe('hi');

    const priv = run(s0, { ...base, visibility: 'private' });
    expect(priv.posts.length).toBe(s0.posts.length);
    expect(Object.keys(priv.sessions).length).toBe(Object.keys(s0.sessions).length + 1);
  });

  it('ignores sessions at unknown spots and clamps silly numbers', () => {
    const s0 = createSeed(NOW);
    const bad = run(s0, { type: 'LOG_SESSION', spotId: 'nope', lineType: 'park', length: 30, height: 1, outcome: 'walked', notes: '', visibility: 'public' });
    expect(bad).toBe(s0);
    const big = run(s0, { type: 'LOG_SESSION', spotId: 's_zoo', lineType: 'park', length: 999999, height: -5, outcome: 'walked', notes: '', visibility: 'private' });
    const added = Object.values(big.sessions).find((x) => !s0.sessions[x.id])!;
    expect(added.length).toBe(3000);
    expect(added.height).toBe(0);
  });

  it('keeps only one live check-in per user', () => {
    const s = run(createSeed(NOW), { type: 'CHECK_IN', spotId: 's_zoo' }, { type: 'CHECK_IN', spotId: 's_emm' });
    const mine = s.checkIns.filter((c) => c.userId === 'u_me');
    expect(mine).toHaveLength(1);
    expect(mine[0].spotId).toBe('s_emm');
    expect(run(s, { type: 'CHECK_OUT' }).checkIns.some((c) => c.userId === 'u_me')).toBe(false);
  });

  it('expires check-ins after the TTL', () => {
    const s = run(createSeed(NOW), { type: 'CHECK_IN', spotId: 's_zoo' });
    expect(liveCheckIns(s, NOW).some((c) => c.userId === 'u_me')).toBe(true);
    expect(liveCheckIns(s, NOW + CHECKIN_TTL + 1).some((c) => c.userId === 'u_me')).toBe(false);
  });

  it('respects meetup capacity and host RSVP', () => {
    let s = createSeed(NOW);
    s = { ...s, meetups: { ...s.meetups, m2: { ...s.meetups.m2, capacity: 2 } } };
    const full = run(s, { type: 'TOGGLE_RSVP', meetupId: 'm2' });
    expect(full.rsvps.m2).not.toContain('u_me');

    const created = run(createSeed(NOW), {
      type: 'CREATE_MEETUP', spotId: 's_zoo', title: 'My jam', startsAt: NOW + 86400_000,
      description: '', level: 'all', gearProvided: false, capacity: 10,
    });
    const id = Object.keys(created.meetups).find((k) => created.meetups[k].title === 'My jam')!;
    expect(created.rsvps[id]).toEqual(['u_me']);
    expect(run(created, { type: 'TOGGLE_RSVP', meetupId: id }).rsvps[id]).toEqual(['u_me']);
  });

  it('replaces my earlier review of the same spot', () => {
    const s = run(
      createSeed(NOW),
      { type: 'ADD_REVIEW', spotId: 's_zoo', rating: 2, text: 'meh', hazards: [] },
      { type: 'ADD_REVIEW', spotId: 's_zoo', rating: 9, text: 'great', hazards: ['Wind'] },
    );
    const mine = s.reviews.filter((r) => r.userId === 'u_me' && r.spotId === 's_zoo');
    expect(mine).toHaveLength(1);
    expect(mine[0].rating).toBe(5);
  });

  it('only lets me delete my own posts, and keeps the session as private', () => {
    const s0 = createSeed(NOW);
    expect(run(s0, { type: 'DELETE_POST', postId: 'p1' })).toBe(s0);
    const s1 = run(s0, { type: 'DELETE_POST', postId: 'p7' });
    expect(s1.posts.some((p) => p.id === 'p7')).toBe(false);
    expect(s1.sessions.me1.visibility).toBe('private');
  });

  it('follows and unfollows, but never yourself', () => {
    const s0 = createSeed(NOW);
    const s1 = run(s0, { type: 'TOGGLE_FOLLOW', userId: 'u_sipho' });
    expect(s1.follows.u_me).toContain('u_sipho');
    expect(run(s1, { type: 'TOGGLE_FOLLOW', userId: 'u_me' })).toBe(s1);
  });

  it('gates rigging behind verification', () => {
    const s = run(createSeed(NOW), { type: 'REQUEST_RIGGER' });
    expect(s.riggerRequestPending).toBe(true);
    expect(s.users.u_me.verifiedRigger).toBe(false);
    expect(run(s, { type: 'DEMO_APPROVE_RIGGER' }).users.u_me.verifiedRigger).toBe(true);
  });
});

describe('selectors', () => {
  it('following feed contains only me and people I follow, newest first', () => {
    const s = createSeed(NOW);
    const posts = feed(s, 'following');
    const allowed = new Set(['u_me', ...s.follows.u_me]);
    expect(posts.every((p) => allowed.has(p.authorId))).toBe(true);
    for (let i = 1; i < posts.length; i++) expect(posts[i - 1].createdAt).toBeGreaterThanOrEqual(posts[i].createdAt);
  });

  it('nearby feed is limited to my city', () => {
    const s = createSeed(NOW);
    expect(feed(s, 'nearby').some((p) => p.authorId === 'u_pieter')).toBe(false);
  });

  it('computes stats from walked sessions only', () => {
    const st = userStats(createSeed(NOW), 'u_me', NOW);
    expect(st.longest).toBe(72);
    expect(st.highest).toBe(4);
    expect(st.totalSessions).toBe(5);
  });

  it('counts day streaks ending today or yesterday', () => {
    const day = 86400_000;
    expect(dayStreak([NOW, NOW - day, NOW - 2 * day], NOW)).toBe(3);
    expect(dayStreak([NOW - day, NOW - 2 * day], NOW)).toBe(2);
    expect(dayStreak([NOW - 3 * day], NOW)).toBe(0);
  });

  it('flags gear for retirement', () => {
    const day = 86400_000;
    expect(gearStatus(NOW - 1, NOW)).toBe('retire');
    expect(gearStatus(NOW + 30 * day, NOW)).toBe('soon');
    expect(gearStatus(NOW + 365 * day, NOW)).toBe('ok');
  });
});
