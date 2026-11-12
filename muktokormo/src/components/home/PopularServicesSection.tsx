"use client";

import React from "react";
import {
  ArrowUpRight,
  Code2,
  PenTool,
  Megaphone,
  Smartphone,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface PopularServicesSectionProps {
  lang: "en" | "bn";
  onSelectServiceQuery: (query: string) => void;
  onOpenPostJob: () => void;
}

export default function PopularServicesSection({
  lang,
  onSelectServiceQuery,
  onOpenPostJob,
}: PopularServicesSectionProps) {
  const services = [
    {
      icon: Code2,
      tag: lang === "en" ? "Engineering" : "সফটওয়্যার ইঞ্জিনিয়ারিং",
      title:
        lang === "en"
          ? "Next.js Storefront & SSLCOMMERZ Checkout"
          : "ই-কমার্স ওয়েবসাইট ও এসএসএলকমার্জ পেমেন্ট",
      desc:
        lang === "en"
          ? "Full-stack e-commerce storefront with bKash, Nagad checkout, inventory dashboard, and mobile responsiveness."
          : "বিকাশ ও নগদ পেমেন্ট গেটওয়েসহ পূর্ণাঙ্গ রেসপনসিভ ই-কমার্স ওয়েবসাইট।",
      budgetRange: "৳35,000 – ৳85,000",
      timeline: lang === "en" ? "14 – 25 days" : "১৪ – ২৫ দিন",
      query: "Next.js",
    },
    {
      icon: PenTool,
      tag: lang === "en" ? "Product Design" : "প্রোডাক্ট ডিজাইন",
      title:
        lang === "en"
          ? "SaaS UI/UX System & Interactive Prototype"
          : "SaaS ইউআই/ইউএক্স ডিজাইন ও প্রোটোটাইপ",
      desc:
        lang === "en"
          ? "Design token architecture, bilingual web/mobile layouts, and developer-ready Figma component libraries."
          : "ডিজাইন সিস্টেম টোকেন, বাংলা ও ইংরেজি লেআউট এবং ফিগমা প্রোটোটাইপ।",
      budgetRange: "৳20,000 – ৳50,000",
      timeline: lang === "en" ? "10 – 18 days" : "১০ – ১৮ দিন",
      query: "Figma",
    },
    {
      icon: Smartphone,
      tag: lang === "en" ? "Mobile Apps" : "মোবাইল অ্যাপ",
      title:
        lang === "en"
          ? "Cross-Platform Flutter Logistics & Booking App"
          : "ফ্লাটার অ্যান্ড্রয়েড ও আইওএস অ্যাপ",
      desc:
        lang === "en"
          ? "Production Android & iOS client apps integrated with live notifications, OTP auth, and local MFS rails."
          : "অ্যান্ড্রয়েড ও আইওএস অ্যাপ—পুশ নোটিফিকেশন ও লোকাল পেমেন্ট ইন্টিগ্রেশনসহ।",
      budgetRange: "৳45,000 – ৳1,20,000",
      timeline: lang === "en" ? "21 – 40 days" : "২১ – ৪০ দিন",
      query: "Flutter",
    },
    {
      icon: Megaphone,
      tag: lang === "en" ? "Growth & SEO" : "গ্রোথ ও মার্কেটিং",
      title:
        lang === "en"
          ? "Meta CAPI Campaigns & Bilingual SEO Content"
          : "মেটা অ্যাডস ও বাংলা-ইংরেজি এসইও",
      desc:
        lang === "en"
          ? "Server-side conversion tracking, ROAS creative testing, and local search ranking tailored for Dhaka & nationwide buyers."
          : "কনভার্সন ট্র্যাকিং, অ্যাড অপ্টিমাইজেশন ও বাংলা/ইংরেজি এসইও কন্টেন্ট।",
      budgetRange: "৳12,000 – ৳35,000",
      timeline: lang === "en" ? "7 – 14 days" : "৭ – ১৪ দিন",
      query: "Meta Ads",
    },
  ];

  return (
    <section className="py-18 bg-white border-b border-[rgba(17,19,21,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F6E50] block mb-1.5">
              {lang === "en" ? "Popular Service Tracks" : "জনপ্রিয় সার্ভিস প্যাকেজ"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111315]">
              {lang === "en" ? (
                <>
                  Scoped deliverables built for{" "}
                  <span className="font-serif italic font-normal text-[#0F6E50]">
                    predictable delivery
                  </span>
                </>
              ) : (
                <>
                  নির্দিষ্ট বাজেটে ও সময়ে{" "}
                  <span className="font-serif italic font-normal text-[#0F6E50]">
                    মানসম্মত কাজ
                  </span>
                </>
              )}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#686E78]">
              {lang === "en"
                ? "Start from proven project scopes tailored to Bangladesh's digital businesses, or post custom requirements."
                : "জনপ্রিয় প্রজেক্ট ক্যাটাগরি বেছে নিন অথবা আপনার নিজস্ব চাহিদা অনুযায়ী কাজ পোস্ট করুন।"}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenPostJob}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F4F2EC] border border-[rgba(17,19,21,0.12)] text-xs font-semibold text-[#111315] transition-colors cursor-pointer"
          >
            <span>
              {lang === "en" ? "Request Custom Brief" : "কাস্টম প্রজেক্ট পোস্ট"}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#0F6E50]" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((svc) => {
            const IconComp = svc.icon;
            return (
              <div
                key={svc.title}
                onClick={() => onSelectServiceQuery(svc.query)}
                className="group bg-[#FAF9F6] hover:bg-white border border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/45 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-8px_rgba(17,19,21,0.08)] cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[rgba(17,19,21,0.08)] flex items-center justify-center text-[#0F6E50] group-hover:bg-[#EAF5F0] transition-colors">
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#686E78] bg-white px-2.5 py-1 rounded-full border border-[rgba(17,19,21,0.08)]">
                      {svc.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#111315] group-hover:text-[#0F6E50] transition-colors leading-snug">
                      {svc.title}
                    </h3>
                    <p className="mt-2 text-xs text-[#686E78] leading-relaxed">
                      {svc.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[rgba(17,19,21,0.08)] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#111315] mk-tabular">
                      {svc.budgetRange}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#686E78]">
                      <Clock className="w-3 h-3" />
                      {svc.timeline}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 text-[#0F6E50] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Escrow Milestone Ready
                    </span>
                    <span className="text-[#111315] font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                      Explore <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
