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
  emerald: "bg-brand-soft text-navy border-brand/25",
  sky: "bg-brand-soft text-brand-strong border-brand-strong/20",
  amber: "bg-accent-soft text-accent border-accent/25",
  rose: "bg-danger-soft text-danger border-danger/20",
  indigo: "bg-plum-soft text-plum border-plum/20",
  slate: "bg-subtle text-ink-2 border-line",
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
    <section className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-soft border border-brand-strong/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-brand-strong" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink">
                {lang === "en" ? "Internal Escrow Ledger" : "অভ্যন্তরীণ এসক্রো লেজার"}
              </h2>
              <span className="px-2 py-0.5 rounded-full mk-eyebrow bg-subtle text-ink-2 border border-line">
                {lang === "en" ? "Simulated Ledger" : "সিমুলেটেড লেজার"}
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
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
              className="p-2 rounded-lg border border-line-strong text-ink-2 hover:text-ink hover:bg-canvas transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Explicit Academic Simulation Disclosure */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-accent-soft border border-accent/25 text-xs text-accent-strong">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === "en"
            ? ESCROW_SIMULATION_DISCLAIMER
            : ESCROW_SIMULATION_DISCLAIMER_BN}
        </p>
      </div>

      {/* Balance KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-brand-soft border border-brand-strong/20">
          <span className="mk-eyebrow text-brand-strong flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {lang === "en" ? "Held in Escrow" : "এসক্রোতে জমা"}
          </span>
          <p className="text-lg font-semibold text-ink mt-1 font-mono mk-tabular">
            {formatBdt(summary.currentlyHeldBdt)}
          </p>
          <span className="text-[11px] text-ink-3">
            {lang === "en" ? "Internal ledger custody" : "সিমুলেটেড কাস্টডি"}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-canvas border border-line">
          <span className="mk-eyebrow text-ink-3">
            {lang === "en" ? "Total Funded" : "মোট ফান্ড"}
          </span>
          <p className="text-lg font-semibold text-ink mt-1 font-mono mk-tabular">
            {formatBdt(summary.totalFundedBdt)}
          </p>
          <span className="text-[11px] text-ink-3">
            {lang === "en" ? "SSLCOMMERZ verified" : "SSLCOMMERZ যাচাইকৃত"}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-brand-soft border border-brand/25">
          <span className="mk-eyebrow text-navy">
            {lang === "en" ? "Released (Gross)" : "রিলিজ (মোট)"}
          </span>
          <p className="text-lg font-semibold text-ink mt-1 font-mono mk-tabular">
            {formatBdt(summary.totalReleasedBdt)}
          </p>
          <span className="text-[11px] text-brand font-semibold font-mono mk-tabular">
            {lang === "en"
              ? `Net: ${formatBdt(summary.freelancerNetBdt)}`
              : `নিট: ${formatBdt(summary.freelancerNetBdt)}`}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-canvas border border-line">
          <span className="mk-eyebrow text-ink-3">
            {summary.totalRefundedBdt > 0
              ? lang === "en"
                ? "Refunded"
                : "রিফান্ড"
              : lang === "en"
                ? "Platform fee"
                : "প্ল্যাটফর্ম ফি"}
          </span>
          <p className="text-lg font-semibold text-ink mt-1 font-mono mk-tabular">
            {formatBdt(
              summary.totalRefundedBdt > 0
                ? summary.totalRefundedBdt
                : summary.platformFeeBdt
            )}
          </p>
          <span className="text-[11px] text-ink-3">
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
        <div className="p-3.5 rounded-lg bg-danger-soft border border-danger/25 text-xs text-danger font-medium">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && entries.length === 0 ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-16 rounded-lg bg-subtle" />
          <div className="h-16 rounded-lg bg-subtle" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-canvas p-6 text-center space-y-1.5">
          <Receipt className="w-7 h-7 text-ink-4 mx-auto" />
          <p className="text-xs font-semibold text-ink">
            {lang === "en"
              ? "No escrow ledger entries recorded yet"
              : "এখনও কোনো এসক্রো লেজার এন্ট্রি তৈরি হয়নি"}
          </p>
          <p className="text-xs text-ink-3 max-w-md mx-auto">
            {lang === "en"
              ? "Once the client completes an SSLCOMMERZ Sandbox payment and verification succeeds, an immutable FUND entry will appear here automatically."
              : "ক্লায়েন্ট SSLCOMMERZ স্যান্ডবক্স পেমেন্ট যাচাই করলে স্বয়ংক্রিয়ভাবে এখানে FUND এন্ট্রি যুক্ত হবে।"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-3 font-mono mk-tabular">
            {lang === "en"
              ? `Ledger Entries (${entries.length})`
              : `লেজার এন্ট্রি (${entries.length})`}
          </h3>
          <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
            {entries.map((entry) => {
              const isFund = entry.entry_type === "FUND";
              const isRelease = entry.entry_type === "RELEASE";
              const iconBg = isFund
                ? "bg-brand-soft text-brand-strong border-brand-strong/20"
                : isRelease
                  ? "bg-brand-soft text-navy border-brand/25"
                  : "bg-plum-soft text-plum border-plum/20";
              const metaTranId =
                typeof entry.metadata?.transaction_id === "string"
                  ? entry.metadata.transaction_id
                  : null;

              return (
                <div
                  key={entry.id}
                  className="p-4 bg-white hover:bg-canvas transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}
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
                          className={`px-2 py-0.5 rounded-md mk-eyebrow border ${iconBg}`}
                        >
                          {entry.entry_type}
                        </span>
                        {metaTranId && (
                          <span className="font-mono mk-tabular text-[11px] font-semibold text-ink-3">
                            {metaTranId}
                          </span>
                        )}
                        {entry.is_simulated && (
                          <span className="text-[10px] font-semibold text-accent bg-accent-soft border border-accent/25 px-1.5 py-0.5 rounded font-mono">
                            SIMULATED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-2 leading-relaxed">
                        {entry.description}
                      </p>
                      <p className="text-[11px] text-ink-4 font-mono mk-tabular">
                        {formatLedgerTimestamp(entry.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pl-12 sm:pl-0">
                    <span className="text-sm font-semibold text-ink block font-mono mk-tabular">
                      {formatBdt(entry.amount)}
                    </span>
                    {(entry.platform_fee_amount > 0 || entry.freelancer_net_amount > 0) && (
                      <span className="text-[11px] text-ink-3 block font-mono mk-tabular">
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

