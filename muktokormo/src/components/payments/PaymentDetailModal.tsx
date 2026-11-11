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
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
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
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-detail-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="payment-detail-title"
                  className="text-base font-black text-slate-900"
                >
                  {lang === "en"
                    ? "Payment & Escrow Details"
                    : "পেমেন্ট ও এসক্রো বিবরণী"}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    TONE_CLASSES[statusMeta.tone] ?? TONE_CLASSES.slate
                  }`}
                >
                  {lang === "en" ? statusMeta.label : statusMeta.labelBn}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {payment.transaction_id} · {payment.contract_code}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment details"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fee Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              {lang === "en" ? "Contract Amount" : "মোট পরিমাণ"}
            </span>
            <p className="text-lg font-black text-slate-900 mt-1">
              {formatBdt(payment.amount)}
            </p>
            <span className="text-[11px] text-slate-400">{payment.currency}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              {lang === "en"
                ? `Platform Commission (${payment.platform_fee_pct}%)`
                : `প্ল্যাটফর্ম কমিশন (${payment.platform_fee_pct}%)`}
            </span>
            <p className="text-lg font-black text-slate-900 mt-1">
              {formatBdt(payment.platform_fee)}
            </p>
            <span className="text-[11px] text-slate-400">
              {payment.status === "RELEASED"
                ? lang === "en"
                  ? "Recorded on release"
                  : "রিলিজ লেজারে রেকর্ডকৃত"
                : lang === "en"
                  ? "Assessed upon release"
                  : "রিলিজের সময় প্রযোজ্য"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              {lang === "en" ? "Freelancer Payable" : "ফ্রিল্যান্সার প্রাপ্য"}
            </span>
            <p className="text-lg font-black text-emerald-800 mt-1">
              {formatBdt(payment.freelancer_amount)}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium truncate block">
              {payment.freelancer_name}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {lang === "en" ? "Contract" : "চুক্তি"}
            </span>
            <Link
              href={`/contracts/${payment.contract_id}`}
              onClick={onClose}
              className="font-bold text-slate-900 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5"
            >
              <span>{payment.contract_title}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </Link>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {lang === "en" ? "Parties" : "পক্ষসমূহ"}
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {payment.client_name} → {payment.freelancer_name}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {lang === "en" ? "Gateway & Method" : "গেটওয়ে ও মাধ্যম"}
            </span>
            <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {payment.gateway} (Sandbox)
                {payment.card_type ? ` · ${payment.card_type}` : ""}
                {payment.card_brand ? ` · ${payment.card_brand}` : ""}
              </span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {lang === "en" ? "Validation Reference" : "ভ্যালিডেশন আইডি"}
            </span>
            <p className="font-mono text-[11px] font-semibold text-slate-700 mt-0.5 break-all">
              {payment.validation_id ? `val_id: ${payment.validation_id}` : "—"}
              {payment.bank_tran_id ? ` · bank: ${payment.bank_tran_id}` : ""}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {lang === "en" ? "Initiated At" : "শুরু"}
            </span>
            <p className="text-slate-700 font-medium mt-0.5">
              {formatDateTime(payment.created_at)}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
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
            <p className="text-slate-700 font-medium mt-0.5">
              {formatDateTime(
                payment.released_at || payment.refunded_at || payment.funded_at
              )}
            </p>
          </div>
        </div>

        {/* Failure / Cancellation Reason */}
        {payment.failure_reason && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {lang === "en" ? "Gateway Failure / Note" : "গেটওয়ে ত্রুটি / তথ্য"}
              </p>
              <p className="mt-0.5">{payment.failure_reason}</p>
            </div>
          </div>
        )}

        {/* Refund Information */}
        {payment.refund_request && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>
                  {lang === "en"
                    ? "Refund Request Information"
                    : "রিফান্ড অনুরোধের তথ্য"}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white border border-indigo-200 text-indigo-800">
                {payment.refund_request.status} ·{" "}
                {payment.refund_request.refund_mode}
              </span>
            </div>
            <p className="text-indigo-900">
              <span className="font-semibold">
                {lang === "en" ? "Reason: " : "কারণ: "}
              </span>
              {payment.refund_request.reason}
            </p>
            {payment.refund_request.admin_notes && (
              <p className="text-indigo-800">
                <span className="font-semibold">
                  {lang === "en" ? "Admin Notes: " : "অ্যাডমিন নোট: "}
                </span>
                {payment.refund_request.admin_notes}
              </p>
            )}
            {payment.refund_request.gateway_refund_ref_id && (
              <p className="font-mono text-[11px] text-indigo-700">
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
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {lang === "en"
                  ? `Gateway Callback Audit Log (${payment.recent_transactions.length})`
                  : `গেটওয়ে কলব্যাক লগ (${payment.recent_transactions.length})`}
              </h4>
              <div className="border border-slate-200/80 rounded-2xl divide-y divide-slate-100 max-h-44 overflow-y-auto">
                {payment.recent_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {tx.gateway_status === "VALID" ||
                      tx.gateway_status === "VALIDATED" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-mono text-[11px] font-bold text-slate-800 truncate">
                        {tx.event_type}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        ({tx.gateway_status})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDateTime(tx.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Academic Sandbox Disclosure */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {lang === "en"
              ? ESCROW_SIMULATION_DISCLAIMER
              : ESCROW_SIMULATION_DISCLAIMER_BN}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Link
            href={`/contracts/${payment.contract_id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {lang === "en" ? "Open Contract" : "চুক্তি দেখুন"}
            </span>
          </Link>

          {canVerify && onVerifyPending && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onVerifyPending(payment.transaction_id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
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
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {lang === "en" ? "Close" : "বন্ধ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

