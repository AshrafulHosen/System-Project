export type JobCategory = 
  | "Web & App Development"
  | "UI/UX & Graphic Design"
  | "Digital Marketing & SEO"
  | "Video Editing & Animation"
  | "Bangla & English Content"
  | "Virtual Assistance & Data";

export interface Job {
  id: string;
  title: string;
  titleBn?: string;
  clientName: string;
  clientLocation: string;
  clientRating: number;
  clientVerified: boolean;
  category: JobCategory;
  description: string;
  descriptionBn?: string;
  budgetBdt: number;
  jobType: "Fixed Price" | "Milestone Based";
  experienceLevel: "Entry Level" | "Intermediate" | "Expert";
  skills: string[];
  proposalsCount: number;
  postedAt: string;
  deadlineDays: number;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
}

export interface Freelancer {
  id: string;
  name: string;
  title: string;
  location: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  hourlyRateBdt: number;
  earnedBdt: number;
  isNidVerified: boolean;
  skills: string[];
  successRate: number;
  bio: string;
}

export interface BidMilestone {
  id: string;
  title: string;
  amountBdt: number;
  deliveryDays: number;
}

export interface JobBid {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerTitle: string;
  freelancerAvatar: string;
  freelancerRating: number;
  freelancerReviewsCount: number;
  isNidVerified: boolean;
  bidAmountBdt: number;
  platformFeeBdt: number;
  netEarnedBdt: number;
  deliveryDays: number;
  biddingType: "MILESTONES" | "PROJECT";
  milestones?: BidMilestone[];
  coverLetter: string;
  portfolioLinks?: string[];
  payoutMethod: "BKASH" | "NAGAD" | "ROCKET" | "BANK";
  payoutAccount: string;
  submittedAt: string;
  status: "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
}

export interface ProposalSubmission {
  jobId: string;
  freelancerName: string;
  freelancerTitle?: string;
  freelancerAvatar?: string;
  bidAmountBdt: number;
  platformFeeBdt: number;
  netEarnedBdt: number;
  deliveryDays: number;
  coverLetter: string;
  phone: string;
  biddingType?: "MILESTONES" | "PROJECT";
  milestones?: BidMilestone[];
  portfolioLinks?: string[];
  payoutMethod?: "BKASH" | "NAGAD" | "ROCKET" | "BANK";
}

export type OrgSize = "JUST_ME" | "2_9" | "10_99" | "100_499" | "500_4999" | "5000_PLUS";

export interface ClientOrgDetails {
  companyName: string;
  website: string;
  orgSize: OrgSize | "";
  role: string;
}

export type OnboardingTaskStatus = "DONE" | "IN_PROGRESS" | "TODO";

export interface OnboardingTask {
  id: string;
  label: string;
  labelBn: string;
  description: string;
  descriptionBn: string;
  status: OnboardingTaskStatus;
  required: boolean;
  actionLabel: string;
  href: string;
}

export type ContractStage = "ACTIVE" | "COMPLETED" | "DISPUTED" | "TERMINATED";

export type MilestoneStatus = 
  | "PENDING_FUNDING"
  | "LOCKED_IN_ESCROW"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED_RELEASED"
  | "APPROVED_AND_RELEASED"
  | "REVISION_REQUESTED";

export interface MilestoneSubmission {
  id: string;
  milestoneId: string;
  title: string;
  notes: string;
  demoUrl?: string;
  fileNames: string[];
  submittedAt: string;
  revisionFeedback?: string;
}

export interface WorkspaceMilestone {
  id: string;
  order: number;
  title: string;
  description: string;
  amountBdt: number;
  dueDate: string;
  status: MilestoneStatus;
  submission?: MilestoneSubmission;
  mfsTrxId?: string;
  releasedAt?: string;
}

export interface ContractActivity {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: "CLIENT" | "FREELANCER" | "SYSTEM" | "ESCROW_GATEWAY";
  action: string;
  details: string;
  badgeType?: "ESCROW" | "SUBMISSION" | "PAYOUT" | "REVISION" | "INFO" | "APPROVAL";
  trxId?: string;
}

export interface WorkspaceContract {
  id: string;
  contractCode: string;
  jobId: string;
  title: string;
  titleBn?: string;
  category: JobCategory;
  client: {
    name: string;
    company: string;
    location: string;
    avatar: string;
    rating: number;
    isVerified: boolean;
  };
  freelancer: {
    name: string;
    title: string;
    avatar: string;
    rating: number;
    isNidVerified: boolean;
    phone: string;
    payoutMethod: "BKASH" | "NAGAD" | "ROCKET" | "BANK";
    payoutAccount: string;
  };
  totalBdt: number;
  platformFeePct: number;
  netEarningsBdt: number;
  escrowHeldBdt: number;
  releasedBdt: number;
  remainingBdt: number;
  startedAt: string;
  deadlineDate: string;
  stage: "ACTIVE" | "COMPLETED" | "DISPUTED";
  milestones: WorkspaceMilestone[];
  activityLogs: ContractActivity[];
}

export interface DashboardContract {
  id: string;
  jobTitle: string;
  jobTitleBn: string;
  counterparty: string;
  counterpartyAvatar?: string;
  totalBdt: number;
  escrowHeldBdt: number;
  releasedBdt: number;
  stage: ContractStage;
  startedLabel: string;
  progressPct: number;
  nextMilestone: string;
  nextMilestoneDue: string;
}

export type TrackedProposalStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "REJECTED";

export interface TrackedProposal {
  id: string;
  jobId: string;
  jobTitle: string;
  jobTitleBn: string;
  clientName: string;
  bidBdt: number;
  netBdt: number;
  submittedLabel: string;
  status: TrackedProposalStatus;
}

export type PayoutMethod = "BKASH" | "NAGAD" | "ROCKET" | "BANK" | "ESCROW" | "PLATFORM_FEE";

export interface WalletEntry {
  id: string;
  label: string;
  labelBn: string;
  method: PayoutMethod;
  amountBdt: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
  createdLabel: string;
}

export interface DraftJob {
  id: string;
  title: string;
  titleBn: string;
  category: JobCategory;
  budgetBdt: number;
  updatedLabel: string;
  completionPct: number;
  proposalCount: number;
  status: "DRAFT" | "PENDING_REVIEW" | "LIVE" | "EXPIRED";
}

export interface ResourceCardData {
  id: string;
  title: string;
  titleBn: string;
  body: string;
  bodyBn: string;
  icon: string;
  accentClass: string;
  iconClass: string;
}

export interface EmploymentEntry {
  id: string;
  company: string;
  title: string;
  start: string;
  end: string;
  description: string;
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency: string;
}

export interface NavItem {
  id: string;
  label: string;
  labelBn: string;
  icon: string;
  href: string;
  badge?: number;
}

export type OrgSize = "JUST_ME" | "2_9" | "10_99" | "100_499" | "500_4999" | "5000_PLUS";

export interface ClientOrgDetails {
  companyName: string;
  website: string;
  orgSize: OrgSize | "";
  role: string;
}

export type OnboardingTaskStatus = "DONE" | "IN_PROGRESS" | "TODO";

export interface OnboardingTask {
  id: string;
  label: string;
  labelBn: string;
  description: string;
  descriptionBn: string;
  status: OnboardingTaskStatus;
  required: boolean;
  actionLabel: string;
  href: string;
}

export type ContractStage = "ACTIVE" | "COMPLETED" | "DISPUTED" | "TERMINATED";

export interface DashboardContract {
  id: string;
  jobTitle: string;
  jobTitleBn: string;
  counterparty: string;
  counterpartyAvatar?: string;
  totalBdt: number;
  escrowHeldBdt: number;
  releasedBdt: number;
  stage: ContractStage;
  startedLabel: string;
  progressPct: number;
  nextMilestone: string;
  nextMilestoneDue: string;
}

export type TrackedProposalStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ACCEPTED"
  | "REJECTED";

export interface TrackedProposal {
  id: string;
  jobId: string;
  jobTitle: string;
  jobTitleBn: string;
  clientName: string;
  bidBdt: number;
  netBdt: number;
  submittedLabel: string;
  status: TrackedProposalStatus;
}

export type PayoutMethod = "BKASH" | "NAGAD" | "ROCKET" | "BANK" | "ESCROW" | "PLATFORM_FEE";

export interface WalletEntry {
  id: string;
  label: string;
  labelBn: string;
  method: PayoutMethod;
  amountBdt: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
  createdLabel: string;
}

export interface DraftJob {
  id: string;
  title: string;
  titleBn: string;
  category: JobCategory;
  budgetBdt: number;
  updatedLabel: string;
  completionPct: number;
  proposalCount: number;
  status: "DRAFT" | "PENDING_REVIEW" | "LIVE" | "EXPIRED";
}

export interface ResourceCardData {
  id: string;
  title: string;
  titleBn: string;
  body: string;
  bodyBn: string;
  icon: string;
  accentClass: string;
  iconClass: string;
}

export interface EmploymentEntry {
  id: string;
  company: string;
  title: string;
  start: string;
  end: string;
  description: string;
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency: string;
}

export interface NavItem {
  id: string;
  label: string;
  labelBn: string;
  icon: string;
  href: string;
  badge?: number;
}
