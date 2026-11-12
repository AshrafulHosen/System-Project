"use client";

import React, { useState } from "react";
import { Job, ProposalSubmission, BidMilestone } from "@/types";
import {
  X,
  Send,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Clock,
  Briefcase,
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  TrendingDown,
  TrendingUp,
  Check,
  Zap,
  Star,
} from "lucide-react";

interface BidModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitBid: (submission: ProposalSubmission) => void;
  lang: "en" | "bn";
}

export default function BidModal({
  job,
  isOpen,
  onClose,
  onSubmitBid,
  lang,
}: BidModalProps) {
  // Freelancer Info
  const [freelancerName] = useState("Tanvir Rahman");
  const [freelancerTitle] = useState("Senior Full-Stack Developer");
  const [phone, setPhone] = useState("+8801712345678");

  // Bidding Terms (initialized from the selected job; component is keyed by job id)
  const [bidAmount, setBidAmount] = useState<number>(job?.budgetBdt || 25000);
  const [deliveryDays, setDeliveryDays] = useState<number>(job?.deadlineDays || 10);
  const [biddingType, setBiddingType] = useState<"PROJECT" | "MILESTONES">("PROJECT");

  // Milestones
  const [milestones, setMilestones] = useState<BidMilestone[]>(() => {
    const half = Math.round((job?.budgetBdt || 25000) * 0.5);
    const halfDays = Math.max(2, Math.round((job?.deadlineDays || 10) * 0.5));
    return [
      { id: "m-1", title: "Phase 1: Design & Core Infrastructure", amountBdt: half, deliveryDays: halfDays },
      { id: "m-2", title: "Phase 2: Final Testing, Delivery & Deployment", amountBdt: half, deliveryDays: halfDays },
    ];
  });

  // Payment method
  const [payoutMethod, setPayoutMethod] = useState<"BKASH" | "NAGAD" | "ROCKET" | "BANK">("BKASH");
  const [payoutAccount, setPayoutAccount] = useState("+8801712-345678");

  // Pitch & Portfolio
  const [coverLetter, setCoverLetter] = useState(
    "Hello! I have reviewed your project requirements in detail. I have 4+ years of hands-on experience building production-grade solutions in Bangladesh with local payment gateways and zero downtime. I can start immediately and guarantee full revisions until you are completely satisfied."
  );
  const [portfolioLink, setPortfolioLink] = useState("https://github.com/tanvir-dev/showcase");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !job) return null;

  // Financial calculations
  const platformFee = Math.round(bidAmount * 0.07);
  const netEarnings = bidAmount - platformFee;

  // Milestone sum check
  const totalMilestonesAmount = milestones.reduce((sum, m) => sum + (m.amountBdt || 0), 0);
  const isMilestoneMismatched = biddingType === "MILESTONES" && totalMilestonesAmount !== bidAmount;

  // Comparison against client budget
  const budgetDiff = bidAmount - job.budgetBdt;
  const isBelowBudget = budgetDiff < 0;
  const isAboveBudget = budgetDiff > 0;
  const isExactBudget = budgetDiff === 0;

  // Quick Pitch Presets
  const applyPitchPreset = (type: "speed" | "quality" | "value") => {
    if (type === "speed") {
      setCoverLetter(
        `Hi ${job.clientName.split(" ")[0]}! I have completed identical ${job.skills[0] || "relevant"} projects. I have availability right now and can deliver your project within ${Math.max(2, Math.round(deliveryDays * 0.7))} days with daily progress updates and high-speed communication.`
      );
    } else if (type === "quality") {
      setCoverLetter(
        `Dear ${job.clientName.split(" ")[0]}, I am a NID-verified professional specializing in ${job.skills.slice(0, 3).join(", ")}. My approach focuses on production-grade quality, clean code architecture, and a seamless client experience with zero post-launch bugs.`
      );
    } else {
      setCoverLetter(
        `Hello! I offer an optimal balance of competitive pricing and high-end delivery for ${job.title}. This bid includes complete documentation, deployment support, and 30 days of complimentary maintenance support.`
      );
    }
  };

  const handleAddMilestone = () => {
    const newId = `m-${Date.now()}`;
    setMilestones([
      ...milestones,
      { id: newId, title: `Phase ${milestones.length + 1}: Additional Milestone`, amountBdt: 5000, deliveryDays: 3 }
    ]);
  };

  const handleRemoveMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleUpdateMilestone = (id: string, field: "title" | "amountBdt" | "deliveryDays", value: string | number) => {
    setMilestones(
      milestones.map((m) =>
        m.id !== id
          ? m
          : field === "title"
            ? { ...m, title: String(value) }
            : { ...m, [field]: Number(value) }
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submission: ProposalSubmission = {
      jobId: job.id,
      freelancerName,
      freelancerTitle,
      freelancerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      bidAmountBdt: bidAmount,
      platformFeeBdt: platformFee,
      netEarnedBdt: netEarnings,
      deliveryDays,
      coverLetter,
      phone,
      biddingType,
      milestones: biddingType === "MILESTONES" ? milestones : undefined,
      portfolioLinks: portfolioLink.trim() ? [portfolioLink.trim()] : [],
      payoutMethod,
    };

    onSubmitBid(submission);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111315]/55 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[rgba(17,19,21,0.12)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-[#111315] flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[rgba(17,19,21,0.08)] flex items-start justify-between bg-[#FAF9F6] shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                {lang === "en" ? "Freelancer Bidding Portal" : "ফ্রিল্যান্সার বিডিং পোর্টাল"}
              </span>
              <span className="text-xs text-[#8B9094]">•</span>
              <span className="text-xs font-semibold text-[#6B7278]">
                {job.clientName} ({job.clientLocation})
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

        {/* Content / Form */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4 my-auto overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-[#EAF5F0] text-[#0F6E50] flex items-center justify-center mx-auto border border-[#0F6E50]/25">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-2xl font-bold text-[#111315]">
              {lang === "en" ? "Bid Successfully Placed!" : "আপনার বিড সফলভাবে জমা হয়েছে!"}
            </h4>
            <p className="text-sm text-[#3F4448] max-w-md mx-auto font-mono mk-tabular leading-relaxed">
              {lang === "en"
                ? `Your proposal of ৳${bidAmount.toLocaleString()} BDT has been sent to ${job.clientName}. You will receive an SMS alert at ${phone} when the client reviews your bid.`
                : `আপনার ৳${bidAmount.toLocaleString()} টাকার প্রস্তাবনা ক্লায়েন্টের কাছে পাঠানো হয়েছে। ক্লায়েন্ট দেখলে ${phone} নম্বরে SMS নোটিফিকেশন পাবেন।`}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] text-[#0B3B2E] text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-[#0F6E50]" />
              <span>{lang === "en" ? "Secured by MuktoKormo BDT Escrow" : "মুক্তকর্ম BDT এসক্রো দ্বারা সুরক্ষিত"}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            
            {/* Job Context & Budget Benchmark */}
            <div className="bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7278] block">
                  {lang === "en" ? "Client's Stated Budget" : "ক্লায়েন্টের নির্ধারিত বাজেট"}
                </span>
                <span className="text-xl font-mono mk-tabular font-bold text-[#111315] tracking-tight">
                  ৳{job.budgetBdt.toLocaleString()} BDT
                </span>
                <span className="text-xs font-mono mk-tabular text-[#6B7278] block mt-0.5">
                  Est. Delivery: {job.deadlineDays} days • {job.experienceLevel}
                </span>
              </div>

              {/* Real-time Bid Competitiveness Indicator */}
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7278] block mb-1">
                  {lang === "en" ? "Bid Competitiveness" : "বিড রেটিং"}
                </span>
                {isBelowBudget && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono mk-tabular font-bold text-[#0B3B2E] bg-[#EAF5F0] border border-[#0F6E50]/20 px-2.5 py-1 rounded-lg">
                    <TrendingDown className="w-3.5 h-3.5 text-[#0F6E50]" />
                    ৳{Math.abs(budgetDiff).toLocaleString()} below budget (Competitive)
                  </span>
                )}
                {isExactBudget && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E5B88] bg-[#EEF5FA] border border-[#1E5B88]/20 px-2.5 py-1 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                    Exact Match with Client Budget
                  </span>
                )}
                {isAboveBudget && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono mk-tabular font-bold text-[#A87224] bg-[#FEF6E6] border border-[#A87224]/25 px-2.5 py-1 rounded-lg">
                    <TrendingUp className="w-3.5 h-3.5" />
                    ৳{budgetDiff.toLocaleString()} above budget (Premium)
                  </span>
                )}
              </div>
            </div>

            {/* Bidding Mode Switcher: By Project vs By Milestone */}
            <div>
              <label className="block text-xs font-bold text-[#3F4448] mb-2">
                {lang === "en" ? "How do you want to be paid?" : "আপনি কীভাবে পেমেন্ট নিতে চান?"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBiddingType("PROJECT")}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    biddingType === "PROJECT"
                      ? "border-[#0F6E50] bg-[#EAF5F0]/65 shadow-2xs"
                      : "border-[rgba(17,19,21,0.10)] bg-white hover:bg-[#FAF9F6]"
                  }`}
                >
                  <Briefcase className={`w-5 h-5 shrink-0 mt-0.5 ${biddingType === "PROJECT" ? "text-[#0F6E50]" : "text-[#8B9094]"}`} />
                  <div>
                    <span className="text-xs font-bold text-[#111315] block">By Project</span>
                    <span className="text-[11px] text-[#6B7278]">Single escrow release upon 100% completion</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBiddingType("MILESTONES")}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                    biddingType === "MILESTONES"
                      ? "border-[#0F6E50] bg-[#EAF5F0]/65 shadow-2xs"
                      : "border-[rgba(17,19,21,0.10)] bg-white hover:bg-[#FAF9F6]"
                  }`}
                >
                  <Layers className={`w-5 h-5 shrink-0 mt-0.5 ${biddingType === "MILESTONES" ? "text-[#0F6E50]" : "text-[#8B9094]"}`} />
                  <div>
                    <span className="text-xs font-bold text-[#111315] block">By Milestones</span>
                    <span className="text-[11px] text-[#6B7278]">Split into smaller deliverables & phased payouts</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Bid Amount & Timeline Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#3F4448] mb-1">
                  {lang === "en" ? "Total Bid Amount (৳ BDT)" : "মোট বিড অ্যামাউন্ট (৳ টাকা)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-mono font-bold text-[#6B7278]">৳</span>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-sm font-mono mk-tabular font-bold text-[#111315] focus:outline-hidden focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3F4448] mb-1">
                  {lang === "en" ? "Estimated Delivery Time (Days)" : "প্রজেক্ট ডেলিভারি সময় (দিন)"}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3 text-[#6B7278]" />
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-sm font-mono mk-tabular font-bold text-[#111315] focus:outline-hidden focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Milestone Builder (Visible if By Milestones selected) */}
            {biddingType === "MILESTONES" && (
              <div className="bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#111315] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0F6E50]" />
                    Milestone Deliverables Breakdown
                  </span>
                  <span className={`text-[11px] font-mono mk-tabular font-bold ${isMilestoneMismatched ? "text-[#A87224]" : "text-[#0F6E50]"}`}>
                    Sum: ৳{totalMilestonesAmount.toLocaleString()} / ৳{bidAmount.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  {milestones.map((m, idx) => (
                    <div key={m.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-[rgba(17,19,21,0.10)]">
                      <span className="text-[11px] font-mono mk-tabular font-bold text-[#6B7278] w-6 text-center shrink-0">#{idx + 1}</span>
                      <input
                        type="text"
                        placeholder="Milestone description"
                        value={m.title}
                        onChange={(e) => handleUpdateMilestone(m.id, "title", e.target.value)}
                        className="flex-1 min-w-[160px] text-xs px-2.5 py-1.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.10)] rounded-lg text-[#111315] focus:outline-hidden focus:ring-1 focus:ring-[#0F6E50]"
                      />
                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-2 top-1.5 text-xs font-mono text-[#6B7278]">৳</span>
                        <input
                          type="number"
                          value={m.amountBdt}
                          onChange={(e) => handleUpdateMilestone(m.id, "amountBdt", Number(e.target.value))}
                          className="w-full pl-5 pr-2 py-1.5 text-xs font-mono mk-tabular font-bold bg-[#FAF9F6] border border-[rgba(17,19,21,0.10)] rounded-lg text-[#111315] text-right focus:outline-hidden focus:ring-1 focus:ring-[#0F6E50]"
                        />
                      </div>
                      <div className="relative w-20 shrink-0">
                        <input
                          type="number"
                          placeholder="Days"
                          value={m.deliveryDays}
                          onChange={(e) => handleUpdateMilestone(m.id, "deliveryDays", Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs font-mono mk-tabular font-bold bg-[#FAF9F6] border border-[rgba(17,19,21,0.10)] rounded-lg text-[#111315] text-right focus:outline-hidden focus:ring-1 focus:ring-[#0F6E50]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        disabled={milestones.length <= 1}
                        className="p-1.5 text-[#6B7278] hover:text-[#DC2626] disabled:opacity-30 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0F6E50] hover:text-[#0B3B2E] cursor-pointer pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Milestone</span>
                </button>
              </div>
            )}

            {/* Financial Calculator: Platform Fee & Net Payout */}
            <div className="bg-[#EAF5F0] border border-[#0F6E50]/20 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#0B3B2E]">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#0F6E50]" />
                  Net Take-Home Earnings (7% Flat Platform Fee)
                </span>
                <span className="text-[11px] font-semibold text-[#0F6E50]">Bangladesh MFS Direct</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#0F6E50]/15 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-[#0F6E50]/15">
                  <span className="text-[10px] text-[#6B7278] block font-semibold">Your Gross Bid</span>
                  <span className="text-sm font-mono mk-tabular font-bold text-[#111315]">৳{bidAmount.toLocaleString()}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#0F6E50]/15">
                  <span className="text-[10px] text-[#6B7278] block font-semibold">Platform Fee (7%)</span>
                  <span className="text-sm font-mono mk-tabular font-bold text-[#DC2626]">-৳{platformFee.toLocaleString()}</span>
                </div>
                <div className="bg-[#0B3B2E] p-2.5 rounded-xl text-white shadow-2xs">
                  <span className="text-[10px] text-white/75 block font-semibold">You Receive (Net)</span>
                  <span className="text-sm font-mono mk-tabular font-bold text-white">৳{netEarnings.toLocaleString()}</span>
                </div>
              </div>

              {/* Payout Channel Selector */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#0B3B2E]">Receiving Wallet:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {(["BKASH", "NAGAD", "ROCKET", "BANK"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayoutMethod(method)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        payoutMethod === method
                          ? "bg-[#0B3B2E] text-white"
                          : "bg-white text-[#3F4448] border border-[rgba(17,19,21,0.12)] hover:bg-[#FAF9F6]"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    placeholder="Mobile / Account"
                    className="w-36 px-2.5 py-1 bg-white border border-[rgba(17,19,21,0.12)] rounded-lg text-xs font-mono mk-tabular font-semibold text-[#111315] focus:outline-hidden focus:ring-1 focus:ring-[#0F6E50]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Pitch Presets */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-bold text-[#3F4448]">
                  {lang === "en" ? "Cover Letter & Proposal Pitch" : "কভার লেটার ও প্রস্তাবনার বিবরণ"}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[#6B7278] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#A87224]" />
                    Quick Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPitchPreset("speed")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F2EC] hover:bg-[#EAF5F0] text-[#3F4448] hover:text-[#0B3B2E] font-semibold cursor-pointer transition-colors"
                  >
                    <Zap className="w-3 h-3 text-[#A87224]" />
                    <span>Fast Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPitchPreset("quality")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F2EC] hover:bg-[#EAF5F0] text-[#3F4448] hover:text-[#0B3B2E] font-semibold cursor-pointer transition-colors"
                  >
                    <Star className="w-3 h-3 text-[#A87224]" />
                    <span>Senior Quality</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you are the best fit for this project..."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#0F6E50] focus:bg-white resize-none"
              />
            </div>

            {/* Portfolio Link & Freelancer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3F4448] mb-1">
                  Relevant Portfolio / Demo Link
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-[#6B7278]" />
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://github.com/your-work"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] focus:outline-hidden focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3F4448] mb-1">
                  SMS Notification Phone (+880)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-mono mk-tabular text-[#111315] focus:outline-hidden focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[rgba(17,19,21,0.08)] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#6B7278] hover:text-[#111315] cursor-pointer"
              >
                {lang === "en" ? "Cancel" : "বাতিল"}
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold px-7 py-2.5 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "Submit Bid Now" : "বিড জমা দিন"}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
