import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RobloxGameProfile } from "@/lib/types";

type WideWebCacheMatch = {
  label: string;
  source: string;
  summary: string;
  title: string;
  url: string;
  weight: number;
};

type WideWebCacheRow = {
  fetched_at: string;
  game_name: string;
  matches: unknown;
  place_id: number;
  score: number;
  searched_sources: unknown;
};

export type CachedWideWebRiskScan = {
  fetchedAt: string;
  matches: WideWebCacheMatch[];
  score: number;
  searchedSources: string[];
};

function normalizeGameName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMissingCacheTableMessage(message: string) {
  return (
    message.includes("game_wide_web_scans") &&
    message.includes("schema cache")
  );
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseMatchArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as WideWebCacheMatch[];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const match = entry as Partial<WideWebCacheMatch>;

    if (
      typeof match.label !== "string" ||
      typeof match.source !== "string" ||
      typeof match.summary !== "string" ||
      typeof match.title !== "string" ||
      typeof match.url !== "string" ||
      typeof match.weight !== "number"
    ) {
      return [];
    }

    return [match as WideWebCacheMatch];
  });
}

export async function readWideWebScanCache(placeId: number) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("game_wide_web_scans")
    .select("place_id, game_name, score, matches, searched_sources, fetched_at")
    .eq("place_id", placeId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116" || isMissingCacheTableMessage(error.message)) {
      return null;
    }

    throw new Error(`Could not read wide web cache: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as WideWebCacheRow;

  return {
    fetchedAt: row.fetched_at,
    matches: parseMatchArray(row.matches),
    score: row.score,
    searchedSources: parseStringArray(row.searched_sources),
  } satisfies CachedWideWebRiskScan;
}

export async function writeWideWebScanCache(
  game: Pick<RobloxGameProfile, "name" | "placeId" | "universeId">,
  scan: Omit<CachedWideWebRiskScan, "fetchedAt"> & { fetchedAt: string },
) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("game_wide_web_scans").upsert(
    {
      place_id: game.placeId,
      universe_id: game.universeId,
      game_name: game.name,
      normalized_game_name: normalizeGameName(game.name),
      score: scan.score,
      matches: scan.matches,
      searched_sources: scan.searchedSources,
      fetched_at: scan.fetchedAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "place_id",
    },
  );

  if (error) {
    if (isMissingCacheTableMessage(error.message)) {
      return false;
    }

    throw new Error(`Could not write wide web cache: ${error.message}`);
  }

  return true;
}
