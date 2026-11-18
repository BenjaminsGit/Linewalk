# Linewalk

**A social app for slackliners: find lines, log sessions, share sends, and meet people to walk with.**

This repo holds the product and build plan and a working, mobile-first front-end demo of the MVP.

- 📄 **Plan:** [`docs/PLAN.md`](docs/PLAN.md) covers the problem, users, core loops, MVP scope, data model, production architecture, phased build plan, metrics and risks.
- 📱 **Demo:** a React + TypeScript app running on seeded Johannesburg and Cape Town data. Everything you do persists in your browser.

## What's in the demo

| Area | Works in the demo |
| --- | --- |
| Feed | Following / Nearby / Meetups tabs, session posts with line stats, "stoke" reactions, comments, text posts, delete and report |
| Live | Check in at a spot; "on a line now" strip; check-ins expire after 3 h |
| Spots | Pan/zoom map with type filters and city switcher, spot detail, reviews with hazard tags, add a spot by tapping the map |
| Sessions | Log spot / type / length / height / outcome / notes / photo, then share or keep private |
| Meetups | Browse, RSVP (respects capacity), host a meetup |
| Profiles | Stats derived from the logbook (longest, highest, streak), follow/unfollow, find people |
| Gear | Gear locker with retirement dates and warnings |
| Safety | Midline/highline rigging info gated to **verified riggers**; verification flow (with a demo "approve me" shortcut); reports |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # reducer + selector unit tests
npm run build      # type-checks, then builds one self-contained dist/index.html
```

`dist/index.html` is fully self-contained (JS and CSS inlined), so you can open it straight from disk, host it on any static host, or attach it anywhere.

## Code map

```
src/
  store/        types.ts (domain model) · reducer.ts (all actions, pure) · selectors.ts · store.tsx (context + persistence)
  data/seed.ts  demo users, spots, sessions, meetups, gear
  lib/          router.tsx (in-memory stack router per tab) · geo.ts · format.ts · image.ts
  components/   MapView (pan/zoom map) · PostCard · LineArt (generated session art) · ui primitives · Icon
  screens/      Feed · PostDetail · Spots · SpotDetail · AddSpot · LogSession · Meetup · Profile · Misc (settings, notifications, people, onboarding)
docs/PLAN.md    the product & build plan
```

The demo's architecture is set up to port to production (see PLAN §7):

- `reducer.ts` actions map onto Supabase RPCs / inserts; selectors map onto queries and views.
- The per-tab stack router maps 1:1 onto Expo Router screens.
- `MapView` keeps the same props when it's swapped for MapLibre + vector tiles.

## Demo limitations

No real accounts or server, a stylised map instead of real tiles, photos only (no video), and no push notifications. These are covered in phases 1–5 of the plan.
