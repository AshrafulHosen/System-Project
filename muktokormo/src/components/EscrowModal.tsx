"use client";

import React, { useState } from "react";
import { Job } from "@/types";
import { X, ShieldCheck, Lock, CheckCircle2, ArrowRight, RefreshCw, Smartphone } from "lucide-react";

interface EscrowModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "bn";
}

type EscrowState = "READY_TO_FUND" | "PROCESSING" | "ESCROW_LOCKED" | "WORK_SUBMITTED" | "FUNDS_RELEASED";

export default function EscrowModal({
  job,
  isOpen,
  onClose,
  lang,
}: EscrowModalProps) {
  const [selectedGateway, setSelectedGateway] = useState<"bkash" | "nagad" | "card">("bkash");
  const [escrowState, setEscrowState] = useState<EscrowState>("READY_TO_FUND");

  if (!isOpen || !job) return null;

  const milestoneAmount = job.budgetBdt;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-900">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Lock className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === "en" ? "BDT Escrow Simulator" : "বিকাশ/নগদ এসক্রো সিমুলেটর"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === "en" ? "Interactive test of milestone payment protection" : "নিরাপদ লেনদেনের ধাপগুলো পরীক্ষা করুন"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          
          {/* Milestone Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Milestone Contract
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                {job.title}
              </h4>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-black text-slate-900 block">
                ৳{milestoneAmount.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">BDT in Escrow</span>
            </div>
          </div>

          {/* Pipeline */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2.5 rounded-xl border ${
              escrowState === "ESCROW_LOCKED" || escrowState === "WORK_SUBMITTED" || escrowState === "FUNDS_RELEASED"
                ? "bg-sky-50 border-sky-400 text-sky-800 font-bold"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              1. Funds Locked
            </div>

            <div className={`p-2.5 rounded-xl border ${
              escrowState === "WORK_SUBMITTED" || escrowState === "FUNDS_RELEASED"
                ? "bg-sky-50 border-sky-400 text-sky-800 font-bold"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              2. Work Delivered
            </div>

            <div className={`p-2.5 rounded-xl border ${
              escrowState === "FUNDS_RELEASED"
                ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              3. Released
            </div>
          </div>

          {/* Action Step */}
          {escrowState === "READY_TO_FUND" && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Select Payment Gateway:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("bkash")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "bkash"
                        ? "bg-pink-50 border-pink-500 text-pink-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-bold">bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway("nagad")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "nagad"
                        ? "bg-orange-50 border-orange-500 text-orange-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold">Nagad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway("card")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedGateway === "card"
                        ? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Lock className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold">Bank Cards</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleFundEscrow}
                className="w-full py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Deposit ৳{milestoneAmount.toLocaleString()} to Escrow</span>
              </button>
            </div>
          )}

          {escrowState === "PROCESSING" && (
            <div className="py-6 text-center space-y-2">
              <RefreshCw className="w-7 h-7 text-sky-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Processing secure transaction...</p>
            </div>
          )}

          {escrowState === "ESCROW_LOCKED" && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Funds Secured in MuktoKormo Escrow</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Freelancer has been notified that the milestone is funded. It is now safe to begin development.
              </p>
              <button
                onClick={handleSimulateWorkSubmitted}
                className="w-full py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <span>Simulate: Freelancer Submits Completed Work</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {escrowState === "WORK_SUBMITTED" && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Deliverables Ready for Inspection</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client reviews files. If satisfied, click release funds to disburse payment to freelancer.
              </p>
              <button
                onClick={handleReleaseFunds}
                className="w-full py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer transition-all"
              >
                Approve Work & Release ৳{milestoneAmount.toLocaleString()}
              </button>
            </div>
          )}

          {escrowState === "FUNDS_RELEASED" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Milestone Completed!</h4>
              <p className="text-xs text-slate-600">
                ৳{freelancerGets.toLocaleString()} credited to Freelancer's bKash wallet. Fee: ৳{platformFee.toLocaleString()} (7%).
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Reset Simulator
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
