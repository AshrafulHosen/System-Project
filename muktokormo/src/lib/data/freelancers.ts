import type { SupabaseClient } from "@supabase/supabase-js";
import type { Freelancer } from "@/types";
import { mapFreelancerRow, type FreelancerRow } from "@/lib/data/mappers";

const FREELANCER_SELECT =
  "id, display_name, title, location, avatar_url, rating, reviews_count, hourly_rate, earned_bdt, is_nid_verified, skills, success_rate, bio, available";

export async function fetchFreelancers(
  supabase: SupabaseClient
): Promise<Freelancer[]> {
  const { data, error } = await supabase
    .from("freelancers")
    .select(FREELANCER_SELECT)
    .eq("available", true)
    .order("rating", { ascending: false });

  if (error) {
    console.error("fetchFreelancers failed:", error.message);
    return [];
  }

  return ((data ?? []) as FreelancerRow[]).map(mapFreelancerRow);
}

export async function fetchSavedTalent(
  supabase: SupabaseClient,
  clientId: string
): Promise<Freelancer[]> {
  const { data, error } = await supabase
    .from("saved_talent")
    .select(`freelancer_id, freelancers(${FREELANCER_SELECT})`)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchSavedTalent failed:", error.message);
    return [];
  }

  return ((data ?? []) as { freelancers: FreelancerRow | FreelancerRow[] | null }[])
    .map((row) => (Array.isArray(row.freelancers) ? row.freelancers[0] : row.freelancers))
    .filter((row): row is FreelancerRow => Boolean(row))
    .map(mapFreelancerRow);
}

export async function saveTalent(
  supabase: SupabaseClient,
  clientId: string,
  freelancerId: string
): Promise<boolean> {
  const { error } = await supabase.from("saved_talent").insert({
    client_id: clientId,
    freelancer_id: freelancerId,
  });

  if (error) {
    console.error("saveTalent failed:", error.message);
    return false;
  }

  return true;
}

export async function unsaveTalent(
  supabase: SupabaseClient,
  clientId: string,
  freelancerId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("saved_talent")
    .delete()
    .eq("client_id", clientId)
    .eq("freelancer_id", freelancerId);

  if (error) {
    console.error("unsaveTalent failed:", error.message);
    return false;
  }

  return true;
}
