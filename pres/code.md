# RoRadar Codebase Deep Dive

This file is an internal architecture walkthrough for understanding the codebase well enough to explain it clearly to judges, teammates, or future maintainers.

It is intentionally practical. The goal is not to restate marketing copy. The goal is to answer:

- What actually runs first?
- How does a Roblox username become a scored report?
- Which files own which responsibilities?
- Where do external services fit into the pipeline?
- What is rendered on the server vs the client?
- How do refreshes, saved children, and PDF export actually work?

## 1. High-level mental model

RoRadar is a `Next.js App Router` application that turns public Roblox signals into a parent-readable safety assessment.

At the highest level, the system has five layers:

1. **Routing and rendering**
   - Next.js pages and route handlers decide what HTML or API response to return.
2. **UI orchestration**
   - React client components manage interaction state: refreshes, dialogs, report preview, toggles, and settings.
3. **Assessment engine**
   - Scoring logic converts Roblox profile/game/friend data into risk factors and aggregate scores.
4. **Integrations**
   - Roblox public APIs, Reddit, DevForum, Tavily, and Gemma provide evidence inputs.
5. **Persistence**
   - Supabase stores account-backed saved children and cached wide-web search results.
   - `localStorage` stores device-only preferences and fallback saved-child data.

The app is deliberately split so the **UI does not perform scoring itself**. The browser asks the server for assessments, and the server returns structured results.

## 2. Stack and runtime assumptions

From `package.json`, the app uses:

- `Next.js 16.2.4`
- `React 19.2.4`
- `TypeScript 5`
- `Tailwind CSS 4`
- `@base-ui/react` and some `@radix-ui/*` pieces for primitives
- `Auth0` for authentication
- `Supabase` for persistence
- `pdf-lib` for PDF generation
- `cheerio` and `html-entities` for HTML parsing / cleanup
- `sonner` for toasts

Important operational assumption:

- This is a server-heavy app.
- Most meaningful work happens on the server: Roblox lookup, scoring, Reddit/DevForum scans, Tavily search, Gemma classification, Supabase persistence, and PDF generation.

## 3. Top-level directory map

### Root

- `src/`
  - all application code
- `supabase/migrations/`
  - database schema and cache-table migrations
- `docs/`
  - public-facing rubric docs
- `pres/code.md`
  - this internal walkthrough

### `src/app/`

This is the App Router surface.

- `layout.tsx`
  - root HTML shell, fonts, nav, footer, providers
- `page.tsx`
  - landing page
- `about/page.tsx`
  - marketing/about page
- `privacy/page.tsx`
  - privacy policy
- `terms/page.tsx`
  - terms of use
- `dashboard/page.tsx`
  - saved-child dashboard
- `user/[name]/page.tsx`
  - main profile assessment page
- `user/[name]/loading.tsx`
  - loading skeleton for the user page
- `auth/error/page.tsx`
  - sign-in failure diagnostics page
- `api/...`
  - server endpoints used by the UI

### `src/components/`

- `landing/search-hero.tsx`
  - landing search form
- `assessment/assessment-shell.tsx`
  - main client orchestrator for the profile page
- `assessment/risk-detail-dialog.tsx`
  - friend/game factor detail modal
- `assessment/report-preview-dialog.tsx`
  - embedded PDF preview modal
- `dashboard/saved-children-grid.tsx`
  - dashboard list UI and delete behavior
- `legal/legal-page-shell.tsx`
  - shared legal page layout
- `site-nav.tsx`, `site-footer.tsx`, `site-settings-dialog.tsx`
  - chrome and device settings
- `preferences-provider.tsx`
  - theme / reduced-motion / wide-web-search preference store
- `ui/*`
  - local design-system primitives

### `src/lib/`

This is the real backend/business-logic layer.

- `assessment.ts`
  - friend/game/profile scoring engine
- `roblox.ts`
  - Roblox public API and scraping accessors
- `game-sentiment.ts`
  - Reddit / DevForum / Tavily / Gemma corroboration logic
- `gemma.ts`
  - Gemini API adapter for Gemma classification
- `tavily.ts`
  - Tavily search adapter
- `reports.ts`
  - text and PDF report generation
- `auth0.ts`
  - Auth0 setup and session helpers
- `saved-children-store.ts`
  - Supabase-backed saved-child persistence
- `saved-children.ts`
  - `localStorage` fallback persistence
- `wide-web-cache-store.ts`
  - Supabase cache for wide-web searches
- `supabase/*`
  - client factories for browser/server/admin contexts
- `types.ts`
  - shared domain models
- `risk.ts`
  - score-to-level/color helpers
- `assessment-thresholds.ts`
  - surfaced-risk thresholds and list limits
- `format.ts`
  - timestamps, compact numbers, slugging
- `preferences.ts`
  - preference keys and pre-hydration bootstrap script
- `utils.ts`
  - `cn()` helper

### `src/proxy.ts`

This is effectively the app middleware layer. It delegates every request through Auth0 when Auth0 is configured.

## 4. Runtime entrypoints

There are three core entrypoints:

1. **Initial browser load**
   - handled by `src/app/layout.tsx`
2. **Profile page render**
   - handled by `src/app/user/[name]/page.tsx`
3. **On-demand API refreshes**
   - handled by `src/app/api/*`

### 4.1 `src/proxy.ts`

`proxy()` is the request-wide auth wrapper.

- If Auth0 is not configured, it just calls `NextResponse.next()`.
- If Auth0 is configured, it hands the request to `auth0.middleware(request)`.

This means the app supports two modes:

- **auth-enabled production mode**
- **graceful local / partial-config mode**

That pattern appears repeatedly throughout the codebase. Many features degrade cleanly rather than crashing.

### 4.2 `src/app/layout.tsx`

This is the true HTML root.

It does several important things:

1. Loads fonts with `next/font/google`
2. Calls `getSessionSafe()` server-side to see whether a session exists
3. Injects a preferences bootstrap `<script>` before React hydrates
4. Wraps the tree in `Providers`
5. Renders `SiteNav`, `main`, and `SiteFooter`

The most important subtle point:

- Theme and reduced-motion state are applied *before hydration* using `getPreferencesBootstrapScript()`.
- That prevents theme flicker and avoids a “dark after first paint” problem.

### 4.3 `src/app/providers.tsx`

This file layers two global client providers:

1. `PreferencesProvider`
2. `Auth0Provider` when auth is enabled

It also mounts the `sonner` toaster.

This means:

- app-wide device preferences are client-side global state
- auth user state is available to client components when configured
- toasts work anywhere in the component tree

## 5. Primary user flow: search -> assessment

This is the most important execution flow in the app.

### Step 1: landing page

`src/app/page.tsx` simply renders `SearchHero`.

`src/components/landing/search-hero.tsx` is a client component with:

- `username` local state
- `useDeferredValue(username.trim())`
- `useTransition()`
- `router.push("/user/[name]")` on submit

Nothing is scored here. It is just a search launcher.

### Step 2: server-rendered user page

`src/app/user/[name]/page.tsx` is a server component.

It does:

1. Decode the route param into a Roblox username
2. In parallel:
   - `buildUserAssessment(username)`
   - `getSessionSafe()`
3. Pass the finished result into `AssessmentShell`

If anything fails, it renders a friendly “profile not found / request declined” card.

This is important architecturally:

- the first full assessment is produced on the server, not incrementally in the browser
- the browser receives an already-scored initial object

### Step 3: the client shell takes over

`src/components/assessment/assessment-shell.tsx` owns all post-load interaction state.

Its internal state includes:

- `assessment`
- `refreshScope`
- `isSaving`
- `isReportPreviewLoading`
- `isReportPreviewOpen`
- `dialogSelection`
- `loadingGameDetailId`
- `wideWebLiveSearchStage`
- `showAllFriends`
- `showAllGames`

This component is the main “control room” of the UI.

It does not calculate scores directly. Instead, it:

- renders the server-produced assessment
- calls API routes when the user wants fresh data
- swaps new server responses into local state
- opens dialogs and preview flows

## 6. AssessmentShell behavior in detail

### 6.1 Refreshing the whole profile

`refreshAssessment(scope)` sends:

- `POST /api/assessments/users/[username]/refresh`

The body includes `scope`, but the current server route ignores that body and rebuilds the full assessment anyway.

So, in current behavior:

- “Refresh profile”
- “Refresh friends”
- “Refresh games”

all result in a complete `buildUserAssessment(...)` on the server.

The UI distinction is mostly:

- different spinners
- different success toast copy

This is worth mentioning if a judge asks whether partial refreshes are truly partial yet:

- **UI-wise yes**
- **backend-wise not yet; it currently rebuilds the whole assessment**

### 6.2 Opening a friend

Clicking a friend chip does not trigger a new API request.

Why:

- the friend factors are already present in the initial assessment payload
- `setDialogSelection({ kind: "friend", item: nextFriend })` is enough

So friend detail is a pure client-side modal open.

### 6.3 Opening a game

Clicking a game card is different.

`openGameDetail(game)` calls:

- `refreshGameDetail(game, wideWebSearchEnabled ? "prefer-cache" : "cache-only")`

That means game detail is enriched on demand.

### 6.4 Streaming game detail refresh

`refreshGameDetail(...)` calls:

- `POST /api/assessments/games/[gameId]/refresh`

with:

- `streamProgress: true`
- `wideWebSearchMode`

If the route streams progress, the client reads `response.body` as a stream and parses newline-delimited JSON events.

Possible events:

- `{ stage: "tavily" }`
- `{ stage: "gemma" }`
- `{ game: GameRiskSummary }`
- `{ error: string }`

This is a very important piece of UX architecture:

- the user sees real stage transitions
- the modal can badge “Searching the web” vs “Reviewing evidence”
- the final game object replaces the prior lightweight game summary

### 6.5 Saving a child

`saveChild()` checks login first.

Then it calls:

- `POST /api/assessments/users/[username]/save-child`

If the server responds with `storage: "local"`:

- it writes to device storage using `upsertSavedChild()`

If it responds with `storage: "supabase"`:

- it trusts the server-backed save and only shows a success toast

This is one of the cleaner examples of graceful fallback in the app.

### 6.6 PDF report preview

The shell computes:

- `reportPreviewBaseUrl`
- `reportPreviewUrl`
- `reportDownloadUrl`

`openReportPreview()` only opens the dialog and marks it loading.

The embedded PDF itself is fetched by the browser via the iframe inside `ReportPreviewDialog`.

### 6.7 Show-all toggles

Friends and games each have:

- flagged subset
- full scored set

The threshold is imported from `assessment-thresholds.ts`, so the UI and scorer use the same surfaced risk boundary.

## 7. API route surface

All app API endpoints are in `src/app/api`.

### 7.1 User assessment refresh

`POST /api/assessments/users/[username]/refresh`

- Calls `buildUserAssessment`
- Returns `{ assessment }`

### 7.2 Friend assessment refresh

`POST /api/assessments/friends/[friendId]/refresh`

- Calls `buildFriendAssessmentById`
- Returns `{ friend }`

This endpoint exists, but the main UI currently does not rely on it for friend modal opens.

### 7.3 Game assessment refresh

`POST /api/assessments/games/[gameId]/refresh`

- Calls `buildGameAssessmentById`
- Supports:
  - `wideWebSearchMode`
  - `streamProgress`
- Can return NDJSON stream events

This is the richest API route in the app.

### 7.4 Save child

`POST /api/assessments/users/[username]/save-child`

- Requires auth if auth is configured
- Resolves the Roblox profile again
- Builds a `SavedChildProfile`
- Persists via Supabase when available, otherwise returns `"local"`

### 7.5 Delete saved child

`DELETE /api/saved-children/[childId]`

- Requires auth
- Requires Supabase-backed persistence to be configured
- Deletes only within the current owner account

### 7.6 Text report export

`GET /api/reports/users/[username]`

- Builds a fresh assessment
- Converts it to plain text
- Returns a text attachment

### 7.7 PDF report export

`GET /api/reports/users/[username]/pdf`

- Builds a fresh assessment
- Builds a PDF with `pdf-lib`
- Returns inline or attachment depending on `?download=1`

### 7.8 Roblox profile resolve

`GET /api/roblox/users/[username]`

- Thin wrapper around `getRobloxUserByUsername`

## 8. Domain models

The shared models live in `src/lib/types.ts`.

The most important ones:

### `RobloxUserProfile`

Normalized Roblox user data used internally:

- id
- username / display name
- description
- created date
- avatar URL
- friend count
- verified badge
- Roblox profile URL
- account age in days

### `RobloxGameProfile`

Normalized game data:

- place ID
- universe ID
- name
- creator
- description
- thumbnail
- genres
- rating / votes
- created / updated timestamps
- private servers enabled
- association sources

### `RiskFactor`

This is the key UI/report abstraction.

Every factor has:

- `key`
- `label`
- `value`
- `active`
- `note`
- `contribution`
- optional `observedSignals`
- optional `observedSources`

Because both the UI dialogs and report generator consume the same factor shape, the app only needs to explain a signal once.

### `FriendRiskSummary` and `GameRiskSummary`

These are scored, presentation-ready summaries.

They are what the UI actually renders.

### `UserAssessment`

This is the top-level result returned to the profile page.

It includes:

- profile identity
- overall score and label
- summary and notes
- flagged friends / games
- full scored friends / games
- timestamps

## 9. Friend scoring engine

Friend scoring lives in `src/lib/assessment.ts`.

### Inputs used

For each friend, the app currently uses:

1. **Account age**
2. **Profile language**
3. **Mutual friend overlap**
4. **Friend graph velocity**

### 9.1 Account age

`getFriendAgeRisk(accountAgeDays)`

Risk bands:

- under 7 days -> very high risk
- under 30 days -> high
- under 180 days -> moderate
- older accounts -> low residual risk

### 9.2 Profile language

`friendLanguageSignalSpecs`

This scans the friend’s:

- username
- display name
- profile description

for terms like:

- Discord
- Snapchat
- Telegram
- dating
- DM me
- single
- Instagram
- boyfriend / girlfriend
- voice chat

It also adds a “throwaway-style username” heuristic when the username matches number-heavy patterns.

### 9.3 Mutual friend overlap

`evaluateFriendGraphRisk(...)`

This compares the friend’s public friend list against:

- the profiled user’s friend IDs
- the sampled friend peer set

The idea:

- a friend embedded in the same public network is less suspicious
- a friend with almost no overlap is more suspicious

### 9.4 Friend graph velocity

`getFriendVelocityRisk(...)`

This computes:

- `friend.friendCount / accountAgeDays`

Then increases concern for:

- very high friends/day
- especially when combined with zero overlap

### 9.5 Friend score composition

The weighted blend is:

- account age: `28%`
- profile language: `22%`
- mutual overlap: `30%`
- graph velocity: `20%`

The output is clamped to `0-100`.

### 9.6 Friend assessment output

`buildFriendAssessment(...)` wraps those factors into a `FriendRiskSummary` with:

- `score`
- `level`
- `factors`
- `lastAssessed`

## 10. Game scoring engine

Game scoring also lives in `src/lib/assessment.ts`.

### Inputs used

For each game, the app currently uses:

1. Public game source
2. Metadata language
3. Private server support
4. Community approval
5. External community discussion
6. Optional wide-web safety search

### 10.1 Public game source

This factor is informational only.

It explains whether the game came from:

- public favorites
- public created experiences
- direct place lookup

It contributes `0` points.

### 10.2 Metadata language

This is the largest direct game factor.

The app scans:

- game name
- game description
- genres

and weights social / roleplay terms using:

- `gameKeywordSignalSpecs`
- `gameGenreSignalSpecs`

Heavy signals:

- dating
- boyfriend / girlfriend
- roleplay
- motel
- sleepover
- voice chat

Lighter signals:

- hangout
- social
- friends

This is deliberate: generic terms add much less than obviously risky social framing.

### 10.3 Private servers

If private servers are enabled, the raw weight is `60`.
If not, it is `0`.

This is a secondary signal rather than the primary driver.

### 10.4 Community approval

`getCommunityApprovalBand(rating)`

Approval contributes only when weak.

- `<60` -> strong warning
- `60-75` -> moderate warning
- `75-90` -> light warning
- `90+` -> `0`

This avoids penalizing good games merely for existing.

### 10.5 External community discussion

This comes from Reddit + DevForum scanning through `getExternalCommunityScan(game.name)`.

The factor only adds score when:

- the game is actually named in the discussion
- stronger safety-relevant language is present

### 10.6 Wide web safety search

This factor is not part of bulk profile refresh by default.

It is meant for:

- game detail drill-down
- cached enrichment
- more expensive corroboration

Its behavior depends on `WideWebSearchMode`:

- `deferred`
  - don’t run; tell the user it exists
- `cache-only`
  - only use stored result
- `prefer-cache`
  - use cache first, then live search if needed
- `force-refresh`
  - bypass cache and run live search

### 10.7 Game score composition

The weighted blend is:

- metadata language: `50%`
- private servers: `15%`
- community approval: `10%`
- external community discussion: `25%`
- wide web search: additional `15%` only when loaded

Important nuance:

- the first four are the core score on normal profile refresh
- wide web is a detail-layer augmentation, not the default feed

### 10.8 Game assessment output

`buildGameAssessment(...)` produces a `GameRiskSummary` with:

- numeric score
- risk level
- full factor array
- metadata needed by cards/dialogs/reports

## 11. Overall profile scoring

`buildUserAssessment(username)` computes the top-level score.

Flow:

1. Resolve the profiled user
2. Fetch their public friends
3. Fetch their public games
4. Fetch the profiled user’s friend IDs
5. Fetch friend IDs for each sampled friend
6. Build all friend summaries
7. Build all game summaries
8. Surface only flagged subsets to default UI
9. Compute overall profile score from the top three available candidate scores

That final rule is important:

- the app does **not** average every friend and every game
- it takes the highest-signal items, sorts them, and averages the top three

This avoids having many neutral items wash out a few important warnings.

## 12. Roblox integration layer

All Roblox data access lives in `src/lib/roblox.ts`.

### 12.1 User lookup

`getRobloxUserByUsername(username)`

Flow:

1. POST to `users.roblox.com/v1/usernames/users`
2. get user ID
3. call `getRobloxUserById(id)`

`getRobloxUserById(id)` then fetches in parallel:

- user details
- avatar
- friend count

### 12.2 Friend lookup

`getRobloxFriends(userId, limit = 12)`

Flow:

1. fetch friend IDs
2. slice to limit
3. hydrate each friend into a full `RobloxUserProfile`

`getRobloxFriendIds(userId)` is the lighter version used for graph overlap math.

### 12.3 Game lookup for a user

`getRobloxGamesForUser(userId, limit = 8)`

Current public sources:

- favorite games
- public created experiences

These become `RobloxGameSeedEntry` records and are then merged/hydrated.

### 12.4 Game hydration

`hydrateRobloxGames(entries)`

This is the main Roblox game normalization step.

It:

1. deduplicates by universe ID
2. merges multiple association sources
3. fetches in parallel:
   - game details
   - game votes
   - game icons
   - private-server enablement flags
4. normalizes everything into `RobloxGameProfile`

### 12.5 Direct game lookup

`getRobloxGameByPlaceId(placeId)`

This is used for game detail refresh.

It first scrapes the public Roblox game page with `cheerio` to bootstrap:

- universe ID
- title
- description
- creator
- OG image
- OG URL
- coarse private-server hints

Then it rehydrates via the standard Roblox API path.

This two-step pattern exists because direct place-ID refresh starts from a place page rather than from a user’s favorite/game list payload.

## 13. External corroboration layer

This lives in `src/lib/game-sentiment.ts`.

There are really two different evidence systems here:

1. **community scan**
   - Reddit + DevForum
2. **wide-web scan**
   - Tavily + optional Gemma

### 13.1 Community scan logic

`getExternalCommunityScan(gameName)`

Internally it runs:

- `scanReddit(gameName)`
- `scanDevForum(gameName)`

Both are public fetches.

The code only keeps matches when:

- the text is about Roblox or the target game context
- the game title is actually mentioned
- stronger risk-language patterns appear

This is intentionally more conservative than a plain keyword search.

### 13.2 Wide-web scan logic

`getWideWebRiskScan(game, options)`

This is the expensive, staged path.

Order of operations:

1. check memory cache
2. check Supabase persisted cache
3. if live search is disallowed, return neutral
4. if Tavily is disabled, return neutral
5. run `scanWideWeb(...)`
6. persist the result to Supabase when possible
7. store it in memory cache

### 13.3 Wide-web query design

`buildWideWebSearchQueries(gameName)` emits three focused search families:

- grooming / predators / kids
- online dating / roleplay / safety
- sexualized content / inappropriate conversations

This is more precise than generic web search for the game name.

### 13.4 Ambiguous-title handling

The file does a lot of work to avoid false positives for generic names.

Key helpers:

- `normalizeText`
- `getSearchableGameName`
- `getWideWebSearchName`
- `buildWideWebTitleCandidates`
- `mentionsGameTitle`
- `mentionsAnyKnownGameTitle`

The main design goal is:

- don’t let generic platform-level “Roblox voice chat is risky” articles count as proof for a specific game called “Voice Chat Hangout”

### 13.5 Gemma’s role

Gemma is a **second-pass evidence classifier**, not the primary scorer.

The wide-web scan:

1. asks Tavily for candidates
2. prefilters candidates with rules
3. optionally sends the top candidates to Gemma
4. only keeps results Gemma marks as:
   - game-specific
   - risk-contributing
   - sufficiently confident

This is exactly where LLM use is most defensible in the product:

- not as the main score generator
- but as a disambiguation / evidence validation layer

## 14. Tavily adapter

`src/lib/tavily.ts`

This file is intentionally thin.

It exposes:

- `isWideWebGameScanEnabled()`
- `tavilySearch(request)`

Behavior:

- reads `TAVILY_API_KEY`
- requires `ENABLE_WIDE_WEB_GAME_SCAN === "true"`
- POSTs to Tavily `/search`
- throws rich errors when the API fails

This keeps provider details out of the scoring file.

## 15. Gemma adapter

`src/lib/gemma.ts`

This is also intentionally narrow.

It handles:

- API key discovery
- model name selection
- prompt construction
- schema-constrained JSON output
- classification parsing

### Why schema-constrained output matters

The code uses:

- `responseMimeType: "application/json"`
- `responseSchema`

That is important because prompt-only “please return JSON” approaches are less reliable.

### Returned classification shape

Each candidate gets:

- `id`
- `gameSpecific`
- `supportsRiskContribution`
- `riskCategory`
- `confidence`
- `rationale`
- `evidenceBullets`

The rest of the app treats this as validation metadata, not as a direct score by itself.

## 16. Persistence model

RoRadar has two persistence strategies:

1. **account-backed**
2. **device-local**

### 16.1 Saved children local fallback

`src/lib/saved-children.ts`

This uses `localStorage` key:

- `roradar.saved-children`

It supports:

- read
- write
- upsert
- remove
- legacy-key migration

This is used when server persistence is unavailable.

### 16.2 Saved children account-backed store

`src/lib/saved-children-store.ts`

This is the Supabase-backed path.

Important functions:

- `ensureAppUser(session)`
- `listSavedChildren(session)`
- `saveChildForSession(session, child)`
- `deleteSavedChildForSession(session, childId)`

The ownership key is:

- `session.user.sub`

So children are saved under the authenticated parent account, not under the Roblox child account.

### 16.3 Wide-web cache store

`src/lib/wide-web-cache-store.ts`

This persists expensive wide-web scan results keyed by `place_id`.

Stored fields include:

- game name
- normalized game name
- score
- matches
- searched sources
- fetched timestamp

This is what allows:

- no repeat Tavily spend for already-searched games
- cache-only behavior when live searches are disabled on a device

## 17. Supabase schema

The migrations are in `supabase/migrations/`.

### Core migration

`20260425133000_core_foundation.sql`

Creates:

- `app_users`
- `saved_children`
- `user_assessments`
- `friend_assessments`
- `game_assessments`
- `report_exports`

Important note:

- not every one of these tables is fully used yet by the runtime app
- the live code actively uses `app_users` and `saved_children`
- the assessment/report tables are schema foundation for further persistence or exports

### Wide-web cache migration

`20260426041000_game_wide_web_scans.sql`

Creates:

- `game_wide_web_scans`

This is live and used by the wide-web cache layer.

### RLS posture

The schema enables row-level security broadly.

For account-owned tables, policies are based on:

- `auth.jwt() ->> 'sub'`

which matches the Auth0 subject stored in app tables.

## 18. Auth architecture

`src/lib/auth0.ts`

This file centralizes auth configuration and failure behavior.

Important exports:

- `isAuth0Configured`
- `auth0`
- `getSessionSafe()`
- `getRequiredSession()`

### Behavior pattern

- If env is missing, auth is treated as unavailable rather than fatal.
- `getSessionSafe()` returns `null` on failure.
- `getRequiredSession()` throws when auth is required and absent.

### Callback handling

The Auth0 client config includes a custom `onCallback`.

If callback exchange fails:

- it logs diagnostic details
- it redirects to `/auth/error`
- it includes `error` and `cause` query params

That error page maps known failure causes into human-readable troubleshooting copy.

## 19. Report generation pipeline

This is in `src/lib/reports.ts`.

There are two outputs:

1. plain text report
2. PDF report

### 19.1 Text report

`buildReportText(assessment, options?)`

This converts the structured assessment into a line-oriented report.

It includes:

- profile header
- notes
- flagged friends
- flagged games
- factor breakdowns
- optional factor guidance paragraphs

This function is the semantic source for the PDF too.

### 19.2 PDF report

`buildReportPdf(assessment)`

This pipeline:

1. calls `buildReportText(..., { includeFactorGuidance: true })`
2. strips underline separators
3. embeds standard fonts
4. assigns styles based on line prefixes
5. wraps text to page width
6. sanitizes unsupported characters for WinAnsi fonts
7. paginates content
8. renders grouped game blocks full-width
9. adds headers and footers
10. returns raw PDF bytes

### 19.3 Why the PDF pipeline is custom

The app does not use HTML-to-PDF.

Instead it uses `pdf-lib` directly so it can:

- fully control layout
- avoid browser-specific rendering differences
- generate bytes entirely server-side

### 19.4 Character sanitization

`sanitizePdfText(...)` exists because Roblox titles can include characters that Helvetica/WinAnsi cannot encode.

The code maps unsupported characters like:

- speaker emoji
- house emoji
- curly quotes
- ellipses

into safe fallbacks before measuring or drawing text.

## 20. Device preferences and theming

Preferences are split into:

- theme
- reduced motion
- wide-web-search enabled

### Storage keys

Defined in `src/lib/preferences.ts`:

- `roradar.theme`
- `roradar.reduced-motion`
- `roradar.wide-web-search`

### Provider

`src/components/preferences-provider.tsx`

This uses `useSyncExternalStore` so preference reads are:

- reactive
- cross-tab aware
- consistent with `storage` events

### Bootstrap

`getPreferencesBootstrapScript()` is injected from the server in `layout.tsx` so the correct theme class is applied before React hydration.

## 21. UI primitives and design system

The `src/components/ui/` files are local wrappers around lower-level libraries.

Examples:

- `button.tsx`
  - Base UI button wrapped with CVA variants
- `dialog.tsx`
  - Base UI dialog wrapped with app styling and a shared close button pattern
- `avatar.tsx`
  - Base UI avatar with size variants

The class-merging helper is:

- `src/lib/utils.ts` -> `cn(...)`

The theme tokens, colors, radii, and shell utility live in:

- `src/app/globals.css`

There are two theme modes:

- dark
- light

Both are implemented via CSS custom properties rather than separate component trees.

## 22. Static / informational pages

These are straightforward server components:

- `about/page.tsx`
- `privacy/page.tsx`
- `terms/page.tsx`

The privacy and terms pages share:

- `src/components/legal/legal-page-shell.tsx`

So the legal-page content is mostly data arrays rendered through a common template.

## 23. Execution flow summaries

### Flow A: initial profile load

1. User submits username on landing page
2. Router navigates to `/user/[name]`
3. Server page calls `buildUserAssessment`
4. Roblox and evidence data are fetched
5. Friend/game scores are computed
6. Server renders page with `AssessmentShell`
7. Client hydrates and takes over interaction state

### Flow B: game detail open with cache allowed

1. User clicks a game card
2. `AssessmentShell` calls `/api/assessments/games/[gameId]/refresh`
3. Server may emit `tavily` stage
4. Server may emit `gemma` stage
5. Server returns enriched `GameRiskSummary`
6. Client replaces the game in local `assessment` state
7. Dialog renders full factor breakdown

### Flow C: save child

1. User clicks `Save as Child`
2. Client calls `/api/assessments/users/[username]/save-child`
3. Server checks auth
4. Server re-resolves Roblox user
5. Server saves to Supabase if configured
6. Otherwise client falls back to `localStorage`
7. Dashboard reflects either remote or local source depending on mode

### Flow D: PDF preview

1. User clicks `Preview PDF Report`
2. Modal opens
3. Embedded iframe requests `/api/reports/users/[username]/pdf`
4. Server rebuilds assessment fresh
5. Server generates PDF bytes with `pdf-lib`
6. Browser renders inline PDF
7. Optional separate download uses the same endpoint with `?download=1`

## 24. Resilience and fallback patterns

One of the strongest engineering patterns in this codebase is graceful degradation.

Examples:

- Auth0 missing -> app still renders, just disables signed-in actions
- Supabase missing -> save/dashboard fall back to device-local behavior
- Tavily missing -> wide-web factor becomes unavailable instead of crashing
- Gemma missing -> wide-web scan still works, just without the LLM validation pass
- Reddit/DevForum failures -> factor stays neutral
- Roblox partial failures -> some fields degrade to `n/a` or empty arrays

This matters when presenting the app because it shows the code is designed for partial availability, not only “perfect demo mode.”

## 25. What is live vs what is scaffolding

Live runtime features:

- landing search
- user assessment page
- friend scoring
- game scoring
- Reddit / DevForum corroboration
- Tavily wide-web search
- Gemma evidence validation
- saved children
- dashboard
- PDF preview + download
- theme / motion / wide-web settings

Schema or architecture present but not deeply used yet:

- `user_assessments`
- `friend_assessments`
- `game_assessments`
- `report_exports`

These are useful to mention as forward-compatible structure, but not as active core runtime storage today.

## 26. Current engineering constraints

There are a few important constraints worth understanding before presenting the architecture as if every layer is equally mature.

### 26.1 Partial refresh is not fully partial yet

The UI distinguishes profile, friend, and game refresh buttons, but the main user refresh route still rebuilds the full assessment object.

So:

- the interaction model supports scoped refreshes
- the current backend implementation still recomputes the full profile assessment

### 26.2 Public data access is the limiting factor

The code is structured to score game-related risk from public surfaces, but the live game pipeline currently relies on:

- public favorites
- public created experiences
- direct place lookup

not private recent-play history.

### 26.3 There is little automated test coverage

The repo currently does not have a meaningful application test suite.

The main quality gates today are:

- TypeScript
- ESLint
- manual browser verification
- live endpoint verification against real services

That means the architecture is coherent, but ongoing confidence currently depends more on disciplined manual validation than on regression tests.

### 26.4 External integrations can drift

Roblox public APIs, Reddit JSON search, DevForum search behavior, Tavily results, and Gemini/Gemma output shape can all change over time.

The code handles many failures gracefully, but those integrations are still operational dependencies.

## 27. Likely judge questions and the honest technical answer

### “Where does the score come from?”

From `src/lib/assessment.ts`. Friend and game scores are weighted blends of public signals, and the overall profile score is the average of the top three friend/game scores.

### “Is the AI generating the score?”

No. The score is rule-based. Gemma is only used as a second-pass validator for wide-web evidence so generic articles do not get miscounted as game-specific risk evidence.

### “What data is private?”

The app mainly uses public Roblox and public web data. Account-backed saved children and cached search results are stored in Supabase. Device preferences and local fallback saves are in browser storage.

### “Why is the architecture credible?”

Because the scoring engine is deterministic, the UI is separate from the scorer, expensive evidence scans are cached, and the app degrades gracefully when external services are unavailable.

## 28. Suggested reading order if you want to re-open the code later

If you want to rebuild this mental model quickly, read in this order:

1. `src/app/user/[name]/page.tsx`
2. `src/components/assessment/assessment-shell.tsx`
3. `src/lib/assessment.ts`
4. `src/lib/roblox.ts`
5. `src/lib/game-sentiment.ts`
6. `src/lib/gemma.ts`
7. `src/lib/tavily.ts`
8. `src/lib/reports.ts`
9. `src/lib/saved-children-store.ts`
10. `src/app/api/*`

That order follows the actual execution path of the app.

## 29. Shortest possible explanation of the whole app

If you need a 20-second technical summary:

> RoRadar is a Next.js app that server-renders a Roblox safety assessment from public Roblox profile data, public friend graph data, public game associations, and corroborating web evidence. The core scoring is deterministic and lives in `assessment.ts`; external evidence comes from Reddit, DevForum, and optional Tavily searches, with Gemma used only to validate whether wider-web matches are truly about the exact game. The browser layer is mainly an interaction shell for refreshes, saved children, evidence dialogs, and PDF report preview/download.
