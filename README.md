# RoRadar

RoRadar is a parental awareness tool for Roblox safety. It combines live Roblox profile data, public friend-graph analysis, public game analysis, and optional wider web corroboration into a reviewable parent report.

## What it does

- live Roblox profile lookup
- public friend scoring using account age, profile language, mutual overlap, and friend-graph growth signals
- public game scoring using favorite games, created experiences, Roblox metadata, and public corroboration
- optional Tavily-backed wide web analysis with optional Gemma 4 validation on game detail refresh
- Auth0 login and account-aware saved-child dashboards
- Supabase-backed persistence with browser fallback when server credentials are unavailable
- in-app PDF report viewing and download

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Create an Auth0 `Regular Web Application`.
3. Add these Auth0 application URLs:
   Allowed Callback URLs: `http://localhost:3000/auth/callback`
   Allowed Logout URLs: `http://localhost:3000`
   Allowed Web Origins: `http://localhost:3000`
4. Add the real Auth0 values to `.env.local` if you want the login flow to work.
5. Rebuild or restart the app after changing Auth0 env vars.
6. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the
   server-only `SUPABASE_SERVICE_ROLE_KEY` when you are ready to connect the
   dashboard persistence flow.
7. Optional: add `TAVILY_API_KEY` and set
   `ENABLE_WIDE_WEB_GAME_SCAN=true` to enable the wider article/forum search
   on direct game detail refresh.
8. Optional: add `GEMINI_API_KEY` to let the wide web scan use Gemma 4 as a
   second-pass classifier so generic Roblox safety articles do not count as
   game-specific evidence.
9. Start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Product behavior

- Landing search routes to `/user/[name]`.
- User assessments use live Roblox identity, public friend graph scoring, and public game scoring.
- Game risk cards come from public Roblox game associations exposed through favorites and created experiences.
- The friend and game sections can expand to show all scored public associations, not just the default `35%+` flagged subset.
- Opening a game detail now triggers a deeper per-game refresh, including the
  optional Tavily-backed wide web scan and Gemma-backed evidence validation
  when configured.
- `Save as Child` writes to Supabase when `SUPABASE_SERVICE_ROLE_KEY` is set.
- Without that server key, the dashboard falls back to browser local storage.
- `View Report` opens an in-app PDF viewer and supports direct PDF download.

The current game scoring rubric is documented in [docs/game-scoring-rubric.md](docs/game-scoring-rubric.md).
The full app scoring spec is documented in [Scoring.md](Scoring.md).

## Supabase

The core schema is in [supabase/migrations/20260425133000_core_foundation.sql](supabase/migrations/20260425133000_core_foundation.sql).
The persisted wide-web cache schema is in [supabase/migrations/20260426041000_game_wide_web_scans.sql](supabase/migrations/20260426041000_game_wide_web_scans.sql).

It creates:

- `app_users`
- `saved_children`
- `user_assessments`
- `friend_assessments`
- `game_assessments`
- `report_exports`

All tables have RLS enabled and use Auth0 `sub` as the ownership key.
