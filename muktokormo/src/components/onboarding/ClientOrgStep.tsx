"use client";

import React from "react";
import { Building2, Globe, Users, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { ORG_SIZE_OPTIONS, COMPANY_ROLES } from "@/data/dashboardData";
import { ClientOrgDetails } from "@/types";

interface ClientOrgStepProps {
  value: ClientOrgDetails;
  onChange: (v: ClientOrgDetails) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ClientOrgStep({ value, onChange, onBack, onNext }: ClientOrgStepProps) {
  const set = <K extends keyof ClientOrgDetails>(key: K, val: ClientOrgDetails[K]) =>
    onChange({ ...value, [key]: val });

  const canContinue = value.companyName.trim().length > 1 && value.orgSize !== "";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-black tracking-tight text-slate-900">
          Welcome to MuktoKormo!
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tell us about your business and you&apos;ll be on your way to connect with talent.
        </p>
      </div>

      {/* Company name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">Company Name</label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={value.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="e.g. Apex Lifestyle BD"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Website + Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">Website</label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={value.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">Your role</label>
          <select
            value={value.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {COMPANY_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Org size */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <label className="text-xs font-bold text-slate-900">
            How many people are in your organization?
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ORG_SIZE_OPTIONS.map((opt) => {
            const isSelected = value.orgSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("orgSize", opt.value as ClientOrgDetails["orgSize"])}
                className={`relative px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                {opt.labelBn}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          Continue
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
