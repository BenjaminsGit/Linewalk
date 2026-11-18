# Linewalk — Product & Build Plan

> A social app for slackliners: find lines, log sessions, share sends, and meet people to walk with.

Status: **Demo (v0.1)**. This document covers the fundamentals (what we are building and why), the production architecture, and a phased build plan. The `src/` folder holds a working front-end demo that implements the MVP flows on seeded data.

---

## 1. Problem

Slackliners today are spread across several tools, and none of them does the whole job:

| Need | Where it happens today | What's missing |
| --- | --- | --- |
| Find spots and anchors | Spot maps (e.g. SlackMap), word of mouth | Mostly static: no live "who's there now", and little community around each spot |
| Share sends and clips | Instagram, YouTube | Nothing slackline-specific: no line length or height, no logbook, clips get lost in general feeds |
| Find people to walk with | WhatsApp groups, Facebook, Reddit | Fragmented and hard to find when you're new or travelling |
| Track progress | Notes app, memory | No logbook or progression stats |
| Gear and safety | Forums, manufacturer pages | No personal gear tracker, and highline rigging info gets passed around carelessly |

**The opportunity:** one place where the line *is* the unit of content: who rigged it, where, how long, how high, and who walked it.

## 2. Who it's for

1. **The parkliner (largest group).** Walks 15–40 m lines in parks after work. Wants people to walk with, a spot to go, and to see progress. Key moment: *"Is anyone rigging today?"*
2. **The progression-focused walker.** Longlines and midlines, often filming. Wants a logbook, PRs and a feed that understands the sport. Key moment: *"I just sent my longest line."*
3. **The rigger and highliner (small but influential).** Rigs highlines and owns the gear. Wants accurate spot info, gear tracking and access protection. Key moment: *"Is the anchor info for this highline accurate and safe?"*
4. **Local organisers (growth engine).** Run weekly jams and beginner days. Want events, RSVPs and a way to reach local walkers.

Launch market: **Johannesburg and Cape Town**, then other South African cities, then English-speaking slackline scenes (UK, AU, US). The community is dense in a handful of parks per city, so local liquidity matters more than global reach.

## 3. Core loops

```
          ┌────────────── discover spot ───────────────┐
          ▼                                             │
   check in at spot ──► walk ──► log session ──► post to feed
          │                                             │
          ▼                                             ▼
  friends see "on a line now" ◄──── stoke / comment / follow
          │
          ▼
   join, or plan a meetup ──► more people at spots ──► more check-ins
```

- **Live loop (daily):** check in → shows on friends' "on a line now" strip → they join you.
- **Content loop (weekly):** log a session → it becomes a structured post (spot, type, length, height, outcome) → stokes and comments → motivation to log again.
- **Community loop (weekly):** meetups → new people → follows → richer feed.
- **Knowledge loop (ongoing):** spots and reviews improve with every visit.

## 4. MVP scope

### In the MVP (all present in the demo)

| Area | Features |
| --- | --- |
| **Feed** | Following / Nearby / Meetups tabs; session posts with line stats; "Stoke" reaction; comments; gear questions (text posts) |
| **Live presence** | Check in at a spot; "on a line now" strip; checking in or out by hand (auto-expires after 3 h in prod) |
| **Spots** | Map with type filters; spot detail with stats, reviews and recent sessions; add a spot; **gated highline rigging info** |
| **Sessions** | Log spot, line type, length, height, outcome, notes and a photo; share to feed or keep private |
| **Meetups** | List, detail, RSVP, create a meetup |
| **Profiles** | Stats derived from the logbook (sessions, longest, highest, streak); logbook; gear locker with retirement dates; follow and unfollow |
| **Notifications** | Stokes, comments, follows, meetup reminders |
| **Safety** | Rigger verification gate; "report" on posts and spots; a safety note on highline spots |

### Explicitly later

DMs and group chat · video upload/transcoding · festivals and ticketing · gear marketplace · coaching and trick library · competitions and leaderboards · wearables.

## 5. Design principles

1. **The line is the content.** Every post carries spot, type, length and height in a consistent shape, and that structure powers stats, search and leaderboards later.
2. **Local first.** Default feeds and maps centre on your city, and liquidity is measured per city.
3. **Safety is a feature.** Highline anchor and rigging details are visible only to verified riggers, spot reviews flag hazards, and gear reminders nudge people to retire webbing.
4. **Respect access.** Spots can be marked sensitive (hidden location, members-only) to protect landowner relationships.
5. **Phone in a pocket.** Big touch targets, short flows (logging a session takes under 20 seconds), works outdoors in sun (high contrast).

Visual identity in the demo: deep forest green `#17362D`, chalk-lime accent `#C8F169`, off-white ground `#F3F5F2`, Space Grotesk headings, Inter body.

## 6. Data model

```
User(id, handle, name, city, avatar_url, bio, home_spot_id, is_verified_rigger, created_at)
Follow(follower_id, followee_id, created_at)

Spot(id, name, type[park|long|high|water|mid], lat, lng, gap_min_m, gap_max_m,
     anchors[trees|bolts|posts|mixed], access_note, rigging_info (gated), sensitivity[public|members|hidden],
     created_by, created_at)
SpotReview(id, spot_id, user_id, rating 1..5, text, hazards[], created_at)

CheckIn(id, user_id, spot_id, started_at, ended_at?)          -- live presence

Session(id, user_id, spot_id, type, length_m, height_m, outcome[practice|walked|full_send|new_trick],
        notes, media[], visibility[public|followers|private], created_at)
Post(id, author_id, kind[session|text|meetup], session_id?, meetup_id?, text, created_at)
Stoke(post_id, user_id, created_at)
Comment(id, post_id, user_id, text, created_at)

Meetup(id, host_id, spot_id, title, starts_at, description, level[beginner|all|advanced], gear_provided, capacity)
Rsvp(meetup_id, user_id, status[going|interested], created_at)

Gear(id, user_id, kind[webbing|tensioning|anchor|leash|other], name, length_m?, bought_on, retire_on, notes)
Notification(id, user_id, kind, actor_id, target_type, target_id, read_at, created_at)
Report(id, reporter_id, target_type, target_id, reason, status, created_at)
```

The demo's TypeScript types live in `src/store/types.ts` and mirror this shape.

## 7. Production architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile app | **Expo (React Native) + TypeScript**, Expo Router | One codebase for iOS and Android; the demo's React components and store logic port across with little change |
| Web | The same React code as a PWA (this demo is its seed) | Shareable spot and meetup links that open without an install |
| Backend | **Supabase**: Postgres + **PostGIS**, Auth, Storage, Realtime, Edge Functions | Geo queries ("spots within 20 km"), row-level security for gated rigging info, realtime presence for check-ins, low ops |
| Maps | **MapLibre** with MapTiler / OSM vector tiles | Open, cheap at our scale, offline packs later for remote highlines |
| Media | Supabase Storage → **Mux** (or Cloudflare Stream) for video | Clips are core; transcoding and adaptive streaming are hard to self-build |
| Push | Expo Notifications (APNs/FCM) | Meetup reminders, "friend on a line near you" |
| Search | Postgres full-text + PostGIS at first; Typesense later | Avoid infrastructure until it's needed |
| Analytics | PostHog | Funnels, retention, feature flags |
| Errors | Sentry | Mobile and edge function errors |
| CI/CD | GitHub Actions + EAS Build/Submit | The repo already runs typecheck, tests and build on every push |

**Key backend rules**

- `spots.rigging_info` is readable only when `auth.uid()` is a verified rigger (RLS policy); `sensitivity = 'hidden'` spots return fuzzed coordinates to non-members.
- Check-ins expire through a scheduled function (3 h), and presence is broadcast over Realtime channels per city.
- The feed is fan-out-on-read at MVP scale: posts from follows plus spots near you, ranked by recency with a light boost for full sends and meetups.
- Rate limits on posting, reviews and reports; new accounts can't add highline spots for 7 days.

## 8. Build plan

| Phase | Weeks | Goal | Deliverables | Exit criteria |
| --- | --- | --- | --- | --- |
| **0. Demo & validation** | 1–2 | Prove the concept with real slackliners | This clickable demo; 10–15 interviews at Zoo Lake / Emmarentia / Cape Town; a waitlist page | 60%+ of interviewees say they'd use check-ins or the logbook weekly; 200 waitlist sign-ups |
| **1. Foundations** | 3–5 | Real accounts and data | Expo app shell, Supabase schema + RLS, auth (Apple/Google/email), profiles, follow, seeded spots for 2 cities | Internal team can sign up and follow each other on TestFlight / Play internal |
| **2. Spots & sessions** | 6–8 | The core content loop | MapLibre map, spot CRUD + reviews, session logging with photos, feed v1, stokes and comments | 30 beta users log 3+ sessions each in 2 weeks |
| **3. Live & meetups** | 9–11 | The social and network effects | Check-ins with realtime presence, meetups + RSVP, push notifications, notification centre | 40% of beta users check in at least once a week |
| **4. Safety & trust** | 12–13 | Earn the riggers' trust | Rigger verification flow, gated rigging info, reporting and moderation queue, gear locker + retirement reminders | No safety-critical info visible to unverified users (audited); moderation SLA under 24 h |
| **5. Public launch (SA)** | 14–16 | Launch in Johannesburg and Cape Town | Video clips (Mux), onboarding polish, App Store / Play listing, launch with local organisers and a jam | 1,000 sign-ups, 25% week-4 retention |
| **6. Grow** | 17+ | Expand cities and depth | Trick library, challenges, festival pages, gear marketplace pilot, offline maps | Organic growth into 3 more scenes |

### Team (lean)

- 1 full-stack / mobile engineer (Expo + Supabase), 1 product designer (part-time), 1 community lead (an organiser from the local scene), plus a founder covering product and growth.

### Rough running costs at MVP scale (under 5k users)

Supabase Pro, Mux (pay as you go), MapTiler, Apple and Google developer accounts, PostHog / Sentry on free tiers. Most of these are free or cheap at this size; check each provider's current pricing before budgeting.

## 9. Metrics

- **North star:** weekly active walkers, meaning users who log a session or check in during the week.
- **Inputs:** sessions logged per WAU · check-ins per city per week · meetup RSVPs · % of posts that get a stoke or comment within 24 h · spots added and reviewed.
- **Health:** week-1 and week-4 retention, time to log a session, report rate per 1k posts.

## 10. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| **Cold start**: empty feeds and maps | Launch city by city with organisers; pre-seed spots; meetups as the hook; import public spots where licences allow |
| **Safety liability** from bad highline info | Gated rigging info, verified riggers, hazard flags, clear disclaimers, no "how to rig" content from unverified users |
| **Access conflicts** with landowners and parks | Sensitive/hidden spots, community access notes, partnership with national slackline associations |
| **Small niche** limits growth | Low-cost stack; the model extends to adjacent communities (climbing, bouldering) later |
| **Video costs** | Cap clip length (60 s) and resolution at MVP; transcode on demand |
| **Instagram gravity** | One-tap export of session cards to Stories, so Linewalk content travels to where the audience already is |

## 11. Monetisation (later, not in MVP)

1. **Linewalk Pro** (small monthly fee): advanced stats, offline maps, unlimited clip length, gear reminders.
2. **Organiser tools**: paid events and ticketing (take rate).
3. **Brand partnerships**: gear launches and sponsored challenges, clearly labelled.

## 12. What the demo does and doesn't do

**Does:** every MVP flow above, on seeded Johannesburg / Cape Town data. Your actions (logging, stoking, RSVPs, follows, added spots and gear) persist in your browser's local storage. Settings → *Reset demo data* starts over.

**Doesn't:** real accounts, a server, real map tiles (the demo draws a stylised map so it runs anywhere, including sandboxed previews), video upload or push notifications. These are covered in phases 1–5 above.
