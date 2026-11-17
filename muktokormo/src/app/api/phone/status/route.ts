import { getSessionUserId } from "@/lib/milestones/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PHONE_OTP_MAX_ATTEMPTS,
  PHONE_OTP_RESEND_COOLDOWN_SECONDS,
  type PhoneStatusResponse,
} from "@/lib/phone/shared";
import { phoneError } from "@/lib/phone/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/phone/status — the caller's phone + verification state. Never returns OTPs or hashes. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return phoneError("UNAUTHENTICATED");

  const db = createAdminClient();
  const [userRes, pendingRes, lastSendRes] = await Promise.all([
    db.from("users").select("phone_number, phone_verified, phone_verified_at").eq("id", userId).maybeSingle(),
    db
      .from("phone_verifications")
      .select("phone_number, expires_at, attempts")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("phone_otp_send_log")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (userRes.error || pendingRes.error || lastSendRes.error) {
    console.error("phone status query failed:", userRes.error?.code ?? pendingRes.error?.code ?? lastSendRes.error?.code);
    return phoneError("SERVER_ERROR");
  }

  const pending = pendingRes.data;
  const lastSent = lastSendRes.data?.created_at ? new Date(lastSendRes.data.created_at).getTime() : null;
  const resendAt = lastSent ? lastSent + PHONE_OTP_RESEND_COOLDOWN_SECONDS * 1000 : null;

  const payload: PhoneStatusResponse = {
    ok: true,
    phoneNumber: userRes.data?.phone_number ?? null,
    verified: Boolean(userRes.data?.phone_verified),
    verifiedAt: userRes.data?.phone_verified_at ?? null,
    pending: pending
      ? {
          phoneNumber: pending.phone_number,
          expiresAt: pending.expires_at,
          expired: new Date(pending.expires_at).getTime() <= Date.now(),
          attemptsRemaining: Math.max(PHONE_OTP_MAX_ATTEMPTS - Number(pending.attempts), 0),
        }
      : null,
    resendAvailableAt: resendAt && resendAt > Date.now() ? new Date(resendAt).toISOString() : null,
  };

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
