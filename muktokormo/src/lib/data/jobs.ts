import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job, DraftJob } from "@/types";
import {
  mapJobRow,
  mapProjectToDraft,
  type ProjectRow,
} from "@/lib/data/mappers";

const JOB_SELECT =
  "*, clients(display_name, company_name, location, rating, reviews_count, is_verified)";

export async function fetchOpenJobs(
  supabase: SupabaseClient
): Promise<Job[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(JOB_SELECT)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchOpenJobs failed:", error.message);
    return [];
  }

  return ((data ?? []) as ProjectRow[]).map(mapJobRow);
}

export async function fetchClientProjects(
  supabase: SupabaseClient,
  clientId: string
): Promise<DraftJob[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(JOB_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchClientProjects failed:", error.message);
    return [];
  }

  return ((data ?? []) as ProjectRow[]).map(mapProjectToDraft);
}

export interface NewJobInput {
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  budgetBdt: number;
  timelineDays: number;
  skills: string[];
}

export async function createJob(
  supabase: SupabaseClient,
  clientId: string,
  input: NewJobInput
): Promise<Job | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      title: input.title,
      title_bn: input.titleBn ?? null,
      description: input.description,
      description_bn: input.descriptionBn ?? null,
      category: input.category,
      job_type: input.jobType,
      experience_level: input.experienceLevel,
      budget_bdt: input.budgetBdt,
      budget_min: input.budgetBdt,
      budget_max: input.budgetBdt,
      timeline_days: input.timelineDays,
      skills_required: input.skills,
      status: "open",
    })
    .select(JOB_SELECT)
    .single();

  if (error) {
    console.error("createJob failed:", error.message);
    return null;
  }

  return mapJobRow(data as ProjectRow);
}
