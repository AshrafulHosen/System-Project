import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobBid, BidMilestone, TrackedProposal } from "@/types";
import {
  mapProposalRow,
  mapProposalToTracked,
  firstEmbed,
  DEFAULT_AVATAR,
  type ProposalRow,
} from "@/lib/data/mappers";

const PROPOSAL_SELECT =
  "*, freelancers(display_name, title, avatar_url, rating, reviews_count, is_nid_verified), proposal_milestones(id, sort_order, title, amount_bdt, delivery_days)";

export async function fetchProposalsForJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<JobBid[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select(PROPOSAL_SELECT)
    .eq("project_id", jobId)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchProposalsForJob failed:", error.message);
    return [];
  }

  return ((data ?? []) as ProposalRow[]).map(mapProposalRow);
}

export async function fetchMyJobBids(
  supabase: SupabaseClient,
  freelancerId: string
): Promise<JobBid[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select(PROPOSAL_SELECT)
    .eq("freelancer_id", freelancerId)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMyJobBids failed:", error.message);
    return [];
  }

  return ((data ?? []) as ProposalRow[]).map(mapProposalRow);
}

export async function fetchMyProposals(
  supabase: SupabaseClient,
  freelancerId: string
): Promise<TrackedProposal[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select(
      "*, projects(id, title, title_bn, created_at, clients(display_name, company_name))"
    )
    .eq("freelancer_id", freelancerId)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMyProposals failed:", error.message);
    return [];
  }

  return ((data ?? []) as ProposalRow[]).map(mapProposalToTracked);
}

export interface ClientProposal {
  id: string;
  jobTitle: string;
  jobTitleBn: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerTitle: string;
  rating: number;
  reviews: number;
  bidBdt: number;
  deliveryDays: number;
  coverNote: string;
  isShortlisted: boolean;
}

export async function fetchClientProposals(
  supabase: SupabaseClient,
  clientId: string
): Promise<ClientProposal[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select(
      "*, projects!inner(title, title_bn, client_id), freelancers(display_name, title, avatar_url, rating, reviews_count)"
    )
    .eq("projects.client_id", clientId)
    .neq("status", "withdrawn")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchClientProposals failed:", error.message);
    return [];
  }

  return ((data ?? []) as ProposalRow[]).map((row) => {
    const freelancer = firstEmbed(row.freelancers);
    const project = firstEmbed(row.projects);
    const status = (row.status ?? "").toLowerCase();
    return {
      id: row.id,
      jobTitle: project?.title || "Job Post",
      jobTitleBn: project?.title_bn || project?.title || "Job Post",
      freelancerName: freelancer?.display_name || "Freelancer",
      freelancerAvatar: freelancer?.avatar_url || DEFAULT_AVATAR,
      freelancerTitle: freelancer?.title || "Freelancer",
      rating: freelancer?.rating ?? 0,
      reviews: freelancer?.reviews_count ?? 0,
      bidBdt: row.bid_amount,
      deliveryDays: row.delivery_days ?? 0,
      coverNote: row.cover_letter,
      isShortlisted: status === "shortlisted" || status === "accepted",
    };
  });
}

export interface SubmitProposalInput {
  jobId: string;
  freelancerId: string;
  bidAmountBdt: number;
  platformFeeBdt: number;
  netEarnedBdt: number;
  deliveryDays: number;
  biddingType: "PROJECT" | "MILESTONES";
  milestones?: BidMilestone[];
  coverLetter: string;
  portfolioLinks?: string[];
  payoutMethod: "BKASH" | "NAGAD" | "ROCKET" | "BANK";
  payoutAccount: string;
}

export async function submitProposal(
  supabase: SupabaseClient,
  input: SubmitProposalInput
): Promise<JobBid | null> {
  const { data, error } = await supabase
    .from("proposals")
    .insert({
      project_id: input.jobId,
      freelancer_id: input.freelancerId,
      bid_amount: input.bidAmountBdt,
      cover_letter: input.coverLetter,
      delivery_days: input.deliveryDays,
      bidding_type: input.biddingType,
      platform_fee: input.platformFeeBdt,
      net_earned: input.netEarnedBdt,
      payout_method: input.payoutMethod,
      payout_account: input.payoutAccount,
      portfolio_links: input.portfolioLinks ?? [],
      status: "pending",
    })
    .select(PROPOSAL_SELECT)
    .single();

  if (error) {
    console.error("submitProposal failed:", error.message);
    return null;
  }

  const proposal = data as ProposalRow;

  if (
    input.biddingType === "MILESTONES" &&
    input.milestones &&
    input.milestones.length > 0
  ) {
    const rows = input.milestones.map((m, index) => ({
      proposal_id: proposal.id,
      sort_order: index + 1,
      title: m.title,
      amount_bdt: m.amountBdt,
      delivery_days: m.deliveryDays,
    }));

    const { error: milestoneError } = await supabase
      .from("proposal_milestones")
      .insert(rows);

    if (milestoneError) {
      console.error("submitProposal milestones failed:", milestoneError.message);
    } else {
      proposal.proposal_milestones = rows.map((r, index) => ({
        id: `${proposal.id}-m${index}`,
        sort_order: r.sort_order,
        title: r.title,
        amount_bdt: r.amount_bdt,
        delivery_days: r.delivery_days,
      }));
    }
  }

  return mapProposalRow(proposal);
}

const DB_STATUS: Record<JobBid["status"], string> = {
  PENDING: "pending",
  SHORTLISTED: "shortlisted",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export async function updateProposalStatus(
  supabase: SupabaseClient,
  proposalId: string,
  status: JobBid["status"]
): Promise<boolean> {
  const { error } = await supabase
    .from("proposals")
    .update({ status: DB_STATUS[status] })
    .eq("id", proposalId);

  if (error) {
    console.error("updateProposalStatus failed:", error.message);
    return false;
  }

  return true;
}

export async function withdrawProposal(
  supabase: SupabaseClient,
  proposalId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("proposals")
    .update({ status: "withdrawn" })
    .eq("id", proposalId);

  if (error) {
    console.error("withdrawProposal failed:", error.message);
    return false;
  }

  return true;
}
