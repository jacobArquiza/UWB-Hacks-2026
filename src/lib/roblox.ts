import { decode } from "html-entities";
import { load } from "cheerio";

import type { RobloxGameProfile, RobloxUserProfile } from "@/lib/types";

const robloxUserLookupUrl = "https://users.roblox.com/v1/usernames/users";
const robloxGamesByUniverseUrl = "https://games.roblox.com/v1/games";
const robloxGameVotesUrl = "https://games.roblox.com/v1/games/votes";
const robloxGameIconsUrl = "https://thumbnails.roblox.com/v1/games/icons";

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

type RobloxGameCreator = {
  id: number;
  name?: string;
  type: string;
  hasVerifiedBadge?: boolean;
};

type RobloxUserGameListResponse = {
  data: Array<{
    id: number;
    name: string;
    description: string;
    creator: RobloxGameCreator;
    rootPlace: {
      id: number;
      type: string;
    };
    created: string;
    updated: string;
    placeVisits: number;
  }>;
};

type RobloxGameDetailsResponse = {
  data: Array<{
    id: number;
    rootPlaceId: number;
    name: string;
    description: string;
    creator: RobloxGameCreator;
    created: string;
    updated: string;
    genre_l1?: string;
    genre_l2?: string;
    canonicalUrlPath?: string;
    createVipServersAllowed?: boolean;
  }>;
};

type RobloxGameVotesResponse = {
  data: Array<{
    id: number;
    upVotes: number;
    downVotes: number;
  }>;
};

type RobloxPrivateServersResponse = {
  privateServersEnabled: boolean;
};

type RobloxGameIconsResponse = {
  data: Array<{
    targetId: number;
    imageUrl: string;
  }>;
};

type RobloxGameSeedEntry = {
  universeId: number;
  rootPlaceId: number;
  name?: string;
  description?: string;
  creator?: RobloxGameCreator;
  creatorUrl?: string;
  created?: null | string;
  updated?: null | string;
  thumbnailUrl?: string;
  robloxUrl?: string;
  privateServersEnabled?: boolean;
  associationSources: string[];
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

export async function getRobloxFriendIds(userId: number) {
  const payload = await robloxFetch<RobloxFriendResponse>(
    `https://friends.roblox.com/v1/users/${userId}/friends`,
    { headers: {} },
  ).catch(() => ({ data: [] }));

  return payload.data.map((friend) => friend.id);
}

function buildCreatorUrl(creator: RobloxGameCreator) {
  if (creator.type === "Group") {
    return `https://www.roblox.com/groups/${creator.id}/group`;
  }

  return `https://www.roblox.com/users/${creator.id}/profile`;
}

function parseCreatorFromUrl(url: string | undefined, name: string) {
  if (!url) {
    return undefined;
  }

  try {
    const pathname = url.startsWith("http") ? new URL(url).pathname : url;
    const userMatch = pathname.match(/\/users\/(\d+)\//i);

    if (userMatch) {
      return {
        id: Number(userMatch[1]),
        name,
        type: "User",
      } satisfies RobloxGameCreator;
    }

    const groupMatch = pathname.match(/\/groups\/(\d+)\//i);

    if (groupMatch) {
      return {
        id: Number(groupMatch[1]),
        name,
        type: "Group",
      } satisfies RobloxGameCreator;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeGenres(...values: Array<null | string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter(
          (value): value is string =>
            Boolean(
              value &&
                value.toLowerCase() !== "all" &&
                value.toLowerCase() !== "na",
            ),
        ),
    ),
  );
}

function mapGameListEntryToSeed(
  entry: RobloxUserGameListResponse["data"][number],
  associationSource: string,
) {
  return {
    universeId: entry.id,
    rootPlaceId: entry.rootPlace.id,
    name: entry.name,
    description: entry.description,
    creator: entry.creator,
    created: entry.created,
    updated: entry.updated,
    associationSources: [associationSource],
  } satisfies RobloxGameSeedEntry;
}

async function hydrateRobloxGames(
  entries: RobloxGameSeedEntry[],
): Promise<RobloxGameProfile[]> {
  const dedupedEntries = Array.from(
    entries
      .reduce((map, entry) => {
        const existing = map.get(entry.universeId);

        if (!existing) {
          map.set(entry.universeId, {
            ...entry,
            associationSources: Array.from(new Set(entry.associationSources)),
          });
          return map;
        }

        map.set(entry.universeId, {
          ...existing,
          ...entry,
          associationSources: Array.from(
            new Set([
              ...existing.associationSources,
              ...entry.associationSources,
            ]),
          ),
        });

        return map;
      }, new Map<number, RobloxGameSeedEntry>())
      .values(),
  );

  if (!dedupedEntries.length) {
    return [] as RobloxGameProfile[];
  }

  const universeIds = dedupedEntries.map((entry) => entry.universeId);
  const [detailsPayload, votesPayload, iconPayload, privateServerFlags] =
    await Promise.all([
      robloxFetch<RobloxGameDetailsResponse>(
        `${robloxGamesByUniverseUrl}?universeIds=${universeIds.join(",")}`,
        { headers: {} },
      ).catch(() => ({ data: [] })),
      robloxFetch<RobloxGameVotesResponse>(
        `${robloxGameVotesUrl}?universeIds=${universeIds.join(",")}`,
        { headers: {} },
      ).catch(() => ({ data: [] })),
      robloxFetch<RobloxGameIconsResponse>(
        `${robloxGameIconsUrl}?universeIds=${universeIds.join(",")}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`,
        { headers: {} },
      ).catch(() => ({ data: [] })),
      Promise.all(
        universeIds.map(async (universeId) =>
          [
            universeId,
            await robloxFetch<RobloxPrivateServersResponse>(
              `https://games.roblox.com/v1/private-servers/enabled-in-universe/${universeId}`,
              { headers: {} },
            )
              .then((payload) => payload.privateServersEnabled)
              .catch(() => false),
          ] as const,
        ),
      ),
    ]);

  const detailsByUniverseId = new Map(
    detailsPayload.data.map((detail) => [detail.id, detail]),
  );
  const votesByUniverseId = new Map(
    votesPayload.data.map((voteSummary) => [voteSummary.id, voteSummary]),
  );
  const iconsByUniverseId = new Map(
    iconPayload.data.map((icon) => [icon.targetId, icon.imageUrl]),
  );
  const privateServersByUniverseId = new Map<number, boolean>(privateServerFlags);

  return dedupedEntries.map((entry) => {
    const details = detailsByUniverseId.get(entry.universeId);
    const votes = votesByUniverseId.get(entry.universeId);
    const rootPlaceId = details?.rootPlaceId ?? entry.rootPlaceId;
    const creator = details?.creator ?? entry.creator;
    const totalVotes = votes ? votes.upVotes + votes.downVotes : null;
    const rating =
      totalVotes && totalVotes > 0 ? (votes!.upVotes / totalVotes) * 100 : null;

    return {
      placeId: rootPlaceId,
      universeId: entry.universeId,
      name: decode(details?.name ?? entry.name ?? "Unknown game").trim(),
      creatorName: decode(creator?.name ?? "Unknown creator").trim(),
      creatorUrl:
        creator != null && creator.id > 0
          ? buildCreatorUrl(creator)
          : entry.creatorUrl ?? `https://www.roblox.com/games/${rootPlaceId}`,
      robloxUrl:
        details?.canonicalUrlPath != null
          ? `https://www.roblox.com${details.canonicalUrlPath}`
          : entry.robloxUrl ?? `https://www.roblox.com/games/${rootPlaceId}`,
      description: decode(
        details?.description ?? entry.description ?? "No description available.",
      ).trim(),
      thumbnailUrl:
        iconsByUniverseId.get(entry.universeId) ?? entry.thumbnailUrl ?? "",
      genres: normalizeGenres(details?.genre_l1, details?.genre_l2),
      rating,
      ratingCount: totalVotes,
      created: details?.created ?? entry.created ?? null,
      updated: details?.updated ?? entry.updated ?? null,
      privateServersEnabled:
        privateServersByUniverseId.get(entry.universeId) ??
        details?.createVipServersAllowed ??
        entry.privateServersEnabled ??
        false,
      associationSources: entry.associationSources,
    } satisfies RobloxGameProfile;
  });
}

async function getRobloxGameSeedByPlaceId(placeId: number) {
  const url = `https://www.roblox.com/games/${placeId}`;
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
  const creatorName = decode(
    creatorAnchor.text().trim() || parsed.author?.name || "Unknown creator",
  ).trim();
  const creatorHref = creatorAnchor.attr("href");
  const creatorUrl =
    creatorHref?.startsWith("http")
      ? creatorHref
      : creatorHref
        ? `https://www.roblox.com${creatorHref}`
        : parsed.author?.url;
  const ogImage =
    $('meta[property="og:image"]').attr("content") ?? parsed.image ?? "";
  const ogUrl = $('meta[property="og:url"]').attr("content") ?? url;
  const universeId =
    Number(metadataNode.attr("data-universe-id")) ||
    Number(/"universeId":\s*(\d+)/.exec(html)?.[1] ?? 0);

  if (!universeId) {
    throw new Error("Roblox game details unavailable");
  }

  return {
    universeId,
    rootPlaceId: placeId,
    name: decode(heading || parsed.name || "Unknown game").trim(),
    description: decode(
      parsed.description ||
        $('meta[name="description"]').attr("content") ||
        "No description available.",
    ).trim(),
    creator:
      parseCreatorFromUrl(creatorUrl, creatorName) ?? {
        id: 0,
        name: creatorName,
        type: "User",
      },
    creatorUrl,
    created: parsed.dateCreated ?? null,
    updated: parsed.dateModified ?? null,
    thumbnailUrl: ogImage,
    robloxUrl: ogUrl,
    privateServersEnabled:
      html.includes("Private Server") || html.includes("VIP Server"),
    associationSources: ["Direct place lookup"],
  } satisfies RobloxGameSeedEntry;
}

export async function getRobloxGamesForUser(
  userId: number,
  limit = 8,
): Promise<RobloxGameProfile[]> {
  const [favoriteGamesPayload, createdGamesPayload] = await Promise.all([
    robloxFetch<RobloxUserGameListResponse>(
      `https://games.roblox.com/v2/users/${userId}/favorite/games`,
      { headers: {} },
    ).catch(() => ({ data: [] })),
    robloxFetch<RobloxUserGameListResponse>(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=${limit}&sortOrder=Desc`,
      { headers: {} },
    ).catch(() => ({ data: [] })),
  ]);

  const gameSeeds = [
    ...favoriteGamesPayload.data.map((entry) =>
      mapGameListEntryToSeed(entry, "Public favorites list"),
    ),
    ...createdGamesPayload.data.map((entry) =>
      mapGameListEntryToSeed(entry, "Public created experiences"),
    ),
  ].slice(0, Math.max(limit * 2, limit));

  const hydratedGames = await hydrateRobloxGames(gameSeeds);

  return hydratedGames.slice(0, limit);
}

export async function getRobloxGameByPlaceId(
  placeId: number,
): Promise<RobloxGameProfile> {
  const gameSeed = await getRobloxGameSeedByPlaceId(placeId);
  const [game] = await hydrateRobloxGames([gameSeed]);

  if (!game) {
    return {
      placeId,
      universeId: gameSeed.universeId,
      name: gameSeed.name ?? "Unknown game",
      creatorUrl:
        gameSeed.creatorUrl ?? `https://www.roblox.com/games/${placeId}`,
      creatorName: gameSeed.creator?.name ?? "Unknown creator",
      robloxUrl: gameSeed.robloxUrl ?? `https://www.roblox.com/games/${placeId}`,
      description: gameSeed.description ?? "No description available.",
      thumbnailUrl: gameSeed.thumbnailUrl ?? "",
      genres: [],
      rating: null,
      ratingCount: null,
      created: gameSeed.created ?? null,
      updated: gameSeed.updated ?? null,
      privateServersEnabled: gameSeed.privateServersEnabled ?? false,
      associationSources: gameSeed.associationSources,
    } satisfies RobloxGameProfile;
  }

  return game;
}
