"use client";

import React, { useState } from "react";
import { Job, ProposalSubmission } from "@/types";
import { X, Send, ShieldCheck, CheckCircle2, Calculator } from "lucide-react";

interface ProposalModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitProposal: (submission: ProposalSubmission) => void;
  lang: "en" | "bn";
}

export default function ProposalModal({
  job,
  isOpen,
  onClose,
  onSubmitProposal,
  lang,
}: ProposalModalProps) {
  const [freelancerName, setFreelancerName] = useState("Tanvir Rahman");
  const [bidAmount, setBidAmount] = useState<number>(job?.budgetBdt || 25000);
  const [deliveryDays, setDeliveryDays] = useState<number>(job?.deadlineDays || 7);
  const [phone, setPhone] = useState("+8801712345678");
  const [coverLetter, setCoverLetter] = useState(
    "Hello! I have carefully read your requirements. I have 4+ years of hands-on experience delivering similar projects on time. I can start immediately and guarantee full revisions until you are 100% satisfied."
  );
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (job) {
      setBidAmount(job.budgetBdt);
      setDeliveryDays(job.deadlineDays);
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const platformFee = Math.round(bidAmount * 0.07);
  const netEarnings = bidAmount - platformFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission: ProposalSubmission = {
      jobId: job.id,
      freelancerName,
      bidAmountBdt: bidAmount,
      platformFeeBdt: platformFee,
      netEarnedBdt: netEarnings,
      deliveryDays,
      coverLetter,
      phone,
    };

    onSubmitProposal(submission);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-900">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block mb-0.5">
              {lang === "en" ? "Submit Proposal" : "প্রস্তাবনা জমা দিন"}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
              {lang === "en" ? job.title : (job.titleBn || job.title)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              {lang === "en" ? "Proposal Submitted!" : "প্রস্তাবনা সফলভাবে পাঠানো হয়েছে!"}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {lang === "en"
                ? `You will receive an SMS alert at ${phone} when the client reviews your bid.`
                : `ক্লায়েন্ট আবেদনটি দেখলে ${phone} নম্বরে নোটিফিকেশন পাঠানো হবে।`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* Job Context */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Client's Budget:</span>
                <span className="text-base font-black text-slate-900">৳{job.budgetBdt.toLocaleString()} BDT</span>
              </div>
              <span className="text-xs font-semibold text-sky-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {job.clientLocation}
              </span>
            </div>

            {/* Freelancer Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={freelancerName}
                  onChange={(e) => setFreelancerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Phone (SMS alerts)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Calculator Card */}
            <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700">
                <Calculator className="w-3.5 h-3.5" />
                <span>Earnings Breakdown (7% Flat Fee)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Your Bid in BDT (৳)</label>
                  <input
                    type="number"
                    required
                    min="500"
                    step="500"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Days</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="90"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-sky-200/80 flex justify-between text-xs">
                <span className="text-slate-500">Platform Fee (-7%):</span>
                <span className="font-semibold text-slate-700">-৳{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-slate-900 pt-0.5">
                <span>You will receive in bKash/Bank:</span>
                <span className="text-sm text-sky-600">৳{netEarnings.toLocaleString()} BDT</span>
              </div>
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Cover Letter
              </label>
              <textarea
                rows={3}
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed"
              />
            </div>

            {/* Guarantee Callout */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Client funds milestone escrow before work begins.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Proposal for ৳{bidAmount.toLocaleString()}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
