"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Layers,
  Star,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function DashboardPortalPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="cursor-pointer">
              <Logo size="md" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs font-semibold text-slate-500">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "Dedicated Role Dashboards" : "ভূমিকাভিত্তিক ড্যাশবোর্ড পোর্টাল"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              {lang === "en" ? "বাংলা" : "English"}
            </button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-full transition-colors"
            >
              {lang === "en" ? "← Back to Home" : "← হোমে ফিরুন"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "Personalized Workspaces" : "ব্যক্তিগতকৃত কাজের পরিবেশ"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {lang === "en" ? "Choose Your Dashboard Experience" : "আপনার ড্যাশবোর্ড মোড নির্বাচন করুন"}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            {lang === "en"
              ? "MuktoKormo provides specialized command centers tailored specifically for Bangladeshi employers hiring talent, and freelancers delivering high-quality work."
              : "মুক্তকর্ম প্রদান করে বাংলাদেশি নিয়োগকর্তাদের এবং কাজ সম্পাদনকারী ফ্রিল্যান্সারদের জন্য বিশেষভাবে ডিজাইন করা সুনির্দিষ্ট ড্যাশবোর্ড।"}
          </p>
        </div>

        {/* Two Dedicated Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Employer / Client Dashboard */}
          <div className="relative group rounded-3xl bg-white border-2 border-slate-200/90 hover:border-emerald-500 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {lang === "en" ? "Client / Employer" : "ক্লায়েন্ট / নিয়োগদাতা"}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {lang === "en" ? "Employer Command Center" : "নিয়োগকর্তা ড্যাশবোর্ড"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  {lang === "en"
                    ? "Manage your active job posts, compare candidate bids, fund milestones into secure BDT escrow, and review deliverables."
                    : "কাজ পোস্ট করুন, বিড তুলনা করুন, বিকাশ/নগদে সুরক্ষিত এসক্রো ফান্ড রাখুন এবং কাজের ডেলিভারি অনুমোদন করুন।"}
                </p>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-3 pt-2 text-xs text-slate-700">
                {[
                  lang === "en" ? "Post & publish jobs with custom BDT budgets" : "কাস্টম বিডিটি বাজেটে কাজ পোস্ট করুন",
                  lang === "en" ? "Review competing bids & shortlisted proposals" : "আবেদনকারী ফ্রিল্যান্সারদের বিড ও প্রস্তাবনা যাচাই",
                  lang === "en" ? "Milestone-by-milestone bKash/Nagad escrow custody" : "বিকাশ ও নগদে সুরক্ষিত মাইলস্টোন এসক্রো তহবিল",
                  lang === "en" ? "Direct contract workspaces & milestone approvals" : "সরাসরি কন্ট্রাক্ট ওয়ার্কস্পেস ও কাজের অনুমোদন",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/dashboard/client"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>{lang === "en" ? "Open Client Dashboard →" : "ক্লায়েন্ট ড্যাশবোর্ডে প্রবেশ করুন →"}</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Freelancer / Talent Dashboard */}
          <div className="relative group rounded-3xl bg-white border-2 border-slate-200/90 hover:border-sky-500 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Briefcase className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {lang === "en" ? "Freelancer / Talent" : "ফ্রিল্যান্সার / ট্যালেন্ট"}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                  {lang === "en" ? "Freelancer Workspace" : "ফ্রিল্যান্সার ড্যাশবোর্ড"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  {lang === "en"
                    ? "Track proposal statuses, manage active contracts, submit work deliverables, and withdraw funds directly to bKash & Nagad."
                    : "প্রস্তাবনা ট্র্যাক করুন, চুক্তি পরিচালনা করুন, কাজের ফাইল জমা দিন এবং সরাসরি বিকাশ ও নগদে টাকা উত্তোলন করুন।"}
                </p>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-3 pt-2 text-xs text-slate-700">
                {[
                  lang === "en" ? "Track live bids & competitive proposal rankings" : "জমা দেওয়া বিড ও আবেদনের লাইভ স্ট্যাটাস ট্র্যাকিং",
                  lang === "en" ? "Work submission modal with demo URL & file attachments" : "ডেমো লিংক ও ফাইলসহ কাজ জমা দেওয়ার সিস্টেম",
                  lang === "en" ? "Real-time BDT wallet with instant bKash/Nagad cashout" : "লাইভ বিডিটি ওয়ালেট ও তাৎক্ষণিক ক্যাশআউট সুবিধা",
                  lang === "en" ? "Profile strength meter & skill recommendation engine" : "প্রোফাইল পূর্ণতা মিটার ও স্কিল এনডোর্সমেন্ট ইঞ্জিন",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/dashboard/freelancer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <span>{lang === "en" ? "Open Freelancer Dashboard →" : "ফ্রিল্যান্সার ড্যাশবোর্ডে প্রবেশ করুন →"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Fast-Switch Banner */}
        <div className="bg-slate-100/80 rounded-2xl p-6 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {lang === "en" ? "Need to switch roles at any time?" : "যেকোনো সময় রোল পরিবর্তন করতে চান?"}
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === "en"
                  ? "Both dashboards feature an instant role switcher in the sidebar and top navigation."
                  : "উভয় ড্যাশবোর্ডের সাইডবার ও টপ বারে এক ক্লিকেই মোড পরিবর্তন করার সুবিধা রয়েছে।"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/client"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
            >
              Client (আহাদ)
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href="/dashboard/freelancer"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
            >
              Freelancer (আরিফুর)
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
