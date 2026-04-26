# RoRadar 2.5-Minute Talk Track

## Full Version

> RoRadar is a parental awareness tool built for Roblox safety review. The main problem we focused on is that parents hear broad warnings about Roblox, but they usually have no way to tell where the actual risk is for one specific account. We wanted to turn scattered public signals into something readable, prioritized, and explainable.
>
> The flow is simple for the user: a parent searches a Roblox username, and our app builds a live assessment. Under the hood, we server-render that report in Next.js and pull in public Roblox profile data, public friend graph data, public game associations like favorites and created experiences, and outside corroboration from Reddit, DevForum, and optionally wider web search.
>
> The technical core is our scoring engine. Friend scoring looks at account age, profile-language signals, mutual friend overlap, and friend-graph velocity. Game scoring looks at metadata language, private-server support, approval signals, community discussion, and a deeper web-evidence layer. The important part is that the score itself is deterministic and explainable. Every score is broken into factors, every factor has observed signals, and those same factors flow into the UI and the exported report.
>
> We were careful about where we used AI. We do not use AI to invent the whole score. Instead, we use Gemma 4 as a second-pass classifier for wide web evidence. So if a search result mentions something generic like voice chat on Roblox, the model helps decide whether that page is really about the exact game we are assessing or whether it is just general platform chatter. That makes the evidence layer more credible and reduces false positives.
>
> On the product side, we also built account-backed saved children, cached wide web search results so we do not repeatedly spend API credits, an in-app PDF preview and download flow, and clear fallback behavior when some services are unavailable. So the app is not just a scraper; it is a full review workflow for parents.
>
> The outcome is a system that takes noisy public data and turns it into an explainable parent report that answers three questions: what was flagged, why it was flagged, and what deserves a closer look first.

## Demo Flow To Point At

1. Start on the landing page and explain that the input is just a Roblox username.
2. Open a user report and point out the overall score, flagged friends, and flagged games.
3. Open a game detail modal and show that the score is broken into factors with evidence.
4. Mention that wider web evidence is cached and can be refreshed on demand.
5. Open the PDF preview and explain that the same factor-level reasoning carries into the exported report.

## If A Judge Asks “What Makes This Technically Credible?”

- The main score is rule-based and explainable, not black-box AI.
- The AI layer is narrow and defensive: it validates ambiguous web evidence instead of generating the whole assessment.
- Expensive searches are cached.
- The system degrades gracefully when an external service is unavailable instead of fabricating risk.

## If A Judge Asks “What’s The Most Interesting Engineering Decision?”

> The most important engineering decision was separating deterministic scoring from AI evidence validation. That let us keep the core system explainable while still using a model where it has the most value, which is disambiguating messy outside evidence.
