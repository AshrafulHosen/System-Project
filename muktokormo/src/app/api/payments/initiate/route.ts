import type { NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError, getSslCommerzSandboxEnv } from "@/lib/env";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  MIN_SSLCOMMERZ_AMOUNT_BDT,
  SUPPORTED_CURRENCY,
  calculateContractFeeBreakdown,
  isUuid,
} from "@/lib/payments/constants";
import {
  generateUniqueTransactionId,
  initiateSslCommerzSession,
} from "@/lib/sslcommerz";

interface ContractClientEmbed {
  id: string;
  user_id: string;
  display_name?: string | null;
  company_name?: string | null;
  location?: string | null;
}

interface ContractProjectEmbed {
  id: string;
  title?: string | null;
  category?: string | null;
  client_id?: string | null;
  clients?: ContractClientEmbed | ContractClientEmbed[] | null;
}

interface ContractProposalEmbed {
  id: string;
  project_id: string;
  freelancer_id: string;
  projects?: ContractProjectEmbed | ContractProjectEmbed[] | null;
}

interface ContractLookupRow {
  id: string;
  contract_code?: string | null;
  total_amount: number | string;
  platform_fee_pct?: number | string | null;
  status?: string | null;
  payment_status?: string | null;
  client_id?: string | null;
  freelancer_id?: string | null;
  project_id?: string | null;
  proposals?: ContractProposalEmbed | ContractProposalEmbed[] | null;
}

function first<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0];
  return val ?? undefined;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input (amount & financial params are NEVER accepted from client)
    let body: { contractId?: unknown };
    try {
      body = (await request.json()) as { contractId?: unknown };
    } catch {
      return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    if (!isUuid(body?.contractId)) {
      return Response.json({ error: "A valid contractId UUID is required." }, { status: 400 });
    }
    const contractId = body.contractId.trim();

    // 2. Authenticate caller using SSR Supabase session cookies before initializing admin clients
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return Response.json(
        { error: "Authentication required. Please log in to fund a contract." },
        { status: 401 }
      );
    }

    // 3. Validate required server configuration & initialize admin client
    getSslCommerzSandboxEnv();
    const adminDb = createAdminClient();

    // 4. Load contract authoritatively from Supabase
    const { data: contractRow, error: contractErr } = await adminDb
      .from("contracts")
      .select(
        "id, contract_code, total_amount, platform_fee_pct, status, payment_status, client_id, freelancer_id, project_id, proposals(id, project_id, freelancer_id, projects(id, title, category, client_id, clients(id, user_id, display_name, company_name, location)))"
      )
      .eq("id", contractId)
      .maybeSingle();

    if (contractErr) {
      console.error("Payment initiate contract query failed:", contractErr.message);
      return Response.json(
        { error: "Failed to verify contract in database. Ensure Phase 2 SQL migration is applied." },
        { status: 500 }
      );
    }

    if (!contractRow) {
      return Response.json({ error: "Contract not found." }, { status: 404 });
    }

    const row = contractRow as unknown as ContractLookupRow;
    const proposal = first(row.proposals);
    const project = proposal ? first(proposal.projects) : undefined;
    const embeddedClient = project ? first(project.clients) : undefined;

    const resolvedClientId = row.client_id ?? project?.client_id ?? embeddedClient?.id ?? null;
    const resolvedFreelancerId = row.freelancer_id ?? proposal?.freelancer_id ?? null;

    if (!resolvedClientId || !resolvedFreelancerId) {
      return Response.json(
        { error: "Contract is missing linked client or freelancer records." },
        { status: 409 }
      );
    }

    // Look up client ownership record directly to prevent tampering
    const { data: clientRecord, error: clientLookupErr } = await adminDb
      .from("clients")
      .select("id, user_id, display_name, company_name, location")
      .eq("id", resolvedClientId)
      .maybeSingle();

    if (clientLookupErr || !clientRecord) {
      return Response.json({ error: "Client owner profile not found." }, { status: 404 });
    }

    if (clientRecord.user_id !== user.id) {
      return Response.json(
        { error: "Forbidden. Only the client who owns this contract can fund it." },
        { status: 403 }
      );
    }

    // 5. Verify contract lifecycle & funding eligibility
    const normalizedStatus = String(row.status ?? "").toLowerCase();
    if (normalizedStatus !== "active") {
      return Response.json(
        { error: `Only active contracts can be funded (current status: ${row.status ?? "unknown"}).` },
        { status: 409 }
      );
    }

    const currentPayStatus = String(row.payment_status ?? "UNPAID").toUpperCase();
    if (["FUNDED", "RELEASED", "REFUNDED", "DISPUTED"].includes(currentPayStatus)) {
      return Response.json(
        { error: `This contract already has payment status: ${currentPayStatus}.` },
        { status: 409 }
      );
    }

    // Double-check settled or refunding payments table
    const { data: settledPayment } = await adminDb
      .from("payments")
      .select("id, status, transaction_id")
      .eq("contract_id", contractId)
      .in("status", ["FUNDED", "RELEASED", "REFUND_REQUESTED"])
      .maybeSingle();

    if (settledPayment) {
      return Response.json(
        {
          error: `Duplicate funding blocked: contract already has a ${settledPayment.status} payment (${settledPayment.transaction_id}).`,
        },
        { status: 409 }
      );
    }

    // Prevent rapid double-click duplicate payment requests within 5 seconds
    const fiveSecondsAgoIso = new Date(Date.now() - 5000).toISOString();
    const { data: recentPending } = await adminDb
      .from("payments")
      .select("id, created_at")
      .eq("contract_id", contractId)
      .eq("status", "PENDING")
      .gte("created_at", fiveSecondsAgoIso)
      .maybeSingle();

    if (recentPending) {
      return Response.json(
        { error: "A payment session is already being created. Please wait a few seconds before retrying." },
        { status: 429 }
      );
    }

    // 6. Compute authoritative contract total and commission on server
    const contractAmount = Number(row.total_amount);
    if (!Number.isFinite(contractAmount) || contractAmount < MIN_SSLCOMMERZ_AMOUNT_BDT) {
      return Response.json(
        {
          error: `Contract amount must be at least ৳${MIN_SSLCOMMERZ_AMOUNT_BDT} BDT for SSLCOMMERZ sandbox processing.`,
        },
        { status: 400 }
      );
    }

    const feePct =
      row.platform_fee_pct !== null && row.platform_fee_pct !== undefined
        ? Number(row.platform_fee_pct)
        : DEFAULT_PLATFORM_FEE_PCT;

    const breakdown = calculateContractFeeBreakdown(contractAmount, feePct);
    const tranId = generateUniqueTransactionId();

    // 7. Fetch authenticated user profile info safely (works regardless of optional phone column)
    const { data: userProfile } = await adminDb
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const profileObj = (userProfile ?? {}) as Record<string, unknown>;
    const customerName =
      clientRecord.display_name ||
      (typeof profileObj.name === "string" && profileObj.name) ||
      clientRecord.company_name ||
      user.email?.split("@")[0] ||
      "MuktoKormo Client";
    const customerEmail =
      (typeof profileObj.email === "string" && profileObj.email) ||
      user.email ||
      "client@muktokormo.com";
    const customerPhone =
      typeof profileObj.phone === "string" && profileObj.phone.trim()
        ? profileObj.phone.trim()
        : typeof user.user_metadata?.phone === "string" && user.user_metadata.phone.trim()
          ? user.user_metadata.phone.trim()
          : "01700000000";
    const customerAddress = clientRecord.location?.trim() || "Dhaka, Bangladesh";

    // 8. Create PENDING payment record in Supabase
    const { data: pendingPayment, error: insertPayErr } = await adminDb
      .from("payments")
      .insert({
        contract_id: contractId,
        client_id: resolvedClientId,
        freelancer_id: resolvedFreelancerId,
        amount: breakdown.grossAmount,
        platform_fee_pct: breakdown.platformFeePct,
        platform_fee: breakdown.platformFeeAmount,
        freelancer_amount: breakdown.freelancerPayableAmount,
        currency: SUPPORTED_CURRENCY,
        transaction_id: tranId,
        status: "PENDING",
        gateway: "SSLCOMMERZ",
        initiated_by: user.id,
      })
      .select("id, transaction_id")
      .single();

    if (insertPayErr || !pendingPayment) {
      console.error("Failed to create pending payment record:", insertPayErr?.message);
      return Response.json(
        { error: "Unable to create pending payment record." },
        { status: 500 }
      );
    }

    // 9. Initiate SSLCOMMERZ Sandbox checkout session
    const contractTitle =
      project?.title?.trim() ||
      `MuktoKormo Contract ${row.contract_code || contractId.slice(0, 8)}`;
    const productCategory = project?.category?.trim() || "Freelance Services";

    const gatewayResult = await initiateSslCommerzSession({
      tranId,
      totalAmount: breakdown.grossAmount,
      currency: SUPPORTED_CURRENCY,
      productName: contractTitle,
      productCategory,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      contractId,
      paymentId: pendingPayment.id,
    });

    // Record INITIATE telemetry (never stores credentials)
    await adminDb.from("payment_transactions").insert({
      payment_id: pendingPayment.id,
      contract_id: contractId,
      event_type: "INITIATE",
      gateway: "SSLCOMMERZ",
      gateway_transaction_id: tranId,
      gateway_status: gatewayResult.ok ? "SESSION_CREATED" : "SESSION_FAILED",
      amount: breakdown.grossAmount,
      currency: SUPPORTED_CURRENCY,
      response_summary: gatewayResult.rawSanitized,
    });

    if (!gatewayResult.ok || !gatewayResult.gatewayPageUrl) {
      await adminDb
        .from("payments")
        .update({
          status: "FAILED",
          failure_reason: gatewayResult.failedReason || "Gateway session initialization failed.",
        })
        .eq("id", pendingPayment.id);

      if (currentPayStatus === "PENDING") {
        await adminDb
          .from("contracts")
          .update({ payment_status: "FAILED" })
          .eq("id", contractId);
      }

      return Response.json(
        {
          error: gatewayResult.failedReason || "Failed to initialize SSLCOMMERZ sandbox payment session.",
          transactionId: tranId,
        },
        { status: 502 }
      );
    }

    // 10. Save session metadata on payment & mark contract PENDING if still UNPAID/FAILED/CANCELLED
    await adminDb
      .from("payments")
      .update({
        gateway_session_key: gatewayResult.sessionKey,
        gateway_url: gatewayResult.gatewayPageUrl,
      })
      .eq("id", pendingPayment.id);

    if (["UNPAID", "FAILED", "CANCELLED"].includes(currentPayStatus)) {
      await adminDb
        .from("contracts")
        .update({ payment_status: "PENDING" })
        .eq("id", contractId);
    }

    return Response.json({
      ok: true,
      sandbox: true,
      paymentId: pendingPayment.id,
      transactionId: tranId,
      amount: breakdown.grossAmount,
      platformFeePct: breakdown.platformFeePct,
      platformFee: breakdown.platformFeeAmount,
      freelancerPayable: breakdown.freelancerPayableAmount,
      currency: SUPPORTED_CURRENCY,
      gatewayPageUrl: gatewayResult.gatewayPageUrl,
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      console.error("Payment initiate config error:", err.message);
      return Response.json({ error: err.message }, { status: 500 });
    }
    console.error("Unexpected payment initiate error:", err);
    return Response.json(
      { error: "Unexpected error initiating payment session." },
      { status: 500 }
    );
  }
}
