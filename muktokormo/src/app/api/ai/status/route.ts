import { NextResponse } from "next/server";
import { getAiConfig } from "@/lib/ai/provider";

/** GET — whether AI features are configured. Never reveals keys or provider details. */
export async function GET() {
  return NextResponse.json({ ok: true, configured: getAiConfig() !== null });
}
