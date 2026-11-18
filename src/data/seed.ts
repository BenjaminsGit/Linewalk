import type { State } from '../store/types';

export const STATE_VERSION = 3;

const H = 3600_000;
const D = 24 * H;

/**
 * Demo data for Johannesburg and Cape Town. Timestamps are relative to `now`
 * so the feed always looks fresh. Spot locations are approximate park
 * locations; all rigging details are SAMPLE TEXT, not real beta.
 */
export function createSeed(now: number = Date.now()): State {
  const t = (ago: number) => now - ago;

  return {
    version: STATE_VERSION,
    meId: 'u_me',
    onboarded: false,
    riggerRequestPending: false,
    users: {
      u_me: { id: 'u_me', name: 'Ben S.', handle: 'ben', city: 'Johannesburg', bio: 'Parklines after work, slowly getting into longlines.', color: '#C8F169', homeSpotId: 's_zoo', verifiedRigger: false },
      u_naledi: { id: 'u_naledi', name: 'Naledi K.', handle: 'naledi.walks', city: 'Johannesburg', bio: 'Highliner. Rigging since 2019. Always keen for a sunrise session.', color: '#8FC1D4', homeSpotId: 's_emm', verifiedRigger: true },
      u_thabo: { id: 'u_thabo', name: 'Thabo M.', handle: 'thabo', city: 'Johannesburg', bio: 'I run the Sunday beginner jam at Zoo Lake. Come say hi!', color: '#E9C46A', homeSpotId: 's_zoo', verifiedRigger: true },
      u_jess: { id: 'u_jess', name: 'Jess D.', handle: 'jessonaline', city: 'Johannesburg', bio: 'Longline addict. Gear nerd.', color: '#F4A261', homeSpotId: 's_emm', verifiedRigger: false },
      u_sipho: { id: 'u_sipho', name: 'Sipho N.', handle: 'sipho', city: 'Johannesburg', bio: 'Tricklining and surf lines.', color: '#B7A6E0', homeSpotId: 's_delta', verifiedRigger: false },
      u_amara: { id: 'u_amara', name: 'Amara L.', handle: 'amara', city: 'Johannesburg', bio: 'Three months in. Loving it.', color: '#F2A7B8', homeSpotId: 's_zoo', verifiedRigger: false },
      u_pieter: { id: 'u_pieter', name: 'Pieter V.', handle: 'pieter', city: 'Cape Town', bio: 'Cape Town longlines and the occasional waterline.', color: '#9ED9B5', homeSpotId: 's_green', verifiedRigger: true },
      u_zoe: { id: 'u_zoe', name: 'Zoe R.', handle: 'zoe.r', city: 'Cape Town', bio: 'Yoga on the line. Mountain person.', color: '#F7D488', homeSpotId: 's_garden', verifiedRigger: false },
    },
    follows: {
      u_me: ['u_naledi', 'u_thabo', 'u_jess', 'u_amara'],
      u_naledi: ['u_me', 'u_jess', 'u_thabo'],
      u_thabo: ['u_me', 'u_naledi', 'u_amara', 'u_sipho'],
      u_jess: ['u_naledi', 'u_me'],
      u_sipho: ['u_thabo'],
      u_amara: ['u_thabo', 'u_me'],
      u_pieter: ['u_zoe', 'u_naledi'],
      u_zoe: ['u_pieter'],
    },
    spots: {
      s_zoo: { id: 's_zoo', name: 'Zoo Lake', area: 'Johannesburg', type: 'park', lat: -26.1607, lng: 28.0305, gapMin: 15, gapMax: 40, anchors: 'trees', accessNote: 'Big oaks on the eastern lawn. Use tree protection. Busy on weekend afternoons.', createdBy: 'u_thabo', createdAt: t(400 * D) },
      s_emm: { id: 's_emm', name: 'Emmarentia Dam', area: 'Johannesburg', type: 'long', lat: -26.1555, lng: 28.0063, gapMin: 50, gapMax: 110, anchors: 'trees', accessNote: 'Long flat stretch by the dam wall. Rig early before the afternoon wind.', createdBy: 'u_naledi', createdAt: t(380 * D) },
      s_delta: { id: 's_delta', name: 'Delta Park', area: 'Johannesburg', type: 'park', lat: -26.1262, lng: 28.0093, gapMin: 10, gapMax: 35, anchors: 'trees', accessNote: 'Quiet weekdays. Watch for dog walkers on the main path.', createdBy: 'u_sipho', createdAt: t(200 * D) },
      s_kop: { id: 's_kop', name: 'Melville Koppies midline', area: 'Johannesburg', type: 'mid', lat: -26.1733, lng: 28.0012, gapMin: 20, gapMax: 30, anchors: 'mixed', accessNote: 'Nature reserve — only rig where shown, and only on guided-access days.', riggingInfo: 'SAMPLE: Two natural rock anchors on the north side, backup to a sling around the boulder. Max tension guidance and anchor photos would appear here for verified riggers.', createdBy: 'u_naledi', createdAt: t(150 * D) },
      s_gorge: { id: 's_gorge', name: 'Magaliesberg gorge highline', area: 'Magaliesberg', type: 'high', lat: -25.95, lng: 27.85, gapMin: 40, gapMax: 85, anchors: 'bolts', accessNote: 'Private land. Access by arrangement through the local club only.', riggingInfo: 'SAMPLE: Bolted anchors on both rims (4 bolts each side). Anchor inspection dates, rigging diagram and landowner contact would appear here for verified riggers.', createdBy: 'u_naledi', createdAt: t(300 * D) },
      s_green: { id: 's_green', name: 'Green Point Park', area: 'Cape Town', type: 'long', lat: -33.9035, lng: 18.4065, gapMin: 40, gapMax: 90, anchors: 'trees', accessNote: 'Windy. Best mornings. Check park rules before rigging.', createdBy: 'u_pieter', createdAt: t(350 * D) },
      s_garden: { id: 's_garden', name: "Company's Garden", area: 'Cape Town', type: 'park', lat: -33.9275, lng: 18.4175, gapMin: 10, gapMax: 25, anchors: 'trees', accessNote: 'Short lines between the oaks. Very busy — keep lines low.', createdBy: 'u_zoe', createdAt: t(260 * D) },
      s_rond: { id: 's_rond', name: 'Rondebosch Common', area: 'Cape Town', type: 'water', lat: -33.9605, lng: 18.4815, gapMin: 15, gapMax: 30, anchors: 'posts', accessNote: 'Seasonal pond in winter — waterline only when it fills.', createdBy: 'u_pieter', createdAt: t(120 * D) },
    },
    reviews: [
      { id: 'r1', spotId: 's_zoo', userId: 'u_amara', rating: 5, text: 'Perfect for beginners, and the Sunday crew is super welcoming.', hazards: [], createdAt: t(12 * D) },
      { id: 'r2', spotId: 's_zoo', userId: 'u_jess', rating: 4, text: 'Great trees but it gets crowded after 2pm on weekends.', hazards: ['Crowds'], createdAt: t(30 * D) },
      { id: 'r3', spotId: 's_emm', userId: 'u_jess', rating: 4, text: 'Best longline spot in Joburg. Wind can be brutal after midday.', hazards: ['Wind'], createdAt: t(8 * D) },
      { id: 'r4', spotId: 's_gorge', userId: 'u_naledi', rating: 5, text: 'Stunning line. Check the bolts every time — one side gets a lot of sun.', hazards: ['Exposure', 'Remote'], createdAt: t(20 * D) },
      { id: 'r5', spotId: 's_delta', userId: 'u_sipho', rating: 4, text: 'Chill weekday spot with good shade.', hazards: ['Dogs'], createdAt: t(40 * D) },
      { id: 'r6', spotId: 's_green', userId: 'u_pieter', rating: 4, text: 'Long gaps and an amazing view. Go early.', hazards: ['Wind'], createdAt: t(15 * D) },
    ],
    checkIns: [
      { userId: 'u_thabo', spotId: 's_zoo', startedAt: t(0.6 * H) },
      { userId: 'u_naledi', spotId: 's_emm', startedAt: t(1.1 * H) },
      { userId: 'u_jess', spotId: 's_emm', startedAt: t(0.4 * H) },
      { userId: 'u_pieter', spotId: 's_green', startedAt: t(1.5 * H) },
    ],
    sessions: {
      se1: { id: 'se1', userId: 'u_naledi', spotId: 's_gorge', type: 'high', length: 85, height: 40, outcome: 'full_send', notes: 'First full man on this one after three sessions of falling at the halfway mark. Wind dropped right at golden hour.', visibility: 'public', createdAt: t(2 * H) },
      se2: { id: 'se2', userId: 'u_amara', spotId: 's_zoo', type: 'park', length: 20, height: 1, outcome: 'walked', notes: 'Walked my first 20 m line without stepping off!! Thanks Thabo for the tips.', visibility: 'public', createdAt: t(7 * H) },
      se3: { id: 'se3', userId: 'u_jess', spotId: 's_emm', type: 'long', length: 102, height: 1.5, outcome: 'practice', notes: 'Getting closer on the 100. Fell twice in the middle third — need to work on the sway.', visibility: 'public', createdAt: t(26 * H) },
      se4: { id: 'se4', userId: 'u_pieter', spotId: 's_green', type: 'long', length: 78, height: 1.5, outcome: 'full_send', notes: 'Morning session before the wind came in.', visibility: 'public', createdAt: t(30 * H) },
      se5: { id: 'se5', userId: 'u_sipho', spotId: 's_delta', type: 'park', length: 18, height: 0.8, outcome: 'new_trick', notes: 'Landed my first butt bounce to stand.', visibility: 'public', createdAt: t(50 * H) },
      // my own logbook
      me1: { id: 'me1', userId: 'u_me', spotId: 's_zoo', type: 'park', length: 32, height: 1, outcome: 'full_send', notes: 'Linked turnarounds both ways.', visibility: 'public', createdAt: t(1 * D + 3 * H) },
      me2: { id: 'me2', userId: 'u_me', spotId: 's_emm', type: 'long', length: 72, height: 1.5, outcome: 'walked', notes: 'Windy, two falls, then got it.', visibility: 'public', createdAt: t(4 * D) },
      me3: { id: 'me3', userId: 'u_me', spotId: 's_kop', type: 'mid', length: 22, height: 4, outcome: 'new_trick', notes: 'First midline! Guided session with Naledi.', visibility: 'private', createdAt: t(9 * D) },
      me4: { id: 'me4', userId: 'u_me', spotId: 's_zoo', type: 'park', length: 25, height: 1, outcome: 'practice', notes: 'Drop-knee practice.', visibility: 'private', createdAt: t(11 * D) },
      me5: { id: 'me5', userId: 'u_me', spotId: 's_zoo', type: 'park', length: 28, height: 1, outcome: 'walked', notes: '', visibility: 'private', createdAt: t(2 * D) },
    },
    posts: [
      { id: 'p1', authorId: 'u_naledi', kind: 'session', sessionId: 'se1', text: '', createdAt: t(2 * H) },
      { id: 'p2', authorId: 'u_thabo', kind: 'meetup', meetupId: 'm1', text: 'Lines and spotters provided. Total beginners very welcome!', createdAt: t(5 * H) },
      { id: 'p3', authorId: 'u_jess', kind: 'text', tag: 'Gear question', text: "Moving from a ratchet kit to a pulley system for longlines. What's everyone running for 50–100 m?", createdAt: t(6 * H) },
      { id: 'p4', authorId: 'u_amara', kind: 'session', sessionId: 'se2', text: '', createdAt: t(7 * H) },
      { id: 'p5', authorId: 'u_jess', kind: 'session', sessionId: 'se3', text: '', createdAt: t(26 * H) },
      { id: 'p6', authorId: 'u_pieter', kind: 'session', sessionId: 'se4', text: '', createdAt: t(30 * H) },
      { id: 'p7', authorId: 'u_me', kind: 'session', sessionId: 'me1', text: '', createdAt: t(1 * D + 3 * H) },
      { id: 'p8', authorId: 'u_sipho', kind: 'session', sessionId: 'se5', text: '', createdAt: t(50 * H) },
      { id: 'p9', authorId: 'u_naledi', kind: 'text', tag: 'Safety', text: 'Reminder: if your webbing is older than its retirement date or has seen a lot of UV, retire it. Log your gear in your locker and the app will remind you.', createdAt: t(3 * D) },
      { id: 'p10', authorId: 'u_me', kind: 'session', sessionId: 'me2', text: '', createdAt: t(4 * D) },
    ],
    stokes: {
      p1: ['u_thabo', 'u_jess', 'u_amara', 'u_sipho', 'u_pieter'],
      p2: ['u_amara', 'u_me'],
      p3: ['u_naledi'],
      p4: ['u_thabo', 'u_me', 'u_naledi', 'u_jess'],
      p5: ['u_naledi'],
      p6: ['u_zoe'],
      p7: ['u_naledi', 'u_thabo', 'u_amara'],
      p8: ['u_thabo'],
      p9: ['u_thabo', 'u_jess', 'u_pieter'],
      p10: ['u_jess'],
    },
    comments: [
      { id: 'c1', postId: 'p1', userId: 'u_thabo', text: 'Massive! That line has been haunting you 🙌', createdAt: t(1.5 * H) },
      { id: 'c2', postId: 'p1', userId: 'u_jess', text: 'Golden hour sends hit different.', createdAt: t(1.2 * H) },
      { id: 'c3', postId: 'p3', userId: 'u_naledi', text: 'A 4:1 or 5:1 pulley with a progress-capture works well up to 100 m. Happy to show you mine on Sunday.', createdAt: t(5 * H) },
      { id: 'c4', postId: 'p3', userId: 'u_pieter', text: 'Same — and get a proper line grab. Makes rigging solo much easier.', createdAt: t(4 * H) },
      { id: 'c5', postId: 'p4', userId: 'u_thabo', text: 'Told you you had it! See you Sunday.', createdAt: t(6 * H) },
      { id: 'c6', postId: 'p7', userId: 'u_naledi', text: 'Clean turnarounds 👏', createdAt: t(1 * D) },
    ],
    meetups: {
      m1: { id: 'm1', hostId: 'u_thabo', spotId: 's_zoo', title: 'Sunday beginner jam', startsAt: nextDow(now, 0, 9), description: 'Weekly beginner session. We rig 3–4 low parklines, bring spotters and show you the basics. Bring water and sunscreen.', level: 'beginner', gearProvided: true, capacity: 30 },
      m2: { id: 'm2', hostId: 'u_jess', spotId: 's_emm', title: 'Longline sunrise', startsAt: nextDow(now, 6, 6), description: "Rigging a 100 m and a 60 m before the wind. Some longline experience recommended — or come watch and help tension.", level: 'advanced', gearProvided: true, capacity: 10 },
      m3: { id: 'm3', hostId: 'u_pieter', spotId: 's_green', title: 'Cape Town community session', startsAt: nextDow(now, 6, 8), description: 'Mixed lines for all levels. Coffee after.', level: 'all', gearProvided: true, capacity: 20 },
    },
    rsvps: {
      m1: ['u_thabo', 'u_amara', 'u_sipho', 'u_naledi', 'u_jess'],
      m2: ['u_jess', 'u_naledi'],
      m3: ['u_pieter', 'u_zoe'],
    },
    gear: [
      { id: 'g1', userId: 'u_me', kind: 'webbing', name: 'Polyester longline webbing', length: 120, boughtOn: t(500 * D), retireOn: t(-60 * D), notes: 'Mostly park use. Store out of the sun.' },
      { id: 'g2', userId: 'u_me', kind: 'tensioning', name: '4:1 pulley system', boughtOn: t(300 * D), retireOn: t(-1500 * D), notes: '' },
      { id: 'g3', userId: 'u_me', kind: 'anchor', name: 'Tree protection ×4', boughtOn: t(500 * D), retireOn: t(-700 * D), notes: '' },
      { id: 'g4', userId: 'u_me', kind: 'webbing', name: 'Old parkline kit webbing', length: 25, boughtOn: t(1300 * D), retireOn: t(20 * D), notes: 'Faded — past retirement date.' },
    ],
    notifications: [
      { id: 'n1', kind: 'stoke', actorId: 'u_naledi', targetId: 'p7', text: 'stoked your session at Zoo Lake', createdAt: t(20 * H), read: false },
      { id: 'n2', kind: 'comment', actorId: 'u_naledi', targetId: 'p7', text: 'commented: “Clean turnarounds 👏”', createdAt: t(1 * D), read: false },
      { id: 'n3', kind: 'checkin', actorId: 'u_thabo', targetId: 's_zoo', text: 'is on a line at Zoo Lake', createdAt: t(0.6 * H), read: false },
      { id: 'n4', kind: 'meetup', actorId: 'u_thabo', targetId: 'm1', text: 'invited you to Sunday beginner jam', createdAt: t(5 * H), read: true },
      { id: 'n5', kind: 'follow', actorId: 'u_amara', text: 'started following you', createdAt: t(3 * D), read: true },
    ],
    reports: [],
  };
}

/** Next occurrence of day-of-week `dow` (0 = Sunday) at `hour`:00 local time. */
export function nextDow(now: number, dow: number, hour: number): number {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  let add = (dow - d.getDay() + 7) % 7;
  if (add === 0 && d.getTime() <= now) add = 7;
  d.setDate(d.getDate() + add);
  return d.getTime();
}
