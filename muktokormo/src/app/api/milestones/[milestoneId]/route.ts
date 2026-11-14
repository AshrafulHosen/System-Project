import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/payments/constants";
import { callMilestoneRpc, getSessionUserId } from "@/lib/milestones/server";

interface RouteContext {
  params: Promise<{ milestoneId: string }>;
}

const WORK_ACTIONS = new Set(["start", "submit", "request_revision", "approve", "raise_dispute"]);

function sanitizeLinks(raw: unknown): { label: string; url: string }[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > 10) return null;
  const out: { label: string; url: string }[] = [];
  for (const item of raw) {
    const url = typeof item === "string" ? item : (item as { url?: unknown })?.url;
    const label = typeof item === "object" && item ? (item as { label?: unknown }).label : undefined;
    if (typeof url !== "string") return null;
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      out.push({ url: parsed.toString(), label: typeof label === "string" ? label.slice(0, 120) : "" });
    } catch {
      return null;
    }
  }
  return out;
}

/**
 * POST — milestone work actions and payment release.
 * Body: { action: start|submit|request_revision|approve|raise_dispute|release, payload? }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { milestoneId } = await context.params;
  if (!isUuid(milestoneId)) {
    return NextResponse.json({ ok: false, error: "Invalid milestone id." }, { status: 400 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  let body: { action?: unknown; payload?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; payload?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  const raw = (body.payload && typeof body.payload === "object" ? body.payload : {}) as Record<string, unknown>;

  if (action === "release") {
    const rpc = await callMilestoneRpc("release_milestone_payment", {
      p_milestone_id: milestoneId,
      p_actor_user_id: userId,
    });
    if (!rpc.ok) {
      return NextResponse.json({ ok: false, error: rpc.error, code: rpc.code }, { status: rpc.status });
    }
    return NextResponse.json({ ok: true, result: rpc.data });
  }

  if (!WORK_ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }

  // Only pass through the fields each action uses
  const payload: Record<string, unknown> = {};
  if (typeof raw.message === "string") payload.message = raw.message.slice(0, 4000);
  if (action === "submit") {
    if (typeof raw.demo_url === "string" && raw.demo_url.trim()) payload.demo_url = raw.demo_url.trim();
    const links = sanitizeLinks(raw.attachments);
    if (links === null) {
      return NextResponse.json(
        { ok: false, error: "Attachments must be up to 10 http(s) links." },
        { status: 400 }
      );
    }
    payload.attachments = links;
  }

  const rpc = await callMilestoneRpc("milestone_work_action", {
    p_milestone_id: milestoneId,
    p_actor_user_id: userId,
    p_action: action,
    p_payload: payload,
  });
  if (!rpc.ok) {
    return NextResponse.json({ ok: false, error: rpc.error, code: rpc.code }, { status: rpc.status });
  }
  return NextResponse.json({ ok: true, result: rpc.data });
}
