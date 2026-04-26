import { readWideWebScanCache, writeWideWebScanCache } from "@/lib/wide-web-cache-store";
import {
  isWideWebGameScanEnabled,
  tavilySearch,
} from "@/lib/tavily";
import type { RobloxGameProfile } from "@/lib/types";

type ExternalCommunitySource = {
  key: "devforum" | "reddit";
  label: string;
};

type ExternalCommunitySignalSpec = {
  label: string;
  pattern: RegExp;
  weight: number;
};

type ContextCueSpec = {
  label: string;
  pattern: RegExp;
  weight: number;
};

type ExternalCommunityMatch = {
  label: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  weight: number;
};

type ExternalCommunityScanResult = {
  available: boolean;
  score: number;
  searchedSources: string[];
  matches: ExternalCommunityMatch[];
};

type WideWebRiskScanResult = {
  attempted: boolean;
  available: boolean;
  score: number;
  searchedSources: string[];
  matches: ExternalCommunityMatch[];
  errorMessage?: string;
  fetchedAt?: string;
  persisted?: boolean;
  source?: "cache" | "live";
};

type RedditSearchResponse = {
  data?: {
    children?: Array<{
      data?: {
        permalink?: string;
        subreddit?: string;
        subreddit_name_prefixed?: string;
        title?: string;
        selftext?: string;
      };
    }>;
  };
};

type DevForumSearchResponse = {
  posts?: Array<{
    blurb?: string;
    topic_id?: number;
  }>;
  topics?: Array<{
    id?: number;
    title?: string;
    slug?: string;
    excerpt?: string;
    tags?: string[];
  }>;
};

const externalCommunitySources = [
  { key: "reddit", label: "Reddit" },
  { key: "devforum", label: "DevForum" },
] satisfies ExternalCommunitySource[];

const externalCommunitySignalSpecs = [
  { label: "grooming", pattern: /\bgroom(?:ing|er)?\b/i, weight: 68 },
  { label: "predatory", pattern: /\bpredator(?:y)?\b/i, weight: 62 },
  {
    label: "online dating",
    pattern: /\bonline dating\b|\boder(?:s)?\b/i,
    weight: 56,
  },
  { label: "dating", pattern: /\bdating\b/i, weight: 48 },
  { label: "condo", pattern: /\bcondo\b/i, weight: 44 },
  { label: "motel", pattern: /\bmotel\b/i, weight: 30 },
  { label: "roleplay", pattern: /\broleplay\b|\brp\b/i, weight: 28 },
  { label: "bypass", pattern: /\bbypass(?:ing|ed)?\b/i, weight: 24 },
  { label: "safe chat", pattern: /\bsafe\s?chat\b/i, weight: 22 },
  { label: "voice chat", pattern: /\bvoice\s?chat\b|\bvc\b/i, weight: 20 },
  { label: "hangout", pattern: /\bhangout\b/i, weight: 12 },
  { label: "chat", pattern: /\bchat\b/i, weight: 8 },
  { label: "social", pattern: /\bsocial\b/i, weight: 6 },
] satisfies ExternalCommunitySignalSpec[];

const predatoryContextCueSpecs = [
  { label: "online daters", pattern: /\bonline daters?\b/i, weight: 44 },
  { label: "17+", pattern: /\b17\+\b/i, weight: 34 },
  {
    label: "inappropriate behavior",
    pattern: /\binappropriate\b|\bsexual\b|\bexplicit\b/i,
    weight: 32,
  },
  {
    label: "sexualised content",
    pattern: /\bsexuali[sz]ed\b|\bsexuali[sz]ed content\b/i,
    weight: 34,
  },
  {
    label: "imitating sex",
    pattern: /\bimitat(?:e|ing|ed)\s+sex\b|\bimitat(?:e|ing|ed)\s+sexual acts?\b/i,
    weight: 28,
  },
  {
    label: "friend requests from strangers",
    pattern: /\bfriend requests?\b|\bstrangers?\b/i,
    weight: 18,
  },
  {
    label: "inappropriate conversations",
    pattern: /\binappropriate conversations?\b/i,
    weight: 24,
  },
  {
    label: "manipulation",
    pattern: /\bmanipulat(?:e|ing|ion)\b/i,
    weight: 22,
  },
  {
    label: "children targeted",
    pattern: /\bkids?\b|\bchildren\b|\bminors?\b/i,
    weight: 12,
  },
  { label: "grooming", pattern: /\bgroom(?:ing|er)?\b/i, weight: 40 },
  { label: "predator", pattern: /\bpredator(?:y)?\b/i, weight: 38 },
  { label: "condo", pattern: /\bcondo\b/i, weight: 36 },
  { label: "dating report", pattern: /\bdating\b|\boder(?:s)?\b/i, weight: 30 },
] satisfies ContextCueSpec[];

const solicitationContextCueSpecs = [
  {
    label: "solicitation language",
    pattern:
      /\b(can someone|looking for|looking 4|who wants to|join me|dm me|add me|pull up|come to|find .*people|any .*servers?)\b/i,
    weight: 18,
  },
  {
    label: "contact seeking",
    pattern: /\bfriend me\b|\badd me\b|\bdm\b|\bmessage me\b/i,
    weight: 14,
  },
] satisfies ContextCueSpec[];

const technicalMetaPatterns =
  /\b(feedback|guide|how to|tips|help|support|issue|bug|working|resource|dashboard|analytics|publishing|market report|remaking|beta|update|policy|rules?|localization|script|community space|documentation|report)\b/i;

const externalCommunityCacheTtlMs = 1000 * 60 * 60 * 6;
const wideWebCacheTtlMs = 1000 * 60 * 60 * 12;
const externalCommunityResultCache = new Map<
  string,
  {
    expiresAt: number;
    value: ExternalCommunityScanResult;
  }
>();
const externalCommunityInFlightCache = new Map<
  string,
  Promise<ExternalCommunityScanResult>
>();
const wideWebResultCache = new Map<
  string,
  {
    expiresAt: number;
    value: WideWebRiskScanResult;
  }
>();
const wideWebInFlightCache = new Map<string, Promise<WideWebRiskScanResult>>();

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNameTokens(name: string) {
  return Array.from(
    new Set(
      normalizeText(name)
        .split(" ")
        .filter((token) => token.length >= 4),
    ),
  );
}

const genericExternalTitleTokens = new Set([
  "avatar",
  "chat",
  "city",
  "club",
  "friend",
  "friends",
  "game",
  "games",
  "hangout",
  "headless",
  "life",
  "mic",
  "party",
  "play",
  "public",
  "roleplay",
  "sim",
  "simulator",
  "social",
  "town",
  "voice",
  "world",
]);

function getDistinctiveExternalTitleTokens(name: string) {
  return getNameTokens(name).filter(
    (token) => !genericExternalTitleTokens.has(token),
  );
}

function isRobloxCommunityLabel(label: string, gameName: string) {
  const normalizedLabel = normalizeText(label);

  if (/\broblox\b|\bblox\b|\brbx\b/.test(normalizedLabel)) {
    return true;
  }

  return getNameTokens(gameName).some((token) => normalizedLabel.includes(token));
}

function getSearchableGameName(gameName: string) {
  const withoutLeadingTags = gameName.replace(/^(?:\[[^\]]+\]\s*)+/, "").trim();
  const withoutLeadingSymbols = withoutLeadingTags.replace(/^[^A-Za-z0-9]+/, "");
  const leadingTextMatch = withoutLeadingSymbols.match(/[A-Za-z0-9][A-Za-z0-9'& ]*/);
  const leadingText = leadingTextMatch?.[0]?.trim() ?? withoutLeadingSymbols;
  const tokens = normalizeText(leadingText)
    .split(" ")
    .filter(Boolean);
  const trailingDecorativeTokens = new Set(["rp", "vc"]);

  while (
    tokens.length > 1 &&
    trailingDecorativeTokens.has(tokens[tokens.length - 1])
  ) {
    tokens.pop();
  }

  return tokens.join(" ") || normalizeText(gameName);
}

function getWideWebSearchName(gameName: string) {
  const withoutLeadingTags = gameName.replace(/^(?:\[[^\]]+\]\s*)+/, "").trim();
  const withoutLeadingSymbols = withoutLeadingTags.replace(/^[^A-Za-z0-9]+/, "");
  const cleaned = withoutLeadingSymbols
    .replace(/[^A-Za-z0-9'&+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || getSearchableGameName(gameName);
}

function buildWideWebTitleCandidates(gameName: string) {
  const wideWebName = getWideWebSearchName(gameName);
  const normalizedWideWebName = normalizeText(wideWebName);
  const candidates = [wideWebName];

  if (/\brp\b/.test(normalizedWideWebName)) {
    candidates.push(wideWebName.replace(/\brp\b/i, "roleplay"));
  }

  if (/\bvc\b/.test(normalizedWideWebName)) {
    candidates.push(wideWebName.replace(/\bvc\b/i, "voice chat"));
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function mentionsGameTitle(text: string, gameName: string) {
  const normalizedText = normalizeText(text);
  const normalizedName = normalizeText(gameName);
  const distinctiveTokens = getDistinctiveExternalTitleTokens(gameName);

  if (!distinctiveTokens.length) {
    return false;
  }

  if (normalizedName && normalizedText.includes(normalizedName)) {
    return true;
  }

  return distinctiveTokens.every((token) => normalizedText.includes(token));
}

function mentionsAnyKnownGameTitle(text: string, gameNames: string[]) {
  return gameNames.some((gameName) => gameName && mentionsGameTitle(text, gameName));
}

function collectExternalSignalMatches(text: string) {
  return externalCommunitySignalSpecs.filter((spec) => spec.pattern.test(text));
}

function formatMatchedSignals(matches: ExternalCommunitySignalSpec[]) {
  return matches
    .map((match) => `${match.label} (+${match.weight})`)
    .join(", ");
}

function collectContextCues(input: string, specs: ContextCueSpec[]) {
  return specs.filter((spec) => spec.pattern.test(input));
}

function sumWeights<T extends { weight: number }>(values: T[]) {
  return values.reduce((total, value) => total + value.weight, 0);
}

function getResultDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "web";
  }
}

function buildExternalCommunityMatch(params: {
  label: string;
  source: string;
  title: string;
  url: string;
  haystack: string;
  signalMatches: ExternalCommunitySignalSpec[];
  allowContextOnly?: boolean;
  minimumContextWeight?: number;
}) {
  const predatoryContextMatches = collectContextCues(
    params.haystack,
    predatoryContextCueSpecs,
  );
  const solicitationContextMatches = collectContextCues(
    params.haystack,
    solicitationContextCueSpecs,
  );
  const hasSignalMatches = params.signalMatches.length > 0;
  const predatoryContextWeight = sumWeights(predatoryContextMatches);
  const solicitationContextWeight = sumWeights(solicitationContextMatches);
  const contextWeight = predatoryContextWeight + solicitationContextWeight;
  const genericOnlySignal =
    hasSignalMatches &&
    params.signalMatches.every((match) =>
      ["roleplay", "hangout", "chat", "social", "voice chat"].includes(
        match.label,
      ),
    ) && !predatoryContextMatches.length;

  if (!predatoryContextMatches.length && !solicitationContextMatches.length) {
    return null;
  }

  if (!hasSignalMatches && !params.allowContextOnly) {
    return null;
  }

  if (
    !hasSignalMatches &&
    contextWeight < (params.minimumContextWeight ?? 0)
  ) {
    return null;
  }

  if (genericOnlySignal && !predatoryContextMatches.length) {
    return null;
  }

  const rawWeight = Math.min(
    60,
    (hasSignalMatches ? sumWeights(params.signalMatches) : 0) +
      predatoryContextWeight +
      solicitationContextWeight,
  );
  const contextLabel = predatoryContextMatches.length
    ? "Context pass: safety-risk discussion"
    : "Context pass: solicitation-style language";
  const signalSummary = hasSignalMatches
    ? `matched ${formatMatchedSignals(params.signalMatches)}`
    : "context-only article match";

  return {
    label: params.label,
    source: params.source,
    title: params.title,
    summary: `${contextLabel}; ${signalSummary}${predatoryContextMatches.length ? `; context ${predatoryContextMatches.map((cue) => cue.label).join(", ")}` : ""}${solicitationContextMatches.length ? `; solicitation ${solicitationContextMatches.map((cue) => cue.label).join(", ")}` : ""}`,
    url: params.url,
    weight: rawWeight,
  } satisfies ExternalCommunityMatch;
}

const wideWebExcludedDomains = [
  "roblox.com",
  "www.roblox.com",
  "reddit.com",
  "www.reddit.com",
  "devforum.roblox.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
];

function buildWideWebSearchQueries(gameName: string) {
  const searchName = getWideWebSearchName(gameName);

  return [
    `"${searchName}" Roblox grooming predators kids`,
    `"${searchName}" Roblox "online dating" roleplay safety`,
    `"${searchName}" Roblox sexualised content inappropriate conversations`,
  ];
}

async function fetchJson<T>(url: URL, userAgent: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": userAgent,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`External community request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function scanReddit(gameName: string) {
  const searchName = getSearchableGameName(gameName);
  const searchUrl = new URL("https://www.reddit.com/search.json");
  searchUrl.searchParams.set("q", `"${searchName}" Roblox`);
  searchUrl.searchParams.set("sort", "relevance");
  searchUrl.searchParams.set("limit", "6");

  const payload = await fetchJson<RedditSearchResponse>(searchUrl, "RoRadar/0.1");
  const matches = payload.data?.children ?? [];

  return matches
    .map((child) => {
      const data = child.data;

      if (!data) {
        return null;
      }

      const sourceLabel = data.subreddit_name_prefixed || data.subreddit || "Reddit";
      const haystack = `${data.title ?? ""}\n${data.selftext ?? ""}`;

      if (!isRobloxCommunityLabel(sourceLabel, gameName)) {
        return null;
      }

      if (!mentionsAnyKnownGameTitle(haystack, [gameName, searchName])) {
        return null;
      }

      const signalMatches = collectExternalSignalMatches(haystack);

      if (!signalMatches.length) {
        return null;
      }

      return buildExternalCommunityMatch({
        label: "Reddit",
        source: sourceLabel,
        title: data.title ?? "Reddit discussion",
        url: data.permalink
          ? `https://www.reddit.com${data.permalink}`
          : "https://www.reddit.com/search/?q=roblox",
        haystack,
        signalMatches,
      });
    })
    .filter((match): match is ExternalCommunityMatch => match != null);
}

async function scanDevForum(gameName: string) {
  const searchName = getSearchableGameName(gameName);
  const searchUrl = new URL("https://devforum.roblox.com/search/query.json");
  searchUrl.searchParams.set("term", `"${searchName}" Roblox`);

  const payload = await fetchJson<DevForumSearchResponse>(searchUrl, "Mozilla/5.0");
  const topicsById = new Map(
    (payload.topics ?? [])
      .filter((topic): topic is NonNullable<typeof topic> & { id: number } => {
        return typeof topic.id === "number";
      })
      .map((topic) => [topic.id, topic]),
  );

  return (payload.posts ?? [])
    .map((post) => {
      const topic =
        typeof post.topic_id === "number"
          ? topicsById.get(post.topic_id)
          : undefined;
      const topicContext = [
        topic?.title ?? "",
        topic?.excerpt ?? "",
        (topic?.tags ?? []).join(" "),
      ].join("\n");
      const haystack = [
        topicContext,
        post.blurb ?? "",
      ].join("\n");

      if (!mentionsAnyKnownGameTitle(topicContext, [gameName, searchName])) {
        return null;
      }

      const signalMatches = collectExternalSignalMatches(haystack);

      if (!signalMatches.length) {
        return null;
      }

      if (technicalMetaPatterns.test(topicContext)) {
        const predatoryContextMatches = collectContextCues(
          haystack,
          predatoryContextCueSpecs,
        );

        if (!predatoryContextMatches.length) {
          return null;
        }
      }

      const topicLabel = topic?.title ? `Topic: ${topic.title}` : "Topic match";
      const topicUrl =
        typeof post.topic_id === "number"
          ? `https://devforum.roblox.com/t/${topic?.slug ?? "topic"}/${post.topic_id}`
          : "https://devforum.roblox.com";

      return buildExternalCommunityMatch({
        label: "DevForum",
        source: topicLabel,
        title: topic?.title ?? "DevForum discussion",
        url: topicUrl,
        haystack,
        signalMatches,
      });
    })
    .filter((match): match is ExternalCommunityMatch => match != null);
}

async function scanWideWeb(gameName: string) {
  const titleCandidates = buildWideWebTitleCandidates(gameName);
  const payloads = await Promise.all(
    buildWideWebSearchQueries(gameName).map((query) =>
      tavilySearch({
        query,
        topic: "general",
        search_depth: "advanced",
        max_results: 4,
        include_answer: false,
        include_raw_content: "text",
        exclude_domains: wideWebExcludedDomains,
      }),
    ),
  );
  const seenUrls = new Set<string>();
  const results = payloads
    .flatMap((payload) => payload.results ?? [])
    .filter((result) => {
      if (!result.url || seenUrls.has(result.url)) {
        return false;
      }

      seenUrls.add(result.url);
      return true;
    });

  return results
    .map((result) => {
      const haystack = [
        result.title ?? "",
        result.content ?? "",
        result.raw_content ?? "",
      ].join("\n");

      if (!mentionsAnyKnownGameTitle(haystack, titleCandidates)) {
        return null;
      }

      const signalMatches = collectExternalSignalMatches(haystack);
      const predatoryContextMatches = collectContextCues(
        haystack,
        predatoryContextCueSpecs,
      );

      if (
        technicalMetaPatterns.test(`${result.title ?? ""}\n${result.content ?? ""}`) &&
        !predatoryContextMatches.length
      ) {
        return null;
      }

      return buildExternalCommunityMatch({
        label: "Wide web",
        source: getResultDomain(result.url),
        title: result.title || "Search result",
        url: result.url,
        haystack,
        signalMatches,
        allowContextOnly: true,
        minimumContextWeight: 40,
      });
    })
    .filter((match): match is ExternalCommunityMatch => match != null);
}

function buildWideWebCacheKey(placeId: number) {
  return `wide-web:${placeId}`;
}

function buildWideWebResult(
  matches: ExternalCommunityMatch[],
  options: {
    fetchedAt: string;
    persisted: boolean;
    source: "cache" | "live";
  },
) {
  return {
    attempted: true,
    available: true,
    score: Math.min(
      100,
      matches.slice(0, 3).reduce((total, match) => total + match.weight, 0),
    ),
    searchedSources: ["Tavily"],
    matches,
    fetchedAt: options.fetchedAt,
    persisted: options.persisted,
    source: options.source,
  } satisfies WideWebRiskScanResult;
}

async function fetchExternalCommunityScan(gameName: string) {
  const settledMatches = await Promise.allSettled([
    scanReddit(gameName),
    scanDevForum(gameName),
  ]);

  const availableSources = settledMatches
    .map((result, index) =>
      result.status === "fulfilled" ? externalCommunitySources[index].label : null,
    )
    .filter((label): label is string => label != null);
  const matches = settledMatches
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((left, right) => right.weight - left.weight);
  const score = Math.min(
    100,
    matches.slice(0, 3).reduce((total, match) => total + match.weight, 0),
  );

  return {
    available: availableSources.length > 0,
    score,
    searchedSources: availableSources,
    matches,
  } satisfies ExternalCommunityScanResult;
}

export async function getExternalCommunityScan(gameName: string) {
  const cacheKey = normalizeText(gameName);
  const cached = externalCommunityResultCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const inFlight = externalCommunityInFlightCache.get(cacheKey);

  if (inFlight) {
    return inFlight;
  }

  const promise = fetchExternalCommunityScan(gameName)
    .catch(() => ({
      available: false,
      score: 0,
      searchedSources: [],
      matches: [],
    }))
    .then((value) => {
      externalCommunityResultCache.set(cacheKey, {
        expiresAt: Date.now() + externalCommunityCacheTtlMs,
        value,
      });
      externalCommunityInFlightCache.delete(cacheKey);
      return value;
    });

  externalCommunityInFlightCache.set(cacheKey, promise);

  return promise;
}

export async function getWideWebRiskScan(
  game: Pick<RobloxGameProfile, "name" | "placeId" | "universeId">,
  options: {
    allowLiveSearch?: boolean;
    forceRefresh?: boolean;
  } = {},
) {
  const allowLiveSearch = options.allowLiveSearch ?? true;
  const forceRefresh = options.forceRefresh ?? false;
  const cacheKey = buildWideWebCacheKey(game.placeId);

  if (!forceRefresh) {
    const cached = wideWebResultCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  const inFlight = wideWebInFlightCache.get(cacheKey);

  if (inFlight) {
    return inFlight;
  }

  if (!forceRefresh) {
    const storedScan = await readWideWebScanCache(game.placeId);

    if (storedScan) {
      const value = buildWideWebResult(storedScan.matches, {
        fetchedAt: storedScan.fetchedAt,
        persisted: true,
        source: "cache",
      });

      wideWebResultCache.set(cacheKey, {
        expiresAt: Date.now() + wideWebCacheTtlMs,
        value,
      });

      return value;
    }
  }

  if (!allowLiveSearch) {
    return {
      attempted: false,
      available: false,
      score: 0,
      searchedSources: [],
      matches: [],
    } satisfies WideWebRiskScanResult;
  }

  if (!isWideWebGameScanEnabled()) {
    return {
      attempted: false,
      available: false,
      score: 0,
      searchedSources: [],
      matches: [],
    } satisfies WideWebRiskScanResult;
  }

  const promise = scanWideWeb(game.name)
    .then(async (matches) => {
      const fetchedAt = new Date().toISOString();
      const persisted =
        (await writeWideWebScanCache(game, {
          fetchedAt,
          matches,
          score: Math.min(
            100,
            matches.slice(0, 3).reduce((total, match) => total + match.weight, 0),
          ),
          searchedSources: ["Tavily"],
        })) ?? false;

      return buildWideWebResult(matches, {
        fetchedAt,
        persisted,
        source: "live",
      });
    })
    .catch((error) => ({
      attempted: true,
      available: false,
      score: 0,
      searchedSources: ["Tavily"],
      matches: [],
      errorMessage:
        error instanceof Error ? error.message : "Wide web search failed.",
    }))
    .then((value) => {
      if (value.available) {
        wideWebResultCache.set(cacheKey, {
          expiresAt: Date.now() + wideWebCacheTtlMs,
          value,
        });
      }

      wideWebInFlightCache.delete(cacheKey);
      return value;
    });

  wideWebInFlightCache.set(cacheKey, promise);

  return promise;
}
