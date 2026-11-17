/**
 * Phone verification helpers that are safe for both browser and server code.
 * Nishchit only delivers to Bangladeshi mobile numbers (+8801[3-9]XXXXXXXX).
 */

export const PHONE_OTP_LENGTH = 6;
export const PHONE_OTP_TTL_SECONDS = 5 * 60;
export const PHONE_OTP_RESEND_COOLDOWN_SECONDS = 60;
export const PHONE_OTP_MAX_ATTEMPTS = 5;

export const SUPPORTED_COUNTRIES = [
  { code: "BD", dial: "+880", label: "Bangladesh", flag: "🇧🇩" },
] as const;

const E164_BD = /^\+8801[3-9]\d{8}$/;

/**
 * Normalises a Bangladeshi mobile number to E.164 (+8801XXXXXXXXX).
 * Accepts "01712345678", "1712345678", "8801712345678", "+880 1712-345678".
 * Returns null when the input is not a valid BD mobile number.
 */
export function normalizeBdPhone(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 24) return null;
  if (!/^[+\d\s\-()]+$/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("880")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);

  const e164 = `+880${digits}`;
  return E164_BD.test(e164) ? e164 : null;
}

/** "+8801712345678" -> "+880 1712-345678" */
export function formatBdPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const m = /^\+880(\d{4})(\d{6})$/.exec(e164);
  return m ? `+880 ${m[1]}-${m[2]}` : e164;
}

/** "+8801712345678" -> "+880 17••-•••678" — for messages and logs. */
export function maskBdPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const m = /^\+880(\d{2})\d{5}(\d{3})$/.exec(e164);
  return m ? `+880 ${m[1]}••-•••${m[2]}` : "•••";
}

export interface PhoneStatusResponse {
  ok: true;
  phoneNumber: string | null;
  verified: boolean;
  verifiedAt: string | null;
  pending: {
    phoneNumber: string;
    expiresAt: string;
    expired: boolean;
    attemptsRemaining: number;
  } | null;
  resendAvailableAt: string | null;
}

export type PhoneErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_PHONE"
  | "INVALID_OTP"
  | "INVALID_REQUEST"
  | "ALREADY_VERIFIED"
  | "PHONE_IN_USE"
  | "COOLDOWN"
  | "RATE_LIMITED"
  | "NO_PENDING"
  | "EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "WRONG_CODE"
  | "SMS_FAILED"
  | "NOT_CONFIGURED"
  | "SERVER_ERROR";
