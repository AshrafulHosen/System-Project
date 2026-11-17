import { createAdminClient } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("src/lib/ai/usage.ts cannot be imported in browser code.");
}

export type AiKind = "PROPOSAL" | "PROJECT_BRIEF" | "ASSISTANT";

/** Per-user limits per feature. Counted from the database so they hold across server instances. */
export const AI_LIMITS: Record<AiKind, { perHour: number; perDay: number }> = {
  PROPOSAL: { perHour: 15, perDay: 60 },
  PROJECT_BRIEF: { perHour: 15, perDay: 60 },
  ASSISTANT: { perHour: 30, perDay: 120 },
};

/**
 * Logged-out visitors can't be tracked in the database (the log is per user), so the
 * site assistant uses a per-IP in-memory limit for them. Best-effort: resets on restart
 * and is per server instance.
 */
const ANON_LIMIT = { perHour: 8 };
const anonHits = new Map<string, number[]>();

export function checkAnonymousRateLimit(ip: string): { allowed: true } | { allowed: false; retryAfterSeconds: number; message: string } {
  const now = Date.now();
  const recent = (anonHits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= ANON_LIMIT.perHour) {
    anonHits.set(ip, recent);
    return { allowed: false, retryAfterSeconds: 900, message: "You've reached the guest question limit. Sign in to keep asking, or try again later." };
  }
  recent.push(now);
  anonHits.set(ip, recent);
  if (anonHits.size > 5000) {
    for (const [k, v] of anonHits) if (!v.some((t) => now - t < 3600_000)) anonHits.delete(k);
  }
  return { allowed: true };
}

export async function checkAiRateLimit(
  userId: string,
  kind: AiKind
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number; message: string }> {
  const db = createAdminClient();
  const now = Date.now();
  const hourAgo = new Date(now - 3600_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const [{ count: hourCount, error: hourErr }, { count: dayCount, error: dayErr }] = await Promise.all([
    db.from("ai_generations").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("kind", kind).neq("status", "REJECTED").gte("created_at", hourAgo),
    db.from("ai_generations").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("kind", kind).neq("status", "REJECTED").gte("created_at", dayAgo),
  ]);

  // Fail closed: without the usage log we can't enforce limits, so don't spend the API key.
  if (hourErr || dayErr) {
    console.error("AI rate-limit check failed (is migration 20261114020000 applied?):", (hourErr ?? dayErr)?.message);
    return {
      allowed: false,
      retryAfterSeconds: 60,
      message: "AI usage tracking isn't set up on this server yet, so AI features are paused. Apply the ai_generation_log migration.",
    };
  }

  const limits = AI_LIMITS[kind];
  if ((dayCount ?? 0) >= limits.perDay) {
    return { allowed: false, retryAfterSeconds: 3600, message: `Daily AI limit reached (${limits.perDay}). Try again tomorrow.` };
  }
  if ((hourCount ?? 0) >= limits.perHour) {
    return { allowed: false, retryAfterSeconds: 900, message: `Hourly AI limit reached (${limits.perHour}). Try again later.` };
  }
  return { allowed: true };
}

export async function logAiGeneration(row: {
  userId: string;
  kind: AiKind;
  action: string;
  relatedId?: string | null;
  provider: string;
  model: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  status: "SUCCESS" | "FAILED" | "REJECTED";
  errorCode?: string | null;
}): Promise<void> {
  const { error } = await createAdminClient().from("ai_generations").insert({
    user_id: row.userId,
    kind: row.kind,
    action: row.action.slice(0, 32),
    related_id: row.relatedId ?? null,
    provider: row.provider.slice(0, 32),
    model: row.model.slice(0, 80),
    prompt_tokens: row.promptTokens ?? null,
    completion_tokens: row.completionTokens ?? null,
    status: row.status,
    error_code: row.errorCode?.slice(0, 48) ?? null,
  });
  if (error) console.error("ai_generations log failed:", error.message);
}
