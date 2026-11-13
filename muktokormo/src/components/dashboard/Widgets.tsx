"use client";

import React from "react";
import Link from "next/link";
import {
  Rocket,
  Wallet,
  ShieldCheck,
  Lock,
  UserCircle,
  Send,
  Briefcase,
  FileText,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { DashboardContract, ResourceCardData, DraftJob, WalletEntry } from "@/types";
import { formatBdt, formatSignedBdt } from "@/lib/format";

const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Wallet,
  ShieldCheck,
  Lock,
  UserCircle,
  Send,
};

const METHOD_STYLES: Record<string, string> = {
  BKASH: "bg-plum-soft text-danger-strong border-danger-strong/20",
  NAGAD: "bg-accent-soft text-accent-strong border-accent-strong/20",
  ROCKET: "bg-plum-soft text-plum border-plum/20",
  BANK: "bg-brand-soft text-brand-strong border-brand-strong/20",
  ESCROW: "bg-brand-soft text-brand border-brand/20",
  PLATFORM_FEE: "bg-subtle text-ink-2 border-line-strong",
};

const STAGE_STYLES: Record<string, string> = {
  ACTIVE: "bg-brand-soft text-brand-strong border-brand-strong/20",
  COMPLETED: "bg-brand-soft text-brand border-brand/25",
  DISPUTED: "bg-danger-soft text-danger border-danger/20",
  TERMINATED: "bg-subtle text-ink-3 border-line-strong",
};

export function ResourceGrid({
  resources,
  lang,
}: {
  resources: ResourceCardData[];
  lang: "en" | "bn";
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      {resources.map((res) => {
        const Icon = RESOURCE_ICONS[res.icon] || Rocket;
        return (
          <div
            key={res.id}
            className="rounded-xl border border-line bg-white p-5 transition-all hover:border-navy/30 hover:shadow-sm cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-soft border border-brand/15 text-brand flex items-center justify-center mb-3.5 group-hover:bg-navy group-hover:text-white transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-ink">
              {lang === "en" ? res.title : res.titleBn}
            </h4>
            <p className="text-[11px] text-ink-3 mt-1 leading-relaxed">
              {lang === "en" ? res.body : res.bodyBn}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand mt-3 group-hover:gap-2 transition-all">
              {lang === "en" ? "Learn more" : "আরও জানুন"}
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        );
      })}

      <Link
        href="/escrow"
        className="mk-dark-card rounded-xl p-5 flex flex-col justify-center items-start hover:opacity-95 transition-opacity"
      >
        <p className="text-sm font-semibold text-white">
          {lang === "en" ? "View all resources" : "সব রিসোর্স দেখুন"}
        </p>
        <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">
          {lang === "en"
            ? "Guides, escrow calculators and policy updates for Bangladesh."
            : "বাংলাদেশি ফ্রিল্যান্স অর্থনীতির গাইড ও পলিসি।"}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-light mt-3">
          {lang === "en" ? "Explore escrow guide" : "এসক্রো গাইড দেখুন"}
          <ArrowRight className="w-3 h-3" />
        </span>
      </Link>
    </div>
  );
}

export function ContractCard({
  contract,
  perspective,
  lang,
}: {
  contract: DashboardContract;
  perspective: "client" | "freelancer";
  lang: "en" | "bn";
}) {
  return (
    <div className="bg-white border border-line rounded-xl p-5 shadow-[var(--mk-shadow-xs)] hover:border-line-strong transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          {contract.counterpartyAvatar ? (
            <img
              src={contract.counterpartyAvatar}
              alt={contract.counterparty}
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-[rgba(16,24,40,0.1)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-subtle flex items-center justify-center shrink-0 text-ink-2">
              <Briefcase className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-ink leading-snug">
              {lang === "en" ? contract.jobTitle : contract.jobTitleBn}
            </h4>
            <p className="text-[11px] text-ink-3 mt-0.5 truncate">
              {perspective === "client" ? "Talent" : "Client"}: {contract.counterparty}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border shrink-0 ${
            STAGE_STYLES[contract.stage] ?? STAGE_STYLES.ACTIVE
          }`}
        >
          {contract.stage}
        </span>
      </div>

      <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${contract.progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-canvas border border-line rounded-lg py-2 px-1">
          <p className="text-[9px] font-semibold text-ink-3 uppercase">
            {lang === "en" ? "Total" : "মোট"}
          </p>
          <p className="text-xs font-semibold font-mono mk-tabular text-ink mt-0.5">
            {formatBdt(contract.totalBdt)}
          </p>
        </div>
        <div className="bg-accent-soft border border-accent/20 rounded-lg py-2 px-1">
          <p className="text-[9px] font-semibold text-accent uppercase">
            {lang === "en" ? "In escrow" : "এসক্রোতে"}
          </p>
          <p className="text-xs font-semibold font-mono mk-tabular text-accent-strong mt-0.5">
            {formatBdt(contract.escrowHeldBdt)}
          </p>
        </div>
        <div className="bg-brand-soft border border-brand/20 rounded-lg py-2 px-1">
          <p className="text-[9px] font-semibold text-brand uppercase">
            {lang === "en" ? "Released" : "মুক্ত"}
          </p>
          <p className="text-xs font-semibold font-mono mk-tabular text-navy mt-0.5">
            {formatBdt(contract.releasedBdt)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-line">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-ink truncate">
            {contract.nextMilestone}
          </p>
          <p className="text-[10px] text-ink-3 mt-0.5">{contract.nextMilestoneDue}</p>
        </div>
        <Link
          href={`/contracts/${contract.id}`}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-soft hover:bg-brand-soft-2 text-navy text-xs font-semibold transition-all cursor-pointer border border-brand/20"
        >
          <span>{lang === "en" ? "Workspace" : "ওয়ার্কস্পেস"}</span>
          <ChevronRight className="w-3.5 h-3.5 text-brand" />
        </Link>
      </div>

      <p className="text-[10px] text-ink-4 mt-2 font-mono mk-tabular">{contract.startedLabel}</p>
    </div>
  );
}

export function DraftJobsTable({
  drafts,
  lang,
}: {
  drafts: DraftJob[];
  lang: "en" | "bn";
}) {
  if (drafts.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center mx-auto">
          <Briefcase className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-ink">
          {lang === "en" ? "No jobs posted yet" : "এখনও কোনো কাজের পোস্ট করা হয়নি"}
        </h3>
        <p className="text-xs text-ink-3 max-w-md mx-auto">
          {lang === "en"
            ? "Create your first job post to connect with vetted Bangladeshi developers and specialists."
            : "দক্ষ বাংলাদেশি ফ্রিল্যান্সারদের সাথে যুক্ত হতে আপনার প্রথম কাজের পোস্ট তৈরি করুন।"}
        </p>
        <Link
          href="/post-job"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-navy-ink text-white text-xs font-semibold transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === "en" ? "Post a Job Now" : "এখনই কাজ পোস্ট করুন"}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl shadow-[var(--mk-shadow-xs)] overflow-hidden">
      <div className="divide-y divide-line">
        {drafts.map((draft) => {
          const isLive = draft.status === "LIVE";
          return (
            <div
              key={draft.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-canvas transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${
                      isLive
                        ? "bg-brand-soft text-navy border-brand/25"
                        : "bg-accent-soft text-accent border-accent/25"
                    }`}
                  >
                    {isLive
                      ? lang === "en"
                        ? "Live"
                        : "প্রকাশিত"
                      : lang === "en"
                        ? "Draft"
                        : "খসড়া"}
                  </span>
                  <span className="text-[10px] text-ink-4">{draft.updatedLabel}</span>
                </div>

                <h4 className="text-xs font-semibold text-ink leading-snug truncate">
                  {lang === "en" ? draft.title : draft.titleBn}
                </h4>
                <p className="text-[11px] text-ink-3 mt-0.5">{draft.category}</p>

                {!isLive && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1 flex-1 bg-subtle rounded-full overflow-hidden max-w-[160px]">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${draft.completionPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold font-mono mk-tabular text-ink-3">
                      {draft.completionPct}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-semibold text-ink-3 uppercase">
                    {lang === "en" ? "Budget" : "বাজেট"}
                  </p>
                  <p className="text-sm font-semibold font-mono mk-tabular text-ink">
                    {formatBdt(draft.budgetBdt)}
                  </p>
                </div>

                {isLive && (
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-semibold text-ink-3 uppercase">
                      {lang === "en" ? "Proposals" : "আবেদন"}
                    </p>
                    <p className="text-sm font-semibold font-mono mk-tabular text-brand">
                      {draft.proposalCount}
                    </p>
                  </div>
                )}

                <Link
                  href={isLive ? `/jobs/${draft.id}` : `/post-job`}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                    isLive
                      ? "bg-subtle hover:bg-muted text-ink"
                      : "bg-navy hover:bg-navy-ink text-white"
                  }`}
                >
                  {isLive
                    ? lang === "en"
                      ? "View & Manage"
                      : "দেখুন ও পরিচালনা"
                    : lang === "en"
                      ? "Fill in draft"
                      : "খসড়া পূরণ"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LedgerList({
  entries,
  lang,
  emptyLabel,
  emptyLabelBn,
}: {
  entries: WalletEntry[];
  lang: "en" | "bn";
  emptyLabel: string;
  emptyLabelBn: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-10 text-center">
        <p className="text-xs text-ink-3">{lang === "en" ? emptyLabel : emptyLabelBn}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl shadow-[var(--mk-shadow-xs)] overflow-hidden">
      <div className="divide-y divide-line">
        {entries.map((entry) => {
          const isCredit = entry.amountBdt > 0;
          return (
            <div
              key={entry.id}
              className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-canvas transition-colors"
            >
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  METHOD_STYLES[entry.method] ?? METHOD_STYLES.PLATFORM_FEE
                }`}
              >
                {entry.method === "ESCROW" ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : entry.method === "PLATFORM_FEE" ? (
                  <FileText className="w-3.5 h-3.5" />
                ) : (
                  <Wallet className="w-3.5 h-3.5" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">
                  {lang === "en" ? entry.label : entry.labelBn}
                </p>
                <p className="text-[10px] text-ink-3 mt-0.5 font-mono mk-tabular">
                  {entry.createdLabel} · {entry.method}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-xs font-semibold font-mono mk-tabular ${
                    isCredit ? "text-brand" : "text-ink"
                  }`}
                >
                  {isCredit ? `+${formatBdt(entry.amountBdt)}` : formatSignedBdt(entry.amountBdt)}
                </p>
                {entry.status === "PENDING" && (
                  <span className="text-[9px] font-semibold text-accent">
                    {lang === "en" ? "Pending" : "অপেক্ষমাণ"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
