"use client";

import React, { useMemo } from "react";
import {
  ShieldCheck,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Info,
  Receipt,
  RefreshCw,
} from "lucide-react";
import {
  ESCROW_SIMULATION_DISCLAIMER,
  ESCROW_SIMULATION_DISCLAIMER_BN,
  computeEscrowLedgerSummary,
  getPaymentStatusMeta,
} from "@/lib/payments/escrow";
import { formatBdt } from "@/lib/format";
import type { EscrowLedgerRecord } from "@/types/payment";

interface EscrowLedgerCardProps {
  entries: EscrowLedgerRecord[];
  paymentStatus?: string | null;
  loading?: boolean;
  error?: string | null;
  lang?: "en" | "bn";
  onRefresh?: () => void;
}

const TONE_CLASSES: Record<string, string> = {
  emerald: "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25",
  sky: "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20",
  amber: "bg-[#FEF6E6] text-[#A87224] border-[#A87224]/25",
  rose: "bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20",
  indigo: "bg-[#F3EFFA] text-[#5B3E96] border-[#5B3E96]/20",
  slate: "bg-[#F4F2EC] text-[#3E434A] border-[rgba(17,19,21,0.09)]",
};

function formatLedgerTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function EscrowLedgerCard({
  entries,
  paymentStatus,
  loading = false,
  error = null,
  lang = "en",
  onRefresh,
}: EscrowLedgerCardProps) {
  const summary = useMemo(() => computeEscrowLedgerSummary(entries), [entries]);
  const statusMeta = getPaymentStatusMeta(paymentStatus);

  return (
    <section className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(17,19,21,0.09)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF5FA] border border-[#1E5B88]/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#1E5B88]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[#111315]">
                {lang === "en" ? "Internal Escrow Ledger" : "অভ্যন্তরীণ এসক্রো লেজার"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F4F2EC] text-[#3E434A] border border-[rgba(17,19,21,0.09)]">
                {lang === "en" ? "Simulated Ledger" : "সিমুলেটেড লেজার"}
              </span>
            </div>
            <p className="text-xs text-[#686E78] mt-0.5">
              {lang === "en"
                ? "Verified FUND, RELEASE, and REFUND audit trail recorded in PostgreSQL"
                : "PostgreSQL-এ সংরক্ষিত যাচাইকৃত FUND, RELEASE এবং REFUND অডিট রেকর্ড"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              TONE_CLASSES[statusMeta.tone] ?? TONE_CLASSES.slate
            }`}
          >
            {lang === "en" ? statusMeta.label : statusMeta.labelBn}
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh escrow ledger"
              className="p-2 rounded-xl border border-[rgba(17,19,21,0.12)] text-[#3E434A] hover:text-[#111315] hover:bg-[#FAF9F6] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Explicit Academic Simulation Disclosure */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FEF6E6] border border-[#A87224]/25 text-xs text-[#734C15]">
        <Info className="w-4 h-4 text-[#A87224] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === "en"
            ? ESCROW_SIMULATION_DISCLAIMER
            : ESCROW_SIMULATION_DISCLAIMER_BN}
        </p>
      </div>

      {/* Balance KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#EEF5FA] border border-[#1E5B88]/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1E5B88] flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {lang === "en" ? "Held in Escrow" : "এসক্রোতে জমা"}
          </span>
          <p className="text-lg font-bold text-[#111315] mt-1 font-mono mk-tabular">
            {formatBdt(summary.currentlyHeldBdt)}
          </p>
          <span className="text-[11px] text-[#686E78]">
            {lang === "en" ? "Internal ledger custody" : "সিমুলেটেড কাস্টডি"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686E78]">
            {lang === "en" ? "Total Funded" : "মোট ফান্ড"}
          </span>
          <p className="text-lg font-bold text-[#111315] mt-1 font-mono mk-tabular">
            {formatBdt(summary.totalFundedBdt)}
          </p>
          <span className="text-[11px] text-[#686E78]">
            {lang === "en" ? "SSLCOMMERZ verified" : "SSLCOMMERZ যাচাইকৃত"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#EAF5F0] border border-[#0F6E50]/25">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0B3B2E]">
            {lang === "en" ? "Released (Gross)" : "রিলিজ (মোট)"}
          </span>
          <p className="text-lg font-bold text-[#111315] mt-1 font-mono mk-tabular">
            {formatBdt(summary.totalReleasedBdt)}
          </p>
          <span className="text-[11px] text-[#0F6E50] font-semibold font-mono mk-tabular">
            {lang === "en"
              ? `Net: ${formatBdt(summary.freelancerNetBdt)}`
              : `নিট: ${formatBdt(summary.freelancerNetBdt)}`}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686E78]">
            {summary.totalRefundedBdt > 0
              ? lang === "en"
                ? "Refunded"
                : "রিফান্ড"
              : lang === "en"
                ? "Platform Fee (10%)"
                : "প্ল্যাটফর্ম ফি (১০%)"}
          </span>
          <p className="text-lg font-bold text-[#111315] mt-1 font-mono mk-tabular">
            {formatBdt(
              summary.totalRefundedBdt > 0
                ? summary.totalRefundedBdt
                : summary.platformFeeBdt
            )}
          </p>
          <span className="text-[11px] text-[#686E78]">
            {summary.totalRefundedBdt > 0
              ? lang === "en"
                ? "Returned on ledger"
                : "লেজারে ফেরত"
              : lang === "en"
                ? "Calculated at settlement"
                : "সেটেলমেন্টে হিসাবকৃত"}
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/25 text-xs text-[#DC2626] font-medium">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && entries.length === 0 ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-16 rounded-xl bg-[#F4F2EC]" />
          <div className="h-16 rounded-xl bg-[#F4F2EC]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(17,19,21,0.16)] bg-[#FAF9F6] p-6 text-center space-y-1.5">
          <Receipt className="w-7 h-7 text-[#949BA6] mx-auto" />
          <p className="text-xs font-semibold text-[#111315]">
            {lang === "en"
              ? "No escrow ledger entries recorded yet"
              : "এখনও কোনো এসক্রো লেজার এন্ট্রি তৈরি হয়নি"}
          </p>
          <p className="text-xs text-[#686E78] max-w-md mx-auto">
            {lang === "en"
              ? "Once the client completes an SSLCOMMERZ Sandbox payment and verification succeeds, an immutable FUND entry will appear here automatically."
              : "ক্লায়েন্ট SSLCOMMERZ স্যান্ডবক্স পেমেন্ট যাচাই করলে স্বয়ংক্রিয়ভাবে এখানে FUND এন্ট্রি যুক্ত হবে।"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#686E78] font-mono mk-tabular">
            {lang === "en"
              ? `Ledger Entries (${entries.length})`
              : `লেজার এন্ট্রি (${entries.length})`}
          </h3>
          <div className="divide-y divide-[rgba(17,19,21,0.09)] border border-[rgba(17,19,21,0.09)] rounded-xl overflow-hidden">
            {entries.map((entry) => {
              const isFund = entry.entry_type === "FUND";
              const isRelease = entry.entry_type === "RELEASE";
              const iconBg = isFund
                ? "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20"
                : isRelease
                  ? "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25"
                  : "bg-[#F3EFFA] text-[#5B3E96] border-[#5B3E96]/20";
              const metaTranId =
                typeof entry.metadata?.transaction_id === "string"
                  ? entry.metadata.transaction_id
                  : null;

              return (
                <div
                  key={entry.id}
                  className="p-4 bg-white hover:bg-[#FAF9F6] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}
                    >
                      {isFund ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isRelease ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${iconBg}`}
                        >
                          {entry.entry_type}
                        </span>
                        {metaTranId && (
                          <span className="font-mono mk-tabular text-[11px] font-semibold text-[#686E78]">
                            {metaTranId}
                          </span>
                        )}
                        {entry.is_simulated && (
                          <span className="text-[10px] font-semibold text-[#A87224] bg-[#FEF6E6] border border-[#A87224]/25 px-1.5 py-0.5 rounded font-mono">
                            SIMULATED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#3E434A] leading-relaxed">
                        {entry.description}
                      </p>
                      <p className="text-[11px] text-[#949BA6] font-mono mk-tabular">
                        {formatLedgerTimestamp(entry.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pl-12 sm:pl-0">
                    <span className="text-sm font-bold text-[#111315] block font-mono mk-tabular">
                      {formatBdt(entry.amount)}
                    </span>
                    {(entry.platform_fee_amount > 0 || entry.freelancer_net_amount > 0) && (
                      <span className="text-[11px] text-[#686E78] block font-mono mk-tabular">
                        Fee: {formatBdt(entry.platform_fee_amount)} · Net:{" "}
                        {formatBdt(entry.freelancer_net_amount)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

