"use client";

import React, { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Loader2,
  Receipt,
} from "lucide-react";
import { formatBdt } from "@/lib/format";
import { calculateContractFeeBreakdown } from "@/lib/payments/constants";
import { getPaymentStatusMeta } from "@/lib/payments/escrow";
import type { WorkspaceContract } from "@/types";
import type { PaymentRecord } from "@/types/payment";

interface ContractPaymentSectionProps {
  contract: WorkspaceContract;
  latestPayment?: PaymentRecord | null;
  viewerRole: "client" | "freelancer" | "admin";
  lang?: "en" | "bn";
  onPaymentVerified?: () => Promise<void> | void;
}

const BADGE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ContractPaymentSection({
  contract,
  latestPayment,
  viewerRole,
  lang = "en",
  onPaymentVerified,
}: ContractPaymentSectionProps) {
  const [initiating, setInitiating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const feePct = contract.platformFeePct || 10;
  const breakdown = calculateContractFeeBreakdown(contract.totalBdt, feePct);
  const paymentStatus =
    latestPayment?.status === "REFUND_REQUESTED"
      ? "REFUND_REQUESTED"
      : String(contract.paymentStatus ?? latestPayment?.status ?? "UNPAID").toUpperCase();
  const statusMeta = getPaymentStatusMeta(paymentStatus);

  const isClient = viewerRole === "client";
  const canInitiatePayment =
    isClient &&
    contract.stage === "ACTIVE" &&
    ["UNPAID", "FAILED", "CANCELLED"].includes(paymentStatus);
  const isPending = paymentStatus === "PENDING";
  const isFunded = paymentStatus === "FUNDED";
  const isRefundRequested = paymentStatus === "REFUND_REQUESTED";
  const isReleased = paymentStatus === "RELEASED";
  const isRefunded = paymentStatus === "REFUNDED";

  const handleFundContract = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setInitiating(true);
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: contract.id }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        gatewayPageUrl?: string;
      };

      if (!response.ok || !data.ok || !data.gatewayPageUrl) {
        setErrorMsg(
          data.error ||
            "Unable to initialize SSLCOMMERZ Sandbox checkout session."
        );
        return;
      }

      setInfoMsg(
        lang === "en"
          ? "Redirecting to SSLCOMMERZ Sandbox payment gateway..."
          : "SSLCOMMERZ স্যান্ডবক্স গেটওয়েতে রিডাইরেক্ট করা হচ্ছে..."
      );
      window.location.assign(data.gatewayPageUrl);
    } catch {
      setErrorMsg(
        "Network error while contacting payment initiation endpoint."
      );
    } finally {
      setInitiating(false);
    }
  };

  const handleVerifyPending = async () => {
    const tranId = latestPayment?.transaction_id;
    if (!tranId) {
      setErrorMsg("No pending transaction ID found to verify.");
      return;
    }

    setErrorMsg(null);
    setInfoMsg(null);
    setValidating(true);
    try {
      const response = await fetch("/api/payments/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: tranId }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        verified?: boolean;
        paymentStatus?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setErrorMsg(
          data.error ||
            "Transaction is not verified as successful at SSLCOMMERZ Sandbox yet."
        );
      } else {
        setInfoMsg(
          lang === "en"
            ? `Verified with SSLCOMMERZ Sandbox (Status: ${data.paymentStatus ?? "FUNDED"}).`
            : `SSLCOMMERZ স্যান্ডবক্স দ্বারা যাচাই সম্পন্ন (${data.paymentStatus ?? "FUNDED"})।`
        );
      }
      if (onPaymentVerified) {
        await onPaymentVerified();
      }
    } catch {
      setErrorMsg("Network error validating transaction with SSLCOMMERZ.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {lang === "en"
                  ? "Contract Payment & SSLCOMMERZ Sandbox"
                  : "কন্ট্রাক্ট পেমেন্ট ও SSLCOMMERZ স্যান্ডবক্স"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                SANDBOX
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {contract.title} · Freelancer: {contract.freelancer.name}
            </p>
          </div>
        </div>

        <span
          className={`self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-black border ${
            BADGE_CLASSES[statusMeta.tone] ?? BADGE_CLASSES.slate
          }`}
        >
          {lang === "en" ? statusMeta.label : statusMeta.labelBn}
        </span>
      </div>

      {/* Pricing & Commission Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            {lang === "en" ? "Total Contract Amount" : "মোট চুক্তির পরিমাণ"}
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {formatBdt(breakdown.grossAmount)}
          </span>
          <span className="text-[11px] text-slate-400">Currency: BDT</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            {lang === "en"
              ? `Platform Commission (${breakdown.platformFeePct}%)`
              : `প্ল্যাটফর্ম কমিশন (${breakdown.platformFeePct}%)`}
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {formatBdt(breakdown.platformFeeAmount)}
          </span>
          <span className="text-[11px] text-slate-400">
            {lang === "en" ? "Deducted on ledger release" : "রিলিজের সময় কর্তনযোগ্য"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            {lang === "en" ? "Freelancer Payable Amount" : "ফ্রিল্যান্সারের প্রাপ্য"}
          </span>
          <span className="text-xl font-black text-emerald-800 mt-1 block">
            {formatBdt(breakdown.freelancerPayableAmount)}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            {contract.freelancer.name}
          </span>
        </div>
      </div>

      {/* Latest Transaction Metadata */}
      {latestPayment && (
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-800">
                Transaction ID:
              </span>
              <span className="font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {latestPayment.transaction_id}
              </span>
              {latestPayment.card_type && (
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {latestPayment.card_type}
                </span>
              )}
            </div>
            {latestPayment.failure_reason && (
              <p className="text-rose-600 font-medium">
                {latestPayment.failure_reason}
              </p>
            )}
          </div>
          {latestPayment.validation_id && (
            <span className="font-mono text-[11px] text-slate-500">
              val_id: {latestPayment.validation_id}
            </span>
          )}
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {infoMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Role-Specific Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-start gap-2 text-xs text-slate-500 max-w-xl">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {isFunded
              ? lang === "en"
                ? "Payment is verified and recorded as Funded in the simulated escrow ledger. Freelancer may now begin and submit work."
                : "পেমেন্ট যাচাইকৃত ও সিমুলেটেড এসক্রো লেজারে যুক্ত হয়েছে। ফ্রিল্যান্সার এখন কাজ শুরু ও জমা দিতে পারবেন।"
              : isRefundRequested
                ? lang === "en"
                  ? "A refund request is currently open for this funded payment and awaiting Admin review."
                  : "এই ফান্ডেড পেমেন্টের জন্য একটি রিফান্ড অনুরোধ অ্যাডমিন পর্যালোচনার অপেক্ষায় আছে।"
              : isReleased
                ? lang === "en"
                  ? "Client approved the work and recorded an internal escrow release on the database ledger."
                  : "ক্লায়েন্ট কাজ অনুমোদন করে অভ্যন্তরীণ লেজার রিলিজ সম্পন্ন করেছেন।"
                : isRefunded
                  ? lang === "en"
                    ? "This contract payment was marked refunded on the escrow ledger."
                    : "এই কন্ট্রাক্টের পেমেন্ট রিফান্ড হিসেবে চিহ্নিত হয়েছে।"
                  : lang === "en"
                    ? "Checkout amount is computed strictly on the server from the Supabase contract before opening SSLCOMMERZ Sandbox."
                    : "SSLCOMMERZ স্যান্ডবক্স চালুর আগে সার্ভার থেকে চুক্তির পরিমাণ যাচাই করা হয়।"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canInitiatePayment && (
            <button
              type="button"
              disabled={initiating}
              onClick={handleFundContract}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {initiating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              <span>
                {initiating
                  ? lang === "en"
                    ? "Connecting Sandbox..."
                    : "স্যান্ডবক্স চালু হচ্ছে..."
                  : paymentStatus === "FAILED" || paymentStatus === "CANCELLED"
                    ? lang === "en"
                      ? `Retry Fund Contract (${formatBdt(breakdown.grossAmount)})`
                      : `পুনরায় ফান্ড করুন (${formatBdt(breakdown.grossAmount)})`
                    : lang === "en"
                      ? `Fund Contract (${formatBdt(breakdown.grossAmount)})`
                      : `কন্ট্রাক্ট ফান্ড করুন (${formatBdt(breakdown.grossAmount)})`}
              </span>
            </button>
          )}

          {isPending && (
            <>
              <button
                type="button"
                disabled={validating}
                onClick={handleVerifyPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${validating ? "animate-spin" : ""}`}
                />
                <span>
                  {lang === "en" ? "Verify Payment Status" : "পেমেন্ট যাচাই করুন"}
                </span>
              </button>

              {isClient && (
                <button
                  type="button"
                  disabled={initiating}
                  onClick={handleFundContract}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                >
                  <span>{lang === "en" ? "Start New Session" : "নতুন সেশন"}</span>
                </button>
              )}
            </>
          )}

          {!isClient && paymentStatus === "UNPAID" && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {lang === "en"
                ? "Awaiting Client Funding"
                : "ক্লায়েন্টের পেমেন্টের অপেক্ষায়"}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

