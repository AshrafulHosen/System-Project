import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError } from "@/lib/env";
import {
  getClientPaymentDashboardData,
  getFreelancerPaymentDashboardData,
} from "@/lib/payments/dashboard-server";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate caller first via Supabase SSR session cookies
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to access payment dashboard." },
        { status: 401 }
      );
    }

    const roleParam = request.nextUrl.searchParams
      .get("role")
      ?.trim()
      .toLowerCase();

    if (roleParam && roleParam !== "client" && roleParam !== "freelancer") {
      return NextResponse.json(
        {
          ok: false,
          error:
            roleParam === "admin"
              ? "Admin accounts must query GET /api/admin/payments."
              : "Query parameter 'role' must be 'client' or 'freelancer'.",
        },
        { status: roleParam === "admin" ? 403 : 400 }
      );
    }

    let targetRole: "client" | "freelancer";
    if (roleParam === "client" || roleParam === "freelancer") {
      targetRole = roleParam;
    } else {
      const adminDb = createAdminClient();
      const [
        { data: isAdminFlag },
        { data: clientRow },
        { data: freelancerRow },
      ] = await Promise.all([
        adminDb.rpc("is_admin", { uid: user.id }),
        adminDb.from("clients").select("id").eq("user_id", user.id).maybeSingle(),
        adminDb
          .from("freelancers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (Boolean(isAdminFlag)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Admins must use GET /api/admin/payments.",
          },
          { status: 403 }
        );
      }

      targetRole = freelancerRow?.id && !clientRow?.id ? "freelancer" : "client";
    }

    const result =
      targetRole === "freelancer"
        ? await getFreelancerPaymentDashboardData(user.id)
        : await getClientPaymentDashboardData(user.id);

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
    console.error("Unexpected GET /api/payments/dashboard error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error loading payment dashboard data." },
      { status: 500 }
    );
  }
}

