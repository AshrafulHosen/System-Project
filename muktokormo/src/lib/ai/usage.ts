import { createAdminClient } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("src/lib/ai/usage.ts cannot be imported in browser code.");
}

export type AiKind = "PROPOSAL" | "PROJECT_BRIEF";

/** Per-user limits per feature. Counted from the database so they hold across server instances. */
export const AI_LIMITS = { perHour: 15, perDay: 60 } as const;

export async function checkAiRateLimit(
  userId: string,
  kind: AiKind
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number; message: string }> {
  const db = createAdminClient();
  const now = Date.now();
  const hourAgo = new Date(now - 3600_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const [{ count: hourCount }, { count: dayCount }] = await Promise.all([
    db.from("ai_generations").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("kind", kind).neq("status", "REJECTED").gte("created_at", hourAgo),
    db.from("ai_generations").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("kind", kind).neq("status", "REJECTED").gte("created_at", dayAgo),
  ]);

  if ((dayCount ?? 0) >= AI_LIMITS.perDay) {
    return { allowed: false, retryAfterSeconds: 3600, message: `Daily AI limit reached (${AI_LIMITS.perDay}). Try again tomorrow.` };
  }
  if ((hourCount ?? 0) >= AI_LIMITS.perHour) {
    return { allowed: false, retryAfterSeconds: 900, message: `Hourly AI limit reached (${AI_LIMITS.perHour}). Try again later.` };
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
