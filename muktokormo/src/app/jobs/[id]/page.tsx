"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Send,
  ShieldCheck,
  Star,
  CheckCircle2,
  X,
  Wallet,
  ChevronRight,
  RefreshCw,
  Users,
  MessageSquare,
  Lock,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { fetchOpenJobs, fetchJobById } from "@/lib/data/jobs";
import { fetchProposalsForJob, submitProposal, updateProposalStatus } from "@/lib/data/proposals";
import { createContractFromProposal } from "@/lib/data/contracts";
import { formatBdt } from "@/lib/format";
import { PLATFORM_FEE_PCT } from "@/lib/data/mappers";
import type { Job, JobBid } from "@/types";
import Logo from "@/components/Logo";

/* ─── Helpers ─────────────────────────────────────────────── */
function StatusBadge({ status }: { status: JobBid["status"] }) {
  const map: Record<JobBid["status"], { label: string; cls: string }> = {
    PENDING:     { label: "Pending",     cls: "bg-[#F4F2EC] text-[#3F4448] border border-[rgba(17,19,21,0.09)]" },
    SHORTLISTED: { label: "Shortlisted", cls: "bg-[#FEF6E6] text-[#A87224] border border-[#A87224]/25" },
    ACCEPTED:    { label: "Accepted",    cls: "bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/25" },
    REJECTED:    { label: "Rejected",    cls: "bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20" },
  };
  const { label, cls } = map[status] ?? map.PENDING;
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>;
}

/* ─── Bid Modal (Freelancer) ──────────────────────────────── */
function BidModal({
  job,
  freelancerId,
  onClose,
  onSuccess,
}: {
  job: Job;
  freelancerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [bidAmount, setBidAmount] = useState(job.budgetBdt);
  const [days, setDays] = useState(job.deadlineDays);
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const fee = Math.round(bidAmount * PLATFORM_FEE_PCT);
  const net = bidAmount - fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freelancerId) {
      setErr("Freelancer profile not found. Please log in as a freelancer to submit a bid.");
      return;
    }
    if (cover.trim().length < 20) { setErr("Cover letter must be at least 20 characters."); return; }
    setLoading(true); setErr(null);
    const result = await submitProposal(supabase, {
      jobId: job.id, freelancerId, bidAmountBdt: bidAmount,
      platformFeeBdt: fee, netEarnedBdt: net, deliveryDays: days,
      biddingType: "PROJECT", coverLetter: cover,
      payoutMethod: "BKASH", payoutAccount: "",
    });
    setLoading(false);
    if (!result) { setErr("Failed to submit proposal. You may have already placed a bid on this job."); return; }
    setDone(true);
    setTimeout(() => { onClose(); onSuccess(); }, 1600);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#111315]/55 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-[rgba(17,19,21,0.12)] space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#EAF5F0] text-[#0F6E50] border border-[#0F6E50]/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#111315]">Proposal Submitted</h3>
            <p className="text-xs text-[#6B7278]">The client will review your bid shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(17,19,21,0.08)]">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6E50] block mb-0.5">
                  Submit Proposal
                </span>
                <h3 className="text-sm font-bold text-[#111315] truncate">{job.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#6B7278] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bid amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3F4448] block mb-1">Your Bid (BDT)</label>
                  <input type="number" min={1000} step={500} value={bidAmount}
                    onChange={e => setBidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono mk-tabular font-bold text-[#111315] bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3F4448] block mb-1">Delivery (days)</label>
                  <input type="number" min={1} max={365} value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono mk-tabular font-bold text-[#111315] bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white" />
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] rounded-xl p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between text-[#6B7278]">
                  <span>Platform fee (7%):</span>
                  <span className="font-mono mk-tabular font-bold text-[#DC2626]">-{formatBdt(fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0B3B2E] pt-1.5 border-t border-[rgba(17,19,21,0.08)]">
                  <span>You&apos;ll receive (Net):</span>
                  <span className="font-mono mk-tabular">{formatBdt(net)}</span>
                </div>
              </div>

              {/* Cover letter */}
              <div>
                <label className="text-xs font-bold text-[#3F4448] block mb-1">Cover Letter</label>
                <textarea rows={5} value={cover} onChange={e => setCover(e.target.value)}
                  placeholder="Explain why you're the best fit for this job..."
                  className="w-full px-3 py-2.5 text-xs text-[#111315] bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white resize-none" />
                <p className="text-[10px] font-mono mk-tabular text-[#8B9094] mt-1">{cover.length} chars (min 20)</p>
              </div>

              {err && <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl px-3 py-2 font-semibold">{err}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{loading ? "Submitting..." : "Submit Proposal"}</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { role, freelancerId, clientId, loading: userLoading } = useCurrentUser();

  const [job, setJob] = useState<Job | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<JobBid[]>([]);
  const [jobLoading, setJobLoading] = useState(true);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [myBid, setMyBid] = useState<JobBid | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load job
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setJobLoading(true);
      const direct = await fetchJobById(supabase, id);
      if (!cancelled && direct) {
        setJob(direct);
        setJobLoading(false);
        return;
      }
      const all = await fetchOpenJobs(supabase);
      // Also fetch closed jobs for clients viewing their own
      const found = all.find(j => j.id === id) ?? null;
      if (!cancelled) { setJob(found); setJobLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [supabase, id]);

  // Load up to 3 related open jobs
  useEffect(() => {
    if (!job) return;
    let cancelled = false;
    (async () => {
      const all = await fetchOpenJobs(supabase);
      if (cancelled) return;
      const candidates = all.filter((j) => j.id !== job.id);
      const sameCategory = candidates.filter((j) => j.category === job.category);
      const others = candidates.filter((j) => j.category !== job.category);
      setRelatedJobs([...sameCategory, ...others].slice(0, 3));
    })();
    return () => { cancelled = true; };
  }, [supabase, job]);

  // Load proposals (for client owner) or check my bid (for freelancer)
  useEffect(() => {
    if (userLoading || !id) return;
    let cancelled = false;
    (async () => {
      const bids = await fetchProposalsForJob(supabase, id);
      if (cancelled) return;
      setProposals(bids);
      if (freelancerId) {
        setMyBid(bids.find(b => b.freelancerId === freelancerId) ?? null);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, id, freelancerId, userLoading]);

  const handleUpdateStatus = async (proposalId: string, status: JobBid["status"]) => {
    setUpdatingId(proposalId);
    const updated = await updateProposalStatus(supabase, proposalId, status);
    if (updated && status === "ACCEPTED") {
      try {
        await createContractFromProposal(supabase, proposalId);
      } catch (err) {
        console.error("Failed to create contract on bid acceptance:", err);
      }
    }
    const refreshed = await fetchProposalsForJob(supabase, id);
    setProposals(refreshed);
    setUpdatingId(null);
  };

  const backHref = role === "client" ? "/dashboard/client" : "/dashboard/freelancer";

  if (jobLoading || userLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#0F6E50] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F4F2EC] border border-[rgba(17,19,21,0.09)] flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-[#6B7278]" />
        </div>
        <p className="text-sm font-bold text-[#3F4448]">Job not found.</p>
        <Link href={backHref} className="text-xs font-bold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const isOwner = role === "client" && (!job.clientId || !clientId || job.clientId === clientId);
  const isFreelancer = role === "freelancer";
  const alreadyBid = !!myBid;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(17,19,21,0.09)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={backHref} className="flex items-center gap-1.5 text-xs font-bold text-[#3F4448] hover:text-[#111315] transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <span className="text-[rgba(17,19,21,0.18)] shrink-0">|</span>
            <Link href="/" className="shrink-0"><Logo size="sm" /></Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isFreelancer && !alreadyBid && (
              <button onClick={() => setBidModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-bold shadow-xs transition-all cursor-pointer">
                <Send className="w-3.5 h-3.5" />
                <span>Submit Proposal</span>
              </button>
            )}
            {isFreelancer && alreadyBid && (
              myBid?.status === "ACCEPTED" ? (
                <Link
                  href={`/dashboard/freelancer?tab=messages&threadId=${myBid.id}#messages`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Bid Accepted · Chat Live</span>
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-[#FEF6E6] border border-[#A87224]/25 text-[#A87224] text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Bid Pending Review · Chat Locked</span>
                </span>
              )
            )}
            {isOwner && (
              <Link href="/post-job"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-bold shadow-xs transition-all">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Post New Job</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — job details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title card */}
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3B2E] bg-[#EAF5F0] px-2.5 py-1 rounded-full border border-[#0F6E50]/20 inline-block">
                  {job.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#111315] tracking-tight leading-snug mt-2">{job.title}</h1>
                {job.titleBn && <p className="text-sm text-[#6B7278] mt-1">{job.titleBn}</p>}
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                job.status === "OPEN"
                  ? "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25"
                  : "bg-[#F4F2EC] text-[#6B7278] border-[rgba(17,19,21,0.09)]"
              }`}>{job.status}</span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-5 pt-4 border-t border-[rgba(17,19,21,0.07)] text-xs text-[#6B7278]">
              <span className="flex items-center gap-1.5 font-mono mk-tabular font-bold text-[#111315]">
                <Wallet className="w-3.5 h-3.5 text-[#0F6E50]" />{formatBdt(job.budgetBdt)}
              </span>
              <span className="flex items-center gap-1.5 font-mono mk-tabular">
                <Clock className="w-3.5 h-3.5 text-[#6B7278]" />{job.deadlineDays} days delivery
              </span>
              <span className="flex items-center gap-1.5 font-mono mk-tabular">
                <Send className="w-3.5 h-3.5 text-[#6B7278]" />{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#6B7278]" />{job.experienceLevel}
              </span>
              <span className="flex items-center gap-1.5 font-mono mk-tabular">
                <Star className="w-3.5 h-3.5 text-[#A87224] fill-[#A87224]" />Client rating {job.clientRating.toFixed(1)}
              </span>
              {job.clientVerified && (
                <span className="flex items-center gap-1 text-[#0F6E50] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />Verified Client
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#111315]">Job Description</h2>
            <p className="text-sm text-[#3F4448] leading-relaxed whitespace-pre-wrap">{job.description}</p>
            {job.descriptionBn && (
              <p className="text-sm text-[#6B7278] leading-relaxed whitespace-pre-wrap border-t border-[rgba(17,19,21,0.08)] pt-4">{job.descriptionBn}</p>
            )}
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 shadow-xs">
              <h2 className="text-sm font-bold text-[#111315] mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg bg-[#F4F2EC] border border-[rgba(17,19,21,0.07)] text-[#3F4448] text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Proposals section (visible to both roles) ── */}
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111315] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F6E50]" />
                <span>
                  {isOwner ? "Proposals Received" : "Competing Proposals"}
                  {" "}
                  <span className="font-mono mk-tabular text-[#6B7278]">({proposals.length})</span>
                </span>
              </h2>
            </div>

            {proposals.length === 0 ? (
              <div className="py-8 text-center bg-[#FAF9F6] border border-dashed border-[rgba(17,19,21,0.12)] rounded-xl">
                <Send className="w-7 h-7 text-[#8B9094] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#3F4448]">No proposals yet. Be the first to bid!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map(bid => (
                  <div key={bid.id} className={`border rounded-2xl p-4 transition-all ${
                    bid.status === "ACCEPTED" ? "border-[#0F6E50]/40 bg-[#EAF5F0]/55" :
                    bid.status === "SHORTLISTED" ? "border-[#A87224]/35 bg-[#FEF6E6]/45" :
                    "border-[rgba(17,19,21,0.09)] bg-white hover:border-[#0F6E50]/35"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img src={bid.freelancerAvatar} alt={bid.freelancerName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0F6E50]/20 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-[#111315]">{bid.freelancerName}</span>
                            {bid.isNidVerified && (
                              <span className="text-[10px] font-bold text-[#0F6E50] bg-[#EAF5F0] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" />NID
                              </span>
                            )}
                            <StatusBadge status={bid.status} />
                          </div>
                          <p className="text-[11px] text-[#6B7278] mt-0.5">{bid.freelancerTitle}</p>
                          <p className="text-[11px] text-[#6B7278] font-mono mk-tabular flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-[#A87224] fill-[#A87224]" />{bid.freelancerRating.toFixed(1)} · {bid.freelancerReviewsCount} reviews
                          </p>
                          {/* Show cover letter only to client */}
                          {isOwner && (
                            <p className="text-xs text-[#3F4448] mt-2 line-clamp-2 italic">&quot;{bid.coverLetter}&quot;</p>
                          )}
                          {/* Show own cover to freelancer */}
                          {isFreelancer && bid.freelancerId === freelancerId && (
                            <p className="text-xs text-[#3F4448] mt-2 line-clamp-2 italic">&quot;{bid.coverLetter}&quot;</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-mono mk-tabular font-bold text-[#111315]">{formatBdt(bid.bidAmountBdt)}</div>
                        <div className="text-[10px] font-mono mk-tabular text-[#6B7278]">{bid.deliveryDays}d delivery</div>
                        <div className="text-[10px] font-mono mk-tabular text-[#8B9094] mt-0.5">{bid.submittedAt}</div>
                      </div>
                    </div>

                    {/* Client actions */}
                    {isOwner && bid.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[rgba(17,19,21,0.08)]">
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "SHORTLISTED")}
                          className="px-3 py-1.5 rounded-lg bg-[#FEF6E6] hover:bg-[#FEF6E6]/80 border border-[#A87224]/25 text-[#A87224] text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                          Shortlist
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "ACCEPTED")}
                          className="px-3 py-1.5 rounded-lg bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />Hire & Open Workspace
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-[#F4F2EC] hover:bg-[#FEF2F2] hover:text-[#DC2626] text-[#6B7278] text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    )}
                    {isOwner && bid.status === "SHORTLISTED" && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#A87224]/20">
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "ACCEPTED")}
                          className="px-3 py-1.5 rounded-lg bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />Hire & Open Workspace
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-[#F4F2EC] hover:bg-[#FEF2F2] hover:text-[#DC2626] text-[#6B7278] text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    )}
                    {isOwner && bid.status === "ACCEPTED" && (
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#0F6E50]/20 flex-wrap">
                        <span className="text-[11px] font-bold text-[#0B3B2E] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E50]" />
                          Hired · 1-to-1 Workspace Active
                        </span>
                        <Link
                          href="/dashboard/client?tab=messages#messages"
                          className="px-3 py-1.5 rounded-lg bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Message Freelancer
                        </Link>
                      </div>
                    )}

                    {/* Freelancer actions for own bid */}
                    {isFreelancer && bid.freelancerId === freelancerId && (
                      <div className="mt-3 pt-3 border-t border-[rgba(17,19,21,0.08)]">
                        {bid.status === "ACCEPTED" ? (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-[#0B3B2E] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E50]" />
                              Proposal Accepted · 1-to-1 Workspace Chat Unlocked
                            </span>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/freelancer?tab=messages&threadId=${bid.id}#messages`}
                                className="px-3.5 py-1.5 rounded-lg bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Chat with Client
                              </Link>
                              <Link
                                href={`/messages?contractId=${bid.id}&partnerId=${job.clientId || ""}&partnerName=${encodeURIComponent(job.clientName || "Client")}&partnerRole=client&subject=${encodeURIComponent(job.title)}`}
                                className="px-3 py-1.5 rounded-lg bg-[#F4F2EC] hover:bg-[#EAF5F0] text-[#3F4448] hover:text-[#0B3B2E] text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Full Messenger</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-semibold text-[#A87224] flex items-center gap-1.5 bg-[#FEF6E6] border border-[#A87224]/20 rounded-xl px-3 py-1.5">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>Messaging locked until client accepts your proposal</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Related Jobs section ── */}
          {relatedJobs.length > 0 && (
            <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[#111315]">Related Open Jobs</h2>
                <Link
                  href="/#jobs"
                  className="text-[11px] font-bold text-[#0F6E50] hover:text-[#0B3B2E] flex items-center gap-0.5"
                >
                  <span>Browse all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedJobs.map((rj) => (
                  <Link
                    key={rj.id}
                    href={`/jobs/${rj.id}`}
                    className="group bg-[#FAF9F6] hover:bg-white border border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/40 rounded-xl p-4 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#0B3B2E] bg-[#EAF5F0] px-2 py-0.5 rounded-full border border-[#0F6E50]/15">
                        {rj.category}
                      </span>
                      <h3 className="text-xs font-bold text-[#111315] group-hover:text-[#0F6E50] transition-colors line-clamp-2 leading-snug">
                        {rj.title}
                      </h3>
                    </div>
                    <div className="pt-2 border-t border-[rgba(17,19,21,0.07)] flex items-center justify-between text-[11px]">
                      <span className="font-mono mk-tabular font-bold text-[#111315]">
                        {formatBdt(rj.budgetBdt)}
                      </span>
                      <span className="font-mono mk-tabular text-[#6B7278]">
                        {rj.deadlineDays}d
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Client info */}
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-[11px] font-bold text-[#6B7278] uppercase tracking-wider">About the Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5F0] border border-[#0F6E50]/20 text-[#0B3B2E] flex items-center justify-center text-xs font-bold shrink-0">
                {(job.clientName || "C")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#111315] truncate">{job.clientName}</p>
                <p className="text-[11px] text-[#6B7278] truncate">{job.clientLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Star className="w-3.5 h-3.5 text-[#A87224] fill-[#A87224]" />
              <span className="font-mono mk-tabular font-bold text-[#111315]">{job.clientRating.toFixed(1)}</span>
              {job.clientVerified && (
                <span className="ml-2 flex items-center gap-1 text-[#0F6E50] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />Verified
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono mk-tabular text-[#8B9094]">Posted {job.postedAt}</p>
          </div>

          {/* Bid summary (freelancer) */}
          {isFreelancer && (
            <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-[11px] font-bold text-[#6B7278] uppercase tracking-wider">Budget</h3>
              <p className="text-2xl font-mono mk-tabular font-bold text-[#111315]">{formatBdt(job.budgetBdt)}</p>
              <p className="text-[11px] font-mono mk-tabular text-[#6B7278]">{job.jobType} · {job.deadlineDays} day deadline</p>
              {!alreadyBid ? (
                <button onClick={() => setBidModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />Submit Proposal
                </button>
              ) : (
                <div className="p-3 bg-[#EAF5F0] border border-[#0F6E50]/20 rounded-xl text-center space-y-1.5">
                  <p className="text-xs font-mono mk-tabular font-bold text-[#0B3B2E]">✓ You bid {formatBdt(myBid!.bidAmountBdt)}</p>
                  <StatusBadge status={myBid!.status} />
                </div>
              )}
            </div>
          )}

          {/* Proposal count (client) */}
          {isOwner && (
            <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-[11px] font-bold text-[#6B7278] uppercase tracking-wider">Proposals</h3>
              <p className="text-2xl font-mono mk-tabular font-bold text-[#111315]">{proposals.length}</p>
              <p className="text-[11px] font-mono mk-tabular text-[#6B7278]">
                {proposals.filter(p => p.status === "SHORTLISTED").length} shortlisted ·{" "}
                {proposals.filter(p => p.status === "ACCEPTED").length} accepted
              </p>
              <Link href="/dashboard/client"
                className="w-full py-2.5 rounded-xl bg-[#F4F2EC] hover:bg-[#EAF5F0] text-[#111315] hover:text-[#0B3B2E] text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />Back to Dashboard
              </Link>
            </div>
          )}

          {/* Escrow notice */}
          <div className="mk-dark-card rounded-2xl p-5 text-white space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#43D69E]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EAF5F0]">BDT Escrow Protection</span>
            </div>
            <p className="text-[11px] text-white/75 leading-relaxed">
              Payment is held securely in escrow and released only after you approve the delivered work.
            </p>
          </div>
        </div>
      </main>

      {bidModalOpen && (
        <BidModal job={job} freelancerId={freelancerId || ""}
          onClose={() => setBidModalOpen(false)}
          onSuccess={async () => {
            const refreshed = await fetchProposalsForJob(supabase, id);
            setProposals(refreshed);
            if (freelancerId) {
              setMyBid(refreshed.find(b => b.freelancerId === freelancerId) ?? null);
            }
          }}
        />
      )}
    </div>
  );
}
