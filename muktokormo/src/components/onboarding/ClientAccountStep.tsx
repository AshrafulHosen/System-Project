"use client";

import React from "react";
import { ArrowRight, Lock, Mail, User } from "lucide-react";

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
}: {
  value: ClientAccount;
  onChange: (v: ClientAccount) => void;
  onNext: () => void;
  onSwitchToFreelancer: () => void;
  isLoading: boolean;
}) {
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
        <h2 className="text-lg font-black tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="text-xs text-slate-500">
          Your free MuktoKormo employer account
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">Full name</label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ahad Abdul"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">Email</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={value.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@company.com"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">
          Password <span className="text-slate-400 font-semibold">(8 or more characters)</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            value={value.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        {value.password.length > 0 && value.password.length < 8 && (
          <p className="text-[11px] text-amber-600">
            {8 - value.password.length} more character
            {8 - value.password.length === 1 ? "" : "s"} needed
          </p>
        )}
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value.agreedTerms}
          onChange={(e) => set("agreedTerms", e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-[11px] text-slate-600 leading-relaxed">
          Yes, I understand and agree to the MuktoKormo Terms of Service, including the User
          Agreement and Privacy Policy.
        </span>
      </label>

      <button
        type="button"
        onClick={onNext}
        disabled={!valid || isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
      >
        Continue
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-500">Here to find work?</span>
        <button
          type="button"
          onClick={onSwitchToFreelancer}
          className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
        >
          Join as a Freelancer
        </button>
      </div>
    </div>
  );
}