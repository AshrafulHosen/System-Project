"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, ImageOff, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Button, Modal, Textarea } from "@/components/ui";
import VerificationBadge from "@/components/verification/VerificationBadge";
import { NID_REASON_MAX, NID_REASON_MIN, type NidDocumentsResponse } from "@/lib/nid/shared";

const PRESET_REASONS = [
  "The image is blurry or unreadable. Please upload a clearer photo of the card.",
  "Part of the card is cut off. Please make sure all four corners are visible.",
  "The front and back images do not belong to the same card.",
  "The name on the NID does not match the name on your Muktokormo account.",
  "The uploaded image is not a Bangladesh National ID card.",
];

type Mode = "view" | "confirm-approve" | "reject";

interface Props {
  verificationId: string | null;
  onClose: () => void;
  onReviewed: () => void;
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso)
  );
}

function DocImage({ label, src, onExpired }: { label: string; src: string | null; onExpired: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="space-y-1.5">
      <figcaption className="flex items-center justify-between text-[12px] font-medium text-ink-2">
        {label}
        {src && !failed && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand hover:text-brand-hover"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" /> Full size
          </a>
        )}
      </figcaption>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, must not be cached/optimised
        <img
          src={src}
          alt={`${label} of the submitted NID`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full aspect-[1.58] object-contain rounded-lg border border-line bg-subtle"
        />
      ) : (
        <div className="w-full aspect-[1.58] rounded-lg border border-dashed border-line-strong bg-canvas flex flex-col items-center justify-center gap-2 text-center p-4">
          <ImageOff className="w-5 h-5 text-ink-4" aria-hidden="true" />
          <p className="text-[12px] text-ink-3">{failed ? "Link expired or image unavailable." : "Document not available."}</p>
          {failed && (
            <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onExpired}>
              Reload
            </Button>
          )}
        </div>
      )}
    </figure>
  );
}

/** Admin review: account info, NID images via short-lived signed URLs, history, approve / reject. */
export default function NIDReviewModal({ verificationId, onClose, onReviewed }: Props) {
  const [data, setData] = useState<NidDocumentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const load = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/nid/admin/documents/${id}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Failed to load the submission.");
        return;
      }
      setData(json as NidDocumentsResponse);
    } catch {
      setError("Network error while loading the submission.");
    }
  }, []);

  useEffect(() => {
    if (!verificationId) return;
    void Promise.resolve().then(() => load(verificationId));
  }, [verificationId, load, loadKey]);

  const close = () => {
    setData(null);
    setError(null);
    setMode("view");
    setReason("");
    setReasonError(null);
    onClose();
  };

  async function decide(decision: "approved" | "rejected") {
    if (!verificationId || busy) return;
    const trimmed = reason.trim();
    if (decision === "rejected" && (trimmed.length < NID_REASON_MIN || trimmed.length > NID_REASON_MAX)) {
      setReasonError(`Write a reason of ${NID_REASON_MIN}–${NID_REASON_MAX} characters. The user will see it.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/nid/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId, decision, rejectionReason: decision === "rejected" ? trimmed : undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error || "The review could not be saved.");
        if (json?.code === "ALREADY_REVIEWED") {
          setMode("view");
          setLoadKey((k) => k + 1);
          onReviewed();
        }
        return;
      }
      onReviewed();
      close();
    } catch {
      setError("Network error. The review was not saved.");
    } finally {
      setBusy(false);
    }
  }

  const s = data?.submission;
  const isPending = s?.status === "pending";

  return (
    <Modal
      isOpen={Boolean(verificationId)}
      onClose={close}
      title="Review identity documents"
      subtitle="Manual visual check of the uploaded NID. This is not an Election Commission database verification."
      maxWidthClass="max-w-3xl"
    >
      {!data && !error && (
        <div className="space-y-4" aria-busy="true">
          <div className="h-16 rounded-lg bg-subtle animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="aspect-[1.58] rounded-lg bg-subtle animate-pulse" />
            <div className="aspect-[1.58] rounded-lg bg-subtle animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 text-[13px] rounded-md px-3 py-2 border bg-danger-soft border-danger-border text-danger-strong">
          {error}
        </p>
      )}

      {s && data && (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 rounded-lg border border-line bg-canvas/60 p-4 text-[13px]">
            <div className="min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-ink-4">Name</dt>
              <dd className="font-semibold text-ink truncate">{s.name}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] uppercase tracking-wide text-ink-4">Email</dt>
              <dd className="text-ink-2 truncate">{s.email}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-4">Role</dt>
              <dd className="text-ink-2 capitalize">{s.role}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-4">Submitted</dt>
              <dd className="text-ink-2">{fmt(s.submittedAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-4">Account created</dt>
              <dd className="text-ink-2">{fmt(s.accountCreatedAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-4">Status</dt>
              <dd className="flex flex-wrap items-center gap-1.5">
                <VerificationBadge status={s.status} />
                {s.phoneVerified && (
                  <span className="text-[11px] text-success inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Phone verified
                  </span>
                )}
              </dd>
            </div>
            {s.reviewedAt && (
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-[11px] uppercase tracking-wide text-ink-4">Reviewed</dt>
                <dd className="text-ink-2">
                  {fmt(s.reviewedAt)}
                  {s.rejectionReason && <span className="block text-ink-3 mt-0.5">Reason: {s.rejectionReason}</span>}
                </dd>
              </div>
            )}
          </dl>

          {s.documentsDeleted ? (
            <p className="text-[13px] text-ink-3 rounded-lg border border-line bg-canvas px-4 py-3">
              The images for this submission were deleted under the retention policy. The review record is kept.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocImage label="Front side" src={data.documents.front} onExpired={() => setLoadKey((k) => k + 1)} />
              <DocImage label="Back side" src={data.documents.back} onExpired={() => setLoadKey((k) => k + 1)} />
            </div>
          )}
          {!s.documentsDeleted && (
            <p className="text-[11px] text-ink-4 -mt-3">
              Image links expire after {Math.round(data.documents.expiresInSeconds / 60)} minutes. Every view is recorded in the audit log.
            </p>
          )}

          {data.history.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-ink mb-2">Previous submissions</h4>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {data.history.map((h) => (
                  <li key={h.id} className="px-4 py-2.5 text-[12px] flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-ink-2">
                        Submitted {fmt(h.submittedAt)}
                        {h.reviewedAt && ` · reviewed ${fmt(h.reviewedAt)}${h.reviewedByName ? ` by ${h.reviewedByName}` : ""}`}
                      </p>
                      {h.rejectionReason && <p className="text-ink-3 mt-0.5 break-words">Reason: {h.rejectionReason}</p>}
                    </div>
                    <VerificationBadge status={h.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isPending && mode === "view" && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <Button variant="outline" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => setMode("reject")}>
                Reject
              </Button>
              <Button leftIcon={<ShieldCheck className="w-4 h-4" />} onClick={() => setMode("confirm-approve")} disabled={s.documentsDeleted}>
                Approve
              </Button>
            </div>
          )}

          {isPending && mode === "confirm-approve" && (
            <div className="rounded-lg border border-success-border bg-success-soft p-4 space-y-3">
              <p className="text-[13px] text-ink">
                Approve <strong>{s.name}</strong>? Their profile will show an <strong>Identity Verified</strong> badge, and they will be notified.
                Only approve if both images clearly show a genuine Bangladesh NID matching this account.
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button variant="ghost" onClick={() => setMode("view")} disabled={busy}>
                  Cancel
                </Button>
                <Button loading={busy} leftIcon={<ShieldCheck className="w-4 h-4" />} onClick={() => void decide("approved")}>
                  Confirm approval
                </Button>
              </div>
            </div>
          )}

          {isPending && mode === "reject" && (
            <div className="rounded-lg border border-danger-border bg-danger-soft/50 p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setReasonError(null);
                    }}
                    className="text-left text-[11px] px-2 py-1 rounded-md border border-line bg-white hover:bg-subtle text-ink-2 cursor-pointer"
                  >
                    {r.split(".")[0]}
                  </button>
                ))}
              </div>
              <Textarea
                id="nid-reject-reason"
                label="Rejection reason (shown to the user)"
                rows={3}
                maxLength={NID_REASON_MAX}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setReasonError(null);
                }}
                error={reasonError ?? undefined}
                hint={`${reason.trim().length}/${NID_REASON_MAX} · minimum ${NID_REASON_MIN} characters`}
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button variant="ghost" onClick={() => setMode("view")} disabled={busy}>
                  Cancel
                </Button>
                <Button variant="danger" loading={busy} leftIcon={<XCircle className="w-4 h-4" />} onClick={() => void decide("rejected")}>
                  Confirm rejection
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
