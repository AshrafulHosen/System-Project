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
import useEscapeKey from "@/lib/hooks/useEscapeKey";

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
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-end bg-navy-ink/50 backdrop-blur-[2px] animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-xl h-full shadow-[var(--mk-shadow-popover)] flex flex-col text-ink border-l border-line"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between bg-canvas shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full mk-eyebrow bg-brand-soft text-navy border border-brand/20">
                Freelancer Hub
              </span>
              <span className="text-xs text-ink-4">•</span>
              <span className="text-xs font-mono mk-tabular font-semibold text-ink-3">{myBids.length} Active Bids</span>
            </div>
            <h3 className="text-lg font-semibold text-ink mt-1">
              {lang === "en" ? "My Submitted Bids & Proposals" : "আমার জমাকৃত বিডসমূহ"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-canvas">
          {myBids.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-xl border border-line my-8">
              <div className="w-14 h-14 rounded-xl bg-brand-soft border border-brand/20 text-brand flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7" />
              </div>
              <h4 className="text-base font-semibold text-ink">
                {lang === "en" ? "No Active Bids Placed Yet" : "এখনো কোনো বিড জমা দেওয়া হয়নি"}
              </h4>
              <p className="text-xs text-ink-3 max-w-xs mx-auto mt-1 mb-5 leading-relaxed">
                {lang === "en"
                  ? "Explore open jobs on the feed and submit your first proposal with guaranteed BDT escrow."
                  : "মার্কেটপ্লেসের কাজগুলো দেখুন এবং আপনার প্রথম বিড জমা দিন।"}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-navy hover:bg-brand text-white font-semibold text-xs rounded-lg cursor-pointer shadow-xs transition-colors"
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
                  className="bg-white border border-line hover:border-brand/35 rounded-xl p-5 shadow-2xs transition-all space-y-3"
                >
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider block">
                        Client: {matchedJob?.clientName || "Bangladeshi SME Client"}
                      </span>
                      <h4 className="text-sm font-semibold text-ink line-clamp-1 mt-0.5">
                        {matchedJob ? (lang === "en" ? matchedJob.title : (matchedJob.titleBn || matchedJob.title)) : "Job Submission"}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono mk-tabular font-semibold text-ink block">
                        ৳{bid.bidAmountBdt.toLocaleString()} BDT
                      </span>
                      <span className="text-[10px] font-mono mk-tabular text-brand font-semibold block">
                        Net: ৳{bid.netEarnedBdt.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status & Delivery */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-line text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {bid.status === "ACCEPTED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy bg-brand-soft border border-brand/20 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                          Accepted & Hired
                        </span>
                      ) : bid.status === "SHORTLISTED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent-soft border border-accent/25 px-2.5 py-0.5 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-accent" />
                          Shortlisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2 bg-subtle border border-line px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-ink-3" />
                          Under Review
                        </span>
                      )}

                      <span className="text-ink-3 font-mono mk-tabular text-[11px]">• Delivery: {bid.deliveryDays}d</span>
                      <span className="text-ink-3 text-[11px]">• {bid.payoutMethod}</span>
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
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-navy hover:bg-brand rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
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
                          className="px-2.5 py-1 text-[11px] font-semibold text-brand-strong hover:text-ink bg-brand-soft hover:bg-brand-soft/70 rounded-lg cursor-pointer transition-colors"
                        >
                          View Competing Bids
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onWithdrawBid(bid.id)}
                        className="p-1.5 text-ink-3 hover:text-danger hover:bg-danger-soft rounded-lg cursor-pointer transition-colors"
                        title="Withdraw Bid"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cover letter snippet */}
                  <p className="text-xs text-ink-2 line-clamp-2 pt-2 border-t border-line italic">
                    &ldquo;{bid.coverLetter}&rdquo;
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-canvas flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
            <span>Funds held safely in BDT Escrow until milestone acceptance</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-line-strong rounded-lg font-semibold text-ink hover:bg-subtle cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
