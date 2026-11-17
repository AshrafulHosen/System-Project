import { getSessionUserId } from "@/lib/milestones/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHONE_OTP_MAX_ATTEMPTS } from "@/lib/phone/shared";
import { hashOtp, otpHashesEqual, PhoneConfigError, phoneError, phoneOk } from "@/lib/phone/server";

export const runtime = "nodejs";

/** POST /api/phone/verify-otp  { otp } */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return phoneError("UNAUTHENTICATED");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return phoneError("INVALID_REQUEST");
  }
  const rawOtp = (body as { otp?: unknown })?.otp;
  const otp = typeof rawOtp === "string" ? rawOtp.trim() : "";
  if (!/^\d{6}$/.test(otp)) return phoneError("INVALID_OTP");

  const db = createAdminClient();

  // 1. Atomically spend one attempt (fails if expired / exhausted / missing).
  const { data: attempt, error: attemptErr } = await db.rpc("phone_otp_take_attempt", {
    p_user_id: userId,
    p_max_attempts: PHONE_OTP_MAX_ATTEMPTS,
  });
  if (attemptErr || !attempt) {
    console.error("phone_otp_take_attempt failed:", attemptErr?.code ?? "no data");
    return phoneError("SERVER_ERROR");
  }
  if (!attempt.ok) {
    const known = ["NO_PENDING", "EXPIRED", "TOO_MANY_ATTEMPTS"] as const;
    return phoneError(known.find((k) => k === attempt.code) ?? "SERVER_ERROR");
  }

  // 2. Timing-safe comparison of HMAC hashes.
  let submittedHash: string;
  try {
    submittedHash = hashOtp(userId, String(attempt.phone_number), otp);
  } catch (e) {
    if (e instanceof PhoneConfigError) {
      console.error("Phone verification config error:", e.message);
      return phoneError("NOT_CONFIGURED");
    }
    throw e;
  }

  if (!otpHashesEqual(submittedHash, String(attempt.otp_hash))) {
    const remaining = Math.max(PHONE_OTP_MAX_ATTEMPTS - Number(attempt.attempts), 0);
    return remaining > 0
      ? phoneError("WRONG_CODE", { attemptsRemaining: remaining })
      : phoneError("TOO_MANY_ATTEMPTS", { attemptsRemaining: 0 });
  }

  // 3. Consume the code (single use) and mark the profile verified.
  const { data: done, error: doneErr } = await db.rpc("phone_otp_complete", {
    p_user_id: userId,
    p_otp_hash: submittedHash,
  });
  if (doneErr || !done) {
    console.error("phone_otp_complete failed:", doneErr?.code ?? "no data");
    return phoneError("SERVER_ERROR");
  }
  if (!done.ok) {
    if (done.code === "PHONE_IN_USE") return phoneError("PHONE_IN_USE");
    if (done.code === "NO_PENDING") return phoneError("EXPIRED");
    return phoneError("SERVER_ERROR");
  }

  return phoneOk({ verified: true, phoneNumber: done.phone_number, verifiedAt: done.verified_at });
}
