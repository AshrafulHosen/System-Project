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
  lang?: "en" | "bn";
}

export function ClientOrgStep({ value, onChange, onBack, onNext, lang = "en" }: ClientOrgStepProps) {
  const set = <K extends keyof ClientOrgDetails>(key: K, val: ClientOrgDetails[K]) =>
    onChange({ ...value, [key]: val });

  const canContinue = value.companyName.trim().length > 1 && value.orgSize !== "";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-[#111315]">
          {lang === "bn" ? "মুক্তকর্মে স্বাগতম!" : "Welcome to MuktoKormo!"}
        </h2>
        <p className="text-xs text-[#686E78] leading-relaxed">
          {lang === "bn"
            ? "আপনার প্রতিষ্ঠান সম্পর্কে বলুন, তাহলে দ্রুত সঠিক ট্যালেন্টের সাথে যুক্ত হতে পারবেন।"
            : "Tell us about your business and you'll be on your way to connect with talent."}
        </p>
      </div>

      {/* Company name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#111315]">
          {lang === "bn" ? "প্রতিষ্ঠানের নাম" : "Company Name"}
        </label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-[#686E78] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={value.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="e.g. Apex Lifestyle BD"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
          />
        </div>
      </div>

      {/* Website + Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#111315]">
            {lang === "bn" ? "ওয়েবসাইট" : "Website"}
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-[#686E78] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={value.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#111315]">
            {lang === "bn" ? "আপনার পদবী" : "Your role"}
          </label>
          <select
            value={value.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-[rgba(17,19,21,0.14)] rounded-xl text-xs font-medium text-[#111315] focus:outline-none focus:border-[#0F6E50] focus:ring-2 focus:ring-[#0F6E50]/15 transition-colors"
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
          <Users className="w-4 h-4 text-[#0F6E50]" />
          <label className="text-xs font-semibold text-[#111315]">
            {lang === "bn"
              ? "আপনার প্রতিষ্ঠানে কতজন সদস্য আছেন?"
              : "How many people are in your organization?"}
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ORG_SIZE_OPTIONS.map((opt) => {
            const isSelected = value.orgSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("orgSize", opt.value as ClientOrgDetails["orgSize"])}
                className={`relative px-3 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#0B3B2E] bg-[#EAF5F0] text-[#0B3B2E] shadow-xs"
                    : "border-[rgba(17,19,21,0.12)] bg-white text-[#3E434A] hover:border-[rgba(17,19,21,0.25)]"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0B3B2E] text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                {lang === "bn" ? opt.labelBn : opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[rgba(17,19,21,0.08)]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#3E434A] hover:bg-[#F4F2EC] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {lang === "bn" ? "পেছনে" : "Back"}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          {lang === "bn" ? "পরবর্তী" : "Continue"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
