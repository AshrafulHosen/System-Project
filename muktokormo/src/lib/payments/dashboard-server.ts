import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  calculateContractFeeBreakdown,
  roundBdt,
} from "@/lib/payments/constants";
import { ESCROW_SIMULATION_DISCLAIMER } from "@/lib/payments/escrow";
import { ensureContractsForAcceptedProposals } from "@/lib/payments/contracts-server";
import type {
  AdminPaymentDashboardPayload,
  AdminPaymentDashboardSummary,
  AdminRefundRequestItem,
  ClientPaymentDashboardPayload,
  ClientPaymentDashboardSummary,
  ContractPaymentStatus,
  ContractWorkStatus,
  DashboardContractPaymentRow,
  EscrowLedgerRecord,
  FreelancerPaymentDashboardPayload,
  FreelancerPaymentDashboardSummary,
  PaymentDashboardItem,
  PaymentRecord,
  PaymentStatus,
  PaymentTransactionRecord,
  RefundRequestRecord,
} from "@/types/payment";

if (typeof window !== "undefined") {
  throw new Error(
    "src/lib/payments/dashboard-server.ts cannot be imported in browser code."
  );
}

interface RawContractTableRow {
  id: string;
  contract_code?: string | null;
  proposal_id?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  freelancer_id?: string | null;
  total_amount?: number | string | null;
  platform_fee_pct?: number | string | null;
  platform_fee_amount?: number | string | null;
  freelancer_payable_amount?: number | string | null;
  funded_amount?: number | string | null;
  released_amount?: number | string | null;
  refunded_amount?: number | string | null;
  payment_status?: string | null;
  work_status?: string | null;
  status?: string | null;
  funded_at?: string | null;
  released_at?: string | null;
  refunded_at?: string | null;
  start_date?: string | null;
  proposals?:
    | {
        id?: string;
        project_id?: string | null;
        freelancer_id?: string | null;
        projects?:
          | {
              id?: string;
              title?: string | null;
              client_id?: string | null;
              clients?:
                | {
                    id?: string;
                    display_name?: string | null;
                    company_name?: string | null;
                    avatar_url?: string | null;
                  }
                | {
                    id?: string;
                    display_name?: string | null;
                    company_name?: string | null;
                    avatar_url?: string | null;
                  }[]
                | null;
            }
          | {
              id?: string;
              title?: string | null;
              client_id?: string | null;
              clients?: unknown;
            }[]
          | null;
        freelancers?:
          | {
              id?: string;
              display_name?: string | null;
              avatar_url?: string | null;
            }
          | {
              id?: string;
              display_name?: string | null;
              avatar_url?: string | null;
            }[]
          | null;
      }
    | {
        id?: string;
        project_id?: string | null;
        freelancer_id?: string | null;
        projects?: unknown;
        freelancers?: unknown;
      }[]
    | null;
}

interface RawProjectNameRow {
  id: string;
  title?: string | null;
}

interface RawClientNameRow {
  id: string;
  display_name?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
}

interface RawFreelancerNameRow {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface ResolvedContractMeta {
  id: string;
  contractCode: string;
  title: string;
  clientId: string | null;
  freelancerId: string | null;
  clientName: string;
  clientCompany: string | null;
  clientAvatar: string | null;
  freelancerName: string;
  freelancerAvatar: string | null;
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
  fundedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
}

function first<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0];
  return val ?? undefined;
}

function normalizePaymentRow(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    contract_id: String(row.contract_id),
    client_id: String(row.client_id),
    freelancer_id: String(row.freelancer_id),
    amount: roundBdt(Number(row.amount ?? 0)),
    platform_fee_pct: Number(row.platform_fee_pct ?? DEFAULT_PLATFORM_FEE_PCT),
    platform_fee: roundBdt(Number(row.platform_fee ?? 0)),
    freelancer_amount: roundBdt(Number(row.freelancer_amount ?? 0)),
    currency: "BDT",
    transaction_id: String(row.transaction_id),
    status: String(row.status ?? "PENDING").toUpperCase() as PaymentStatus,
    gateway: String(row.gateway ?? "SSLCOMMERZ"),
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
  };
}

function normalizeLedgerRow(row: Record<string, unknown>): EscrowLedgerRecord {
  const rawMeta = row.metadata;
  return {
    id: String(row.id),
    payment_id: String(row.payment_id),
    contract_id: String(row.contract_id),
    entry_type: String(row.entry_type) as EscrowLedgerRecord["entry_type"],
    amount: roundBdt(Number(row.amount ?? 0)),
    platform_fee_amount: roundBdt(Number(row.platform_fee_amount ?? 0)),
    freelancer_net_amount: roundBdt(Number(row.freelancer_net_amount ?? 0)),
    currency: "BDT",
    is_simulated: Boolean(row.is_simulated ?? true),
    description: String(row.description ?? ""),
    metadata:
      rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
        ? (rawMeta as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
  };
}

function normalizeTxRow(row: Record<string, unknown>): PaymentTransactionRecord {
  const rawSummary = row.response_summary;
  return {
    id: String(row.id),
    payment_id: String(row.payment_id),
    contract_id: String(row.contract_id),
    event_type: String(row.event_type) as PaymentTransactionRecord["event_type"],
    gateway: String(row.gateway ?? "SSLCOMMERZ"),
    gateway_transaction_id: String(row.gateway_transaction_id ?? ""),
    validation_id: row.validation_id ? String(row.validation_id) : null,
    bank_tran_id: row.bank_tran_id ? String(row.bank_tran_id) : null,
    gateway_status: String(row.gateway_status ?? ""),
    amount:
      row.amount !== null && row.amount !== undefined
        ? roundBdt(Number(row.amount))
        : null,
    currency: row.currency ? String(row.currency) : null,
    risk_level: row.risk_level ? String(row.risk_level) : null,
    response_summary:
      rawSummary && typeof rawSummary === "object" && !Array.isArray(rawSummary)
        ? (rawSummary as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
  };
}

function normalizeRefundRow(row: Record<string, unknown>): RefundRequestRecord {
  return {
    id: String(row.id),
    payment_id: String(row.payment_id),
    contract_id: String(row.contract_id),
    requested_by_user_id: String(row.requested_by_user_id),
    client_id: String(row.client_id),
    freelancer_id: String(row.freelancer_id),
    amount: roundBdt(Number(row.amount ?? 0)),
    reason: String(row.reason ?? ""),
    status: String(row.status ?? "PENDING").toUpperCase() as RefundRequestRecord["status"],
    refund_mode: String(
      row.refund_mode ?? "SIMULATED_INTERNAL"
    ).toUpperCase() as RefundRequestRecord["refund_mode"],
    gateway_refund_ref_id: row.gateway_refund_ref_id
      ? String(row.gateway_refund_ref_id)
      : null,
    gateway_status: row.gateway_status ? String(row.gateway_status) : null,
    admin_notes: row.admin_notes ? String(row.admin_notes) : null,
    reviewed_by: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function resolveContractMetaMap(
  contractRows: RawContractTableRow[]
): Promise<{
  contractMap: Map<string, ResolvedContractMeta>;
  clientMap: Map<string, RawClientNameRow>;
  freelancerMap: Map<string, RawFreelancerNameRow>;
}> {
  const adminDb = createAdminClient();
  const projectIds = new Set<string>();
  const clientIds = new Set<string>();
  const freelancerIds = new Set<string>();

  for (const r of contractRows) {
    if (r.project_id) projectIds.add(String(r.project_id));
    if (r.client_id) clientIds.add(String(r.client_id));
    if (r.freelancer_id) freelancerIds.add(String(r.freelancer_id));
  }

  const [projectsRes, clientsRes, freelancersRes] = await Promise.all([
    projectIds.size > 0
      ? adminDb
          .from("projects")
          .select("id, title")
          .in("id", Array.from(projectIds))
      : Promise.resolve({ data: [] as RawProjectNameRow[] }),
    clientIds.size > 0
      ? adminDb
          .from("clients")
          .select("id, display_name, company_name, avatar_url")
          .in("id", Array.from(clientIds))
      : Promise.resolve({ data: [] as RawClientNameRow[] }),
    freelancerIds.size > 0
      ? adminDb
          .from("freelancers")
          .select("id, display_name, avatar_url")
          .in("id", Array.from(freelancerIds))
      : Promise.resolve({ data: [] as RawFreelancerNameRow[] }),
  ]);

  const projectMap = new Map<string, RawProjectNameRow>(
    ((projectsRes.data ?? []) as RawProjectNameRow[]).map((p) => [p.id, p])
  );
  const clientMap = new Map<string, RawClientNameRow>(
    ((clientsRes.data ?? []) as RawClientNameRow[]).map((c) => [c.id, c])
  );
  const freelancerMap = new Map<string, RawFreelancerNameRow>(
    ((freelancersRes.data ?? []) as RawFreelancerNameRow[]).map((f) => [f.id, f])
  );

  const contractMap = new Map<string, ResolvedContractMeta>();

  for (const row of contractRows) {
    const proposal = first(
      row.proposals as
        | {
            project_id?: string | null;
            freelancer_id?: string | null;
            projects?: {
              id?: string;
              title?: string | null;
              client_id?: string | null;
              clients?:
                | {
                    id?: string;
                    display_name?: string | null;
                    company_name?: string | null;
                    avatar_url?: string | null;
                  }
                | {
                    id?: string;
                    display_name?: string | null;
                    company_name?: string | null;
                    avatar_url?: string | null;
                  }[]
                | null;
            } | null;
            freelancers?:
              | {
                  id?: string;
                  display_name?: string | null;
                  avatar_url?: string | null;
                }
              | {
                  id?: string;
                  display_name?: string | null;
                  avatar_url?: string | null;
                }[]
              | null;
          }
        | undefined
    );
    const project = proposal?.projects ?? null;
    const embeddedClient = project ? first(project.clients) : undefined;
    const embeddedFreelancer = proposal ? first(proposal.freelancers) : undefined;

    const cid = row.client_id ?? project?.client_id ?? embeddedClient?.id ?? null;
    const fid =
      row.freelancer_id ?? proposal?.freelancer_id ?? embeddedFreelancer?.id ?? null;

    const clientRow = cid ? clientMap.get(cid) : undefined;
    const freelancerRow = fid ? freelancerMap.get(fid) : undefined;
    const projectRow = row.project_id ? projectMap.get(row.project_id) : undefined;

    const clientName =
      clientRow?.display_name ||
      clientRow?.company_name ||
      embeddedClient?.display_name ||
      embeddedClient?.company_name ||
      "Client";
    const clientCompany =
      clientRow?.company_name || embeddedClient?.company_name || null;
    const freelancerName =
      freelancerRow?.display_name ||
      embeddedFreelancer?.display_name ||
      "Freelancer";

    const totalBdt = roundBdt(Number(row.total_amount ?? 0));
    const feePct = Number(row.platform_fee_pct ?? DEFAULT_PLATFORM_FEE_PCT);
    const breakdown = calculateContractFeeBreakdown(totalBdt, feePct);
    const feeAmount =
      row.platform_fee_amount !== null && row.platform_fee_amount !== undefined
        ? roundBdt(Number(row.platform_fee_amount))
        : breakdown.platformFeeAmount;
    const netAmount =
      row.freelancer_payable_amount !== null &&
      row.freelancer_payable_amount !== undefined &&
      Number(row.freelancer_payable_amount) > 0
        ? roundBdt(Number(row.freelancer_payable_amount))
        : breakdown.freelancerPayableAmount;

    const rawStage = String(row.status ?? "active").toUpperCase();
    const stage: ResolvedContractMeta["stage"] =
      rawStage === "COMPLETED" ||
      rawStage === "DISPUTED" ||
      rawStage === "TERMINATED"
        ? (rawStage as ResolvedContractMeta["stage"])
        : "ACTIVE";

    const contractCode =
      row.contract_code ||
      `MK-CTR-${String(row.id).slice(0, 6).toUpperCase()}`;
    const title =
      projectRow?.title?.trim() ||
      project?.title?.trim() ||
      `Contract ${contractCode}`;

    contractMap.set(row.id, {
      id: row.id,
      contractCode,
      title,
      clientId: cid,
      freelancerId: fid,
      clientName,
      clientCompany,
      clientAvatar:
        clientRow?.avatar_url ?? embeddedClient?.avatar_url ?? null,
      freelancerName,
      freelancerAvatar:
        freelancerRow?.avatar_url ?? embeddedFreelancer?.avatar_url ?? null,
      totalBdt,
      platformFeePct: breakdown.platformFeePct,
      platformFeeAmount: feeAmount,
      netEarningsBdt: netAmount,
      fundedBdt: roundBdt(Number(row.funded_amount ?? 0)),
      releasedBdt: roundBdt(Number(row.released_amount ?? 0)),
      refundedBdt: roundBdt(Number(row.refunded_amount ?? 0)),
      paymentStatus: String(
        row.payment_status ?? "UNPAID"
      ).toUpperCase() as ContractPaymentStatus,
      workStatus: String(
        row.work_status ?? "NOT_STARTED"
      ).toUpperCase() as ContractWorkStatus,
      stage,
      fundedAt: row.funded_at ? String(row.funded_at) : null,
      releasedAt: row.released_at ? String(row.released_at) : null,
      refundedAt: row.refunded_at ? String(row.refunded_at) : null,
    });
  }

  return { contractMap, clientMap, freelancerMap };
}

function buildPaymentItems(params: {
  payments: PaymentRecord[];
  contractMap: Map<string, ResolvedContractMeta>;
  clientMap: Map<string, RawClientNameRow>;
  freelancerMap: Map<string, RawFreelancerNameRow>;
  refundsByPaymentId: Map<string, RefundRequestRecord>;
  txByPaymentId?: Map<string, PaymentTransactionRecord[]>;
}): PaymentDashboardItem[] {
  const {
    payments,
    contractMap,
    clientMap,
    freelancerMap,
    refundsByPaymentId,
    txByPaymentId,
  } = params;

  return payments.map((p) => {
    const ct = contractMap.get(p.contract_id);
    const cl = clientMap.get(p.client_id);
    const fl = freelancerMap.get(p.freelancer_id);

    return {
      ...p,
      contract_code:
        ct?.contractCode ??
        `MK-CTR-${p.contract_id.slice(0, 6).toUpperCase()}`,
      contract_title: ct?.title ?? "Contract Payment",
      contract_payment_status: ct?.paymentStatus ?? "UNPAID",
      contract_work_status: ct?.workStatus ?? "NOT_STARTED",
      client_name:
        ct?.clientName || cl?.display_name || cl?.company_name || "Client",
      client_company: ct?.clientCompany ?? cl?.company_name ?? null,
      freelancer_name: ct?.freelancerName || fl?.display_name || "Freelancer",
      refund_request: refundsByPaymentId.get(p.id) ?? null,
      ...(txByPaymentId
        ? { recent_transactions: txByPaymentId.get(p.id) ?? [] }
        : {}),
    };
  });
}

function buildContractPaymentRows(params: {
  contracts: ResolvedContractMeta[];
  payments: PaymentRecord[];
  perspective: "client" | "freelancer";
}): DashboardContractPaymentRow[] {
  const latestByContract = new Map<string, PaymentRecord>();
  for (const p of params.payments) {
    if (!latestByContract.has(p.contract_id)) {
      latestByContract.set(p.contract_id, p);
    }
  }

  return params.contracts.map((c) => {
    const latest = latestByContract.get(c.id);
    const payStatus = c.paymentStatus;
    const isClient = params.perspective === "client";
    const isActive = c.stage === "ACTIVE";
    return {
      id: c.id,
      contractCode: c.contractCode,
      title: c.title,
      counterpartyName: isClient ? c.freelancerName : c.clientName,
      counterpartyAvatar: isClient ? c.freelancerAvatar : c.clientAvatar,
      totalBdt: c.totalBdt,
      platformFeePct: c.platformFeePct,
      platformFeeAmount: c.platformFeeAmount,
      netEarningsBdt: c.netEarningsBdt,
      fundedBdt: c.fundedBdt,
      releasedBdt: c.releasedBdt,
      refundedBdt: c.refundedBdt,
      paymentStatus: payStatus,
      workStatus: c.workStatus,
      stage: c.stage,
      latestTransactionId: latest?.transaction_id ?? null,
      latestFailureReason: latest?.failure_reason ?? null,
      fundedAt: c.fundedAt,
      releasedAt: c.releasedAt,
      refundedAt: c.refundedAt,
      canFund: isClient && isActive && payStatus === "UNPAID",
      canRetry:
        isClient && isActive && ["FAILED", "CANCELLED"].includes(payStatus),
      canVerifyPending: isClient && payStatus === "PENDING",
    };
  });
}

const CONTRACT_SELECT =
  "id, contract_code, proposal_id, project_id, client_id, freelancer_id, total_amount, platform_fee_pct, platform_fee_amount, freelancer_payable_amount, funded_amount, released_amount, refunded_amount, payment_status, work_status, status, funded_at, released_at, refunded_at, start_date, proposals(id, project_id, freelancer_id, projects(id, title, client_id, clients(id, display_name, company_name, avatar_url)), freelancers(id, display_name, avatar_url))";

export async function getClientPaymentDashboardData(
  userId: string
): Promise<
  | { ok: true; statusCode: 200; payload: ClientPaymentDashboardPayload }
  | { ok: false; statusCode: number; error: string }
> {
  const adminDb = createAdminClient();
  const [
    { data: isAdminFlag },
    { data: clientRow },
    { data: freelancerRow },
  ] = await Promise.all([
    adminDb.rpc("is_admin", { uid: userId }),
    adminDb.from("clients").select("id").eq("user_id", userId).maybeSingle(),
    adminDb.from("freelancers").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  if (Boolean(isAdminFlag) || (freelancerRow?.id && !clientRow?.id)) {
    return {
      ok: false,
      statusCode: 403,
      error: "Forbidden. Only client accounts can access the client payment dashboard.",
    };
  }

  const clientId = clientRow?.id ?? null;
  if (!clientId) {
    const emptySummary: ClientPaymentDashboardSummary = {
      totalSpendingBdt: 0,
      inEscrowBdt: 0,
      releasedSpendingBdt: 0,
      refundedBdt: 0,
      fundedContractsCount: 0,
      releasedContractsCount: 0,
      pendingPaymentsCount: 0,
      pendingPaymentAttemptsCount: 0,
      failedOrCancelledCount: 0,
      refundRequestsCount: 0,
      pendingRefundCount: 0,
    };
    return {
      ok: true,
      statusCode: 200,
      payload: {
        ok: true,
        role: "client",
        simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
        summary: emptySummary,
        contracts: [],
        payments: [],
        ledgerEntries: [],
        refundRequests: [],
      },
    };
  }

  await ensureContractsForAcceptedProposals({ clientId });

  const [contractsRes, paymentsRes, refundsRes] = await Promise.all([
    adminDb
      .from("contracts")
      .select(CONTRACT_SELECT)
      .eq("client_id", clientId)
      .order("start_date", { ascending: false }),
    adminDb
      .from("payments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(200),
    adminDb
      .from("refund_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  if (contractsRes.error || paymentsRes.error || refundsRes.error) {
    console.error(
      "Client payment dashboard query error:",
      contractsRes.error?.message ||
        paymentsRes.error?.message ||
        refundsRes.error?.message
    );
    return {
      ok: false,
      statusCode: 500,
      error: "Failed to load client payment data.",
    };
  }

  const rawContracts = (contractsRes.data ?? []) as unknown as RawContractTableRow[];
  const payments = ((paymentsRes.data ?? []) as Record<string, unknown>[]).map(
    normalizePaymentRow
  );
  const refundRequests = ((refundsRes.data ?? []) as Record<string, unknown>[]).map(
    normalizeRefundRow
  );
  const contractIds = rawContracts.map((c) => c.id);
  const paymentIds = payments.map((p) => p.id);

  const [ledgerRes, txRes, { contractMap, clientMap, freelancerMap }] =
    await Promise.all([
      contractIds.length > 0
        ? adminDb
            .from("escrow_ledger")
            .select("*")
            .in("contract_id", contractIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      paymentIds.length > 0
        ? adminDb
            .from("payment_transactions")
            .select("*")
            .in("payment_id", paymentIds)
            .order("created_at", { ascending: false })
            .limit(400)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      resolveContractMetaMap(rawContracts),
    ]);

  const ledgerEntries = ((ledgerRes.data ?? []) as Record<string, unknown>[]).map(
    normalizeLedgerRow
  );
  const transactions = ((txRes.data ?? []) as Record<string, unknown>[]).map(
    normalizeTxRow
  );

  const txByPaymentId = new Map<string, PaymentTransactionRecord[]>();
  for (const tx of transactions) {
    const list = txByPaymentId.get(tx.payment_id) ?? [];
    list.push(tx);
    txByPaymentId.set(tx.payment_id, list);
  }

  const refundsByPaymentId = new Map<string, RefundRequestRecord>();
  for (const rf of refundRequests) {
    if (!refundsByPaymentId.has(rf.payment_id)) {
      refundsByPaymentId.set(rf.payment_id, rf);
    }
  }

  const resolvedContracts = Array.from(contractMap.values());
  const contractRows = buildContractPaymentRows({
    contracts: resolvedContracts,
    payments,
    perspective: "client",
  });

  const paymentItems = buildPaymentItems({
    payments,
    contractMap,
    clientMap,
    freelancerMap,
    refundsByPaymentId,
    txByPaymentId,
  });

  let inEscrowBdt = 0;
  let releasedSpendingBdt = 0;
  let refundedBdt = 0;
  let pendingPaymentAttemptsCount = 0;
  let failedOrCancelledCount = 0;

  for (const p of payments) {
    if (p.status === "FUNDED" || p.status === "REFUND_REQUESTED") {
      inEscrowBdt += p.amount;
    } else if (p.status === "RELEASED") {
      releasedSpendingBdt += p.amount;
    } else if (p.status === "REFUNDED") {
      refundedBdt += p.amount;
    } else if (p.status === "PENDING") {
      pendingPaymentAttemptsCount += 1;
    } else if (p.status === "FAILED" || p.status === "CANCELLED") {
      failedOrCancelledCount += 1;
    }
  }

  const fundedContractsCount = resolvedContracts.filter(
    (c) => c.paymentStatus === "FUNDED"
  ).length;
  const releasedContractsCount = resolvedContracts.filter(
    (c) => c.paymentStatus === "RELEASED"
  ).length;
  const pendingContractsCount = resolvedContracts.filter(
    (c) =>
      c.stage === "ACTIVE" &&
      ["UNPAID", "PENDING", "FAILED", "CANCELLED"].includes(c.paymentStatus)
  ).length;

  const summary: ClientPaymentDashboardSummary = {
    totalSpendingBdt: roundBdt(inEscrowBdt + releasedSpendingBdt),
    inEscrowBdt: roundBdt(inEscrowBdt),
    releasedSpendingBdt: roundBdt(releasedSpendingBdt),
    refundedBdt: roundBdt(refundedBdt),
    fundedContractsCount,
    releasedContractsCount,
    pendingPaymentsCount: pendingContractsCount,
    pendingPaymentAttemptsCount,
    failedOrCancelledCount,
    refundRequestsCount: refundRequests.length,
    pendingRefundCount: refundRequests.filter((r) => r.status === "PENDING")
      .length,
  };

  return {
    ok: true,
    statusCode: 200,
    payload: {
      ok: true,
      role: "client",
      simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
      summary,
      contracts: contractRows,
      payments: paymentItems,
      ledgerEntries,
      refundRequests,
    },
  };
}

export async function getFreelancerPaymentDashboardData(
  userId: string
): Promise<
  | { ok: true; statusCode: 200; payload: FreelancerPaymentDashboardPayload }
  | { ok: false; statusCode: number; error: string }
> {
  const adminDb = createAdminClient();
  const [
    { data: isAdminFlag },
    { data: clientRow },
    { data: freelancerRow },
  ] = await Promise.all([
    adminDb.rpc("is_admin", { uid: userId }),
    adminDb.from("clients").select("id").eq("user_id", userId).maybeSingle(),
    adminDb
      .from("freelancers")
      .select("id, earned_bdt")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (Boolean(isAdminFlag) || (clientRow?.id && !freelancerRow?.id)) {
    return {
      ok: false,
      statusCode: 403,
      error:
        "Forbidden. Only freelancer accounts can access the freelancer earnings dashboard.",
    };
  }

  const freelancerId = freelancerRow?.id ?? null;
  if (!freelancerId) {
    const emptySummary: FreelancerPaymentDashboardSummary = {
      totalEarningsBdt: 0,
      releasedGrossBdt: 0,
      releasedEarningsBdt: 0,
      platformFeesDeductedBdt: 0,
      pendingEarningsBdt: 0,
      pendingEscrowGrossBdt: 0,
      availableEarningsSimulatedBdt: 0,
      activeFundedContractsCount: 0,
      completedReleasedCount: 0,
      refundedCount: 0,
    };
    return {
      ok: true,
      statusCode: 200,
      payload: {
        ok: true,
        role: "freelancer",
        simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
        summary: emptySummary,
        activeFundedContracts: [],
        contracts: [],
        payments: [],
        ledgerEntries: [],
        refundRequests: [],
      },
    };
  }

  await ensureContractsForAcceptedProposals({ freelancerId });

  const [contractsRes, paymentsRes, refundsRes] = await Promise.all([
    adminDb
      .from("contracts")
      .select(CONTRACT_SELECT)
      .eq("freelancer_id", freelancerId)
      .order("start_date", { ascending: false }),
    // Freelancers strictly see settled/escrow payments (no failed/aborted checkout attempts)
    adminDb
      .from("payments")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .in("status", ["FUNDED", "RELEASED", "REFUND_REQUESTED", "REFUNDED"])
      .order("created_at", { ascending: false })
      .limit(200),
    adminDb
      .from("refund_requests")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false }),
  ]);

  if (contractsRes.error || paymentsRes.error || refundsRes.error) {
    console.error(
      "Freelancer payment dashboard query error:",
      contractsRes.error?.message ||
        paymentsRes.error?.message ||
        refundsRes.error?.message
    );
    return {
      ok: false,
      statusCode: 500,
      error: "Failed to load freelancer earnings data.",
    };
  }

  const rawContracts = (contractsRes.data ?? []) as unknown as RawContractTableRow[];
  const payments = ((paymentsRes.data ?? []) as Record<string, unknown>[]).map(
    normalizePaymentRow
  );
  const refundRequests = ((refundsRes.data ?? []) as Record<string, unknown>[]).map(
    normalizeRefundRow
  );
  const contractIds = rawContracts.map((c) => c.id);

  const [ledgerRes, { contractMap, clientMap, freelancerMap }] =
    await Promise.all([
      contractIds.length > 0
        ? adminDb
            .from("escrow_ledger")
            .select("*")
            .in("contract_id", contractIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      resolveContractMetaMap(rawContracts),
    ]);

  const ledgerEntries = ((ledgerRes.data ?? []) as Record<string, unknown>[]).map(
    normalizeLedgerRow
  );
  const refundsByPaymentId = new Map<string, RefundRequestRecord>();
  for (const rf of refundRequests) {
    if (!refundsByPaymentId.has(rf.payment_id)) {
      refundsByPaymentId.set(rf.payment_id, rf);
    }
  }

  const resolvedContracts = Array.from(contractMap.values());
  const contractRows = buildContractPaymentRows({
    contracts: resolvedContracts,
    payments,
    perspective: "freelancer",
  });
  const activeFundedContracts = contractRows.filter(
    (c) => c.paymentStatus === "FUNDED"
  );

  // Never include raw gateway callback telemetry (payment_transactions) for freelancers
  const paymentItems = buildPaymentItems({
    payments,
    contractMap,
    clientMap,
    freelancerMap,
    refundsByPaymentId,
  });

  let releasedGrossBdt = 0;
  let releasedEarningsBdt = 0;
  let platformFeesDeductedBdt = 0;
  let pendingEarningsBdt = 0;
  let pendingEscrowGrossBdt = 0;
  let completedReleasedCount = 0;
  let refundedCount = 0;

  for (const p of payments) {
    if (p.status === "RELEASED") {
      releasedGrossBdt += p.amount;
      releasedEarningsBdt += p.freelancer_amount;
      platformFeesDeductedBdt += p.platform_fee;
      completedReleasedCount += 1;
    } else if (p.status === "FUNDED" || p.status === "REFUND_REQUESTED") {
      pendingEscrowGrossBdt += p.amount;
      pendingEarningsBdt += p.freelancer_amount;
    } else if (p.status === "REFUNDED") {
      refundedCount += 1;
    }
  }

  const dbEarnedBdt = roundBdt(Number(freelancerRow?.earned_bdt ?? 0));
  const simulatedAvailable =
    dbEarnedBdt > 0 ? dbEarnedBdt : roundBdt(releasedEarningsBdt);

  const summary: FreelancerPaymentDashboardSummary = {
    totalEarningsBdt: roundBdt(Math.max(releasedEarningsBdt, dbEarnedBdt)),
    releasedGrossBdt: roundBdt(releasedGrossBdt),
    releasedEarningsBdt: roundBdt(releasedEarningsBdt),
    platformFeesDeductedBdt: roundBdt(platformFeesDeductedBdt),
    pendingEarningsBdt: roundBdt(pendingEarningsBdt),
    pendingEscrowGrossBdt: roundBdt(pendingEscrowGrossBdt),
    availableEarningsSimulatedBdt: simulatedAvailable,
    activeFundedContractsCount: activeFundedContracts.length,
    completedReleasedCount,
    refundedCount,
  };

  return {
    ok: true,
    statusCode: 200,
    payload: {
      ok: true,
      role: "freelancer",
      simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
      summary,
      activeFundedContracts,
      contracts: contractRows,
      payments: paymentItems,
      ledgerEntries,
      refundRequests,
    },
  };
}

export async function getAdminPaymentDashboardData(
  userId: string,
  filters?: {
    q?: string;
    status?: string;
    from?: string;
    to?: string;
  }
): Promise<
  | { ok: true; statusCode: 200; payload: AdminPaymentDashboardPayload }
  | { ok: false; statusCode: number; error: string }
> {
  const adminDb = createAdminClient();
  const { data: isAdminFlag, error: adminErr } = await adminDb.rpc("is_admin", {
    uid: userId,
  });

  if (adminErr || !isAdminFlag) {
    return {
      ok: false,
      statusCode: 403,
      error: "Forbidden. Platform administrator role required.",
    };
  }

  const qRaw = String(filters?.q ?? "").trim();
  const statusRaw = String(filters?.status ?? "ALL").trim().toUpperCase();
  const fromRaw = String(filters?.from ?? "").trim();
  const toRaw = String(filters?.to ?? "").trim();

  const [paymentsRes, refundsRes, disputedContractsRes] = await Promise.all([
    adminDb
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    adminDb
      .from("refund_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250),
    adminDb
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .or("status.in.(disputed,DISPUTED),payment_status.eq.DISPUTED"),
  ]);

  if (paymentsRes.error || refundsRes.error) {
    console.error(
      "Admin payment dashboard query error:",
      paymentsRes.error?.message || refundsRes.error?.message
    );
    return {
      ok: false,
      statusCode: 500,
      error: "Failed to load platform payment telemetry.",
    };
  }

  const allPayments = ((paymentsRes.data ?? []) as Record<string, unknown>[]).map(
    normalizePaymentRow
  );
  const allRefunds = ((refundsRes.data ?? []) as Record<string, unknown>[]).map(
    normalizeRefundRow
  );

  const contractIdsSet = new Set<string>();
  const paymentIdsSet = new Set<string>();
  const clientIdsSet = new Set<string>();
  const freelancerIdsSet = new Set<string>();

  for (const p of allPayments) {
    contractIdsSet.add(p.contract_id);
    paymentIdsSet.add(p.id);
    clientIdsSet.add(p.client_id);
    freelancerIdsSet.add(p.freelancer_id);
  }
  for (const r of allRefunds) {
    contractIdsSet.add(r.contract_id);
    paymentIdsSet.add(r.payment_id);
    clientIdsSet.add(r.client_id);
    freelancerIdsSet.add(r.freelancer_id);
  }

  const contractIds = Array.from(contractIdsSet);
  const paymentIds = Array.from(paymentIdsSet);

  const [contractsRes, txRes] = await Promise.all([
    contractIds.length > 0
      ? adminDb.from("contracts").select(CONTRACT_SELECT).in("id", contractIds)
      : Promise.resolve({ data: [] as RawContractTableRow[] }),
    paymentIds.length > 0
      ? adminDb
          .from("payment_transactions")
          .select("*")
          .in("payment_id", paymentIds)
          .order("created_at", { ascending: false })
          .limit(1000)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const rawContracts = (contractsRes.data ?? []) as unknown as RawContractTableRow[];
  const { contractMap, clientMap, freelancerMap } =
    await resolveContractMetaMap(rawContracts);

  // Fill any missing client/freelancer names referenced directly on payments/refunds
  const missingClientIds = Array.from(clientIdsSet).filter(
    (id) => !clientMap.has(id)
  );
  const missingFreelancerIds = Array.from(freelancerIdsSet).filter(
    (id) => !freelancerMap.has(id)
  );
  if (missingClientIds.length > 0 || missingFreelancerIds.length > 0) {
    const [extraClientsRes, extraFreelancersRes] = await Promise.all([
      missingClientIds.length > 0
        ? adminDb
            .from("clients")
            .select("id, display_name, company_name, avatar_url")
            .in("id", missingClientIds)
        : Promise.resolve({ data: [] as RawClientNameRow[] }),
      missingFreelancerIds.length > 0
        ? adminDb
            .from("freelancers")
            .select("id, display_name, avatar_url")
            .in("id", missingFreelancerIds)
        : Promise.resolve({ data: [] as RawFreelancerNameRow[] }),
    ]);

    for (const c of (extraClientsRes.data ?? []) as RawClientNameRow[]) {
      clientMap.set(c.id, c);
    }
    for (const f of (extraFreelancersRes.data ?? []) as RawFreelancerNameRow[]) {
      freelancerMap.set(f.id, f);
    }
  }

  const transactions = ((txRes.data ?? []) as Record<string, unknown>[]).map(
    normalizeTxRow
  );
  const txByPaymentId = new Map<string, PaymentTransactionRecord[]>();
  for (const tx of transactions) {
    const list = txByPaymentId.get(tx.payment_id) ?? [];
    list.push(tx);
    txByPaymentId.set(tx.payment_id, list);
  }

  const refundsByPaymentId = new Map<string, RefundRequestRecord>();
  for (const rf of allRefunds) {
    if (!refundsByPaymentId.has(rf.payment_id)) {
      refundsByPaymentId.set(rf.payment_id, rf);
    }
  }

  // Compute platform-wide KPIs before applying table filters
  let totalPaymentVolumeBdt = 0;
  let fundedPaymentsCount = 0;
  let fundedPaymentsAmountBdt = 0;
  let releasedPaymentsCount = 0;
  let releasedPaymentsAmountBdt = 0;
  let platformCommissionEarnedBdt = 0;
  let projectedCommissionBdt = 0;
  let pendingPaymentsCount = 0;
  let failedPaymentsCount = 0;
  let cancelledPaymentsCount = 0;
  let refundedPaymentsCount = 0;
  let refundedAmountBdt = 0;

  for (const p of allPayments) {
    if (
      ["FUNDED", "RELEASED", "REFUND_REQUESTED", "REFUNDED"].includes(p.status)
    ) {
      totalPaymentVolumeBdt += p.amount;
    }

    if (p.status === "FUNDED" || p.status === "REFUND_REQUESTED") {
      fundedPaymentsCount += 1;
      fundedPaymentsAmountBdt += p.amount;
      projectedCommissionBdt += p.platform_fee;
    } else if (p.status === "RELEASED") {
      releasedPaymentsCount += 1;
      releasedPaymentsAmountBdt += p.amount;
      platformCommissionEarnedBdt += p.platform_fee;
    } else if (p.status === "PENDING") {
      pendingPaymentsCount += 1;
    } else if (p.status === "FAILED") {
      failedPaymentsCount += 1;
    } else if (p.status === "CANCELLED") {
      cancelledPaymentsCount += 1;
    } else if (p.status === "REFUNDED") {
      refundedPaymentsCount += 1;
      refundedAmountBdt += p.amount;
    }
  }

  const pendingRefundRequestsCount = allRefunds.filter(
    (r) => r.status === "PENDING"
  ).length;

  const summary: AdminPaymentDashboardSummary = {
    totalPaymentVolumeBdt: roundBdt(totalPaymentVolumeBdt),
    fundedPaymentsCount,
    fundedPaymentsAmountBdt: roundBdt(fundedPaymentsAmountBdt),
    releasedPaymentsCount,
    releasedPaymentsAmountBdt: roundBdt(releasedPaymentsAmountBdt),
    platformCommissionEarnedBdt: roundBdt(platformCommissionEarnedBdt),
    projectedCommissionBdt: roundBdt(projectedCommissionBdt),
    pendingPaymentsCount,
    failedPaymentsCount,
    cancelledPaymentsCount,
    refundedPaymentsCount,
    refundedAmountBdt: roundBdt(refundedAmountBdt),
    refundRequestsCount: allRefunds.length,
    pendingRefundRequestsCount,
    openDisputesCount: disputedContractsRes.count ?? 0,
  };

  const allItems = buildPaymentItems({
    payments: allPayments,
    contractMap,
    clientMap,
    freelancerMap,
    refundsByPaymentId,
    txByPaymentId,
  });

  const paymentById = new Map<string, PaymentRecord>(
    allPayments.map((p) => [p.id, p])
  );

  const enrichedRefunds: AdminRefundRequestItem[] = allRefunds.map((rf) => {
    const ct = contractMap.get(rf.contract_id);
    const pay = paymentById.get(rf.payment_id);
    const cl = clientMap.get(rf.client_id);
    const fl = freelancerMap.get(rf.freelancer_id);

    return {
      ...rf,
      contract_code:
        ct?.contractCode ??
        `MK-CTR-${rf.contract_id.slice(0, 6).toUpperCase()}`,
      contract_title: ct?.title ?? "Contract",
      transaction_id: pay?.transaction_id ?? "N/A",
      client_name:
        ct?.clientName || cl?.display_name || cl?.company_name || "Client",
      freelancer_name: ct?.freelancerName || fl?.display_name || "Freelancer",
      payment_status: pay?.status ?? "FUNDED",
    };
  });

  // Apply search/status/date filters
  const qLower = qRaw.toLowerCase();
  const validStatusFilter =
    statusRaw !== "" && statusRaw !== "ALL" ? statusRaw : null;

  const fromMs =
    /^\d{4}-\d{2}-\d{2}$/.test(fromRaw)
      ? new Date(`${fromRaw}T00:00:00+06:00`).getTime()
      : null;
  const toMs =
    /^\d{4}-\d{2}-\d{2}$/.test(toRaw)
      ? new Date(`${toRaw}T23:59:59.999+06:00`).getTime()
      : null;

  const filteredPayments = allItems.filter((item) => {
    if (validStatusFilter && item.status !== validStatusFilter) {
      return false;
    }

    if (fromMs !== null && !Number.isNaN(fromMs)) {
      const createdMs = new Date(item.created_at).getTime();
      if (createdMs < fromMs) return false;
    }
    if (toMs !== null && !Number.isNaN(toMs)) {
      const createdMs = new Date(item.created_at).getTime();
      if (createdMs > toMs) return false;
    }

    if (qLower) {
      const matches =
        item.transaction_id.toLowerCase().includes(qLower) ||
        (item.validation_id && item.validation_id.toLowerCase().includes(qLower)) ||
        (item.bank_tran_id && item.bank_tran_id.toLowerCase().includes(qLower)) ||
        item.contract_code.toLowerCase().includes(qLower) ||
        item.contract_title.toLowerCase().includes(qLower) ||
        item.client_name.toLowerCase().includes(qLower) ||
        item.freelancer_name.toLowerCase().includes(qLower);
      if (!matches) return false;
    }

    return true;
  });

  return {
    ok: true,
    statusCode: 200,
    payload: {
      ok: true,
      role: "admin",
      simulationDisclaimer: ESCROW_SIMULATION_DISCLAIMER,
      summary,
      filters: {
        q: qRaw,
        status: statusRaw || "ALL",
        from: fromRaw,
        to: toRaw,
      },
      totalCount: allItems.length,
      filteredCount: filteredPayments.length,
      payments: filteredPayments,
      refundRequests: enrichedRefunds,
    },
  };
}
