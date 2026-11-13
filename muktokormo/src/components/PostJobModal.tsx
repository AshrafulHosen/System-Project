"use client";

import React, { useState } from "react";
import { Job, JobCategory } from "@/types";
import { CATEGORIES } from "@/data/mockData";
import { X, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import useEscapeKey from "@/lib/hooks/useEscapeKey";

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
  useEscapeKey(isOpen, onClose);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-ink/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="bg-white border border-line rounded-2xl w-full max-w-xl max-h-[90dvh] flex flex-col overflow-hidden shadow-[var(--mk-shadow-popover)] relative text-ink"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between bg-canvas shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-soft border border-brand/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-ink">
                {lang === "en" ? "Post a Project on MuktoKormo" : "মুক্তকর্মে নতুন কাজ পোস্ট করুন"}
              </h3>
              <p className="text-xs text-ink-3">
                {lang === "en" ? "Hire top Bangladeshi talent with zero upfront risk" : "নিরাপদ বিকাশ ও নগদ এসক্রোর মাধ্যমে কাজ শুরু করুন"}
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

        {/* Success Splash */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto border border-brand/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-semibold text-ink">
              {lang === "en" ? "Job Posted Successfully!" : "কাজ সফলভাবে পোস্ট হয়েছে!"}
            </h4>
            <p className="text-xs text-ink-3 max-w-sm mx-auto">
              {lang === "en"
                ? "Your job is now live on the marketplace. Verified freelancers can now apply."
                : "আপনার কাজটি এখন মার্কেটপ্লেসে লাইভ। ফ্রিল্যান্সাররা আবেদন শুরু করবে।"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between px-6 py-3 bg-canvas border-b border-line text-xs shrink-0">
              <div className={`flex items-center gap-1.5 font-semibold ${step >= 1 ? "text-navy" : "text-ink-4"}`}>
                <span className={`w-5 h-5 rounded-full font-mono mk-tabular flex items-center justify-center text-[10px] border ${
                  step >= 1 ? "bg-navy border-navy text-white" : "bg-white border-current"
                }`}>1</span>
                <span>{lang === "en" ? "Category & Title" : "ক্যাটাগরি ও নাম"}</span>
              </div>
              <div className="w-6 sm:w-10 h-px bg-[rgba(16,24,40,0.12)]" />
              <div className={`flex items-center gap-1.5 font-semibold ${step >= 2 ? "text-navy" : "text-ink-4"}`}>
                <span className={`w-5 h-5 rounded-full font-mono mk-tabular flex items-center justify-center text-[10px] border ${
                  step >= 2 ? "bg-navy border-navy text-white" : "bg-white border-current"
                }`}>2</span>
                <span>{lang === "en" ? "Scope" : "বিবরণ"}</span>
              </div>
              <div className="w-6 sm:w-10 h-px bg-[rgba(16,24,40,0.12)]" />
              <div className={`flex items-center gap-1.5 font-semibold ${step >= 3 ? "text-navy" : "text-ink-4"}`}>
                <span className={`w-5 h-5 rounded-full font-mono mk-tabular flex items-center justify-center text-[10px] border ${
                  step >= 3 ? "bg-navy border-navy text-white" : "bg-white border-current"
                }`}>3</span>
                <span>{lang === "en" ? "Budget" : "বাজেট"}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block mk-eyebrow text-ink-3 mb-2">
                      {lang === "en" ? "Select Category" : "ক্যাটাগরি নির্বাচন করুন"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          type="button"
                          key={cat.name}
                          onClick={() => setCategory(cat.name)}
                          className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                            category === cat.name
                              ? "bg-brand-soft border-brand text-navy shadow-2xs"
                              : "bg-white border-line-strong text-ink-2 hover:bg-canvas"
                          }`}
                        >
                          {lang === "en" ? cat.name : cat.nameBn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block mk-eyebrow text-ink-3 mb-1.5">
                      {lang === "en" ? "Job Title" : "কাজের শিরোনাম"}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={lang === "en" ? "e.g. Build an E-Commerce Website with bKash API" : "যেমন: বিকাশ এপিআই সহ ই-কমার্স ওয়েবসাইট"}
                      className="w-full px-3.5 py-2.5 bg-canvas border border-line-strong rounded-lg text-xs text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-3 mb-1">
                        {lang === "en" ? "Organization / Brand" : "প্রতিষ্ঠানের নাম"}
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas border border-line-strong rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-3 mb-1">
                        {lang === "en" ? "Location (City)" : "লোকেশন (ঢাকা, চট্টগ্রাম)"}
                      </label>
                      <input
                        type="text"
                        value={clientLocation}
                        onChange={(e) => setClientLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas border border-line-strong rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block mk-eyebrow text-ink-3 mb-1.5">
                      {lang === "en" ? "Description & Requirements" : "কাজের বিবরণ ও চাহিদা"}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={lang === "en" ? "Describe your requirements, scope, reference links..." : "কাজের নিয়ম ও আপনার প্রত্যাশা বিস্তারিত লিখুন..."}
                      className="w-full px-3.5 py-2.5 bg-canvas border border-line-strong rounded-lg text-xs text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mk-eyebrow text-ink-3 mb-1.5">
                      {lang === "en" ? "Required Skills" : "প্রয়োজনীয় দক্ষতাসমূহ"}
                    </label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-canvas border border-line-strong rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-brand-soft border border-brand/20 rounded-lg p-3.5 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-brand shrink-0" />
                    <p className="text-xs text-navy leading-relaxed font-medium">
                      {lang === "en"
                        ? "MuktoKormo BDT Escrow: Funds are held securely in Taka and released only when deliverables are approved."
                        : "নিরাপদ এসক্রো: কাজ বুঝে পাওয়ার আগে কোনো টাকা কর্তন হবে না। আপনার টাকা নিরাপদ।"}
                    </p>
                  </div>

                  <div>
                    <label className="block mk-eyebrow text-ink-3 mb-1.5">
                      {lang === "en" ? "Project Budget in BDT (৳ Taka)" : "বাজেট (টাকা)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-ink-3">৳</span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        value={budgetBdt}
                        onChange={(e) => setBudgetBdt(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 bg-canvas border border-line-strong rounded-lg text-base font-mono mk-tabular font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-3 mb-1">
                        {lang === "en" ? "Payment Structure" : "পদ্ধতি"}
                      </label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as "Fixed Price" | "Milestone Based")}
                        className="w-full px-3 py-2 bg-canvas border border-line-strong rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      >
                        <option value="Milestone Based">Milestone Based</option>
                        <option value="Fixed Price">Fixed Price</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-3 mb-1">
                        {lang === "en" ? "Timeline (Days)" : "সময়সীমা (দিন)"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-canvas border border-line-strong rounded-lg text-xs font-mono mk-tabular font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 sm:p-5 border-t border-line bg-canvas flex items-center justify-between shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-ink-2 hover:text-ink bg-white border border-line-strong transition-colors cursor-pointer"
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-navy hover:bg-brand text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  <span>{lang === "en" ? "Next" : "পরবর্তী"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy hover:bg-brand text-white font-semibold text-xs shadow-sm cursor-pointer transition-all"
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
