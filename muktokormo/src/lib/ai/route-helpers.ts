import { NextResponse } from "next/server";
import { AiError, aiErrorStatus } from "@/lib/ai/provider";
import { logAiGeneration, type AiKind } from "@/lib/ai/usage";

if (typeof window !== "undefined") {
  throw new Error("src/lib/ai/route-helpers.ts cannot be imported in browser code.");
}

/** Trims, de-duplicates and length-limits a list of strings from model output. */
export function cleanList(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const t = item.trim().replace(/\s+/g, " ").slice(0, maxLen);
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
    if (out.length >= maxItems) break;
  }
  return out;
}

/** Converts provider errors into a JSON response and logs the failed attempt. */
export async function aiFailureResponse(
  err: unknown,
  log: { userId: string; kind: AiKind; action: string; relatedId?: string | null; provider: string; model: string }
) {
  const code = err instanceof AiError ? err.code : "PROVIDER_ERROR";
  const message = err instanceof AiError ? err.message : "The AI request failed.";
  if (code !== "NOT_CONFIGURED") {
    await logAiGeneration({ ...log, status: "FAILED", errorCode: code });
  }
  if (!(err instanceof AiError)) console.error("AI route error:", err);
  return NextResponse.json({ ok: false, code, error: message }, { status: aiErrorStatus(code) });
}
