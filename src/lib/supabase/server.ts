import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { isSupabaseConfigured } from "@/lib/supabase/browser";

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // This helper is prepared for future SSR usage. Phase 0 does not
            // persist auth state through Supabase yet.
          }
        },
      },
    },
  );
}
