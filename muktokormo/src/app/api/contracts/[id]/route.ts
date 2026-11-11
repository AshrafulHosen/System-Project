import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { PaymentConfigError } from "@/lib/env";
import { getContractWorkspacePayloadOrAlias } from "@/lib/payments/contracts-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  void request;
  try {
    const { id } = await context.params;

    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to access this contract." },
        { status: 401 }
      );
    }

    const result = await getContractWorkspacePayloadOrAlias(id, user.id);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("GET /api/contracts/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error loading contract workspace." },
      { status: 500 }
    );
  }
}

