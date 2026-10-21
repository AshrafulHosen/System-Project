import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "client" | "freelancer" | "admin";

const ROLE_PATHS: Record<UserRole, string> = {
  client: "/dashboard/client",
  freelancer: "/dashboard/freelancer",
  admin: "/dashboard/admin",
};

export function dashboardPathForRole(role: UserRole): string {
  return ROLE_PATHS[role] || "/dashboard";
}

export async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  // 1. Check database tables
  const [adminRes, clientRes, freelancerRes] = await Promise.all([
    supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("clients").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("freelancers").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (adminRes.data) return "admin";
  if (clientRes.data) return "client";
  if (freelancerRes.data) return "freelancer";

  // 2. Self-healing fallback: inspect auth metadata if profile row was delayed
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId && user.user_metadata?.role) {
      const metaRole = user.user_metadata.role as UserRole;
      const fullName = user.user_metadata.full_name || user.email?.split("@")[0] || "User";

      if (metaRole === "client") {
        await supabase.from("clients").upsert({
          user_id: userId,
          company_name: user.user_metadata.company_name || null,
          display_name: fullName,
        }, { onConflict: "user_id" });
        return "client";
      }

      if (metaRole === "freelancer") {
        await supabase.from("freelancers").upsert({
          user_id: userId,
          title: user.user_metadata.title || null,
          hourly_rate: user.user_metadata.hourly_rate ? Number(user.user_metadata.hourly_rate) : 1200,
          skills: Array.isArray(user.user_metadata.skills) ? user.user_metadata.skills : [],
          bio: user.user_metadata.bio || null,
          display_name: fullName,
        }, { onConflict: "user_id" });
        return "freelancer";
      }
    }
  } catch (err) {
    console.error("resolveUserRole fallback error:", err);
  }

  return null;
}
