"use client";

import React, { useState } from "react";
import { Job, JobBid } from "@/types";
import { 
  X, 
  Star, 
  ShieldCheck, 
  Clock, 
  Send, 
  ExternalLink, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  DollarSign, 
  Filter, 
  Layers, 
  Lock, 
  Check, 
  Sparkles, 
  MessageSquare
} from "lucide-react";

interface JobBidsModalProps {
  job: Job | null;
  bids: JobBid[];
  isOpen: boolean;
  onClose: () => void;
  onOpenBidModal: (job: Job) => void;
  onAcceptBidAndEscrow: (job: Job, bid: JobBid) => void;
  onToggleShortlist: (bidId: string) => void;
  role: "client" | "freelancer";
  lang: "en" | "bn";
}

export default function JobBidsModal({
  job,
  bids,
  isOpen,
  onClose,
  onOpenBidModal,
  onAcceptBidAndEscrow,
  onToggleShortlist,
  role,
  lang,
}: JobBidsModalProps) {
  const [filterMode, setFilterMode] = useState<"ALL" | "SHORTLISTED" | "LOWEST" | "TOP_RATED">("ALL");
  const [expandedCoverLetter, setExpandedCoverLetter] = useState<Record<string, boolean>>({});

  if (!isOpen || !job) return null;

  const jobBids = bids.filter((b) => b.jobId === job.id);

  // Analytics
  const totalBids = jobBids.length;
  const avgBid = totalBids > 0 ? Math.round(jobBids.reduce((acc, b) => acc + b.bidAmountBdt, 0) / totalBids) : 0;
  const lowestBid = totalBids > 0 ? Math.min(...jobBids.map((b) => b.bidAmountBdt)) : 0;
  const highestBid = totalBids > 0 ? Math.max(...jobBids.map((b) => b.bidAmountBdt)) : 0;
  const avgDelivery = totalBids > 0 ? Math.round(jobBids.reduce((acc, b) => acc + b.deliveryDays, 0) / totalBids) : 0;

  // Filtered & Sorted bids
  const filteredBids = [...jobBids].filter((b) => {
    if (filterMode === "SHORTLISTED") return b.status === "SHORTLISTED" || b.status === "ACCEPTED";
    return true;
  }).sort((a, b) => {
    if (filterMode === "LOWEST") return a.bidAmountBdt - b.bidAmountBdt;
    if (filterMode === "TOP_RATED") return b.freelancerRating - a.freelancerRating;
    return 0;
  });

  const toggleExpand = (id: string) => {
    setExpandedCoverLetter((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-slate-900 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {lang === "en" ? "Bidding Room" : "বিডিং তালিকা"}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Client: {job.clientName} ({job.clientLocation})
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-slate-900">
              {lang === "en" ? job.title : (job.titleBn || job.title)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics & Stats Bar */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white p-4 sm:p-5 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Total Bids Placed</span>
              <span className="text-lg sm:text-xl font-black text-white">{totalBids}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Average Bid</span>
              <span className="text-lg sm:text-xl font-black text-white">৳{avgBid.toLocaleString()}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Bid Range (Low - High)</span>
              <span className="text-xs sm:text-sm font-black text-white">
                ৳{lowestBid.toLocaleString()} - ৳{highestBid.toLocaleString()}
              </span>
            </div>
            <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Avg. Delivery</span>
              <span className="text-lg sm:text-xl font-black text-white">{avgDelivery} Days</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & CTAs */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Filter:</span>
            
            <button
              onClick={() => setFilterMode("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterMode === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({totalBids})
            </button>
            <button
              onClick={() => setFilterMode("SHORTLISTED")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterMode === "SHORTLISTED"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Shortlisted ⭐
            </button>
            <button
              onClick={() => setFilterMode("LOWEST")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterMode === "LOWEST"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Lowest Bid ৳
            </button>
            <button
              onClick={() => setFilterMode("TOP_RATED")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterMode === "TOP_RATED"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Top Rated ★
            </button>
          </div>

          {/* Freelancer Apply Button */}
          <button
            onClick={() => {
              onClose();
              onOpenBidModal(job);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{lang === "en" ? "Place Your Bid" : "আপনার বিড জমা দিন"}</span>
          </button>
        </div>

        {/* Bids List */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
          {filteredBids.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-sm mx-auto my-6">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Bids Match This Filter</h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">Try switching to 'All' or place the first bid.</p>
              <button
                onClick={() => setFilterMode("ALL")}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            filteredBids.map((bid) => {
              const isExpanded = !!expandedCoverLetter[bid.id];
              const isShortlisted = bid.status === "SHORTLISTED";
              const isAccepted = bid.status === "ACCEPTED";

              return (
                <div
                  key={bid.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-sm ${
                    isAccepted
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                      : isShortlisted
                      ? "border-amber-300 bg-amber-50/10"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    {/* Freelancer Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <img
                        src={bid.freelancerAvatar}
                        alt={bid.freelancerName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-black text-slate-900">{bid.freelancerName}</h4>
                          {bid.isNidVerified && (
                            <span title="NID Smart Card Verified" className="text-emerald-600">
                              <ShieldCheck className="w-4 h-4 fill-emerald-100" />
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-slate-400">• {bid.submittedAt}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{bid.freelancerTitle}</p>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {bid.freelancerRating.toFixed(1)}
                            <span className="text-slate-400 font-normal">({bid.freelancerReviewsCount})</span>
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                            Wallet: {bid.payoutMethod}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bid Rate & Timeline */}
                    <div className="text-left sm:text-right shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-100 sm:bg-transparent sm:p-0 sm:border-0">
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                            Proposed Bid
                          </span>
                          <span className="text-xl font-black text-slate-900 tracking-tight">
                            ৳{bid.bidAmountBdt.toLocaleString()} BDT
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Delivery in {bid.deliveryDays} Days</span>
                        </div>
                      </div>

                      {bid.biddingType === "MILESTONES" && bid.milestones && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md mt-1 border border-sky-200">
                          <Layers className="w-3 h-3" />
                          {bid.milestones.length} Milestones Structured
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Cover Letter */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <p className={`text-xs text-slate-700 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                      {bid.coverLetter}
                    </p>
                    {bid.coverLetter.length > 130 && (
                      <button
                        onClick={() => toggleExpand(bid.id)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 mt-1 cursor-pointer"
                      >
                        {isExpanded ? "Show Less" : "Read Full Proposal..."}
                      </button>
                    )}
                  </div>

                  {/* Milestones Preview (if any) */}
                  {bid.biddingType === "MILESTONES" && bid.milestones && isExpanded && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Milestones:</span>
                      {bid.milestones.map((m, mIdx) => (
                        <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                          <span className="text-slate-800">#{mIdx + 1} {m.title}</span>
                          <div className="flex items-center gap-3 font-semibold text-slate-900">
                            <span>৳{m.amountBdt.toLocaleString()}</span>
                            <span className="text-slate-400 text-[11px]">({m.deliveryDays}d)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Portfolio Links */}
                  {bid.portfolioLinks && bid.portfolioLinks.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Portfolio:</span>
                      {bid.portfolioLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline bg-sky-50 px-2 py-0.5 rounded-md"
                        >
                          <span>{link}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Status Pill */}
                    <div>
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Hired & Escrow Locked
                        </span>
                      ) : isShortlisted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                          Shortlisted Bid
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          Status: Under Review
                        </span>
                      )}
                    </div>

                    {/* Client or Freelancer Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleShortlist(bid.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isShortlisted
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isShortlisted ? "fill-amber-500 text-amber-500" : ""}`} />
                        <span>{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
                      </button>

                      <button
                        onClick={() => onAcceptBidAndEscrow(job, bid)}
                        disabled={isAccepted}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer ${
                          isAccepted
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95"
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isAccepted ? "Already Hired" : "Accept Bid & Hire (Escrow)"}</span>
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All bids protected by MuktoKormo BDT Escrow & Dispute Resolution</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
