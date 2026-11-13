"use client";

import React, {  useState, useEffect , useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import {
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Layers,
} from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { fetchUserContracts } from "@/lib/data/contracts";
import { getPaymentStatusMeta, getWorkStatusMeta } from "@/lib/payments/escrow";
import type { WorkspaceContract } from "@/types";

export default function ContractsHubPage() {
  const router = useRouter();
  const { userId, role, clientId, freelancerId, email, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!userLoading && !email) {
      router.replace("/login?next=/contracts");
    }
  }, [userLoading, email, router]);
  const supabase = useMemo(() => createClient(), []);
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const resolvedRole = role === "client" ? "client" : "freelancer";
        const entityId = resolvedRole === "client" ? clientId : freelancerId;
        const live = await fetchUserContracts(supabase, {
          role: resolvedRole,
          userId,
          entityId,
        });
        if (!cancelled) {
          setContracts(live || []);
        }
      } catch (e) {
        console.error("Failed to fetch live contracts:", e);
      } finally {
        if (!cancelled) setContractsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userLoading, userId, role, clientId, freelancerId]);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [lang, setLang] = useState<"en" | "bn">("en");

  const filteredContracts = contracts.filter((c) => {
    if (filter === "ACTIVE" && c.stage !== "ACTIVE") return false;
    if (filter === "COMPLETED" && c.stage !== "COMPLETED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q) || (c.titleBn && c.titleBn.toLowerCase().includes(q));
      const matchClient = c.client.name.toLowerCase().includes(q) || c.client.company.toLowerCase().includes(q);
      const matchFreelancer = c.freelancer.name.toLowerCase().includes(q);
      const matchCode = c.contractCode.toLowerCase().includes(q);
      return matchTitle || matchClient || matchFreelancer || matchCode;
    }

    return true;
  });

  const totalEscrowHeld = contracts
    .filter((c) => c.stage === "ACTIVE")
    .reduce((sum, c) => sum + c.escrowHeldBdt, 0);

  const activeCount = contracts.filter((c) => c.stage === "ACTIVE").length;
  const completedCount = contracts.filter((c) => c.stage === "COMPLETED").length;

  if (userLoading || !email) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link href="/" className="cursor-pointer">
              <Logo size="md" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-line text-xs font-semibold text-ink-3">
              <Briefcase className="w-3.5 h-3.5 text-brand" />
              <span>{lang === "en" ? "Contracts & Delivery Hub" : "কন্ট্রাক্ট ও ডেলিভারি হাব"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-ink-2 bg-subtle border border-line hover:bg-muted cursor-pointer transition-colors"
            >
              {lang === "en" ? "বাংলা" : "English"}
            </button>
            <Link
              href="/"
              className="text-xs font-semibold text-ink-2 hover:text-brand px-3 py-1.5 rounded-full transition-colors"
            >
              {lang === "en" ? "← Back to Marketplace" : "← মার্কেটপ্লেসে ফিরুন"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Section */}
        <div className="mk-dark-card rounded-xl p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-soft text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-light" />
              <span>{lang === "en" ? "MuktoKormo Escrow Safe Guarantee" : "মুক্তকর্ম ১০০% সুরক্ষিত এসক্রো গ্যারান্টি"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
              {lang === "en" ? "Contract & Milestone Delivery Workspace" : "কন্ট্রাক্ট ও মাইলস্টোন ডেলিভারি ওয়ার্কস্পেস"}
            </h1>
            <p className="text-white/75 text-sm sm:text-base leading-relaxed">
              {lang === "en"
                ? "Manage deliverables, submit code & designs, review revisions, fund contracts via SSLCOMMERZ Sandbox in BDT, and track simulated escrow settlements."
                : "ডেলিভারি জমা দিন, রিভিশন রিভিউ করুন এবং SSLCOMMERZ স্যান্ডবক্সের মাধ্যমে সিমুলেটেড এসক্রো পরিচালনা করুন।"}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-line rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                {lang === "en" ? "Escrow Funds in Custody" : "এসক্রোতে সংরক্ষিত ফান্ড"}
              </p>
              <h3 className="text-2xl font-semibold text-ink mt-1 font-mono mk-tabular">
                ৳{totalEscrowHeld.toLocaleString()} <span className="text-xs font-semibold text-ink-3">BDT</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-lg bg-brand-soft border border-brand/20 text-brand flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-line rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                {lang === "en" ? "Active Workspaces" : "চলতি কন্ট্রাক্ট"}
              </p>
              <h3 className="text-2xl font-semibold text-ink mt-1 font-mono mk-tabular">
                {activeCount} <span className="text-xs font-semibold text-ink-3">In Progress</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-lg bg-brand-soft border border-brand-strong/20 text-brand-strong flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-line rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                {lang === "en" ? "Completed Contracts" : "সম্পন্ন কন্ট্রাক্ট"}
              </p>
              <h3 className="text-2xl font-semibold text-ink mt-1 font-mono mk-tabular">
                {completedCount} <span className="text-xs font-semibold text-ink-3">Settled</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-lg bg-plum-soft border border-plum/20 text-plum flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-subtle rounded-lg border border-line self-start">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono mk-tabular ${
                filter === "ALL" ? "bg-navy text-white shadow-xs" : "text-ink-2 hover:text-ink"
              }`}
            >
              {lang === "en" ? `All Contracts (${contracts.length})` : `সকল কন্ট্রাক্ট (${contracts.length})`}
            </button>
            <button
              onClick={() => setFilter("ACTIVE")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono mk-tabular ${
                filter === "ACTIVE" ? "bg-navy text-white shadow-xs" : "text-ink-2 hover:text-ink"
              }`}
            >
              {lang === "en" ? `Active in Escrow (${activeCount})` : `চলতি কাজ (${activeCount})`}
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono mk-tabular ${
                filter === "COMPLETED" ? "bg-navy text-white shadow-xs" : "text-ink-2 hover:text-ink"
              }`}
            >
              {lang === "en" ? `Completed (${completedCount})` : `সম্পন্ন (${completedCount})`}
            </button>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-ink-4 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === "en" ? "Search by contract, client or title..." : "কন্ট্রাক্ট, ক্লায়েন্ট বা শিরোনাম খুঁজুন..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-line-strong rounded-lg text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>
        </div>

        {/* Contract Cards Grid */}
        <div className="space-y-4">
          {contractsLoading ? (
            <div className="bg-white rounded-xl border border-line p-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-ink-3">Loading your contract workspaces...</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-line p-12 text-center space-y-3">
              <Layers className="w-10 h-10 text-ink-4 mx-auto" />
              <h3 className="text-base font-semibold text-ink">No contracts matched your search</h3>
              <p className="text-xs text-ink-3">Try tweaking your search terms or filters.</p>
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const completedMilestones = contract.milestones.filter(
                (m) => m.status === "APPROVED_RELEASED" || m.status === "APPROVED_AND_RELEASED"
              ).length;
              const totalMilestones = contract.milestones.length;
              const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

              return (
                <div
                  key={contract.id}
                  className="bg-white border border-line hover:border-brand/40 rounded-xl p-6 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Metadata & Titles */}
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono mk-tabular text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-subtle text-ink-2 border border-line">
                          {contract.contractCode}
                        </span>

                        <span className="text-xs font-medium text-ink-3 bg-canvas px-2.5 py-0.5 rounded-lg border border-line">
                          {contract.category}
                        </span>

                        {contract.paymentStatus && (() => {
                          const pMeta = getPaymentStatusMeta(contract.paymentStatus);
                          const wMeta = getWorkStatusMeta(contract.workStatus);
                          const badgeMap: Record<string, string> = {
                            emerald: "bg-brand-soft text-navy border-brand/25",
                            sky: "bg-brand-soft text-brand-strong border-brand-strong/20",
                            amber: "bg-accent-soft text-accent border-accent/25",
                            rose: "bg-danger-soft text-danger border-danger/20",
                            indigo: "bg-plum-soft text-plum border-plum/20",
                            slate: "bg-subtle text-ink-2 border-line",
                          };
                          return (
                            <>
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  badgeMap[pMeta.tone] ?? badgeMap.slate
                                }`}
                              >
                                {lang === "en" ? pMeta.label : pMeta.labelBn}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  badgeMap[wMeta.tone] ?? badgeMap.slate
                                }`}
                              >
                                {lang === "en" ? wMeta.label : wMeta.labelBn}
                              </span>
                            </>
                          );
                        })()}

                        {contract.stage === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy bg-brand-soft border border-brand/25 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                            {lang === "en" ? "Active Contract" : "চলতি কন্ট্রাক্ট"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-plum bg-plum-soft border border-plum/20 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-plum" />
                            {lang === "en" ? "Fully Completed & Settled" : "সম্পূর্ণ পরিশোধিত"}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-ink group-hover:text-brand transition-colors">
                        {lang === "en" ? contract.title : (contract.titleBn || contract.title)}
                      </h3>

                      {/* Client & Freelancer Pill Row */}
                      <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-ink-2">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={contract.client.avatar}
                            alt={contract.client.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-[rgba(16,24,40,0.12)]"
                          />
                          <div>
                            <span className="text-ink-3 font-medium">Client: </span>
                            <span className="font-semibold text-ink">{contract.client.name}</span>
                            <span className="text-ink-3"> ({contract.client.company})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={contract.freelancer.avatar}
                            alt={contract.freelancer.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-[rgba(16,24,40,0.12)]"
                          />
                          <div>
                            <span className="text-ink-3 font-medium">Talent: </span>
                            <span className="font-semibold text-ink">{contract.freelancer.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-ink-3 font-mono mk-tabular">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Deadline: {contract.deadlineDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Milestone Progress & Financials */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 lg:border-l lg:border-line lg:pl-8">
                      <div className="space-y-1 text-left sm:text-right lg:text-right">
                        <div className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Total Contract Value</div>
                        <div className="text-xl font-semibold text-ink font-mono mk-tabular">
                          ৳{contract.totalBdt.toLocaleString()} <span className="text-xs font-semibold text-ink-3">BDT</span>
                        </div>
                        <div className="text-xs text-brand font-semibold flex items-center gap-1 lg:justify-end font-mono mk-tabular">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                          <span>
                            {contract.escrowHeldBdt > 0
                              ? `৳${contract.escrowHeldBdt.toLocaleString()} Simulated Escrow Custody`
                              : contract.paymentStatus === "RELEASED" || contract.releasedBdt > 0
                                ? "Internal Escrow Released"
                                : contract.paymentStatus === "REFUNDED"
                                  ? "Refunded on Ledger"
                                  : "Awaiting SSLCOMMERZ Sandbox Funding"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full sm:w-48 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold text-ink-3 font-mono mk-tabular">
                          <span>Milestones</span>
                          <span>{completedMilestones}/{totalMilestones} ({progressPct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-subtle rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPct === 100 ? "bg-brand" : "bg-brand-strong"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Open Workspace Button */}
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-navy hover:bg-brand active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <span>{lang === "en" ? "Open Delivery Workspace" : "ওয়ার্কস্পেস খুলুন"}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
