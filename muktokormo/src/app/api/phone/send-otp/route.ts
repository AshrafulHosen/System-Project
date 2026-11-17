import { getSessionUserId } from "@/lib/milestones/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeBdPhone,
  PHONE_OTP_RESEND_COOLDOWN_SECONDS,
  PHONE_OTP_TTL_SECONDS,
} from "@/lib/phone/shared";
import {
  generateOtp,
  hashedClientIp,
  hashOtp,
  nishchitApiKey,
  PhoneConfigError,
  phoneError,
  phoneOk,
  sendNishchitSms,
  SEND_LIMITS,
  shouldEchoDevOtp,
} from "@/lib/phone/server";

export const runtime = "nodejs";

/**
 * POST /api/phone/send-otp  { phone }
 * Sends (or re-sends) a 6-digit code. Resending replaces the previous code.
 */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return phoneError("UNAUTHENTICATED");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return phoneError("INVALID_REQUEST");
  }
  const rawPhone = (body as { phone?: unknown })?.phone;
  const phone = typeof rawPhone === "string" ? normalizeBdPhone(rawPhone) : null;
  if (!phone) return phoneError("INVALID_PHONE");

  let otpHash: string;
  let ipHash: string | null;
  const otp = generateOtp();
  try {
    nishchitApiKey();
    otpHash = hashOtp(userId, phone, otp);
    ipHash = hashedClientIp(req);
  } catch (e) {
    if (e instanceof PhoneConfigError) {
      console.error("Phone verification config error:", e.message);
      return phoneError("NOT_CONFIGURED");
    }
    throw e;
  }

  const db = createAdminClient();

  // 1. Atomically check cooldown / rate limits / uniqueness and store the hash.
  const { data: begin, error: beginErr } = await db.rpc("phone_otp_begin_send", {
    p_user_id: userId,
    p_phone: phone,
    p_ip_hash: ipHash,
    p_otp_hash: otpHash,
    p_ttl_seconds: PHONE_OTP_TTL_SECONDS,
    p_cooldown_secs: PHONE_OTP_RESEND_COOLDOWN_SECONDS,
    p_max_per_user: SEND_LIMITS.perUser,
    p_max_per_phone: SEND_LIMITS.perPhone,
    p_max_per_ip: SEND_LIMITS.perIp,
    p_window_seconds: SEND_LIMITS.windowSeconds,
  });
  if (beginErr || !begin) {
    console.error("phone_otp_begin_send failed:", beginErr?.code ?? "no data");
    return phoneError("SERVER_ERROR");
  }
  if (!begin.ok) {
    if (begin.code === "COOLDOWN") {
      return phoneError("COOLDOWN", { retryAfter: Number(begin.retry_after) || PHONE_OTP_RESEND_COOLDOWN_SECONDS });
    }
    const known = ["INVALID_PHONE", "ALREADY_VERIFIED", "PHONE_IN_USE", "RATE_LIMITED"] as const;
    const code = known.find((k) => k === begin.code) ?? "SERVER_ERROR";
    return phoneError(code);
  }

  // 2. Send the SMS. On failure, roll back the reservation.
  const sms = await sendNishchitSms(
    phone,
    `Your Muktokormo verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`
  );
  if (!sms.ok) {
    const { error: abortErr } = await db.rpc("phone_otp_abort_send", {
      p_user_id: userId,
      p_log_id: begin.log_id,
      p_otp_hash: otpHash,
    });
    if (abortErr) console.error("phone_otp_abort_send failed:", abortErr.code);
    if (sms.providerCode === "unsupported_country" || sms.providerCode === "invalid_recipient") {
      return phoneError("INVALID_PHONE");
    }
    return phoneError("SMS_FAILED");
  }

  return phoneOk({
    phoneNumber: phone,
    expiresAt: begin.expires_at,
    resendAvailableAt: new Date(Date.now() + PHONE_OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString(),
    ...(shouldEchoDevOtp() ? { devOtp: otp } : {}),
  });
}
