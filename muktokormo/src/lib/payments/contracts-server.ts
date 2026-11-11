import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  calculateContractFeeBreakdown,
  isUuid,
  parseProposalContractAlias,
} from "@/lib/payments/constants";
import { computeEscrowLedgerSummary, ESCROW_SIMULATION_DISCLAIMER } from "@/lib/payments/escrow";
import { mapRowToWorkspaceContract, type RawContractRow } from "@/lib/data/contracts";
import type {
  EscrowLedgerRecord,
  PaymentRecord,
  PaymentTransactionRecord,
  RefundRequestRecord,
} from "@/types/payment";

if (typeof window !== "undefined") {
  throw new Error("src/lib/payments/contracts-server.ts cannot be imported in browser code.");
}

export interface AuthorizedContractContext {
  ok: boolean;
  statusCode: number;
  error?: string;
  contractRow?: RawContractRow;
  clientId?: string | null;
  freelancerId?: string | null;
  clientUserId?: string | null;
  freelancerUserId?: string | null;
  isContractClient?: boolean;
  isContractFreelancer?: boolean;
  isAdmin?: boolean;
  viewerRole?: "client" | "freelancer" | "admin";
  projectTitle?: string;
}

function firstItem<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0];
  return val ?? undefined;
}

/**
 * Loads a contract authoritatively via service_role and verifies that `userId`
 * is either the contract's client, the contract's freelancer, or a platform admin.
 */
export async function loadAuthorizedContractForUser(
  contractId: string,
  userId: string
): Promise<AuthorizedContractContext> {
  if (!isUuid(contractId)) {
    return { ok: false, statusCode: 400, error: "Invalid contract UUID." };
  }

  const adminDb = createAdminClient();
  const [
    { data: contractData, error: ctErr },
    { data: isAdminFlag },
    { data: userClient },
    { data: userFreelancer },
  ] = await Promise.all([
    adminDb
      .from("contracts")
      .select(
        "*, proposals(*, projects(*, clients(*)), freelancers(*), proposal_milestones(*))"
      )
      .eq("id", contractId)
      .maybeSingle(),
    adminDb.rpc("is_admin", { uid: userId }),
    adminDb.from("clients").select("id, user_id").eq("user_id", userId).maybeSingle(),
    adminDb.from("freelancers").select("id, user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (ctErr) {
    console.error("Failed loading contract:", ctErr.message);
    return {
      ok: false,
      statusCode: 500,
      error: "Failed to load contract from database.",
    };
  }

  if (!contractData) {
    return { ok: false, statusCode: 404, error: "Contract not found." };
  }

  const row = contractData as unknown as RawContractRow;
  const proposal = firstItem(row.proposals);
  const project = firstItem(proposal?.projects);
  const clientRel = firstItem(project?.clients);
  const freelancerRel = firstItem(proposal?.freelancers);

  const resolvedClientId = row.client_id ?? project?.client_id ?? clientRel?.id ?? null;
  const resolvedFreelancerId = row.freelancer_id ?? proposal?.freelancer_id ?? freelancerRel?.id ?? null;

  let clientUserId = clientRel?.user_id ?? null;
  let freelancerUserId = freelancerRel?.user_id ?? null;

  if (!clientUserId && resolvedClientId) {
    const { data: cRow } = await adminDb
      .from("clients")
      .select("user_id")
      .eq("id", resolvedClientId)
      .maybeSingle();
    clientUserId = cRow?.user_id ?? null;
  }

  if (!freelancerUserId && resolvedFreelancerId) {
    const { data: fRow } = await adminDb
      .from("freelancers")
      .select("user_id")
      .eq("id", resolvedFreelancerId)
      .maybeSingle();
    freelancerUserId = fRow?.user_id ?? null;
  }

  const isAdmin = Boolean(isAdminFlag);
  const isContractClient = Boolean(
    (clientUserId && clientUserId === userId) ||
      (userClient?.id && resolvedClientId === userClient.id)
  );
  const isContractFreelancer = Boolean(
    (freelancerUserId && freelancerUserId === userId) ||
      (userFreelancer?.id && resolvedFreelancerId === userFreelancer.id)
  );

  if (!isAdmin && !isContractClient && !isContractFreelancer) {
    return {
      ok: false,
      statusCode: 403,
      error: "Forbidden. You are not authorized to view or modify this contract.",
    };
  }

  let viewerRole: "client" | "freelancer" | "admin" = "client";
  if (isContractClient) {
    viewerRole = "client";
  } else if (isContractFreelancer) {
    viewerRole = "freelancer";
  } else if (isAdmin) {
    viewerRole = "admin";
  }

  const projectTitle =
    project?.title?.trim() ||
    `Contract ${row.contract_code || contractId.slice(0, 8)}`;

  return {
    ok: true,
    statusCode: 200,
    contractRow: row,
    clientId: resolvedClientId,
    freelancerId: resolvedFreelancerId,
    clientUserId,
    freelancerUserId,
    isContractClient,
    isContractFreelancer,
    isAdmin,
    viewerRole,
    projectTitle,
  };
}

/**
 * Checks whether a contract currently has a pending/in-flight refund request
 * (either payment.status = 'REFUND_REQUESTED' or an open refund_requests row).
 */
export async function hasOpenRefundForContract(contractId: string): Promise<boolean> {
  if (!isUuid(contractId)) return false;
  const adminDb = createAdminClient();
  const [{ data: refundPayment }, { data: openRefundRow }] = await Promise.all([
    adminDb
      .from("payments")
      .select("id")
      .eq("contract_id", contractId)
      .eq("status", "REFUND_REQUESTED")
      .limit(1)
      .maybeSingle(),
    adminDb
      .from("refund_requests")
      .select("id")
      .eq("contract_id", contractId)
      .in("status", ["PENDING", "APPROVED", "GATEWAY_INITIATED"])
      .limit(1)
      .maybeSingle(),
  ]);

  return Boolean(refundPayment?.id || openRefundRow?.id);
}

export async function getContractWorkspacePayload(
  contractId: string,
  userId: string
) {
  const ctx = await loadAuthorizedContractForUser(contractId, userId);
  if (!ctx.ok || !ctx.contractRow || !ctx.viewerRole) {
    return {
      ok: false,
      statusCode: ctx.statusCode,
      error: ctx.error ?? "Unable to load contract.",
    };
  }

  const adminDb = createAdminClient();
  const isClientOrAdmin = Boolean(ctx.isContractClient || ctx.isAdmin);

  let paymentsQuery = adminDb
    .from("payments")
    .select(
      "id, contract_id, client_id, freelancer_id, amount, platform_fee_pct, platform_fee, freelancer_amount, currency, transaction_id, status, gateway, validation_id, bank_tran_id, card_type, card_brand, card_issuer, failure_reason, funded_at, released_at, refunded_at, created_at, updated_at"
    )
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (!isClientOrAdmin) {
    paymentsQuery = paymentsQuery.in("status", [
      "FUNDED",
      "RELEASED",
      "REFUND_REQUESTED",
      "REFUNDED",
    ]);
  }

  const [
    { data: paymentRows },
    { data: ledgerRows },
    { data: refundRows },
  ] = await Promise.all([
    paymentsQuery,
    adminDb
      .from("escrow_ledger")
      .select(
        "id, payment_id, contract_id, entry_type, amount, platform_fee_amount, freelancer_net_amount, currency, is_simulated, description, metadata, created_at"
      )
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false }),
    adminDb
      .from("refund_requests")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false }),
  ]);

  const normalizedPayments: PaymentRecord[] = (paymentRows ?? []).map((row) => ({
    id: String(row.id),
    contract_id: String(row.contract_id),
    client_id: String(row.client_id),
    freelancer_id: String(row.freelancer_id),
    amount: Number(row.amount),
    platform_fee_pct: Number(row.platform_fee_pct),
    platform_fee: Number(row.platform_fee),
    freelancer_amount: Number(row.freelancer_amount),
    currency: "BDT",
    transaction_id: String(row.transaction_id),
    status: row.status as PaymentRecord["status"],
    gateway: String(row.gateway),
    validation_id: row.validation_id ? String(row.validation_id) : null,
    bank_tran_id: row.bank_tran_id ? String(row.bank_tran_id) : null,
    card_type: row.card_type ? String(row.card_type) : null,
    card_brand: row.card_brand ? String(row.card_brand) : null,
    card_issuer: row.card_issuer ? String(row.card_issuer) : null,
    failure_reason: row.failure_reason ? String(row.failure_reason) : null,
    funded_at: row.funded_at ? String(row.funded_at) : null,
    released_at: row.released_at ? String(row.released_at) : null,
    refunded_at: row.refunded_at ? String(row.refunded_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));

  const normalizedLedger: EscrowLedgerRecord[] = (ledgerRows ?? []).map((row) => ({
    id: String(row.id),
    payment_id: String(row.payment_id),
    contract_id: String(row.contract_id),
    entry_type: row.entry_type as EscrowLedgerRecord["entry_type"],
    amount: Number(row.amount),
    platform_fee_amount: Number(row.platform_fee_amount),
    freelancer_net_amount: Number(row.freelancer_net_amount),
    currency: "BDT",
    is_simulated: Boolean(row.is_simulated ?? true),
    description: String(row.description),
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
  }));

  let transactions: PaymentTransactionRecord[] = [];
  if (isClientOrAdmin && normalizedPayments.length > 0) {
    const { data: txRows } = await adminDb
      .from("payment_transactions")
      .select(
        "id, payment_id, contract_id, event_type, gateway, gateway_transaction_id, validation_id, bank_tran_id, gateway_status, amount, currency, risk_level, response_summary, created_at"
      )
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(30);

    transactions = (txRows ?? []).map((tx) => ({
      id: String(tx.id),
      payment_id: String(tx.payment_id),
      contract_id: String(tx.contract_id),
      event_type: tx.event_type as PaymentTransactionRecord["event_type"],
      gateway: String(tx.gateway),
      gateway_transaction_id: String(tx.gateway_transaction_id),
      validation_id: tx.validation_id ? String(tx.validation_id) : null,
      bank_tran_id: tx.bank_tran_id ? String(tx.bank_tran_id) : null,
      gateway_status: String(tx.gateway_status),
      amount: tx.amount !== null && tx.amount !== undefined ? Number(tx.amount) : null,
      currency: tx.currency ? String(tx.currency) : null,
      risk_level: tx.risk_level ? String(tx.risk_level) : null,
      response_summary:
        tx.response_summary &&
        typeof tx.response_summary === "object" &&
        !Array.isArray(tx.response_summary)
          ? (tx.response_summary as Record<string, unknown>)
          : {},
      created_at: String(tx.created_at),
    }));
  }

  const normalizedRefunds: RefundRequestRecord[] = (refundRows ?? []).map((r) => ({
    id: String(r.id),
    payment_id: String(r.payment_id),
    contract_id: String(r.contract_id),
    requested_by_user_id: String(r.requested_by_user_id),
    client_id: String(r.client_id),
    freelancer_id: String(r.freelancer_id),
    amount: Number(r.amount),
    reason: String(r.reason),
    status: r.status as RefundRequestRecord["status"],
    refund_mode: r.refund_mode as RefundRequestRecord["refund_mode"],
    gateway_refund_ref_id: r.gateway_refund_ref_id ? String(r.gateway_refund_ref_id) : null,
    gateway_status: r.gateway_status ? String(r.gateway_status) : null,
    admin_notes: r.admin_notes ? String(r.admin_notes) : null,
    reviewed_by: r.reviewed_by ? String(r.reviewed_by) : null,
    reviewed_at: r.reviewed_at ? String(r.reviewed_at) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));

  const contract = mapRowToWorkspaceContract(ctx.contractRow, {
    ledger: normalizedLedger,
    payments: normalizedPayments,
  });

  return {
    ok: true,
    statusCode: 200,
    viewerRole: ctx.viewerRole,
    isContractClient: ctx.isContractClient,
    isContractFreelancer: ctx.isContractFreelancer,
    isAdmin: ctx.isAdmin,
    simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
    contract,
    escrowSummary: computeEscrowLedgerSummary(normalizedLedger),
    ledger: normalizedLedger,
    payments: normalizedPayments,
    transactions,
    refunds: normalizedRefunds,
  };
}

interface ProposalMaterializationRow {
  id: string;
  project_id: string;
  freelancer_id: string;
  bid_amount: number | string;
  delivery_days?: number | null;
  status?: string | null;
  projects?:
    | {
        id?: string;
        client_id?: string | null;
        clients?:
          | { id?: string; user_id?: string | null }
          | { id?: string; user_id?: string | null }[]
          | null;
      }
    | {
        id?: string;
        client_id?: string | null;
        clients?:
          | { id?: string; user_id?: string | null }
          | { id?: string; user_id?: string | null }[]
          | null;
      }[]
    | null;
  freelancers?:
    | { id?: string; user_id?: string | null }
    | { id?: string; user_id?: string | null }[]
    | null;
}

async function insertMissingContractFromProposalRow(
  adminDb: ReturnType<typeof createAdminClient>,
  prop: ProposalMaterializationRow
): Promise<string | null> {
  const project = firstItem(prop.projects);
  const clientRel = firstItem(project?.clients);
  const resolvedClientId = project?.client_id ?? clientRel?.id ?? null;
  const bidAmount = Number(prop.bid_amount ?? 0);

  if (
    !prop.id ||
    !prop.project_id ||
    !prop.freelancer_id ||
    !resolvedClientId ||
    !Number.isFinite(bidAmount) ||
    bidAmount <= 0
  ) {
    return null;
  }

  const feeBreakdown = calculateContractFeeBreakdown(
    bidAmount,
    DEFAULT_PLATFORM_FEE_PCT
  );
  const deliveryDays = Math.max(1, Number(prop.delivery_days || 14));
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + deliveryDays * 86400000);

  const { data: inserted, error: insertErr } = await adminDb
    .from("contracts")
    .insert({
      proposal_id: prop.id,
      project_id: prop.project_id,
      client_id: resolvedClientId,
      freelancer_id: prop.freelancer_id,
      total_amount: feeBreakdown.grossAmount,
      platform_fee_pct: feeBreakdown.platformFeePct,
      platform_fee_amount: feeBreakdown.platformFeeAmount,
      freelancer_payable_amount: feeBreakdown.freelancerPayableAmount,
      funded_amount: 0,
      released_amount: 0,
      refunded_amount: 0,
      payment_status: "UNPAID",
      work_status: "NOT_STARTED",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (!insertErr && inserted?.id) {
    return String(inserted.id);
  }

  const { data: existingAfterRace } = await adminDb
    .from("contracts")
    .select("id")
    .eq("proposal_id", prop.id)
    .maybeSingle();

  if (existingAfterRace?.id) {
    return String(existingAfterRace.id);
  }

  if (insertErr) {
    console.error(
      "Failed materializing contract row from accepted proposal:",
      insertErr.message
    );
  }
  return null;
}

/**
 * Ensures any legacy or browser-skipped accepted proposals for the given client or
 * freelancer have an authoritative `public.contracts` row in Supabase.
 */
export async function ensureContractsForAcceptedProposals(params: {
  clientId?: string | null;
  freelancerId?: string | null;
}): Promise<void> {
  const { clientId, freelancerId } = params;
  if (!clientId && !freelancerId) return;

  try {
    const adminDb = createAdminClient();
    const collected = new Map<string, ProposalMaterializationRow>();

    if (clientId) {
      const { data: clientProps } = await adminDb
        .from("proposals")
        .select(
          "id, project_id, freelancer_id, bid_amount, delivery_days, status, projects!inner(id, client_id)"
        )
        .in("status", ["accepted", "ACCEPTED"])
        .eq("projects.client_id", clientId)
        .limit(50);

      for (const row of (clientProps ?? []) as unknown as ProposalMaterializationRow[]) {
        if (row.id) collected.set(row.id, row);
      }
    }

    if (freelancerId) {
      const { data: freelancerProps } = await adminDb
        .from("proposals")
        .select(
          "id, project_id, freelancer_id, bid_amount, delivery_days, status, projects(id, client_id)"
        )
        .in("status", ["accepted", "ACCEPTED"])
        .eq("freelancer_id", freelancerId)
        .limit(50);

      for (const row of (freelancerProps ?? []) as unknown as ProposalMaterializationRow[]) {
        if (row.id) collected.set(row.id, row);
      }
    }

    const proposalIds = Array.from(collected.keys());
    if (proposalIds.length === 0) return;

    const { data: existingContracts } = await adminDb
      .from("contracts")
      .select("proposal_id")
      .in("proposal_id", proposalIds);

    const existingProposalIds = new Set(
      (existingContracts ?? [])
        .map((c) => c.proposal_id)
        .filter((pid): pid is string => Boolean(pid))
    );

    for (const [proposalId, propRow] of collected.entries()) {
      if (!existingProposalIds.has(proposalId)) {
        await insertMissingContractFromProposalRow(adminDb, propRow);
      }
    }
  } catch (err) {
    console.warn("ensureContractsForAcceptedProposals non-fatal warning:", err);
  }
}

/**
 * Loads a live contract workspace payload from either a canonical contract UUID or a
 * synthetic accepted-proposal alias (`ctr-<proposalUuid>`), materializing the missing
 * `public.contracts` row server-side if authorized and accepted.
 */
export async function getContractWorkspacePayloadOrAlias(
  idOrAlias: string,
  userId: string
) {
  if (isUuid(idOrAlias)) {
    return getContractWorkspacePayload(idOrAlias.trim(), userId);
  }

  const proposalId = parseProposalContractAlias(idOrAlias);
  if (!proposalId) {
    return {
      ok: false,
      statusCode: 400,
      error: "Invalid contract UUID.",
    };
  }

  const adminDb = createAdminClient();
  const { data: existingContract, error: existingErr } = await adminDb
    .from("contracts")
    .select("id")
    .eq("proposal_id", proposalId)
    .maybeSingle();

  if (existingErr) {
    console.error(
      "Failed checking contract by proposal_id:",
      existingErr.message
    );
    return {
      ok: false,
      statusCode: 500,
      error: "Failed to resolve contract from proposal.",
    };
  }

  if (existingContract?.id) {
    return getContractWorkspacePayload(String(existingContract.id), userId);
  }

  const [
    { data: propData, error: propErr },
    { data: isAdminFlag },
    { data: userClient },
    { data: userFreelancer },
  ] = await Promise.all([
    adminDb
      .from("proposals")
      .select(
        "id, project_id, freelancer_id, bid_amount, delivery_days, status, projects(id, client_id, clients(id, user_id)), freelancers(id, user_id)"
      )
      .eq("id", proposalId)
      .maybeSingle(),
    adminDb.rpc("is_admin", { uid: userId }),
    adminDb.from("clients").select("id, user_id").eq("user_id", userId).maybeSingle(),
    adminDb.from("freelancers").select("id, user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (propErr) {
    console.error("Failed loading proposal alias:", propErr.message);
    return {
      ok: false,
      statusCode: 500,
      error: "Failed to load proposal contract details.",
    };
  }

  if (!propData) {
    return { ok: false, statusCode: 404, error: "Contract not found." };
  }

  const prop = propData as unknown as ProposalMaterializationRow;
  const project = firstItem(prop.projects);
  const clientRel = firstItem(project?.clients);
  const freelancerRel = firstItem(prop.freelancers);

  const resolvedClientId = project?.client_id ?? clientRel?.id ?? null;
  const resolvedFreelancerId = prop.freelancer_id ?? freelancerRel?.id ?? null;

  let clientUserId = clientRel?.user_id ?? null;
  let freelancerUserId = freelancerRel?.user_id ?? null;

  if (!clientUserId && resolvedClientId) {
    const { data: cRow } = await adminDb
      .from("clients")
      .select("user_id")
      .eq("id", resolvedClientId)
      .maybeSingle();
    clientUserId = cRow?.user_id ?? null;
  }

  if (!freelancerUserId && resolvedFreelancerId) {
    const { data: fRow } = await adminDb
      .from("freelancers")
      .select("user_id")
      .eq("id", resolvedFreelancerId)
      .maybeSingle();
    freelancerUserId = fRow?.user_id ?? null;
  }

  const isAdmin = Boolean(isAdminFlag);
  const isContractClient = Boolean(
    (clientUserId && clientUserId === userId) ||
      (userClient?.id && resolvedClientId === userClient.id)
  );
  const isContractFreelancer = Boolean(
    (freelancerUserId && freelancerUserId === userId) ||
      (userFreelancer?.id && resolvedFreelancerId === userFreelancer.id)
  );

  if (!isAdmin && !isContractClient && !isContractFreelancer) {
    return {
      ok: false,
      statusCode: 403,
      error: "Forbidden. You are not authorized to view or modify this contract.",
    };
  }

  if (String(prop.status ?? "").toLowerCase() !== "accepted") {
    return {
      ok: false,
      statusCode: 404,
      error: "No contract exists because this proposal has not been accepted.",
    };
  }

  const createdContractId = await insertMissingContractFromProposalRow(adminDb, prop);
  if (!createdContractId) {
    return {
      ok: false,
      statusCode: 500,
      error: "Unable to initialize database contract for this accepted proposal.",
    };
  }

  return getContractWorkspacePayload(createdContractId, userId);
}

