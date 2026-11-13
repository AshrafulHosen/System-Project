"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Job } from "@/types";
import { X, ShieldCheck, Lock, CheckCircle2, ArrowRight, RefreshCw, Smartphone, Briefcase } from "lucide-react";
import useEscapeKey from "@/lib/hooks/useEscapeKey";

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
  useEscapeKey(isOpen, onClose);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-ink/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="bg-white border border-line rounded-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden shadow-[var(--mk-shadow-popover)] relative text-ink"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between bg-canvas shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-soft border border-brand/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">
                {lang === "en" ? "BDT Escrow Simulator" : "বিকাশ/নগদ এসক্রো সিমুলেটর"}
              </h3>
              <p className="text-xs text-ink-3">
                {lang === "en" ? "Interactive test of milestone payment protection" : "নিরাপদ লেনদেনের ধাপগুলো পরীক্ষা করুন"}
              </p>
            </div>
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

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Milestone Details Card */}
          <div className="bg-canvas border border-line rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-ink-3 block font-semibold">
                Milestone Contract
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-ink mt-0.5 line-clamp-1">
                {job.title}
              </h4>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-mono mk-tabular font-semibold text-ink block">
                ৳{milestoneAmount.toLocaleString()}
              </span>
              <span className="text-[10px] text-ink-3">BDT in Escrow</span>
            </div>
          </div>

          {/* Pipeline */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className={`p-2.5 rounded-lg border font-mono mk-tabular ${
              escrowState === "ESCROW_LOCKED" || escrowState === "WORK_SUBMITTED" || escrowState === "FUNDS_RELEASED"
                ? "bg-brand-soft border-brand-strong/30 text-brand-strong font-semibold"
                : "bg-subtle border-line text-ink-3"
            }`}>
              1. Funds Locked
            </div>

            <div className={`p-2.5 rounded-lg border font-mono mk-tabular ${
              escrowState === "WORK_SUBMITTED" || escrowState === "FUNDS_RELEASED"
                ? "bg-accent-soft border-accent/30 text-accent font-semibold"
                : "bg-subtle border-line text-ink-3"
            }`}>
              2. Work Delivered
            </div>

            <div className={`p-2.5 rounded-lg border font-mono mk-tabular ${
              escrowState === "FUNDS_RELEASED"
                ? "bg-brand-soft border-brand/30 text-navy font-semibold"
                : "bg-subtle border-line text-ink-3"
            }`}>
              3. Released
            </div>
          </div>

          {/* Action Step */}
          {escrowState === "READY_TO_FUND" && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-2">
                  Select Payment Gateway:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("bkash")}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "bkash"
                        ? "bg-brand-soft border-brand text-navy shadow-2xs"
                        : "bg-white border-line-strong text-ink-2 hover:bg-canvas"
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 ${selectedGateway === "bkash" ? "text-brand" : "text-[#E2136E]"}`} />
                    <span className="text-xs font-semibold">bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway("nagad")}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "nagad"
                        ? "bg-brand-soft border-brand text-navy shadow-2xs"
                        : "bg-white border-line-strong text-ink-2 hover:bg-canvas"
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 ${selectedGateway === "nagad" ? "text-brand" : "text-[#F6921E]"}`} />
                    <span className="text-xs font-semibold">Nagad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway("card")}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "card"
                        ? "bg-brand-soft border-brand text-navy shadow-2xs"
                        : "bg-white border-line-strong text-ink-2 hover:bg-canvas"
                    }`}
                  >
                    <Lock className={`w-4 h-4 ${selectedGateway === "card" ? "text-brand" : "text-brand-strong"}`} />
                    <span className="text-xs font-semibold">Bank Cards</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFundEscrow}
                className="w-full py-3 rounded-lg bg-navy hover:bg-brand text-white font-semibold text-xs shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 font-mono mk-tabular"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Deposit ৳{milestoneAmount.toLocaleString()} to Escrow</span>
              </button>
            </div>
          )}

          {escrowState === "PROCESSING" && (
            <div className="py-8 text-center space-y-2.5">
              <RefreshCw className="w-7 h-7 text-brand animate-spin mx-auto" />
              <p className="text-xs font-semibold text-ink-3">Processing secure transaction...</p>
            </div>
          )}

          {escrowState === "ESCROW_LOCKED" && (
            <div className="bg-brand-soft border border-brand-strong/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-brand-strong font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Funds Secured in MuktoKormo Escrow</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                Freelancer has been notified that the milestone is funded. It is now safe to begin development.
              </p>
              <div className="space-y-2 pt-1">
                <Link
                  href={targetContractHref}
                  onClick={onClose}
                  className="w-full py-2.5 rounded-lg bg-navy hover:bg-brand text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Open Contract Delivery Workspace →</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSimulateWorkSubmitted}
                  className="w-full py-2 rounded-lg bg-white hover:bg-canvas text-ink font-semibold text-xs border border-line-strong flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Quick Test: Simulate Work Submission</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {escrowState === "WORK_SUBMITTED" && (
            <div className="bg-accent-soft border border-accent/25 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-accent font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Deliverables Ready for Inspection</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                Client reviews files. If satisfied, click release funds to disburse payment to freelancer.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleReleaseFunds}
                  className="w-full py-2.5 rounded-lg bg-navy hover:bg-brand text-white font-semibold text-xs shadow-xs cursor-pointer transition-all font-mono mk-tabular"
                >
                  Approve Work & Release ৳{milestoneAmount.toLocaleString()}
                </button>
                <Link
                  href={targetContractHref}
                  onClick={onClose}
                  className="w-full py-2 rounded-lg bg-white hover:bg-canvas text-ink border border-line-strong font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5 text-brand" />
                  <span>Inspect in Delivery Workspace</span>
                </Link>
              </div>
            </div>
          )}

          {escrowState === "FUNDS_RELEASED" && (
            <div className="bg-brand-soft border border-brand/25 rounded-lg p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-white text-brand border border-brand/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-navy">Milestone Completed</h4>
              <p className="text-xs text-ink-2 font-mono mk-tabular">
                ৳{freelancerGets.toLocaleString()} credited to Freelancer&apos;s bKash wallet. Fee: ৳{platformFee.toLocaleString()} (7%).
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <Link
                  href={targetContractHref}
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Open Full Workspace</span>
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-white border border-line-strong text-xs font-semibold text-ink-2 cursor-pointer hover:bg-canvas"
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
