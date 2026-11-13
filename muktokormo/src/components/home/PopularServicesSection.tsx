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

  const en = lang === "en";

  return (
    <section id="services" className="py-20 sm:py-24 bg-white border-y border-line">
      <div className="mk-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 lg:mb-12">
          <div className="max-w-2xl">
            <span className="mk-eyebrow text-brand">{en ? "Service tracks" : "সার্ভিস প্যাকেজ"}</span>
            <h2 className="mk-h2 mt-4 text-ink">
              {en ? "Start from a proven scope." : "প্রমাণিত স্কোপ দিয়ে শুরু করুন।"}
            </h2>
            <p className="mt-4 text-[15px] text-ink-3 max-w-lg">
              {en
                ? "Typical budgets and timelines for common projects. Pick one to search matching jobs, or post your own brief."
                : "জনপ্রিয় প্রজেক্ট ক্যাটাগরি বেছে নিন অথবা আপনার নিজস্ব চাহিদা অনুযায়ী কাজ পোস্ট করুন।"}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPostJob}
            className="self-start md:self-auto inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white hover:bg-subtle border border-line-strong text-sm font-medium text-ink transition-colors cursor-pointer"
          >
            {en ? "Post a custom brief" : "কাস্টম প্রজেক্ট পোস্ট"}
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-line">
          {services.map((svc, idx) => {
            const IconComp = svc.icon;
            return (
              <li
                key={svc.title}
                className={`border-b border-line ${idx % 2 === 1 ? "sm:border-l" : ""} ${idx > 0 ? "lg:border-l" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectServiceQuery(svc.query)}
                  className="group w-full h-full text-left p-6 lg:p-7 flex flex-col justify-between gap-8 hover:bg-canvas transition-colors cursor-pointer"
                >
                  <span className="block space-y-5">
                    <span className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-md bg-subtle text-navy flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors">
                        <IconComp className="w-4.5 h-4.5" aria-hidden="true" />
                      </span>
                      <span className="mk-eyebrow text-ink-4">{svc.tag}</span>
                    </span>
                    <span className="block">
                      <span className="block text-[17px] font-semibold tracking-[-0.025em] text-ink leading-snug">
                        {svc.title}
                      </span>
                      <span className="mt-2 block text-[13.5px] text-ink-3 leading-relaxed">{svc.desc}</span>
                    </span>
                  </span>
                  <span className="block pt-4 border-t border-line">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold text-ink mk-tabular tracking-[-0.02em]">
                        {svc.budgetRange}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12px] text-ink-3">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {svc.timeline}
                      </span>
                    </span>
                    <span className="mt-3 flex items-center justify-between text-[12px]">
                      <span className="inline-flex items-center gap-1 text-ink-3">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                        {en ? "Escrow-ready" : "এসক্রো প্রস্তুত"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-medium text-brand group-hover:translate-x-0.5 transition-transform">
                        {en ? "Find jobs" : "কাজ দেখুন"} <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
