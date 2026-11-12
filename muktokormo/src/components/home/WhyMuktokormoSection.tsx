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

  return (
    <section className="py-20 bg-white border-t border-[rgba(17,19,21,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Narrative */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F6E50] block">
              {lang === "en" ? "Why Teams Switch" : "কেন মুক্তকর্ম"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111315] leading-[1.15]">
              {lang === "en" ? (
                <>
                  Built like financial software.{" "}
                  <span className="font-serif italic font-normal text-[#0F6E50]">
                    Tailored for Bangladesh.
                  </span>
                </>
              ) : (
                <>
                  আর্থিক স্বচ্ছতা ও আধুনিক{" "}
                  <span className="font-serif italic font-normal text-[#0F6E50]">
                    কাজের অভিজ্ঞতা
                  </span>
                </>
              )}
            </h2>
            <p className="text-sm text-[#3E434A] leading-relaxed">
              {lang === "en"
                ? "Informal Facebook hiring carries high payment default risk, while foreign marketplaces penalize local projects with USD exchange friction. MuktoKormo bridges the gap with disciplined infrastructure."
                : "অনিশ্চিত সোশ্যাল মিডিয়া হায়ারিং এবং ব্যয়বহুল বিদেশি প্ল্যাটফর্মের মধ্যবর্তী শূন্যস্থান পূরণে বাংলাদেশের নিজস্ব প্রফেশনাল প্ল্যাটফর্ম।"}
            </p>
          </div>

          {/* Right Feature Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pillars.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[rgba(17,19,21,0.09)] text-[#0F6E50] flex items-center justify-center shadow-[0_1px_2px_rgba(17,19,21,0.03)]">
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111315] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#686E78] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

