"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Job } from "@/types";
import { X, ShieldCheck, Lock, CheckCircle2, ArrowRight, RefreshCw, Smartphone, Briefcase } from "lucide-react";

interface EscrowModalProps {
  job: Job | null;
  contractId?: string;
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "bn";
  customAmount?: number;
  freelancerName?: string;
}

type EscrowState = "READY_TO_FUND" | "PROCESSING" | "ESCROW_LOCKED" | "WORK_SUBMITTED" | "FUNDS_RELEASED";

export default function EscrowModal({
  job,
  contractId,
  isOpen,
  onClose,
  lang,
  customAmount,
}: EscrowModalProps) {
  const [selectedGateway, setSelectedGateway] = useState<"bkash" | "nagad" | "card">("bkash");
  const [escrowState, setEscrowState] = useState<EscrowState>("READY_TO_FUND");

  if (!isOpen || !job) return null;

  const targetContractHref = contractId
    ? `/contracts/${contractId}`
    : "/contracts/ctr-8842";

  const milestoneAmount = customAmount || job.budgetBdt;
  const platformFee = Math.round(milestoneAmount * 0.07);
  const freelancerGets = milestoneAmount - platformFee;

  const handleFundEscrow = () => {
    setEscrowState("PROCESSING");
    setTimeout(() => {
      setEscrowState("ESCROW_LOCKED");
    }, 1000);
  };

  const handleSimulateWorkSubmitted = () => {
    setEscrowState("WORK_SUBMITTED");
  };

  const handleReleaseFunds = () => {
    setEscrowState("PROCESSING");
    setTimeout(() => {
      setEscrowState("FUNDS_RELEASED");
    }, 1000);
  };

  const handleReset = () => {
    setEscrowState("READY_TO_FUND");
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111315]/55 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[rgba(17,19,21,0.12)] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-[#111315]"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[rgba(17,19,21,0.08)] flex items-center justify-between bg-[#FAF9F6] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] border border-[#0F6E50]/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#0F6E50]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111315]">
                {lang === "en" ? "BDT Escrow Simulator" : "বিকাশ/নগদ এসক্রো সিমুলেটর"}
              </h3>
              <p className="text-xs text-[#6B7278]">
                {lang === "en" ? "Interactive test of milestone payment protection" : "নিরাপদ লেনদেনের ধাপগুলো পরীক্ষা করুন"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7278] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Milestone Details Card */}
          <div className="bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-[#6B7278] block font-bold">
                Milestone Contract
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#111315] mt-0.5 line-clamp-1">
                {job.title}
              </h4>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-mono mk-tabular font-bold text-[#111315] block">
                ৳{milestoneAmount.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#6B7278]">BDT in Escrow</span>
            </div>
          </div>

          {/* Pipeline */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className={`p-2.5 rounded-xl border font-mono mk-tabular ${
              escrowState === "ESCROW_LOCKED" || escrowState === "WORK_SUBMITTED" || escrowState === "FUNDS_RELEASED"
                ? "bg-[#EEF5FA] border-[#1E5B88]/30 text-[#1E5B88] font-bold"
                : "bg-[#F4F2EC] border-[rgba(17,19,21,0.08)] text-[#6B7278]"
            }`}>
              1. Funds Locked
            </div>

            <div className={`p-2.5 rounded-xl border font-mono mk-tabular ${
              escrowState === "WORK_SUBMITTED" || escrowState === "FUNDS_RELEASED"
                ? "bg-[#FEF6E6] border-[#A87224]/30 text-[#A87224] font-bold"
                : "bg-[#F4F2EC] border-[rgba(17,19,21,0.08)] text-[#6B7278]"
            }`}>
              2. Work Delivered
            </div>

            <div className={`p-2.5 rounded-xl border font-mono mk-tabular ${
              escrowState === "FUNDS_RELEASED"
                ? "bg-[#EAF5F0] border-[#0F6E50]/30 text-[#0B3B2E] font-bold"
                : "bg-[#F4F2EC] border-[rgba(17,19,21,0.08)] text-[#6B7278]"
            }`}>
              3. Released
            </div>
          </div>

          {/* Action Step */}
          {escrowState === "READY_TO_FUND" && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#3F4448] mb-2">
                  Select Payment Gateway:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("bkash")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "bkash"
                        ? "bg-[#EAF5F0] border-[#0F6E50] text-[#0B3B2E] shadow-2xs"
                        : "bg-white border-[rgba(17,19,21,0.12)] text-[#3F4448] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 ${selectedGateway === "bkash" ? "text-[#0F6E50]" : "text-[#E2136E]"}`} />
                    <span className="text-xs font-bold">bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway("nagad")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "nagad"
                        ? "bg-[#EAF5F0] border-[#0F6E50] text-[#0B3B2E] shadow-2xs"
                        : "bg-white border-[rgba(17,19,21,0.12)] text-[#3F4448] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 ${selectedGateway === "nagad" ? "text-[#0F6E50]" : "text-[#F6921E]"}`} />
                    <span className="text-xs font-bold">Nagad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway("card")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "card"
                        ? "bg-[#EAF5F0] border-[#0F6E50] text-[#0B3B2E] shadow-2xs"
                        : "bg-white border-[rgba(17,19,21,0.12)] text-[#3F4448] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <Lock className={`w-4 h-4 ${selectedGateway === "card" ? "text-[#0F6E50]" : "text-[#1E5B88]"}`} />
                    <span className="text-xs font-bold">Bank Cards</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFundEscrow}
                className="w-full py-3 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 font-mono mk-tabular"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Deposit ৳{milestoneAmount.toLocaleString()} to Escrow</span>
              </button>
            </div>
          )}

          {escrowState === "PROCESSING" && (
            <div className="py-8 text-center space-y-2.5">
              <RefreshCw className="w-7 h-7 text-[#0F6E50] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#6B7278]">Processing secure transaction...</p>
            </div>
          )}

          {escrowState === "ESCROW_LOCKED" && (
            <div className="bg-[#EEF5FA] border border-[#1E5B88]/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#1E5B88] font-bold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Funds Secured in MuktoKormo Escrow</span>
              </div>
              <p className="text-xs text-[#3F4448] leading-relaxed">
                Freelancer has been notified that the milestone is funded. It is now safe to begin development.
              </p>
              <div className="space-y-2 pt-1">
                <Link
                  href={targetContractHref}
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Open Contract Delivery Workspace →</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSimulateWorkSubmitted}
                  className="w-full py-2 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#111315] font-semibold text-xs border border-[rgba(17,19,21,0.12)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Quick Test: Simulate Work Submission</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {escrowState === "WORK_SUBMITTED" && (
            <div className="bg-[#FEF6E6] border border-[#A87224]/25 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[#A87224] font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Deliverables Ready for Inspection</span>
              </div>
              <p className="text-xs text-[#3F4448] leading-relaxed">
                Client reviews files. If satisfied, click release funds to disburse payment to freelancer.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleReleaseFunds}
                  className="w-full py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs shadow-xs cursor-pointer transition-all font-mono mk-tabular"
                >
                  Approve Work & Release ৳{milestoneAmount.toLocaleString()}
                </button>
                <Link
                  href={targetContractHref}
                  onClick={onClose}
                  className="w-full py-2 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#111315] border border-[rgba(17,19,21,0.12)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#0F6E50]" />
                  <span>Inspect in Delivery Workspace</span>
                </Link>
              </div>
            </div>
          )}

          {escrowState === "FUNDS_RELEASED" && (
            <div className="bg-[#EAF5F0] border border-[#0F6E50]/25 rounded-xl p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-white text-[#0F6E50] border border-[#0F6E50]/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#0B3B2E]">Milestone Completed</h4>
              <p className="text-xs text-[#3F4448] font-mono mk-tabular">
                ৳{freelancerGets.toLocaleString()} credited to Freelancer&apos;s bKash wallet. Fee: ৳{platformFee.toLocaleString()} (7%).
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <Link
                  href={targetContractHref}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Open Full Workspace</span>
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-white border border-[rgba(17,19,21,0.12)] text-xs font-semibold text-[#3F4448] cursor-pointer hover:bg-[#FAF9F6]"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
