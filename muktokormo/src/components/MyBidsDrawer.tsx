"use client";

import React from "react";
import Link from "next/link";
import { Job, JobBid } from "@/types";
import { 
  X, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Star, 
  Layers, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col text-slate-900 border-l border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Freelancer Hub
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500">{myBids.length} Active Bids</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              {lang === "en" ? "My Submitted Bids & Proposals" : "আমার জমাকৃত বিডসমূহ"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
          {myBids.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 my-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {lang === "en" ? "No Active Bids Placed Yet" : "এখনো কোনো বিড জমা দেওয়া হয়নি"}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-5">
                {lang === "en"
                  ? "Explore open jobs on the feed and submit your first proposal with guaranteed BDT escrow."
                  : "মার্কেটপ্লেসের কাজগুলো দেখুন এবং আপনার প্রথম বিড জমা দিন।"}
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-xs"
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
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3"
                >
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Client: {matchedJob?.clientName || "Bangladeshi SME Client"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {matchedJob ? (lang === "en" ? matchedJob.title : (matchedJob.titleBn || matchedJob.title)) : "Job Submission"}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 block">
                        ৳{bid.bidAmountBdt.toLocaleString()} BDT
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Net: ৳{bid.netEarnedBdt.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Status & Delivery */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      {bid.status === "ACCEPTED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Accepted & Hired
                        </span>
                      ) : bid.status === "SHORTLISTED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                          Shortlisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Under Review
                        </span>
                      )}

                      <span className="text-slate-400 text-[11px]">• Delivery: {bid.deliveryDays}d</span>
                      <span className="text-slate-400 text-[11px]">• {bid.payoutMethod}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {bid.status === "ACCEPTED" && (
                        <Link
                          href="/contracts/ctr-8842"
                          onClick={onClose}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <span>Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}

                      {matchedJob && (
                        <button
                          onClick={() => {
                            onClose();
                            onViewJobBids(matchedJob);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                        >
                          View Competing Bids
                        </button>
                      )}

                      <button
                        onClick={() => onWithdrawBid(bid.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Withdraw Bid"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cover letter snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 pt-1 border-t border-slate-50 italic">
                    "{bid.coverLetter}"
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Funds held safely in BDT Escrow until milestone acceptance</span>
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
