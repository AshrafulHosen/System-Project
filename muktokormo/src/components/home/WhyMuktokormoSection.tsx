"use client";

import React from "react";
import {
  ShieldCheck,
  Banknote,
  FileCheck2,
  MessageSquareText,
} from "lucide-react";

interface WhyMuktokormoSectionProps {
  lang: "en" | "bn";
}

export default function WhyMuktokormoSection({ lang }: WhyMuktokormoSectionProps) {
  const pillars = [
    {
      icon: Banknote,
      title:
        lang === "en"
          ? "Native BDT Settlement Without FX Friction"
          : "ডলার ঝামেলাহীন সরাসরি টাকায় লেনদেন",
      desc:
        lang === "en"
          ? "Avoid 5–8% international currency spreads and dual-currency card barriers. Fund milestones via bKash, Nagad, or local bank accounts."
          : "আন্তর্জাতিক কার্ড বা কারেন্সি কনভার্সন ফি ছাড়াই সরাসরি বিকাশ, নগদ বা লোকাল ব্যাংকে চুক্তি পরিচালনা করুন।",
    },
    {
      icon: ShieldCheck,
      title:
        lang === "en"
          ? "Porichoy Smart NID Trust Layer"
          : "পরিচয় স্মার্ট এনআইডি নিরাপত্তা",
      desc:
        lang === "en"
          ? "Both independent contractors and hiring organizations pass identity checks to deter duplicate profiles and ghost accounts."
          : "ক্লায়েন্ট ও ফ্রিল্যান্সার উভয়ই জাতীয় পরিচয়পত্র যাচাইয়ের মাধ্যমে প্রকৃত প্রোফাইল নিশ্চিত করেন।",
    },
    {
      icon: FileCheck2,
      title:
        lang === "en"
          ? "Auditable Contract & Escrow Ledger"
          : "অডিটযোগ্য কন্ট্রাক্ট ও এসক্রো লেজার",
      desc:
        lang === "en"
          ? "Every funded deposit, submitted demo link, revision feedback, and payout release is permanently logged with transaction references."
          : "প্রতিটি ডিপোজিট, জমা দেওয়া কাজের লিংক, রিভিশন ও পেমেন্ট রিলিজ স্বয়ংক্রিয়ভাবে টাইমলাইনসহ সংরক্ষিত থাকে।",
    },
    {
      icon: MessageSquareText,
      title:
        lang === "en"
          ? "Integrated Real-Time TalkJS Workspace"
          : "চুক্তির সাথেই ১-টু-১ লাইভ মেসেজিং",
      desc:
        lang === "en"
          ? "Keep project briefs, milestone status, file handoffs, and client-freelancer chat in one structured place instead of scattered WhatsApp threads."
          : "হোয়াটসঅ্যাপ বা ইমেইলের বিশৃঙ্খলা ছাড়াই প্রজেক্টের পাশে সরাসরি রিয়েল-টাইম মেসেজিং সুবিধা।",
    },
  ];

  const en = lang === "en";

  return (
    <section id="why-muktokormo" className="py-20 sm:py-24 lg:py-28 bg-canvas">
      <div className="mk-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left narrative */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <span className="mk-eyebrow text-brand">{en ? "Why Muktokormo" : "কেন মুক্তকর্ম"}</span>
            <h2 className="mk-h2 mt-4 text-ink">
              {en ? (
                <>
                  Built like financial software.{" "}
                  <span className="text-ink-4">Made for Bangladesh.</span>
                </>
              ) : (
                <>
                  আর্থিক স্বচ্ছতা ও আধুনিক{" "}
                  <span className="text-ink-4">কাজের অভিজ্ঞতা</span>
                </>
              )}
            </h2>
            <p className="mt-6 text-[15px] sm:text-base text-ink-3 leading-relaxed max-w-md">
              {en
                ? "Informal social-media hiring carries real payment risk, while foreign marketplaces penalise local projects with currency friction. Muktokormo closes the gap with disciplined infrastructure."
                : "অনিশ্চিত সোশ্যাল মিডিয়া হায়ারিং এবং ব্যয়বহুল বিদেশি প্ল্যাটফর্মের মধ্যবর্তী শূন্যস্থান পূরণে বাংলাদেশের নিজস্ব প্রফেশনাল প্ল্যাটফর্ম।"}
            </p>
          </div>

          {/* Right editorial list */}
          <ol className="lg:col-span-7 border-t border-line-strong">
            {pillars.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <li
                  key={item.title}
                  className="group grid grid-cols-[auto_1fr] sm:grid-cols-[64px_1fr_auto] gap-x-5 gap-y-2 py-7 sm:py-8 border-b border-line-strong"
                >
                  <span className="font-mono text-[13px] text-ink-4 pt-1">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold tracking-[-0.025em] text-ink leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[14px] sm:text-[15px] text-ink-3 leading-relaxed max-w-lg">
                      {item.desc}
                    </p>
                  </div>
                  <span className="hidden sm:flex w-11 h-11 rounded-md border border-line-strong text-ink-2 items-center justify-center group-hover:bg-ink group-hover:text-white group-hover:border-ink transition-colors">
                    <IconComp className="w-5 h-5" aria-hidden="true" />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
