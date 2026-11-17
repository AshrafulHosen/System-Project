import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/milestones/server";
import { AiError, aiErrorStatus, generateJson, getAiConfig } from "@/lib/ai/provider";
import { checkAiRateLimit, checkAnonymousRateLimit, logAiGeneration } from "@/lib/ai/usage";
import { aiFailureResponse } from "@/lib/ai/route-helpers";
import { ASSISTANT_SCHEMA, ASSISTANT_SYSTEM, type AssistantOutput } from "@/lib/ai/prompts";
import { ASSISTANT_LINKS, SITE_KNOWLEDGE } from "@/lib/ai/site-knowledge";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 12;

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim().slice(0, 64);
}

async function roleFor(userId: string): Promise<"client" | "freelancer" | "admin" | null> {
  const db = createAdminClient();
  const [{ data: isAdmin }, { data: fl }, { data: cl }] = await Promise.all([
    db.rpc("is_admin", { uid: userId }),
    db.from("freelancers").select("id").eq("user_id", userId).maybeSingle(),
    db.from("clients").select("id").eq("user_id", userId).maybeSingle(),
  ]);
  if (isAdmin) return "admin";
  if (fl) return "freelancer";
  if (cl) return "client";
  return null;
}

/**
 * POST /api/ai/assistant
 * Body: { messages: [{ role: "user" | "assistant", content }] } — latest message last.
 * Answers questions about Muktokormo from curated site knowledge only.
 * It has no access to any user's account data.
 */
export async function POST(request: NextRequest) {
  let body: { messages?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ ok: false, error: "Ask a question first." }, { status: 400 });
  }
  const messages: ChatMessage[] = (body.messages as unknown[])
    .slice(-MAX_MESSAGES)
    .map((m) => {
      const o = (m ?? {}) as Record<string, unknown>;
      const role = o.role === "assistant" ? "assistant" : "user";
      const content = typeof o.content === "string" ? o.content.trim().slice(0, role === "user" ? 1000 : 2000) : "";
      return { role, content } as ChatMessage;
    })
    .filter((m) => m.content);
  const latest = messages[messages.length - 1];
  if (!latest || latest.role !== "user" || latest.content.length < 2) {
    return NextResponse.json({ ok: false, error: "Ask a question first." }, { status: 400 });
  }

  const cfg = getAiConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, code: "NOT_CONFIGURED", error: "The assistant isn't available right now." }, { status: 503 });
  }

  const userId = await getSessionUserId();
  const limit = userId ? await checkAiRateLimit(userId, "ASSISTANT") : checkAnonymousRateLimit(clientIp(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", error: limit.message },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }
  const role = userId ? await roleFor(userId) : null;

  const allowed = Object.keys(ASSISTANT_LINKS);
  const user = `<DATA>\n${JSON.stringify({ USER_ROLE: role ?? "visitor (not signed in)", CONVERSATION: messages }, null, 2)}\n</DATA>\n\nAnswer the latest user message in CONVERSATION.`;
  const logBase = { userId: userId ?? "", kind: "ASSISTANT" as const, action: "ask", provider: cfg.provider, model: cfg.model };

  try {
    const result = await generateJson<AssistantOutput>({
      system: ASSISTANT_SYSTEM(SITE_KNOWLEDGE, allowed),
      user,
      schemaName: "site_assistant_answer",
      schema: ASSISTANT_SCHEMA as unknown as Record<string, unknown>,
      maxOutputTokens: 700,
      temperature: 0.3,
    });

    const answer = typeof result.data?.answer === "string" ? result.data.answer.trim().slice(0, 3000) : "";
    if (answer.length < 2) {
      if (userId) await logAiGeneration({ ...logBase, model: result.model, status: "FAILED", errorCode: "INVALID_OUTPUT" });
      return NextResponse.json({ ok: false, code: "INVALID_OUTPUT", error: "The assistant couldn't answer that. Try rephrasing." }, { status: 502 });
    }
    // Only real, allow-listed internal pages — never model-invented URLs.
    const links = Array.from(new Set((Array.isArray(result.data.links) ? result.data.links : []).map((l) => String(l).trim())))
      .filter((href) => href in ASSISTANT_LINKS)
      .slice(0, 3)
      .map((href) => ({ href, label: ASSISTANT_LINKS[href] }));

    if (userId) {
      await logAiGeneration({
        ...logBase,
        model: result.model,
        status: "SUCCESS",
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
      });
    }
    return NextResponse.json({ ok: true, answer, links });
  } catch (err) {
    if (!userId) {
      // Guests aren't logged in the database; just return the error.
      const code = err instanceof AiError ? err.code : "PROVIDER_ERROR";
      const message = err instanceof AiError ? err.message : "The assistant request failed.";
      return NextResponse.json({ ok: false, code, error: message }, { status: aiErrorStatus(code) });
    }
    return aiFailureResponse(err, logBase);
  }
}
