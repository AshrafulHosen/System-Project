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
import { calculateContractFeeBreakdown, DEFAULT_PLATFORM_FEE_PCT } from "@/lib/payments/constants";
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
  emerald: "bg-brand-soft text-navy border-brand/25",
  sky: "bg-brand-soft text-brand-strong border-brand-strong/20",
  amber: "bg-accent-soft text-accent border-accent/25",
  rose: "bg-danger-soft text-danger border-danger/20",
  indigo: "bg-plum-soft text-plum border-plum/20",
  slate: "bg-subtle text-ink-2 border-line",
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

  const feePct = contract.platformFeePct || DEFAULT_PLATFORM_FEE_PCT;
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
    <section className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-soft border border-brand/25 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-brand" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-ink">
                {lang === "en"
                  ? "Contract Payment & SSLCOMMERZ Sandbox"
                  : "কন্ট্রাক্ট পেমেন্ট ও SSLCOMMERZ স্যান্ডবক্স"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full mk-eyebrow bg-accent-soft text-accent border border-accent/25 font-mono">
                SANDBOX
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5 line-clamp-1">
              {contract.title} · Freelancer: {contract.freelancer.name}
            </p>
          </div>
        </div>

        <span
          className={`self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
            BADGE_CLASSES[statusMeta.tone] ?? BADGE_CLASSES.slate
          }`}
        >
          {lang === "en" ? statusMeta.label : statusMeta.labelBn}
        </span>
      </div>

      {/* Pricing & Commission Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-canvas border border-line">
          <span className="mk-eyebrow text-ink-3 block">
            {lang === "en" ? "Total Contract Amount" : "মোট চুক্তির পরিমাণ"}
          </span>
          <span className="text-xl font-semibold text-ink mt-1 block font-mono mk-tabular">
            {formatBdt(breakdown.grossAmount)}
          </span>
          <span className="text-[11px] text-ink-3 font-mono">Currency: BDT</span>
        </div>

        <div className="p-4 rounded-lg bg-canvas border border-line">
          <span className="mk-eyebrow text-ink-3 block font-mono mk-tabular">
            {lang === "en"
              ? `Platform Commission (${breakdown.platformFeePct}%)`
              : `প্ল্যাটফর্ম কমিশন (${breakdown.platformFeePct}%)`}
          </span>
          <span className="text-xl font-semibold text-ink mt-1 block font-mono mk-tabular">
            {formatBdt(breakdown.platformFeeAmount)}
          </span>
          <span className="text-[11px] text-ink-3">
            {lang === "en" ? "Deducted on ledger release" : "রিলিজের সময় কর্তনযোগ্য"}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-brand-soft border border-brand/25">
          <span className="mk-eyebrow text-navy block">
            {lang === "en" ? "Freelancer Payable Amount" : "ফ্রিল্যান্সারের প্রাপ্য"}
          </span>
          <span className="text-xl font-semibold text-navy mt-1 block font-mono mk-tabular">
            {formatBdt(breakdown.freelancerPayableAmount)}
          </span>
          <span className="text-[11px] text-brand font-medium">
            {contract.freelancer.name}
          </span>
        </div>
      </div>

      {/* Latest Transaction Metadata */}
      {latestPayment && (
        <div className="p-4 rounded-lg bg-canvas border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-ink-3" />
              <span className="font-semibold text-ink">
                Transaction ID:
              </span>
              <span className="font-mono mk-tabular font-semibold text-ink-2 bg-white px-2 py-0.5 rounded-md border border-line-strong">
                {latestPayment.transaction_id}
              </span>
              {latestPayment.card_type && (
                <span className="text-[11px] font-semibold text-brand-strong bg-brand-soft px-2 py-0.5 rounded-md border border-brand-strong/20">
                  {latestPayment.card_type}
                </span>
              )}
            </div>
            {latestPayment.failure_reason && (
              <p className="text-danger font-medium">
                {latestPayment.failure_reason}
              </p>
            )}
          </div>
          {latestPayment.validation_id && (
            <span className="font-mono mk-tabular text-[11px] text-ink-3">
              val_id: {latestPayment.validation_id}
            </span>
          )}
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-danger-soft border border-danger/25 text-xs text-danger font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {infoMsg && (
        <div className="p-3.5 rounded-lg bg-brand-soft border border-brand/25 text-xs text-navy font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* Role-Specific Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-start gap-2 text-xs text-ink-3 max-w-xl">
          <Lock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 font-mono mk-tabular"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-strong hover:bg-brand-strong text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-line-strong hover:bg-canvas text-ink-2 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
                >
                  <span>{lang === "en" ? "Start New Session" : "নতুন সেশন"}</span>
                </button>
              )}
            </>
          )}

          {!isClient && paymentStatus === "UNPAID" && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-accent-soft border border-accent/25 text-accent text-xs font-semibold">
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

