import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError } from "@/lib/env";
import { isUuid } from "@/lib/payments/constants";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to load notifications." },
        { status: 401 }
      );
    }

    const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 30);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(100, Math.max(1, Math.floor(rawLimit)))
      : 30;

    const adminDb = createAdminClient();
    const [listRes, unreadRes] = await Promise.all([
      adminDb
        .from("notifications")
        .select(
          "id, user_id, role_target, contract_id, payment_id, event_key, title, message, title_bn, message_bn, is_read, read_at, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      adminDb
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);

    if (listRes.error) {
      console.error("Failed loading notifications:", listRes.error.message);
      return NextResponse.json(
        { ok: false, error: "Failed to load notifications from database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      notifications: listRes.data ?? [],
      unreadCount: unreadRes.count ?? 0,
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error loading notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to update notifications." },
        { status: 401 }
      );
    }

    let body: { notificationIds?: unknown; markAllRead?: unknown };
    try {
      body = (await request.json()) as {
        notificationIds?: unknown;
        markAllRead?: unknown;
      };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const markAllRead = body.markAllRead === true;
    const adminDb = createAdminClient();
    const nowIso = new Date().toISOString();

    if (markAllRead) {
      const { error: updErr } = await adminDb
        .from("notifications")
        .update({ is_read: true, read_at: nowIso })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updErr) {
        console.error("Failed marking all notifications read:", updErr.message);
        return NextResponse.json(
          { ok: false, error: "Failed updating notification status." },
          { status: 500 }
        );
      }
    } else {
      const ids = Array.isArray(body.notificationIds)
        ? body.notificationIds
            .filter((item): item is string => isUuid(item))
            .slice(0, 50)
        : [];

      if (ids.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "Provide markAllRead=true or at least one valid notification UUID.",
          },
          { status: 400 }
        );
      }

      const { error: updErr } = await adminDb
        .from("notifications")
        .update({ is_read: true, read_at: nowIso })
        .eq("user_id", user.id)
        .in("id", ids);

      if (updErr) {
        console.error("Failed marking notification(s) read:", updErr.message);
        return NextResponse.json(
          { ok: false, error: "Failed updating notification status." },
          { status: 500 }
        );
      }
    }

    const { count: unreadCount } = await adminDb
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      ok: true,
      unreadCount: unreadCount ?? 0,
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error updating notifications." },
      { status: 500 }
    );
  }
}

