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

export interface ProposalSubmission {
  jobId: string;
  freelancerName: string;
  bidAmountBdt: number;
  platformFeeBdt: number;
  netEarnedBdt: number;
  deliveryDays: number;
  coverLetter: string;
  phone: string;
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
