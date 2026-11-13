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
    PENDING:     { label: "Pending",     cls: "bg-subtle text-ink-2 border border-line" },
    SHORTLISTED: { label: "Shortlisted", cls: "bg-accent-soft text-accent border border-accent/25" },
    ACCEPTED:    { label: "Accepted",    cls: "bg-brand-soft text-navy border border-brand/25" },
    REJECTED:    { label: "Rejected",    cls: "bg-danger-soft text-danger border border-danger/20" },
  };
  const { label, cls } = map[status] ?? map.PENDING;
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{label}</span>;
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
      className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-line-strong space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-brand-soft text-brand border border-brand/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-ink">Proposal Submitted</h3>
            <p className="text-xs text-ink-3">The client will review your bid shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="min-w-0 pr-3">
                <span className="mk-eyebrow text-brand block mb-0.5">
                  Submit Proposal
                </span>
                <h3 className="text-sm font-semibold text-ink truncate">{job.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-subtle transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bid amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-2 block mb-1">Your Bid (BDT)</label>
                  <input type="number" min={1000} step={500} value={bidAmount}
                    onChange={e => setBidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono mk-tabular font-semibold text-ink bg-canvas border border-line-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-2 block mb-1">Delivery (days)</label>
                  <input type="number" min={1} max={365} value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono mk-tabular font-semibold text-ink bg-canvas border border-line-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white" />
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="bg-canvas border border-line rounded-lg p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between text-ink-3">
                  <span>Platform fee (7%):</span>
                  <span className="font-mono mk-tabular font-semibold text-danger">-{formatBdt(fee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-navy pt-1.5 border-t border-line">
                  <span>You&apos;ll receive (Net):</span>
                  <span className="font-mono mk-tabular">{formatBdt(net)}</span>
                </div>
              </div>

              {/* Cover letter */}
              <div>
                <label className="text-xs font-semibold text-ink-2 block mb-1">Cover Letter</label>
                <textarea rows={5} value={cover} onChange={e => setCover(e.target.value)}
                  placeholder="Explain why you're the best fit for this job..."
                  className="w-full px-3 py-2.5 text-xs text-ink bg-canvas border border-line-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white resize-none" />
                <p className="text-[10px] font-mono mk-tabular text-ink-4 mt-1">{cover.length} chars (min 20)</p>
              </div>

              {err && <p className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2 font-semibold">{err}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-navy hover:bg-brand disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
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
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-subtle border border-line flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-ink-3" />
        </div>
        <p className="text-sm font-semibold text-ink-2">Job not found.</p>
        <Link href={backHref} className="text-xs font-semibold text-brand hover:text-navy hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const isOwner = role === "client" && (!job.clientId || !clientId || job.clientId === clientId);
  const isFreelancer = role === "freelancer";
  const alreadyBid = !!myBid;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={backHref} className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <span className="text-[rgba(16,24,40,0.18)] shrink-0">|</span>
            <Link href="/" className="shrink-0"><Logo size="sm" /></Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isFreelancer && !alreadyBid && (
              <button onClick={() => setBidModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold shadow-xs transition-all cursor-pointer">
                <Send className="w-3.5 h-3.5" />
                <span>Submit Proposal</span>
              </button>
            )}
            {isFreelancer && alreadyBid && (
              myBid?.status === "ACCEPTED" ? (
                <Link
                  href={`/dashboard/freelancer?tab=messages&threadId=${myBid.id}#messages`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Bid Accepted · Chat Live</span>
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg bg-accent-soft border border-accent/25 text-accent text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Bid Pending Review · Chat Locked</span>
                </span>
              )
            )}
            {isOwner && (
              <Link href="/post-job"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold shadow-xs transition-all">
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
          <div className="bg-white border border-line rounded-xl p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <span className="mk-eyebrow text-navy bg-brand-soft px-2.5 py-1 rounded-full border border-brand/20 inline-block">
                  {job.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight leading-snug mt-2">{job.title}</h1>
                {job.titleBn && <p className="text-sm text-ink-3 mt-1">{job.titleBn}</p>}
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full mk-eyebrow border ${
                job.status === "OPEN"
                  ? "bg-brand-soft text-navy border-brand/25"
                  : "bg-subtle text-ink-3 border-line"
              }`}>{job.status}</span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-5 pt-4 border-t border-line text-xs text-ink-3">
              <span className="flex items-center gap-1.5 font-mono mk-tabular font-semibold text-ink">
                <Wallet className="w-3.5 h-3.5 text-brand" />{formatBdt(job.budgetBdt)}
              </span>
              <span className="flex items-center gap-1.5 font-mono mk-tabular">
                <Clock className="w-3.5 h-3.5 text-ink-3" />{job.deadlineDays} days delivery
              </span>
              <span className="flex items-center gap-1.5 font-mono mk-tabular">
                <Send className="w-3.5 h-3.5 text-ink-3" />{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-ink-3" />{job.experienceLevel}
              </span>
              <span className="flex items-center gap-1.5 font-mono mk-tabular">
                <Star className="w-3.5 h-3.5 text-accent fill-accent" />Client rating {job.clientRating.toFixed(1)}
              </span>
              {job.clientVerified && (
                <span className="flex items-center gap-1 text-brand font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />Verified Client
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-ink">Job Description</h2>
            <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            {job.descriptionBn && (
              <p className="text-sm text-ink-3 leading-relaxed whitespace-pre-wrap border-t border-line pt-4">{job.descriptionBn}</p>
            )}
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="bg-white border border-line rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-semibold text-ink mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg bg-subtle border border-line text-ink-2 text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Proposals section (visible to both roles) ── */}
          <div className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-brand" />
                <span>
                  {isOwner ? "Proposals Received" : "Competing Proposals"}
                  {" "}
                  <span className="font-mono mk-tabular text-ink-3">({proposals.length})</span>
                </span>
              </h2>
            </div>

            {proposals.length === 0 ? (
              <div className="py-8 text-center bg-canvas border border-dashed border-line-strong rounded-lg">
                <Send className="w-7 h-7 text-ink-4 mx-auto mb-2" />
                <p className="text-xs font-semibold text-ink-2">No proposals yet. Be the first to bid!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map(bid => (
                  <div key={bid.id} className={`border rounded-xl p-4 transition-all ${
                    bid.status === "ACCEPTED" ? "border-brand/40 bg-brand-soft/55" :
                    bid.status === "SHORTLISTED" ? "border-accent/35 bg-accent-soft/45" :
                    "border-line bg-white hover:border-brand/35"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img src={bid.freelancerAvatar} alt={bid.freelancerName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand/20 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-ink">{bid.freelancerName}</span>
                            {bid.isNidVerified && (
                              <span className="text-[10px] font-semibold text-brand bg-brand-soft px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" />NID
                              </span>
                            )}
                            <StatusBadge status={bid.status} />
                          </div>
                          <p className="text-[11px] text-ink-3 mt-0.5">{bid.freelancerTitle}</p>
                          <p className="text-[11px] text-ink-3 font-mono mk-tabular flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-accent fill-accent" />{bid.freelancerRating.toFixed(1)} · {bid.freelancerReviewsCount} reviews
                          </p>
                          {/* Show cover letter only to client */}
                          {isOwner && (
                            <p className="text-xs text-ink-2 mt-2 line-clamp-2 italic">&quot;{bid.coverLetter}&quot;</p>
                          )}
                          {/* Show own cover to freelancer */}
                          {isFreelancer && bid.freelancerId === freelancerId && (
                            <p className="text-xs text-ink-2 mt-2 line-clamp-2 italic">&quot;{bid.coverLetter}&quot;</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-mono mk-tabular font-semibold text-ink">{formatBdt(bid.bidAmountBdt)}</div>
                        <div className="text-[10px] font-mono mk-tabular text-ink-3">{bid.deliveryDays}d delivery</div>
                        <div className="text-[10px] font-mono mk-tabular text-ink-4 mt-0.5">{bid.submittedAt}</div>
                      </div>
                    </div>

                    {/* Client actions */}
                    {isOwner && bid.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "SHORTLISTED")}
                          className="px-3 py-1.5 rounded-lg bg-accent-soft hover:bg-accent-soft/80 border border-accent/25 text-accent text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50">
                          Shortlist
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "ACCEPTED")}
                          className="px-3 py-1.5 rounded-lg bg-navy hover:bg-brand text-white text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />Hire & Open Workspace
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-subtle hover:bg-danger-soft hover:text-danger text-ink-3 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    )}
                    {isOwner && bid.status === "SHORTLISTED" && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-accent/20">
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "ACCEPTED")}
                          className="px-3 py-1.5 rounded-lg bg-navy hover:bg-brand text-white text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />Hire & Open Workspace
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-subtle hover:bg-danger-soft hover:text-danger text-ink-3 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    )}
                    {isOwner && bid.status === "ACCEPTED" && (
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-brand/20 flex-wrap">
                        <span className="text-[11px] font-semibold text-navy flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                          Hired · 1-to-1 Workspace Active
                        </span>
                        <Link
                          href="/dashboard/client?tab=messages#messages"
                          className="px-3 py-1.5 rounded-lg bg-navy hover:bg-brand text-white text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Message Freelancer
                        </Link>
                      </div>
                    )}

                    {/* Freelancer actions for own bid */}
                    {isFreelancer && bid.freelancerId === freelancerId && (
                      <div className="mt-3 pt-3 border-t border-line">
                        {bid.status === "ACCEPTED" ? (
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-navy flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                              Proposal Accepted · 1-to-1 Workspace Chat Unlocked
                            </span>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/freelancer?tab=messages&threadId=${bid.id}#messages`}
                                className="px-3.5 py-1.5 rounded-lg bg-navy hover:bg-brand text-white text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Chat with Client
                              </Link>
                              <Link
                                href={`/messages?contractId=${bid.id}&partnerId=${job.clientId || ""}&partnerName=${encodeURIComponent(job.clientName || "Client")}&partnerRole=client&subject=${encodeURIComponent(job.title)}`}
                                className="px-3 py-1.5 rounded-lg bg-subtle hover:bg-brand-soft text-ink-2 hover:text-navy text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Full Messenger</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-semibold text-accent flex items-center gap-1.5 bg-accent-soft border border-accent/20 rounded-lg px-3 py-1.5">
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
            <div className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">Related Open Jobs</h2>
                <Link
                  href="/#jobs"
                  className="text-[11px] font-semibold text-brand hover:text-navy flex items-center gap-0.5"
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
                    className="group bg-canvas hover:bg-white border border-line hover:border-brand/40 rounded-lg p-4 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block mk-eyebrow text-navy bg-brand-soft px-2 py-0.5 rounded-full border border-brand/15">
                        {rj.category}
                      </span>
                      <h3 className="text-xs font-semibold text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                        {rj.title}
                      </h3>
                    </div>
                    <div className="pt-2 border-t border-line flex items-center justify-between text-[11px]">
                      <span className="font-mono mk-tabular font-semibold text-ink">
                        {formatBdt(rj.budgetBdt)}
                      </span>
                      <span className="font-mono mk-tabular text-ink-3">
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
          <div className="bg-white border border-line rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">About the Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-soft border border-brand/20 text-navy flex items-center justify-center text-xs font-semibold shrink-0">
                {(job.clientName || "C")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{job.clientName}</p>
                <p className="text-[11px] text-ink-3 truncate">{job.clientLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Star className="w-3.5 h-3.5 text-accent fill-accent" />
              <span className="font-mono mk-tabular font-semibold text-ink">{job.clientRating.toFixed(1)}</span>
              {job.clientVerified && (
                <span className="ml-2 flex items-center gap-1 text-brand font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />Verified
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono mk-tabular text-ink-4">Posted {job.postedAt}</p>
          </div>

          {/* Bid summary (freelancer) */}
          {isFreelancer && (
            <div className="bg-white border border-line rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Budget</h3>
              <p className="text-2xl font-mono mk-tabular font-semibold text-ink">{formatBdt(job.budgetBdt)}</p>
              <p className="text-[11px] font-mono mk-tabular text-ink-3">{job.jobType} · {job.deadlineDays} day deadline</p>
              {!alreadyBid ? (
                <button onClick={() => setBidModalOpen(true)}
                  className="w-full py-2.5 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />Submit Proposal
                </button>
              ) : (
                <div className="p-3 bg-brand-soft border border-brand/20 rounded-lg text-center space-y-1.5">
                  <p className="text-xs font-mono mk-tabular font-semibold text-navy">✓ You bid {formatBdt(myBid!.bidAmountBdt)}</p>
                  <StatusBadge status={myBid!.status} />
                </div>
              )}
            </div>
          )}

          {/* Proposal count (client) */}
          {isOwner && (
            <div className="bg-white border border-line rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Proposals</h3>
              <p className="text-2xl font-mono mk-tabular font-semibold text-ink">{proposals.length}</p>
              <p className="text-[11px] font-mono mk-tabular text-ink-3">
                {proposals.filter(p => p.status === "SHORTLISTED").length} shortlisted ·{" "}
                {proposals.filter(p => p.status === "ACCEPTED").length} accepted
              </p>
              <Link href="/dashboard/client"
                className="w-full py-2.5 rounded-lg bg-subtle hover:bg-brand-soft text-ink hover:text-navy text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />Back to Dashboard
              </Link>
            </div>
          )}

          {/* Escrow notice */}
          <div className="mk-dark-card rounded-xl p-5 text-white space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-light" />
              <span className="mk-eyebrow text-brand-soft">BDT Escrow Protection</span>
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
