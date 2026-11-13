"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  BadgeCheck,
  ArrowUpRight,
  Check,
  FileText,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";

interface FeatureTrioSectionProps {
  lang: "en" | "bn";
  onSearchTalent?: (query: string) => void;
}

/**
 * Three features, three different visual treatments:
 *  1. Talent discovery — light interface preview
 *  2. Contract workflow — navy timeline card
 *  3. Secure payment — editorial split with a ledger visualization
 * Visuals are illustrative previews of the real product surfaces.
 */
export default function FeatureTrioSection({ lang, onSearchTalent }: FeatureTrioSectionProps) {
  const en = lang === "en";

  return (
    <section id="features" className="py-20 sm:py-24 lg:py-28 bg-canvas">
      <div className="mk-container">
        <div className="max-w-3xl">
          <span className="mk-eyebrow text-brand">{en ? "The platform" : "প্ল্যাটফর্ম"}</span>
          <h2 className="mk-h2 mt-4 text-ink">
            {en ? (
              <>
                One workflow from brief to payout.{" "}
                <span className="text-ink-4">No scattered tools.</span>
              </>
            ) : (
              <>
                ব্রিফ থেকে পেমেন্ট—এক জায়গায়।{" "}
                <span className="text-ink-4">ছড়ানো-ছিটানো টুলের দরকার নেই।</span>
              </>
            )}
          </h2>
        </div>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* 1 — Find the right talent */}
          <article className="lg:col-span-7 bg-white border border-line rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col">
            <span className="font-mono text-[12px] text-ink-4">01</span>
            <h3 className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-ink">
              {en ? "Find the right talent" : "সঠিক ট্যালেন্ট খুঁজুন"}
            </h3>
            <p className="mt-2 text-[15px] text-ink-3 leading-relaxed max-w-md">
              {en
                ? "Search identity-verified professionals by skill, compare rates in Taka, and invite them straight to your brief."
                : "দক্ষতা অনুযায়ী যাচাইকৃত পেশাজীবী খুঁজুন, টাকায় রেট তুলনা করুন এবং সরাসরি আমন্ত্রণ জানান।"}
            </p>

            <div aria-hidden="true" className="mt-8 rounded-xl border border-line bg-canvas p-3 sm:p-4">
              <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-white border border-line">
                <Search className="w-4 h-4 text-ink-4" />
                <span className="text-[13px] text-ink-3">Figma, design systems</span>
              </div>
              <ul className="mt-3 space-y-2">
                {[
                  { i: "UX", t: en ? "Product designer" : "প্রোডাক্ট ডিজাইনার", s: ["Figma", "Design systems"], r: "৳1,800/hr" },
                  { i: "BR", t: en ? "Brand designer" : "ব্র্যান্ড ডিজাইনার", s: ["Identity", "Illustrator"], r: "৳1,200/hr" },
                  { i: "MO", t: en ? "Motion designer" : "মোশন ডিজাইনার", s: ["After Effects"], r: "৳1,500/hr" },
                ].map((row, idx) => (
                  <li
                    key={row.i}
                    className={`flex items-center gap-3 p-3 rounded-lg bg-white border ${
                      idx === 0 ? "border-brand-border ring-4 ring-brand/8" : "border-line"
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-md text-[12px] font-semibold flex items-center justify-center shrink-0 ${idx === 0 ? "bg-navy text-white" : "bg-subtle text-ink-2"}`}>
                      {row.i}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1 text-[13px] font-semibold text-ink">
                        {row.t}
                        <BadgeCheck className="w-3.5 h-3.5 text-brand" />
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {row.s.map((s) => (
                          <span key={s} className="px-1.5 py-px rounded bg-subtle text-[10px] font-medium text-ink-3">
                            {s}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="text-[13px] font-semibold text-ink mk-tabular">{row.r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {onSearchTalent && (
              <button
                type="button"
                onClick={() => onSearchTalent("")}
                className="mt-6 self-start inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover cursor-pointer group"
              >
                {en ? "Browse the talent directory" : "ট্যালেন্ট ডিরেক্টরি দেখুন"}
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </button>
            )}
          </article>

          {/* 2 — Work with confidence */}
          <article className="lg:col-span-5 mk-dark-card rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col relative overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 mk-hatch-dark opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black)]" />
            <span className="relative font-mono text-[12px] text-white/45">02</span>
            <h3 className="relative mt-3 text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-white">
              {en ? "Work with confidence" : "আত্মবিশ্বাসের সাথে কাজ করুন"}
            </h3>
            <p className="relative mt-2 text-[15px] text-white/65 leading-relaxed">
              {en
                ? "Proposals become contracts. Every submission, revision request and approval is logged in one shared workspace."
                : "প্রস্তাব থেকে চুক্তি। প্রতিটি জমা, রিভিশন ও অনুমোদন এক ওয়ার্কস্পেসে সংরক্ষিত।"}
            </p>

            <ol aria-hidden="true" className="relative mt-8 lg:mt-auto lg:pt-10 space-y-0">
              {[
                { icon: FileText, t: en ? "Proposal accepted" : "প্রস্তাব গৃহীত", d: en ? "Contract created" : "চুক্তি তৈরি", done: true },
                { icon: Send, t: en ? "Work submitted" : "কাজ জমা", d: en ? "Staging URL + files" : "স্টেজিং লিংক ও ফাইল", done: true },
                { icon: RotateCcw, t: en ? "Revision requested" : "রিভিশন অনুরোধ", d: en ? "Feedback on record" : "মতামত সংরক্ষিত", done: true },
                { icon: Check, t: en ? "Approved" : "অনুমোদিত", d: en ? "Ready for release" : "রিলিজের জন্য প্রস্তুত", done: false },
              ].map((s, i, arr) => {
                const Icon = s.icon;
                return (
                  <li key={s.t} className="flex gap-3.5">
                    <span className="flex flex-col items-center">
                      <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${s.done ? "bg-white/10 text-brand-light" : "bg-brand-light text-navy"}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      {i < arr.length - 1 && <span className="w-px flex-1 min-h-4 bg-white/15 my-1" />}
                    </span>
                    <span className="pb-4">
                      <span className="block text-[14px] font-medium text-white">{s.t}</span>
                      <span className="block text-[12px] text-white/50">{s.d}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </article>

          {/* 3 — Get paid securely */}
          <article className="lg:col-span-12 bg-white border border-line rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
              <span className="font-mono text-[12px] text-ink-4">03</span>
              <h3 className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-ink">
                {en ? "Get paid securely, in Taka" : "নিরাপদে টাকায় পেমেন্ট নিন"}
              </h3>
              <p className="mt-2 text-[15px] text-ink-3 leading-relaxed max-w-md">
                {en
                  ? "Clients fund each contract through SSLCOMMERZ before work begins. Money is released only after approval — and every movement is written to the escrow ledger."
                  : "কাজ শুরুর আগেই ক্লায়েন্ট এসএসএলকমার্জের মাধ্যমে ফান্ড জমা দেন। অনুমোদনের পরেই টাকা রিলিজ হয়—প্রতিটি লেনদেন লেজারে লিপিবদ্ধ।"}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/escrow"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-ink hover:bg-ink-hover text-white text-sm font-medium transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  {en ? "How escrow works" : "এসক্রো যেভাবে কাজ করে"}
                </Link>
              </div>
            </div>

            <div aria-hidden="true" className="relative bg-subtle border-t lg:border-t-0 lg:border-l border-line p-6 sm:p-8 lg:p-12 flex items-center">
              <div className="absolute inset-0 mk-dot-grid opacity-60" />
              <div className="relative w-full max-w-md mx-auto bg-white rounded-xl border border-line shadow-[var(--mk-shadow-elevated)] overflow-hidden">
                <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-ink">{en ? "Escrow ledger" : "এসক্রো লেজার"}</span>
                  <span className="mk-eyebrow text-ink-4">{en ? "Example" : "উদাহরণ"}</span>
                </div>
                <ul className="divide-y divide-line">
                  {[
                    { l: en ? "Contract funded" : "চুক্তি ফান্ডেড", a: "৳45,000", tone: "brand", s: en ? "Funded" : "ফান্ডেড" },
                    { l: en ? "Platform fee (7%)" : "প্ল্যাটফর্ম ফি (৭%)", a: "−৳3,150", tone: "neutral", s: en ? "Deducted" : "কর্তিত" },
                    { l: en ? "Released to freelancer" : "ফ্রিল্যান্সারকে রিলিজ", a: "৳41,850", tone: "success", s: en ? "Released" : "রিলিজড" },
                  ].map((r) => (
                    <li key={r.l} className="px-5 py-3.5 flex items-center justify-between gap-3">
                      <span className="text-[13px] text-ink-2">{r.l}</span>
                      <span className="flex items-center gap-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            r.tone === "success"
                              ? "bg-success-soft text-success border-success-border"
                              : r.tone === "brand"
                              ? "bg-brand-soft text-brand-strong border-brand-border"
                              : "bg-subtle text-ink-3 border-muted"
                          }`}
                        >
                          {r.s}
                        </span>
                        <span className="text-[14px] font-semibold text-ink mk-tabular w-20 text-right">{r.a}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
