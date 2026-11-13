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
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-line rounded-xl shadow-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto border border-brand/25">
            <Check className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-semibold text-ink">Job Posted Successfully</h2>
          <p className="text-xs text-ink-3 leading-relaxed">
            Your job is now live on the marketplace. Verified freelancers can now apply.
          </p>
          <p className="text-[11px] text-brand font-semibold pt-1">
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
        <span className="hidden sm:flex items-center gap-1.5 text-accent font-semibold">
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
            className="text-xs font-semibold text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            Back
          </button>

          {publishError && (
            <p className="flex-1 text-center text-[11px] font-semibold text-danger px-2">
              {publishError}
            </p>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue || isPublishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-navy hover:bg-brand disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
        <div className="flex items-start gap-2.5 bg-accent-soft border border-accent/25 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-accent leading-relaxed font-medium">
            {lang === "bn"
              ? "আপনার জব পোস্টটি প্রকাশ করতে ফোন নম্বর যাচাই করতে হবে।"
              : "Just a reminder to publish your job post, you'll need to verify your phone number."}
          </p>
        </div>

        {/* STEP 1: TITLE */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                {lang === "bn" ? "একটি আকর্ষণীয় শিরোনাম দিয়ে শুরু করুন।" : "Let's start with a strong title."}
              </label>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                {lang === "bn" ? "এটি প্রার্থীরা সবার আগে দেখতে পাবে, তাই সঠিকভাবে লিখুন!" : "It's the first thing candidates will see, so make it count!"}
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === "bn" ? "আপনার কাজের জন্য একটি শিরোনাম লিখুন" : "Write a title for your job post"}
                className="w-full px-3.5 py-3 bg-canvas border border-line-strong rounded-lg text-sm font-semibold text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium ${title.length > 0 && title.length < 8 ? "text-accent" : "text-ink-4"}`}
                >
                  {title.length < 8 ? "At least 8 characters" : "Good title"}
                </span>
                <span className="text-[10px] font-mono mk-tabular text-ink-4">{title.length}/120</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block mk-eyebrow text-ink-3">
                Category
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      category === c.name
                        ? "bg-navy border-navy text-white"
                        : "bg-white border-line-strong text-ink-2 hover:border-brand/40 hover:bg-canvas"
                    }`}
                  >
                    {lang === "bn" ? c.nameBn : c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-accent" />
                <span className="mk-eyebrow text-ink-3">
                  Example titles
                </span>
              </div>
              {EXAMPLE_JOB_TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg bg-canvas hover:bg-brand-soft border border-line hover:border-brand/30 text-[11px] text-ink-2 hover:text-navy transition-all cursor-pointer"
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
              <Search className="w-4 h-4 text-ink-4 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
                placeholder={lang === "bn" ? "দক্ষতা খুঁজুন বা নিজে যোগ করুন" : "Search skills or add your own"}
                className="w-full pl-10 pr-3.5 py-2.5 bg-canvas border border-line-strong rounded-lg text-xs font-semibold text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
              />
            </div>

            {skills.length > 0 && (
              <div className="rounded-xl border border-brand/20 bg-brand-soft p-3.5">
                <span className="block mk-eyebrow text-navy mb-2.5 font-mono mk-tabular">
                  Selected skills ({skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-brand/25 text-[11px] font-semibold text-navy"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className="text-brand hover:text-navy cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="block mk-eyebrow text-ink-3">
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
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-navy border-navy text-white"
                          : "bg-white border-line-strong text-ink-2 hover:border-brand/40 hover:bg-canvas"
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
              <label className="block text-xs font-semibold text-ink">
                How long will your work take?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuration(opt.value)}
                    className={`px-3 py-3 rounded-lg border-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                      duration === opt.value
                        ? "border-brand bg-brand-soft text-navy"
                        : "border-line bg-white text-ink-2 hover:border-line-strong"
                    }`}
                  >
                    {lang === "bn" ? opt.labelBn : opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-ink">
                What level of experience will it need?
              </label>
              <p className="text-[11px] text-ink-3 leading-relaxed">
                {lang === "bn" ? "এটি কোনো প্রস্তাবকে সীমাবদ্ধ করবে না, তবে আপনার বাজেটের সাথে দক্ষতা মেলাতে সাহায্য করে।" : "This won't restrict any proposals, but helps match expertise to your budget."}
              </p>
              <div className="space-y-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperience(opt.value)}
                    className={`w-full flex items-start gap-2.5 px-3.5 py-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      experience === opt.value
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-white hover:border-line-strong"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        experience === opt.value
                          ? "border-brand bg-brand"
                          : "border-ink-4"
                      }`}
                    >
                      {experience === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-xs font-semibold ${
                          experience === opt.value ? "text-navy" : "text-ink"
                        }`}
                      >
                        {lang === "bn" ? opt.labelBn : opt.label}
                      </span>
                      <span className="block text-[11px] text-ink-3 mt-0.5">
                        {lang === "bn" ? opt.hintBn : opt.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg bg-canvas border border-line">
              <input
                type="checkbox"
                checked={contractToHire}
                onChange={(e) => setContractToHire(e.target.checked)}
                className="mt-0.5 rounded border-line-strong accent-brand"
              />
              <span className="text-xs font-semibold text-ink">
                {lang === "bn" ? "এটি কি চুক্তিতে নিয়োগের সুযোগ?" : "Is this job a contract-to-hire opportunity?"}
                <span className="block text-[11px] font-normal text-ink-3 mt-0.5">
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
                  className={`px-3.5 py-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    pricing === p.id
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-white hover:border-line-strong"
                  }`}
                >
                  <span
                    className={`block text-xs font-semibold ${
                      pricing === p.id ? "text-navy" : "text-ink"
                    }`}
                  >
                    {lang === "bn" ? p.labelBn : p.label}
                  </span>
                  <span className="block text-[11px] text-ink-3 mt-0.5">{lang === "bn" ? (p.id === "fixed" ? "নির্দিষ্ট লক্ষ্য অর্জনের জন্য" : "ধারাবাহিক সহযোগিতার জন্য") : p.hint}</span>
                </button>
              ))}
            </div>

            {pricing === "fixed" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">{lang === "bn" ? "শুরু" : "From"}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-ink-3">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={minBudget}
                        onChange={(e) => setMinBudget(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-canvas border border-line-strong rounded-lg text-sm font-mono mk-tabular font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">{lang === "bn" ? "সর্বোচ্চ" : "To"}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-ink-3">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-canvas border border-line-strong rounded-lg text-sm font-mono mk-tabular font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-ink-3 leading-relaxed font-mono mk-tabular">
                  Professionals on MuktoKormo typically charge ৳{hourlyMin.toLocaleString()} - ৳
                  {hourlyMax.toLocaleString()}/hour for {category} projects like yours.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    Milestone escrow split
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={6}
                      value={milestones}
                      onChange={(e) => setMilestones(Number(e.target.value))}
                      className="flex-1 accent-brand"
                    />
                    <span className="text-xs font-mono mk-tabular font-semibold text-ink w-24 text-right">
                      {lang === "bn" ? `${milestones}টি মাইলস্টোন` : `${milestones} milestones`}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-3">
                    {lang === "bn" ? "তহবিল মাইলস্টোন অনুযায়ী মুক্ত করা হয়, অনুমোদনের আগ পর্যন্ত বিডিটি এসক্রোতে সংরক্ষিত থাকে।" : "Funds are released per milestone, held in BDT escrow until you approve."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">From /hr</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-ink-3">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={100}
                        min={0}
                        value={hourlyMin}
                        onChange={(e) => setHourlyMin(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-canvas border border-line-strong rounded-lg text-sm font-mono mk-tabular font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">To /hr</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-ink-3">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={100}
                        min={0}
                        value={hourlyMax}
                        onChange={(e) => setHourlyMax(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-canvas border border-line-strong rounded-lg text-sm font-mono mk-tabular font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-canvas divide-y divide-line overflow-hidden">
                  {[
                    { label: "Estimated monthly cost (160 hrs)", value: hourlyMax * 160 },
                    { label: "MuktoKormo service fee (7%)", value: Math.round(hourlyMax * 160 * 0.07) },
                  ].map((row) => (
                    <div key={row.label} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-2">{row.label}</span>
                      <span className="text-xs font-mono mk-tabular font-semibold text-ink">
                        {formatBdt(row.value)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-ink-3 leading-relaxed">
                  Hourly budgets are best for broader projects and ongoing collaboration, with
                  flexibility to change scope and weekly hour limits.
                </p>
              </div>
            )}

            <div className="flex items-start gap-2.5 bg-brand-soft border border-brand/20 rounded-lg p-3">
              <Lock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <p className="text-[11px] text-navy leading-relaxed font-medium">
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
              <span className="block text-xs font-semibold text-ink">
                Start the conversation.
              </span>
              <ul className="space-y-1">
                {DESCRIPTION_HINTS.map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-[11px] text-ink-3">
                    <Check className="w-3 h-3 text-brand shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                Already have a description? Paste it here!
              </label>
              <textarea
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                placeholder="Describe what you need"
                className="w-full px-3.5 py-3 bg-canvas border border-line-strong rounded-lg text-xs text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-medium ${
                    description.length > 0 && description.length < 20
                      ? "text-accent"
                      : "text-ink-4"
                  }`}
                >
                  {description.length < 20
                    ? "At least 20 characters"
                    : `${(MAX_DESCRIPTION - description.length).toLocaleString()} characters left`}
                </span>
                <span className="text-[10px] font-mono mk-tabular text-ink-4">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line-strong bg-canvas hover:bg-brand-soft hover:border-brand/30 text-xs font-semibold text-ink-2 hover:text-navy transition-all cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-ink-3" />
                {attachment || "Attach file"}
              </label>
            </div>
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}
