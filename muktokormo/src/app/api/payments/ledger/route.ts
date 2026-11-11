import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { PaymentConfigError } from "@/lib/env";
import { isUuid } from "@/lib/payments/constants";
import { getScopedEscrowLedgerData } from "@/lib/payments/escrow-server";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate caller first
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to access escrow ledger." },
        { status: 401 }
      );
    }

    // 2. Validate optional contractId query parameter
    const contractIdParam = request.nextUrl.searchParams.get("contractId");
    let contractId: string | null = null;
    if (contractIdParam !== null && contractIdParam.trim() !== "") {
      if (!isUuid(contractIdParam)) {
        return NextResponse.json(
          { ok: false, error: "contractId must be a valid UUID." },
          { status: 400 }
        );
      }
      contractId = contractIdParam.trim();
    }

    const result = await getScopedEscrowLedgerData({
      userId: user.id,
      contractId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Unable to load escrow ledger." },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({
      ok: true,
      viewerRole: result.viewerRole,
      simulationDisclaimer: result.simulationDisclaimer,
      summary: result.summary,
      entries: result.entries,
      payments: result.payments,
      transactions: result.transactions,
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("Unexpected GET /api/payments/ledger error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error reading internal escrow ledger." },
      { status: 500 }
    );
  }
}

