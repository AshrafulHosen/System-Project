"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setIsPublishing(true);
      setTimeout(() => {
        setIsPublishing(false);
        setIsSuccess(true);
        setTimeout(() => router.push("/dashboard/client"), 1800);
      }, 1100);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl shadow-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Check className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Job Posted Successfully!</h2>
          <p className="text-xs text-slate-500">
            Your job is now live on the marketplace. Verified freelancers can now apply.
          </p>
          <p className="text-[11px] text-emerald-600 font-bold pt-1">
            Redirecting to your client dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingShell
      eyebrow={`Job post ${step + 1}/${STEPS.length}`}
      title={STEPS[step].label}
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
        <span className="hidden sm:flex items-center gap-1.5 text-amber-600 font-semibold">
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
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue || isPublishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
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
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            Just a reminder to publish your job post, you&apos;ll need to verify your phone number.
          </p>
        </div>

        {/* STEP 1: TITLE */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-900">
                Let&apos;s start with a strong title.
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                It&apos;s the first thing candidates will see, so make it count!
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write a title for your job post"
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] ${title.length > 0 && title.length < 8 ? "text-amber-600" : "text-slate-400"}`}
                >
                  {title.length < 8 ? "At least 8 characters" : "Good title"}
                </span>
                <span className="text-[10px] text-slate-400">{title.length}/120</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {c.nameBn}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Example titles
                </span>
              </div>
              {EXAMPLE_JOB_TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 text-[11px] text-slate-600 transition-all cursor-pointer"
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
                placeholder="Search skills or add your own"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {skills.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-2.5">
                  Selected skills ({skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
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
              <label className="block text-xs font-black text-slate-900">
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
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {opt.labelBn}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-black text-slate-900">
                What level of experience will it need?
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                This won&apos;t restrict any proposals, but helps match expertise to your budget.
              </p>
              <div className="space-y-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperience(opt.value)}
                    className={`w-full flex items-start gap-2.5 px-3.5 py-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      experience === opt.value
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        experience === opt.value
                          ? "border-emerald-600 bg-emerald-600"
                          : "border-slate-300"
                      }`}
                    >
                      {experience === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-xs font-bold ${
                          experience === opt.value ? "text-emerald-900" : "text-slate-900"
                        }`}
                      >
                        {opt.labelBn}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {opt.hintBn}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={contractToHire}
                onChange={(e) => setContractToHire(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-900">
                Is this job a contract-to-hire opportunity?
                <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
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
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`block text-xs font-black ${
                      pricing === p.id ? "text-emerald-900" : "text-slate-900"
                    }`}
                  >
                    {p.labelBn}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">{p.hint}</span>
                </button>
              ))}
            </div>

            {pricing === "fixed" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">From</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={minBudget}
                        onChange={(e) => setMinBudget(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">To</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Professionals on MuktoKormo typically charge ৳{hourlyMin.toLocaleString()} - ৳
                  {hourlyMax.toLocaleString()}/hour for {category} projects like yours.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">
                    Milestone escrow split
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={6}
                      value={milestones}
                      onChange={(e) => setMilestones(Number(e.target.value))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="text-xs font-black text-slate-900 w-20 text-right">
                      {milestones} milestones
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Funds are released per milestone, held in BDT escrow until you approve.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">From /hr</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={100}
                        min={0}
                        value={hourlyMin}
                        onChange={(e) => setHourlyMin(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">To /hr</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        step={100}
                        min={0}
                        value={hourlyMax}
                        onChange={(e) => setHourlyMax(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {[
                    { label: "Estimated monthly cost (160 hrs)", value: hourlyMax * 160 },
                    { label: "MuktoKormo service fee (7%)", value: Math.round(hourlyMax * 160 * 0.07) },
                  ].map((row) => (
                    <div key={row.label} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">{row.label}</span>
                      <span className="text-xs font-black text-slate-900">
                        {formatBdt(row.value)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hourly budgets are best for broader projects and ongoing collaboration, with
                  flexibility to change scope and weekly hour limits.
                </p>
              </div>
            )}

            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
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
              <span className="block text-xs font-black text-slate-900">
                Start the conversation.
              </span>
              <ul className="space-y-1">
                {DESCRIPTION_HINTS.map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Already have a description? Paste it here!
              </label>
              <textarea
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                placeholder="Describe what you need"
                className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] ${
                    description.length > 0 && description.length < 20
                      ? "text-amber-600"
                      : "text-slate-400"
                  }`}
                >
                  {description.length < 20
                    ? "At least 20 characters"
                    : `${(MAX_DESCRIPTION - description.length).toLocaleString()} characters left`}
                </span>
                <span className="text-[10px] text-slate-400">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                {attachment || "Attach file"}
              </label>
            </div>
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}
