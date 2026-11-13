"use client";

import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

export interface ClientAccount {
  name: string;
  email: string;
  password: string;
  agreedTerms: boolean;
}

export function ClientAccountStep({
  value,
  onChange,
  onNext,
  onSwitchToFreelancer,
  isLoading,
  lang = "en",
}: {
  value: ClientAccount;
  onChange: (v: ClientAccount) => void;
  onNext: () => void;
  onSwitchToFreelancer: () => void;
  isLoading: boolean;
  lang?: "en" | "bn";
}) {
  const [showPassword, setShowPassword] = useState(false);

  const set = <K extends keyof ClientAccount>(k: K, v: ClientAccount[K]) =>
    onChange({ ...value, [k]: v });

  const valid =
    value.name.trim() &&
    value.email.includes("@") &&
    value.password.length >= 8 &&
    value.agreedTerms;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          {lang === "bn" ? "আপনার অ্যাকাউন্ট তৈরি করুন" : "Create your account"}
        </h2>
        <p className="text-xs text-ink-3">
          {lang === "bn"
            ? "আপনার ফ্রি মুক্তকর্ম নিয়োগদাতা অ্যাকাউন্ট"
            : "Your free MuktoKormo employer account"}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-ink">
          {lang === "bn" ? "পুরো নাম" : "Full name"}
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ahad Abdul"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-line-strong rounded-lg text-xs font-medium text-ink placeholder-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-ink">
          {lang === "bn" ? "ইমেইল" : "Email"}
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={value.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@company.com"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-line-strong rounded-lg text-xs font-medium text-ink placeholder-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-ink">
          {lang === "bn" ? "পাসওয়ার্ড" : "Password"}{" "}
          <span className="text-ink-3 font-normal">(8 or more characters)</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            value={value.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-line-strong rounded-lg text-xs font-medium text-ink placeholder-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {value.password.length > 0 && value.password.length < 8 && (
          <p className="text-[11px] font-medium text-accent">
            {8 - value.password.length} more character
            {8 - value.password.length === 1 ? "" : "s"} needed
          </p>
        )}
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={value.agreedTerms}
          onChange={(e) => set("agreedTerms", e.target.checked)}
          className="mt-0.5 rounded border-line-strong accent-navy"
        />
        <span className="text-[11px] text-ink-2 leading-relaxed">
          Yes, I understand and agree to the MuktoKormo Terms of Service, including the User
          Agreement and Privacy Policy.
        </span>
      </label>

      <button
        type="button"
        onClick={onNext}
        disabled={!valid || isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-navy hover:bg-navy-ink disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
      >
        {lang === "bn" ? "পরবর্তী ধাপ" : "Continue"}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="text-[11px] text-ink-3">Here to find work?</span>
        <button
          type="button"
          onClick={onSwitchToFreelancer}
          className="text-[11px] font-semibold text-brand hover:text-navy hover:underline cursor-pointer"
        >
          Join as a Freelancer
        </button>
      </div>
    </div>
  );
}
