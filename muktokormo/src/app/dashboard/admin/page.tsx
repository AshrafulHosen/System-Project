"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Briefcase,
  Send,
  Handshake,
  Gavel,
  Search,
  RefreshCw,
  CheckCircle2,
  UserCircle,
  Info,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SectionHeading, StatCard } from "@/components/dashboard/Primitives";
import { ADMIN_NAV } from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAdminOverview,
  fetchAdminRecentProjects,
  fetchAdminRecentProposals,
  fetchManagedUsers,
  type AdminProjectRow,
  type AdminProposalRow,
} from "@/lib/data/admin";
import { AdminOverview, ManagedUser, ManagedUserType } from "@/types";

const USER_TYPE_STYLES: Record<
  ManagedUserType,
  { cls: string; label: string; labelBn: string }
> = {
  client: {
    cls: "bg-sky-50 text-sky-700 border-sky-200",
    label: "Client",
    labelBn: "ক্লায়েন্ট",
  },
  freelancer: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Freelancer",
    labelBn: "ফ্রিল্যান্সার",
  },
  none: {
    cls: "bg-slate-100 text-slate-600 border-slate-200",
    label: "None",
    labelBn: "কিছুই নয়",
  },
};

const PROJECT_STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-50 text-slate-600 border-slate-200",
  IN_PROGRESS: "bg-sky-50 text-sky-700 border-sky-200",
};

const PROPOSAL_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-50 text-slate-700 border-slate-200",
  SHORTLISTED: "bg-amber-50 text-amber-700 border-amber-200",
  INTERVIEW: "bg-violet-50 text-violet-700 border-violet-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { name, email, role, loading: userLoading } = useCurrentUser();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [proposals, setProposals] = useState<AdminProposalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = role === "admin";

  useEffect(() => {
    if (userLoading) return;
    if (role === "client") router.replace("/dashboard/client");
    else if (role === "freelancer") router.replace("/dashboard/freelancer");
  }, [userLoading, role, router]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const [overviewData, managedUsers, recentProjects, recentProposals] =
        await Promise.all([
          fetchAdminOverview(supabase),
          fetchManagedUsers(supabase),
          fetchAdminRecentProjects(supabase, 6),
          fetchAdminRecentProposals(supabase, 6),
        ]);
      if (cancelled) return;
      setOverview(overviewData);
      setUsers(managedUsers);
      setProjects(recentProjects);
      setProposals(recentProposals);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, isAdmin]);

  const displayName = name.trim() || (lang === "en" ? "Administrator" : "অ্যাডমিন");
  const firstName = displayName.split(" ")[0];

  const q = search.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    : users;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
        {lang === "en" ? "Loading…" : "লোড হচ্ছে…"}
      </div>
    );
  }

  return (
    <DashboardShell
      role="admin"
      nav={ADMIN_NAV}
      userName={displayName}
      userMeta={email}
      avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lang={lang}
      onToggleLang={() => setLang((prev) => (prev === "en" ? "bn" : "en"))}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-900">
                {lang === "en" ? "Platform Administration" : "প্ল্যাটফর্ম অ্যাডমিন"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {lang === "en" ? "Ops & moderation console" : "অপস ও মডারেশন কনসোল"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {lang === "en" ? (
                <>
                  Welcome back, <span className="text-emerald-600">{firstName}</span>
                </>
              ) : (
                <>
                  স্বাগতম, <span className="text-emerald-600">{firstName}</span>
                </>
              )}
            </h1>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              {email || (lang === "en" ? "Admin Account" : "অ্যাডমিন অ্যাকাউন্ট")}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "en"
                ? "Monitor platform health, review user signups, and moderate live job posts and proposals."
                : "প্ল্যাটফর্মের স্বাস্থ্য পর্যবেক্ষণ করুন, নতুন ইউজার যাচাই করুন এবং চলমান কাজ ও আবেদন মডারেট করুন।"}
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              setOverview(null);
              setUsers([]);
              setProjects([]);
              setProposals([]);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === "en" ? "Refresh data" : "ডেটা রিফ্রেশ"}</span>
          </button>
        </div>

        {/* Tab Quick Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "overview", label: "Overview", labelBn: "সংক্ষিপ্ত বিবরণ" },
            { id: "users", label: "User Management", labelBn: "ইউজার ব্যবস্থাপনা" },
            { id: "jobs", label: "Job Moderation", labelBn: "কাজের মডারেশন" },
            { id: "proposals", label: "Proposals", labelBn: "আবেদন" },
            { id: "contracts", label: "Contracts & Escrow", labelBn: "চুক্তি ও এসক্রো" },
            { id: "disputes", label: "Dispute Queue", labelBn: "বিরোধ তালিকা" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {lang === "en" ? tab.label : tab.labelBn}
            </button>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-[11px] font-bold text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            {lang === "en" ? "Syncing platform data…" : "প্ল্যাটফর্ম ডেটা সিঙ্ক হচ্ছে…"}
          </div>
        )}

        {!loading && overview && (
          <>
            {/* Stats Grid */}
            {(activeTab === "overview" || activeTab === "users") && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <StatCard
                  icon={Users}
                  label="Total users"
                  labelBn="মোট ইউজার"
                  value={String(overview.totalUsers)}
                  delta={`${overview.profilesMissing} without profile`}
                  lang={lang}
                  accent="emerald"
                />
                <StatCard
                  icon={Briefcase}
                  label="Open projects"
                  labelBn="চলমান প্রজেক্ট"
                  value={String(overview.openProjects)}
                  delta={`${overview.totalProjects} total posts`}
                  lang={lang}
                  accent="sky"
                />
                <StatCard
                  icon={Send}
                  label="Total proposals"
                  labelBn="মোট আবেদন"
                  value={String(overview.totalProposals)}
                  lang={lang}
                  accent="violet"
                />
                <StatCard
                  icon={Handshake}
                  label="Total contracts"
                  labelBn="মোট চুক্তি"
                  value={String(overview.totalContracts)}
                  lang={lang}
                  accent="amber"
                />
              </div>
            )}

            {/* Role distribution */}
            {activeTab === "overview" && (
              <div>
                <SectionHeading
                  title="User role distribution"
                  titleBn="ইউজারের ভূমিকা বণ্টন"
                  subtitle="Profile coverage across the platform"
                  subtitleBn="প্ল্যাটফর্মে প্রোফাইল কভারেজ"
                  lang={lang}
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {[
                    { label: "Clients", labelBn: "ক্লায়েন্ট", value: overview.clients, cls: "bg-sky-50 text-sky-700 border-sky-200" },
                    { label: "Freelancers", labelBn: "ফ্রিল্যান্সার", value: overview.freelancers, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    { label: "Administrators", labelBn: "অ্যাডমিন", value: overview.admins, cls: "bg-slate-900 text-white border-slate-900" },
                    { label: "No profile", labelBn: "প্রোফাইল নেই", value: overview.profilesMissing, cls: "bg-amber-50 text-amber-700 border-amber-200" },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className={`rounded-2xl border px-4 py-4 ${c.cls}`}
                    >
                      <p className="text-xl font-black">{c.value}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${c.cls.includes("text-white") ? "text-slate-300" : "opacity-70"}`}>
                        {lang === "en" ? c.label : c.labelBn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* User Management Tab */}
        {(activeTab === "overview" || activeTab === "users") && (
          <div id="users" className="space-y-4">
            <SectionHeading
              title="User management"
              titleBn="ইউজার ব্যবস্থাপনা"
              subtitle="Every registered account, its type and profile state"
              subtitleBn="সকল নিবন্ধিত অ্যাকাউন্ট, তাদের ধরন ও প্রোফাইল অবস্থা"
              lang={lang}
              action={
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={lang === "en" ? "Search name or email" : "নাম বা ইমেইল খুঁজুন"}
                    className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all w-full sm:w-56"
                  />
                </div>
              }
            />

            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {[
                        { en: "User", bn: "ইউজার" },
                        { en: "Email", bn: "ইমেইল" },
                        { en: "Type", bn: "ধরন" },
                        { en: "Role", bn: "ভূমিকা" },
                        { en: "Joined", bn: "যোগদান" },
                      ].map((h) => (
                        <th
                          key={h.en}
                          className="px-4 sm:px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500"
                        >
                          {lang === "en" ? h.en : h.bn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-400">
                          {lang === "en" ? "No users match your search." : "আপনার অনুসন্ধানে কোনো ইউজার নেই।"}
                        </td>
                      </tr>
                    )}
                    {filteredUsers.map((user) => {
                      const type = USER_TYPE_STYLES[user.type];
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 sm:px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                <UserCircle className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  {user.name}
                                  {user.isAdmin && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-slate-900 text-white">
                                      Admin
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{user.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-600">{user.email}</td>
                          <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${type.cls}`}>
                              {lang === "en" ? type.label : type.labelBn}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-500">
                            {user.isAdmin
                              ? lang === "en" ? "Platform staff" : "প্ল্যাটফর্ম স্টাফ"
                              : lang === "en" ? "Member" : "সদস্য"}
                          </td>
                          <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                            {user.joinedLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Job Moderation Tab */}
        {(activeTab === "overview" || activeTab === "jobs") && (
          <div id="jobs" className="space-y-4">
            <SectionHeading
              title="Recent job posts"
              titleBn="সাম্প্রতিক কাজের পোস্ট"
              subtitle="Latest live listings across the platform"
              subtitleBn="প্ল্যাটফর্মের সর্বশেষ প্রকাশিত কাজ"
              lang={lang}
            />

            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {[
                        { en: "Job", bn: "কাজ" },
                        { en: "Client", bn: "ক্লায়েন্ট" },
                        { en: "Budget", bn: "বাজেট" },
                        { en: "Proposals", bn: "আবেদন" },
                        { en: "Status", bn: "অবস্থা" },
                        { en: "Posted", bn: "পোস্ট" },
                      ].map((h) => (
                        <th
                          key={h.en}
                          className="px-4 sm:px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500"
                        >
                          {lang === "en" ? h.en : h.bn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projects.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 sm:px-5 py-3.5">
                          <p className="text-xs font-bold text-slate-900 leading-snug truncate max-w-[240px]">{row.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{row.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-600">{row.clientName}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-xs font-black text-slate-900 whitespace-nowrap">
                          {formatBdt(row.budgetBdt)}
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-xs font-black text-emerald-600">{row.proposalsCount}</td>
                        <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${PROJECT_STATUS_STYLES[row.status] ?? "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">{row.postedLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Proposals Tab */}
        {(activeTab === "overview" || activeTab === "proposals") && (
          <div id="proposals" className="space-y-4">
            <SectionHeading
              title="Recent proposals"
              titleBn="সাম্প্রতিক আবেদন"
              subtitle="Latest bids submitted by freelancers"
              subtitleBn="ফ্রিল্যান্সারদের সর্বশেষ বিড"
              lang={lang}
            />

            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {[
                        { en: "Proposal", bn: "আবেদন" },
                        { en: "Job", bn: "কাজ" },
                        { en: "Bid", bn: "বিড" },
                        { en: "Status", bn: "অবস্থা" },
                        { en: "Submitted", bn: "জমা" },
                      ].map((h) => (
                        <th
                          key={h.en}
                          className="px-4 sm:px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500"
                        >
                          {lang === "en" ? h.en : h.bn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {proposals.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 sm:px-5 py-3.5">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{row.freelancerName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{row.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-600 truncate max-w-[220px]">{row.jobTitle}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-xs font-black text-slate-900 whitespace-nowrap">
                          {formatBdt(row.bidBdt)}
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${PROPOSAL_STATUS_STYLES[row.status] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">{row.submittedLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Contracts & Escrow Tab */}
        {(activeTab === "overview" || activeTab === "contracts") && (
          <div id="contracts" className="space-y-4">
            <SectionHeading
              title="Contracts & platform escrow"
              titleBn="চুক্তি ও প্ল্যাটফর্ম এসক্রো"
              subtitle="Every active milestone-funded contract maintains escrow"
              subtitleBn="প্রতিটি সক্রিয় চুক্তির এসক্রো মাইলস্টোন অনুযায়ী চলে"
              lang={lang}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {lang === "en" ? "Total contracts" : "মোট চুক্তি"}
                  </p>
                </div>
                <p className="text-2xl font-black text-slate-900">{overview?.totalContracts ?? 0}</p>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Gavel className="w-4 h-4 text-amber-600" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {lang === "en" ? "Open disputes" : "চলমান বিরোধ"}
                  </p>
                </div>
                <p className="text-2xl font-black text-slate-900">0</p>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    {lang === "en" ? "Escrow protection" : "এসক্রো সুরক্ষা"}
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === "en"
                    ? "Every contract is milestone funded via MFS escrow."
                    : "প্রতিটি চুক্তি এমএফএস এসক্রোতে মাইলস্টোন ভিত্তিক।"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Queue Tab */}
        {(activeTab === "overview" || activeTab === "disputes") && (
          <div id="disputes" className="space-y-4">
            <SectionHeading
              title="Escrow dispute & arbitration queue"
              titleBn="এসক্রো বিরোধ ও মধ্যস্থতা তালিকা"
              subtitle="Inspect open disputes and release rulings"
              subtitleBn="চলমান বিরোধ দেখুন এবং রায় দিন"
              lang={lang}
            />
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {lang === "en" ? "Queue is clear" : "তালিকা খালি"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "en"
                      ? "No disputes pending arbitration right now."
                      : "এই মুহূর্তে কোনো বিরোধ মধ্যস্থতার অপেক্ষায় নেই।"}
                  </p>
                </div>
              </div>

              <Link
                href="/contracts"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                {lang === "en" ? "Review Escrow Rules" : "এসক্রো নিয়মাবলী দেখুন"}
              </Link>
            </div>
          </div>
        )}

        {/* System notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {lang === "en"
              ? "Admin accounts are provisioned directly in the database. An admin has no client or freelancer profile — "
              : "অ্যাডমিন অ্যাকাউন্ট সরাসরি ডেটাবেসে তৈরি হয়। অ্যাডমিনের কোনো ক্লায়েন্ট বা ফ্রিল্যান্সার প্রোফাইল নেই — "}
            <Link
              href="/login"
              className="font-black underline underline-offset-2 hover:text-amber-900"
            >
              {lang === "en" ? "Route to the login page" : "লগইন পেজে যান"}
            </Link>
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}