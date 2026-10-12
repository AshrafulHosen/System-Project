import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminOverview, ManagedUser, ManagedUserType } from "@/types";
import { firstEmbed, relativeTime } from "@/lib/data/mappers";

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface UserIdRow {
  user_id: string;
}

export async function fetchAdminOverview(
  supabase: SupabaseClient
): Promise<AdminOverview> {
  const [
    usersRes,
    clientsRes,
    freelancersRes,
    adminsRes,
    projectsRes,
    openProjectsRes,
    proposalsRes,
    contractsRes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("freelancers").select("id", { count: "exact", head: true }),
    supabase.from("admins").select("user_id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase.from("contracts").select("id", { count: "exact", head: true }),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const clients = clientsRes.count ?? 0;
  const freelancers = freelancersRes.count ?? 0;
  const admins = adminsRes.count ?? 0;

  return {
    totalUsers,
    clients,
    freelancers,
    admins,
    profilesMissing: Math.max(totalUsers - clients - freelancers - admins, 0),
    totalProjects: projectsRes.count ?? 0,
    openProjects: openProjectsRes.count ?? 0,
    totalProposals: proposalsRes.count ?? 0,
    totalContracts: contractsRes.count ?? 0,
  };
}

export async function fetchManagedUsers(
  supabase: SupabaseClient
): Promise<ManagedUser[]> {
  const [usersRes, clientsRes, freelancersRes, adminsRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, name, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("user_id"),
    supabase.from("freelancers").select("user_id"),
    supabase.from("admins").select("user_id"),
  ]);

  if (usersRes.error) {
    console.error("fetchManagedUsers failed:", usersRes.error.message);
    return [];
  }

  const clientIds = new Set(
    ((clientsRes.data ?? []) as UserIdRow[]).map((row) => row.user_id)
  );
  const freelancerIds = new Set(
    ((freelancersRes.data ?? []) as UserIdRow[]).map((row) => row.user_id)
  );
  const adminIds = new Set(
    ((adminsRes.data ?? []) as UserIdRow[]).map((row) => row.user_id)
  );

  return ((usersRes.data ?? []) as UserRow[]).map((user) => {
    const isAdmin = adminIds.has(user.id);
    const type: ManagedUserType = isAdmin
      ? "none"
      : clientIds.has(user.id)
        ? "client"
        : freelancerIds.has(user.id)
          ? "freelancer"
          : "none";

    return {
      id: user.id,
      name: user.name || user.email.split("@")[0] || "User",
      email: user.email,
      isAdmin,
      type,
      joinedAt: user.created_at,
      joinedLabel: relativeTime(user.created_at),
    };
  });
}

interface AdminProjectRowRaw {
  id: string;
  title: string;
  status?: string | null;
  budget_bdt?: number | null;
  budget_max?: number | null;
  budget_min?: number | null;
  proposals_count?: number | null;
  created_at?: string | null;
  clients?:
    | { display_name?: string | null; company_name?: string | null }
    | { display_name?: string | null; company_name?: string | null }[]
    | null;
}

export interface AdminProjectRow {
  id: string;
  title: string;
  status: string;
  budgetBdt: number;
  proposalsCount: number;
  clientName: string;
  postedLabel: string;
}

export async function fetchAdminRecentProjects(
  supabase: SupabaseClient,
  limit = 6
): Promise<AdminProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, status, budget_bdt, budget_max, budget_min, proposals_count, created_at, clients(display_name, company_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchAdminRecentProjects failed:", error.message);
    return [];
  }

  return ((data ?? []) as AdminProjectRowRaw[]).map((row) => {
    const client = firstEmbed(row.clients);
    return {
      id: row.id,
      title: row.title,
      status: (row.status ?? "open").toUpperCase(),
      budgetBdt: row.budget_bdt ?? row.budget_max ?? row.budget_min ?? 0,
      proposalsCount: row.proposals_count ?? 0,
      clientName:
        client?.display_name || client?.company_name || "Unnamed client",
      postedLabel: relativeTime(row.created_at),
    };
  });
}

interface AdminProposalRowRaw {
  id: string;
  bid_amount: number;
  status?: string | null;
  created_at?: string | null;
  freelancers?:
    | { display_name?: string | null }
    | { display_name?: string | null }[]
    | null;
  projects?: { title?: string | null } | { title?: string | null }[] | null;
}

export interface AdminProposalRow {
  id: string;
  freelancerName: string;
  jobTitle: string;
  bidBdt: number;
  status: string;
  submittedLabel: string;
}

export async function fetchAdminRecentProposals(
  supabase: SupabaseClient,
  limit = 6
): Promise<AdminProposalRow[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select(
      "id, bid_amount, status, created_at, freelancers(display_name), projects(title)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchAdminRecentProposals failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as AdminProposalRowRaw[]).map((row) => {
    const freelancer = firstEmbed(row.freelancers);
    const project = firstEmbed(row.projects);
    return {
      id: row.id,
      freelancerName: freelancer?.display_name || "Freelancer",
      jobTitle: project?.title || "Job post",
      bidBdt: row.bid_amount,
      status: (row.status ?? "pending").toUpperCase(),
      submittedLabel: relativeTime(row.created_at),
    };
  });
}
