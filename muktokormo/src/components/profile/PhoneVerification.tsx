"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareText,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, Input, Select } from "@/components/ui";
import {
  formatBdPhone,
  normalizeBdPhone,
  PHONE_OTP_LENGTH,
  SUPPORTED_COUNTRIES,
  type PhoneErrorCode,
  type PhoneStatusResponse,
} from "@/lib/phone/shared";

type Lang = "en" | "bn";
type VisualState = "NOT_VERIFIED" | "OTP_SENT" | "VERIFIED" | "EXPIRED" | "FAILED";

export interface PhoneVerificationSummary {
  phoneNumber: string | null;
  verified: boolean;
}

interface Props {
  lang?: Lang;
  /** Fires whenever the stored verification state is (re)loaded or changes. */
  onStatusChange?: (summary: PhoneVerificationSummary) => void;
  id?: string;
}

const T = {
  title: { en: "Phone verification", bn: "ফোন নম্বর যাচাই" },
  subtitle: {
    en: "Verify your mobile number to build trust with clients and freelancers.",
    bn: "ক্লায়েন্ট ও ফ্রিল্যান্সারদের আস্থা অর্জনে আপনার মোবাইল নম্বর যাচাই করুন।",
  },
  country: { en: "Country", bn: "দেশ" },
  phone: { en: "Mobile number", bn: "মোবাইল নম্বর" },
  phoneHint: { en: "Bangladeshi mobile numbers only, e.g. 01712-345678", bn: "শুধুমাত্র বাংলাদেশি মোবাইল নম্বর, যেমন ০১৭১২-৩৪৫৬৭৮" },
  sendOtp: { en: "Send OTP", bn: "OTP পাঠান" },
  otp: { en: "6-digit code", bn: "৬ সংখ্যার কোড" },
  otpSentTo: { en: "We sent a code to", bn: "কোড পাঠানো হয়েছে" },
  verify: { en: "Verify phone number", bn: "ফোন নম্বর যাচাই করুন" },
  resend: { en: "Resend OTP", bn: "আবার OTP পাঠান" },
  resendIn: { en: "Resend in", bn: "আবার পাঠানো যাবে" },
  expiresIn: { en: "Code expires in", bn: "কোডের মেয়াদ শেষ হবে" },
  changeNumber: { en: "Change number", bn: "নম্বর পরিবর্তন" },
  useDifferent: { en: "Use a different number", bn: "অন্য নম্বর ব্যবহার করুন" },
  cancel: { en: "Cancel", bn: "বাতিল" },
  keepNote: {
    en: "Your current verified number stays on your profile until the new one is verified.",
    bn: "নতুন নম্বর যাচাই না হওয়া পর্যন্ত বর্তমান যাচাইকৃত নম্বরটি থাকবে।",
  },
  verifiedOn: { en: "Verified on", bn: "যাচাই হয়েছে" },
  success: { en: "Your phone number is verified.", bn: "আপনার ফোন নম্বর যাচাই হয়েছে।" },
  sent: { en: "Code sent. Check your SMS inbox.", bn: "কোড পাঠানো হয়েছে। আপনার SMS দেখুন।" },
  network: { en: "Network error. Check your connection and try again.", bn: "নেটওয়ার্ক সমস্যা। সংযোগ দেখে আবার চেষ্টা করুন।" },
  loadFailed: { en: "Couldn't load verification status.", bn: "যাচাইয়ের অবস্থা লোড করা যায়নি।" },
  retry: { en: "Retry", bn: "আবার চেষ্টা" },
  devOtp: { en: "Development test mode — your code is", bn: "ডেভেলপমেন্ট টেস্ট মোড — আপনার কোড" },
  attemptsLeft: { en: "attempts left", bn: "বার চেষ্টা বাকি" },
} as const;

const STATE_BADGE: Record<VisualState, { variant: "verified" | "warning" | "info" | "danger" | "neutral"; icon: React.ReactNode; en: string; bn: string }> = {
  VERIFIED: { variant: "verified", icon: <CheckCircle2 className="w-3 h-3" />, en: "Verified", bn: "যাচাইকৃত" },
  OTP_SENT: { variant: "info", icon: <MessageSquareText className="w-3 h-3" />, en: "OTP Sent", bn: "OTP পাঠানো হয়েছে" },
  EXPIRED: { variant: "neutral", icon: <Clock className="w-3 h-3" />, en: "Expired", bn: "মেয়াদোত্তীর্ণ" },
  FAILED: { variant: "danger", icon: <XCircle className="w-3 h-3" />, en: "Verification Failed", bn: "যাচাই ব্যর্থ" },
  NOT_VERIFIED: { variant: "warning", icon: <AlertTriangle className="w-3 h-3" />, en: "Not Verified", bn: "যাচাই করা হয়নি" },
};

const ERROR_BN: Partial<Record<PhoneErrorCode, string>> = {
  INVALID_PHONE: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন।",
  INVALID_OTP: "SMS-এ পাওয়া ৬ সংখ্যার কোডটি দিন।",
  ALREADY_VERIFIED: "এই নম্বরটি ইতিমধ্যে আপনার অ্যাকাউন্টে যাচাইকৃত।",
  PHONE_IN_USE: "এই নম্বরটি অন্য একটি অ্যাকাউন্টে যাচাইকৃত।",
  COOLDOWN: "আবার কোড চাওয়ার আগে একটু অপেক্ষা করুন।",
  RATE_LIMITED: "অনেকবার কোড চাওয়া হয়েছে। পরে আবার চেষ্টা করুন।",
  NO_PENDING: "কোনো সক্রিয় কোড নেই। নতুন কোড চান।",
  EXPIRED: "কোডের মেয়াদ শেষ। নতুন কোড চান।",
  TOO_MANY_ATTEMPTS: "অনেকবার ভুল কোড দেওয়া হয়েছে। নতুন কোড চান।",
  WRONG_CODE: "কোডটি সঠিক নয়।",
  SMS_FAILED: "এই মুহূর্তে SMS পাঠানো যায়নি। আবার চেষ্টা করুন।",
  NOT_CONFIGURED: "ফোন যাচাই এখন উপলব্ধ নয়।",
  UNAUTHENTICATED: "ফোন যাচাই করতে সাইন ইন করুন।",
};

interface ApiError {
  ok: false;
  code: PhoneErrorCode;
  error: string;
  retryAfter?: number;
  attemptsRemaining?: number;
}

function localDigits(e164: string | null | undefined): string {
  if (!e164) return "";
  return e164.startsWith("+880") ? `0${e164.slice(4)}` : e164;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PhoneVerification({ lang = "en", onStatusChange, id = "verify-phone" }: Props) {
  const t = useCallback((k: keyof typeof T) => T[k][lang], [lang]);

  const [status, setStatus] = useState<PhoneStatusResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const otpRef = useRef<HTMLInputElement>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const errorText = useCallback(
    (body: Partial<ApiError> | null, fallback: string) => {
      if (!body?.code) return fallback;
      if (lang === "bn" && ERROR_BN[body.code]) return ERROR_BN[body.code]!;
      return body.error || fallback;
    },
    [lang]
  );

  const applyStatus = useCallback((s: PhoneStatusResponse) => {
    setStatus(s);
    setResendAt(s.resendAvailableAt ? new Date(s.resendAvailableAt).getTime() : null);
    onStatusChangeRef.current?.({ phoneNumber: s.verified ? s.phoneNumber : null, verified: s.verified });
  }, []);

  const loadStatus = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch("/api/phone/status", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const s = (await res.json()) as PhoneStatusResponse;
      applyStatus(s);
      setPhoneInput((prev) => prev || localDigits(s.pending?.phoneNumber ?? s.phoneNumber));
    } catch {
      setLoadError(true);
    }
  }, [applyStatus]);

  useEffect(() => {
    void Promise.resolve().then(loadStatus);
  }, [loadStatus]);

  // One ticking clock drives both countdowns.
  const pendingExpiresAt = status?.pending ? new Date(status.pending.expiresAt).getTime() : null;
  const needsClock = (resendAt !== null && resendAt > now) || (pendingExpiresAt !== null && pendingExpiresAt > now);
  useEffect(() => {
    if (!needsClock) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [needsClock]);

  const resendSeconds = resendAt ? Math.max(0, (resendAt - now) / 1000) : 0;
  const expiresSeconds = pendingExpiresAt ? Math.max(0, (pendingExpiresAt - now) / 1000) : 0;
  const pending = status?.pending ?? null;
  const pendingActive = Boolean(pending && expiresSeconds > 0 && pending.attemptsRemaining > 0);
  const pendingExpired = Boolean(pending && expiresSeconds <= 0);
  const verified = Boolean(status?.verified);
  const showForm = !verified || editing;
  const showOtpStep = showForm && Boolean(pending) && !pendingExpired;

  const visualState: VisualState = useMemo(() => {
    if (showForm && pending) {
      if (pendingExpired) return "EXPIRED";
      if (failed || pending.attemptsRemaining === 0) return "FAILED";
      return "OTP_SENT";
    }
    if (verified) return "VERIFIED";
    return failed ? "FAILED" : "NOT_VERIFIED";
  }, [showForm, pending, pendingExpired, failed, verified]);

  const badge = STATE_BADGE[visualState];

  async function handleSend() {
    if (sending) return;
    setNotice(null);
    setOtpError(null);
    const normalized = normalizeBdPhone(phoneInput);
    if (!normalized) {
      setPhoneError(errorText({ code: "INVALID_PHONE", error: "Enter a valid Bangladeshi mobile number, e.g. 01712-345678." }, ""));
      return;
    }
    if (verified && status?.phoneNumber === normalized) {
      setPhoneError(errorText({ code: "ALREADY_VERIFIED", error: "This number is already verified on your account." }, ""));
      return;
    }
    setPhoneError(null);
    setSending(true);
    try {
      const res = await fetch("/api/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        if (body?.code === "COOLDOWN" && body.retryAfter) {
          setResendAt(Date.now() + Number(body.retryAfter) * 1000);
          setNow(Date.now());
        }
        const msg = errorText(body, t("network"));
        if (body?.code === "INVALID_PHONE" || body?.code === "PHONE_IN_USE" || body?.code === "ALREADY_VERIFIED") {
          setPhoneError(msg);
        } else {
          setNotice({ tone: "error", text: msg });
        }
        return;
      }
      setFailed(false);
      setOtp("");
      setDevOtp(typeof body.devOtp === "string" ? body.devOtp : null);
      setStatus((prev) => ({
        ok: true,
        phoneNumber: prev?.phoneNumber ?? null,
        verified: prev?.verified ?? false,
        verifiedAt: prev?.verifiedAt ?? null,
        pending: { phoneNumber: body.phoneNumber, expiresAt: body.expiresAt, expired: false, attemptsRemaining: 5 },
        resendAvailableAt: body.resendAvailableAt,
      }));
      setResendAt(new Date(body.resendAvailableAt).getTime());
      setNow(Date.now());
      setNotice({ tone: "info", text: t("sent") });
      window.setTimeout(() => otpRef.current?.focus(), 50);
    } catch {
      setNotice({ tone: "error", text: t("network") });
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    if (verifying) return;
    setNotice(null);
    if (!new RegExp(`^\\d{${PHONE_OTP_LENGTH}}$`).test(otp)) {
      setOtpError(errorText({ code: "INVALID_OTP", error: "Enter the 6-digit code from the SMS." }, ""));
      return;
    }
    setOtpError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setFailed(true);
        const msg = errorText(body, t("network"));
        if (body?.code === "WRONG_CODE") {
          const left = Number(body.attemptsRemaining ?? 0);
          setOtpError(`${msg} ${left} ${t("attemptsLeft")}.`);
          setStatus((prev) => (prev?.pending ? { ...prev, pending: { ...prev.pending, attemptsRemaining: left } } : prev));
        } else if (body?.code === "TOO_MANY_ATTEMPTS") {
          setOtpError(msg);
          setStatus((prev) => (prev?.pending ? { ...prev, pending: { ...prev.pending, attemptsRemaining: 0 } } : prev));
        } else if (body?.code === "EXPIRED" || body?.code === "NO_PENDING") {
          setOtpError(msg);
          setStatus((prev) => (prev?.pending ? { ...prev, pending: { ...prev.pending, expiresAt: new Date(0).toISOString(), expired: true } } : prev));
        } else {
          setNotice({ tone: "error", text: msg });
        }
        return;
      }
      setFailed(false);
      setEditing(false);
      setOtp("");
      setDevOtp(null);
      applyStatus({
        ok: true,
        phoneNumber: body.phoneNumber,
        verified: true,
        verifiedAt: body.verifiedAt,
        pending: null,
        resendAvailableAt: null,
      });
      setPhoneInput(localDigits(body.phoneNumber));
      setNotice({ tone: "success", text: t("success") });
    } catch {
      setNotice({ tone: "error", text: t("network") });
    } finally {
      setVerifying(false);
    }
  }

  function startChange() {
    setEditing(true);
    setNotice(null);
    setPhoneError(null);
    setOtpError(null);
    setFailed(false);
    setPhoneInput("");
  }

  function cancelChange() {
    setEditing(false);
    setPhoneError(null);
    setOtpError(null);
    setNotice(null);
    setFailed(false);
    setDevOtp(null);
  }

  function handleUseDifferentNumber() {
    setStatus((prev) => (prev ? { ...prev, pending: null } : prev));
    setOtp("");
    setOtpError(null);
    setFailed(false);
    setDevOtp(null);
    setNotice(null);
  }

  const verifiedDate =
    status?.verifiedAt &&
    new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-BD", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(status.verifiedAt)
    );

  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand" aria-hidden="true" />
            {t("title")}
          </span>
        }
        subtitle={t("subtitle")}
        action={
          status ? (
            <Badge variant={badge.variant} icon={badge.icon}>
              {lang === "en" ? badge.en : badge.bn}
            </Badge>
          ) : null
        }
      />

      <div className="mt-5 space-y-4" aria-live="polite">
        {!status && !loadError && (
          <div className="space-y-3" aria-busy="true">
            <div className="h-10 rounded-lg bg-subtle animate-pulse" />
            <div className="h-10 w-40 rounded-lg bg-subtle animate-pulse" />
          </div>
        )}

        {loadError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-border bg-danger-soft px-4 py-3">
            <p className="text-[13px] text-danger-strong">{t("loadFailed")}</p>
            <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => void loadStatus()}>
              {t("retry")}
            </Button>
          </div>
        )}

        {status && verified && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-canvas/60 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink mk-tabular">
                  {formatBdPhone(status.phoneNumber)}
                  <Badge variant="verified" icon={<CheckCircle2 className="w-3 h-3" />}>
                    {lang === "en" ? "Verified" : "যাচাইকৃত"}
                  </Badge>
                </p>
                {verifiedDate && (
                  <p className="text-[12px] text-ink-3 mt-0.5">
                    {t("verifiedOn")} {verifiedDate}
                  </p>
                )}
              </div>
            </div>
            {!editing && (
              <Button size="sm" variant="outline" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={startChange}>
                {t("changeNumber")}
              </Button>
            )}
          </div>
        )}

        {status && showForm && !showOtpStep && (
          <div className="space-y-3">
            {editing && <p className="text-[12px] text-ink-3">{t("keepNote")}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr_auto] gap-3 sm:items-start">
              <Select id={`${id}-country`} label={t("country")} defaultValue="BD" aria-describedby={`${id}-phone-hint`}>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.dial}
                  </option>
                ))}
              </Select>
              <Input
                id={`${id}-phone`}
                label={t("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="01712-345678"
                value={phoneInput}
                maxLength={20}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setPhoneError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                error={phoneError ?? undefined}
                hint={t("phoneHint")}
                aria-invalid={phoneError ? true : undefined}
                leftIcon={<Phone className="w-4 h-4" />}
              />
              <div className="sm:pt-[22px] flex gap-2">
                <Button
                  onClick={() => void handleSend()}
                  loading={sending}
                  disabled={resendSeconds > 0}
                  className="w-full sm:w-auto"
                  leftIcon={<MessageSquareText className="w-4 h-4" />}
                >
                  {resendSeconds > 0 ? `${t("resendIn")} ${formatClock(resendSeconds)}` : t("sendOtp")}
                </Button>
                {editing && (
                  <Button variant="ghost" onClick={cancelChange} disabled={sending}>
                    {t("cancel")}
                  </Button>
                )}
              </div>
            </div>
            {pendingExpired && (
              <p className="text-[12px] text-ink-3 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {errorText({ code: "EXPIRED", error: "This code has expired. Request a new one." }, "")}
              </p>
            )}
          </div>
        )}

        {status && showOtpStep && pending && (
          <form onSubmit={handleVerify} className="space-y-3" noValidate>
            <p className="text-[13px] text-ink-2">
              {t("otpSentTo")} <span className="font-semibold text-ink mk-tabular">{formatBdPhone(pending.phoneNumber)}</span>
              {pendingActive && (
                <span className="text-ink-3">
                  {" · "}
                  {t("expiresIn")} <span className="mk-tabular">{formatClock(expiresSeconds)}</span>
                </span>
              )}
            </p>

            {devOtp && (
              <p className="text-[12px] rounded-md border border-accent-border bg-accent-soft text-accent-strong px-3 py-2">
                {t("devOtp")} <span className="font-mono font-semibold tracking-widest">{devOtp}</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[220px_auto] gap-3 sm:items-start">
              <Input
                ref={otpRef}
                id={`${id}-otp`}
                label={t("otp")}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={PHONE_OTP_LENGTH}
                placeholder="••••••"
                value={otp}
                disabled={!pendingActive}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, PHONE_OTP_LENGTH));
                  setOtpError(null);
                }}
                error={otpError ?? undefined}
                aria-invalid={otpError ? true : undefined}
                className="font-mono text-base tracking-[0.5em] text-center"
              />
              <div className="sm:pt-[22px]">
                <Button
                  type="submit"
                  loading={verifying}
                  disabled={!pendingActive || otp.length !== PHONE_OTP_LENGTH}
                  className="w-full sm:w-auto"
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  {t("verify")}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={resendSeconds > 0 || sending}
                className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-brand-hover disabled:text-ink-4 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} aria-hidden="true" />
                {resendSeconds > 0 ? `${t("resendIn")} ${formatClock(resendSeconds)}` : t("resend")}
              </button>
              <button
                type="button"
                onClick={handleUseDifferentNumber}
                className="font-medium text-ink-3 hover:text-ink cursor-pointer"
              >
                {t("useDifferent")}
              </button>
              {editing && (
                <button type="button" onClick={cancelChange} className="font-medium text-ink-3 hover:text-ink cursor-pointer">
                  {t("cancel")}
                </button>
              )}
            </div>
          </form>
        )}

        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={`text-[13px] rounded-md px-3 py-2 border ${
              notice.tone === "success"
                ? "bg-success-soft border-success-border text-success"
                : notice.tone === "error"
                  ? "bg-danger-soft border-danger-border text-danger-strong"
                  : "bg-brand-soft border-brand-border text-brand-strong"
            }`}
          >
            {notice.text}
          </p>
        )}
      </div>
    </Card>
  );
}
