"use client";

import React, { useState, useEffect } from "react";
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
  Wallet, 
  AlertCircle,
  Link as LinkIcon,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Check
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
  const [freelancerName, setFreelancerName] = useState("Tanvir Rahman");
  const [freelancerTitle, setFreelancerTitle] = useState("Senior Full-Stack Developer");
  const [phone, setPhone] = useState("+8801712345678");

  // Bidding Terms
  const [bidAmount, setBidAmount] = useState<number>(25000);
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [biddingType, setBiddingType] = useState<"PROJECT" | "MILESTONES">("PROJECT");

  // Milestones
  const [milestones, setMilestones] = useState<BidMilestone[]>([
    { id: "m-1", title: "Initial Prototype & UI Architecture", amountBdt: 12000, deliveryDays: 4 },
    { id: "m-2", title: "Final Implementation & Payment Gateway", amountBdt: 13000, deliveryDays: 3 },
  ]);

  // Payment method
  const [payoutMethod, setPayoutMethod] = useState<"BKASH" | "NAGAD" | "ROCKET" | "BANK">("BKASH");
  const [payoutAccount, setPayoutAccount] = useState("+8801712-345678");

  // Pitch & Portfolio
  const [coverLetter, setCoverLetter] = useState(
    "Hello! I have reviewed your project requirements in detail. I have 4+ years of hands-on experience building production-grade solutions in Bangladesh with local payment gateways and zero downtime. I can start immediately and guarantee full revisions until you are completely satisfied."
  );
  const [portfolioLink, setPortfolioLink] = useState("https://github.com/tanvir-dev/showcase");
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync default values when job changes
  useEffect(() => {
    if (job) {
      setBidAmount(job.budgetBdt);
      setDeliveryDays(job.deadlineDays || 10);
      setMilestones([
        { 
          id: "m-1", 
          title: "Phase 1: Design & Core Infrastructure", 
          amountBdt: Math.round(job.budgetBdt * 0.5), 
          deliveryDays: Math.max(2, Math.round((job.deadlineDays || 10) * 0.5)) 
        },
        { 
          id: "m-2", 
          title: "Phase 2: Final Testing, Delivery & Deployment", 
          amountBdt: Math.round(job.budgetBdt * 0.5), 
          deliveryDays: Math.max(2, Math.round((job.deadlineDays || 10) * 0.5)) 
        },
      ]);
    }
  }, [job]);

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

  const handleUpdateMilestone = (id: string, field: keyof BidMilestone, value: any) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-slate-900 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {lang === "en" ? "Freelancer Bidding Portal" : "ফ্রিল্যান্সার বিডিং পোর্টাল"}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">
                {job.clientName} ({job.clientLocation})
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1">
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

        {/* Content / Form */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-inner animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-black text-slate-900">
              {lang === "en" ? "Bid Successfully Placed!" : "আপনার বিড সফলভাবে জমা হয়েছে!"}
            </h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {lang === "en"
                ? `Your proposal of ৳${bidAmount.toLocaleString()} BDT has been sent to ${job.clientName}. You will receive an SMS alert at ${phone} when the client reviews your bid.`
                : `আপনার ৳${bidAmount.toLocaleString()} টাকার প্রস্তাবনা ক্লায়েন্টের কাছে পাঠানো হয়েছে। ক্লায়েন্ট দেখলে ${phone} নম্বরে SMS নোটিফিকেশন পাবেন।`}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{lang === "en" ? "Secured by MuktoKormo BDT Escrow" : "মুক্তকর্ম BDT এসক্রো দ্বারা সুরক্ষিত"}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            
            {/* Job Context & Budget Benchmark */}
            <div className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  {lang === "en" ? "Client's Stated Budget" : "ক্লায়েন্টের নির্ধারিত বাজেট"}
                </span>
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  ৳{job.budgetBdt.toLocaleString()} BDT
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Est. Delivery: {job.deadlineDays} days • {job.experienceLevel}
                </span>
              </div>

              {/* Real-time Bid Competitiveness Indicator */}
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {lang === "en" ? "Bid Competitiveness:" : "বিড রেটিং:"}
                </span>
                {isBelowBudget && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    <TrendingDown className="w-3.5 h-3.5" />
                    ৳{Math.abs(budgetDiff).toLocaleString()} below budget (Competitive)
                  </span>
                )}
                {isExactBudget && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-100/80 px-2.5 py-1 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                    Exact Match with Client Budget
                  </span>
                )}
                {isAboveBudget && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                    <TrendingUp className="w-3.5 h-3.5" />
                    ৳{budgetDiff.toLocaleString()} above budget (Premium)
                  </span>
                )}
              </div>
            </div>

            {/* Bidding Mode Switcher: By Project vs By Milestone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {lang === "en" ? "How do you want to be paid?" : "আপনি কীভাবে পেমেন্ট নিতে চান?"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBiddingType("PROJECT")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    biddingType === "PROJECT"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Briefcase className={`w-5 h-5 shrink-0 mt-0.5 ${biddingType === "PROJECT" ? "text-emerald-600" : "text-slate-400"}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">By Project</span>
                    <span className="text-[11px] text-slate-500">Single escrow release upon 100% completion</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBiddingType("MILESTONES")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    biddingType === "MILESTONES"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <Layers className={`w-5 h-5 shrink-0 mt-0.5 ${biddingType === "MILESTONES" ? "text-emerald-600" : "text-slate-400"}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">By Milestones</span>
                    <span className="text-[11px] text-slate-500">Split into smaller deliverables & phased payouts</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Bid Amount & Timeline Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en" ? "Total Bid Amount (৳ BDT)" : "মোট বিড অ্যামাউন্ট (৳ টাকা)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en" ? "Estimated Delivery Time (Days)" : "প্রজেক্ট ডেলিভারি সময় (দিন)"}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Milestone Builder (Visible if By Milestones selected) */}
            {biddingType === "MILESTONES" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Milestone Deliverables Breakdown
                  </span>
                  <span className={`text-[11px] font-bold ${isMilestoneMismatched ? "text-amber-600" : "text-emerald-700"}`}>
                    Sum: ৳{totalMilestonesAmount.toLocaleString()} / ৳{bidAmount.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  {milestones.map((m, idx) => (
                    <div key={m.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-black text-slate-400 w-5 text-center">#{idx + 1}</span>
                      <input
                        type="text"
                        placeholder="Milestone description"
                        value={m.title}
                        onChange={(e) => handleUpdateMilestone(m.id, "title", e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">৳</span>
                        <input
                          type="number"
                          value={m.amountBdt}
                          onChange={(e) => handleUpdateMilestone(m.id, "amountBdt", Number(e.target.value))}
                          className="w-full pl-5 pr-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-900 text-right"
                        />
                      </div>
                      <div className="relative w-20">
                        <input
                          type="number"
                          placeholder="Days"
                          value={m.deliveryDays}
                          onChange={(e) => handleUpdateMilestone(m.id, "deliveryDays", Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-900 text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        disabled={milestones.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Milestone</span>
                </button>
              </div>
            )}

            {/* Financial Calculator: Platform Fee & Net Payout */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  Net Take-Home Earnings (7% Flat Platform Fee)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Bangladesh MFS Direct</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/80 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Your Gross Bid</span>
                  <span className="text-sm font-black text-slate-900">৳{bidAmount.toLocaleString()}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Platform Fee (7%)</span>
                  <span className="text-sm font-black text-rose-500">-৳{platformFee.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-xs">
                  <span className="text-[10px] text-emerald-100 block font-semibold">You Receive (Net)</span>
                  <span className="text-sm font-black text-white">৳{netEarnings.toLocaleString()}</span>
                </div>
              </div>

              {/* Payout Channel Selector */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700">Receiving Wallet:</span>
                <div className="flex items-center gap-2">
                  {(["BKASH", "NAGAD", "ROCKET", "BANK"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayoutMethod(method)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        payoutMethod === method
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
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
                    className="w-32 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Quick Pitch Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === "en" ? "Cover Letter & Proposal Pitch" : "কভার লেটার ও প্রস্তাবনার বিবরণ"}
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Quick Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPitchPreset("speed")}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    ⚡ Fast Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPitchPreset("quality")}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    ⭐ Senior Quality
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you are the best fit for this project..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Portfolio Link & Freelancer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Relevant Portfolio / Demo Link
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://github.com/your-work"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  SMS Notification Phone (+880)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {lang === "en" ? "Cancel" : "বাতিল"}
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 rounded-full shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === "en" ? "Submit Bid Now" : "বিড জমা দিন"}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
