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
  BKASH: "bg-pink-50 text-pink-600 border-pink-200",
  NAGAD: "bg-orange-50 text-orange-600 border-orange-200",
  ROCKET: "bg-purple-50 text-purple-600 border-purple-200",
  BANK: "bg-sky-50 text-sky-600 border-sky-200",
  ESCROW: "bg-emerald-50 text-emerald-600 border-emerald-200",
  PLATFORM_FEE: "bg-slate-50 text-slate-600 border-slate-200",
};

const STAGE_STYLES: Record<string, string> = {
  ACTIVE: "bg-sky-50 text-sky-700 border-sky-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISPUTED: "bg-red-50 text-red-700 border-red-200",
  TERMINATED: "bg-slate-50 text-slate-600 border-slate-200",
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
            className={`rounded-2xl border p-5 transition-all hover:shadow-sm cursor-pointer group ${res.accentClass}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 ${res.iconClass}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {lang === "en" ? res.title : res.titleBn}
            </h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              {lang === "en" ? res.body : res.bodyBn}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 mt-3 group-hover:gap-2 transition-all">
              {lang === "en" ? "Learn more" : "আরও জানুন"}
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        );
      })}

      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 flex flex-col justify-center items-start">
        <p className="text-sm font-black">
          {lang === "en" ? "View all resources" : "সব রিসোর্স দেখুন"}
        </p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          {lang === "en"
            ? "Guides, playbooks and policy updates for the Bangladeshi freelance economy."
            : "বাংলাদেশি ফ্রিল্যান্স অর্থনীতির গাইড ও পলিসি।"}
        </p>
      </div>
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          {contract.counterpartyAvatar ? (
            <img
              src={contract.counterpartyAvatar}
              alt={contract.counterparty}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <Briefcase className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 leading-snug">
              {lang === "en" ? contract.jobTitle : contract.jobTitleBn}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {perspective === "client" ? "Talent" : "Client"}: {contract.counterparty}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border shrink-0 ${
            STAGE_STYLES[contract.stage]
          }`}
        >
          {contract.stage}
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${contract.progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-slate-50 rounded-lg py-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase">
            {lang === "en" ? "Total" : "মোট"}
          </p>
          <p className="text-xs font-black text-slate-900">{formatBdt(contract.totalBdt)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg py-2">
          <p className="text-[9px] font-bold text-amber-600 uppercase">
            {lang === "en" ? "In escrow" : "এসক্রোতে"}
          </p>
          <p className="text-xs font-black text-amber-700">
            {formatBdt(contract.escrowHeldBdt)}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg py-2">
          <p className="text-[9px] font-bold text-emerald-600 uppercase">
            {lang === "en" ? "Released" : "মুক্ত"}
          </p>
          <p className="text-xs font-black text-emerald-700">{formatBdt(contract.releasedBdt)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-700 truncate">
            {contract.nextMilestone}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{contract.nextMilestoneDue}</p>
        </div>
        <button className="shrink-0 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[10px] text-slate-400 mt-2">{contract.startedLabel}</p>
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
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="divide-y divide-slate-50">
        {drafts.map((draft) => {
          const isLive = draft.status === "LIVE";
          return (
            <div
              key={draft.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                      isLive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {isLive
                      ? lang === "en" ? "Live" : "প্রকাশিত"
                      : lang === "en" ? "Draft" : "খসড়া"}
                  </span>
                  <span className="text-[10px] text-slate-400">{draft.updatedLabel}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                  {lang === "en" ? draft.title : draft.titleBn}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{draft.category}</p>

                {!isLive && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden max-w-[160px]">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${draft.completionPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {draft.completionPct}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {lang === "en" ? "Budget" : "বাজেট"}
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {formatBdt(draft.budgetBdt)}
                  </p>
                </div>

                {isLive && (
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {lang === "en" ? "Proposals" : "আবেদন"}
                    </p>
                    <p className="text-sm font-black text-emerald-600">
                      {draft.proposalCount}
                    </p>
                  </div>
                )}

                <Link
                  href={isLive ? "/#jobs-section" : "/post-job"}
                  className={`px-3.5 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                    isLive
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isLive
                    ? lang === "en" ? "View" : "দেখুন"
                    : lang === "en" ? "Fill in draft" : "খসড়া পূরণ"}
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center">
        <p className="text-xs text-slate-500">{lang === "en" ? emptyLabel : emptyLabelBn}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="divide-y divide-slate-50">
        {entries.map((entry) => {
          const isCredit = entry.amountBdt > 0;
          return (
            <div
              key={entry.id}
              className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors"
            >
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${METHOD_STYLES[entry.method]}`}
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
                <p className="text-xs font-bold text-slate-800 truncate">
                  {lang === "en" ? entry.label : entry.labelBn}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {entry.createdLabel} · {entry.method}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-xs font-black ${
                    isCredit ? "text-emerald-600" : "text-slate-900"
                  }`}
                >
                  {isCredit ? `+${formatBdt(entry.amountBdt)}` : formatSignedBdt(entry.amountBdt)}
                </p>
                {entry.status === "PENDING" && (
                  <span className="text-[9px] font-bold text-amber-600">
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
