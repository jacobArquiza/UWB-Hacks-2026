import { decode } from "html-entities";
import { load } from "cheerio";

import type { RobloxGameProfile, RobloxUserProfile } from "@/lib/types";

const robloxUserLookupUrl = "https://users.roblox.com/v1/usernames/users";

const phase0SeedGames = {
  "grow a garden": {
    placeId: 126884695634066,
    slug: "Grow-a-Garden",
  },
} as const;

type RobloxUserLookupResponse = {
  data: Array<{
    id: number;
    name: string;
    displayName: string;
    hasVerifiedBadge: boolean;
  }>;
};

type RobloxUserDetailResponse = {
  description: string;
  created: string;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
};

type RobloxFriendResponse = {
  data: Array<{
    id: number;
  }>;
};

type RobloxFriendCountResponse = {
  count: number;
};

type RobloxUserAvatarResponse = {
  data: Array<{
    targetId: number;
    imageUrl: string;
  }>;
};

async function robloxFetch<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Roblox request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function accountAgeInDays(createdAt: string) {
  return Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}

async function getAvatarUrlForUsers(userIds: number[]) {
  if (!userIds.length) {
    return new Map<number, string>();
  }

  const payload = await robloxFetch<RobloxUserAvatarResponse>(
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(",")}&size=150x150&format=Png&isCircular=false`,
    { method: "GET", headers: {} },
  );

  return new Map(payload.data.map((avatar) => [avatar.targetId, avatar.imageUrl]));
}

export async function getRobloxUserById(userId: number) {
  const [details, avatarMap, friendCountPayload] = await Promise.all([
    robloxFetch<RobloxUserDetailResponse>(
      `https://users.roblox.com/v1/users/${userId}`,
      { headers: {} },
    ),
    getAvatarUrlForUsers([userId]),
    robloxFetch<RobloxFriendCountResponse>(
      `https://friends.roblox.com/v1/users/${userId}/friends/count`,
      { headers: {} },
    ).catch(() => ({ count: 0 })),
  ]);

  return {
    id: details.id,
    name: details.name,
    displayName: details.displayName,
    description: details.description,
    created: details.created,
    avatarUrl: avatarMap.get(userId) ?? "",
    friendCount: friendCountPayload.count,
    hasVerifiedBadge: details.hasVerifiedBadge,
    profileUrl: `https://www.roblox.com/users/${details.id}/profile`,
    accountAgeDays: accountAgeInDays(details.created),
  } satisfies RobloxUserProfile;
}

export async function getRobloxUserByUsername(username: string) {
  const payload = await robloxFetch<RobloxUserLookupResponse>(robloxUserLookupUrl, {
    method: "POST",
    body: JSON.stringify({
      usernames: [username],
      excludeBannedUsers: false,
    }),
  });

  const match = payload.data[0];

  if (!match) {
    throw new Error("Roblox user not found");
  }

  return getRobloxUserById(match.id);
}

export async function getRobloxFriends(userId: number, limit = 12) {
  const payload = await robloxFetch<RobloxFriendResponse>(
    `https://friends.roblox.com/v1/users/${userId}/friends`,
    { headers: {} },
  ).catch(() => ({ data: [] }));

  const userIds = payload.data.slice(0, limit).map((friend) => friend.id);

  return Promise.all(userIds.map((friendId) => getRobloxUserById(friendId)));
}

function normalizeLookupValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

export async function getPhase0SeedGameByName(name: string) {
  const match =
    phase0SeedGames[
      normalizeLookupValue(name) as keyof typeof phase0SeedGames
    ];

  if (!match) {
    return null;
  }

  return getPhase0SeedGameByPlaceId(match.placeId);
}

export async function getPhase0SeedGameByPlaceId(placeId: number) {
  const entry = Object.values(phase0SeedGames).find(
    (game) => game.placeId === placeId,
  );

  if (!entry) {
    return null;
  }

  const url = `https://www.roblox.com/games/${entry.placeId}/${entry.slug}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Roblox game page unavailable");
  }

  const html = await response.text();
  const $ = load(html);

  const metadataNode = $("#game-detail-meta-data");
  const jsonLd = $("script[type='application/ld+json']").first().text().trim();
  const parsed = jsonLd
    ? (JSON.parse(jsonLd) as {
        name?: string;
        description?: string;
        genre?: string[];
        dateCreated?: string;
        dateModified?: string;
        image?: string;
        author?: {
          name?: string;
          url?: string;
        };
        aggregateRating?: {
          ratingValue?: number;
          ratingCount?: number;
        };
      })
    : {};

  const creatorAnchor = $(".game-creator a").first();
  const heading = $(".game-name").first().text().trim();
  const ogImage = $('meta[property="og:image"]').attr("content") ?? parsed.image ?? "";
  const universeId = Number(metadataNode.attr("data-universe-id")) || entry.placeId;

  return {
    placeId: entry.placeId,
    universeId,
    name: decode(heading || parsed.name || "Grow a Garden").trim(),
    creatorName:
      decode(creatorAnchor.text().trim() || parsed.author?.name || "Unknown creator"),
    creatorUrl:
      creatorAnchor.attr("href")?.startsWith("http")
        ? creatorAnchor.attr("href")!
        : `https://www.roblox.com${creatorAnchor.attr("href") ?? ""}`,
    robloxUrl: url,
    description: decode(
      parsed.description ||
        $('meta[name="description"]').attr("content") ||
        "No description available.",
    ),
    thumbnailUrl: ogImage,
    genres: parsed.genre ?? [],
    rating:
      typeof parsed.aggregateRating?.ratingValue === "number"
        ? parsed.aggregateRating.ratingValue
        : null,
    ratingCount:
      typeof parsed.aggregateRating?.ratingCount === "number"
        ? parsed.aggregateRating.ratingCount
        : null,
    created: parsed.dateCreated ?? null,
    updated: parsed.dateModified ?? null,
    privateServersEnabled:
      html.includes("Private Server") || html.includes("VIP Server"),
  } satisfies RobloxGameProfile;
}
