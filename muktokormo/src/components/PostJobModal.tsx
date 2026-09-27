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
  const [experienceLevel, setExperienceLevel] = useState<"Entry Level" | "Intermediate" | "Expert">("Intermediate");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative text-slate-900">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {lang === "en" ? "Post a Project on MuktoKormo" : "মুক্তকর্মে নতুন কাজ পোস্ট করুন"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === "en" ? "Hire top Bangladeshi talent with zero upfront risk" : "নিরাপদ বিকাশ ও নগদ এসক্রোর মাধ্যমে কাজ শুরু করুন"}
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

        {/* Success Splash */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900">
              {lang === "en" ? "Job Posted Successfully!" : "কাজ সফলভাবে পোস্ট হয়েছে!"}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {lang === "en"
                ? "Your job is now live on the marketplace. Verified freelancers can now apply."
                : "আপনার কাজটি এখন মার্কেটপ্লেসে লাইভ। ফ্রিল্যান্সাররা আবেদন শুরু করবে।"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-xs">
              <div className={`flex items-center gap-1.5 font-bold ${step >= 1 ? "text-sky-600" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px]">1</span>
                <span>{lang === "en" ? "Category & Title" : "ক্যাটাগরি ও নাম"}</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 font-bold ${step >= 2 ? "text-sky-600" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px]">2</span>
                <span>{lang === "en" ? "Scope" : "বিবরণ"}</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 font-bold ${step >= 3 ? "text-sky-600" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px]">3</span>
                <span>{lang === "en" ? "Budget" : "বাজেট"}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {lang === "en" ? "Select Category" : "ক্যাটাগরি নির্বাচন করুন"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          type="button"
                          key={cat.name}
                          onClick={() => setCategory(cat.name)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            category === cat.name
                              ? "bg-sky-50 border-sky-500 text-sky-700 shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {lang === "en" ? cat.name : cat.nameBn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {lang === "en" ? "Job Title" : "কাজের শিরোনাম"}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={lang === "en" ? "e.g. Build an E-Commerce Website with bKash API" : "যেমন: বিকাশ এপিআই সহ ই-কমার্স ওয়েবসাইট"}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {lang === "en" ? "Organization / Brand" : "প্রতিষ্ঠানের নাম"}
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {lang === "en" ? "Location (City)" : "লোকেশন (ঢাকা, চট্টগ্রাম)"}
                      </label>
                      <input
                        type="text"
                        value={clientLocation}
                        onChange={(e) => setClientLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {lang === "en" ? "Description & Requirements" : "কাজের বিবরণ ও চাহিদা"}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={lang === "en" ? "Describe your requirements, scope, reference links..." : "কাজের নিয়ম ও আপনার প্রত্যাশা বিস্তারিত লিখুন..."}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {lang === "en" ? "Required Skills" : "প্রয়োজনীয় দক্ষতাসমূহ"}
                    </label>
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-sky-500 shrink-0" />
                    <p className="text-xs text-sky-800 leading-relaxed font-medium">
                      {lang === "en"
                        ? "MuktoKormo BDT Escrow: Funds are held securely in Taka and released only when deliverables are approved."
                        : "নিরাপদ এসক্রো: কাজ বুঝে পাওয়ার আগে কোনো টাকা কর্তন হবে না। আপনার টাকা নিরাপদ।"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {lang === "en" ? "Project Budget in BDT (৳ Taka)" : "বাজেট (টাকা)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        value={budgetBdt}
                        onChange={(e) => setBudgetBdt(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {lang === "en" ? "Payment Structure" : "পদ্ধতি"}
                      </label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      >
                        <option value="Milestone Based">Milestone Based</option>
                        <option value="Fixed Price">Fixed Price</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {lang === "en" ? "Timeline (Days)" : "সময়সীমা (দিন)"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={deadlineDays}
                        onChange={(e) => setDeadlineDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 transition-colors cursor-pointer"
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
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  <span>{lang === "en" ? "Next" : "পরবর্তী"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer transition-all"
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
