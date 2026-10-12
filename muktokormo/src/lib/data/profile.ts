import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProfileIds {
  clientId: string | null;
  freelancerId: string | null;
}

export async function fetchProfileIds(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileIds> {
  const [clientRes, freelancerRes] = await Promise.all([
    supabase.from("clients").select("id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("freelancers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    clientId: clientRes.data?.id ?? null,
    freelancerId: freelancerRes.data?.id ?? null,
  };
}
