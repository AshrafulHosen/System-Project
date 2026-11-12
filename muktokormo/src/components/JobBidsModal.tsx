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
  Award, 
  Filter, 
  Layers, 
  Lock, 
} from "lucide-react";

interface JobBidsModalProps {
  job: Job | null;
  bids: JobBid[];
  isOpen: boolean;
  onClose: () => void;
  onOpenBidModal: (job: Job) => void;
  onAcceptBidAndEscrow: (job: Job, bid: JobBid) => void;
  onToggleShortlist: (bidId: string) => void;
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111315]/55 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[rgba(17,19,21,0.12)] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-[#111315] flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[rgba(17,19,21,0.08)] flex items-start justify-between bg-[#FAF9F6] shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                {lang === "en" ? "Bidding Room" : "বিডিং তালিকা"}
              </span>
              <span className="text-xs text-[#8B9094]">•</span>
              <span className="text-xs font-semibold text-[#6B7278]">
                Client: {job.clientName} ({job.clientLocation})
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#111315] line-clamp-1">
              {lang === "en" ? job.title : (job.titleBn || job.title)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7278] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics & Stats Bar */}
        <div className="mk-dark-card text-white p-4 sm:p-5 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Total Bids Placed</span>
              <span className="text-lg sm:text-xl font-mono mk-tabular font-bold text-white">{totalBids}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Average Bid</span>
              <span className="text-lg sm:text-xl font-mono mk-tabular font-bold text-white">৳{avgBid.toLocaleString()}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Bid Range (Low - High)</span>
              <span className="text-xs sm:text-sm font-mono mk-tabular font-bold text-white">
                ৳{lowestBid.toLocaleString()} - ৳{highestBid.toLocaleString()}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Avg. Delivery</span>
              <span className="text-lg sm:text-xl font-mono mk-tabular font-bold text-white">{avgDelivery} Days</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & CTAs */}
        <div className="p-4 border-b border-[rgba(17,19,21,0.08)] flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#6B7278]" />
            <span className="text-xs font-bold text-[#6B7278]">Filter:</span>
            
            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono mk-tabular transition-all cursor-pointer ${
                filterMode === "ALL"
                  ? "bg-[#0B3B2E] text-white"
                  : "bg-[#F4F2EC] text-[#3F4448] hover:bg-[#EAF5F0] hover:text-[#0B3B2E]"
              }`}
            >
              All ({totalBids})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("SHORTLISTED")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                filterMode === "SHORTLISTED"
                  ? "bg-[#0F6E50] text-white"
                  : "bg-[#F4F2EC] text-[#3F4448] hover:bg-[#EAF5F0] hover:text-[#0B3B2E]"
              }`}
            >
              <Star className="w-3 h-3" />
              <span>Shortlisted</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("LOWEST")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterMode === "LOWEST"
                  ? "bg-[#0B3B2E] text-white"
                  : "bg-[#F4F2EC] text-[#3F4448] hover:bg-[#EAF5F0] hover:text-[#0B3B2E]"
              }`}
            >
              Lowest Bid (৳)
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("TOP_RATED")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterMode === "TOP_RATED"
                  ? "bg-[#0B3B2E] text-white"
                  : "bg-[#F4F2EC] text-[#3F4448] hover:bg-[#EAF5F0] hover:text-[#0B3B2E]"
              }`}
            >
              Top Rated
            </button>
          </div>

          {/* Freelancer Apply Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBidModal(job);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "Place Your Bid" : "আপনার বিড জমা দিন"}</span>
          </button>
        </div>

        {/* Bids List */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-[#FAF9F6]">
          {filteredBids.length === 0 ? (
            <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-10 text-center max-w-sm mx-auto my-6">
              <Award className="w-10 h-10 text-[#8B9094] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#111315]">No Bids Match This Filter</h4>
              <p className="text-xs text-[#6B7278] mt-1 mb-3">Try switching to &apos;All&apos; or place the first bid.</p>
              <button
                type="button"
                onClick={() => setFilterMode("ALL")}
                className="px-4 py-1.5 bg-[#F4F2EC] text-[#111315] font-bold text-xs rounded-xl hover:bg-[#EAF5F0] cursor-pointer"
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
                  className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
                    isAccepted
                      ? "border-[#0F6E50] ring-2 ring-[#0F6E50]/15 bg-[#EAF5F0]/35"
                      : isShortlisted
                      ? "border-[#A87224]/45 bg-[#FEF6E6]/25"
                      : "border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/35"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    {/* Freelancer Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img
                        src={bid.freelancerAvatar}
                        alt={bid.freelancerName}
                        className="w-12 h-12 rounded-xl object-cover border border-[rgba(17,19,21,0.12)] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-bold text-[#111315]">{bid.freelancerName}</h4>
                          {bid.isNidVerified && (
                            <span title="NID Smart Card Verified" className="text-[#0F6E50]">
                              <ShieldCheck className="w-4 h-4" />
                            </span>
                          )}
                          <span className="text-[11px] font-mono mk-tabular text-[#8B9094]">• {bid.submittedAt}</span>
                        </div>
                        <p className="text-xs text-[#6B7278] font-medium">{bid.freelancerTitle}</p>
                        
                        <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs">
                          <span className="flex items-center gap-1 text-[#A87224] font-mono mk-tabular font-bold">
                            <Star className="w-3.5 h-3.5 fill-[#A87224]" />
                            {bid.freelancerRating.toFixed(1)}
                            <span className="text-[#8B9094] font-normal">({bid.freelancerReviewsCount})</span>
                          </span>
                          <span className="text-[#8B9094]">•</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F4F2EC] text-[#3F4448] border border-[rgba(17,19,21,0.08)]">
                            Wallet: {bid.payoutMethod}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bid Rate & Timeline */}
                    <div className="text-left sm:text-right shrink-0 bg-[#FAF9F6] p-3 rounded-xl border border-[rgba(17,19,21,0.08)] sm:bg-transparent sm:p-0 sm:border-0">
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#6B7278] block font-bold">
                            Proposed Bid
                          </span>
                          <span className="text-xl font-mono mk-tabular font-bold text-[#111315] tracking-tight">
                            ৳{bid.bidAmountBdt.toLocaleString()} BDT
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-[#6B7278] font-mono mk-tabular font-semibold mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-[#8B9094]" />
                          <span>Delivery in {bid.deliveryDays} Days</span>
                        </div>
                      </div>

                      {bid.biddingType === "MILESTONES" && bid.milestones && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1E5B88] bg-[#EEF5FA] px-2 py-0.5 rounded-md mt-1 border border-[#1E5B88]/20 font-mono mk-tabular">
                          <Layers className="w-3 h-3" />
                          {bid.milestones.length} Milestones Structured
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Cover Letter */}
                  <div className="mt-3.5 pt-3 border-t border-[rgba(17,19,21,0.07)]">
                    <p className={`text-xs text-[#3F4448] leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                      {bid.coverLetter}
                    </p>
                    {bid.coverLetter.length > 130 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(bid.id)}
                        className="text-[11px] font-bold text-[#0F6E50] hover:text-[#0B3B2E] mt-1 cursor-pointer"
                      >
                        {isExpanded ? "Show Less" : "Read Full Proposal..."}
                      </button>
                    )}
                  </div>

                  {/* Milestones Preview (if any) */}
                  {bid.biddingType === "MILESTONES" && bid.milestones && isExpanded && (
                    <div className="mt-3 bg-[#FAF9F6] p-3 rounded-xl border border-[rgba(17,19,21,0.08)] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7278] block">Milestones:</span>
                      {bid.milestones.map((m, mIdx) => (
                        <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-[rgba(17,19,21,0.07)] last:border-0 gap-3">
                          <span className="text-[#111315]">#{mIdx + 1} {m.title}</span>
                          <div className="flex items-center gap-3 font-mono mk-tabular font-semibold text-[#111315] shrink-0">
                            <span>৳{m.amountBdt.toLocaleString()}</span>
                            <span className="text-[#6B7278] text-[11px]">({m.deliveryDays}d)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Portfolio Links */}
                  {bid.portfolioLinks && bid.portfolioLinks.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-[#6B7278]">Portfolio:</span>
                      {bid.portfolioLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E5B88] hover:underline bg-[#EEF5FA] border border-[#1E5B88]/15 px-2.5 py-0.5 rounded-md"
                        >
                          <span className="truncate max-w-xs">{link}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="mt-4 pt-3 border-t border-[rgba(17,19,21,0.07)] flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Status Pill */}
                    <div>
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3B2E] bg-[#EAF5F0] border border-[#0F6E50]/20 px-3 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 text-[#0F6E50]" />
                          Hired & Escrow Locked
                        </span>
                      ) : isShortlisted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#A87224] bg-[#FEF6E6] border border-[#A87224]/25 px-3 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-[#A87224]" />
                          Shortlisted Bid
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#6B7278]">
                          Status: Under Review
                        </span>
                      )}
                    </div>

                    {/* Client or Freelancer Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleShortlist(bid.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isShortlisted
                            ? "bg-[#FEF6E6] border-[#A87224]/25 text-[#A87224] hover:bg-[#FEF6E6]/80"
                            : "bg-[#F4F2EC] border-[rgba(17,19,21,0.08)] text-[#3F4448] hover:bg-[#EAF5F0] hover:text-[#0B3B2E]"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isShortlisted ? "fill-[#A87224] text-[#A87224]" : ""}`} />
                        <span>{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAcceptBidAndEscrow(job, bid)}
                        disabled={isAccepted}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                          isAccepted
                            ? "bg-[#F4F2EC] text-[#8B9094] cursor-not-allowed"
                            : "bg-[#0B3B2E] hover:bg-[#0F6E50] text-white"
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
        <div className="p-4 border-t border-[rgba(17,19,21,0.08)] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7278] shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0F6E50] shrink-0" />
            <span>All bids protected by MuktoKormo BDT Escrow & Dispute Resolution</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[rgba(17,19,21,0.12)] rounded-xl font-bold text-[#111315] hover:bg-[#F4F2EC] cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
