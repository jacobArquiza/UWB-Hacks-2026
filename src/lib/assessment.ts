import {
  surfacedFriendLimit,
  surfacedGameLimit,
  surfacedRiskThreshold,
} from "@/lib/assessment-thresholds";
import { clampScore, getRiskLevel } from "@/lib/risk";
import { getExternalCommunityScan, getWideWebRiskScan } from "@/lib/game-sentiment";
import {
  getRobloxFriendIds,
  getRobloxGameByPlaceId,
  getRobloxFriends,
  getRobloxGamesForUser,
  getRobloxUserById,
  getRobloxUserByUsername,
} from "@/lib/roblox";
import { isWideWebGameScanEnabled } from "@/lib/tavily";
import type {
  FriendRiskSummary,
  GameRiskSummary,
  RiskFactor,
  RobloxGameProfile,
  RobloxUserProfile,
  UserAssessment,
  WideWebSearchMode,
} from "@/lib/types";

type WeightedGameSignalSpec = {
  label: string;
  pattern: RegExp;
  source: "genre" | "keyword";
  weight: number;
};

type BuildGameScoringOptions = {
  wideWebSearchMode?: WideWebSearchMode;
  onWideWebStage?: (stage: "tavily" | "gemma") => void;
};

type WeightedFriendSignalSpec = {
  label: string;
  pattern: RegExp;
  weight: number;
};

type FriendGraphContext = {
  ownerUserId: number;
  ownerFriendIds: number[];
  sampledFriendIds: number[];
  friendIdsByUserId: Map<number, number[]>;
};

const gameKeywordSignalSpecs = [
  { label: "dating", pattern: /\bdating\b/i, source: "keyword", weight: 52 },
  { label: "boyfriend", pattern: /\bboyfriend\b/i, source: "keyword", weight: 40 },
  { label: "girlfriend", pattern: /\bgirlfriend\b/i, source: "keyword", weight: 40 },
  { label: "roleplay", pattern: /\broleplay\b/i, source: "keyword", weight: 38 },
  { label: "motel", pattern: /\bmotel\b/i, source: "keyword", weight: 34 },
  { label: "sleepover", pattern: /\bsleepover\b/i, source: "keyword", weight: 28 },
  { label: "date", pattern: /\bdate\b/i, source: "keyword", weight: 26 },
  { label: "voice chat", pattern: /\bvoice\s?chat\b/i, source: "keyword", weight: 26 },
  { label: "vc", pattern: /\bvc\b/i, source: "keyword", weight: 22 },
  { label: "hangout", pattern: /\bhangout\b/i, source: "keyword", weight: 16 },
  { label: "party", pattern: /\bparty\b/i, source: "keyword", weight: 12 },
  { label: "club", pattern: /\bclub\b/i, source: "keyword", weight: 12 },
  { label: "vibe", pattern: /\bvibe\b/i, source: "keyword", weight: 10 },
  { label: "cafe", pattern: /\bcafe\b/i, source: "keyword", weight: 10 },
  { label: "school", pattern: /\bschool\b/i, source: "keyword", weight: 10 },
  { label: "chat", pattern: /\bchat\b/i, source: "keyword", weight: 8 },
  { label: "social", pattern: /\bsocial\b/i, source: "keyword", weight: 6 },
  { label: "friends", pattern: /\bfriends?\b/i, source: "keyword", weight: 4 },
] satisfies WeightedGameSignalSpec[];

const gameGenreSignalSpecs = [
  { label: "dating", pattern: /\bdating\b/i, source: "genre", weight: 24 },
  { label: "roleplay", pattern: /\broleplay\b/i, source: "genre", weight: 22 },
  { label: "hangout", pattern: /\bhangout\b/i, source: "genre", weight: 10 },
  { label: "social", pattern: /\bsocial\b/i, source: "genre", weight: 8 },
  { label: "party", pattern: /\bparty\b/i, source: "genre", weight: 8 },
  { label: "life", pattern: /\blife\b/i, source: "genre", weight: 6 },
] satisfies WeightedGameSignalSpec[];

const friendLanguageSignalSpecs = [
  { label: "discord", pattern: /\bdiscord\b/i, weight: 42 },
  { label: "snapchat", pattern: /\bsnap(chat)?\b/i, weight: 40 },
  { label: "telegram", pattern: /\btelegram\b/i, weight: 36 },
  { label: "dating", pattern: /\bdating\b|\bdate\b/i, weight: 34 },
  {
    label: "direct messages",
    pattern: /\bdm me\b|\bdms open\b|\bmessage me\b|\bpm me\b/i,
    weight: 32,
  },
  { label: "single", pattern: /\bsingle\b/i, weight: 28 },
  { label: "instagram", pattern: /\binstagram\b|\binsta\b/i, weight: 28 },
  { label: "boyfriend", pattern: /\bboyfriend\b/i, weight: 26 },
  { label: "girlfriend", pattern: /\bgirlfriend\b/i, weight: 26 },
  { label: "daddy", pattern: /\bdaddy\b/i, weight: 24 },
  { label: "mommy", pattern: /\bmommy\b/i, weight: 24 },
  { label: "babe", pattern: /\bbabe\b/i, weight: 22 },
  { label: "lover", pattern: /\blover\b/i, weight: 22 },
  {
    label: "contact seeking",
    pattern: /\badd me\b|\btext me\b|\bcall me\b|\blooking for\b/i,
    weight: 20,
  },
  { label: "voice chat", pattern: /\bvoice\s?chat\b|\bvc\b/i, weight: 18 },
  { label: "tiktok", pattern: /\btiktok\b/i, weight: 16 },
  { label: "hot", pattern: /\bhot\b/i, weight: 14 },
] satisfies WeightedFriendSignalSpec[];

function roundContribution(score: number) {
  return Math.round(score * 10) / 10;
}

function sumScores(scores: number[]) {
  return scores.reduce((total, score) => total + score, 0);
}

function collectWeightedGameSignals(
  input: string,
  specs: WeightedGameSignalSpec[],
) {
  if (!input.trim()) {
    return [] as WeightedGameSignalSpec[];
  }

  return specs.filter((spec) => spec.pattern.test(input));
}

function collectWeightedFriendSignals(
  input: string,
  specs: WeightedFriendSignalSpec[],
) {
  if (!input.trim()) {
    return [] as WeightedFriendSignalSpec[];
  }

  return specs.filter((spec) => spec.pattern.test(input));
}

function describeFriendAgeBand(accountAgeDays: number) {
  if (accountAgeDays < 7) {
    return "Age band: under 7 days";
  }

  if (accountAgeDays < 30) {
    return "Age band: under 30 days";
  }

  if (accountAgeDays < 180) {
    return "Age band: under 180 days";
  }

  return "Age band: 180+ days";
}

function getCommunityApprovalBand(rating: number | null) {
  if (rating == null) {
    return {
      label: "No public vote data",
      value: 0,
    };
  }

  if (rating < 60) {
    return {
      label: "Approval below 60",
      value: 42,
    };
  }

  if (rating < 75) {
    return {
      label: "Approval from 60 to under 75",
      value: 24,
    };
  }

  if (rating < 90) {
    return {
      label: "Approval from 75 to under 90",
      value: 8,
    };
  }

  return {
    label: "Approval 90+",
    value: 0,
  };
}

function formatAssociationSources(sources: string[]) {
  return sources.length ? sources.join(" + ") : "Unknown source";
}

function formatExternalCommunityMatches(
  matches: Array<{ label: string; source: string; title: string; summary: string }>,
) {
  const counts = matches.reduce((map, match) => {
    const line = `${match.label}: ${match.title} (${match.source}) matched ${match.summary.split(" matched ")[1] ?? match.summary}`;
    map.set(line, (map.get(line) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return Array.from(counts.entries()).map(([line, count]) =>
    count > 1 ? `${line} (x${count})` : line,
  );
}

function formatWideWebMatchSignals(
  matches: Array<{ source: string; title: string; summary: string }>,
) {
  return matches.flatMap((match) => {
    const [tavilySummary, gemmaSummary] = match.summary.split("; Gemma confirmed ");
    const signals = [
      `Tavily Source: ${match.title} (${match.source})`,
      `Tavily Match: ${tavilySummary}`,
    ];

    if (gemmaSummary) {
      signals.push(`Gemma 4 Analysis: Gemma confirmed ${gemmaSummary}`);
    }

    return signals;
  });
}

function formatExternalCommunitySources(
  matches: Array<{ label: string; title: string; url: string }>,
) {
  const seen = new Set<string>();

  return matches
    .map((match) => ({
      label: `${match.label}: ${match.title}`,
      url: match.url,
    }))
    .filter((source) => {
      const key = `${source.label}::${source.url}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function getFriendAgeRisk(accountAgeDays: number) {
  if (accountAgeDays < 7) {
    return 92;
  }

  if (accountAgeDays < 30) {
    return 76;
  }

  if (accountAgeDays < 180) {
    return 42;
  }

  return 12;
}

function evaluateFriendGraphRisk(
  friend: RobloxUserProfile,
  context?: FriendGraphContext,
) {
  if (!context) {
    return {
      available: false,
      mutualCount: 0,
      sampledMutualCount: 0,
      risk: 0,
    };
  }

  const friendIds = context.friendIdsByUserId.get(friend.id);

  if (!friendIds) {
    return {
      available: false,
      mutualCount: 0,
      sampledMutualCount: 0,
      risk: 0,
    };
  }

  const ownerFriendIds = new Set(context.ownerFriendIds);
  const sampledFriendIds = new Set(context.sampledFriendIds);

  let mutualCount = 0;
  let sampledMutualCount = 0;

  for (const candidateId of friendIds) {
    if (
      candidateId !== context.ownerUserId &&
      candidateId !== friend.id &&
      ownerFriendIds.has(candidateId)
    ) {
      mutualCount += 1;
    }

    if (candidateId !== friend.id && sampledFriendIds.has(candidateId)) {
      sampledMutualCount += 1;
    }
  }

  let risk =
    mutualCount >= 8
      ? 8
      : mutualCount >= 4
        ? 22
        : mutualCount >= 2
          ? 40
          : mutualCount === 1
            ? 58
            : 78;

  if (sampledMutualCount >= 3) {
    risk = Math.max(8, risk - 12);
  } else if (sampledMutualCount === 0 && mutualCount === 0) {
    risk = 84;
  }

  return {
    available: true,
    mutualCount,
    sampledMutualCount,
    risk,
  };
}

function getFriendVelocityRisk(
  friend: RobloxUserProfile,
  graphRisk: ReturnType<typeof evaluateFriendGraphRisk>,
) {
  const friendsPerDay = friend.friendCount / Math.max(friend.accountAgeDays, 1);
  let risk =
    friend.accountAgeDays < 14 && friend.friendCount >= 120
      ? 88
      : friendsPerDay >= 8
        ? 78
        : friendsPerDay >= 4
          ? 58
          : friendsPerDay >= 1.5
            ? 34
            : 10;

  if (
    graphRisk.available &&
    graphRisk.mutualCount === 0 &&
    friendsPerDay >= 4
  ) {
    risk = Math.min(100, risk + 12);
  }

  return {
    friendsPerDay,
    risk,
  };
}

function buildFriendFactors(
  friend: RobloxUserProfile,
  context?: FriendGraphContext,
) {
  const languageInput = `${friend.name} ${friend.displayName} ${friend.description}`;
  const languageMatches = collectWeightedFriendSignals(
    languageInput,
    friendLanguageSignalSpecs,
  );
  const throwawayPattern = /[0-9]{4,}$|[a-z]{3,}[0-9]{3,}/i.test(friend.name);
  const ageRisk = getFriendAgeRisk(friend.accountAgeDays);
  const languageRisk = Math.min(
    100,
    sumScores([
      ...languageMatches.map((signal) => signal.weight),
      ...(throwawayPattern ? [18] : []),
    ]),
  );
  const graphRisk = evaluateFriendGraphRisk(friend, context);
  const velocityRisk = getFriendVelocityRisk(friend, graphRisk);
  const accountAgeContribution = roundContribution(ageRisk * 0.28);
  const profileLanguageContribution = roundContribution(languageRisk * 0.22);
  const graphOverlapContribution = graphRisk.available
    ? roundContribution(graphRisk.risk * 0.3)
    : 0;
  const graphVelocityContribution = roundContribution(velocityRisk.risk * 0.2);

  const score = clampScore(
    ageRisk * 0.28 +
      languageRisk * 0.22 +
      (graphRisk.available ? graphRisk.risk * 0.3 : 0) +
      velocityRisk.risk * 0.2,
  );

  const factors = [
    {
      key: "account-age",
      label: "Account age",
      value: `${friend.accountAgeDays} days`,
      active: true,
      contribution: accountAgeContribution,
      observedSignals: [
        describeFriendAgeBand(friend.accountAgeDays),
        `Friend count: ${friend.friendCount}`,
      ],
      note:
        friend.accountAgeDays < 30
          ? "Very new profiles still carry more weight because they are easier to create and discard."
          : "Older accounts receive less risk from account age alone.",
    },
    {
      key: "profile-language",
      label: "Profile language scan",
      value: languageMatches.length || throwawayPattern
        ? `${languageMatches.length + (throwawayPattern ? 1 : 0)} matched signal${
            languageMatches.length + (throwawayPattern ? 1 : 0) === 1
              ? ""
              : "s"
          }`
        : "No strong match",
      active: true,
      contribution: profileLanguageContribution,
      observedSignals: [
        ...languageMatches.map(
          (signal) => `Matched profile signal: ${signal.label} (+${signal.weight})`,
        ),
        ...(throwawayPattern
          ? [
              "Matched throwaway-style username suffix (+18)",
              "Regex family: [0-9]{4,}$ or [a-z]{3,}[0-9]{3,}",
            ]
          : []),
      ],
      note:
        languageMatches.length || throwawayPattern
          ? "Friend bios and handles are scanned for off-platform contact terms, dating language, and disposable-name patterns."
          : "No strong profile language or naming signal triggered.",
    },
    {
      key: "mutual-friend-overlap",
      label: "Mutual friend overlap",
      value: graphRisk.available
        ? `${graphRisk.mutualCount} mutual friend${
            graphRisk.mutualCount === 1 ? "" : "s"
          }`
        : "unavailable",
      active: graphRisk.available,
      contribution: graphOverlapContribution,
      observedSignals: graphRisk.available
        ? [
            `Mutual friends with the profiled account: ${graphRisk.mutualCount}`,
            `Overlap with sampled peer set: ${graphRisk.sampledMutualCount}`,
          ]
        : [],
      note: graphRisk.available
        ? "Friends with little overlap into the profiled user's existing network are treated as riskier than friends who are embedded in the same public graph."
        : "Public friend-list overlap was unavailable for this friend, so this factor stayed neutral.",
    },
    {
      key: "friend-graph-velocity",
      label: "Friend graph velocity",
      value: `${velocityRisk.friendsPerDay.toFixed(1)} friends/day`,
      active: true,
      contribution: graphVelocityContribution,
      observedSignals: [
        `Friend count: ${friend.friendCount}`,
        `Growth rate: ${velocityRisk.friendsPerDay.toFixed(2)} friends/day`,
        ...(graphRisk.available &&
        graphRisk.mutualCount === 0 &&
        velocityRisk.friendsPerDay >= 4
          ? ["Rapid friend growth with zero mutual overlap"]
          : []),
      ],
      note:
        "Fast friend accumulation on a very young or socially isolated account is treated as a stronger graph anomaly than friend count alone.",
    },
  ] satisfies RiskFactor[];

  return { factors, score };
}

export function buildPreviewFriendSummary(
  friend: RobloxUserProfile,
  context?: FriendGraphContext,
) {
  const { factors, score } = buildFriendFactors(friend, context);

  return {
    id: friend.id,
    name: friend.name,
    displayName: friend.displayName,
    avatarUrl: friend.avatarUrl,
    profileUrl: friend.profileUrl,
    score,
    level: getRiskLevel(score),
    lastAssessed: new Date().toISOString(),
    factors,
    accountAgeDays: friend.accountAgeDays,
  } satisfies FriendRiskSummary;
}

async function buildGameFactors(
  game: RobloxGameProfile,
  options: BuildGameScoringOptions = {},
) {
  const metadataSignalMatches = collectWeightedGameSignals(
    `${game.name} ${game.description}`,
    gameKeywordSignalSpecs,
  );
  const genreSignalMatches = collectWeightedGameSignals(
    game.genres.join(" "),
    gameGenreSignalSpecs,
  );
  const socialSignalWeight = Math.min(
    100,
    sumScores([
      ...metadataSignalMatches.map((signal) => signal.weight),
      ...genreSignalMatches.map((signal) => signal.weight),
    ]),
  );
  const privateServerWeight = game.privateServersEnabled ? 60 : 0;
  const communityApprovalBand = getCommunityApprovalBand(game.rating);
  const communityApprovalWeight = communityApprovalBand.value;
  const externalCommunityScan = await getExternalCommunityScan(game.name);
  const wideWebSearchMode = options.wideWebSearchMode ?? "deferred";
  const wideWebSearchConfigured = isWideWebGameScanEnabled();
  const shouldLoadWideWebFactor = wideWebSearchMode !== "deferred";
  const allowWideWebLiveSearch =
    wideWebSearchMode === "prefer-cache" || wideWebSearchMode === "force-refresh";
  const wideWebScan = shouldLoadWideWebFactor
    ? await getWideWebRiskScan(game, {
        allowLiveSearch: allowWideWebLiveSearch,
        forceRefresh: wideWebSearchMode === "force-refresh",
        onStage: options.onWideWebStage,
      })
    : {
        attempted: false,
        available: false,
        score: 0,
        searchedSources: [],
        matches: [],
      };
  const externalCommunityWeight = externalCommunityScan.score;
  const publicSourceContribution = 0;
  const socialSignalContribution = roundContribution(socialSignalWeight * 0.5);
  const privateServerContribution = roundContribution(privateServerWeight * 0.15);
  const communityApprovalContribution = roundContribution(
    communityApprovalWeight * 0.1,
  );
  const externalCommunityContribution = roundContribution(
    externalCommunityWeight * 0.25,
  );
  const wideWebContribution =
    shouldLoadWideWebFactor && wideWebScan.available
      ? roundContribution(wideWebScan.score * 0.15)
      : 0;
  const score = clampScore(
    socialSignalWeight * 0.5 +
      privateServerWeight * 0.15 +
      communityApprovalWeight * 0.1 +
      externalCommunityWeight * 0.25 +
      (shouldLoadWideWebFactor && wideWebScan.available
        ? wideWebScan.score * 0.15
        : 0),
  );

  const factors = [
    {
      key: "public-game-source",
      label: "Public game source",
      value: formatAssociationSources(game.associationSources),
      active: true,
      contribution: publicSourceContribution,
      observedSignals: game.associationSources.map(
        (source) => `Source: ${source}`,
      ),
      note:
        "This records which public Roblox surface exposed the game to RoRadar. Private recent-play history is still not integrated.",
    },
    {
      key: "metadata-language",
      label: "Social-language scan",
      value:
        metadataSignalMatches.length || genreSignalMatches.length
          ? `${metadataSignalMatches.length + genreSignalMatches.length} matched signal${
              metadataSignalMatches.length + genreSignalMatches.length === 1
                ? ""
                : "s"
            }`
          : "No strong match",
      active: true,
      contribution: socialSignalContribution,
      observedSignals: [
        ...metadataSignalMatches.map(
          (signal) => `Keyword: ${signal.label} (+${signal.weight})`,
        ),
        ...genreSignalMatches.map(
          (signal) => `Genre: ${signal.label} (+${signal.weight})`,
        ),
      ],
      note:
        metadataSignalMatches.length || genreSignalMatches.length
          ? "Game names, descriptions, and genres that lean social or roleplay-heavy receive more scrutiny, with dating and roleplay weighted far above weak words like friend."
          : "No strong social or roleplay signal triggered in the public metadata.",
    },
    {
      key: "private-servers",
      label: "Private servers enabled",
      value: game.privateServersEnabled,
      active: true,
      contribution: privateServerContribution,
      observedSignals: [
        game.privateServersEnabled
          ? "Roblox reports private servers are enabled for this game."
          : "Roblox reports private servers are not enabled for this game.",
      ],
      note:
        "Private servers are a secondary safety signal because they can move activity into less visible spaces.",
    },
    {
      key: "community-approval",
      label: "Community approval",
      value:
        game.rating == null ? "n/a" : `${game.rating.toFixed(1)} / 100`,
      active: true,
      contribution: communityApprovalContribution,
      observedSignals: game.rating == null
        ? [
            "No public Roblox vote data was available.",
            `${communityApprovalBand.label} -> +${communityApprovalWeight}`,
          ]
        : [
            `Approval score: ${game.rating.toFixed(1)} / 100`,
            `Vote count: ${game.ratingCount ?? 0}`,
            `${communityApprovalBand.label} -> +${communityApprovalWeight}`,
          ],
      note:
        game.rating == null
          ? "Public vote data is treated as neutral when Roblox does not expose it."
          : "Poor approval can add risk, but strong approval does not add risk by itself.",
    },
    {
      key: "community-confirmation",
      label: "External community discussion",
      value: externalCommunityScan.available
        ? externalCommunityScan.matches.length
          ? `${externalCommunityScan.matches.length} corroborating result${
              externalCommunityScan.matches.length === 1 ? "" : "s"
            }`
          : "No corroborating external match"
        : "Search unavailable",
      active: externalCommunityScan.available,
      contribution: externalCommunityContribution,
      observedSignals: externalCommunityScan.available
        ? [
            `Coverage: ${
              externalCommunityScan.searchedSources.length
                ? externalCommunityScan.searchedSources.join(" + ")
                : "No source responded"
            }`,
            ...(externalCommunityScan.matches.length
              ? formatExternalCommunityMatches(
                  externalCommunityScan.matches.slice(0, 4),
                )
              : ["No Reddit or DevForum discussion produced a strong risk-language match."]),
          ]
        : [
            "Reddit and DevForum searches were unavailable for this refresh, so the factor stayed neutral.",
          ],
      observedSources: externalCommunityScan.matches.length
        ? formatExternalCommunitySources(
            externalCommunityScan.matches.slice(0, 4),
          )
        : [],
      note: externalCommunityScan.available
        ? "RoRadar now scans Roblox-adjacent public discussion on Reddit and DevForum and only adds risk when those posts mention the game alongside stronger safety-relevant language."
        : "External community checks failed during this refresh, so the factor stayed neutral instead of inventing a score.",
    },
    {
      key: "wide-web-safety-search",
      label: "Wide web safety search",
      value: wideWebSearchMode === "deferred"
          ? "Run on detail refresh"
        : wideWebScan.available
            ? wideWebScan.matches.length
              ? `${wideWebScan.matches.length} corroborating result${
                  wideWebScan.matches.length === 1 ? "" : "s"
                }`
              : "No corroborating article match"
            : wideWebSearchMode === "cache-only"
              ? "No cached search yet"
              : !wideWebSearchConfigured
                ? "not configured"
                : "Search unavailable",
      active: shouldLoadWideWebFactor && wideWebScan.available,
      contribution: wideWebContribution,
      observedSignals: wideWebSearchMode === "deferred"
        ? [
            "Open this game detail to run the Tavily-backed article search.",
          ]
        : wideWebScan.available
          ? [
              wideWebScan.source === "cache"
                ? `Cache: Supabase search snapshot from ${wideWebScan.fetchedAt ?? "an earlier refresh"}`
                : `Search run: ${wideWebScan.fetchedAt ?? "just now"}`,
              `Coverage: ${
                wideWebScan.searchedSources.length
                  ? wideWebScan.searchedSources.join(" + ")
                  : "No source responded"
              }`,
              ...(wideWebScan.matches.length
                ? formatWideWebMatchSignals(wideWebScan.matches.slice(0, 4))
                : ["No wider web result produced a strong safety-risk match."]),
            ]
          : wideWebSearchMode === "cache-only"
            ? [
                "Live Tavily searches are disabled in Settings for this browser.",
                "No cached wide web result exists for this game yet. Use Refresh wide web in the modal to run and save one.",
              ]
            : !wideWebSearchConfigured
              ? [
                  "Add TAVILY_API_KEY and ENABLE_WIDE_WEB_GAME_SCAN=true to enable the wider article search.",
                ]
              : [
                  wideWebScan.errorMessage ??
                    "The Tavily article search was unavailable during this refresh, so the factor stayed neutral.",
                ],
      observedSources:
        shouldLoadWideWebFactor && wideWebScan.matches.length
          ? formatExternalCommunitySources(wideWebScan.matches.slice(0, 4))
          : [],
      note: wideWebSearchMode === "deferred"
        ? "This deeper Tavily search currently runs only on direct game detail refresh so full profile refreshes stay fast and inexpensive."
        : wideWebScan.available
          ? wideWebScan.source === "cache"
            ? "This result came from the Supabase cache, so reopening the game detail does not spend new Tavily credits until you explicitly refresh the wide web search."
            : wideWebScan.persisted
              ? "This Tavily-backed pass searches the wider web for grooming-adjacent or solicitation-style discussion about the game and writes the result into Supabase for future cached retrievals."
              : "This Tavily-backed pass searched live, but the Supabase cache table is not available yet, so the result will only persist in memory until the migration is applied."
          : wideWebSearchMode === "cache-only"
            ? "The automatic Tavily call is disabled in Settings for this browser, but cached wide web results will still appear here whenever RoRadar already has one saved."
            : !wideWebSearchConfigured
              ? "Configure Tavily to add a wider article and forum search layer beyond Reddit and DevForum."
              : "The Tavily-backed article search failed during this refresh, so the factor stayed neutral instead of inventing risk.",
    },
  ] satisfies RiskFactor[];

  return { factors, score };
}

export async function buildPreviewGameSummary(
  game: RobloxGameProfile,
  options: BuildGameScoringOptions = {},
) {
  const { factors, score } = await buildGameFactors(game, options);

  return {
    id: String(game.placeId),
    placeId: game.placeId,
    universeId: game.universeId,
    name: game.name,
    creatorName: game.creatorName,
    creatorUrl: game.creatorUrl,
    robloxUrl: game.robloxUrl,
    description: game.description,
    thumbnailUrl: game.thumbnailUrl,
    score,
    level: getRiskLevel(score),
    lastAssessed: new Date().toISOString(),
    factors,
    genres: game.genres,
    rating: game.rating,
    ratingCount: game.ratingCount,
    created: game.created,
    updated: game.updated,
    privateServersEnabled: game.privateServersEnabled,
    associationSources: game.associationSources,
  } satisfies GameRiskSummary;
}

export async function buildPreviewAssessment(username: string) {
  const profile = await getRobloxUserByUsername(username);
  const [friendProfiles, publicGames, ownerFriendIds] = await Promise.all([
    getRobloxFriends(profile.id),
    getRobloxGamesForUser(profile.id),
    getRobloxFriendIds(profile.id),
  ]);
  const sampledFriendIds = friendProfiles.map((friend) => friend.id);
  const friendIdLookups = await Promise.allSettled(
    sampledFriendIds.map(async (friendId) => {
      return [friendId, await getRobloxFriendIds(friendId)] as const;
    }),
  );
  const friendIdsByUserId = new Map<number, number[]>(
    friendIdLookups.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    ),
  );
  const friendGraphContext = {
    ownerUserId: profile.id,
    ownerFriendIds: ownerFriendIds.length ? ownerFriendIds : sampledFriendIds,
    sampledFriendIds,
    friendIdsByUserId,
  } satisfies FriendGraphContext;

  const allFriendSummaries = friendProfiles
    .map((friend) => buildPreviewFriendSummary(friend, friendGraphContext))
    .sort((left, right) => right.score - left.score);

  const friendSummaries = allFriendSummaries
    .filter((friend) => friend.score >= surfacedRiskThreshold)
    .slice(0, surfacedFriendLimit);

  const scoredGames = (
    await Promise.all(publicGames.map((game) => buildPreviewGameSummary(game)))
  )
    .sort((left, right) => right.score - left.score);

  const gameSummaries = scoredGames
    .filter((game) => game.score >= surfacedRiskThreshold)
    .slice(0, surfacedGameLimit);

  const overallCandidateScores = [
    ...allFriendSummaries.map((friend) => friend.score),
    ...scoredGames.map((game) => game.score),
  ]
    .sort((left, right) => right - left)
    .slice(0, 3);
  const overallRiskScore = overallCandidateScores.length
    ? clampScore(sumScores(overallCandidateScores) / overallCandidateScores.length)
    : 0;
  const timestamp = new Date().toISOString();

  return {
    profile,
    overallRiskScore,
    overallRiskLevel: getRiskLevel(overallRiskScore),
    summary:
      "Phase 0 preview using live Roblox identity data, first-pass public friend graph analysis, public Roblox game associations, and lightweight external Reddit and DevForum corroboration.",
    mode: "phase0-preview",
    lastAssessed: timestamp,
    friendsLastAssessed: timestamp,
    gamesLastAssessed: timestamp,
    notes: [
      "Friend scoring now uses public account age, profile language, mutual-overlap, and friend-growth signals instead of the old placeholder velocity hash.",
      "Game checks now evaluate the user's public favorite games and public created experiences when Roblox exposes them.",
      "Live game scoring now includes Reddit and DevForum corroboration. Tavily-backed wide web search is available on direct game detail refresh when configured, but not in bulk profile refresh yet.",
      "Saved children sync to your account when Supabase persistence is configured; otherwise they fall back to this browser.",
      "Overall profile score now averages the top three available friend and game signals instead of hinging on a single standout item.",
    ],
    highRiskFriends: friendSummaries,
    highRiskGames: gameSummaries,
    scoredFriends: allFriendSummaries,
    scoredGames,
  } satisfies UserAssessment;
}

export async function buildPreviewFriendById(friendId: number) {
  const friend = await getRobloxUserById(friendId);
  return buildPreviewFriendSummary(friend);
}

export async function buildPreviewGameById(
  gameId: number,
  options: BuildGameScoringOptions = {},
) {
  const game = await getRobloxGameByPlaceId(gameId);
  return await buildPreviewGameSummary(game, {
    wideWebSearchMode: options.wideWebSearchMode ?? "prefer-cache",
    onWideWebStage: options.onWideWebStage,
  });
}
