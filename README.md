# CWL Base Assigner

A small tool for a Clash of Clans clan leader to run Clan War League base
assignments: pick a war size (5v5 / 15v15 / 30v30 / custom), which creates a
fixed set of numbered **attack slots**. For each slot you pick a **team
base** and an **enemy base** by tapping the numbered pips in the top bar,
and set how many **stars** that attack needs. A separate scouting section
lets you mark how many stars are realistically obtainable on each enemy
base, so hard bases are easy to spot before assigning.

Stack: **React + TypeScript (strict) + Tailwind** on the frontend,
**Node + Express + TypeScript (strict)** on the backend, **MongoDB** for
storage.

## Project layout

```
coc-cwl-assigner/
  server/   Express API (TypeScript, strict) + Mongoose models
  client/   React app (Vite, TypeScript strict, Tailwind)
```

## 1. Prerequisites

- Node.js 18+
- A local MongoDB instance. Easiest options:
  - Install MongoDB Community Edition and run `mongod` (default port 27017), **or**
  - Run it in Docker: `docker run -d -p 27017:27017 --name cwl-mongo mongo:7`

## 2. Backend setup

```bash
cd server
cp .env.example .env      # defaults already point at localhost:27017
npm install
npm run dev                # starts on http://localhost:4000
```

`GET http://localhost:4000/api/health` should return `{"status":"ok"}`.

## 3. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev                # starts on http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:4000`, so just open
`http://localhost:5173`.

## 4. Using the app

1. On first launch you'll be prompted to **start a new CWL** — give it a
   name (e.g. "August 2026 CWL"), pick 5v5 / 15v15 / 30v30 / custom, and
   optionally note your league tier. This creates a fixed set of attack
   slots (one per war size) and a scouting entry for every enemy base
   number, both defaulting to empty / 3-star.
2. **Fill a slot:** click an "Attack Slots" card to select it (it highlights
   gold). With a slot selected, tap a numbered pip under **Team Bases** in
   the top bar to set that slot's team base, then tap a pip under
   **Enemy Bases** to set its target. Each base number can only be used by
   one slot — taken pips grey out and are unclickable, and the server
   double-checks with a 409 response if two people click at once.
3. Set **stars needed** on each slot (1★/2★/3★, default 3) — this is your
   call on how many stars that attacker is expected to bring home.
4. Once both bases are set the slot is auto-marked complete and the app
   jumps you to the next open slot, so you can keep tapping through the
   whole roster quickly. Use **Clear** on a slot card to unassign it.
5. **Enemy Base Scouting** (bottom section): for each enemy base number,
   pick the max stars you think is realistically achievable (default 3).
   The panel below regroups all bases by that rating — e.g. "2 stars max:
   #1, #5, #8, #9, #10" — so you can see at a glance which bases are hard.
   Enemy pips in the top bar also carry a small colored dot showing this
   same rating (green = 3★, gold = 2★, red = 1★) while you're assigning.
6. Switch wars any time from the dropdown in the header, or start another
   one for next month.

## Notes on CWL formats

Per current (2026) Supercell rules: clans in **Master League I or below**
(or unranked) can choose 5v5, 15v15, or 30v30 war sizes; **Champion League**
clans are locked to 15v15. The war size can't be changed mid-season, so pick
carefully when you create the war. A "custom" option is included in case
Supercell runs a special-event format (e.g. an 11v11 seasonal event).

## API summary

| Method | Path                                       | Purpose                                          |
|--------|---------------------------------------------|---------------------------------------------------|
| GET    | `/api/wars`                                 | List wars                                          |
| POST   | `/api/wars`                                 | Create a war (also creates its slots + scouts)     |
| GET    | `/api/wars/:id`                              | Get one war                                        |
| GET    | `/api/wars/:id/summary`                      | Base-count summary for the stats bar               |
| DELETE | `/api/wars/:id`                              | Delete a war, its slots and its scouting data      |
| GET    | `/api/wars/:warId/slots`                     | List the fixed attack slots for a war              |
| PATCH  | `/api/slots/:id`                             | Set teamBaseNumber / enemyBaseNumber / starsNeeded |
| GET    | `/api/wars/:warId/enemy-scouts`              | List expected-star rating per enemy base           |
| PATCH  | `/api/wars/:warId/enemy-scouts/:baseNumber`  | Set expected stars for one enemy base              |

Slots and enemy-scout entries are generated automatically when a war is
created (one slot and one scout entry per base number, 1..size) — there's
no "add roster member" step since a slot's identity is just its position.

## Both TypeScript configs are strict

Both `server/tsconfig.json` and `client/tsconfig.json` have `strict: true`
plus extras (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noUnusedLocals`, etc.). Both projects currently type-check and build with
zero errors (`npm run build` in each folder).
