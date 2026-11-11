import { createAdminClient } from "@/lib/supabase/admin";
import {
  ESCROW_SIMULATION_DISCLAIMER,
  computeEscrowLedgerSummary,
  type EscrowSummary,
} from "@/lib/payments/escrow";
import type {
  EscrowLedgerRecord,
  PaymentRecord,
  PaymentTransactionRecord,
} from "@/types/payment";

if (typeof window !== "undefined") {
  throw new Error("src/lib/payments/escrow-server.ts cannot be imported in browser code.");
}

export interface ScopedEscrowLedgerResponse {
  ok: boolean;
  statusCode: number;
  error?: string;
  viewerRole?: "client" | "freelancer" | "admin";
  simulationDisclaimer?: string;
  summary?: EscrowSummary;
  entries?: EscrowLedgerRecord[];
  payments?: PaymentRecord[];
  transactions?: PaymentTransactionRecord[];
}

export async function getScopedEscrowLedgerData(params: {
  userId: string;
  contractId?: string | null;
}): Promise<ScopedEscrowLedgerResponse> {
  const adminDb = createAdminClient();
  const { userId, contractId } = params;

  const [
    { data: isAdminFlag },
    { data: clientProfile },
    { data: freelancerProfile },
  ] = await Promise.all([
    adminDb.rpc("is_admin", { uid: userId }),
    adminDb.from("clients").select("id").eq("user_id", userId).maybeSingle(),
    adminDb.from("freelancers").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  const isAdmin = Boolean(isAdminFlag);
  const clientId = clientProfile?.id ?? null;
  const freelancerId = freelancerProfile?.id ?? null;

  let viewerRole: "client" | "freelancer" | "admin" = "client";
  if (isAdmin) {
    viewerRole = "admin";
  } else if (freelancerId && !clientId) {
    viewerRole = "freelancer";
  }

  let scopedContractIds: string[] = [];

  if (contractId) {
    const { data: contractRow, error: ctErr } = await adminDb
      .from("contracts")
      .select("id, client_id, freelancer_id")
      .eq("id", contractId)
      .maybeSingle();

    if (ctErr) {
      return {
        ok: false,
        statusCode: 500,
        error: "Failed to query contract for escrow ledger.",
      };
    }

    if (!contractRow) {
      return {
        ok: false,
        statusCode: 404,
        error: "Contract not found.",
      };
    }

    const isContractClient = Boolean(clientId && contractRow.client_id === clientId);
    const isContractFreelancer = Boolean(
      freelancerId && contractRow.freelancer_id === freelancerId
    );

    if (!isAdmin && !isContractClient && !isContractFreelancer) {
      return {
        ok: false,
        statusCode: 403,
        error: "Forbidden. You are not a party on this contract.",
      };
    }

    if (!isAdmin) {
      viewerRole = isContractFreelancer && !isContractClient ? "freelancer" : "client";
    }
    scopedContractIds = [contractRow.id];
  } else if (!isAdmin) {
    const filters: string[] = [];
    if (clientId) filters.push(`client_id.eq.${clientId}`);
    if (freelancerId) filters.push(`freelancer_id.eq.${freelancerId}`);

    if (filters.length === 0) {
      return {
        ok: true,
        statusCode: 200,
        viewerRole,
        simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
        summary: computeEscrowLedgerSummary([]),
        entries: [],
        payments: [],
        transactions: [],
      };
    }

    const { data: userContracts } = await adminDb
      .from("contracts")
      .select("id")
      .or(filters.join(","));

    scopedContractIds = (userContracts ?? []).map((c) => String(c.id));
    if (scopedContractIds.length === 0) {
      return {
        ok: true,
        statusCode: 200,
        viewerRole,
        simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
        summary: computeEscrowLedgerSummary([]),
        entries: [],
        payments: [],
        transactions: [],
      };
    }
  }

  let ledgerQuery = adminDb
    .from("escrow_ledger")
    .select(
      "id, payment_id, contract_id, entry_type, amount, platform_fee_amount, freelancer_net_amount, currency, is_simulated, description, metadata, created_at"
    )
    .order("created_at", { ascending: false });

  let paymentsQuery = adminDb
    .from("payments")
    .select(
      "id, contract_id, client_id, freelancer_id, amount, platform_fee_pct, platform_fee, freelancer_amount, currency, transaction_id, status, gateway, validation_id, bank_tran_id, card_type, card_brand, card_issuer, failure_reason, funded_at, released_at, refunded_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    ledgerQuery = ledgerQuery.in("contract_id", scopedContractIds);
    paymentsQuery = paymentsQuery.in("contract_id", scopedContractIds);
    if (viewerRole === "freelancer") {
      // Freelancers only inspect settled/escrow payments, never failed/aborted checkout attempts
      paymentsQuery = paymentsQuery.in("status", [
        "FUNDED",
        "RELEASED",
        "REFUND_REQUESTED",
        "REFUNDED",
      ]);
    }
  }

  const [{ data: ledgerRows, error: ledgerErr }, { data: paymentRows, error: payErr }] =
    await Promise.all([ledgerQuery, paymentsQuery]);

  if (ledgerErr || payErr) {
    console.error(
      "Escrow ledger service query error:",
      ledgerErr?.message || payErr?.message
    );
    return {
      ok: false,
      statusCode: 500,
      error: "Failed to load internal escrow ledger records.",
    };
  }

  const normalizedEntries: EscrowLedgerRecord[] = (ledgerRows ?? []).map((row) => ({
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

  // Transaction gateway telemetry only visible to owning client or admin (matches RLS policy)
  let normalizedTransactions: PaymentTransactionRecord[] = [];
  if ((isAdmin || viewerRole === "client") && normalizedPayments.length > 0) {
    const paymentIds = normalizedPayments.map((p) => p.id);
    const { data: txRows } = await adminDb
      .from("payment_transactions")
      .select(
        "id, payment_id, contract_id, event_type, gateway, gateway_transaction_id, validation_id, bank_tran_id, gateway_status, amount, currency, risk_level, response_summary, created_at"
      )
      .in("payment_id", paymentIds)
      .order("created_at", { ascending: false })
      .limit(50);

    normalizedTransactions = (txRows ?? []).map((tx) => ({
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

  return {
    ok: true,
    statusCode: 200,
    viewerRole,
    simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
    summary: computeEscrowLedgerSummary(normalizedEntries),
    entries: normalizedEntries,
    payments: normalizedPayments,
    transactions: normalizedTransactions,
  };
}

