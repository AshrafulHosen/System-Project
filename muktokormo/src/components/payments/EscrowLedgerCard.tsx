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
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
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
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                {lang === "en" ? "Internal Escrow Ledger" : "অভ্যন্তরীণ এসক্রো লেজার"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                {lang === "en" ? "Simulated Ledger" : "সিমুলেটেড লেজার"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "en"
                ? "Verified FUND, RELEASE, and REFUND audit trail recorded in PostgreSQL"
                : "PostgreSQL-এ সংরক্ষিত যাচাইকৃত FUND, RELEASE এবং REFUND অডিট রেকর্ড"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
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
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Explicit Academic Simulation Disclosure */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === "en"
            ? ESCROW_SIMULATION_DISCLAIMER
            : ESCROW_SIMULATION_DISCLAIMER_BN}
        </p>
      </div>

      {/* Balance KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/70">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {lang === "en" ? "Held in Escrow" : "এসক্রোতে জমা"}
          </span>
          <p className="text-lg font-black text-slate-900 mt-1">
            {formatBdt(summary.currentlyHeldBdt)}
          </p>
          <span className="text-[11px] text-slate-500">
            {lang === "en" ? "Internal ledger custody" : "সিমুলেটেড কাস্টডি"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {lang === "en" ? "Total Funded" : "মোট ফান্ড"}
          </span>
          <p className="text-lg font-black text-slate-900 mt-1">
            {formatBdt(summary.totalFundedBdt)}
          </p>
          <span className="text-[11px] text-slate-500">
            {lang === "en" ? "SSLCOMMERZ verified" : "SSLCOMMERZ যাচাইকৃত"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {lang === "en" ? "Released (Gross)" : "রিলিজ (মোট)"}
          </span>
          <p className="text-lg font-black text-slate-900 mt-1">
            {formatBdt(summary.totalReleasedBdt)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {lang === "en"
              ? `Net: ${formatBdt(summary.freelancerNetBdt)}`
              : `নিট: ${formatBdt(summary.freelancerNetBdt)}`}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {summary.totalRefundedBdt > 0
              ? lang === "en"
                ? "Refunded"
                : "রিফান্ড"
              : lang === "en"
                ? "Platform Fee (10%)"
                : "প্ল্যাটফর্ম ফি (১০%)"}
          </span>
          <p className="text-lg font-black text-slate-900 mt-1">
            {formatBdt(
              summary.totalRefundedBdt > 0
                ? summary.totalRefundedBdt
                : summary.platformFeeBdt
            )}
          </p>
          <span className="text-[11px] text-slate-500">
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
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && entries.length === 0 ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center space-y-1.5">
          <Receipt className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            {lang === "en"
              ? "No escrow ledger entries recorded yet"
              : "এখনও কোনো এসক্রো লেজার এন্ট্রি তৈরি হয়নি"}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {lang === "en"
              ? "Once the client completes an SSLCOMMERZ Sandbox payment and verification succeeds, an immutable FUND entry will appear here automatically."
              : "ক্লায়েন্ট SSLCOMMERZ স্যান্ডবক্স পেমেন্ট যাচাই করলে স্বয়ংক্রিয়ভাবে এখানে FUND এন্ট্রি যুক্ত হবে।"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {lang === "en"
              ? `Ledger Entries (${entries.length})`
              : `লেজার এন্ট্রি (${entries.length})`}
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
            {entries.map((entry) => {
              const isFund = entry.entry_type === "FUND";
              const isRelease = entry.entry_type === "RELEASE";
              const iconBg = isFund
                ? "bg-sky-50 text-sky-600 border-sky-200"
                : isRelease
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-indigo-50 text-indigo-600 border-indigo-200";
              const metaTranId =
                typeof entry.metadata?.transaction_id === "string"
                  ? entry.metadata.transaction_id
                  : null;

              return (
                <div
                  key={entry.id}
                  className="p-4 bg-white hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${iconBg}`}
                        >
                          {entry.entry_type}
                        </span>
                        {metaTranId && (
                          <span className="font-mono text-[11px] font-semibold text-slate-500">
                            {metaTranId}
                          </span>
                        )}
                        {entry.is_simulated && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            SIMULATED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {entry.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatLedgerTimestamp(entry.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pl-12 sm:pl-0">
                    <span className="text-sm font-black text-slate-900 block">
                      {formatBdt(entry.amount)}
                    </span>
                    {(entry.platform_fee_amount > 0 || entry.freelancer_net_amount > 0) && (
                      <span className="text-[11px] text-slate-500 block">
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

