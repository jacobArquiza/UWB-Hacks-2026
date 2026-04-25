# RoRadar

RoRadar is a parental awareness tool for Roblox safety. Phase 0 focuses on:

- a polished landing page and player-report flow
- live Roblox profile lookup for `KingRobloxsian20`
- a seeded live game card for `Grow a Garden`
- real Auth0 wiring for login/logout
- a Supabase schema scaffold that is ready to take over persistence later

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Add real Auth0 values if you want the login flow to work.
3. Add Supabase URL and anon key when you are ready to connect the project.
4. Start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Phase 0 behavior

- Landing search routes to `/user/[name]`.
- User reports use live Roblox identity and friends data, plus preview scoring.
- Game risk cards are seeded with `Grow a Garden` so the experience is fully navigable now.
- `Save as Child` stores data in browser local storage for this phase.
- `Download Report` exports a text snapshot. PDF generation is planned for P3.

## Supabase

The initial schema is in [supabase/migrations/20260425133000_phase0_foundation.sql](supabase/migrations/20260425133000_phase0_foundation.sql).

It creates:

- `app_users`
- `saved_children`
- `user_assessments`
- `friend_assessments`
- `game_assessments`
- `report_exports`

All tables have RLS enabled and use Auth0 `sub` as the ownership key.
