/**
 * Maps RPC result codes from the milestone functions to HTTP status codes
 * and human-readable messages. Shared by the milestone API routes.
 */
const MESSAGES: Record<string, [number, string]> = {
  CONTRACT_NOT_FOUND: [404, "Contract not found."],
  MILESTONE_NOT_FOUND: [404, "Milestone not found."],
  DISPUTE_NOT_FOUND: [404, "Dispute not found."],
  AMENDMENT_NOT_FOUND: [404, "That amendment is no longer awaiting a decision."],

  FORBIDDEN_NOT_CONTRACT_PARTY: [403, "You are not a party to this contract."],
  FORBIDDEN_NOT_CONTRACT_CLIENT: [403, "Only the contract's client can do this."],
  FORBIDDEN_CLIENT_ONLY: [403, "Only the client can do this."],
  FORBIDDEN_FREELANCER_ONLY: [403, "Only the freelancer can do this."],
  FORBIDDEN_ADMIN_ONLY: [403, "Only administrators can do this."],
  FORBIDDEN_NOT_REQUESTER: [403, "Only the person who requested this can withdraw it."],

  CONTRACT_NOT_ACTIVE: [409, "This contract is no longer active."],
  CONTRACT_ALREADY_HAS_PAYMENTS: [409, "This contract already has payment activity, so it can't be switched to milestones."],
  PLAN_LOCKED_USE_AMENDMENT: [409, "The milestone plan is locked. Propose an amendment instead."],
  PLAN_HAS_ACTIVE_MILESTONES: [409, "Some milestones are already funded, so the plan can't be replaced."],
  PLAN_NOT_PROPOSED: [409, "There is no proposed plan awaiting a decision."],
  PLAN_NOT_ACCEPTED: [409, "The milestone plan has not been accepted yet."],
  MILESTONE_NOT_AGREED: [409, "This milestone hasn't been agreed by both parties."],
  MILESTONE_NOT_FUNDED: [409, "This milestone isn't funded yet."],
  MILESTONE_NOT_APPROVED: [409, "The milestone must be approved before its payment can be released."],
  WORK_NOT_SUBMITTED: [409, "There is no submitted work to review."],
  INVALID_STATE_FOR_SUBMIT: [409, "Work can't be submitted in the milestone's current state."],
  ALREADY_RELEASED: [409, "This payment has already been released."],
  FUNDED_PAYMENT_NOT_FOUND: [409, "No funded payment was found for this milestone."],
  DISPUTE_NOT_ALLOWED: [409, "A dispute can only be opened on a funded milestone that isn't already disputed or released."],
  DISPUTE_ALREADY_RESOLVED: [409, "This dispute has already been resolved."],
  ONLY_UNFUNDED_MILESTONES_CAN_BE_CANCELLED: [409, "Only agreed milestones that haven't been funded can be cancelled."],
  PAYMENT_IN_PROGRESS: [409, "A payment for this milestone is in progress. Try again after it completes."],
  CANCEL_ALREADY_REQUESTED: [409, "Cancellation has already been requested."],
  NO_CANCEL_REQUEST: [409, "There is no cancellation request for this milestone."],
  OTHER_PARTY_MUST_CONFIRM: [409, "The other party has to confirm the cancellation."],

  INVALID_MILESTONES: [400, "Provide between 1 and 20 milestones."],
  INVALID_TITLE: [400, "Each milestone title must be 3–160 characters."],
  INVALID_AMOUNT: [400, "Each milestone amount must be between ৳10 and ৳1,00,00,000."],
  DESCRIPTION_TOO_LONG: [400, "Descriptions can be at most 4,000 characters."],
  INVALID_DATES: [400, "A milestone's deadline can't be before its start date."],
  NOTE_REQUIRED: [400, "Please explain what should change (at least 5 characters)."],
  NOTE_TOO_LONG: [400, "Notes can be at most 2,000 characters."],
  INVALID_MESSAGE: [400, "Describe the delivered work (5–4,000 characters)."],
  INVALID_URL: [400, "Links must start with http:// or https://."],
  INVALID_ATTACHMENTS: [400, "You can attach at most 10 links."],
  REASON_REQUIRED: [400, "Please give a reason (at least 10 characters)."],
  INVALID_RESOLUTION: [400, "Unknown resolution."],
  NOTES_REQUIRED: [400, "Resolution notes are required (at least 10 characters)."],
  UNKNOWN_ACTION: [400, "Unknown action."],
};

export function describeMilestoneResult(code: string | undefined | null): { status: number; error: string } {
  const hit = code ? MESSAGES[code] : undefined;
  if (hit) return { status: hit[0], error: hit[1] };
  return { status: 400, error: code ? `Request rejected (${code}).` : "Request rejected." };
}
