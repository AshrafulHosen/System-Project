import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "client" | "freelancer";

export function dashboardPathForRole(role: UserRole): string {
  return role === "client" ? "/dashboard/client" : "/dashboard/freelancer";
}

export async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const [clientRes, freelancerRes] = await Promise.all([
    supabase.from("clients").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("freelancers").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (clientRes.data) return "client";
  if (freelancerRes.data) return "freelancer";
  return null;
}
