export type MilestoneStatus =
  | "PENDING"
  | "FUNDED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "RELEASED"
  | "CANCELLED"
  | "DISPUTED";

export type MilestoneAgreementStatus = "DRAFT" | "PROPOSED" | "ACCEPTED" | "REJECTED";
export type MilestonePlanStatus = "NONE" | "DRAFT" | "PROPOSED" | "ACCEPTED";
export type BillingMode = "SINGLE" | "MILESTONE";

export interface MilestoneRecord {
  id: string;
  contract_id: string;
  sort_order: number;
  title: string;
  description: string;
  deliverables: string[];
  amount: number;
  start_date: string | null;
  deadline: string | null;
  status: MilestoneStatus;
  agreement_status: MilestoneAgreementStatus;
  cancel_requested_by: string | null;
  revision_count: number;
  funded_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  released_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface MilestoneSubmissionRecord {
  id: string;
  milestone_id: string;
  revision_number: number;
  message: string;
  demo_url: string | null;
  attachments: { label?: string; url: string }[];
  status: "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED" | "SUPERSEDED";
  review_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface MilestoneDisputeRecord {
  id: string;
  milestone_id: string;
  contract_id: string;
  raised_by_role: "client" | "freelancer";
  reason: string;
  previous_status: MilestoneStatus;
  status: "OPEN" | "RESOLVED";
  resolution: "RELEASE_TO_FREELANCER" | "REFUND_TO_CLIENT" | "RESUME_WORK" | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface MilestoneEventRecord {
  id: string;
  milestone_id: string | null;
  actor_role: string | null;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface MilestonePaymentSummary {
  milestone_id: string;
  status: string;
  transaction_id: string;
  amount: number;
  created_at: string;
}

export interface MilestoneContractSummary {
  id: string;
  billingMode: BillingMode;
  planStatus: MilestonePlanStatus;
  planNote: string | null;
  totalAmount: number;
  fundedAmount: number;
  releasedAmount: number;
  refundedAmount: number;
  platformFeePct: number;
  paymentStatus: string;
  status: string;
  /** Server-computed: the client may still convert this single-payment contract to milestones. */
  canConvertToMilestones: boolean;
}

export interface MilestoneWorkspacePayload {
  ok: true;
  viewerRole: "client" | "freelancer" | "admin";
  viewerUserId: string;
  contract: MilestoneContractSummary;
  milestones: MilestoneRecord[];
  submissions: MilestoneSubmissionRecord[];
  disputes: MilestoneDisputeRecord[];
  events: MilestoneEventRecord[];
  payments: MilestonePaymentSummary[];
  /** Seed for a first plan: the accepted proposal's milestone breakdown, if any. */
  proposalMilestones: { title: string; amount: number; delivery_days: number | null }[];
}

export interface MilestoneDraftInput {
  title: string;
  description?: string;
  deliverables?: string[];
  amount: number;
  start_date?: string | null;
  deadline?: string | null;
}
