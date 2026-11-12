"use client";

import React, { useState } from "react";
import { Job, JobCategory } from "@/types";
import { CATEGORIES } from "@/data/mockData";
import { X, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (newJob: Job) => void;
  lang: "en" | "bn";
}

export default function PostJobModal({
  isOpen,
  onClose,
  onJobCreated,
  lang,
}: PostJobModalProps) {
  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<JobCategory>("Web & App Development");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState("Next.js, Tailwind CSS, PostgreSQL");
  const [budgetBdt, setBudgetBdt] = useState<number>(35000);
  const [jobType, setJobType] = useState<"Fixed Price" | "Milestone Based">("Milestone Based");
  const [experienceLevel] = useState<"Entry Level" | "Intermediate" | "Expert">("Intermediate");
  const [clientName, setClientName] = useState("Ashraful Islam (TechScale BD)");
  const [clientLocation, setClientLocation] = useState("Gulshan, Dhaka");
  const [deadlineDays, setDeadlineDays] = useState<number>(14);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newJob: Job = {
      id: `job-${Date.now()}`,
      title: title || (lang === "en" ? "Custom Project Requirement" : "কাস্টম প্রজেক্ট রিকোয়ারমেন্ট"),
      clientName: clientName || "Verified Bangladeshi Client",
      clientLocation: clientLocation || "Dhaka, Bangladesh",
      clientRating: 5.0,
      clientVerified: true,
      category,
      description: description || (lang === "en" ? "Looking for skilled Bangladeshi talent to execute this project with guaranteed milestone delivery." : "দক্ষ দেশীয় ফ্রিল্যান্সার দিয়ে কাজটি দ্রুত সম্পন্ন করতে চাই।"),
      budgetBdt: Number(budgetBdt) || 20000,
      jobType,
      experienceLevel,
      skills: skills.length > 0 ? skills : ["Web Development", "UI/UX"],
      proposalsCount: 0,
      postedAt: "Just now",
      deadlineDays: Number(deadlineDays) || 10,
      status: "OPEN",
    };

    onJobCreated(newJob);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setStep(1);
      onClose();
    }, 1600);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111315]/55 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[rgba(17,19,21,0.12)] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-[#111315]"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[rgba(17,19,21,0.08)] flex items-center justify-between bg-[#FAF9F6] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] border border-[#0F6E50]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#0F6E50]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#111315]">
                {lang === "en" ? "Post a Project on MuktoKormo" : "মুক্তকর্মে নতুন কাজ পোস্ট করুন"}
              </h3>
              <p className="text-xs text-[#6B7278]">
                {lang === "en" ? "Hire top Bangladeshi talent with zero upfront risk" : "নিরাপদ বিকাশ ও নগদ এসক্রোর মাধ্যমে কাজ শুরু করুন"}
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

        {/* Success Splash */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-[#EAF5F0] text-[#0F6E50] flex items-center justify-center mx-auto border border-[#0F6E50]/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-[#111315]">
              {lang === "en" ? "Job Posted Successfully!" : "কাজ সফলভাবে পোস্ট হয়েছে!"}
            </h4>
            <p className="text-xs text-[#6B7278] max-w-sm mx-auto">
              {lang === "en"
                ? "Your job is now live on the marketplace. Verified freelancers can now apply."
                : "আপনার কাজটি এখন মার্কেটপ্লেসে লাইভ। ফ্রিল্যান্সাররা আবেদন শুরু করবে।"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#FAF9F6] border-b border-[rgba(17,19,21,0.08)] text-xs shrink-0">
              <div className={`flex items-center gap-1.5 font-bold ${step >= 1 ? "text-[#0B3B2E]" : "text-[#8B9094]"}`}>
                <span className={`w-5 h-5 rounded-full font-mono mk-tabular flex items-center justify-center text-[10px] border ${
                  step >= 1 ? "bg-[#0B3B2E] border-[#0B3B2E] text-white" : "bg-white border-current"
                }`}>1</span>
                <span>{lang === "en" ? "Category & Title" : "ক্যাটাগরি ও নাম"}</span>
              </div>
              <div className="w-6 sm:w-10 h-px bg-[rgba(17,19,21,0.12)]" />
              <div className={`flex items-center gap-1.5 font-bold ${step >= 2 ? "text-[#0B3B2E]" : "text-[#8B9094]"}`}>
                <span className={`w-5 h-5 rounded-full font-mono mk-tabular flex items-center justify-center text-[10px] border ${
                  step >= 2 ? "bg-[#0B3B2E] border-[#0B3B2E] text-white" : "bg-white border-current"
                }`}>2</span>
                <span>{lang === "en" ? "Scope" : "বিবরণ"}</span>
              </div>
              <div className="w-6 sm:w-10 h-px bg-[rgba(17,19,21,0.12)]" />
              <div className={`flex items-center gap-1.5 font-bold ${step >= 3 ? "text-[#0B3B2E]" : "text-[#8B9094]"}`}>
                <span className={`w-5 h-5 rounded-full font-mono mk-tabular flex items-center justify-center text-[10px] border ${
                  step >= 3 ? "bg-[#0B3B2E] border-[#0B3B2E] text-white" : "bg-white border-current"
                }`}>3</span>
                <span>{lang === "en" ? "Budget" : "বাজেট"}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7278] mb-2">
                      {lang === "en" ? "Select Category" : "ক্যাটাগরি নির্বাচন করুন"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          type="button"
                          key={cat.name}
                          onClick={() => setCategory(cat.name)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            category === cat.name
                              ? "bg-[#EAF5F0] border-[#0F6E50] text-[#0B3B2E] shadow-2xs"
                              : "bg-white border-[rgba(17,19,21,0.12)] text-[#3F4448] hover:bg-[#FAF9F6]"
                          }`}
                        >
                          {lang === "en" ? cat.name : cat.nameBn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7278] mb-1.5">
                      {lang === "en" ? "Job Title" : "কাজের শিরোনাম"}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={lang === "en" ? "e.g. Build an E-Commerce Website with bKash API" : "যেমন: বিকাশ এপিআই সহ ই-কমার্স ওয়েবসাইট"}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] placeholder-[#8B9094] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#6B7278] mb-1">
                        {lang === "en" ? "Organization / Brand" : "প্রতিষ্ঠানের নাম"}
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#6B7278] mb-1">
                        {lang === "en" ? "Location (City)" : "লোকেশন (ঢাকা, চট্টগ্রাম)"}
                      </label>
                      <input
                        type="text"
                        value={clientLocation}
                        onChange={(e) => setClientLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7278] mb-1.5">
                      {lang === "en" ? "Description & Requirements" : "কাজের বিবরণ ও চাহিদা"}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={lang === "en" ? "Describe your requirements, scope, reference links..." : "কাজের নিয়ম ও আপনার প্রত্যাশা বিস্তারিত লিখুন..."}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] placeholder-[#8B9094] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7278] mb-1.5">
                      {lang === "en" ? "Required Skills" : "প্রয়োজনীয় দক্ষতাসমূহ"}
                    </label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#EAF5F0] border border-[#0F6E50]/20 rounded-xl p-3.5 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#0F6E50] shrink-0" />
                    <p className="text-xs text-[#0B3B2E] leading-relaxed font-medium">
                      {lang === "en"
                        ? "MuktoKormo BDT Escrow: Funds are held securely in Taka and released only when deliverables are approved."
                        : "নিরাপদ এসক্রো: কাজ বুঝে পাওয়ার আগে কোনো টাকা কর্তন হবে না। আপনার টাকা নিরাপদ।"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7278] mb-1.5">
                      {lang === "en" ? "Project Budget in BDT (৳ Taka)" : "বাজেট (টাকা)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[#6B7278]">৳</span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        value={budgetBdt}
                        onChange={(e) => setBudgetBdt(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-base font-mono mk-tabular font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#6B7278] mb-1">
                        {lang === "en" ? "Payment Structure" : "পদ্ধতি"}
                      </label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as "Fixed Price" | "Milestone Based")}
                        className="w-full px-3 py-2 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      >
                        <option value="Milestone Based">Milestone Based</option>
                        <option value="Fixed Price">Fixed Price</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B7278] mb-1">
                        {lang === "en" ? "Timeline (Days)" : "সময়সীমা (দিন)"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-mono mk-tabular font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 sm:p-5 border-t border-[rgba(17,19,21,0.08)] bg-[#FAF9F6] flex items-center justify-between shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#3F4448] hover:text-[#111315] bg-white border border-[rgba(17,19,21,0.12)] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Back" : "পূর্ববর্তী"}</span>
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  <span>{lang === "en" ? "Next" : "পরবর্তী"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs shadow-sm cursor-pointer transition-all"
                >
                  <span>{lang === "en" ? "Publish Job" : "পোস্ট করুন"}</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
