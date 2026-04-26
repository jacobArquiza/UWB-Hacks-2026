# RoRadar Scoring

This document explains the scoring rubric currently used by RoRadar in Phase 0.

It is a description of the scoring system the app actually runs today, not an aspirational roadmap.

## What the app is trying to do

RoRadar is a parent-facing triage tool. Its job is not to prove that a user, friend, or game is dangerous. Its job is narrower:

- surface public Roblox signals worth reviewing
- rank those signals so a parent knows what to inspect first
- explain the score instead of hiding the reasoning

That framing matters. A sensible parental-awareness score should be directional and explainable, not fake certainty.

## Core principles

The current rubric follows these rules:

- direct risk signals should count more than vague ones
- benign signals should not add risk just for existing
- missing data should usually be neutral
- the UI should show what was observed, not only the final score
- the overall profile score should not be dominated by a single standout if more context exists

Those principles are what make the rubric logical. The system is trying to order review priority, not declare guilt.

## Data sources used right now

### Friend scoring uses

- live Roblox user lookup
- account age
- profile language and username pattern checks
- public friend-graph overlap
- friend-count growth rate

### Game scoring uses

- public favorite games
- public created experiences
- public game name
- public description
- public genres
- whether private servers are enabled
- Roblox vote / approval data when available
- Reddit corroboration scans
- DevForum corroboration scans
- optional Tavily-backed wide web scans on direct game detail refresh
- optional Gemma 4 validation of wide web results before they count

### Not yet integrated into live scoring

- private recent-play history
- Roblox chat logs
- YouTube checks
- richer friend-interaction or recency analysis
- deeper creator / moderation history signals

So the system is only scoring what it can actually see.

## Risk bands

The app uses the same label thresholds everywhere:

- `80+` -> `High risk`
- `63-79` -> `Needs review`
- `35-62` -> `Watch list`
- `0-34` -> `Low concern`

These are presentation bands, not probability claims.

## Friend scoring

Each friend gets a `0-100` score.

### Formula

```text
friend_score =
  clamp(
    (account_age_risk * 0.28) +
    (profile_language_risk * 0.22) +
    (mutual_friend_overlap_risk * 0.30) +
    (friend_graph_velocity_risk * 0.20)
  )
```

`clamp` means the result is rounded and forced into the `0-100` range.

### 1. Account age risk

Banding:

- `< 7 days` -> `92`
- `< 30 days` -> `76`
- `< 180 days` -> `42`
- `180+ days` -> `12`

Why this is logical:

- very new accounts are easier to create and discard
- disposable accounts are more compatible with evasive behavior
- account age is a direct platform fact, not a soft guess

Why it gets the highest weight:

- it is harder to fake than presentation-style signals
- it maps to account disposability, which is relevant for safety triage

### 2. Profile language risk

The system scans the username, display name, and public description for stronger
signals such as:

- off-platform contact handoff:
  - `discord`
  - `snapchat`
  - `telegram`
  - `instagram`
- solicitation or dating framing:
  - `dm me`
  - `message me`
  - `single`
  - `dating`
  - `boyfriend`
  - `girlfriend`
- more adult-coded presentation terms:
  - `daddy`
  - `mommy`
  - `babe`
  - `lover`

It also still adds a small penalty for throwaway-style username patterns such as
long numeric suffixes.

Why this is logical:

- profile text is still weaker than platform facts, so it is not the biggest weight
- off-platform contact language is more meaningful than vague words like `king`
- weak naming evidence still counts, but only modestly

### 3. Mutual friend overlap risk

The system asks a graph question:

- does this friend appear embedded in the profiled user's wider public friend network?

It looks at:

- how many of the profiled user's other public friends also appear in this
  friend's public friend list
- how much overlap exists within the sampled friend set shown in the assessment

Why this is logical:

- friends with no visible overlap into the rest of the network are less anchored
- friends who are embedded across multiple public connections look less isolated
- this is a real graph signal, not a cosmetic heuristic

### 4. Friend graph velocity

The system computes:

```text
friends_per_day = friend_count / max(account_age_days, 1)
```

Then it raises risk more for:

- very young accounts with unusually large friend counts
- fast friend growth combined with zero visible mutual overlap

Why this is logical:

- raw friend count by itself is weak
- fast friend accumulation on a new or isolated account is more meaningful
- this is closer to an actual behavioral anomaly than the old placeholder

## Game scoring

Each scored game gets a `0-100` score.

### Formula

```text
game_score =
  clamp(
    (social_signal * 0.50) +
    (private_server_signal * 0.15) +
    (community_approval_signal * 0.10) +
    (external_community_signal * 0.25)
  )
```

This part of the system is stronger than the friend model because it is built from live public Roblox metadata rather than demo-only placeholders.

### The important game-scoring design change

Benign properties do not create risk by themselves.

That means:

- no strong social signal -> `0`
- private servers disabled -> `0`
- high public approval -> `0`
- missing vote data -> `0`
- no corroborating Reddit or DevForum match -> `0`
- external search failure -> `0`

This is more logical than assigning background risk to normal or clearly positive conditions.

## Game factor 1: social signal

This is the primary driver.

The scorer reads public game text and genres, then adds together weighted matches. Stronger terms count far more than generic ones.

### High-weight metadata signals

- `dating` -> `52`
- `boyfriend` -> `40`
- `girlfriend` -> `40`
- `roleplay` -> `38`
- `motel` -> `34`
- `sleepover` -> `28`
- `date` -> `26`
- `voice chat` -> `26`

### Medium-weight metadata signals

- `vc` -> `22`
- `hangout` -> `16`
- `party` -> `12`
- `club` -> `12`
- `vibe` -> `10`
- `cafe` -> `10`
- `school` -> `10`

### Low-weight metadata signals

- `chat` -> `8`
- `social` -> `6`
- `friend` / `friends` -> `4`

### Genre signal weights

- `dating` genre -> `24`
- `roleplay` genre -> `22`
- `hangout` genre -> `10`
- `social` genre -> `8`
- `party` genre -> `8`
- `life` genre -> `6`

The summed social signal is capped at `100` before the `0.50` multiplier is applied.

Why this is logical:

- not all words are equally meaningful
- `friend` is common and weak, so it should barely move the score
- `dating` and `roleplay` are much more specific to higher-interaction environments
- this lets the scorer distinguish between broad social language and more targeted risk-heavy contexts

This is also why common words are intentionally weak now: they should provide context, not dominate the outcome.

## Game factor 2: private servers

Banding:

- private servers enabled -> `60`
- private servers not enabled -> `0`

Why this is logical:

- private servers can move activity into less visible spaces
- that matters, but it is only a secondary concern
- a game should not receive risk points merely because it exists without this feature

## Game factor 3: community approval

Banding:

- no public vote data -> `0`
- rating below `60 / 100` -> `42`
- rating from `60` to `<75` -> `24`
- rating from `75` to `<90` -> `8`
- rating `90+` -> `0`

Why this is logical:

- poor approval can be a weak warning sign for low-quality or misleading experiences
- strong approval should not itself create risk
- missing vote data should be neutral, not suspicious

This addresses the earlier problem where a highly approved game could still inherit unnecessary risk points.

## Game factor 4: external community discussion

This factor looks for corroborating public discussion about the same game on:

- Reddit
- Roblox DevForum

The query uses the exact game title plus `Roblox`, then only adds score when the returned discussion still appears to be about that game and contains stronger risk-relevant language.

### Example external-discussion weights

- `grooming` -> `68`
- `predatory` -> `62`
- `online dating` / `oder` -> `56`
- `dating` -> `48`
- `condo` -> `44`
- `roleplay` -> `28`
- `safe chat` -> `22`
- `voice chat` -> `20`
- `chat` -> `8`

Each individual corroborating result is capped, and the external raw score is capped before the `0.25` multiplier is applied.

Why this is logical:

- public discussion can expose context the game's own metadata hides
- the scorer is conservative because a mere mention does not count
- relationship words that are too noisy in third-party chatter are intentionally excluded here
- weak generic language still stays weak here
- if the search layer fails, the factor stays neutral rather than inventing concern

## Game factor 5: detail-only wide web scan

When Tavily is configured, direct game detail refreshes can run a wider article and forum search beyond Reddit and DevForum.

When `GEMINI_API_KEY` is also configured, Gemma 4 runs as a second-pass classifier on those Tavily results.

Important rollout boundary:

- this currently runs only on direct game detail refresh
- it does not run during bulk profile refresh
- it can add a bounded score bonus only in that direct-detail path

Why this rollout is logical:

- it avoids slowing the whole profile page down
- it limits API spend
- it lets the parent explicitly ask for deeper evidence on a specific game

The Tavily pass stays conservative:

- it excludes Roblox, Reddit, DevForum, and YouTube because those are either already scored or intentionally deferred
- it still runs the same context pass before a result contributes risk
- strong safety-report context can count even when the article does not repeat the game's social keywords

The Gemma pass then makes one narrower judgment:

- is this result really about this exact game, or is it only about Roblox generally?

That matters most for generic titles such as `Voice Chat Hangout`, where keyword overlap alone can be misleading.

Why this is logical:

- Tavily is good at finding candidate pages
- regex rules are good at finding suspicious language
- Gemma is better at deciding whether the page is actually about the exact game instead of a broader Roblox issue
- cached Gemma-validated results can then be reused without spending new model calls

## Game factors that currently explain provenance rather than add score

Some rows appear in the UI with `0` contribution:

- `Public game source`

Why they still exist:

- parents should know why a game is on screen
- the UI should expose what was searched even when nothing corroborating was found
- transparency is useful even when the contribution is zero

## What still is not integrated into game scoring

Live game scoring still does not include:

- private recent-play history
- YouTube evidence
- richer creator-reputation or cross-game moderation history

## What gets surfaced in the UI

### Friends

- the default `Flagged Friends` shelf shows friends at `35+`
- then sorted descending
- then limited to the top `8`
- `Show all scored friends` reveals the full scored public friend list, including lower-score profiles

### Games

- the default `Flagged Games` shelf shows games at `35+`
- the list is sorted descending
- the default flagged shelf is capped at `6`
- `Show all scored games` reveals the full scored public list, including lower-risk items

Why this is logical:

- the default page should stay readable
- below-threshold items should still be inspectable instead of disappearing

## Overall profile score

The overall score is no longer driven by a single highest friend or highest game.

It now averages the top three available signals across scored friends and scored games.

### Formula

```text
overall_score =
  clamp(average(top_3_available(friend_scores + game_scores)))
```

If fewer than three scores are available:

- average the top `2` when two exist
- use the top `1` when only one exists
- use `0` when nothing is available

Why this is logical:

- it reduces the chance that one standout game or one standout friend overwhelms the whole profile
- it still respects the strongest signals
- it produces a broader summary of the profile instead of a one-item spike

That is closer to how a parent would actually reason about a profile.

## Why the rubric is logically defensible

The scoring structure is reasonable for this product because:

- it prioritizes observable Roblox signals over hidden speculation
- it gives the biggest weight to interaction-relevant game context
- it reduces the weight of generic words that are too common to mean much
- it lets outside discussion corroborate risk without letting chatter dominate the score
- it does not punish clearly benign conditions like high approval or disabled private servers
- it shows the evidence in the UI instead of hiding the mechanics
- it averages multiple top signals for the profile rollup instead of letting one item dominate everything

In short, it is trying to be a practical ranking system rather than an overconfident detector.

## Known limitations

The current model still has real constraints.

### Friend-model limitations

- the model still only sees public Roblox graph data, not recent interactions
- private chat or message behavior is still unavailable
- external corroboration for friends is still disabled

### Game-model limitations

- only public favorite and public created game associations are visible
- private recent-play history is not available
- metadata language can still miss context or overread it
- external corroboration is limited to Reddit and DevForum right now
- strong approval is helpful but never proof of safety

### Overall limitation

- scores are not probabilities
- scores are not moderation verdicts
- scores should not replace direct parent judgment

## Correct interpretation

The right mental model is:

- high score -> inspect first
- medium score -> keep under review
- low score -> lower urgency, not guaranteed safety

That is what the rubric is built to support.
