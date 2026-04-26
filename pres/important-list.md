# Important List For Judge Demo

This is an internal checklist for what you should definitely show a judge and what you should definitely say out loud.

The goal is not to show every feature. The goal is to show the parts that make the app feel technically real, product-complete, and differentiated.

## 1. The Core Story

If you only get one sentence:

> RoRadar takes scattered public Roblox signals and turns them into an explainable, parent-readable safety report, with deterministic scoring and AI used only to validate ambiguous outside evidence.

## 2. What You Should Definitely Show

### 1. Search -> instant profile assessment

Show:

- landing page
- search bar
- enter a Roblox username
- open the report page

Why it matters:

- this makes the product legible immediately
- it shows the app is not a mock dashboard, it is driven by a real input
- it establishes the user journey in one action

What to say:

> A parent starts with nothing but a Roblox username, and we turn that into a structured safety snapshot.

### 2. The main report layout

Show:

- profile identity
- overall score
- summary text
- notes
- flagged friends
- flagged games

Why it matters:

- this is the main product surface
- it proves the app is not just a single score, but a readable decision-support interface

What to say:

> We do not just output a score. We give the parent a prioritized report with context.

### 3. Friend scoring exists and is explainable

Show:

- flagged friends section
- if useful, `Show all scored friends`
- click a friend to open the factor modal

What to point out:

- account age
- profile-language scan
- mutual friend overlap
- friend graph velocity

Why it matters:

- this is one of the clearest signals that the app is doing actual graph analysis, not just game scanning

What to say:

> Friend scoring is based on public account and network signals like account age, overlap, and friend-growth behavior.

### 4. Game scoring breakdown

Show:

- flagged games section
- `Show all scored games`
- open a game detail modal

What to point out:

- factor-by-factor scoring
- observed value
- contribution
- observed signals
- source pages

Why it matters:

- this is where the product becomes explainable instead of black-box
- judges can see the scoring is decomposed into interpretable factors

What to say:

> Every game score is decomposed into factors, so a parent can see what actually drove the risk rather than trusting a black-box number.

### 5. Wide web search with stage badges

Show:

- the `Wide web safety search` factor
- press `Refresh search`
- let the judge see:
  - `Searching the web`
  - `Reviewing evidence`

Why it matters:

- it visually proves there is a multi-stage backend flow
- it shows this is not static data
- it makes the AI use feel purposeful

What to say:

> We separate retrieval from validation. First we search the wider web, then we validate whether those results are actually about this exact game.

### 6. Explain that AI is narrow and defensive

You do not need to show code for this. Just say it clearly while the wide-web factor is open.

What to say:

> The core score is deterministic. AI is only used as a second-pass classifier so generic Roblox safety articles do not get mistaken for evidence about a specific game.

Why it matters:

- this is one of the strongest technical credibility points in the whole app
- it answers the “is this just vibes-based AI?” concern before judges ask it

### 7. Saved child -> dashboard flow

Show:

- `Save as Child`
- dashboard entry exists
- optional delete icon

Why it matters:

- it shows the product is not just a one-off scanner
- it proves account-backed workflow and persistence

What to say:

> Parents can save accounts they are actively monitoring and come back to them later from a dashboard.

### 8. PDF preview and download

Show:

- `Preview PDF Report`
- embedded PDF modal
- `Download PDF`

Why it matters:

- it turns the project from “analysis page” into “reporting tool”
- it makes the product feel complete and real-world usable

What to say:

> We do not stop at on-screen analysis. Parents can export a readable report they can revisit or share inside a family decision-making context.

## 3. Strongest Novelty Points

These are the highest-value technical/product points to say explicitly.

### Deterministic scoring plus narrow AI validation

Say this:

> The key architectural choice was separating deterministic scoring from AI evidence validation. The score itself is explainable, and the model is only used where ambiguity is highest.

Why it is strong:

- sounds disciplined
- shows technical judgment
- differentiates the app from “just put everything into an LLM”

### Multi-source corroboration

Say this:

> We combine first-party Roblox signals with community discussion and optional wider web corroboration instead of trusting a single source.

Why it is strong:

- communicates robustness
- frames the app as an evidence system, not a scraper

### Cached expensive search

Say this:

> Wider web searches are cached, so once a game has been searched we can reuse that evidence without repeatedly spending live search credits.

Why it is strong:

- shows operational maturity
- shows you thought about cost and latency

### Shared factor model across UI and PDF

Say this:

> The same factor schema powers the on-screen modal and the exported report, so the explanation layer stays consistent across the whole product.

Why it is strong:

- good architecture point
- proves the product is not stitched together separately for demo surfaces

### Graceful degradation

Say this:

> If a search provider or external service is unavailable, the app fails neutral instead of inventing risk.

Why it is strong:

- shows maturity
- judges often notice this as a “real product” trait

## 4. Recommended Demo Order

Use this order unless time is extremely short.

1. Landing page -> search a username
2. Main profile report
3. Flagged friends quick explanation
4. Flagged games -> open one game detail
5. Run wide web refresh and show the stage badges
6. Mention the deterministic score + narrow AI validation
7. Save as Child -> Dashboard
8. Open PDF preview -> show download

This order works because:

- it starts from the simplest user action
- it escalates into the most technically interesting part
- it ends with persistence and export, which makes the product feel complete

## 5. If You Only Have 60 Seconds

Show only these:

1. Search a username
2. Main report with overall score + sections
3. Open one game detail modal
4. Point at factor contributions and source pages
5. Mention AI only validates ambiguous outside evidence
6. Show PDF preview button or dashboard save quickly if time remains

## 6. If A Judge Asks “What’s Hard Here?”

Good answers:

- pulling together multiple unreliable public sources into one coherent assessment
- keeping the score explainable instead of black-box
- validating that outside web evidence is truly about the exact game
- caching expensive searches so the system is usable in practice
- presenting risk as a readable report instead of just raw signals

## 7. If A Judge Asks “Why Not Just Use AI For Everything?”

Say this:

> Because the most important part of this product is trust. Parents need to know why something was flagged. So we keep the core score deterministic and only use AI for the ambiguity problem: deciding whether wider web evidence is actually about the same game.

## 8. What To Be Careful About

These are real constraints. Do not volunteer them unless relevant, but if asked, answer honestly.

- Recent-play history is not part of the live game inputs right now.
- The app mainly uses public Roblox data and public corroboration sources.
- The “friends” and “games” refresh buttons currently trigger a full assessment rebuild behind the scenes.
- The schema has forward-looking tables that are not all deeply used yet.

These are not fatal. Just do not oversell beyond what is live.

## 9. Best Closing Line

If you want a strong closing sentence:

> RoRadar turns noisy public Roblox signals into an explainable parent workflow: search, investigate, save, and export.
