"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Receipt,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  RotateCcw,
  Info,
  CreditCard,
} from "lucide-react";
import { formatBdt } from "@/lib/format";
import {
  ESCROW_SIMULATION_DISCLAIMER,
  ESCROW_SIMULATION_DISCLAIMER_BN,
  getPaymentStatusMeta,
} from "@/lib/payments/escrow";
import type { PaymentDashboardItem } from "@/types/payment";

interface PaymentDetailModalProps {
  payment: PaymentDashboardItem | null;
  viewerRole: "client" | "freelancer" | "admin";
  lang?: "en" | "bn";
  onClose: () => void;
  onRetryPayment?: (contractId: string) => void;
  onVerifyPending?: (transactionId: string) => void;
  actionLoading?: boolean;
}

const TONE_CLASSES: Record<string, string> = {
  emerald: "bg-brand-soft text-navy border-brand/25",
  sky: "bg-brand-soft text-brand-strong border-brand-strong/20",
  amber: "bg-accent-soft text-accent border-accent/25",
  rose: "bg-danger-soft text-danger border-danger/20",
  indigo: "bg-plum-soft text-plum border-plum/20",
  slate: "bg-subtle text-ink-2 border-line",
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function PaymentDetailModal({
  payment,
  viewerRole,
  lang = "en",
  onClose,
  onRetryPayment,
  onVerifyPending,
  actionLoading = false,
}: PaymentDetailModalProps) {
  if (!payment) return null;

  const statusMeta = getPaymentStatusMeta(payment.status);
  const canClientRetry =
    viewerRole === "client" &&
    (payment.status === "FAILED" || payment.status === "CANCELLED") &&
    ["UNPAID", "FAILED", "CANCELLED"].includes(payment.contract_payment_status);
  const canVerify = viewerRole === "client" && payment.status === "PENDING";

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-detail-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-line-strong space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-soft border border-brand/25 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="payment-detail-title"
                  className="text-base font-semibold text-ink"
                >
                  {lang === "en"
                    ? "Payment & Escrow Details"
                    : "পেমেন্ট ও এসক্রো বিবরণী"}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    TONE_CLASSES[statusMeta.tone] ?? TONE_CLASSES.slate
                  }`}
                >
                  {lang === "en" ? statusMeta.label : statusMeta.labelBn}
                </span>
              </div>
              <p className="text-xs font-mono mk-tabular text-ink-3 mt-0.5">
                {payment.transaction_id} · {payment.contract_code}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment details"
            className="p-1.5 rounded-full text-ink-3 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fee Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-canvas border border-line">
            <span className="mk-eyebrow text-ink-3 block">
              {lang === "en" ? "Contract Amount" : "মোট পরিমাণ"}
            </span>
            <p className="text-lg font-semibold text-ink mt-1 font-mono mk-tabular">
              {formatBdt(payment.amount)}
            </p>
            <span className="text-[11px] text-ink-4 font-mono">{payment.currency}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-canvas border border-line">
            <span className="mk-eyebrow text-ink-3 block font-mono mk-tabular">
              {lang === "en"
                ? `Platform Commission (${payment.platform_fee_pct}%)`
                : `প্ল্যাটফর্ম কমিশন (${payment.platform_fee_pct}%)`}
            </span>
            <p className="text-lg font-semibold text-ink mt-1 font-mono mk-tabular">
              {formatBdt(payment.platform_fee)}
            </p>
            <span className="text-[11px] text-ink-4">
              {payment.status === "RELEASED"
                ? lang === "en"
                  ? "Recorded on release"
                  : "রিলিজ লেজারে রেকর্ডকৃত"
                : lang === "en"
                  ? "Assessed upon release"
                  : "রিলিজের সময় প্রযোজ্য"}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-brand-soft border border-brand/25">
            <span className="mk-eyebrow text-navy block">
              {lang === "en" ? "Freelancer Payable" : "ফ্রিল্যান্সার প্রাপ্য"}
            </span>
            <p className="text-lg font-semibold text-navy mt-1 font-mono mk-tabular">
              {formatBdt(payment.freelancer_amount)}
            </p>
            <span className="text-[11px] text-brand font-medium truncate block">
              {payment.freelancer_name}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="rounded-lg border border-line bg-canvas p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="mk-eyebrow text-ink-4 block">
              {lang === "en" ? "Contract" : "চুক্তি"}
            </span>
            <Link
              href={`/contracts/${payment.contract_id}`}
              onClick={onClose}
              className="font-semibold text-ink hover:text-brand hover:underline inline-flex items-center gap-1 mt-0.5"
            >
              <span>{payment.contract_title}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </Link>
          </div>

          <div>
            <span className="mk-eyebrow text-ink-4 block">
              {lang === "en" ? "Parties" : "পক্ষসমূহ"}
            </span>
            <p className="font-semibold text-ink mt-0.5">
              {payment.client_name} → {payment.freelancer_name}
            </p>
          </div>

          <div>
            <span className="mk-eyebrow text-ink-4 block">
              {lang === "en" ? "Gateway & Method" : "গেটওয়ে ও মাধ্যম"}
            </span>
            <p className="font-semibold text-ink mt-0.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-ink-3" />
              <span>
                {payment.gateway} (Sandbox)
                {payment.card_type ? ` · ${payment.card_type}` : ""}
                {payment.card_brand ? ` · ${payment.card_brand}` : ""}
              </span>
            </p>
          </div>

          <div>
            <span className="mk-eyebrow text-ink-4 block">
              {lang === "en" ? "Validation Reference" : "ভ্যালিডেশন আইডি"}
            </span>
            <p className="font-mono mk-tabular text-[11px] font-semibold text-ink-2 mt-0.5 break-all">
              {payment.validation_id ? `val_id: ${payment.validation_id}` : "—"}
              {payment.bank_tran_id ? ` · bank: ${payment.bank_tran_id}` : ""}
            </p>
          </div>

          <div>
            <span className="mk-eyebrow text-ink-4 block">
              {lang === "en" ? "Initiated At" : "শুরু"}
            </span>
            <p className="text-ink-2 font-medium font-mono mk-tabular mt-0.5">
              {formatDateTime(payment.created_at)}
            </p>
          </div>

          <div>
            <span className="mk-eyebrow text-ink-4 block">
              {payment.released_at
                ? lang === "en"
                  ? "Released At"
                  : "রিলিজের সময়"
                : payment.refunded_at
                  ? lang === "en"
                    ? "Refunded At"
                    : "রিফান্ডের সময়"
                  : lang === "en"
                    ? "Funded At"
                    : "ফান্ডিংয়ের সময়"}
            </span>
            <p className="text-ink-2 font-medium font-mono mk-tabular mt-0.5">
              {formatDateTime(
                payment.released_at || payment.refunded_at || payment.funded_at
              )}
            </p>
          </div>
        </div>

        {/* Failure / Cancellation Reason */}
        {payment.failure_reason && (
          <div className="p-3.5 rounded-lg bg-danger-soft border border-danger/25 text-xs text-danger flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {lang === "en" ? "Gateway Failure / Note" : "গেটওয়ে ত্রুটি / তথ্য"}
              </p>
              <p className="mt-0.5">{payment.failure_reason}</p>
            </div>
          </div>
        )}

        {/* Refund Information */}
        {payment.refund_request && (
          <div className="p-4 rounded-lg bg-plum-soft border border-plum/25 text-xs text-plum-strong space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold">
                <RotateCcw className="w-4 h-4 text-plum" />
                <span>
                  {lang === "en"
                    ? "Refund Request Information"
                    : "রিফান্ড অনুরোধের তথ্য"}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-white border border-plum/25 text-plum font-mono">
                {payment.refund_request.status} ·{" "}
                {payment.refund_request.refund_mode}
              </span>
            </div>
            <p>
              <span className="font-semibold">
                {lang === "en" ? "Reason: " : "কারণ: "}
              </span>
              {payment.refund_request.reason}
            </p>
            {payment.refund_request.admin_notes && (
              <p>
                <span className="font-semibold">
                  {lang === "en" ? "Admin Notes: " : "অ্যাডমিন নোট: "}
                </span>
                {payment.refund_request.admin_notes}
              </p>
            )}
            {payment.refund_request.gateway_refund_ref_id && (
              <p className="font-mono mk-tabular text-[11px] text-plum">
                Refund Ref: {payment.refund_request.gateway_refund_ref_id} (
                {payment.refund_request.gateway_status ?? "RECORDED"})
              </p>
            )}
          </div>
        )}

        {/* Gateway Telemetry Logs (Only visible to owning client or admin) */}
        {viewerRole !== "freelancer" &&
          payment.recent_transactions &&
          payment.recent_transactions.length > 0 && (
            <div className="space-y-2">
              <h4 className="mk-eyebrow text-ink-3 font-mono mk-tabular">
                {lang === "en"
                  ? `Gateway Callback Audit Log (${payment.recent_transactions.length})`
                  : `গেটওয়ে কলব্যাক লগ (${payment.recent_transactions.length})`}
              </h4>
              <div className="border border-line rounded-lg divide-y divide-line max-h-44 overflow-y-auto">
                {payment.recent_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {tx.gateway_status === "VALID" ||
                      tx.gateway_status === "VALIDATED" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-ink-4 shrink-0" />
                      )}
                      <span className="font-mono mk-tabular text-[11px] font-semibold text-ink truncate">
                        {tx.event_type}
                      </span>
                      <span className="text-[11px] text-ink-3 truncate">
                        ({tx.gateway_status})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono mk-tabular text-ink-4 shrink-0">
                      {formatDateTime(tx.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Academic Sandbox Disclosure */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accent-soft border border-accent/25 text-[11px] text-accent-strong">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {lang === "en"
              ? ESCROW_SIMULATION_DISCLAIMER
              : ESCROW_SIMULATION_DISCLAIMER_BN}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-line">
          <Link
            href={`/contracts/${payment.contract_id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-subtle hover:bg-muted text-ink text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            <span>
              {lang === "en" ? "Open Contract" : "চুক্তি দেখুন"}
            </span>
          </Link>

          {canVerify && onVerifyPending && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onVerifyPending(payment.transaction_id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-strong hover:bg-brand-strong text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`}
              />
              <span>
                {lang === "en" ? "Verify Status" : "স্ট্যাটাস যাচাই"}
              </span>
            </button>
          )}

          {canClientRetry && onRetryPayment && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onRetryPayment(payment.contract_id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {lang === "en" ? "Retry Payment" : "পুনরায় পেমেন্ট"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-ink hover:bg-ink-2 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {lang === "en" ? "Close" : "বন্ধ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

