import { clampScore, getRiskLevel } from "@/lib/risk";
import {
  getPhase0SeedGameByName,
  getPhase0SeedGameByPlaceId,
  getRobloxFriends,
  getRobloxUserById,
  getRobloxUserByUsername,
} from "@/lib/roblox";
import type {
  FriendRiskSummary,
  GameRiskSummary,
  RiskFactor,
  RobloxGameProfile,
  RobloxUserProfile,
  UserAssessment,
} from "@/lib/types";

const phase0FriendThreshold = 63;
const phase0GameThreshold = 63;

function hashScore(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 101;
  }

  return hash;
}

function buildFriendFactors(friend: RobloxUserProfile) {
  const nameSignature = `${friend.name} ${friend.displayName}`;
  const flaggedTerms =
    nameSignature.match(
      /\b(daddy|mommy|uncle|single|babe|queen|king|date|lover|hot)\b/gi,
    ) ?? [];
  const throwawayPattern = /[0-9]{4,}$|[a-z]{3,}[0-9]{3,}/i.test(friend.name);
  const youthRisk = friend.accountAgeDays < 7 ? 94 : friend.accountAgeDays < 30 ? 82 : friend.accountAgeDays < 180 ? 54 : 18;
  const namingRisk = flaggedTerms.length
    ? 78
    : throwawayPattern
      ? 64
      : 22;
  const socialVelocityRisk = 30 + (hashScore(friend.name) % 47);

  const score = clampScore(
    youthRisk * 0.46 + namingRisk * 0.34 + socialVelocityRisk * 0.2,
  );

  const factors = [
    {
      key: "account-age",
      label: "Account age",
      value: `${friend.accountAgeDays} days`,
      active: true,
      note:
        friend.accountAgeDays < 30
          ? "Very new profiles are treated as higher-risk preview candidates."
          : "Older accounts receive less preview weight.",
    },
    {
      key: "username-pattern",
      label: "Username pattern",
      value: flaggedTerms.length
        ? flaggedTerms.join(", ")
        : throwawayPattern
          ? "throwaway-style suffix"
          : "no obvious flag",
      active: true,
      note:
        flaggedTerms.length || throwawayPattern
          ? "Phase 0 flags names that look disposable or adult-coded."
          : "No suspicious naming signal triggered.",
    },
    {
      key: "social-velocity",
      label: "Preview social velocity score",
      value: `${socialVelocityRisk}%`,
      active: true,
      note:
        "Temporary Phase 0 weighting that keeps the UI navigable until live graph scoring ships in P1.",
    },
    {
      key: "external-signals",
      label: "External web signals",
      value: "disabled",
      active: false,
      note:
        "Reddit, DevForum, and video safety checks are intentionally inactive in this build.",
    },
  ] satisfies RiskFactor[];

  return { factors, score };
}

export function buildPreviewFriendSummary(friend: RobloxUserProfile) {
  const { factors, score } = buildFriendFactors(friend);

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

function buildGameFactors(game: RobloxGameProfile) {
  const privateServerWeight = game.privateServersEnabled ? 64 : 18;
  const seededWatchlistWeight = 88;
  const metadataWeight = /hangout|chat|social|friends|club|sleepover/i.test(
    `${game.name} ${game.description}`,
  )
    ? 70
    : 28;
  const score = clampScore(
    seededWatchlistWeight * 0.5 +
      privateServerWeight * 0.2 +
      metadataWeight * 0.15 +
      48 * 0.15,
  );

  const factors = [
    {
      key: "seeded-demo-watchlist",
      label: "Seeded Phase 0 watchlist",
      value: true,
      active: true,
      note:
        "Grow a Garden is pinned in Phase 0 so the live game assessment UI is fully demoable.",
    },
    {
      key: "private-servers",
      label: "Private servers enabled",
      value: game.privateServersEnabled,
      active: true,
      note:
        "Private servers are only a secondary signal, but they stay visible in the scoring breakdown.",
    },
    {
      key: "metadata-language",
      label: "Metadata language scan",
      value: metadataWeight >= 60 ? "social-coded keywords" : "no strong keyword flag",
      active: true,
      note:
        "Phase 0 only uses lightweight metadata cues. Full LLM-assisted context arrives in P2.",
    },
    {
      key: "community-confirmation",
      label: "Community confirmation",
      value: "disabled",
      active: false,
      note:
        "YouTube, Reddit, and DevForum confirmation checks are disabled until later phases.",
    },
  ] satisfies RiskFactor[];

  return { factors, score };
}

export function buildPreviewGameSummary(game: RobloxGameProfile) {
  const { factors, score } = buildGameFactors(game);

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
  } satisfies GameRiskSummary;
}

export async function buildPreviewAssessment(username: string) {
  const profile = await getRobloxUserByUsername(username);
  const [friendProfiles, growAGarden] = await Promise.all([
    getRobloxFriends(profile.id),
    getPhase0SeedGameByName("Grow a Garden"),
  ]);

  const friendSummaries = friendProfiles
    .map((friend) => buildPreviewFriendSummary(friend))
    .filter((friend) => friend.score >= phase0FriendThreshold)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);

  const gameSummaries = growAGarden
    ? [buildPreviewGameSummary(growAGarden)].filter(
        (game) => game.score >= phase0GameThreshold,
      )
    : [];

  const highestFriendScore = friendSummaries[0]?.score ?? 18;
  const highestGameScore = gameSummaries[0]?.score ?? 28;
  const overallRiskScore = clampScore(
    highestFriendScore * 0.48 + highestGameScore * 0.42 + 18 * 0.1,
  );
  const timestamp = new Date().toISOString();

  return {
    profile,
    overallRiskScore,
    overallRiskLevel: getRiskLevel(overallRiskScore),
    summary:
      "Phase 0 preview using live Roblox identity data, live friend lookups, and a seeded demo game watchlist. External community-source signals are still off.",
    mode: "phase0-preview",
    lastAssessed: timestamp,
    friendsLastAssessed: timestamp,
    gamesLastAssessed: timestamp,
    notes: [
      "This build is honest about its limits: the risk UI is real, but the deeper friend and game classifiers are still staged for later phases.",
      "Saved children are kept locally in the browser during Phase 0.",
      "Grow a Garden is intentionally seeded so the high-risk game cards and modal flow are testable right now.",
    ],
    highRiskFriends: friendSummaries,
    highRiskGames: gameSummaries,
  } satisfies UserAssessment;
}

export async function buildPreviewFriendById(friendId: number) {
  const friend = await getRobloxUserById(friendId);
  return buildPreviewFriendSummary(friend);
}

export async function buildPreviewGameById(gameId: number) {
  const seededGame = await getPhase0SeedGameByPlaceId(gameId);

  if (!seededGame) {
    throw new Error("Phase 0 only exposes the seeded Grow a Garden game lookup.");
  }

  return buildPreviewGameSummary(seededGame);
}
