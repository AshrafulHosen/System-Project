export type ContractPaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "FUNDED"
  | "FAILED"
  | "CANCELLED"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED";

export type ContractWorkStatus =
  | "NOT_STARTED"
  | "FUNDED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "RELEASED"
  | "DISPUTED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "FUNDED"
  | "FAILED"
  | "CANCELLED"
  | "RELEASED"
  | "REFUND_REQUESTED"
  | "REFUNDED";

export type PaymentTransactionEventType =
  | "INITIATE"
  | "SUCCESS_CALLBACK"
  | "FAIL_CALLBACK"
  | "CANCEL_CALLBACK"
  | "IPN_CALLBACK"
  | "VALIDATION_CHECK"
  | "REFUND_INITIATE"
  | "REFUND_STATUS";

export type EscrowLedgerEntryType = "FUND" | "RELEASE" | "REFUND";

export type RefundRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "GATEWAY_INITIATED"
  | "COMPLETED"
  | "FAILED";

export type RefundMode = "SIMULATED_INTERNAL" | "SSLCOMMERZ_SANDBOX_API";

export interface PaymentRecord {
  id: string;
  contract_id: string;
  client_id: string;
  freelancer_id: string;
  amount: number;
  platform_fee_pct: number;
  platform_fee: number;
  freelancer_amount: number;
  currency: "BDT";
  transaction_id: string;
  status: PaymentStatus;
  gateway: string;
  validation_id: string | null;
  bank_tran_id: string | null;
  card_type: string | null;
  card_brand: string | null;
  card_issuer: string | null;
  failure_reason: string | null;
  funded_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  payment_id: string;
  contract_id: string;
  event_type: PaymentTransactionEventType;
  gateway: string;
  gateway_transaction_id: string;
  validation_id: string | null;
  bank_tran_id: string | null;
  gateway_status: string;
  amount: number | null;
  currency: string | null;
  risk_level: string | null;
  response_summary: Record<string, unknown>;
  created_at: string;
}

export interface EscrowLedgerRecord {
  id: string;
  payment_id: string;
  contract_id: string;
  entry_type: EscrowLedgerEntryType;
  amount: number;
  platform_fee_amount: number;
  freelancer_net_amount: number;
  currency: "BDT";
  is_simulated: boolean;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RefundRequestRecord {
  id: string;
  payment_id: string;
  contract_id: string;
  requested_by_user_id: string;
  client_id: string;
  freelancer_id: string;
  amount: number;
  reason: string;
  status: RefundRequestStatus;
  refund_mode: RefundMode;
  gateway_refund_ref_id: string | null;
  gateway_status: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  role_target: "client" | "freelancer" | "admin";
  contract_id: string | null;
  payment_id: string | null;
  event_key: string;
  title: string;
  message: string;
  title_bn: string | null;
  message_bn: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PaymentDashboardItem extends PaymentRecord {
  contract_code: string;
  contract_title: string;
  contract_payment_status: ContractPaymentStatus;
  contract_work_status: ContractWorkStatus;
  client_name: string;
  client_company: string | null;
  freelancer_name: string;
  refund_request: RefundRequestRecord | null;
  recent_transactions?: PaymentTransactionRecord[];
}

export interface DashboardContractPaymentRow {
  id: string;
  contractCode: string;
  title: string;
  counterpartyName: string;
  counterpartyAvatar: string | null;
  totalBdt: number;
  platformFeePct: number;
  platformFeeAmount: number;
  netEarningsBdt: number;
  fundedBdt: number;
  releasedBdt: number;
  refundedBdt: number;
  paymentStatus: ContractPaymentStatus;
  workStatus: ContractWorkStatus;
  stage: "ACTIVE" | "COMPLETED" | "DISPUTED" | "TERMINATED";
  latestTransactionId: string | null;
  latestFailureReason: string | null;
  fundedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  canFund: boolean;
  canRetry: boolean;
  canVerifyPending: boolean;
}

export interface AdminRefundRequestItem extends RefundRequestRecord {
  contract_code: string;
  contract_title: string;
  transaction_id: string;
  client_name: string;
  freelancer_name: string;
  payment_status: PaymentStatus;
}

export interface ClientPaymentDashboardSummary {
  totalSpendingBdt: number;
  inEscrowBdt: number;
  releasedSpendingBdt: number;
  refundedBdt: number;
  fundedContractsCount: number;
  releasedContractsCount: number;
  pendingPaymentsCount: number;
  pendingPaymentAttemptsCount: number;
  failedOrCancelledCount: number;
  refundRequestsCount: number;
  pendingRefundCount: number;
}

export interface ClientPaymentDashboardPayload {
  ok: true;
  role: "client";
  simulationDisclaimer: string;
  summary: ClientPaymentDashboardSummary;
  contracts: DashboardContractPaymentRow[];
  payments: PaymentDashboardItem[];
  ledgerEntries: EscrowLedgerRecord[];
  refundRequests: RefundRequestRecord[];
}

export interface FreelancerPaymentDashboardSummary {
  totalEarningsBdt: number;
  releasedGrossBdt: number;
  releasedEarningsBdt: number;
  platformFeesDeductedBdt: number;
  pendingEarningsBdt: number;
  pendingEscrowGrossBdt: number;
  availableEarningsSimulatedBdt: number;
  activeFundedContractsCount: number;
  completedReleasedCount: number;
  refundedCount: number;
}

export interface FreelancerPaymentDashboardPayload {
  ok: true;
  role: "freelancer";
  simulationDisclaimer: string;
  summary: FreelancerPaymentDashboardSummary;
  activeFundedContracts: DashboardContractPaymentRow[];
  contracts: DashboardContractPaymentRow[];
  payments: PaymentDashboardItem[];
  ledgerEntries: EscrowLedgerRecord[];
  refundRequests: RefundRequestRecord[];
}

export interface AdminPaymentDashboardSummary {
  totalPaymentVolumeBdt: number;
  fundedPaymentsCount: number;
  fundedPaymentsAmountBdt: number;
  releasedPaymentsCount: number;
  releasedPaymentsAmountBdt: number;
  platformCommissionEarnedBdt: number;
  projectedCommissionBdt: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  cancelledPaymentsCount: number;
  refundedPaymentsCount: number;
  refundedAmountBdt: number;
  refundRequestsCount: number;
  pendingRefundRequestsCount: number;
  openDisputesCount: number;
}

export interface AdminPaymentDashboardPayload {
  ok: true;
  role: "admin";
  simulationDisclaimer: string;
  summary: AdminPaymentDashboardSummary;
  filters: {
    q: string;
    status: string;
    from: string;
    to: string;
  };
  totalCount: number;
  filteredCount: number;
  payments: PaymentDashboardItem[];
  refundRequests: AdminRefundRequestItem[];
}


