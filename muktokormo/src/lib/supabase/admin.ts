import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/env";

if (typeof window !== "undefined") {
  throw new Error("src/lib/supabase/admin.ts cannot be imported in browser code.");
}

/**
 * Server-only Supabase admin client using SUPABASE_SERVICE_ROLE_KEY.
 * Used exclusively inside trusted API Route Handlers and webhooks.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

