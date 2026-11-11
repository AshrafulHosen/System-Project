"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Star,
  Upload,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContractPaymentSection from "@/components/payments/ContractPaymentSection";
import WorkDeliverySection from "@/components/payments/WorkDeliverySection";
import EscrowLedgerCard from "@/components/payments/EscrowLedgerCard";
import { INITIAL_WORKSPACE_CONTRACTS } from "@/data/mockContracts";
import { isUuid, parseProposalContractAlias } from "@/lib/payments/constants";
import { formatBdt } from "@/lib/format";
import type { WorkspaceContract } from "@/types";
import type {
  EscrowLedgerRecord,
  PaymentRecord,
  PaymentTransactionRecord,
  RefundRequestRecord,
} from "@/types/payment";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface LiveContractApiPayload {
  ok: boolean;
  error?: string;
  viewerRole?: "client" | "freelancer" | "admin";
  contract?: WorkspaceContract;
  ledger?: EscrowLedgerRecord[];
  payments?: PaymentRecord[];
  transactions?: PaymentTransactionRecord[];
  refunds?: RefundRequestRecord[];
}

function formatIsoDate(iso?: string | null): string {
  if (!iso) return "Just now";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

const LEGACY_DEMO_CONTRACT_IDS = new Set([
  "ctr-1",
  "ctr-2",
  "ctr-f1",
  "ctr-f2",
  "ctr-f3",
  ...INITIAL_WORKSPACE_CONTRACTS.flatMap((c) => [
    c.id.toLowerCase(),
    c.contractCode.toLowerCase(),
  ]),
]);

function ContractWorkspaceContent({ contractId }: { contractId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));

  const proposalAliasId = parseProposalContractAlias(contractId);
  const isDatabaseTarget: boolean =
    isUuid(contractId) || Boolean(proposalAliasId);
  const isKnownDemoSample: boolean =
    !isDatabaseTarget &&
    LEGACY_DEMO_CONTRACT_IDS.has(contractId.trim().toLowerCase());

  const resolvedContractUuidRef = useRef<string | null>(
    isUuid(contractId) ? contractId : null
  );

  const [loading, setLoading] = useState<boolean>(isDatabaseTarget);
  const [authState, setAuthState] = useState<
    "ok" | "unauthenticated" | "forbidden" | "not_found" | "error"
  >(isDatabaseTarget || isKnownDemoSample ? "ok" : "not_found");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewerRole, setViewerRole] = useState<"client" | "freelancer" | "admin">("client");
  const [contract, setContract] = useState<WorkspaceContract | null>(() => {
    if (!isKnownDemoSample) return null;
    return (
      INITIAL_WORKSPACE_CONTRACTS.find(
        (c) =>
          c.id.toLowerCase() === contractId.trim().toLowerCase() ||
          c.contractCode.toLowerCase() === contractId.trim().toLowerCase()
      ) || INITIAL_WORKSPACE_CONTRACTS[0]
    );
  });
  const [ledger, setLedger] = useState<EscrowLedgerRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRequestRecord[]>([]);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

  const paymentCallbackStatus = searchParams.get("payment");
  const callbackTranId = searchParams.get("tran_id");
  const callbackReason = searchParams.get("reason");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const applyResolvedPayload = useCallback(
    (data: LiveContractApiPayload) => {
      if (!data.contract) return;
      if (isUuid(data.contract.id)) {
        resolvedContractUuidRef.current = data.contract.id;
        if (
          typeof window !== "undefined" &&
          data.contract.id.toLowerCase() !== contractId.toLowerCase()
        ) {
          const query = window.location.search || "";
          window.history.replaceState(
            null,
            "",
            `/contracts/${data.contract.id}${query}`
          );
        }
      }
      setAuthState("ok");
      setViewerRole(data.viewerRole ?? "client");
      setContract(data.contract);
      setLedger(data.ledger ?? []);
      setPayments(data.payments ?? []);
      setTransactions(data.transactions ?? []);
      setRefunds(data.refunds ?? []);
    },
    [contractId]
  );

  const fetchLiveContract = useCallback(async () => {
    if (!isDatabaseTarget) return;
    setLoading(true);
    setLoadError(null);
    try {
      const targetId = resolvedContractUuidRef.current ?? contractId;
      const response = await fetch(`/api/contracts/${targetId}`, {
        cache: "no-store",
      });

      if (response.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      if (response.status === 403) {
        setAuthState("forbidden");
        return;
      }
      if (response.status === 404) {
        setAuthState("not_found");
        return;
      }

      const data = (await response.json()) as LiveContractApiPayload;
      if (!response.ok || !data.ok || !data.contract) {
        setAuthState("error");
        setLoadError(data.error || "Unable to load contract workspace.");
        return;
      }

      applyResolvedPayload(data);
    } catch {
      setAuthState("error");
      setLoadError("Network error fetching contract details.");
    } finally {
      setLoading(false);
    }
  }, [applyResolvedPayload, contractId, isDatabaseTarget]);

  useEffect(() => {
    if (!isDatabaseTarget) return;
    let active = true;

    (async () => {
      try {
        const targetId = resolvedContractUuidRef.current ?? contractId;
        const response = await fetch(`/api/contracts/${targetId}`, {
          cache: "no-store",
        });
        if (!active) return;

        if (response.status === 401) {
          setAuthState("unauthenticated");
          return;
        }
        if (response.status === 403) {
          setAuthState("forbidden");
          return;
        }
        if (response.status === 404) {
          setAuthState("not_found");
          return;
        }

        const data = (await response.json()) as LiveContractApiPayload;
        if (!active) return;

        if (!response.ok || !data.ok || !data.contract) {
          setAuthState("error");
          setLoadError(data.error || "Unable to load contract workspace.");
          return;
        }

        applyResolvedPayload(data);
      } catch {
        if (!active) return;
        setAuthState("error");
        setLoadError("Network error fetching contract details.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [applyResolvedPayload, contractId, isDatabaseTarget]);

  const dismissCallbackBanner = () => {
    setBannerDismissed(true);
    if (paymentCallbackStatus) {
      const targetId = resolvedContractUuidRef.current ?? contractId;
      router.replace(`/contracts/${targetId}`, { scroll: false });
    }
  };

  const handleApproveRelease = async () => {
    const liveUuid =
      contract?.id && isUuid(contract.id)
        ? contract.id
        : resolvedContractUuidRef.current;
    if (!liveUuid) {
      return { ok: false, error: "Preview sample contracts do not trigger database release." };
    }
    try {
      const response = await fetch(`/api/contracts/${liveUuid}/approve-release`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        grossAmount?: number;
        platformFee?: number;
        freelancerNet?: number;
      };
      if (!response.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || "Unable to approve work and release ledger payment.",
        };
      }
      return {
        ok: true,
        grossAmount: data.grossAmount,
        platformFee: data.platformFee,
        freelancerNet: data.freelancerNet,
      };
    } catch {
      return {
        ok: false,
        error: "Network error contacting internal escrow release endpoint.",
      };
    }
  };

  const handleSubmitRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const liveUuid =
      contract?.id && isUuid(contract.id)
        ? contract.id
        : resolvedContractUuidRef.current;
    if (!liveUuid) return;
    setRefundError(null);
    setRefundSuccess(null);
    setSubmittingRefund(true);
    try {
      const response = await fetch("/api/payments/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: liveUuid,
          reason: refundReason.trim(),
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        refundRequest?: RefundRequestRecord;
      };
      if (!response.ok || !data.ok) {
        setRefundError(data.error || "Unable to submit refund request.");
        return;
      }
      setRefundModalOpen(false);
      setRefundReason("");
      setRefundSuccess(
        lang === "en"
          ? "Refund request submitted and queued for Admin review."
          : "রিফান্ড অনুরোধ জমা হয়েছে ও অ্যাডমিন পর্যালোচনার অপেক্ষায় আছে।"
      );
      await fetchLiveContract();
    } catch {
      setRefundError("Network error submitting refund request.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const renderCallbackBanner = () => {
    if (!paymentCallbackStatus || bannerDismissed) return null;

    if (paymentCallbackStatus === "success") {
      return (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-black text-sm">
                Payment Verified & Recorded as Funded (Simulated Escrow Ledger)
              </p>
              <p className="text-emerald-800">
                SSLCOMMERZ Sandbox independently verified the transaction
                {callbackTranId ? ` (${callbackTranId})` : ""} and added a{" "}
                <strong>FUND</strong> entry to the internal escrow ledger.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissCallbackBanner}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (paymentCallbackStatus === "cancelled") {
      return (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-black text-sm">Payment Attempt Cancelled</p>
              <p>
                Your checkout session
                {callbackTranId ? ` (${callbackTranId})` : ""} was cancelled.
                You can retry funding whenever ready.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissCallbackBanner}
            className="text-amber-700 hover:text-amber-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-black text-sm">
              {paymentCallbackStatus === "verification_failed"
                ? "Payment Verification Rejected"
                : "Payment Attempt Failed"}
            </p>
            <p>
              Transaction{callbackTranId ? ` (${callbackTranId})` : ""} was not
              marked funded
              {callbackReason ? ` (reason: ${callbackReason})` : ""}. No escrow
              balance was credited; you may safely retry payment.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissCallbackBanner}
          className="text-rose-700 hover:text-rose-950 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (loading && !contract) {
    return (
      <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col">
        <Navbar
          onOpenPostJob={() => {}}
          lang={lang}
          onToggleLang={toggleLang}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 space-y-6 animate-pulse">
          <div className="h-14 rounded-2xl bg-slate-200/70" />
          <div className="h-52 rounded-3xl bg-slate-200/70" />
          <div className="h-64 rounded-3xl bg-slate-200/70" />
        </main>
        <Footer lang={lang} />
      </div>
    );
  }

  if ((isDatabaseTarget || !isKnownDemoSample) && authState !== "ok") {
    return (
      <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col">
        <Navbar
          onOpenPostJob={() => {}}
          lang={lang}
          onToggleLang={toggleLang}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs space-y-4">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <h1 className="text-xl font-black text-slate-900">
              {authState === "unauthenticated"
                ? "Sign in required to view this contract"
                : authState === "forbidden"
                  ? "Access Restricted"
                  : authState === "not_found"
                    ? "Contract Not Found"
                    : "Unable to Load Contract"}
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {authState === "unauthenticated"
                ? "Please sign in with the client, freelancer, or admin account associated with this contract."
                : authState === "forbidden"
                  ? "Only the client who created this contract, the assigned freelancer, or a platform admin can access this workspace."
                  : loadError ||
                    "The requested contract could not be located in Supabase."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {authState === "unauthenticated" ? (
                <Link
                  href={`/login?next=${encodeURIComponent(`/contracts/${contractId}`)}`}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                >
                  Log In to Continue
                </Link>
              ) : (
                <Link
                  href="/contracts"
                  className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Back to My Contracts
                </Link>
              )}
            </div>
          </div>
        </main>
        <Footer lang={lang} />
      </div>
    );
  }

  if (!contract) return null;

  const isLiveContract =
    isDatabaseTarget && Boolean(contract && isUuid(contract.id));

  const settledPayment =
    payments.find((p) =>
      ["FUNDED", "REFUND_REQUESTED", "RELEASED", "REFUNDED"].includes(p.status)
    ) ?? null;
  const latestPayment = settledPayment ?? payments[0] ?? contract.latestPayment ?? null;
  const openRefund =
    refunds.find((r) =>
      ["PENDING", "APPROVED", "GATEWAY_INITIATED"].includes(r.status)
    ) ?? null;
  const hasOpenOrCompletedRefund =
    Boolean(openRefund) ||
    refunds.some((r) => r.status === "COMPLETED") ||
    latestPayment?.status === "REFUND_REQUESTED";
  const canClientRequestRefund =
    isLiveContract &&
    viewerRole === "client" &&
    contract.paymentStatus === "FUNDED" &&
    contract.workStatus !== "RELEASED" &&
    contract.stage === "ACTIVE" &&
    settledPayment?.status === "FUNDED" &&
    !hasOpenOrCompletedRefund;

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar
        onOpenPostJob={() => {}}
        lang={lang}
        onToggleLang={toggleLang}
        searchQuery=""
        onSearchChange={() => {}}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {renderCallbackBanner()}

        {/* Breadcrumb & Authenticated Perspective Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "All Contracts" : "সকল কন্ট্রাক্ট"}</span>
            </Link>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {contract.contractCode}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {contract.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLiveContract ? (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {viewerRole === "admin"
                    ? "Verified Admin View"
                    : viewerRole === "client"
                      ? `Signed in as Client (${contract.client.name})`
                      : `Signed in as Freelancer (${contract.freelancer.name})`}
                </span>
              </span>
            ) : (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 px-2.5">
                  Demo Preview:
                </span>
                <button
                  type="button"
                  onClick={() => setViewerRole("freelancer")}
                  className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer ${
                    viewerRole === "freelancer"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  Freelancer
                </button>
                <button
                  type="button"
                  onClick={() => setViewerRole("client")}
                  className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer ${
                    viewerRole === "client"
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600"
                  }`}
                >
                  Client
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contract Header Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{contract.stage} Contract</span>
                </span>
                <span className="text-xs text-slate-400">
                  Started {formatIsoDate(contract.startedAt)} · Due{" "}
                  {formatIsoDate(contract.deadlineDate)}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {lang === "en"
                  ? contract.title
                  : contract.titleBn || contract.title}
              </h1>
            </div>

            <div className="text-left lg:text-right shrink-0">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                {lang === "en" ? "Total Contract Value" : "মোট চুক্তির মূল্য"}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {formatBdt(contract.totalBdt)}{" "}
                <span className="text-sm font-bold text-slate-500">BDT</span>
              </span>
            </div>
          </div>

          {/* Two-Party Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contract.client.avatar}
                alt={contract.client.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {lang === "en" ? "Employer / Client" : "ক্লায়েন্ট"}
                </span>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900">
                    {contract.client.name}
                  </h4>
                  {contract.client.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {contract.client.company} · {contract.client.location}
                </p>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{contract.client.rating.toFixed(1)} rating</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contract.freelancer.avatar}
                alt={contract.freelancer.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {lang === "en" ? "Assigned Freelancer" : "নিয়োজিত ফ্রিল্যান্সার"}
                </span>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900">
                    {contract.freelancer.name}
                  </h4>
                  {contract.freelancer.isNidVerified && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {contract.freelancer.title}
                </p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                  Payout: {contract.freelancer.payoutMethod}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage A Payment & SSLCOMMERZ Sandbox Section */}
        {isLiveContract ? (
          <ContractPaymentSection
            contract={contract}
            latestPayment={latestPayment}
            viewerRole={viewerRole}
            lang={lang}
            onPaymentVerified={fetchLiveContract}
          />
        ) : (
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Static sample contract preview (`{contract.contractCode}`). Open a
            live database contract from your Dashboard Workspace to initiate
            SSLCOMMERZ Sandbox checkout and internal escrow settlements.
          </div>
        )}

        {/* Phase 6 & 7: Work Delivery, Client Approval & Internal Release Section */}
        {isLiveContract && (
          <WorkDeliverySection
            contract={contract}
            viewerRole={viewerRole}
            lang={lang}
            hasOpenRefund={Boolean(openRefund) || latestPayment?.status === "REFUND_REQUESTED"}
            onWorkUpdated={fetchLiveContract}
            onApproveRelease={handleApproveRelease}
          />
        )}

        {/* Phase 5: Real Internal Escrow Ledger Card */}
        {isLiveContract && (
          <EscrowLedgerCard
            entries={ledger}
            paymentStatus={contract.paymentStatus}
            loading={loading}
            lang={lang}
            onRefresh={fetchLiveContract}
          />
        )}

        {/* Phase 9: Escrow Refund Request & Governance Status */}
        {isLiveContract && (canClientRequestRefund || refunds.length > 0 || refundSuccess) && (
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {lang === "en"
                      ? "Escrow Refund Request & Moderation Status"
                      : "এসক্রো রিফান্ড অনুরোধ ও পর্যালোচনা অবস্থা"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "en"
                      ? "Admin moderates funded escrow refunds as either Simulated Internal Ledger or SSLCOMMERZ Sandbox API."
                      : "অ্যাডমিন সিমুলেটেড লেজার বা SSLCOMMERZ স্যান্ডবক্স এপিআই-এর মাধ্যমে রিফান্ড যাচাই করেন।"}
                  </p>
                </div>
              </div>

              {canClientRequestRefund && (
                <button
                  type="button"
                  onClick={() => {
                    setRefundError(null);
                    setRefundModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {lang === "en" ? "Request Escrow Refund" : "রিফান্ডের অনুরোধ করুন"}
                  </span>
                </button>
              )}
            </div>

            {refundSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{refundSuccess}</span>
              </div>
            )}

            {refunds.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
                {lang === "en"
                  ? "This contract is currently Funded and unreleased. If collaboration is cancelled or deliverables cannot be fulfilled, the client may submit an admin-reviewed refund request."
                  : "এই কন্ট্রাক্টটি ফান্ডেড অবস্থায় আছে। প্রয়োজন হলে ক্লায়েন্ট অ্যাডমিন-পর্যালোচিত রিফান্ডের অনুরোধ করতে পারেন।"}
              </div>
            ) : (
              <div className="space-y-3">
                {refunds.map((rf) => {
                  const statusTone =
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
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">
                            {formatBdt(rf.amount)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusTone}`}
                          >
                            {rf.status}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                            {rf.refund_mode}
                          </span>
                          {rf.gateway_status && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-200/70 text-slate-700">
                              GW: {rf.gateway_status}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatIsoDate(rf.created_at)}
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900">
                          {lang === "en" ? "Client Reason: " : "কারণ: "}
                        </span>
                        {rf.reason}
                      </p>

                      {rf.admin_notes && (
                        <p className="text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200/70">
                          <span className="font-bold text-slate-900">
                            {lang === "en" ? "Admin Decision Note: " : "অ্যাডমিন নোট: "}
                          </span>
                          {rf.admin_notes}
                        </p>
                      )}

                      {rf.gateway_refund_ref_id && (
                        <p className="text-[11px] font-mono text-indigo-700">
                          Refund Reference ID: {rf.gateway_refund_ref_id}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Collaboration & Audit History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[340px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-black text-slate-900">
                    {lang === "en" ? "Contract Discussion" : "কন্ট্রাক্ট আলোচনা"}
                  </h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  TalkJS Workspace
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-2 text-xs text-emerald-900">
                <p className="font-bold">
                  Coordinate project milestones, revisions, and delivery handoffs
                  with your contract partner.
                </p>
                <p className="text-[11px] text-emerald-800">
                  All financial actions remain strictly protected inside
                  verified Supabase API routes.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href={`/messages?contractId=${contract.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {lang === "en"
                    ? "Open Real-Time Chat (TalkJS)"
                    : "লাইভ চ্যাট খুলুন (TalkJS)"}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-900">
                  {lang === "en"
                    ? "Gateway & Audit Event Log"
                    : "গেটওয়ে ও অডিট ইভেন্ট লগ"}
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {transactions.length > 0
                  ? `${transactions.length} Gateway Events`
                  : `${contract.activityLogs.length} Events`}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[280px]">
              {contract.activityLogs.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                    {act.badgeType === "ESCROW" ? (
                      <Lock className="w-3.5 h-3.5 text-sky-600" />
                    ) : act.badgeType === "PAYOUT" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : act.badgeType === "REVISION" ? (
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    ) : act.badgeType === "SUBMISSION" ? (
                      <Upload className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatIsoDate(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {act.details}
                    </p>
                    {act.trxId && (
                      <span className="inline-block text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {act.trxId}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {transactions.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Gateway Callback Telemetry
                  </p>
                  {transactions.slice(0, 6).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          {tx.event_type}
                        </span>{" "}
                        <span className="text-slate-500">
                          ({tx.gateway_status})
                        </span>
                      </div>
                      <span className="font-mono text-slate-500">
                        {tx.gateway_transaction_id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Client Refund Request Modal */}
      {refundModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {lang === "en"
                      ? "Request Escrow Refund"
                      : "এসক্রো রিফান্ডের অনুরোধ"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formatBdt(settledPayment?.amount ?? contract.totalBdt)} ·{" "}
                    {settledPayment?.transaction_id ?? contract.contractCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefundRequest} className="p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                {lang === "en"
                  ? "Refund amount is fixed on the server to your verified funded payment. Requests enter Admin review and may be finalized via Simulated Internal Ledger Refund or SSLCOMMERZ Sandbox Refund API."
                  : "রিফান্ডের পরিমাণ সার্ভার থেকে স্বয়ংক্রিয়ভাবে নির্ধারিত হয়। অ্যাডমিন পর্যালোচনার পর সিমুলেটেড বা স্যান্ডবক্স গেটওয়ে রিফান্ড সম্পন্ন হবে।"}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en" ? "Reason for Refund *" : "রিফান্ডের কারণ *"}
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1500}
                  rows={4}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Describe why this funded escrow contract requires a refund (at least 10 characters)..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {refundError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{refundError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {lang === "en" ? "Cancel" : "বাতিল"}
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-60"
                >
                  <span>
                    {submittingRefund
                      ? lang === "en"
                        ? "Submitting..."
                        : "জমা হচ্ছে..."
                      : lang === "en"
                        ? "Submit Refund Request"
                        : "রিফান্ড অনুরোধ জমা দিন"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer lang={lang} />
    </div>
  );
}

export default function ContractWorkspacePage({ params }: PageProps) {
  const resolvedParams = React.use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ContractWorkspaceContent contractId={resolvedParams.id} />
    </Suspense>
  );
}
