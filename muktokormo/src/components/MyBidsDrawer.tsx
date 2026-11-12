"use client";

import React from "react";
import Link from "next/link";
import { isUuid } from "@/lib/payments/constants";
import { Job, JobBid } from "@/types";
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Star, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";

interface MyBidsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  myBids: JobBid[];
  jobs: Job[];
  onWithdrawBid: (bidId: string) => void;
  onViewJobBids: (job: Job) => void;
  lang: "en" | "bn";
}

export default function MyBidsDrawer({
  isOpen,
  onClose,
  myBids,
  jobs,
  onWithdrawBid,
  onViewJobBids,
  lang,
}: MyBidsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-end bg-[#111315]/55 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col text-[#111315] border-l border-[rgba(17,19,21,0.12)]"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[rgba(17,19,21,0.08)] flex items-center justify-between bg-[#FAF9F6] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                Freelancer Hub
              </span>
              <span className="text-xs text-[#8B9094]">•</span>
              <span className="text-xs font-mono mk-tabular font-bold text-[#6B7278]">{myBids.length} Active Bids</span>
            </div>
            <h3 className="text-lg font-bold text-[#111315] mt-1">
              {lang === "en" ? "My Submitted Bids & Proposals" : "আমার জমাকৃত বিডসমূহ"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7278] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[#FAF9F6]">
          {myBids.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[rgba(17,19,21,0.09)] my-8">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5F0] border border-[#0F6E50]/20 text-[#0F6E50] flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-[#111315]">
                {lang === "en" ? "No Active Bids Placed Yet" : "এখনো কোনো বিড জমা দেওয়া হয়নি"}
              </h4>
              <p className="text-xs text-[#6B7278] max-w-xs mx-auto mt-1 mb-5 leading-relaxed">
                {lang === "en"
                  ? "Explore open jobs on the feed and submit your first proposal with guaranteed BDT escrow."
                  : "মার্কেটপ্লেসের কাজগুলো দেখুন এবং আপনার প্রথম বিড জমা দিন।"}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Explore Open Jobs
              </button>
            </div>
          ) : (
            myBids.map((bid) => {
              const matchedJob = jobs.find((j) => j.id === bid.jobId);

              return (
                <div
                  key={bid.id}
                  className="bg-white border border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/35 rounded-2xl p-5 shadow-2xs transition-all space-y-3"
                >
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#6B7278] uppercase tracking-wider block">
                        Client: {matchedJob?.clientName || "Bangladeshi SME Client"}
                      </span>
                      <h4 className="text-sm font-bold text-[#111315] line-clamp-1 mt-0.5">
                        {matchedJob ? (lang === "en" ? matchedJob.title : (matchedJob.titleBn || matchedJob.title)) : "Job Submission"}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono mk-tabular font-bold text-[#111315] block">
                        ৳{bid.bidAmountBdt.toLocaleString()} BDT
                      </span>
                      <span className="text-[10px] font-mono mk-tabular text-[#0F6E50] font-bold block">
                        Net: ৳{bid.netEarnedBdt.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status & Delivery */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[rgba(17,19,21,0.07)] text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {bid.status === "ACCEPTED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B3B2E] bg-[#EAF5F0] border border-[#0F6E50]/20 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E50]" />
                          Accepted & Hired
                        </span>
                      ) : bid.status === "SHORTLISTED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A87224] bg-[#FEF6E6] border border-[#A87224]/25 px-2.5 py-0.5 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-[#A87224]" />
                          Shortlisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3F4448] bg-[#F4F2EC] border border-[rgba(17,19,21,0.08)] px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-[#6B7278]" />
                          Under Review
                        </span>
                      )}

                      <span className="text-[#6B7278] font-mono mk-tabular text-[11px]">• Delivery: {bid.deliveryDays}d</span>
                      <span className="text-[#6B7278] text-[11px]">• {bid.payoutMethod}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {bid.status === "ACCEPTED" && (
                        <Link
                          href={
                            isUuid(bid.id)
                              ? `/contracts/ctr-${bid.id}`
                              : "/contracts/ctr-8842"
                          }
                          onClick={onClose}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#0B3B2E] hover:bg-[#0F6E50] rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <span>Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}

                      {matchedJob && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewJobBids(matchedJob);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#1E5B88] hover:text-[#111315] bg-[#EEF5FA] hover:bg-[#EEF5FA]/70 rounded-lg cursor-pointer transition-colors"
                        >
                          View Competing Bids
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onWithdrawBid(bid.id)}
                        className="p-1.5 text-[#6B7278] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg cursor-pointer transition-colors"
                        title="Withdraw Bid"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cover letter snippet */}
                  <p className="text-xs text-[#3F4448] line-clamp-2 pt-2 border-t border-[rgba(17,19,21,0.06)] italic">
                    &ldquo;{bid.coverLetter}&rdquo;
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(17,19,21,0.08)] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7278] shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0F6E50] shrink-0" />
            <span>Funds held safely in BDT Escrow until milestone acceptance</span>
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
