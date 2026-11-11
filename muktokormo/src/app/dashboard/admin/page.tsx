"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Wallet,
  RotateCcw,
  AlertTriangle,
  Percent,
  Clock,
  Filter,
  Loader2,
  X,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SectionHeading, StatCard } from "@/components/dashboard/Primitives";
import PaymentHistoryTable from "@/components/payments/PaymentHistoryTable";
import PaymentDetailModal from "@/components/payments/PaymentDetailModal";
import { ADMIN_NAV } from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
import {
  ESCROW_SIMULATION_DISCLAIMER,
  ESCROW_SIMULATION_DISCLAIMER_BN,
} from "@/lib/payments/escrow";
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
import type {
  AdminPaymentDashboardPayload,
  AdminRefundRequestItem,
  PaymentDashboardItem,
} from "@/types/payment";

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

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const { name, email, role, loading: userLoading } = useCurrentUser();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const tabParam = searchParams ? searchParams.get("tab") : null;
  const [activeTab, setActiveTab] = useState<string>(tabParam || "overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [proposals, setProposals] = useState<AdminProposalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [moderatingProjectId, setModeratingProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Admin Payments & Escrow State
  const [paymentDashboard, setPaymentDashboard] =
    useState<AdminPaymentDashboardPayload | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [txQuery, setTxQuery] = useState("");
  const [txStatus, setTxStatus] = useState("ALL");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    q: "",
    status: "ALL",
    from: "",
    to: "",
  });
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentDashboardItem | null>(null);
  const [activeRefundModal, setActiveRefundModal] = useState<{
    refund: AdminRefundRequestItem;
    mode: "APPROVE_SIMULATED" | "APPROVE_GATEWAY" | "REJECT";
  } | null>(null);
  const [refundAdminNotes, setRefundAdminNotes] = useState("");
  const [moderatingRefundId, setModeratingRefundId] = useState<string | null>(null);
  const [refundActionNotice, setRefundActionNotice] = useState<{
    tone: "emerald" | "rose" | "amber";
    text: string;
  } | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    if (userLoading) return;
    if (role === "client") router.replace("/dashboard/client");
    else if (role === "freelancer") router.replace("/dashboard/freelancer");
  }, [userLoading, role, router]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all([
      fetchAdminOverview(supabase),
      fetchManagedUsers(supabase),
      fetchAdminRecentProjects(supabase, 10),
      fetchAdminRecentProposals(supabase, 10),
    ])
      .then(([overviewData, managedUsers, recentProjects, recentProposals]) => {
        if (cancelled) return;
        setOverview(overviewData);
        setUsers(managedUsers);
        setProjects(recentProjects);
        setProposals(recentProposals);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, isAdmin, refreshTick]);

  const fetchAdminPayments = useCallback(
    async (params: {
      q: string;
      status: string;
      from: string;
      to: string;
    }): Promise<AdminPaymentDashboardPayload> => {
      const qs = new URLSearchParams();
      if (params.q.trim()) qs.set("q", params.q.trim());
      if (params.status && params.status !== "ALL")
        qs.set("status", params.status);
      if (params.from) qs.set("from", params.from);
      if (params.to) qs.set("to", params.to);

      const response = await fetch(`/api/admin/payments?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as
        | AdminPaymentDashboardPayload
        | { ok?: false; error?: string };

      if (!response.ok || !data || !("ok" in data) || !data.ok) {
        throw new Error(
          (data as { error?: string })?.error ||
            "Failed to load platform payment telemetry."
        );
      }
      return data;
    },
    []
  );

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchAdminPayments(appliedFilters)
      .then((payload) => {
        if (cancelled) return;
        setPaymentDashboard(payload);
        setPaymentsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setPaymentsError(
          err instanceof Error
            ? err.message
            : "Unable to load admin payment records."
        );
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, refreshTick, appliedFilters, fetchAdminPayments]);

  const handleApplyPaymentFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentsLoading(true);
    setAppliedFilters({
      q: txQuery,
      status: txStatus,
      from: txFrom,
      to: txTo,
    });
  };

  const handleResetPaymentFilters = () => {
    setTxQuery("");
    setTxStatus("ALL");
    setTxFrom("");
    setTxTo("");
    setPaymentsLoading(true);
    setAppliedFilters({ q: "", status: "ALL", from: "", to: "" });
  };

  const handleAdminRefundAction = async (params: {
    refundId: string;
    action: "APPROVE" | "REJECT" | "CHECK_GATEWAY_STATUS";
    refundMode?: "SIMULATED_INTERNAL" | "SSLCOMMERZ_SANDBOX_API";
    adminNotes?: string;
  }) => {
    setRefundActionNotice(null);
    setModeratingRefundId(params.refundId);
    try {
      const response = await fetch(`/api/admin/refunds/${params.refundId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: params.action,
          ...(params.refundMode ? { refundMode: params.refundMode } : {}),
          ...(params.adminNotes?.trim() ? { adminNotes: params.adminNotes.trim() } : {}),
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        status?: string;
        refundMode?: string;
        gatewayStatus?: string;
        refundRefId?: string;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setRefundActionNotice({
          tone: "rose",
          text: data.error || "Unable to complete admin refund action.",
        });
        setRefreshTick((t) => t + 1);
        return;
      }

      setActiveRefundModal(null);
      setRefundAdminNotes("");

      if (data.status === "GATEWAY_INITIATED") {
        setRefundActionNotice({
          tone: "amber",
          text:
            data.message ||
            `SSLCOMMERZ Sandbox refund initiated (Ref: ${data.refundRefId ?? "pending"}). Click "Check Gateway Status" to verify final settlement.`,
        });
      } else if (data.status === "REJECTED") {
        setRefundActionNotice({
          tone: "amber",
          text: "Refund request rejected. Original contract payment restored to FUNDED.",
        });
      } else if (data.status === "FAILED") {
        setRefundActionNotice({
          tone: "rose",
          text: "SSLCOMMERZ Sandbox cancelled the gateway refund. Contract payment restored to FUNDED.",
        });
      } else {
        setRefundActionNotice({
          tone: "emerald",
          text:
            data.refundMode === "SSLCOMMERZ_SANDBOX_API"
              ? `SSLCOMMERZ Sandbox gateway refund confirmed (${data.refundRefId ?? "REFUNDED"}) and REFUND ledger entry recorded.`
              : "Simulated internal escrow refund approved and REFUND ledger entry recorded.",
        });
      }

      setPaymentsLoading(true);
      setRefreshTick((t) => t + 1);
    } catch {
      setRefundActionNotice({
        tone: "rose",
        text: "Network error contacting /api/admin/refunds endpoint.",
      });
    } finally {
      setModeratingRefundId(null);
    }
  };

  const handleToggleProjectStatus = async (projectId: string, currentStatus: string) => {
    if (moderatingProjectId) return;
    const nextDbStatus = currentStatus === "OPEN" ? "closed" : "open";
    setModeratingProjectId(projectId);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: nextDbStatus })
        .eq("id", projectId);
      if (!error) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, status: nextDbStatus.toUpperCase() } : p
          )
        );
        setOverview((prev) =>
          prev
            ? {
                ...prev,
                openProjects:
                  nextDbStatus === "open"
                    ? prev.openProjects + 1
                    : Math.max(0, prev.openProjects - 1),
              }
            : prev
        );
      }
    } finally {
      setModeratingProjectId(null);
    }
  };

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
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
            <span>{lang === "en" ? "Refresh data" : "ডেটা রিফ্রেশ"}</span>
          </button>
        </div>

        {/* Tab Quick Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "overview", label: "Overview", labelBn: "সংক্ষিপ্ত বিবরণ" },
            { id: "payments", label: "Payments & Escrow", labelBn: "পেমেন্ট ও এসক্রো" },
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

            {/* Role distribution + Visual Coverage Bar */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <SectionHeading
                  title="User role distribution"
                  titleBn="ইউজারের ভূমিকা বণ্টন"
                  subtitle="Profile coverage across the platform"
                  subtitleBn="প্ল্যাটফর্মে প্রোফাইল কভারেজ"
                  lang={lang}
                />

                {overview.totalUsers > 0 && (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>{lang === "en" ? "Marketplace Composition" : "মার্কেটপ্লেস গঠন"}</span>
                      <span>{overview.totalUsers} {lang === "en" ? "registered accounts" : "নিবন্ধিত অ্যাকাউন্ট"}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        style={{ width: `${Math.round((overview.clients / overview.totalUsers) * 100)}%` }}
                        className="bg-sky-500 h-full transition-all"
                        title={`Clients: ${overview.clients}`}
                      />
                      <div
                        style={{ width: `${Math.round((overview.freelancers / overview.totalUsers) * 100)}%` }}
                        className="bg-emerald-600 h-full transition-all"
                        title={`Freelancers: ${overview.freelancers}`}
                      />
                      <div
                        style={{ width: `${Math.round((overview.admins / overview.totalUsers) * 100)}%` }}
                        className="bg-slate-900 h-full transition-all"
                        title={`Admins: ${overview.admins}`}
                      />
                      <div
                        style={{ width: `${Math.round((overview.profilesMissing / overview.totalUsers) * 100)}%` }}
                        className="bg-amber-400 h-full transition-all"
                        title={`Incomplete Profiles: ${overview.profilesMissing}`}
                      />
                    </div>
                  </div>
                )}

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
                <table className="w-full min-w-[740px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {[
                        { en: "Job", bn: "কাজ" },
                        { en: "Client", bn: "ক্লায়েন্ট" },
                        { en: "Budget", bn: "বাজেট" },
                        { en: "Proposals", bn: "আবেদন" },
                        { en: "Status", bn: "অবস্থা" },
                        { en: "Posted", bn: "পোস্ট" },
                        { en: "Moderation", bn: "মডারেশন" },
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
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-400">
                          {lang === "en" ? "No job posts found yet." : "এখনও কোনো কাজ পোস্ট করা হয়নি।"}
                        </td>
                      </tr>
                    )}
                    {projects.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 sm:px-5 py-3.5">
                          <Link
                            href={`/jobs/${row.id}`}
                            className="text-xs font-bold text-slate-900 hover:text-emerald-700 leading-snug truncate max-w-[240px] block"
                          >
                            {row.title}
                          </Link>
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
                        <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                          {(row.status === "OPEN" || row.status === "CLOSED") && (
                            <button
                              type="button"
                              disabled={moderatingProjectId === row.id}
                              onClick={() => handleToggleProjectStatus(row.id, row.status)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                                row.status === "OPEN"
                                  ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {row.status === "OPEN"
                                ? lang === "en"
                                  ? "Close Post"
                                  : "বন্ধ করুন"
                                : lang === "en"
                                  ? "Reopen Post"
                                  : "চালু করুন"}
                            </button>
                          )}
                        </td>
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

        {/* Payments, Escrow & Refund Management Section */}
        {(activeTab === "overview" || activeTab === "payments") && (
          <div id="payments" className="space-y-5">
            <SectionHeading
              title="Payments, Escrow & Commission Telemetry"
              titleBn="পেমেন্ট, এসক্রো ও প্ল্যাটফর্ম কমিশন"
              subtitle="Live SSLCOMMERZ Sandbox settlement volume, simulated escrow custody, and platform commission"
              subtitleBn="SSLCOMMERZ স্যান্ডবক্স লেনদেন, সিমুলেটেড এসক্রো ও প্ল্যাটফর্ম কমিশন"
              lang={lang}
            />

            {/* Academic Simulation Disclosure */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {lang === "en"
                  ? ESCROW_SIMULATION_DISCLAIMER
                  : ESCROW_SIMULATION_DISCLAIMER_BN}
              </p>
            </div>

            {paymentsError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{paymentsError}</span>
              </div>
            )}

            {/* Admin Payment Metrics Grid (All derived strictly from Supabase) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                icon={Wallet}
                label="Total Payment Volume"
                labelBn="মোট পেমেন্ট ভলিউম"
                value={formatBdt(paymentDashboard?.summary.totalPaymentVolumeBdt ?? 0)}
                delta={
                  lang === "en"
                    ? `${paymentDashboard?.summary.fundedPaymentsCount ?? 0} funded · ${paymentDashboard?.summary.releasedPaymentsCount ?? 0} released`
                    : `${paymentDashboard?.summary.fundedPaymentsCount ?? 0} ফান্ডেড · ${paymentDashboard?.summary.releasedPaymentsCount ?? 0} রিলিজড`
                }
                lang={lang}
                accent="emerald"
              />
              <StatCard
                icon={ShieldCheck}
                label="Total Funded Escrow"
                labelBn="মোট ফান্ডেড এসক্রো"
                value={formatBdt(paymentDashboard?.summary.fundedPaymentsAmountBdt ?? 0)}
                delta={
                  lang === "en"
                    ? `${paymentDashboard?.summary.fundedPaymentsCount ?? 0} funded payments`
                    : `${paymentDashboard?.summary.fundedPaymentsCount ?? 0}টি ফান্ডেড পেমেন্ট`
                }
                lang={lang}
                accent="sky"
              />
              <StatCard
                icon={CheckCircle2}
                label="Total Released Payments"
                labelBn="মোট রিলিজড পেমেন্ট"
                value={formatBdt(paymentDashboard?.summary.releasedPaymentsAmountBdt ?? 0)}
                delta={
                  lang === "en"
                    ? `${paymentDashboard?.summary.releasedPaymentsCount ?? 0} completed releases`
                    : `${paymentDashboard?.summary.releasedPaymentsCount ?? 0}টি সম্পন্ন রিলিজ`
                }
                lang={lang}
                accent="violet"
              />
              <StatCard
                icon={Percent}
                label="Platform Commission (10%)"
                labelBn="প্ল্যাটফর্ম কমিশন (১০%)"
                value={formatBdt(
                  paymentDashboard?.summary.platformCommissionEarnedBdt ?? 0
                )}
                delta={
                  lang === "en"
                    ? `Pending escrow fee: ${formatBdt(paymentDashboard?.summary.projectedCommissionBdt ?? 0)}`
                    : `অপেক্ষমাণ কমিশন: ${formatBdt(paymentDashboard?.summary.projectedCommissionBdt ?? 0)}`
                }
                lang={lang}
                accent="amber"
              />
            </div>

            {/* Operational Queue Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Pending Payments" : "অপেক্ষমান পেমেন্ট"}</span>
                </div>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {paymentDashboard?.summary.pendingPaymentsCount ?? 0}
                </p>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Failed / Cancelled" : "ব্যর্থ / বাতিল"}</span>
                </div>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {(paymentDashboard?.summary.failedPaymentsCount ?? 0) +
                    (paymentDashboard?.summary.cancelledPaymentsCount ?? 0)}
                  <span className="text-[11px] font-semibold text-slate-400 ml-1.5">
                    ({paymentDashboard?.summary.failedPaymentsCount ?? 0} failed)
                  </span>
                </p>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Refund Requests" : "রিফান্ড অনুরোধ"}</span>
                </div>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {paymentDashboard?.summary.refundRequestsCount ?? 0}
                  <span className="text-[11px] font-semibold text-indigo-600 ml-1.5">
                    ({paymentDashboard?.summary.pendingRefundRequestsCount ?? 0} pending)
                  </span>
                </p>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Refunded Total" : "মোট রিফান্ড"}</span>
                </div>
                <p className="text-xl font-black text-slate-900 mt-1">
                  {formatBdt(paymentDashboard?.summary.refundedAmountBdt ?? 0)}
                </p>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <form
              onSubmit={handleApplyPaymentFilters}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
            >
              <div className="lg:col-span-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  {lang === "en"
                    ? "Search Transaction ID / Contract / Party"
                    : "ট্রানজেকশন আইডি বা চুক্তি খুঁজুন"}
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={txQuery}
                    onChange={(e) => setTxQuery(e.target.value)}
                    placeholder="e.g. MK-... or val_id or contract code"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  {lang === "en" ? "Payment Status" : "স্ট্যাটাস"}
                </label>
                <select
                  value={txStatus}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setTxStatus(nextStatus);
                    setPaymentsLoading(true);
                    setAppliedFilters((prev) => ({ ...prev, status: nextStatus }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="FUNDED">Funded</option>
                  <option value="RELEASED">Released</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUND_REQUESTED">Refund Requested</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  {lang === "en" ? "From Date" : "শুরুর তারিখ"}
                </label>
                <input
                  type="date"
                  value={txFrom}
                  onChange={(e) => {
                    const nextFrom = e.target.value;
                    setTxFrom(nextFrom);
                    setPaymentsLoading(true);
                    setAppliedFilters((prev) => ({ ...prev, from: nextFrom }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  {lang === "en" ? "To Date" : "শেষ তারিখ"}
                </label>
                <input
                  type="date"
                  value={txTo}
                  onChange={(e) => {
                    const nextTo = e.target.value;
                    setTxTo(nextTo);
                    setPaymentsLoading(true);
                    setAppliedFilters((prev) => ({ ...prev, to: nextTo }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="lg:col-span-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Apply" : "ফিল্টার"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetPaymentFilters}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {lang === "en" ? "Reset" : "রিসেট"}
                </button>
              </div>
            </form>

            {/* Transaction History Table */}
            <PaymentHistoryTable
              payments={paymentDashboard?.payments ?? []}
              viewerRole="admin"
              lang={lang}
              loading={paymentsLoading}
              onViewDetails={(payment) => setSelectedPayment(payment)}
              emptyTitle={
                lang === "en"
                  ? "No transactions match these filters"
                  : "এই ফিল্টারে কোনো লেনদেন পাওয়া যায়নি"
              }
              emptySubtitle={
                lang === "en"
                  ? "Adjust your Transaction ID query, status filter, or date range to inspect platform payments."
                  : "ট্রানজেকশন আইডি, স্ট্যাটাস বা তারিখ পরিবর্তন করে পুনরায় দেখুন।"
              }
            />

            {/* Refund Requests Queue & Admin Moderation Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>
                    {lang === "en"
                      ? `Refund Request Queue (${paymentDashboard?.refundRequests.length ?? 0})`
                      : `রিফান্ড অনুরোধ তালিকা (${paymentDashboard?.refundRequests.length ?? 0})`}
                  </span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  {paymentDashboard?.summary.pendingRefundRequestsCount ?? 0}{" "}
                  {lang === "en" ? "pending review" : "পর্যালোচনার অপেক্ষায়"}
                </span>
              </div>

              {refundActionNotice && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start justify-between gap-2 ${
                    refundActionNotice.tone === "emerald"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : refundActionNotice.tone === "amber"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}
                >
                  <span>{refundActionNotice.text}</span>
                  <button
                    type="button"
                    onClick={() => setRefundActionNotice(null)}
                    className="p-0.5 opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!paymentDashboard || paymentDashboard.refundRequests.length === 0 ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center text-xs text-slate-500">
                  {lang === "en"
                    ? "No client refund requests recorded yet."
                    : "এখনো কোনো রিফান্ড অনুরোধ জমা পড়েনি।"}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {paymentDashboard.refundRequests.map((rf) => {
                    const isBusy = moderatingRefundId === rf.id;
                    const statusStyle =
                      rf.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : rf.status === "REJECTED" || rf.status === "FAILED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : rf.status === "GATEWAY_INITIATED"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-800 border-amber-200";
                    return (
                      <div
                        key={rf.id}
                        className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {rf.transaction_id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusStyle}`}
                            >
                              {rf.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {rf.refund_mode}
                            </span>
                            {rf.gateway_status && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-600">
                                GW: {rf.gateway_status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {rf.contract_title} ({rf.contract_code})
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {rf.client_name} → {rf.freelancer_name} · Reason: {rf.reason}
                          </p>
                          {rf.gateway_refund_ref_id && (
                            <p className="text-[10px] font-mono text-indigo-700">
                              Refund Ref: {rf.gateway_refund_ref_id}
                            </p>
                          )}
                          {rf.admin_notes && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 inline-block">
                              Note: {rf.admin_notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-2.5 shrink-0">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-black text-slate-900">
                              {formatBdt(rf.amount)}
                            </p>
                            <Link
                              href={`/contracts/${rf.contract_id}`}
                              className="text-[11px] font-bold text-emerald-700 hover:underline"
                            >
                              {lang === "en" ? "Open Contract" : "চুক্তি দেখুন"}
                            </Link>
                          </div>

                          {rf.status === "PENDING" && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setRefundAdminNotes(rf.admin_notes ?? "");
                                  setActiveRefundModal({
                                    refund: rf,
                                    mode: "APPROVE_SIMULATED",
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {lang === "en" ? "Simulated Refund" : "সিমুলেটেড রিফান্ড"}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setRefundAdminNotes(rf.admin_notes ?? "");
                                  setActiveRefundModal({
                                    refund: rf,
                                    mode: "APPROVE_GATEWAY",
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {lang === "en" ? "SSLCOMMERZ API" : "স্যান্ডবক্স এপিআই"}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setRefundAdminNotes(rf.admin_notes ?? "");
                                  setActiveRefundModal({
                                    refund: rf,
                                    mode: "REJECT",
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {lang === "en" ? "Reject" : "বাতিল"}
                              </button>
                            </div>
                          )}

                          {rf.status === "GATEWAY_INITIATED" && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleAdminRefundAction({
                                    refundId: rf.id,
                                    action: "CHECK_GATEWAY_STATUS",
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isBusy ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                                <span>
                                  {lang === "en"
                                    ? "Check Gateway Status"
                                    : "গেটওয়ে স্ট্যাটাস দেখুন"}
                                </span>
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setRefundAdminNotes(rf.admin_notes ?? "");
                                  setActiveRefundModal({
                                    refund: rf,
                                    mode: "REJECT",
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {lang === "en" ? "Reject" : "বাতিল"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    {lang === "en" ? "Open disputes / Pending refunds" : "বিরোধ ও অপেক্ষমাণ রিফান্ড"}
                  </p>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {(paymentDashboard?.summary.openDisputesCount ?? 0) +
                    (paymentDashboard?.summary.pendingRefundRequestsCount ?? 0)}
                </p>
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
                    ? "Contracts settle via SSLCOMMERZ Sandbox verification and internal simulated escrow ledger entries."
                    : "চুক্তিসমূহ SSLCOMMERZ স্যান্ডবক্স যাচাই ও অভ্যন্তরীণ সিমুলেটেড এসক্রো লেজারের মাধ্যমে পরিচালিত।"}
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
                    {(paymentDashboard?.summary.openDisputesCount ?? 0) === 0
                      ? lang === "en"
                        ? "Zero Active Contract Disputes"
                        : "কোনো চুক্তি বিরোধ নেই"
                      : lang === "en"
                        ? `${paymentDashboard?.summary.openDisputesCount} Disputed Contract(s)`
                        : `${paymentDashboard?.summary.openDisputesCount}টি বিরোধপূর্ণ চুক্তি`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(paymentDashboard?.summary.pendingRefundRequestsCount ?? 0) > 0
                      ? lang === "en"
                        ? `${paymentDashboard?.summary.pendingRefundRequestsCount} pending refund request(s) awaiting admin decision.`
                        : `${paymentDashboard?.summary.pendingRefundRequestsCount}টি রিফান্ড অনুরোধ অ্যাডমিন সিদ্ধান্তের অপেক্ষায়।`
                      : lang === "en"
                        ? "No disputes pending arbitration right now."
                        : "এই মুহূর্তে কোনো বিরোধ মধ্যস্থতার অপেক্ষায় নেই।"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === "en" ? "Open Payments & Refunds" : "পেমেন্ট ও রিফান্ড দেখুন"}
              </button>
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

      <PaymentDetailModal
        payment={selectedPayment}
        viewerRole="admin"
        lang={lang}
        onClose={() => setSelectedPayment(null)}
      />

      {/* Admin Refund Decision Modal */}
      {activeRefundModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {activeRefundModal.mode === "APPROVE_SIMULATED"
                    ? lang === "en"
                      ? "Approve Simulated Internal Refund"
                      : "সিমুলেটেড অভ্যন্তরীণ রিফান্ড অনুমোদন"
                    : activeRefundModal.mode === "APPROVE_GATEWAY"
                      ? lang === "en"
                        ? "Initiate SSLCOMMERZ Sandbox Refund"
                        : "SSLCOMMERZ স্যান্ডবক্স রিফান্ড শুরু করুন"
                      : lang === "en"
                        ? "Reject Refund Request"
                        : "রিফান্ড অনুরোধ বাতিল করুন"}
                </h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {activeRefundModal.refund.transaction_id} ·{" "}
                  {formatBdt(activeRefundModal.refund.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRefundModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {activeRefundModal.refund.contract_title} (
                {activeRefundModal.refund.contract_code})
              </p>
              <p className="text-slate-600 text-[11px]">
                Client reason: {activeRefundModal.refund.reason}
              </p>
            </div>

            <div
              className={`p-3 rounded-2xl border text-[11px] leading-relaxed ${
                activeRefundModal.mode === "APPROVE_SIMULATED"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : activeRefundModal.mode === "APPROVE_GATEWAY"
                    ? "bg-sky-50/80 border-sky-200 text-sky-900"
                    : "bg-rose-50/80 border-rose-200 text-rose-900"
              }`}
            >
              {activeRefundModal.mode === "APPROVE_SIMULATED"
                ? "Simulated Internal Refund records an internal REFUND ledger entry (is_simulated = true), marks payment/contract REFUNDED, and performs NO real external bank transfer."
                : activeRefundModal.mode === "APPROVE_GATEWAY"
                  ? "Calls SSLCOMMERZ Sandbox merchantTransIDvalidationAPI.php using stored bank_tran_id. Status remains GATEWAY_INITIATED until SSLCOMMERZ explicitly confirms 'refunded'."
                  : "Rejects the refund request and restores the contract payment status back to FUNDED."}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === "en" ? "Admin Notes (Optional)" : "অ্যাডমিন নোট (ঐচ্ছিক)"}
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={refundAdminNotes}
                onChange={(e) => setRefundAdminNotes(e.target.value)}
                placeholder="Add moderation notes recorded for audit & client notification..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveRefundModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {lang === "en" ? "Cancel" : "বাতিল"}
              </button>
              <button
                type="button"
                disabled={Boolean(moderatingRefundId)}
                onClick={() =>
                  void handleAdminRefundAction({
                    refundId: activeRefundModal.refund.id,
                    action:
                      activeRefundModal.mode === "REJECT" ? "REJECT" : "APPROVE",
                    ...(activeRefundModal.mode !== "REJECT"
                      ? {
                          refundMode:
                            activeRefundModal.mode === "APPROVE_GATEWAY"
                              ? "SSLCOMMERZ_SANDBOX_API"
                              : "SIMULATED_INTERNAL",
                        }
                      : {}),
                    adminNotes: refundAdminNotes,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-white text-xs font-black cursor-pointer disabled:opacity-60 ${
                  activeRefundModal.mode === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : activeRefundModal.mode === "APPROVE_GATEWAY"
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {moderatingRefundId === activeRefundModal.refund.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {activeRefundModal.mode === "APPROVE_SIMULATED"
                    ? "Confirm Simulated Refund"
                    : activeRefundModal.mode === "APPROVE_GATEWAY"
                      ? "Call SSLCOMMERZ Refund API"
                      : "Confirm Reject"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400">
          Loading Admin Console...
        </div>
      }
    >
      <AdminDashboardContent />
    </React.Suspense>
  );
}