"use client";

import React from "react";
import Link from "next/link";
import {
  Eye,
  ExternalLink,
  RefreshCw,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { formatBdt } from "@/lib/format";
import { getPaymentStatusMeta } from "@/lib/payments/escrow";
import type { PaymentDashboardItem } from "@/types/payment";

interface PaymentHistoryTableProps {
  payments: PaymentDashboardItem[];
  viewerRole: "client" | "freelancer" | "admin";
  lang?: "en" | "bn";
  loading?: boolean;
  onViewDetails: (payment: PaymentDashboardItem) => void;
  onRetryPayment?: (contractId: string) => void;
  onVerifyPending?: (transactionId: string) => void;
  retryingContractId?: string | null;
  verifyingTranId?: string | null;
  emptyTitle?: string;
  emptySubtitle?: string;
}

const TONE_CLASSES: Record<string, string> = {
  emerald: "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25",
  sky: "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20",
  amber: "bg-[#FEF6E6] text-[#A87224] border-[#A87224]/25",
  rose: "bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20",
  indigo: "bg-[#F3EFFA] text-[#5B3E96] border-[#5B3E96]/20",
  slate: "bg-[#F4F2EC] text-[#3E434A] border-[rgba(17,19,21,0.09)]",
};

function formatDateShort(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function PaymentHistoryTable({
  payments,
  viewerRole,
  lang = "en",
  loading = false,
  onViewDetails,
  onRetryPayment,
  onVerifyPending,
  retryingContractId = null,
  verifyingTranId = null,
  emptyTitle,
  emptySubtitle,
}: PaymentHistoryTableProps) {
  if (loading && payments.length === 0) {
    return (
      <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 space-y-3 animate-pulse">
        <div className="h-10 rounded-xl bg-[#F4F2EC]" />
        <div className="h-14 rounded-xl bg-[#F4F2EC]" />
        <div className="h-14 rounded-xl bg-[#F4F2EC]" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[rgba(17,19,21,0.16)] rounded-2xl p-10 text-center space-y-2">
        <Receipt className="w-8 h-8 text-[#949BA6] mx-auto" />
        <p className="text-xs font-semibold text-[#111315]">
          {emptyTitle ||
            (lang === "en"
              ? "No payment transactions yet"
              : "এখনো কোনো পেমেন্ট লেনদেন নেই")}
        </p>
        <p className="text-xs text-[#686E78] max-w-md mx-auto">
          {emptySubtitle ||
            (lang === "en"
              ? "SSLCOMMERZ Sandbox transactions, simulated escrow holds, and settlement records will appear here."
              : "SSLCOMMERZ স্যান্ডবক্স লেনদেন এবং সিমুলেটেড এসক্রো রেকর্ড এখানে দেখা যাবে।")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-[rgba(17,19,21,0.09)] bg-[#FAF9F6]">
              <th className="px-4 sm:px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#686E78]">
                {lang === "en" ? "Transaction ID" : "ট্রানজেকশন আইডি"}
              </th>
              <th className="px-4 sm:px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#686E78]">
                {lang === "en" ? "Contract & Parties" : "চুক্তি ও পক্ষ"}
              </th>
              <th className="px-4 sm:px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#686E78]">
                {lang === "en" ? "Method" : "মাধ্যম"}
              </th>
              <th className="px-4 sm:px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#686E78]">
                {lang === "en" ? "Amount / Split" : "পরিমাণ ও বিভাজন"}
              </th>
              <th className="px-4 sm:px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#686E78]">
                {lang === "en" ? "Status" : "স্ট্যাটাস"}
              </th>
              <th className="px-4 sm:px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#686E78]">
                {lang === "en" ? "Actions" : "অ্যাকশন"}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgba(17,19,21,0.09)]">
            {payments.map((p) => {
              const meta = getPaymentStatusMeta(p.status);
              const badgeCls = TONE_CLASSES[meta.tone] ?? TONE_CLASSES.slate;
              const canRetry =
                viewerRole === "client" &&
                (p.status === "FAILED" || p.status === "CANCELLED") &&
                ["UNPAID", "FAILED", "CANCELLED"].includes(
                  p.contract_payment_status
                );
              const canVerify =
                viewerRole === "client" && p.status === "PENDING";

              return (
                <tr
                  key={p.id}
                  className="hover:bg-[#FAF9F6] transition-colors"
                >
                  <td className="px-4 sm:px-5 py-3.5 align-top">
                    <button
                      type="button"
                      onClick={() => onViewDetails(p)}
                      className="font-mono mk-tabular text-xs font-semibold text-[#111315] hover:text-[#0F6E50] hover:underline text-left cursor-pointer"
                    >
                      {p.transaction_id}
                    </button>
                    <p className="text-[11px] text-[#949BA6] mt-0.5 font-mono mk-tabular">
                      {formatDateShort(p.created_at)}
                    </p>
                    {p.validation_id && (
                      <p className="font-mono mk-tabular text-[10px] text-[#0F6E50] mt-0.5">
                        val: {p.validation_id}
                      </p>
                    )}
                  </td>

                  <td className="px-4 sm:px-5 py-3.5 align-top max-w-[260px]">
                    <Link
                      href={`/contracts/${p.contract_id}`}
                      className="text-xs font-semibold text-[#111315] hover:text-[#0F6E50] hover:underline line-clamp-1"
                    >
                      {p.contract_title}
                    </Link>
                    <p className="text-[11px] text-[#686E78] mt-0.5 truncate">
                      {viewerRole === "admin"
                        ? `${p.client_name} → ${p.freelancer_name}`
                        : viewerRole === "client"
                          ? `Freelancer: ${p.freelancer_name}`
                          : `Client: ${p.client_name}`}
                    </p>
                    <p className="font-mono mk-tabular text-[10px] text-[#949BA6]">
                      {p.contract_code}
                    </p>
                  </td>

                  <td className="px-4 sm:px-5 py-3.5 align-top whitespace-nowrap">
                    <span className="text-xs font-semibold text-[#3E434A] block">
                      {p.card_type || p.gateway}
                    </span>
                    <span className="text-[10px] text-[#949BA6]">
                      {p.card_brand || "SSLCOMMERZ Sandbox"}
                    </span>
                  </td>

                  <td className="px-4 sm:px-5 py-3.5 align-top text-right whitespace-nowrap">
                    <p className="text-xs font-bold text-[#111315] font-mono mk-tabular">
                      {formatBdt(
                        viewerRole === "freelancer"
                          ? p.freelancer_amount
                          : p.amount
                      )}
                    </p>
                    {viewerRole === "freelancer" ? (
                      <p className="text-[10px] text-[#686E78] font-mono mk-tabular">
                        Gross {formatBdt(p.amount)} · -{p.platform_fee_pct}% fee
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#686E78] font-mono mk-tabular">
                        Fee {formatBdt(p.platform_fee)} · Net{" "}
                        {formatBdt(p.freelancer_amount)}
                      </p>
                    )}
                  </td>

                  <td className="px-4 sm:px-5 py-3.5 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeCls}`}
                    >
                      {lang === "en" ? meta.label : meta.labelBn}
                    </span>
                    {p.refund_request && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#5B3E96] mt-1">
                        <RotateCcw className="w-3 h-3" />
                        Refund: {p.refund_request.status}
                      </span>
                    )}
                  </td>

                  <td className="px-4 sm:px-5 py-3.5 align-top text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#3E434A] text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === "en" ? "Details" : "বিস্তারিত"}</span>
                      </button>

                      {canVerify && onVerifyPending && (
                        <button
                          type="button"
                          disabled={verifyingTranId === p.transaction_id}
                          onClick={() => onVerifyPending(p.transaction_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E5B88] hover:bg-[#16476B] text-white text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              verifyingTranId === p.transaction_id
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          <span>{lang === "en" ? "Verify" : "যাচাই"}</span>
                        </button>
                      )}

                      {canRetry && onRetryPayment && (
                        <button
                          type="button"
                          disabled={retryingContractId === p.contract_id}
                          onClick={() => onRetryPayment(p.contract_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{lang === "en" ? "Retry" : "পুনরায়"}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

