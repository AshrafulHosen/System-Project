import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "client" | "freelancer" | "admin";

const ROLE_PATHS: Record<UserRole, string> = {
  client: "/dashboard/client",
  freelancer: "/dashboard/freelancer",
  admin: "/dashboard/admin",
};

export function dashboardPathForRole(role: UserRole): string {
  return ROLE_PATHS[role];
}

export async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const [adminRes, clientRes, freelancerRes] = await Promise.all([
    supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("clients").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("freelancers").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (adminRes.data) return "admin";
  if (clientRes.data) return "client";
  if (freelancerRes.data) return "freelancer";
  return null;
}
