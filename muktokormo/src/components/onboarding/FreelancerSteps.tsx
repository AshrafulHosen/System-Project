"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  PenLine,
  ArrowRight,
  Check,
  Search,
  X,
  Lock,
  Mail,
  MapPin,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { PROFILE_CATEGORIES, POPULAR_SKILLS, PROFICIENCY_OPTIONS } from "@/data/dashboardData";
import { EmploymentEntry, EducationEntry, LanguageEntry } from "@/types";

/* ------------------------------------------------------------------ */
/* Account details (mirrors Upwork "Sign up to find work you love")     */
/* ------------------------------------------------------------------ */

export interface FreelancerAccount {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  marketingOptIn: boolean;
  agreedTerms: boolean;
}

export function FreelancerAccountStep({
  value,
  onChange,
  onNext,
  onSwitchToClient,
  isLoading,
  lang = "en",
}: {
  value: FreelancerAccount;
  onChange: (v: FreelancerAccount) => void;
  onNext: () => void;
  onSwitchToClient: () => void;
  isLoading: boolean;
  lang?: "en" | "bn";
}) {
  const [showPassword, setShowPassword] = useState(false);

  const set = <K extends keyof FreelancerAccount>(k: K, v: FreelancerAccount[K]) =>
    onChange({ ...value, [k]: v });

  const valid =
    value.firstName.trim() &&
    value.lastName.trim() &&
    value.email.includes("@") &&
    value.password.length >= 8 &&
    value.agreedTerms;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-[#111315]">
          {lang === "bn" ? "আপনার পছন্দের কাজ খুঁজতে সাইন আপ করুন" : "Sign up to find work you love"}
        </h2>
        <p className="text-xs text-[#686E78]">
          {lang === "bn"
            ? "আপনার ফ্রি মুক্তকর্ম ফ্রিল্যান্সার অ্যাকাউন্ট তৈরি করুন"
            : "Create your free MuktoKormo freelancer account"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#111315]">First name</label>
          <input
            type="text"
            value={value.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            placeholder="Ahad"
            className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#111315]">Last name</label>
          <input
            type="text"
            value={value.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="Abdul"
            className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111315]">Email</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#686E78] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={value.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@example.com"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111315]">
          Password <span className="text-[#686E78] font-normal">(8 or more characters)</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#686E78] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            value={value.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#686E78] hover:text-[#111315] cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {value.password.length > 0 && value.password.length < 8 && (
          <p className="text-[11px] font-medium text-[#A87224]">
            {8 - value.password.length} more character
            {8 - value.password.length === 1 ? "" : "s"} needed
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111315]">Country</label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-[#686E78] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={value.country}
            onChange={(e) => set("country", e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
          >
            <option>Bangladesh</option>
            <option>India</option>
            <option>Pakistan</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>United Arab Emirates</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={value.marketingOptIn}
            onChange={(e) => set("marketingOptIn", e.target.checked)}
            className="mt-0.5 rounded border-[rgba(17,19,21,0.25)] accent-[#0B3B2E]"
          />
          <span className="text-[11px] text-[#3E434A] leading-relaxed">
            Send me helpful emails to find rewarding work and job leads.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={value.agreedTerms}
            onChange={(e) => set("agreedTerms", e.target.checked)}
            className="mt-0.5 rounded border-[rgba(17,19,21,0.25)] accent-[#0B3B2E]"
          />
          <span className="text-[11px] text-[#3E434A] leading-relaxed">
            Yes, I understand and agree to the MuktoKormo Terms of Service, including the User
            Agreement and Privacy Policy.
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!valid || isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
      >
        {isLoading
          ? "Creating account..."
          : value.firstName
            ? `Continue as ${value.firstName}`
            : "Create my account"}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="text-[11px] text-[#686E78]">Here to hire talent?</span>
        <button
          type="button"
          onClick={onSwitchToClient}
          className="text-[11px] font-semibold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline cursor-pointer"
        >
          Join as a Client
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resume import                                                       */
/* ------------------------------------------------------------------ */

export function ResumeImportStep({
  onNext,
  onBack,
  onManual,
}: {
  onNext: () => void;
  onBack: () => void;
  onManual: () => void;
}) {
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (file: File | undefined | null) => {
    if (!file) return;
    setFileName(file.name);
    setMode("upload");
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-[#111315]">
          How would you like to start building your profile?
        </h2>
        <p className="text-xs text-[#686E78] leading-relaxed">
          A strong, complete profile helps clients find you and increases your chances of getting
          hired.
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer relative ${
            mode === "upload"
              ? "border-[#0B3B2E] bg-[#EAF5F0] shadow-xs"
              : "border-[rgba(17,19,21,0.12)] bg-white hover:border-[rgba(17,19,21,0.25)]"
          }`}
        >
          {mode === "upload" && (
            <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#0B3B2E] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
          <div className="w-10 h-10 rounded-xl bg-white border border-[rgba(17,19,21,0.09)] text-[#0F6E50] flex items-center justify-center mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-[#111315]">Upload resume</p>
          <p className="text-[11px] text-[#686E78] mt-1 leading-relaxed">
            We&apos;ll pre-fill your profile from your CV in seconds.
          </p>
        </button>

        <button
          type="button"
          onClick={onManual}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer relative ${
            mode === "manual"
              ? "border-[#0B3B2E] bg-[#EAF5F0] shadow-xs"
              : "border-[rgba(17,19,21,0.12)] bg-white hover:border-[rgba(17,19,21,0.25)]"
          }`}
        >
          {mode === "manual" && (
            <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#0B3B2E] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          )}
          <div className="w-10 h-10 rounded-xl bg-[#F4F2EC] text-[#3E434A] flex items-center justify-center mb-3">
            <PenLine className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-[#111315]">Fill out manually</p>
          <p className="text-[11px] text-[#686E78] mt-1 leading-relaxed">
            Answer a few questions and build it from scratch.
          </p>
        </button>
      </div>

      {/* Drop zone */}
      {mode === "upload" && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            acceptFile(e.dataTransfer.files?.[0]);
          }}
          className={`block border-2 border-dashed rounded-xl p-7 text-center transition-all cursor-pointer ${
            dragging
              ? "border-[#0F6E50] bg-[#EAF5F0]"
              : fileName
                ? "border-[#0F6E50]/40 bg-[#EAF5F0]/50"
                : "border-[rgba(17,19,21,0.18)] bg-[#FAF9F6] hover:border-[#0F6E50]/50"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />

          {fileName ? (
            <>
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F0] border border-[#0F6E50]/20 text-[#0F6E50] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#111315]">{fileName}</p>
              <p className="text-[11px] text-[#0F6E50] font-semibold mt-1">
                Resume ready to parse
              </p>
            </>
          ) : (
            <>
              <div className="w-11 h-11 rounded-xl bg-white border border-[rgba(17,19,21,0.1)] text-[#686E78] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#111315]">
                Drag &amp; drop your resume here, or click to browse
              </p>
              <p className="text-[11px] text-[#686E78] mt-1">PDF or DOCX · max 5MB</p>
            </>
          )}
        </label>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[rgba(17,19,21,0.08)]">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#3E434A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={mode === "upload" && !fileName}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          Next
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Categories & Skills                                                 */
/* ------------------------------------------------------------------ */

export function CategoriesSkillsStep({
  category,
  onCategoryChange,
  skills,
  onSkillsChange,
  onBack,
  onNext,
  lang = "en",
}: {
  category: string;
  onCategoryChange: (c: string) => void;
  skills: string[];
  onSkillsChange: (s: string[]) => void;
  onBack: () => void;
  onNext: () => void;
  lang?: "en" | "bn";
}) {
  const [group, setGroup] = useState(PROFILE_CATEGORIES[0].group);
  const [query, setQuery] = useState("");

  const activeGroup = PROFILE_CATEGORIES.find((g) => g.group === group) ?? PROFILE_CATEGORIES[0];

  const allItems = PROFILE_CATEGORIES.flatMap((g) =>
    g.items.map((en, i) => ({ en, bn: g.itemsBn[i] ?? en }))
  );

  const searchResults = query
    ? allItems.filter(
        (i) =>
          i.en.toLowerCase().includes(query.toLowerCase()) ||
          i.bn.includes(query)
      )
    : [];

  const toggleSkill = (skill: string) => {
    onSkillsChange(
      skills.includes(skill) ? skills.filter((s) => s !== skill) : [...skills, skill].slice(0, 15)
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-bold tracking-tight text-[#111315]">
          {lang === "bn"
            ? "আপনার কাজের জন্য প্রধান দক্ষতাগুলো কী?"
            : "What are the main skills required for your work?"}
        </h2>
        <p className="text-xs text-[#686E78] leading-relaxed">
          Choose the category that best describes your work. It&apos;s OK if it&apos;s not a perfect
          match.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#686E78] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills or add your own"
          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
        />
      </div>

      {/* Selected skills */}
      {skills.length > 0 && (
        <div className="rounded-xl border border-[#0F6E50]/20 bg-[#EAF5F0] p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0B3B2E] font-mono mk-tabular">
              Selected skills ({skills.length}/15)
            </span>
            <button
              type="button"
              onClick={() => onSkillsChange([])}
              className="text-[11px] font-semibold text-[#0F6E50] hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#0F6E50]/20 text-[11px] font-semibold text-[#0B3B2E]"
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

      {/* Category groups */}
      <div className="space-y-2.5">
        <span className="block text-xs font-semibold text-[#111315]">
          {lang === "bn" ? "আপনি যে ধরণের কাজ করেন" : "Type of work you do"}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PROFILE_CATEGORIES.map((g) => (
            <button
              key={g.group}
              type="button"
              onClick={() => {
                setGroup(g.group);
                setQuery("");
                onCategoryChange(g.group);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                g.group === category && !query
                  ? "bg-[#0B3B2E] border-[#0B3B2E] text-white"
                  : "bg-white border-[rgba(17,19,21,0.12)] text-[#3E434A] hover:border-[rgba(17,19,21,0.25)]"
              }`}
            >
              {lang === "bn" ? g.groupBn : g.group}
            </button>
          ))}
        </div>
      </div>

      {/* Sub categories / search results */}
      {query ? (
        <div className="space-y-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#686E78] font-mono mk-tabular">
            {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
          </span>
          {searchResults.length === 0 ? (
            <p className="text-[11px] text-[#686E78] py-4 text-center bg-[#F4F2EC] rounded-xl">
              No matches for &quot;{query}&quot;. Try a different keyword.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {searchResults.map(({ en, bn }) => {
                const isSelected = skills.includes(en);
                return (
                  <button
                    key={en}
                    type="button"
                    onClick={() => toggleSkill(en)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-semibold border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#EAF5F0] border-[#0F6E50] text-[#0B3B2E]"
                        : "bg-[#FAF9F6] border-[rgba(17,19,21,0.1)] text-[#3E434A] hover:border-[rgba(17,19,21,0.22)]"
                    }`}
                  >
                    {lang === "bn" ? bn : en}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {activeGroup.items.map((en, i) => {
            const label = lang === "bn" ? (activeGroup.itemsBn?.[i] ?? en) : en;
            const isSelected = skills.includes(en);
            return (
              <button
                key={en}
                type="button"
                onClick={() => toggleSkill(en)}
                className={`px-3 py-2 rounded-lg text-[11px] font-semibold border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#EAF5F0] border-[#0F6E50] text-[#0B3B2E]"
                    : "bg-[#FAF9F6] border-[rgba(17,19,21,0.1)] text-[#3E434A] hover:border-[rgba(17,19,21,0.22)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Popular skills */}
      <div className="space-y-2">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#686E78]">
          Popular skills
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.map((s) => {
            const isSelected = skills.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkill(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0B3B2E] border-[#0B3B2E] text-white"
                    : "bg-white border-[rgba(17,19,21,0.12)] text-[#3E434A] hover:border-[#0F6E50]"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-[#686E78]">
          For the best results, add 3–5 skills
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[rgba(17,19,21,0.08)]">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#3E434A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={skills.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          Next
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile tabs                                                        */
/* ------------------------------------------------------------------ */

const PROFILE_TABS = [
  { id: "about", label: "About you", labelBn: "আপনার সম্পর্কে" },
  { id: "rate", label: "Hourly rate", labelBn: "ঘণ্টাপ্রতি মূল্য" },
  { id: "employment", label: "Employment history", labelBn: "কর্মজীবনের ইতিহাস" },
  { id: "education", label: "Education", labelBn: "শিক্ষাগত যোগ্যতা" },
  { id: "language", label: "Language", labelBn: "ভাষা" },
];

export interface ProfileFormState {
  title: string;
  intro: string;
  hourlyRate: number;
  employment: EmploymentEntry[];
  education: EducationEntry[];
  languages: LanguageEntry[];
  portfolioUrls: string[];
}

export function ProfileInfoSteps({
  value,
  onChange,
  onBack,
  isFinal,
  onFinish,
  lang = "en",
}: {
  value: ProfileFormState;
  onChange: (v: ProfileFormState) => void;
  onBack: () => void;
  isFinal?: boolean;
  onFinish?: () => void;
  lang?: "en" | "bn";
}) {
  const [tab, setTab] = useState(PROFILE_TABS[0].id);
  const tabIndex = PROFILE_TABS.findIndex((t) => t.id === tab);
  const fee = Math.round(value.hourlyRate * 0.07);
  const earnings = Math.round(value.hourlyRate - fee);

  const set = <K extends keyof ProfileFormState>(k: K, v: ProfileFormState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-bold tracking-tight text-[#111315]">
          {lang === "bn" ? "এরপর, আপনার প্রোফাইল সম্পূর্ণ করুন" : "Next, fill out your profile"}
        </h2>
        <p className="text-xs text-[#686E78]">
          Highlight what you&apos;re good at and how you can help clients.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[rgba(17,19,21,0.09)] -mx-1 px-1">
        {PROFILE_TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === t.id
                ? "border-[#0B3B2E] text-[#0B3B2E]"
                : "border-transparent text-[#686E78] hover:text-[#111315]"
            }`}
          >
            {lang === "bn" ? t.labelBn : t.label}
            <span className="ml-1.5 text-[10px] font-mono mk-tabular text-[#949BA6]">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* About */}
      {tab === "about" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <p className="text-[11px] text-[#686E78] leading-relaxed">
            What you share here will be visible to clients.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111315]">Title *</label>
            <input
              type="text"
              value={value.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Senior Full-Stack Developer"
              className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
            />
            <p className="text-[10px] text-[#686E78]">Example: Web, Mobile &amp; Software Dev</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111315]">Introduction *</label>
            <textarea
              rows={5}
              value={value.intro}
              onChange={(e) => set("intro", e.target.value)}
              placeholder="Enter your top skills, experiences, and interests."
              className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
            />
            <div className="flex items-center justify-between">
              <p
                className={`text-[10px] font-medium ${
                  value.intro.length > 0 && value.intro.length < 100
                    ? "text-[#A87224]"
                    : "text-[#0F6E50]"
                }`}
              >
                {value.intro.length === 0
                  ? "At least 4 characters"
                  : value.intro.length < 100
                    ? `At least 100 characters (${value.intro.length}/100)`
                    : "Looks good"}
              </p>
              <span className="text-[10px] font-mono mk-tabular text-[#686E78]">
                {value.intro.length} chars
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111315]">Portfolio links</label>
            {value.portfolioUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const next = [...value.portfolioUrls];
                    next[i] = e.target.value;
                    set("portfolioUrls", next);
                  }}
                  placeholder="https://"
                  className="flex-1 px-3.5 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "portfolioUrls",
                      value.portfolioUrls.filter((_, idx) => idx !== i)
                    )
                  }
                  className="p-2 rounded-lg text-[#686E78] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("portfolioUrls", [...value.portfolioUrls, ""])}
              className="text-[11px] font-semibold text-[#0F6E50] hover:underline cursor-pointer"
            >
              + Add link
            </button>
          </div>
        </div>
      )}

      {/* Hourly rate */}
      {tab === "rate" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#111315]">Hourly rate</label>
            <p className="text-[11px] text-[#686E78] leading-relaxed">
              Clients will see your rate on your profile and in search results. You can adjust it
              for each job.
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#686E78]">
                ৳
              </span>
              <input
                type="number"
                min={0}
                step={50}
                value={value.hourlyRate}
                onChange={(e) => set("hourlyRate", Number(e.target.value))}
                className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-sm font-bold font-mono mk-tabular text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(17,19,21,0.09)] divide-y divide-[rgba(17,19,21,0.06)] overflow-hidden">
            {[
              { label: "Hourly rate", value: value.hourlyRate, cls: "text-[#111315]" },
              { label: "MuktoKormo service fee (7%)", value: fee, cls: "text-[#A87224]" },
              { label: "Estimated take-home", value: earnings, cls: "text-[#0F6E50]" },
            ].map((row) => (
              <div key={row.label} className="px-4 py-3 flex items-center justify-between bg-white">
                <span className="text-xs font-medium text-[#3E434A]">{row.label}</span>
                <span className={`text-xs font-bold font-mono mk-tabular ${row.cls}`}>
                  ৳{row.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employment */}
      {tab === "employment" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <p className="text-[11px] text-[#686E78] leading-relaxed">
            Add any experience that shows your skills. Freelance projects, past jobs, internships,
            and volunteer work all count.
          </p>

          {value.employment.map((emp) => (
            <div
              key={emp.id}
              className="rounded-xl border border-[rgba(17,19,21,0.1)] bg-[#FAF9F6]/60 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#686E78]">
                  {emp.company || "New role"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "employment",
                      value.employment.filter((e) => e.id !== emp.id)
                    )
                  }
                  className="p-1 text-[#686E78] hover:text-[#DC2626] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={emp.company}
                  onChange={(e) =>
                    set(
                      "employment",
                      value.employment.map((x) =>
                        x.id === emp.id ? { ...x, company: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Company"
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs font-medium text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15"
                />
                <input
                  value={emp.title}
                  onChange={(e) =>
                    set(
                      "employment",
                      value.employment.map((x) =>
                        x.id === emp.id ? { ...x, title: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Job title"
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs font-medium text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="month"
                  value={emp.start}
                  onChange={(e) =>
                    set(
                      "employment",
                      value.employment.map((x) =>
                        x.id === emp.id ? { ...x, start: e.target.value } : x
                      )
                    )
                  }
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs text-[#111315] font-mono mk-tabular"
                />
                <input
                  type="month"
                  value={emp.end}
                  onChange={(e) =>
                    set(
                      "employment",
                      value.employment.map((x) =>
                        x.id === emp.id ? { ...x, end: e.target.value } : x
                      )
                    )
                  }
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs text-[#111315] font-mono mk-tabular"
                />
              </div>

              <textarea
                rows={2}
                value={emp.description}
                onChange={(e) =>
                  set(
                    "employment",
                    value.employment.map((x) =>
                      x.id === emp.id ? { ...x, description: e.target.value } : x
                    )
                  )
                }
                placeholder="What did you do there?"
                className="w-full px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              set("employment", [
                ...value.employment,
                {
                  id: `emp-${Date.now()}`,
                  company: "",
                  title: "",
                  start: "",
                  end: "",
                  description: "",
                },
              ])
            }
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[rgba(17,19,21,0.2)] text-xs font-semibold text-[#0F6E50] hover:bg-[#EAF5F0] transition-all cursor-pointer"
          >
            + Add employment
          </button>
        </div>
      )}

      {/* Education */}
      {tab === "education" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <p className="text-[11px] text-[#686E78] leading-relaxed">
            This doesn&apos;t just have to be a degree. Adding any relevant education helps clients
            understand your expertise.
          </p>

          {value.education.map((edu) => (
            <div
              key={edu.id}
              className="rounded-xl border border-[rgba(17,19,21,0.1)] bg-[#FAF9F6]/60 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#686E78]">
                  {edu.school || "New school"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "education",
                      value.education.filter((e) => e.id !== edu.id)
                    )
                  }
                  className="p-1 text-[#686E78] hover:text-[#DC2626] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={edu.school}
                  onChange={(e) =>
                    set(
                      "education",
                      value.education.map((x) =>
                        x.id === edu.id ? { ...x, school: e.target.value } : x
                      )
                    )
                  }
                  placeholder="School / University"
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs font-medium text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15"
                />
                <input
                  value={edu.degree}
                  onChange={(e) =>
                    set(
                      "education",
                      value.education.map((x) =>
                        x.id === edu.id ? { ...x, degree: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Degree"
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs font-medium text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={edu.field}
                  onChange={(e) =>
                    set(
                      "education",
                      value.education.map((x) =>
                        x.id === edu.id ? { ...x, field: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Field of study"
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15"
                />
                <input
                  value={edu.start}
                  onChange={(e) =>
                    set(
                      "education",
                      value.education.map((x) =>
                        x.id === edu.id ? { ...x, start: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Start"
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs text-[#111315] font-mono mk-tabular"
                />
                <input
                  value={edu.end}
                  onChange={(e) =>
                    set(
                      "education",
                      value.education.map((x) =>
                        x.id === edu.id ? { ...x, end: e.target.value } : x
                      )
                    )
                  }
                  placeholder="End"
                  className="px-3 py-2 bg-white border border-[rgba(17,19,21,0.14)] rounded-lg text-xs text-[#111315] font-mono mk-tabular"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              set("education", [
                ...value.education,
                {
                  id: `edu-${Date.now()}`,
                  school: "",
                  degree: "",
                  field: "",
                  start: "",
                  end: "",
                },
              ])
            }
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[rgba(17,19,21,0.2)] text-xs font-semibold text-[#0F6E50] hover:bg-[#EAF5F0] transition-all cursor-pointer"
          >
            + Add education
          </button>
        </div>
      )}

      {/* Language */}
      {tab === "language" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <p className="text-[11px] text-[#686E78] leading-relaxed">
            Help clients connect with you more easily. English is required, but any level is welcome.
          </p>

          {value.languages.map((langEntry) => (
            <div key={langEntry.id} className="flex items-center gap-2">
              <input
                value={langEntry.name}
                onChange={(e) =>
                  set(
                    "languages",
                    value.languages.map((l) =>
                      l.id === langEntry.id ? { ...l, name: e.target.value } : l
                    )
                  )
                }
                placeholder="Language"
                className="flex-1 px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15"
              />
              <select
                value={langEntry.proficiency}
                onChange={(e) =>
                  set(
                    "languages",
                    value.languages.map((l) =>
                      l.id === langEntry.id ? { ...l, proficiency: e.target.value } : l
                    )
                  )
                }
                className="px-3 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315]"
              >
                {PROFICIENCY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  set(
                    "languages",
                    value.languages.filter((l) => l.id !== langEntry.id)
                  )
                }
                className="p-2 rounded-lg text-[#686E78] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                set("languages", [
                  ...value.languages,
                  {
                    id: `lang-${Date.now()}`,
                    name: "",
                    proficiency: "Fluent",
                  },
                ])
              }
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-[rgba(17,19,21,0.2)] text-xs font-semibold text-[#0F6E50] hover:bg-[#EAF5F0] transition-all cursor-pointer"
            >
              + Add language
            </button>

            {!value.languages.some((l) => l.name.toLowerCase() === "english") && (
              <button
                type="button"
                onClick={() =>
                  set("languages", [
                    ...value.languages,
                    { id: `lang-en-${Date.now()}`, name: "English", proficiency: "Fluent" },
                  ])
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-[#A87224] hover:underline cursor-pointer"
              >
                English is required
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[rgba(17,19,21,0.08)]">
        <button
          type="button"
          onClick={tabIndex > 0 ? () => setTab(PROFILE_TABS[tabIndex - 1].id) : onBack}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#3E434A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
        >
          Back
        </button>

        {tabIndex < PROFILE_TABS.length - 1 ? (
          <button
            type="button"
            onClick={() => setTab(PROFILE_TABS[tabIndex + 1].id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111315] hover:bg-[#0B3B2E] text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinish}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            {isFinal ? "Save & go to dashboard" : "Save profile"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
