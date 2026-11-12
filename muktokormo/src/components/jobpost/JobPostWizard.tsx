"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Check,
  Search,
  X,
  Sparkles,
  ShieldCheck,
  Paperclip,
  Lightbulb,
  Phone,
  Lock,
} from "lucide-react";
import OnboardingShell, { WizardStep } from "@/components/onboarding/OnboardingShell";
import {
  EXAMPLE_JOB_TITLES,
  POPULAR_SKILLS,
  DURATION_OPTIONS,
  EXPERIENCE_OPTIONS,
} from "@/data/dashboardData";
import { JobCategory } from "@/types";
import { CATEGORIES } from "@/data/mockData";
import { formatBdt } from "@/lib/format";

const STEPS: WizardStep[] = [
  { id: "title", label: "Title", labelBn: "শিরোনাম" },
  { id: "skills", label: "Skills", labelBn: "দক্ষতা" },
  { id: "scope", label: "Scope", labelBn: "স্কোপ" },
  { id: "budget", label: "Budget", labelBn: "বাজেট" },
  { id: "description", label: "Description", labelBn: "বিবরণ" },
];

const DESCRIPTION_HINTS = [
  "Talent are looking for:",
  "Clear expectations about your task or deliverables",
  "The skills required for your work",
  "Good communication",
  "Details about how you or your team like to work",
];

const MAX_DESCRIPTION = 50000;

export default function JobPostWizard({
  initialStep = 0,
  onExit,
}: {
  initialStep?: number;
  onExit?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [lang, setLang] = useState<"en" | "bn">("en");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<JobCategory>(CATEGORIES[0].name);
  const [skills, setSkills] = useState<string[]>(["Web Development"]);
  const [skillQuery, setSkillQuery] = useState("");
  const [duration, setDuration] = useState("");
  const [experience, setExperience] = useState("Intermediate");
  const [contractToHire, setContractToHire] = useState(false);
  const [pricing, setPricing] = useState<"fixed" | "hourly">("fixed");
  const [minBudget, setMinBudget] = useState(15000);
  const [maxBudget, setMaxBudget] = useState(45000);
  const [hourlyMin, setHourlyMin] = useState(500);
  const [hourlyMax, setHourlyMax] = useState(1500);
  const [milestones, setMilestones] = useState(3);
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const visibleSkills = skillQuery
    ? POPULAR_SKILLS.filter((s) => s.toLowerCase().includes(skillQuery.toLowerCase()))
    : POPULAR_SKILLS;

  const toggleSkill = (skill: string) =>
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill].slice(0, 10)
    );

  const canContinue =
    step === 0
      ? title.trim().length >= 8
      : step === 1
        ? skills.length > 0
        : step === 2
          ? duration !== ""
          : step === 3
            ? maxBudget > 0 && hourlyMax > 0
            : description.trim().length >= 20;

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Final step — publish to Supabase
    setIsPublishing(true);
    setPublishError(null);

    try {
      const supabase = createClient();

      // 1. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("[JobPost] auth.getUser →", { user: user?.id, userError });
      if (userError || !user) throw new Error("You must be logged in to post a job.");

      // 2. Resolve the client record for this user
      const { data: clientRow, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      console.log("[JobPost] clients lookup →", { clientRow, clientError });

      if (clientError) throw new Error(clientError.message);
      if (!clientRow) throw new Error("No client profile found. Please complete your onboarding first.");

      // 3. Insert the project
      const payload = {
        client_id: clientRow.id,
        title: title.trim(),
        description: description.trim(),
        budget_min: pricing === "fixed" ? minBudget : hourlyMin,
        budget_max: pricing === "fixed" ? maxBudget : hourlyMax,
        skills_required: skills,
        status: "open",
      };
      console.log("[JobPost] inserting project →", payload);

      const { data: inserted, error: insertError } = await supabase
        .from("projects")
        .insert(payload)
        .select();
      console.log("[JobPost] insert result →", { inserted, insertError });

      if (insertError) throw new Error(insertError.message);

      setIsSuccess(true);
      setTimeout(() => router.push("/dashboard/client"), 1800);
    } catch (err: unknown) {
      console.error("[JobPost] publish failed:", err);
      setPublishError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#EAF5F0] text-[#0F6E50] flex items-center justify-center mx-auto border border-[#0F6E50]/25">
            <Check className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-[#111315]">Job Posted Successfully</h2>
          <p className="text-xs text-[#6B7278] leading-relaxed">
            Your job is now live on the marketplace. Verified freelancers can now apply.
          </p>
          <p className="text-[11px] text-[#0F6E50] font-bold pt-1">
            Redirecting to your client dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingShell
      eyebrow={lang === "bn" ? `জব পোস্ট ${step + 1}/${STEPS.length}` : `Job post ${step + 1}/${STEPS.length}`}
      title={lang === "bn" ? STEPS[step].labelBn : STEPS[step].label}
      subtitle={
        step === 0
          ? "This helps your job post stand out to the right candidates."
          : step === 1
            ? "For the best results, add 3-5 skills"
            : step === 2
              ? "Consider the size of your project and the time it will take."
              : step === 3
                ? "Freelancers respond more often to job posts with budgets."
                : "Describe what you need in detail so talent can send accurate proposals."
      }
      steps={STEPS}
      currentIndex={step}
      onBack={onExit ? () => (step === 0 ? onExit() : setStep(step - 1)) : () => setStep(step - 1)}
      backLabel={step === 0 ? "Exit" : "Back"}
      headerRight={
        <span className="hidden sm:flex items-center gap-1.5 text-[#A87224] font-semibold">
          <Phone className="w-3.5 h-3.5" />
          Phone verification required to publish
        </span>
      }
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => (step === 0 && onExit ? onExit() : setStep(step - 1))}
            className="text-xs font-bold text-[#6B7278] hover:text-[#111315] transition-colors cursor-pointer"
          >
            Back
          </button>

          {publishError && (
            <p className="flex-1 text-center text-[11px] font-semibold text-[#DC2626] px-2">
              {publishError}
            </p>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue || isPublishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {step < STEPS.length - 1
              ? `Next: ${STEPS[step + 1].label}`
              : isPublishing
                ? "Publishing..."
                : "Create job post"}
            {step < STEPS.length - 1 ? (
              <ArrowRight className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Phone verification notice */}
        <div className="flex items-start gap-2.5 bg-[#FEF6E6] border border-[#A87224]/25 rounded-xl p-3">
          <ShieldCheck className="w-4 h-4 text-[#A87224] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#A87224] leading-relaxed font-medium">
            {lang === "bn"
              ? "আপনার জব পোস্টটি প্রকাশ করতে ফোন নম্বর যাচাই করতে হবে।"
              : "Just a reminder to publish your job post, you'll need to verify your phone number."}
          </p>
        </div>

        {/* STEP 1: TITLE */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111315]">
                {lang === "bn" ? "একটি আকর্ষণীয় শিরোনাম দিয়ে শুরু করুন।" : "Let's start with a strong title."}
              </label>
              <p className="text-[11px] text-[#6B7278] leading-relaxed">
                {lang === "bn" ? "এটি প্রার্থীরা সবার আগে দেখতে পাবে, তাই সঠিকভাবে লিখুন!" : "It's the first thing candidates will see, so make it count!"}
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === "bn" ? "আপনার কাজের জন্য একটি শিরোনাম লিখুন" : "Write a title for your job post"}
                className="w-full px-3.5 py-3 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-sm font-semibold text-[#111315] placeholder-[#8B9094] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium ${title.length > 0 && title.length < 8 ? "text-[#A87224]" : "text-[#8B9094]"}`}
                >
                  {title.length < 8 ? "At least 8 characters" : "Good title"}
                </span>
                <span className="text-[10px] font-mono mk-tabular text-[#8B9094]">{title.length}/120</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7278]">
                Category
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      category === c.name
                        ? "bg-[#0B3B2E] border-[#0B3B2E] text-white"
                        : "bg-white border-[rgba(17,19,21,0.12)] text-[#3F4448] hover:border-[#0F6E50]/40 hover:bg-[#FAF9F6]"
                    }`}
                  >
                    {lang === "bn" ? c.nameBn : c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#A87224]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7278]">
                  Example titles
                </span>
              </div>
              {EXAMPLE_JOB_TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#EAF5F0] border border-[rgba(17,19,21,0.08)] hover:border-[#0F6E50]/30 text-[11px] text-[#3F4448] hover:text-[#0B3B2E] transition-all cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SKILLS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8B9094] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
                placeholder={lang === "bn" ? "দক্ষতা খুঁজুন বা নিজে যোগ করুন" : "Search skills or add your own"}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-semibold text-[#111315] placeholder-[#8B9094] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
              />
            </div>

            {skills.length > 0 && (
              <div className="rounded-2xl border border-[#0F6E50]/20 bg-[#EAF5F0] p-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0B3B2E] mb-2.5 font-mono mk-tabular">
                  Selected skills ({skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#0F6E50]/25 text-[11px] font-bold text-[#0B3B2E]"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className="text-[#0F6E50] hover:text-[#0B3B2E] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7278]">
                Popular skills for {category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {visibleSkills.map((s) => {
                  const isSelected = skills.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0B3B2E] border-[#0B3B2E] text-white"
                          : "bg-white border-[rgba(17,19,21,0.12)] text-[#3F4448] hover:border-[#0F6E50]/40 hover:bg-[#FAF9F6]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SCOPE */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#111315]">
                How long will your work take?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuration(opt.value)}
                    className={`px-3 py-3 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                      duration === opt.value
                        ? "border-[#0F6E50] bg-[#EAF5F0] text-[#0B3B2E]"
                        : "border-[rgba(17,19,21,0.10)] bg-white text-[#3F4448] hover:border-[rgba(17,19,21,0.20)]"
                    }`}
                  >
                    {lang === "bn" ? opt.labelBn : opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#111315]">
                What level of experience will it need?
              </label>
              <p className="text-[11px] text-[#6B7278] leading-relaxed">
                {lang === "bn" ? "এটি কোনো প্রস্তাবকে সীমাবদ্ধ করবে না, তবে আপনার বাজেটের সাথে দক্ষতা মেলাতে সাহায্য করে।" : "This won't restrict any proposals, but helps match expertise to your budget."}
              </p>
              <div className="space-y-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperience(opt.value)}
                    className={`w-full flex items-start gap-2.5 px-3.5 py-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      experience === opt.value
                        ? "border-[#0F6E50] bg-[#EAF5F0]"
                        : "border-[rgba(17,19,21,0.10)] bg-white hover:border-[rgba(17,19,21,0.20)]"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        experience === opt.value
                          ? "border-[#0F6E50] bg-[#0F6E50]"
                          : "border-[#8B9094]"
                      }`}
                    >
                      {experience === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-xs font-bold ${
                          experience === opt.value ? "text-[#0B3B2E]" : "text-[#111315]"
                        }`}
                      >
                        {lang === "bn" ? opt.labelBn : opt.label}
                      </span>
                      <span className="block text-[11px] text-[#6B7278] mt-0.5">
                        {lang === "bn" ? opt.hintBn : opt.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)]">
              <input
                type="checkbox"
                checked={contractToHire}
                onChange={(e) => setContractToHire(e.target.checked)}
                className="mt-0.5 rounded border-[rgba(17,19,21,0.25)] accent-[#0F6E50]"
              />
              <span className="text-xs font-bold text-[#111315]">
                {lang === "bn" ? "এটি কি চুক্তিতে নিয়োগের সুযোগ?" : "Is this job a contract-to-hire opportunity?"}
                <span className="block text-[11px] font-normal text-[#6B7278] mt-0.5">
                  This helps set expectations with talent and won&apos;t restrict who can submit
                  proposals.
                </span>
              </span>
            </label>
          </div>
        )}

        {/* STEP 4: BUDGET */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "fixed", label: "Fixed price", labelBn: "নির্দিষ্ট মূল্য", hint: "One clear deliverable" },
                { id: "hourly", label: "Hourly rate", labelBn: "ঘণ্টাপ্রতি", hint: "Ongoing collaboration" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPricing(p.id as "fixed" | "hourly")}
                  className={`px-3.5 py-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    pricing === p.id
                      ? "border-[#0F6E50] bg-[#EAF5F0]"
                      : "border-[rgba(17,19,21,0.10)] bg-white hover:border-[rgba(17,19,21,0.20)]"
                  }`}
                >
                  <span
                    className={`block text-xs font-bold ${
                      pricing === p.id ? "text-[#0B3B2E]" : "text-[#111315]"
                    }`}
                  >
                    {lang === "bn" ? p.labelBn : p.label}
                  </span>
                  <span className="block text-[11px] text-[#6B7278] mt-0.5">{lang === "bn" ? (p.id === "fixed" ? "নির্দিষ্ট লক্ষ্য অর্জনের জন্য" : "ধারাবাহিক সহযোগিতার জন্য") : p.hint}</span>
                </button>
              ))}
            </div>

            {pricing === "fixed" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#111315]">{lang === "bn" ? "শুরু" : "From"}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#6B7278]">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={minBudget}
                        onChange={(e) => setMinBudget(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-sm font-mono mk-tabular font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#111315]">{lang === "bn" ? "সর্বোচ্চ" : "To"}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#6B7278]">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-sm font-mono mk-tabular font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#6B7278] leading-relaxed font-mono mk-tabular">
                  Professionals on MuktoKormo typically charge ৳{hourlyMin.toLocaleString()} - ৳
                  {hourlyMax.toLocaleString()}/hour for {category} projects like yours.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#111315]">
                    Milestone escrow split
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={6}
                      value={milestones}
                      onChange={(e) => setMilestones(Number(e.target.value))}
                      className="flex-1 accent-[#0F6E50]"
                    />
                    <span className="text-xs font-mono mk-tabular font-bold text-[#111315] w-24 text-right">
                      {lang === "bn" ? `${milestones}টি মাইলস্টোন` : `${milestones} milestones`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7278]">
                    {lang === "bn" ? "তহবিল মাইলস্টোন অনুযায়ী মুক্ত করা হয়, অনুমোদনের আগ পর্যন্ত বিডিটি এসক্রোতে সংরক্ষিত থাকে।" : "Funds are released per milestone, held in BDT escrow until you approve."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#111315]">From /hr</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#6B7278]">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={100}
                        min={0}
                        value={hourlyMin}
                        onChange={(e) => setHourlyMin(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-sm font-mono mk-tabular font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#111315]">To /hr</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#6B7278]">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={100}
                        min={0}
                        value={hourlyMax}
                        onChange={(e) => setHourlyMax(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-sm font-mono mk-tabular font-bold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(17,19,21,0.10)] bg-[#FAF9F6] divide-y divide-[rgba(17,19,21,0.08)] overflow-hidden">
                  {[
                    { label: "Estimated monthly cost (160 hrs)", value: hourlyMax * 160 },
                    { label: "MuktoKormo service fee (7%)", value: Math.round(hourlyMax * 160 * 0.07) },
                  ].map((row) => (
                    <div key={row.label} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#3F4448]">{row.label}</span>
                      <span className="text-xs font-mono mk-tabular font-bold text-[#111315]">
                        {formatBdt(row.value)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#6B7278] leading-relaxed">
                  Hourly budgets are best for broader projects and ongoing collaboration, with
                  flexibility to change scope and weekly hour limits.
                </p>
              </div>
            )}

            <div className="flex items-start gap-2.5 bg-[#EAF5F0] border border-[#0F6E50]/20 rounded-xl p-3">
              <Lock className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#0B3B2E] leading-relaxed font-medium">
                MuktoKormo BDT Escrow: funds are held securely in Taka and released only when you
                approve each milestone.
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: DESCRIPTION */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <span className="block text-xs font-bold text-[#111315]">
                Start the conversation.
              </span>
              <ul className="space-y-1">
                {DESCRIPTION_HINTS.map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-[11px] text-[#6B7278]">
                    <Check className="w-3 h-3 text-[#0F6E50] shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#111315]">
                Already have a description? Paste it here!
              </label>
              <textarea
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                placeholder="Describe what you need"
                className="w-full px-3.5 py-3 bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl text-xs text-[#111315] placeholder-[#8B9094] focus:outline-none focus:ring-2 focus:ring-[#0F6E50] focus:bg-white"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium ${
                    description.length > 0 && description.length < 20
                      ? "text-[#A87224]"
                      : "text-[#8B9094]"
                  }`}
                >
                  {description.length < 20
                    ? "At least 20 characters"
                    : `${(MAX_DESCRIPTION - description.length).toLocaleString()} characters left`}
                </span>
                <span className="text-[10px] font-mono mk-tabular text-[#8B9094]">
                  {description.length.toLocaleString()}/{MAX_DESCRIPTION.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <input
                type="file"
                id="job-attachment"
                className="hidden"
                onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? null)}
              />
              <label
                htmlFor="job-attachment"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[rgba(17,19,21,0.12)] bg-[#FAF9F6] hover:bg-[#EAF5F0] hover:border-[#0F6E50]/30 text-xs font-bold text-[#3F4448] hover:text-[#0B3B2E] transition-all cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#6B7278]" />
                {attachment || "Attach file"}
              </label>
            </div>
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}
