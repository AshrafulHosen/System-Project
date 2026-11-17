"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, IdCard, Lock, RefreshCw, ShieldCheck, Upload, XCircle } from "lucide-react";
import { Button, Card, CardHeader } from "@/components/ui";
import NIDImageUpload from "@/components/verification/NIDImageUpload";
import VerificationBadge from "@/components/verification/VerificationBadge";
import type { NidSide, NidStatus, NidStatusResponse } from "@/lib/nid/shared";

type Lang = "en" | "bn";

export interface NidVerificationSummary {
  status: NidStatus;
}

interface Props {
  lang?: Lang;
  onStatusChange?: (summary: NidVerificationSummary) => void;
  id?: string;
}

const T = {
  title: { en: "Identity verification", bn: "পরিচয় যাচাই" },
  subtitle: {
    en: "Upload both sides of your Bangladesh NID. Our team reviews the documents manually to help keep Muktokormo safe for clients and freelancers.",
    bn: "আপনার জাতীয় পরিচয়পত্রের দুই পাশের ছবি আপলোড করুন। ক্লায়েন্ট ও ফ্রিল্যান্সারদের নিরাপত্তার জন্য আমাদের টিম নথিগুলো হাতে পর্যালোচনা করে।",
  },
  front: { en: "NID front side", bn: "এনআইডির সামনের দিক" },
  back: { en: "NID back side", bn: "এনআইডির পেছনের দিক" },
  frontHint: { en: "The side with your photo and name.", bn: "ছবি ও নামসহ দিক।" },
  backHint: { en: "The side with the address and barcode.", bn: "ঠিকানা ও বারকোডসহ দিক।" },
  tips: {
    en: "Use a clear, well-lit photo where all four corners and every word are readable. No screenshots or edited images.",
    bn: "চার কোণ ও সব লেখা স্পষ্ট দেখা যায় এমন উজ্জ্বল ছবি ব্যবহার করুন। স্ক্রিনশট বা সম্পাদিত ছবি নয়।",
  },
  privacyTitle: { en: "How we handle your documents", bn: "আপনার নথি আমরা যেভাবে সংরক্ষণ করি" },
  privacy: {
    en: "Images are stored in private, encrypted storage and are visible only to authorised Muktokormo administrators through links that expire within minutes. This is a manual visual review by our team, not an official check against the Election Commission database. Approved documents are deleted 90 days after approval and rejected ones 30 days after rejection (or as soon as you resubmit).",
    bn: "ছবিগুলো ব্যক্তিগত, এনক্রিপ্টেড স্টোরেজে রাখা হয় এবং কয়েক মিনিটে মেয়াদোত্তীর্ণ লিংকের মাধ্যমে শুধু অনুমোদিত অ্যাডমিন দেখতে পারেন। এটি আমাদের টিমের হাতে করা পর্যালোচনা, নির্বাচন কমিশনের ডাটাবেসের সঙ্গে সরকারি যাচাই নয়। অনুমোদিত নথি ৯০ দিন পর এবং প্রত্যাখ্যাত নথি ৩০ দিন পর (বা পুনরায় জমা দিলে সঙ্গে সঙ্গে) মুছে ফেলা হয়।",
  },
  consent: {
    en: "I confirm this is my own NID, and I consent to Muktokormo storing these images and having its administrators review them to verify my identity.",
    bn: "আমি নিশ্চিত করছি এটি আমার নিজের এনআইডি এবং আমার পরিচয় যাচাইয়ের জন্য Muktokormo-কে ছবিগুলো সংরক্ষণ ও অ্যাডমিনদের পর্যালোচনা করার সম্মতি দিচ্ছি।",
  },
  submit: { en: "Submit for verification", bn: "যাচাইয়ের জন্য জমা দিন" },
  resubmit: { en: "Resubmit documents", bn: "আবার জমা দিন" },
  uploading: { en: "Uploading…", bn: "আপলোড হচ্ছে…" },
  pendingTitle: { en: "Awaiting admin review", bn: "অ্যাডমিন পর্যালোচনার অপেক্ষায়" },
  pendingBody: {
    en: "Your documents were received. We'll notify you as soon as an administrator has reviewed them.",
    bn: "আপনার নথি গ্রহণ করা হয়েছে। অ্যাডমিন পর্যালোচনা করলেই আমরা আপনাকে জানাব।",
  },
  submittedOn: { en: "Submitted on", bn: "জমার তারিখ" },
  approvedTitle: { en: "Your identity is verified", bn: "আপনার পরিচয় যাচাই সম্পন্ন" },
  approvedBody: {
    en: "An Identity Verified badge now appears on your profile.",
    bn: "আপনার প্রোফাইলে এখন পরিচয় যাচাইকৃত ব্যাজ দেখা যাচ্ছে।",
  },
  verifiedOn: { en: "Verified on", bn: "যাচাইয়ের তারিখ" },
  rejectedTitle: { en: "Your submission was not approved", bn: "আপনার জমা অনুমোদিত হয়নি" },
  reason: { en: "Reason", bn: "কারণ" },
  rejectedHelp: {
    en: "Upload corrected images below and submit again.",
    bn: "নিচে সংশোধিত ছবি আপলোড করে আবার জমা দিন।",
  },
  needBoth: { en: "Add both the front and back images.", bn: "সামনে ও পেছনের দুটি ছবিই যোগ করুন।" },
  needConsent: { en: "Please confirm your consent.", bn: "অনুগ্রহ করে সম্মতি নিশ্চিত করুন।" },
  success: {
    en: "Documents submitted. You'll be notified when the review is complete.",
    bn: "নথি জমা হয়েছে। পর্যালোচনা শেষ হলে আপনাকে জানানো হবে।",
  },
  network: { en: "Network error. Check your connection and try again.", bn: "নেটওয়ার্ক সমস্যা। সংযোগ দেখে আবার চেষ্টা করুন।" },
  uploadFailed: { en: "Upload failed. Please try again.", bn: "আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" },
  loadFailed: { en: "Couldn't load verification status.", bn: "যাচাইয়ের অবস্থা লোড করা যায়নি।" },
  retry: { en: "Retry", bn: "আবার চেষ্টা" },
  notEligible: {
    en: "Identity verification is available for client and freelancer accounts.",
    bn: "পরিচয় যাচাই ক্লায়েন্ট ও ফ্রিল্যান্সার অ্যাকাউন্টের জন্য।",
  },
} as const;

const ERROR_BN: Record<string, string> = {
  INVALID_FILE: "শুধুমাত্র JPG, JPEG, PNG বা WebP ছবি গ্রহণযোগ্য।",
  FILE_TOO_LARGE: "প্রতিটি ছবি সর্বোচ্চ ৫ MB হতে পারবে।",
  PENDING_EXISTS: "আপনার একটি জমা ইতিমধ্যে পর্যালোচনাধীন।",
  ALREADY_VERIFIED: "আপনার পরিচয় ইতিমধ্যে যাচাইকৃত।",
  RATE_LIMITED: "অনেকবার চেষ্টা করা হয়েছে। পরে আবার চেষ্টা করুন।",
  UPLOAD_MISSING: "দুটি ছবিই আপলোড হয়নি। আবার চেষ্টা করুন।",
};

/** PUT a file to a one-time signed Storage upload URL, reporting progress. */
function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export default function NIDVerification({ lang = "en", onStatusChange, id = "verify-nid" }: Props) {
  const t = useCallback((k: keyof typeof T) => T[k][lang], [lang]);
  const [status, setStatus] = useState<NidStatusResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [files, setFiles] = useState<Record<NidSide, File | null>>({ front: null, back: null });
  const [fileErrors, setFileErrors] = useState<Record<NidSide, string | null>>({ front: null, back: null });
  const [progress, setProgress] = useState<Record<NidSide, number | null>>({ front: null, back: null });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const onChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const apply = useCallback((s: NidStatusResponse) => {
    setStatus(s);
    onChangeRef.current?.({ status: s.status });
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch("/api/nid/status", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      apply((await res.json()) as NidStatusResponse);
    } catch {
      setLoadError(true);
    }
  }, [apply]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const errText = (body: { code?: string; error?: string } | null, fallback: string) =>
    body?.code && lang === "bn" && ERROR_BN[body.code] ? ERROR_BN[body.code] : body?.error || fallback;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setNotice(null);
    if (!files.front || !files.back) {
      setNotice({ tone: "error", text: t("needBoth") });
      return;
    }
    if (!consent) {
      setNotice({ tone: "error", text: t("needConsent") });
      return;
    }
    setSubmitting(true);
    try {
      const mint = await fetch("/api/nid/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: (["front", "back"] as const).map((side) => ({
            side,
            contentType: files[side]!.type,
            size: files[side]!.size,
          })),
        }),
      });
      const minted = await mint.json().catch(() => null);
      if (!mint.ok || !minted?.ok) {
        setNotice({ tone: "error", text: errText(minted, t("uploadFailed")) });
        if (minted?.code === "PENDING_EXISTS" || minted?.code === "ALREADY_VERIFIED") void load();
        return;
      }

      for (const side of ["front", "back"] as const) {
        setProgress((p) => ({ ...p, [side]: 0 }));
        await uploadWithProgress(minted.uploads[side].signedUrl, files[side]!, (pct) =>
          setProgress((p) => ({ ...p, [side]: pct }))
        );
      }

      const res = await fetch("/api/nid/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: minted.submissionId,
          frontPath: minted.uploads.front.path,
          backPath: minted.uploads.back.path,
          consent: true,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setNotice({ tone: "error", text: errText(body, t("uploadFailed")) });
        return;
      }
      setFiles({ front: null, back: null });
      setConsent(false);
      setNotice({ tone: "success", text: t("success") });
      await load();
    } catch {
      setNotice({ tone: "error", text: t("network") });
    } finally {
      setSubmitting(false);
      setProgress({ front: null, back: null });
    }
  }

  const fmtDate = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-BD", { day: "numeric", month: "short", year: "numeric" }).format(
          new Date(iso)
        )
      : "";

  const showForm = Boolean(status?.canSubmit);
  const isResubmit = status?.status === "rejected";

  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <IdCard className="w-4 h-4 text-brand" aria-hidden="true" />
            {t("title")}
          </span>
        }
        subtitle={t("subtitle")}
        action={status ? <VerificationBadge status={status.status} lang={lang} /> : null}
      />

      <div className="mt-5 space-y-4" aria-live="polite">
        {!status && !loadError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-busy="true">
            <div className="aspect-[1.58] rounded-lg bg-subtle animate-pulse" />
            <div className="aspect-[1.58] rounded-lg bg-subtle animate-pulse" />
          </div>
        )}

        {loadError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-border bg-danger-soft px-4 py-3">
            <p className="text-[13px] text-danger-strong">{t("loadFailed")}</p>
            <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => void load()}>
              {t("retry")}
            </Button>
          </div>
        )}

        {status && !status.role && status.status === "not_verified" && (
          <p className="text-[13px] text-ink-3">{t("notEligible")}</p>
        )}

        {status?.status === "pending" && (
          <div className="flex items-start gap-3 rounded-lg border border-accent-border bg-accent-soft px-4 py-3">
            <Clock className="w-4.5 h-4.5 text-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">{t("pendingTitle")}</p>
              <p className="text-[13px] text-ink-2 mt-0.5">{t("pendingBody")}</p>
              <p className="text-[12px] text-ink-3 mt-1">
                {t("submittedOn")} {fmtDate(status.submittedAt)}
              </p>
            </div>
          </div>
        )}

        {status?.status === "approved" && (
          <div className="flex items-start gap-3 rounded-lg border border-success-border bg-success-soft px-4 py-3">
            <ShieldCheck className="w-4.5 h-4.5 text-success shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">{t("approvedTitle")}</p>
              <p className="text-[13px] text-ink-2 mt-0.5">{t("approvedBody")}</p>
              <p className="text-[12px] text-ink-3 mt-1">
                {t("verifiedOn")} {fmtDate(status.reviewedAt)}
              </p>
            </div>
          </div>
        )}

        {status?.status === "rejected" && (
          <div className="flex items-start gap-3 rounded-lg border border-danger-border bg-danger-soft px-4 py-3">
            <XCircle className="w-4.5 h-4.5 text-danger-strong shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{t("rejectedTitle")}</p>
              {status.rejectionReason && (
                <p className="text-[13px] text-ink-2 mt-0.5 break-words">
                  <span className="font-medium">{t("reason")}:</span> {status.rejectionReason}
                </p>
              )}
              <p className="text-[12px] text-ink-3 mt-1">{t("rejectedHelp")}</p>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["front", "back"] as const).map((side) => (
                <NIDImageUpload
                  key={side}
                  label={t(side)}
                  hint={t(side === "front" ? "frontHint" : "backHint")}
                  file={files[side]}
                  onChange={(f) => setFiles((prev) => ({ ...prev, [side]: f }))}
                  onError={(m) => setFileErrors((prev) => ({ ...prev, [side]: m }))}
                  error={fileErrors[side]}
                  progress={progress[side]}
                  disabled={submitting}
                  lang={lang}
                />
              ))}
            </div>

            <p className="text-[12px] text-ink-3">{t("tips")}</p>

            <div className="rounded-lg border border-line bg-canvas/60 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                <Lock className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
                {t("privacyTitle")}
              </p>
              <p className="text-[12px] text-ink-3 mt-1 leading-relaxed">{t("privacy")}</p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 w-4 h-4 rounded border-line-strong accent-[var(--color-brand,#2563eb)] cursor-pointer"
              />
              <span className="text-[13px] text-ink-2 leading-relaxed">{t("consent")}</span>
            </label>

            <Button
              type="submit"
              loading={submitting}
              disabled={!files.front || !files.back || !consent}
              leftIcon={<Upload className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {submitting ? t("uploading") : isResubmit ? t("resubmit") : t("submit")}
            </Button>
          </form>
        )}

        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={`text-[13px] rounded-md px-3 py-2 border ${
              notice.tone === "success"
                ? "bg-success-soft border-success-border text-success"
                : "bg-danger-soft border-danger-border text-danger-strong"
            }`}
          >
            {notice.text}
          </p>
        )}
      </div>
    </Card>
  );
}
