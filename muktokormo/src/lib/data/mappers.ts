import type {
  Job,
  JobCategory,
  Freelancer,
  JobBid,
  BidMilestone,
  DraftJob,
  TrackedProposal,
  TrackedProposalStatus,
} from "@/types";

export const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

export const PLATFORM_FEE_PCT = 0.07;

const JOB_CATEGORIES: JobCategory[] = [
  "Web & App Development",
  "UI/UX & Graphic Design",
  "Digital Marketing & SEO",
  "Video Editing & Animation",
  "Bangla & English Content",
  "Virtual Assistance & Data",
];

export function relativeTime(iso?: string | null): string {
  if (!iso) return "Just now";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Just now";
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function toJobCategory(value?: string | null): JobCategory {
  if (value && (JOB_CATEGORIES as string[]).includes(value)) {
    return value as JobCategory;
  }
  return "Web & App Development";
}

export function toExperienceLevel(
  value?: string | null
): Job["experienceLevel"] {
  if (
    value === "Entry Level" ||
    value === "Intermediate" ||
    value === "Expert"
  ) {
    return value;
  }
  return "Intermediate";
}

export function toJobType(value?: string | null): Job["jobType"] {
  return value === "Milestone Based" ? "Milestone Based" : "Fixed Price";
}

function toJobStatus(value?: string | null): Job["status"] {
  switch ((value ?? "").toLowerCase()) {
    case "completed":
      return "COMPLETED";
    case "in_progress":
      return "IN_PROGRESS";
    default:
      return "OPEN";
  }
}

function toBidStatus(value?: string | null): JobBid["status"] {
  switch ((value ?? "").toLowerCase()) {
    case "shortlisted":
      return "SHORTLISTED";
    case "accepted":
      return "ACCEPTED";
    case "rejected":
      return "REJECTED";
    default:
      return "PENDING";
  }
}

function toTrackedStatus(value?: string | null): TrackedProposalStatus {
  switch ((value ?? "").toLowerCase()) {
    case "shortlisted":
      return "SHORTLISTED";
    case "accepted":
      return "ACCEPTED";
    case "rejected":
      return "REJECTED";
    case "interview":
      return "INTERVIEW";
    default:
      return "PENDING";
  }
}

function toPayoutMethod(value?: string | null): JobBid["payoutMethod"] {
  if (
    value === "BKASH" ||
    value === "NAGAD" ||
    value === "ROCKET" ||
    value === "BANK"
  ) {
    return value;
  }
  return "BKASH";
}

export interface ClientEmbed {
  display_name?: string | null;
  company_name?: string | null;
  location?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  is_verified?: boolean | null;
}

export interface FreelancerEmbed {
  display_name?: string | null;
  title?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  is_nid_verified?: boolean | null;
}

export interface ProjectRow {
  id: string;
  title: string;
  title_bn?: string | null;
  description: string;
  description_bn?: string | null;
  category?: string | null;
  job_type?: string | null;
  experience_level?: string | null;
  budget_bdt?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  timeline_days?: number | null;
  skills_required?: string[] | null;
  proposals_count?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completion_pct?: number | null;
  clients?: ClientEmbed | ClientEmbed[] | null;
}

export interface FreelancerRow {
  id: string;
  display_name?: string | null;
  title?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  hourly_rate?: number | null;
  earned_bdt?: number | null;
  is_nid_verified?: boolean | null;
  skills?: string[] | null;
  success_rate?: number | null;
  bio?: string | null;
  available?: boolean | null;
}

export interface ProposalMilestoneRow {
  id: string;
  proposal_id?: string;
  sort_order?: number | null;
  title: string;
  amount_bdt: number;
  delivery_days?: number | null;
}

export interface ProposalRow {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_letter: string;
  bid_amount: number;
  status?: string | null;
  created_at?: string | null;
  delivery_days?: number | null;
  bidding_type?: string | null;
  platform_fee?: number | null;
  net_earned?: number | null;
  payout_method?: string | null;
  payout_account?: string | null;
  portfolio_links?: string[] | null;
  freelancers?: FreelancerEmbed | FreelancerEmbed[] | null;
  proposal_milestones?: ProposalMilestoneRow[] | null;
  projects?: ProjectRow | ProjectRow[] | null;
}

export function firstEmbed<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export function mapJobRow(row: ProjectRow): Job {
  const client = firstEmbed(row.clients);
  return {
    id: row.id,
    title: row.title,
    titleBn: row.title_bn ?? undefined,
    clientName: client?.display_name || client?.company_name || "Verified Client",
    clientLocation: client?.location || "Bangladesh",
    clientRating: client?.rating ?? 5,
    clientVerified: client?.is_verified ?? false,
    category: toJobCategory(row.category),
    description: row.description,
    descriptionBn: row.description_bn ?? undefined,
    budgetBdt: row.budget_bdt ?? row.budget_max ?? row.budget_min ?? 0,
    jobType: toJobType(row.job_type),
    experienceLevel: toExperienceLevel(row.experience_level),
    skills: row.skills_required ?? [],
    proposalsCount: row.proposals_count ?? 0,
    postedAt: relativeTime(row.created_at),
    deadlineDays: row.timeline_days ?? 7,
    status: toJobStatus(row.status),
  };
}

export function mapFreelancerRow(row: FreelancerRow): Freelancer {
  return {
    id: row.id,
    name: row.display_name || "Freelancer",
    title: row.title || "Freelancer",
    location: row.location || "Bangladesh",
    avatar: row.avatar_url || DEFAULT_AVATAR,
    rating: row.rating ?? 0,
    reviewsCount: row.reviews_count ?? 0,
    hourlyRateBdt: row.hourly_rate ?? 0,
    earnedBdt: row.earned_bdt ?? 0,
    isNidVerified: row.is_nid_verified ?? false,
    skills: row.skills ?? [],
    successRate: row.success_rate ?? 0,
    bio: row.bio || "",
  };
}

export function mapMilestoneRow(row: ProposalMilestoneRow): BidMilestone {
  return {
    id: row.id,
    title: row.title,
    amountBdt: row.amount_bdt,
    deliveryDays: row.delivery_days ?? 0,
  };
}

export function mapProposalRow(row: ProposalRow): JobBid {
  const freelancer = firstEmbed(row.freelancers);
  const milestones = (row.proposal_milestones ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapMilestoneRow);

  const platformFee =
    row.platform_fee ?? Math.round(row.bid_amount * PLATFORM_FEE_PCT);

  return {
    id: row.id,
    jobId: row.project_id,
    freelancerId: row.freelancer_id,
    freelancerName: freelancer?.display_name || "Freelancer",
    freelancerTitle: freelancer?.title || "Freelancer",
    freelancerAvatar: freelancer?.avatar_url || DEFAULT_AVATAR,
    freelancerRating: freelancer?.rating ?? 0,
    freelancerReviewsCount: freelancer?.reviews_count ?? 0,
    isNidVerified: freelancer?.is_nid_verified ?? false,
    bidAmountBdt: row.bid_amount,
    platformFeeBdt: platformFee,
    netEarnedBdt: row.net_earned ?? row.bid_amount - platformFee,
    deliveryDays: row.delivery_days ?? 0,
    biddingType: row.bidding_type === "MILESTONES" ? "MILESTONES" : "PROJECT",
    milestones: milestones.length > 0 ? milestones : undefined,
    coverLetter: row.cover_letter,
    portfolioLinks: row.portfolio_links ?? [],
    payoutMethod: toPayoutMethod(row.payout_method),
    payoutAccount: row.payout_account || "",
    submittedAt: relativeTime(row.created_at),
    status: toBidStatus(row.status),
  };
}

function toDraftStatus(status?: string | null): DraftJob["status"] {
  switch ((status ?? "").toLowerCase()) {
    case "draft":
      return "DRAFT";
    case "pending_review":
      return "PENDING_REVIEW";
    case "expired":
      return "EXPIRED";
    default:
      return "LIVE";
  }
}

export function mapProjectToDraft(row: ProjectRow): DraftJob {
  return {
    id: row.id,
    title: row.title,
    titleBn: row.title_bn || row.title,
    category: toJobCategory(row.category),
    budgetBdt: row.budget_bdt ?? row.budget_max ?? row.budget_min ?? 0,
    updatedLabel: `Updated ${relativeTime(row.updated_at || row.created_at)}`,
    completionPct: row.completion_pct ?? 100,
    proposalCount: row.proposals_count ?? 0,
    status: toDraftStatus(row.status),
  };
}

export function mapProposalToTracked(row: ProposalRow): TrackedProposal {
  const project = firstEmbed(row.projects);
  const client = project ? firstEmbed(project.clients) : undefined;
  const platformFee =
    row.platform_fee ?? Math.round(row.bid_amount * PLATFORM_FEE_PCT);

  return {
    id: row.id,
    jobId: row.project_id,
    jobTitle: project?.title || "Job Submission",
    jobTitleBn: project?.title_bn || project?.title || "Job Submission",
    clientName:
      client?.display_name || client?.company_name || "Bangladeshi SME Client",
    bidBdt: row.bid_amount,
    netBdt: row.net_earned ?? row.bid_amount - platformFee,
    submittedLabel: `Submitted ${relativeTime(row.created_at)}`,
    status: toTrackedStatus(row.status),
  };
}
