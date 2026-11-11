import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { PaymentConfigError } from "@/lib/env";
import { getAdminPaymentDashboardData } from "@/lib/payments/dashboard-server";

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
        { ok: false, error: "Authentication required for admin payment access." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") ?? "";
    const status = searchParams.get("status") ?? "ALL";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";

    const result = await getAdminPaymentDashboardData(user.id, {
      q,
      status,
      from,
      to,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(result.payload, { status: 200 });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 500 }
      );
    }
    console.error("Unexpected GET /api/admin/payments error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error loading admin payment console." },
      { status: 500 }
    );
  }
}

