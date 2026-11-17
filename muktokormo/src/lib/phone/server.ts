import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { PhoneErrorCode } from "@/lib/phone/shared";

if (typeof window !== "undefined") {
  throw new Error("src/lib/phone/server.ts cannot be imported in browser code.");
}

const NISHCHIT_ENDPOINT = "https://api.nishchit.tech/v1/messages";
const NISHCHIT_TIMEOUT_MS = 15_000;

/** Rolling-window send limits (in addition to the 60 s per-user cooldown). */
export const SEND_LIMITS = {
  windowSeconds: 60 * 60,
  perUser: 5,
  perPhone: 5,
  perIp: 15,
} as const;

export class PhoneConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhoneConfigError";
  }
}

function readSecret(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new PhoneConfigError(`Missing server environment variable: ${name}`);
  return v;
}

/** HMAC secret for OTP hashes; never sent to the client. */
function otpSecret(): string {
  const v = readSecret("PHONE_OTP_SECRET");
  if (v.length < 32) throw new PhoneConfigError("PHONE_OTP_SECRET must be at least 32 characters.");
  return v;
}

export function nishchitApiKey(): string {
  const key = readSecret("NISHCHIT_API_KEY");
  if (!/^nk_(live|test)_[A-Za-z0-9]+$/.test(key)) {
    throw new PhoneConfigError("NISHCHIT_API_KEY has an unexpected format.");
  }
  return key;
}

export function isNishchitTestMode(): boolean {
  try {
    return nishchitApiKey().startsWith("nk_test_");
  } catch {
    return false;
  }
}

/**
 * Nishchit test keys never reach a handset, so in local development the code
 * is echoed back to the browser. This is hard-disabled outside
 * NODE_ENV=development and whenever a live key is configured.
 */
export function shouldEchoDevOtp(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    isNishchitTestMode() &&
    process.env.PHONE_OTP_DEV_ECHO?.trim().toLowerCase() !== "false"
  );
}

/** Cryptographically secure, uniformly distributed 6-digit code. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** HMAC-SHA256 bound to the user and phone, so a hash is useless elsewhere. */
export function hashOtp(userId: string, phone: string, otp: string): string {
  return createHmac("sha256", otpSecret()).update(`phone-otp:v1:${userId}:${phone}:${otp}`).digest("hex");
}

export function otpHashesEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length || ab.length === 0) return false;
  return timingSafeEqual(ab, bb);
}

/** Client IP from proxy headers, hashed so raw IPs are never stored. */
export function hashedClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip"))?.trim();
  if (!ip) return null;
  return createHmac("sha256", otpSecret()).update(`ip:${ip}`).digest("hex").slice(0, 32);
}

export type SmsResult =
  | { ok: true; messageId: string | null }
  | { ok: false; retryable: boolean; providerCode: string | null };

/** Longest provider-requested wait we will absorb inside one HTTP request. */
const MAX_INLINE_RETRY_WAIT_MS = 3_000;

/**
 * Sends one SMS via Nishchit. Never logs the message body or the API key.
 * A short provider rate limit (429 rate_limit_exceeded with a small
 * Retry-After) is retried once with the SAME Idempotency-Key, so the retry
 * can never produce a second SMS.
 */
export async function sendNishchitSms(to: string, body: string): Promise<SmsResult> {
  const idempotencyKey = randomUUID();
  const first = await sendNishchitOnce(to, body, idempotencyKey);
  if (first.ok || first.retryAfterMs === null || first.retryAfterMs > MAX_INLINE_RETRY_WAIT_MS) {
    return stripRetry(first);
  }
  await new Promise((r) => setTimeout(r, first.retryAfterMs! + Math.floor(Math.random() * 250)));
  return stripRetry(await sendNishchitOnce(to, body, idempotencyKey));
}

type AttemptResult = SmsResult & { retryAfterMs: number | null };

function stripRetry(r: AttemptResult): SmsResult {
  if (r.ok) return { ok: true, messageId: r.messageId };
  return { ok: false, retryable: r.retryable, providerCode: r.providerCode };
}

async function sendNishchitOnce(to: string, body: string, idempotencyKey: string): Promise<AttemptResult> {
  const key = nishchitApiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NISHCHIT_TIMEOUT_MS);

  try {
    const res = await fetch(NISHCHIT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ to, body }),
      signal: controller.signal,
      cache: "no-store",
    });

    let json: Record<string, unknown> = {};
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      json = {};
    }

    const status = typeof json.status === "string" ? json.status : null;
    if (res.ok && status !== "failed") {
      return { ok: true, messageId: typeof json.id === "string" ? json.id : null, retryAfterMs: null };
    }

    const err = (json.error ?? {}) as Record<string, unknown>;
    const providerCode = typeof err.code === "string" ? err.code : null;
    console.warn("Nishchit SMS rejected", {
      httpStatus: res.status,
      code: providerCode,
      requestId: typeof err.request_id === "string" ? err.request_id : json.request_id ?? null,
    });
    let retryAfterMs: number | null = null;
    if (res.status === 429 && providerCode === "rate_limit_exceeded") {
      const ra = Number(res.headers.get("retry-after"));
      retryAfterMs = Number.isFinite(ra) && ra >= 0 ? ra * 1000 : 1000;
    }
    return { ok: false, retryable: res.status >= 500 || res.status === 429, providerCode, retryAfterMs };
  } catch (e) {
    console.warn("Nishchit SMS request failed", { reason: e instanceof Error ? e.name : "unknown" });
    return { ok: false, retryable: true, providerCode: null, retryAfterMs: null };
  } finally {
    clearTimeout(timer);
  }
}

const STATUS_BY_CODE: Record<PhoneErrorCode, number> = {
  UNAUTHENTICATED: 401,
  INVALID_PHONE: 400,
  INVALID_OTP: 400,
  INVALID_REQUEST: 400,
  ALREADY_VERIFIED: 409,
  PHONE_IN_USE: 409,
  COOLDOWN: 429,
  RATE_LIMITED: 429,
  NO_PENDING: 404,
  EXPIRED: 410,
  TOO_MANY_ATTEMPTS: 429,
  WRONG_CODE: 400,
  SMS_FAILED: 502,
  NOT_CONFIGURED: 503,
  SERVER_ERROR: 500,
};

const MESSAGES: Record<PhoneErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to verify your phone number.",
  INVALID_PHONE: "Enter a valid Bangladeshi mobile number, e.g. 01712-345678.",
  INVALID_OTP: "Enter the 6-digit code from the SMS.",
  INVALID_REQUEST: "The request could not be read.",
  ALREADY_VERIFIED: "This number is already verified on your account.",
  PHONE_IN_USE: "This number is already verified on another Muktokormo account.",
  COOLDOWN: "Please wait before requesting another code.",
  RATE_LIMITED: "Too many code requests. Please try again later.",
  NO_PENDING: "No active code. Request a new one.",
  EXPIRED: "This code has expired. Request a new one.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Request a new code.",
  WRONG_CODE: "That code is incorrect.",
  SMS_FAILED: "We couldn't send the SMS right now. Please try again.",
  NOT_CONFIGURED: "Phone verification is not available right now.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

export function phoneError(code: PhoneErrorCode, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ok: false, code, error: MESSAGES[code], ...extra },
    { status: STATUS_BY_CODE[code], headers: { "Cache-Control": "no-store" } }
  );
}

export function phoneOk(body: Record<string, unknown>) {
  return NextResponse.json({ ok: true, ...body }, { headers: { "Cache-Control": "no-store" } });
}
