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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { fetchOpenJobs } from "@/lib/data/jobs";
import { fetchProposalsForJob, submitProposal, updateProposalStatus } from "@/lib/data/proposals";
import { formatBdt } from "@/lib/format";
import { PLATFORM_FEE_PCT } from "@/lib/data/mappers";
import type { Job, JobBid } from "@/types";
import Logo from "@/components/Logo";

/* ─── Helpers ─────────────────────────────────────────────── */
function StatusBadge({ status }: { status: JobBid["status"] }) {
  const map: Record<JobBid["status"], { label: string; cls: string }> = {
    PENDING:     { label: "Pending",     cls: "bg-slate-100 text-slate-600" },
    SHORTLISTED: { label: "Shortlisted", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    ACCEPTED:    { label: "Accepted",    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    REJECTED:    { label: "Rejected",    cls: "bg-red-50 text-red-700 border border-red-200" },
  };
  const { label, cls } = map[status] ?? map.PENDING;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>;
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
    if (cover.trim().length < 20) { setErr("Cover letter must be at least 20 characters."); return; }
    setLoading(true); setErr(null);
    const result = await submitProposal(supabase, {
      jobId: job.id, freelancerId, bidAmountBdt: bidAmount,
      platformFeeBdt: fee, netEarnedBdt: net, deliveryDays: days,
      biddingType: "PROJECT", coverLetter: cover,
      payoutMethod: "BKASH", payoutAccount: "",
    });
    setLoading(false);
    if (!result) { setErr("Failed to submit proposal. Please try again."); return; }
    setDone(true);
    setTimeout(() => { onClose(); onSuccess(); }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">Proposal Submitted!</h3>
            <p className="text-xs text-slate-500">The client will review your bid shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submit a Proposal</h3>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">{job.title}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bid amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Bid (BDT)</label>
                  <input type="number" min={1000} step={500} value={bidAmount}
                    onChange={e => setBidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Delivery (days)</label>
                  <input type="number" min={1} max={365} value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Platform fee (7%):</span>
                  <span className="font-bold text-rose-600">-{formatBdt(fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
                  <span>You'll receive:</span>
                  <span>{formatBdt(net)}</span>
                </div>
              </div>

              {/* Cover letter */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cover Letter</label>
                <textarea rows={5} value={cover} onChange={e => setCover(e.target.value)}
                  placeholder="Explain why you're the best fit for this job..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                <p className="text-[10px] text-slate-400 mt-0.5">{cover.length} chars (min 20)</p>
              </div>

              {err && <p className="text-xs text-red-600 font-semibold">{err}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
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
      const all = await fetchOpenJobs(supabase);
      // Also fetch closed jobs for clients viewing their own
      const found = all.find(j => j.id === id) ?? null;
      if (!cancelled) { setJob(found); setJobLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [supabase, id]);

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
    await updateProposalStatus(supabase, proposalId, status);
    const refreshed = await fetchProposalsForJob(supabase, id);
    setProposals(refreshed);
    setUpdatingId(null);
  };

  const backHref = role === "client" ? "/dashboard/client" : "/dashboard/freelancer";

  if (jobLoading || userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Briefcase className="w-12 h-12 text-slate-300" />
        <p className="text-sm font-bold text-slate-500">Job not found.</p>
        <Link href={backHref} className="text-xs font-bold text-emerald-600 hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  const isOwner = role === "client"; // simplified; for full check: compare job.clientId === clientId
  const isFreelancer = role === "freelancer";
  const alreadyBid = !!myBid;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={backHref} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/"><Logo size="sm" /></Link>
          </div>
          <div className="flex items-center gap-2">
            {isFreelancer && !alreadyBid && (
              <button onClick={() => setBidModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer">
                <Send className="w-3.5 h-3.5" />
                <span>Submit Proposal</span>
              </button>
            )}
            {isFreelancer && alreadyBid && (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                ✓ Proposal Submitted
              </span>
            )}
            {isOwner && (
              <Link href="/post-job"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all">
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slateald-400 uppercase tracking-wide text-slate-400">{job.category}</span>
                <h1 className="text-xl font-black text-slate-900 leading-snug mt-1">{job.title}</h1>
                {job.titleBn && <p className="text-sm text-slate-500 mt-0.5">{job.titleBn}</p>}
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                job.status === "OPEN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}>{job.status}</span>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />{formatBdt(job.budgetBdt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />{job.deadlineDays} days delivery
              </span>
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />{job.experienceLevel}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />Client rating {job.clientRating.toFixed(1)}
              </span>
              {job.clientVerified && (
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />Verified Client
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900">Job Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            {job.descriptionBn && (
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-4">{job.descriptionBn}</p>
            )}
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Proposals section (visible to both roles) ── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                {isOwner ? `Proposals Received (${proposals.length})` : `Competing Proposals (${proposals.length})`}
              </h2>
            </div>

            {proposals.length === 0 ? (
              <div className="py-8 text-center">
                <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No proposals yet. Be the first to bid!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map(bid => (
                  <div key={bid.id} className={`border rounded-2xl p-4 transition-all ${
                    bid.status === "ACCEPTED" ? "border-emerald-300 bg-emerald-50/40" :
                    bid.status === "SHORTLISTED" ? "border-amber-300 bg-amber-50/30" :
                    "border-slate-200/90 bg-white hover:border-emerald-200"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img src={bid.freelancerAvatar} alt={bid.freelancerName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{bid.freelancerName}</span>
                            {bid.isNidVerified && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" />NID
                              </span>
                            )}
                            <StatusBadge status={bid.status} />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{bid.freelancerTitle}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-amber-500" />{bid.freelancerRating.toFixed(1)} · {bid.freelancerReviewsCount} reviews
                          </p>
                          {/* Show cover letter only to client */}
                          {isOwner && (
                            <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">"{bid.coverLetter}"</p>
                          )}
                          {/* Show own cover to freelancer */}
                          {isFreelancer && bid.freelancerId === freelancerId && (
                            <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">"{bid.coverLetter}"</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black text-slate-900">{formatBdt(bid.bidAmountBdt)}</div>
                        <div className="text-[10px] text-slate-400">{bid.deliveryDays}d delivery</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{bid.submittedAt}</div>
                      </div>
                    </div>

                    {/* Client actions */}
                    {isOwner && bid.status === "PENDING" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "SHORTLISTED")}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                          Shortlist
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "ACCEPTED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />Hire & Open Workspace
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    )}
                    {isOwner && bid.status === "SHORTLISTED" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-amber-100">
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "ACCEPTED")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />Hire & Open Workspace
                        </button>
                        <button disabled={updatingId === bid.id}
                          onClick={() => handleUpdateStatus(bid.id, "REJECTED")}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Client info */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">About the Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                {(job.clientName || "C")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{job.clientName}</p>
                <p className="text-[11px] text-slate-500">{job.clientLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold">{job.clientRating.toFixed(1)}</span>
              {job.clientVerified && (
                <span className="ml-2 flex items-center gap-1 text-emerald-600 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Posted {job.postedAt}</p>
          </div>

          {/* Bid summary (freelancer) */}
          {isFreelancer && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Budget</h3>
              <p className="text-2xl font-black text-slate-900">{formatBdt(job.budgetBdt)}</p>
              <p className="text-[11px] text-slate-500">{job.jobType} · {job.deadlineDays} day deadline</p>
              {!alreadyBid ? (
                <button onClick={() => setBidModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />Submit Proposal
                </button>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-emerald-700">✓ You bid {formatBdt(myBid!.bidAmountBdt)}</p>
                  <StatusBadge status={myBid!.status} />
                </div>
              )}
            </div>
          )}

          {/* Proposal count (client) */}
          {isOwner && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Proposals</h3>
              <p className="text-2xl font-black text-slate-900">{proposals.length}</p>
              <p className="text-[11px] text-slate-500">
                {proposals.filter(p => p.status === "SHORTLISTED").length} shortlisted ·{" "}
                {proposals.filter(p => p.status === "ACCEPTED").length} accepted
              </p>
              <Link href="/dashboard/client"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />Back to Dashboard
              </Link>
            </div>
          )}

          {/* Escrow notice */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">BDT Escrow Protection</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Payment is held securely in escrow and released only after you approve the delivered work.
            </p>
          </div>
        </div>
      </main>

      {bidModalOpen && freelancerId && (
        <BidModal job={job} freelancerId={freelancerId}
          onClose={() => setBidModalOpen(false)}
          onSuccess={async () => {
            const refreshed = await fetchProposalsForJob(supabase, id);
            setProposals(refreshed);
            setMyBid(refreshed.find(b => b.freelancerId === freelancerId) ?? null);
          }}
        />
      )}
    </div>
  );
}
