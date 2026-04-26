import type { SessionData } from "@auth0/nextjs-auth0/types";

import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { SavedChildProfile } from "@/lib/types";

type SavedChildRow = {
  avatar_url: string | null;
  display_name: string;
  roblox_user_id: number;
  saved_at: string;
  username: string;
};

function getSessionIdentity(session: SessionData) {
  const subject = session.user.sub;

  if (!subject) {
    throw new Error("Authenticated user is missing a subject.");
  }

  return {
    subject,
    email: session.user.email ?? null,
    displayName:
      session.user.name ?? session.user.nickname ?? session.user.email ?? null,
  };
}

function mapSavedChildRow(row: SavedChildRow) {
  return {
    id: row.roblox_user_id,
    name: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? "",
    profileUrl: `https://www.roblox.com/users/${row.roblox_user_id}/profile`,
    savedAt: row.saved_at,
  } satisfies SavedChildProfile;
}

async function ensureAppUser(session: SessionData) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase saved-child persistence is not configured.");
  }

  const identity = getSessionIdentity(session);
  const { error } = await supabase.from("app_users").upsert(
    {
      auth0_subject: identity.subject,
      email: identity.email,
      display_name: identity.displayName,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "auth0_subject",
    },
  );

  if (error) {
    throw new Error(`Could not ensure app user: ${error.message}`);
  }

  return identity;
}

export const isSavedChildrenPersistenceConfigured = isSupabaseAdminConfigured;

export async function listSavedChildren(session: SessionData) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase saved-child persistence is not configured.");
  }

  const { subject } = getSessionIdentity(session);
  const { data, error } = await supabase
    .from("saved_children")
    .select("roblox_user_id, username, display_name, avatar_url, saved_at")
    .eq("owner_subject", subject)
    .order("saved_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load saved children: ${error.message}`);
  }

  return (data ?? []).map((row) => mapSavedChildRow(row as SavedChildRow));
}

export async function saveChildForSession(
  session: SessionData,
  child: SavedChildProfile,
) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase saved-child persistence is not configured.");
  }

  const { subject } = await ensureAppUser(session);
  const { data, error } = await supabase
    .from("saved_children")
    .upsert(
      {
        owner_subject: subject,
        roblox_user_id: child.id,
        username: child.name,
        display_name: child.displayName,
        avatar_url: child.avatarUrl || null,
        saved_at: child.savedAt,
      },
      {
        onConflict: "owner_subject,roblox_user_id",
      },
    )
    .select("roblox_user_id, username, display_name, avatar_url, saved_at")
    .single();

  if (error) {
    throw new Error(`Could not save child: ${error.message}`);
  }

  return mapSavedChildRow(data as SavedChildRow);
}

export async function deleteSavedChildForSession(
  session: SessionData,
  childId: number,
) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase saved-child persistence is not configured.");
  }

  const { subject } = getSessionIdentity(session);
  const { error } = await supabase
    .from("saved_children")
    .delete()
    .eq("owner_subject", subject)
    .eq("roblox_user_id", childId);

  if (error) {
    throw new Error(`Could not delete child: ${error.message}`);
  }
}
