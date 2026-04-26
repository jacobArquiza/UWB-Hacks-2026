# Game Scoring Rubric

This document describes the current Phase 0 game-risk scoring used by RoRadar.

## Scope

- The scorer only looks at Roblox games exposed through the user's public favorite games and public created experiences.
- Private recent-play history is not available to this build.
- Reddit and DevForum corroboration are now part of the live scorer.
- An optional Tavily-backed wide web scan can run on direct game detail refresh.
- When `GEMINI_API_KEY` is configured, Gemma 4 validates those wide-web results before they count.
- YouTube discussion checks are still not integrated.

## Output

- Every scored game receives a `0-100` risk score.
- Scores are rounded and clamped into that range.
- The default `Flagged Games` shelf surfaces games at `35+`.
- `Show all scored games` reveals lower-scoring public matches as well.

## Formula

`final_score = (social_signal * 0.50) + (private_servers * 0.15) + (community_approval * 0.10) + (external_community * 0.25)`

The important design change is that benign signals do not add risk by themselves:

- no strong social signal -> `0`
- private servers disabled -> `0`
- strong public approval -> `0`
- no corroborating Reddit or DevForum match -> `0`
- external search outages -> `0`

That means a very normal, highly approved game can now legitimately score `0`.

## 1. Social signal

This is the primary driver.

RoRadar scans the public game name, description, and genres, then adds together weighted matches. Strong terms like `dating` and `roleplay` contribute far more than generic words like `friend` or `chat`.

### Higher-weight keyword examples

- `dating` -> `52`
- `boyfriend` / `girlfriend` -> `40`
- `roleplay` -> `38`
- `motel` -> `34`
- `sleepover` -> `28`
- `date` -> `26`
- `voice chat` -> `26`

### Mid-weight keyword examples

- `vc` -> `22`
- `hangout` -> `16`
- `party` -> `12`
- `club` -> `12`
- `vibe` -> `10`
- `cafe` -> `10`
- `school` -> `10`

### Low-weight keyword examples

- `chat` -> `8`
- `social` -> `6`
- `friend` / `friends` -> `4`

### Genre weights

- `dating` genre -> `24`
- `roleplay` genre -> `22`
- `hangout` genre -> `10`
- `social` genre -> `8`
- `party` genre -> `8`
- `life` genre -> `6`

The summed social score is capped at `100` before weighting.

Why this is logical:

- Not all social language is equally meaningful.
- `friend` is common and weak, so it should not push a game very far.
- `dating`, `boyfriend`, `girlfriend`, and `roleplay` are much more specific to higher-interaction contexts and deserve much more weight.

## 2. Private servers

Private servers are now a pure risk add-on rather than a universal background score.

Banding:

- private servers enabled -> `60`
- private servers not enabled -> `0`

Why this is logical:

- Private servers can make activity less visible.
- But a game should not receive risk points merely because it does not support them.

## 3. Community approval

Community approval is now correctional, not universal.

Banding:

- no public vote data -> `0`
- rating below `60 / 100` -> `42`
- rating from `60` to `<75` -> `24`
- rating from `75` to `<90` -> `8`
- rating `90+` -> `0`

Why this is logical:

- Poor approval can be a weak warning sign.
- Strong approval should not itself create risk.
- Missing approval data is handled neutrally.

## 4. External community discussion

This is a corroboration layer, not the main driver.

RoRadar now runs exact-title Roblox searches against:

- Reddit
- Roblox DevForum

It only adds risk when both of these conditions are true:

- the result still appears to be about the same game
- the result text includes stronger safety-relevant language

### External discussion examples

- `grooming` -> `68`
- `predatory` -> `62`
- `online dating` / `oder` -> `56`
- `dating` -> `48`
- `condo` -> `44`
- `roleplay` -> `28`
- `safe chat` -> `22`
- `voice chat` -> `20`
- `chat` -> `8`

Each corroborating result is capped, and the combined external raw score is capped before weighting.

Why this is logical:

- external discussion can reveal reputation or context not visible in the game's own metadata
- the check is conservative because it requires an actual risky-language match, not just a mention
- absence of corroborating discussion stays neutral
- if external search fails, the factor stays neutral instead of inventing risk

## 5. Not yet integrated

## 5. Direct-detail wide web scan

When `TAVILY_API_KEY` is configured and `ENABLE_WIDE_WEB_GAME_SCAN=true`, RoRadar can run a wider article and forum search when an individual game detail is refreshed.

Important rollout boundary:

- this is currently detail-only
- it is not part of bulk profile refresh yet
- it can add a bounded score bonus on that direct detail refresh

The reason for that rollout is pragmatic:

- it keeps full profile refreshes fast
- it keeps API spend under control
- it lets the app expose richer source links only when the parent drills into a game

The Tavily pass is still conservative:

- it excludes surfaces already handled separately, such as Reddit, DevForum, and Roblox itself
- it runs a second context pass before a result contributes anything
- a result can count from strong safety-report context alone, even if it does not repeat the game's own social keywords

When Gemma 4 is configured, it then validates whether a candidate page is really about the exact target game instead of Roblox generally. That extra pass is especially useful for generic titles where raw keyword overlap can overcount.

## 6. Not yet integrated

The following are still absent from live game scoring:

- private recent-play history
- YouTube discussion checks
- richer cross-game creator reputation scoring

## Interpretation

- A high score means the game deserves a closer look first.
- A low score means lower urgency, not guaranteed safety.
- The score is a parent-facing triage tool, not a moderation verdict.
