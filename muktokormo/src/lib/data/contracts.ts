import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WorkspaceContract,
  WorkspaceMilestone,
  ContractActivity,
  MilestoneStatus,
  ContractStage,
  JobCategory,
} from "@/types";
import type {
  ContractPaymentStatus,
  ContractWorkStatus,
  EscrowLedgerRecord,
  PaymentRecord,
} from "@/types/payment";
import { INITIAL_WORKSPACE_CONTRACTS } from "@/data/mockContracts";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  calculateContractFeeBreakdown,
  isUuid,
  parseProposalContractAlias,
  roundBdt,
} from "@/lib/payments/constants";

const CONTRACTS_STORAGE_KEY = "muktokormo_contracts_store_v2";

interface RawMilestoneRow {
  id?: string;
  sort_order?: number | null;
  title?: string | null;
  description?: string | null;
  amount_bdt?: number | string | null;
  delivery_days?: number | null;
}

interface RawClientRow {
  id?: string;
  user_id?: string | null;
  display_name?: string | null;
  company_name?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  is_verified?: boolean | null;
}

interface RawFreelancerRow {
  id?: string;
  user_id?: string | null;
  display_name?: string | null;
  title?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  is_nid_verified?: boolean | null;
}

interface RawProjectRow {
  id?: string;
  title?: string | null;
  title_bn?: string | null;
  category?: string | null;
  client_id?: string | null;
  clients?: RawClientRow | RawClientRow[] | null;
  client?: RawClientRow | null;
}

interface RawProposalRow {
  id?: string;
  project_id?: string;
  freelancer_id?: string;
  bid_amount?: number | string | null;
  delivery_days?: number | null;
  payout_method?: string | null;
  payout_account?: string | null;
  projects?: RawProjectRow | RawProjectRow[] | null;
  project?: RawProjectRow | null;
  freelancers?: RawFreelancerRow | RawFreelancerRow[] | null;
  freelancer?: RawFreelancerRow | null;
  proposal_milestones?: RawMilestoneRow[] | null;
}

export interface RawContractRow {
  id: string;
  proposal_id?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  freelancer_id?: string | null;
  contract_code?: string | null;
  total_amount?: number | string | null;
  platform_fee_pct?: number | string | null;
  platform_fee_amount?: number | string | null;
  freelancer_payable_amount?: number | string | null;
  funded_amount?: number | string | null;
  released_amount?: number | string | null;
  refunded_amount?: number | string | null;
  payment_status?: string | null;
  work_status?: string | null;
  funded_at?: string | null;
  work_started_at?: string | null;
  submission_notes?: string | null;
  submission_demo_url?: string | null;
  submission_files?: unknown;
  submitted_at?: string | null;
  revision_feedback?: string | null;
  approved_at?: string | null;
  released_at?: string | null;
  refunded_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  proposals?: RawProposalRow | RawProposalRow[] | null;
  proposal?: RawProposalRow | null;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

function getLocalStore(): WorkspaceContract[] {
  if (typeof window === "undefined") return INITIAL_WORKSPACE_CONTRACTS;
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(INITIAL_WORKSPACE_CONTRACTS));
      return INITIAL_WORKSPACE_CONTRACTS;
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as WorkspaceContract[])
      : INITIAL_WORKSPACE_CONTRACTS;
  } catch {
    return INITIAL_WORKSPACE_CONTRACTS;
  }
}

function saveLocalStore(contracts: WorkspaceContract[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  } catch (err) {
    console.error("Failed to save local contracts store:", err);
  }
}

function deriveMilestoneStatusFromContract(
  paymentStatus: ContractPaymentStatus,
  workStatus: ContractWorkStatus,
  index: number
): MilestoneStatus {
  if (paymentStatus === "RELEASED" || workStatus === "RELEASED" || workStatus === "APPROVED") {
    return "APPROVED_RELEASED";
  }
  if (workStatus === "SUBMITTED") {
    return index === 0 ? "SUBMITTED" : "LOCKED_IN_ESCROW";
  }
  if (workStatus === "REVISION_REQUESTED") {
    return index === 0 ? "REVISION_REQUESTED" : "LOCKED_IN_ESCROW";
  }
  if (paymentStatus === "FUNDED") {
    return index === 0 ? "IN_PROGRESS" : "LOCKED_IN_ESCROW";
  }
  return "PENDING_FUNDING";
}

function buildDeterministicActivityLogs(
  row: RawContractRow,
  ledger: EscrowLedgerRecord[],
  clientName: string,
  freelancerName: string
): ContractActivity[] {
  const logs: ContractActivity[] = [];

  for (const entry of ledger) {
    const trxId =
      typeof entry.metadata?.transaction_id === "string"
        ? entry.metadata.transaction_id
        : undefined;

    if (entry.entry_type === "FUND") {
      logs.push({
        id: `ledger-${entry.id}`,
        timestamp: entry.created_at,
        actor: "SSLCOMMERZ Sandbox",
        actorRole: "ESCROW_GATEWAY",
        action: `Escrow Funded · ৳${Number(entry.amount).toLocaleString()} BDT`,
        details: entry.description,
        badgeType: "ESCROW",
        trxId,
      });
    } else if (entry.entry_type === "RELEASE") {
      logs.push({
        id: `ledger-${entry.id}`,
        timestamp: entry.created_at,
        actor: clientName,
        actorRole: "CLIENT",
        action: `Work Approved & Released · ৳${Number(entry.freelancer_net_amount).toLocaleString()} Net`,
        details: entry.description,
        badgeType: "PAYOUT",
        trxId,
      });
    } else if (entry.entry_type === "REFUND") {
      logs.push({
        id: `ledger-${entry.id}`,
        timestamp: entry.created_at,
        actor: "MuktoKormo Admin",
        actorRole: "SYSTEM",
        action: `Refund Recorded · ৳${Number(entry.amount).toLocaleString()} BDT`,
        details: entry.description,
        badgeType: "REVISION",
        trxId,
      });
    }
  }

  if (row.submitted_at) {
    logs.push({
      id: `sub-${row.id}`,
      timestamp: row.submitted_at,
      actor: freelancerName,
      actorRole: "FREELANCER",
      action: "Completed Work Submitted",
      details: row.submission_notes?.trim() || "Deliverables submitted for client review.",
      badgeType: "SUBMISSION",
    });
  }

  if (logs.length === 0) {
    logs.push({
      id: `init-${row.id}`,
      timestamp: row.start_date || "Just now",
      actor: "MuktoKormo System",
      actorRole: "SYSTEM",
      action: "Contract Created · Awaiting Escrow Funding",
      details:
        "Contract record created in Supabase. Fund via SSLCOMMERZ Sandbox to activate simulated escrow custody.",
      badgeType: "INFO",
    });
  }

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function mapRowToWorkspaceContract(
  row: RawContractRow,
  extras?: {
    ledger?: EscrowLedgerRecord[];
    payments?: PaymentRecord[];
  }
): WorkspaceContract {
  const proposal = pickFirst(row.proposals) ?? row.proposal ?? undefined;
  const project =
    pickFirst(proposal?.projects) ?? proposal?.project ?? undefined;
  const client = pickFirst(project?.clients) ?? project?.client ?? undefined;
  const freelancer =
    pickFirst(proposal?.freelancers) ?? proposal?.freelancer ?? undefined;
  const milestonesRaw = Array.isArray(proposal?.proposal_milestones)
    ? proposal.proposal_milestones
    : [];

  const totalBdt = Number(row.total_amount ?? proposal?.bid_amount ?? 0);
  const feePct =
    row.platform_fee_pct !== null && row.platform_fee_pct !== undefined
      ? Number(row.platform_fee_pct)
      : DEFAULT_PLATFORM_FEE_PCT;
  const breakdown = calculateContractFeeBreakdown(totalBdt, feePct);

  const paymentStatus = String(
    row.payment_status ?? "UNPAID"
  ).toUpperCase() as ContractPaymentStatus;
  const workStatus = String(
    row.work_status ?? "NOT_STARTED"
  ).toUpperCase() as ContractWorkStatus;

  const fundedAmount = roundBdt(Number(row.funded_amount ?? 0));
  const releasedAmount = roundBdt(Number(row.released_amount ?? 0));
  const refundedAmount = roundBdt(Number(row.refunded_amount ?? 0));
  const escrowHeldBdt =
    paymentStatus === "FUNDED"
      ? Math.max(0, roundBdt(fundedAmount - releasedAmount - refundedAmount))
      : 0;
  const remainingBdt = Math.max(
    0,
    roundBdt(totalBdt - releasedAmount - refundedAmount)
  );

  const clientName =
    client?.display_name || client?.company_name || "Verified Client";
  const freelancerName = freelancer?.display_name || "Freelancer Partner";

  const submissionFiles = Array.isArray(row.submission_files)
    ? row.submission_files.filter((item): item is string => typeof item === "string")
    : [];

  const milestones: WorkspaceMilestone[] =
    milestonesRaw.length > 0
      ? milestonesRaw.map((m, idx) => ({
          id: m.id || `ms-${idx + 1}`,
          order: m.sort_order || idx + 1,
          title: m.title || `Milestone ${idx + 1}`,
          description: m.description || `Deliverable phase ${idx + 1}`,
          amountBdt: Number(
            m.amount_bdt ?? Math.round(totalBdt / Math.max(1, milestonesRaw.length))
          ),
          dueDate: m.delivery_days
            ? `${m.delivery_days} days`
            : row.end_date || "Flexible",
          status: deriveMilestoneStatusFromContract(paymentStatus, workStatus, idx),
          ...(idx === 0 && row.submission_notes
            ? {
                deliverableNotes: row.submission_notes,
                liveUrl: row.submission_demo_url ?? undefined,
                fileNames: submissionFiles,
                submittedAt: row.submitted_at ?? undefined,
              }
            : {}),
        }))
      : [
          {
            id: `ms-full-${row.id}`,
            order: 1,
            title: project?.title ? `${project.title} — Full Contract Delivery` : "Full Contract Deliverable",
            description:
              "Single-escrow contract funded via SSLCOMMERZ Sandbox and settled on internal escrow ledger.",
            amountBdt: totalBdt,
            dueDate: row.end_date || "Upon completion",
            status: deriveMilestoneStatusFromContract(paymentStatus, workStatus, 0),
            deliverableNotes: row.submission_notes ?? undefined,
            liveUrl: row.submission_demo_url ?? undefined,
            fileNames: submissionFiles,
            submittedAt: row.submitted_at ?? undefined,
          },
        ];

  const ledger = extras?.ledger ?? [];
  const sortedPayments = (extras?.payments ?? [])
    .slice()
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  const latestPayment = sortedPayments[0] ?? null;

  const rawStage = String(row.status ?? "active").toUpperCase();
  const normalizedStage: ContractStage =
    rawStage === "COMPLETED" ||
    rawStage === "DISPUTED" ||
    rawStage === "TERMINATED"
      ? (rawStage as ContractStage)
      : "ACTIVE";

  return {
    id: row.id,
    contractCode:
      row.contract_code ||
      `MK-CTR-${String(row.id).slice(0, 6).toUpperCase()}`,
    jobId: row.project_id || project?.id || proposal?.project_id || "job-1",
    proposalId: row.proposal_id || proposal?.id || undefined,
    title: project?.title || "Contract Engagement",
    titleBn: project?.title_bn || project?.title || "চুক্তি",
    category: (project?.category || "Web & App Development") as JobCategory,
    client: {
      id: row.client_id || client?.id || project?.client_id || undefined,
      userId: client?.user_id || undefined,
      name: clientName,
      company: client?.company_name || "SME Enterprise BD",
      location: client?.location || "Dhaka, Bangladesh",
      avatar:
        client?.avatar_url ||
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      rating: client?.rating ?? 4.9,
      isVerified: client?.is_verified ?? true,
    },
    freelancer: {
      id: row.freelancer_id || freelancer?.id || proposal?.freelancer_id || undefined,
      userId: freelancer?.user_id || undefined,
      name: freelancerName,
      title: freelancer?.title || "Senior Specialist",
      avatar:
        freelancer?.avatar_url ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      rating: freelancer?.rating ?? 4.95,
      isNidVerified: freelancer?.is_nid_verified ?? true,
      phone: "Verified on account",
      payoutMethod:
        proposal?.payout_method === "NAGAD" ||
        proposal?.payout_method === "ROCKET" ||
        proposal?.payout_method === "BANK"
          ? proposal.payout_method
          : "BKASH",
      payoutAccount: proposal?.payout_account || "Internal Ledger",
    },
    totalBdt,
    platformFeePct: breakdown.platformFeePct,
    platformFeeAmount:
      row.platform_fee_amount !== null && row.platform_fee_amount !== undefined
        ? Number(row.platform_fee_amount)
        : breakdown.platformFeeAmount,
    netEarningsBdt:
      row.freelancer_payable_amount !== null &&
      row.freelancer_payable_amount !== undefined &&
      Number(row.freelancer_payable_amount) > 0
        ? Number(row.freelancer_payable_amount)
        : breakdown.freelancerPayableAmount,
    escrowHeldBdt,
    fundedBdt: fundedAmount,
    releasedBdt: releasedAmount,
    refundedBdt: refundedAmount,
    remainingBdt,
    paymentStatus,
    workStatus,
    fundedAt: row.funded_at ?? null,
    releasedAt: row.released_at ?? null,
    refundedAt: row.refunded_at ?? null,
    submissionNotes: row.submission_notes ?? null,
    submissionDemoUrl: row.submission_demo_url ?? null,
    submissionFiles,
    revisionFeedback: row.revision_feedback ?? null,
    escrowLedger: ledger,
    latestPayment,
    startedAt: row.start_date || "Just now",
    deadlineDate: row.end_date || "Flexible",
    stage: normalizedStage,
    milestones,
    activityLogs: buildDeterministicActivityLogs(
      row,
      ledger,
      clientName,
      freelancerName
    ),
  };
}

export function mapProposalToContract(prop: RawProposalRow): WorkspaceContract {
  const project = pickFirst(prop?.projects) ?? prop?.project ?? undefined;
  const client = pickFirst(project?.clients) ?? project?.client ?? undefined;
  const freelancer =
    pickFirst(prop?.freelancers) ?? prop?.freelancer ?? undefined;
  const totalBdt = Number(prop.bid_amount || 0);
  const breakdown = calculateContractFeeBreakdown(
    totalBdt,
    DEFAULT_PLATFORM_FEE_PCT
  );

  return {
    id: `ctr-${prop.id}`,
    contractCode: `MK-CTR-${String(prop.id).slice(0, 6).toUpperCase()}`,
    jobId: project?.id || prop.project_id || "job-1",
    proposalId: prop.id,
    title: project?.title || "Contract Engagement",
    titleBn: project?.title_bn || project?.title || "চুক্তি",
    category: (project?.category || "Web & App Development") as JobCategory,
    client: {
      id: client?.id || project?.client_id || undefined,
      userId: client?.user_id || undefined,
      name: client?.display_name || client?.company_name || "Verified Client",
      company: client?.company_name || "SME Enterprise BD",
      location: client?.location || "Dhaka, Bangladesh",
      avatar:
        client?.avatar_url ||
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      rating: client?.rating ?? 4.9,
      isVerified: client?.is_verified ?? true,
    },
    freelancer: {
      id: freelancer?.id || prop.freelancer_id || undefined,
      userId: freelancer?.user_id || undefined,
      name: freelancer?.display_name || "Freelancer Partner",
      title: freelancer?.title || "Specialist",
      avatar:
        freelancer?.avatar_url ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      rating: freelancer?.rating ?? 4.95,
      isNidVerified: freelancer?.is_nid_verified ?? true,
      phone: "Verified on account",
      payoutMethod:
        prop.payout_method === "NAGAD" ||
        prop.payout_method === "ROCKET" ||
        prop.payout_method === "BANK"
          ? prop.payout_method
          : "BKASH",
      payoutAccount: prop.payout_account || "Internal Ledger",
    },
    totalBdt,
    platformFeePct: breakdown.platformFeePct,
    platformFeeAmount: breakdown.platformFeeAmount,
    netEarningsBdt: breakdown.freelancerPayableAmount,
    escrowHeldBdt: 0,
    fundedBdt: 0,
    releasedBdt: 0,
    refundedBdt: 0,
    remainingBdt: totalBdt,
    paymentStatus: "UNPAID",
    workStatus: "NOT_STARTED",
    escrowLedger: [],
    latestPayment: null,
    startedAt: "Just now",
    deadlineDate: `${prop.delivery_days || 14} days`,
    stage: "ACTIVE",
    milestones: [
      {
        id: `ms-prop-${prop.id}`,
        order: 1,
        title: project?.title || "Full Contract Deliverable",
        description: "Awaiting contract row creation and SSLCOMMERZ Sandbox funding.",
        amountBdt: totalBdt,
        dueDate: `${prop.delivery_days || 14} days`,
        status: "PENDING_FUNDING",
      },
    ],
    activityLogs: [],
  };
}

async function fetchLedgerAndPaymentsForContracts(
  supabase: SupabaseClient,
  contractIds: string[]
): Promise<{
  ledgerByContract: Map<string, EscrowLedgerRecord[]>;
  paymentsByContract: Map<string, PaymentRecord[]>;
}> {
  const ledgerByContract = new Map<string, EscrowLedgerRecord[]>();
  const paymentsByContract = new Map<string, PaymentRecord[]>();

  if (contractIds.length === 0) {
    return { ledgerByContract, paymentsByContract };
  }

  try {
    const [{ data: ledgerRows }, { data: paymentRows }] = await Promise.all([
      supabase
        .from("escrow_ledger")
        .select("*")
        .in("contract_id", contractIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .in("contract_id", contractIds)
        .order("created_at", { ascending: false }),
    ]);

    for (const row of (ledgerRows ?? []) as unknown as EscrowLedgerRecord[]) {
      const list = ledgerByContract.get(row.contract_id) ?? [];
      list.push({
        ...row,
        amount: Number(row.amount),
        platform_fee_amount: Number(row.platform_fee_amount),
        freelancer_net_amount: Number(row.freelancer_net_amount),
      });
      ledgerByContract.set(row.contract_id, list);
    }

    for (const row of (paymentRows ?? []) as unknown as PaymentRecord[]) {
      const list = paymentsByContract.get(row.contract_id) ?? [];
      list.push({
        ...row,
        amount: Number(row.amount),
        platform_fee_pct: Number(row.platform_fee_pct),
        platform_fee: Number(row.platform_fee),
        freelancer_amount: Number(row.freelancer_amount),
      });
      paymentsByContract.set(row.contract_id, list);
    }
  } catch {
    // Gracefully continue if financial tables haven't been queried or migrated yet
  }

  return { ledgerByContract, paymentsByContract };
}

export async function createContractFromProposal(
  supabase: SupabaseClient,
  proposalId: string
): Promise<WorkspaceContract | null> {
  try {
    const { data: existing } = await supabase
      .from("contracts")
      .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
      .eq("proposal_id", proposalId)
      .maybeSingle();

    if (existing) {
      const { ledgerByContract, paymentsByContract } =
        await fetchLedgerAndPaymentsForContracts(supabase, [
          (existing as { id: string }).id,
        ]);
      const cid = (existing as { id: string }).id;
      return mapRowToWorkspaceContract(existing as unknown as RawContractRow, {
        ledger: ledgerByContract.get(cid) ?? [],
        payments: paymentsByContract.get(cid) ?? [],
      });
    }

    const { data: prop, error: propErr } = await supabase
      .from("proposals")
      .select("*, projects(*, clients(*)), freelancers(*), proposal_milestones(*)")
      .eq("id", proposalId)
      .single();

    if (propErr || !prop) {
      console.error("createContractFromProposal proposal lookup failed:", propErr?.message);
      return null;
    }

    const propTyped = prop as unknown as RawProposalRow;
    const deliveryDays = propTyped.delivery_days || 14;
    const startDate = new Date();
    const endDate = new Date(Date.now() + deliveryDays * 86400000);

    const { data: created, error: insertErr } = await supabase
      .from("contracts")
      .insert({
        proposal_id: proposalId,
        total_amount: Number(propTyped.bid_amount),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
      })
      .select()
      .maybeSingle();

    if (!insertErr && created) {
      const { data: fullContract } = await supabase
        .from("contracts")
        .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
        .eq("id", (created as { id: string }).id)
        .maybeSingle();

      if (fullContract) {
        return mapRowToWorkspaceContract(fullContract as unknown as RawContractRow);
      }
      return mapRowToWorkspaceContract({
        ...(created as unknown as RawContractRow),
        proposals: propTyped,
      });
    }

    if (insertErr) {
      // Handle race condition if another tab/server call materialized the contract row first
      const { data: racedExisting } = await supabase
        .from("contracts")
        .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
        .eq("proposal_id", proposalId)
        .maybeSingle();

      if (racedExisting) {
        const cid = (racedExisting as { id: string }).id;
        const { ledgerByContract, paymentsByContract } =
          await fetchLedgerAndPaymentsForContracts(supabase, [cid]);
        return mapRowToWorkspaceContract(
          racedExisting as unknown as RawContractRow,
          {
            ledger: ledgerByContract.get(cid) ?? [],
            payments: paymentsByContract.get(cid) ?? [],
          }
        );
      }
      console.warn("createContractFromProposal insert fallback:", insertErr.message);
    }

    return mapProposalToContract(propTyped);
  } catch (err) {
    console.error("createContractFromProposal failed:", err);
    return null;
  }
}

export async function fetchUserContracts(
  supabase: SupabaseClient,
  opts?: {
    role?: "client" | "freelancer" | "admin";
    userId?: string | null;
    entityId?: string | null;
  }
): Promise<WorkspaceContract[]> {
  try {
    const { data: contractRows } = await supabase
      .from("contracts")
      .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
      .order("start_date", { ascending: false });

    const typedRows = (contractRows ?? []) as unknown as RawContractRow[];
    const contractIds = typedRows.map((r) => r.id).filter(Boolean);
    const { ledgerByContract, paymentsByContract } =
      await fetchLedgerAndPaymentsForContracts(supabase, contractIds);

    const liveContracts = typedRows.map((row) =>
      mapRowToWorkspaceContract(row, {
        ledger: ledgerByContract.get(row.id) ?? [],
        payments: paymentsByContract.get(row.id) ?? [],
      })
    );
    const existingProposalIds = new Set(
      liveContracts.map((c) => c.proposalId).filter(Boolean)
    );

    const { data: acceptedProps } = await supabase
      .from("proposals")
      .select("*, projects(*, clients(*)), freelancers(*), proposal_milestones(*)")
      .in("status", ["accepted", "ACCEPTED"])
      .order("created_at", { ascending: false });

    const uncontractedPropRows = (
      (acceptedProps ?? []) as unknown as RawProposalRow[]
    ).filter((p) => p.id && !existingProposalIds.has(p.id));

    if (opts?.userId || opts?.entityId || opts?.role) {
      const matchClient = (c: WorkspaceContract) => {
        const uId = opts.userId;
        const eId = opts.entityId;
        if (!uId && !eId) return false;
        if (uId && (c.client.userId === uId || c.client.id === uId)) return true;
        if (eId && (c.client.id === eId || c.client.userId === eId)) return true;
        return false;
      };

      const matchFreelancer = (c: WorkspaceContract) => {
        const uId = opts.userId;
        const eId = opts.entityId;
        if (!uId && !eId) return false;
        if (uId && (c.freelancer.userId === uId || c.freelancer.id === uId)) return true;
        if (eId && (c.freelancer.id === eId || c.freelancer.userId === eId)) return true;
        return false;
      };

      const matchContractByOpts = (c: WorkspaceContract) => {
        if (opts.role === "client") return matchClient(c);
        if (opts.role === "freelancer") return matchFreelancer(c);
        if (opts.role === "admin") return true;
        return matchClient(c) || matchFreelancer(c);
      };

      const mappedUncontracted = uncontractedPropRows
        .map(mapProposalToContract)
        .filter(matchContractByOpts);

      let resolvedUncontracted: WorkspaceContract[] = mappedUncontracted;
      if (
        mappedUncontracted.length > 0 &&
        opts.role !== "admin" &&
        (opts.userId || opts.entityId)
      ) {
        resolvedUncontracted = await Promise.all(
          mappedUncontracted.map(async (fallbackContract) => {
            if (!fallbackContract.proposalId) return fallbackContract;
            const created = await createContractFromProposal(
              supabase,
              fallbackContract.proposalId
            );
            return created ?? fallbackContract;
          })
        );
      }

      const filteredLive = liveContracts.filter(matchContractByOpts);
      const seenContracts = new Set(filteredLive.map((c) => c.id));
      const merged = [...filteredLive];
      for (const c of resolvedUncontracted) {
        if (!seenContracts.has(c.id)) {
          merged.push(c);
          seenContracts.add(c.id);
        }
      }

      const localMatches = getLocalStore().filter((c) => {
        if (opts.role === "client") return matchClient(c);
        if (opts.role === "freelancer") return matchFreelancer(c);
        return matchClient(c) || matchFreelancer(c);
      });

      for (const lc of localMatches) {
        if (!seenContracts.has(lc.id) && (!lc.proposalId || !seenContracts.has(`ctr-${lc.proposalId}`))) {
          merged.push(lc);
          seenContracts.add(lc.id);
        }
      }

      return merged;
    }

    return getLocalStore();
  } catch (err) {
    console.warn("fetchUserContracts query fallback:", err);
    return [];
  }
}

export async function fetchContractById(
  supabase: SupabaseClient,
  contractId: string
): Promise<WorkspaceContract | null> {
  if (isUuid(contractId)) {
    const { data: row, error } = await supabase
      .from("contracts")
      .select("*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))")
      .eq("id", contractId)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    const { ledgerByContract, paymentsByContract } =
      await fetchLedgerAndPaymentsForContracts(supabase, [contractId]);

    return mapRowToWorkspaceContract(row as unknown as RawContractRow, {
      ledger: ledgerByContract.get(contractId) ?? [],
      payments: paymentsByContract.get(contractId) ?? [],
    });
  }

  const aliasProposalId = parseProposalContractAlias(contractId);
  if (aliasProposalId) {
    return createContractFromProposal(supabase, aliasProposalId);
  }

  const allContracts = await fetchUserContracts(supabase);
  const found = allContracts.find((c) => c.id === contractId);
  if (found) return found;

  const local = getLocalStore();
  return local.find((c) => c.id === contractId) || INITIAL_WORKSPACE_CONTRACTS[0] || null;
}

export async function submitMilestoneDeliverable(
  supabase: SupabaseClient,
  contractId: string,
  milestoneId: string,
  submission: {
    notes: string;
    demoUrl?: string;
    attachments?: string[];
  }
): Promise<WorkspaceContract | null> {
  void supabase;
  const store = getLocalStore();
  const index = store.findIndex((c) => c.id === contractId);
  const contract = index !== -1 ? store[index] : INITIAL_WORKSPACE_CONTRACTS[0];
  if (!contract) return null;

  const updatedMilestones = contract.milestones.map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: "SUBMITTED" as const,
        submittedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        deliverableNotes: submission.notes,
        liveUrl: submission.demoUrl,
      };
    }
    return m;
  });

  const newActivity: ContractActivity = {
    id: `act-${Date.now()}`,
    timestamp: "Just now",
    actor: contract.freelancer.name,
    actorRole: "FREELANCER",
    action: "Milestone Deliverable Submitted",
    details: submission.notes || "Freelancer submitted completed work for client review.",
    badgeType: "SUBMISSION",
  };

  const updatedContract: WorkspaceContract = {
    ...contract,
    milestones: updatedMilestones,
    activityLogs: [newActivity, ...contract.activityLogs],
  };

  if (index !== -1) {
    store[index] = updatedContract;
  } else {
    store.push(updatedContract);
  }
  saveLocalStore(store);

  return updatedContract;
}

export async function approveMilestone(
  supabase: SupabaseClient,
  contractId: string,
  milestoneId: string
): Promise<WorkspaceContract | null> {
  void supabase;
  const store = getLocalStore();
  const index = store.findIndex((c) => c.id === contractId);
  const contract = index !== -1 ? store[index] : INITIAL_WORKSPACE_CONTRACTS[0];
  if (!contract) return null;

  let approvedAmount = 0;
  const updatedMilestones = contract.milestones.map((m) => {
    if (m.id === milestoneId) {
      approvedAmount = m.amountBdt;
      return {
        ...m,
        status: "APPROVED_RELEASED" as const,
      };
    }
    return m;
  });

  const newReleased = contract.releasedBdt + approvedAmount;
  const newEscrowHeld = Math.max(0, contract.escrowHeldBdt - approvedAmount);
  const newRemaining = Math.max(0, contract.remainingBdt - approvedAmount);
  const allApproved = updatedMilestones.every(
    (m) => m.status === "APPROVED_RELEASED" || m.status === "APPROVED_AND_RELEASED"
  );

  const newActivity: ContractActivity = {
    id: `act-${Date.now()}`,
    timestamp: "Just now",
    actor: contract.client.name,
    actorRole: "CLIENT",
    action: `Milestone Approved · ৳${approvedAmount.toLocaleString()} BDT Released`,
    details: "Funds transferred from simulated escrow ledger.",
    badgeType: "PAYOUT",
  };

  const updatedContract: WorkspaceContract = {
    ...contract,
    stage: allApproved ? "COMPLETED" : contract.stage,
    escrowHeldBdt: newEscrowHeld,
    releasedBdt: newReleased,
    remainingBdt: newRemaining,
    milestones: updatedMilestones,
    activityLogs: [newActivity, ...contract.activityLogs],
  };

  if (index !== -1) {
    store[index] = updatedContract;
  } else {
    store.push(updatedContract);
  }
  saveLocalStore(store);

  return updatedContract;
}

export async function requestMilestoneRevision(
  supabase: SupabaseClient,
  contractId: string,
  milestoneId: string,
  feedback: string
): Promise<WorkspaceContract | null> {
  void supabase;
  const store = getLocalStore();
  const index = store.findIndex((c) => c.id === contractId);
  const contract = index !== -1 ? store[index] : INITIAL_WORKSPACE_CONTRACTS[0];
  if (!contract) return null;

  const updatedMilestones = contract.milestones.map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: "REVISION_REQUESTED" as const,
      };
    }
    return m;
  });

  const newActivity: ContractActivity = {
    id: `act-${Date.now()}`,
    timestamp: "Just now",
    actor: contract.client.name,
    actorRole: "CLIENT",
    action: "Revision Requested on Milestone",
    details: feedback || "Client requested adjustments to the submitted deliverable.",
    badgeType: "REVISION",
  };

  const updatedContract: WorkspaceContract = {
    ...contract,
    milestones: updatedMilestones,
    activityLogs: [newActivity, ...contract.activityLogs],
  };

  if (index !== -1) {
    store[index] = updatedContract;
  } else {
    store.push(updatedContract);
  }
  saveLocalStore(store);

  return updatedContract;
}
