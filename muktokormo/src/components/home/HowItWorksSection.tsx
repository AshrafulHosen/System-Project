"use client";

import React, { useState } from "react";
import {
  FileEdit,
  UserCheck,
  Lock,
  CheckCircle2,
  Send,
  FolderGit2,
  Wallet,
  ShieldCheck,
} from "lucide-react";

interface HowItWorksSectionProps {
  lang: "en" | "bn";
}

export default function HowItWorksSection({ lang }: HowItWorksSectionProps) {
  const [track, setTrack] = useState<"client" | "freelancer">("client");

  const clientSteps = [
    {
      num: "01",
      icon: FileEdit,
      title: lang === "en" ? "Post a Scoped Brief" : "সুস্পষ্ট প্রজেক্ট পোস্ট করুন",
      desc:
        lang === "en"
          ? "Outline milestones, BDT budget, and required technical stack in under 2 minutes."
          : "বাজেট, সময়সীমা ও কাজের ধাপ উল্লেখ করে ২ মিনিটেই কাজ পোস্ট করুন।",
    },
    {
      num: "02",
      icon: UserCheck,
      title: lang === "en" ? "Evaluate Verified Bids" : "ভেরিফাইড বিড যাচাই করুন",
      desc:
        lang === "en"
          ? "Review proposals side-by-side from NID-checked Bangladeshi professionals, shortlist top fits, and discuss scope."
          : "এনআইডি যাচাইকৃত ফ্রিল্যান্সারদের প্রস্তাব, রেট ও পূর্ববর্তী অভিজ্ঞতা তুলনা করুন।",
    },
    {
      num: "03",
      icon: Lock,
      title: lang === "en" ? "Lock Milestone in BDT Escrow" : "বিডিটি এসক্রোতে ফান্ড লক",
      desc:
        lang === "en"
          ? "Fund contract milestones using bKash, Nagad, or local card rails before execution starts."
          : "বিকাশ, নগদ বা ব্যাংক কার্ডে মাইলস্টোন ফান্ড নিরাপদ এসক্রোতে জমা রাখুন।",
    },
    {
      num: "04",
      icon: CheckCircle2,
      title: lang === "en" ? "Inspect & Release Payout" : "যাচাই করে পেমেন্ট রিলিজ",
      desc:
        lang === "en"
          ? "Test live URLs and asset files inside the Contract Workspace, then release funds with 1 click."
          : "লাইভ ডেমো ও ফাইল পরীক্ষা করে সন্তুষ্ট হলেই পেমেন্ট রিলিজ করুন।",
    },
  ];

  const freelancerSteps = [
    {
      num: "01",
      icon: ShieldCheck,
      title: lang === "en" ? "Verify Identity & Profile" : "প্রোফাইল ও এনআইডি যাচাই",
      desc:
        lang === "en"
          ? "Complete your Porichoy NID verification, technical specialty tags, and BDT hourly rate."
          : "আপনার দক্ষতা, পোর্টফোলিও এবং পরিচয় এনআইডি যাচাই সম্পন্ন করুন।",
    },
    {
      num: "02",
      icon: Send,
      title: lang === "en" ? "Submit Structured Proposals" : "মাইলস্টোন প্রস্তাব পাঠান",
      desc:
        lang === "en"
          ? "Bid transparently in Taka with milestone breakdowns, delivery timelines, and net payout previews."
          : "আপনার পারিশ্রমিক ও ডেলিভারি পরিকল্পনা উল্লেখ করে প্রজেক্টে বিড করুন।",
    },
    {
      num: "03",
      icon: FolderGit2,
      title: lang === "en" ? "Deliver Inside Workspace" : "ওয়ার্কস্পেসে কাজ জমা দিন",
      desc:
        lang === "en"
          ? "Begin only once escrow funding is confirmed. Submit staging URLs, repos, and communicate in real time."
          : "এসক্রো ফান্ড নিশ্চিত হওয়ার পর কাজ শুরু করে ডেমো লিংক ও ফাইল জমা দিন।",
    },
    {
      num: "04",
      icon: Wallet,
      title: lang === "en" ? "Settle Direct to MFS / Bank" : "সরাসরি বিকাশ/ব্যাংকে পেমেন্ট",
      desc:
        lang === "en"
          ? "Once approved, receive net BDT earnings straight to bKash, Nagad, Rocket, or local bank accounts."
          : "অনুমোদনের পর সরাসরি আপনার বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে টাকা পান।",
    },
  ];

  const steps = track === "client" ? clientSteps : freelancerSteps;

  return (
    <section className="py-20 bg-[#FAF9F6] border-b border-[rgba(17,19,21,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F6E50] block mb-1.5">
              {lang === "en" ? "Operational Workflow" : "কার্যপদ্ধতি"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111315]">
              {lang === "en" ? (
                <>
                  How{" "}
                  <span className="font-serif italic font-normal text-[#0F6E50]">
                    MuktoKormo
                  </span>{" "}
                  works
                </>
              ) : (
                <>মুক্তকর্ম যেভাবে কাজ করে</>
              )}
            </h2>
          </div>

          <div className="inline-flex items-center bg-[#F4F2EC] border border-[rgba(17,19,21,0.09)] p-1 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setTrack("client")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                track === "client"
                  ? "bg-[#0B3B2E] text-white shadow-xs"
                  : "text-[#686E78] hover:text-[#111315]"
              }`}
            >
              {lang === "en" ? "For Clients" : "ক্লায়েন্টদের জন্য"}
            </button>
            <button
              type="button"
              onClick={() => setTrack("freelancer")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                track === "freelancer"
                  ? "bg-[#0B3B2E] text-white shadow-xs"
                  : "text-[#686E78] hover:text-[#111315]"
              }`}
            >
              {lang === "en" ? "For Freelancers" : "ফ্রিল্যান্সারদের জন্য"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s) => {
            const IconComp = s.icon;
            return (
              <div
                key={s.num}
                className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(17,19,21,0.03)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] border border-[#C3E3D5] text-[#0F6E50] flex items-center justify-center">
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#686E78]">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#111315] leading-snug">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#3E434A] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

