"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Building,
  Layers,
  ChevronRight,
  UserCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Logo from "@/components/Logo";
import { INITIAL_WORKSPACE_CONTRACTS } from "@/data/mockContracts";
import { WorkspaceContract } from "@/types";

export default function ContractsHubPage() {
  const [contracts] = useState<WorkspaceContract[]>(INITIAL_WORKSPACE_CONTRACTS);
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

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="cursor-pointer">
              <Logo size="md" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs font-semibold text-slate-500">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "Contracts & Delivery Hub" : "কন্ট্রাক্ট ও ডেলিভারি হাব"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              {lang === "en" ? "বাংলা" : "English"}
            </button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-full transition-colors"
            >
              {lang === "en" ? "← Back to Marketplace" : "← মার্কেটপ্লেসে ফিরুন"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-8 sm:p-10 shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{lang === "en" ? "MuktoKormo Escrow Safe Guarantee" : "মুক্তকর্ম ১০০% সুরক্ষিত এসক্রো গ্যারান্টি"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {lang === "en" ? "Contract & Milestone Delivery Workspace" : "কন্ট্রাক্ট ও মাইলস্টোন ডেলিভারি ওয়ার্কস্পেস"}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {lang === "en"
                ? "Manage deliverables, submit code & designs, review revisions, and safely disburse payments in Bangladeshi Taka (BDT) via bKash & Nagad."
                : "ডেলিভারি জমা দিন, রিভিশন রিভিউ করুন এবং বিকাশ ও নগদের মাধ্যমে সুরক্ষিতভাবে পেমেন্ট রিলিজ পরিচালনা করুন।"}
            </p>
          </div>

          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {lang === "en" ? "Escrow Funds in Custody" : "এসক্রোতে সংরক্ষিত ফান্ড"}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                ৳{totalEscrowHeld.toLocaleString()} <span className="text-xs font-semibold text-slate-500">BDT</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {lang === "en" ? "Active Workspaces" : "চলতি কন্ট্রাক্ট"}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {activeCount} <span className="text-xs font-semibold text-slate-500">In Progress</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {lang === "en" ? "Completed Contracts" : "সম্পন্ন কন্ট্রাক্ট"}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {completedCount} <span className="text-xs font-semibold text-slate-500">Settled</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {lang === "en" ? `All Contracts (${contracts.length})` : `সকল কন্ট্রাক্ট (${contracts.length})`}
            </button>
            <button
              onClick={() => setFilter("ACTIVE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === "ACTIVE" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {lang === "en" ? `Active in Escrow (${activeCount})` : `চলতি কাজ (${activeCount})`}
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === "COMPLETED" ? "bg-white text-purple-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {lang === "en" ? `Completed (${completedCount})` : `সম্পন্ন (${completedCount})`}
            </button>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === "en" ? "Search by contract, client or title..." : "কন্ট্রাক্ট, ক্লায়েন্ট বা শিরোনাম খুঁজুন..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
            />
          </div>
        </div>

        {/* Contract Cards Grid */}
        <div className="space-y-4">
          {filteredContracts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No contracts matched your search</h3>
              <p className="text-xs text-slate-500">Try tweaking your search terms or filters.</p>
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const completedMilestones = contract.milestones.filter(
                (m) => m.status === "APPROVED_RELEASED" || m.status === "APPROVED_AND_RELEASED"
              ).length;
              const totalMilestones = contract.milestones.length;
              const progressPct = Math.round((completedMilestones / totalMilestones) * 100);

              return (
                <div
                  key={contract.id}
                  className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Metadata & Titles */}
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {contract.contractCode}
                        </span>

                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                          {contract.category}
                        </span>

                        {contract.stage === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            {lang === "en" ? "Active Milestone in Progress" : "চলতি মাইলস্টোন"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                            {lang === "en" ? "Fully Completed & Paid" : "সম্পূর্ণ পরিশোধিত"}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {lang === "en" ? contract.title : (contract.titleBn || contract.title)}
                      </h3>

                      {/* Client & Freelancer Pill Row */}
                      <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <img
                            src={contract.client.avatar}
                            alt={contract.client.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <span className="text-slate-400 font-medium">Client: </span>
                            <span className="font-bold text-slate-800">{contract.client.name}</span>
                            <span className="text-slate-400"> ({contract.client.company})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <img
                            src={contract.freelancer.avatar}
                            alt={contract.freelancer.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <span className="text-slate-400 font-medium">Talent: </span>
                            <span className="font-bold text-slate-800">{contract.freelancer.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Deadline: {contract.deadlineDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Milestone Progress & Financials */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 lg:border-l lg:border-slate-100 lg:pl-8">
                      <div className="space-y-1 text-left sm:text-right lg:text-right">
                        <div className="text-xs font-semibold text-slate-400">Total Contract Value</div>
                        <div className="text-xl font-black text-slate-900">
                          ৳{contract.totalBdt.toLocaleString()} <span className="text-xs font-bold text-slate-400">BDT</span>
                        </div>
                        <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 lg:justify-end">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {contract.escrowHeldBdt > 0
                              ? `৳${contract.escrowHeldBdt.toLocaleString()} in Escrow Custody`
                              : "All Funds Released"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full sm:w-48 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Milestones</span>
                          <span>{completedMilestones}/{totalMilestones} ({progressPct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPct === 100 ? "bg-emerald-500" : "bg-sky-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Open Workspace Button */}
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
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
