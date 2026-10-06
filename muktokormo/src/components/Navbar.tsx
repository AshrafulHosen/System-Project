"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Briefcase,
  Users,
  FileText,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Handshake,
  CheckCircle2,
} from "lucide-react";
import Logo from "./Logo";

interface NavbarProps {
  onOpenPostJob: () => void;
  lang: "en" | "bn";
  onToggleLang: () => void;
  role: "client" | "freelancer";
  onToggleRole: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  myBidsCount?: number;
  onOpenMyBids?: () => void;
}

export default function Navbar({
  onOpenPostJob,
  lang,
  onToggleLang,
  role,
  onToggleRole,
  searchQuery,
  onSearchChange,
  myBidsCount = 0,
  onOpenMyBids,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"talent" | "work" | "why" | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: "talent" | "work" | "why") => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200/90 text-slate-900 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px]">
          
          {/* Left: Brand + Upwork-style Nav Menus */}
          <div className="flex items-center gap-7">
            <Link href="/" className="cursor-pointer shrink-0">
              <Logo size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold text-slate-700">
              {/* 1. Find Talent Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("talent")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "talent" ? null : "talent")}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg hover:text-emerald-700 transition-colors cursor-pointer ${
                    activeDropdown === "talent" ? "text-emerald-700" : ""
                  }`}
                >
                  <span>{lang === "en" ? "Find Talent" : "ট্যালেন্ট খুঁজুন"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === "talent" ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "talent" && (
                  <div className="absolute top-full left-0 w-80 pt-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-1">
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenPostJob();
                        }}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "Post a Job (Free)" : "কাজ পোস্ট করুন (ফ্রি)"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Get proposals from verified local talent within hours"
                            : "কয়েক ঘণ্টার মধ্যে ভেরিফায়েড ফ্রিল্যান্সারদের থেকে আবেদন পান"}
                        </p>
                      </button>

                      <a
                        href="/#freelancers-section"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "Talent Marketplace" : "ট্যালেন্ট মার্কেটপ্লেস"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Browse pre-vetted Bangladeshi developers, designers & experts"
                            : "দক্ষ ডেভেলপার, ডিজাইনার ও বিশেষজ্ঞদের পোর্টফোলিও দেখুন"}
                        </p>
                      </a>

                      <Link
                        href="/dashboard/client"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "Employer Dashboard" : "নিয়োগকর্তা ড্যাশবোর্ড"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Manage your posted jobs, proposals, and BDT escrow funding"
                            : "পোস্ট করা কাজ, আবেদন ও এসক্রো ফান্ড পরিচালনা করুন"}
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Find Work Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("work")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "work" ? null : "work")}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg hover:text-emerald-700 transition-colors cursor-pointer ${
                    activeDropdown === "work" ? "text-emerald-700" : ""
                  }`}
                >
                  <span>{lang === "en" ? "Find Work" : "কাজ খুঁজুন"}</span>
                  {myBidsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === "work" ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "work" && (
                  <div className="absolute top-full left-0 w-80 pt-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-1">
                      <a
                        href="/#jobs-section"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "Browse Open Jobs" : "চলমান কাজসমূহ দেখুন"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Explore high-paying jobs with guaranteed BDT milestone payments"
                            : "নিরাপদ বিডিটি মাইলস্টোন পেমেন্টে কাজ খুঁজুন ও বিড করুন"}
                        </p>
                      </a>

                      {onOpenMyBids && (
                        <button
                          onClick={() => {
                            setActiveDropdown(null);
                            onOpenMyBids();
                          }}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                                {lang === "en" ? "My Submitted Bids" : "আমার জমা দেওয়া বিড"}
                              </p>
                            </div>
                            {myBidsCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                {myBidsCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 pl-6">
                            {lang === "en"
                              ? "Track proposal statuses, interview invites & accepted contracts"
                              : "জমা দেওয়া প্রস্তাবনা ও ক্লায়েন্টের প্রতিক্রিয়া ট্র্যাক করুন"}
                          </p>
                        </button>
                      )}

                      <Link
                        href="/dashboard/freelancer"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "Freelancer Dashboard" : "ফ্রিল্যান্সার ড্যাশবোর্ড"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Manage your active contracts, profile strength & bKash payouts"
                            : "চলমান চুক্তি, ওয়ালেট আয় ও বিকাশ ক্যাশআউট পরিচালনা করুন"}
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Why MuktoKormo Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("why")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "why" ? null : "why")}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg hover:text-emerald-700 transition-colors cursor-pointer ${
                    activeDropdown === "why" ? "text-emerald-700" : ""
                  }`}
                >
                  <span>{lang === "en" ? "Why MuktoKormo" : "কেন মুক্তকর্ম"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === "why" ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "why" && (
                  <div className="absolute top-full left-0 w-80 pt-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-1">
                      <a
                        href="/#escrow-section"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "100% BDT Escrow Protection" : "১০০% নিরাপদ বিডিটি এসক্রো"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Safe deposits via bKash & Nagad. Release funds only when work is approved"
                            : "বিকাশ ও নগদে সুরক্ষিত তহবিল। কাজ অনুমোদনের পরেই পেমেন্ট ছাড়"}
                        </p>
                      </a>

                      <Link
                        href="/contracts"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Handshake className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "Contract Delivery Workspaces" : "কন্ট্রাক্ট ডেলিভারি ওয়ার্কস্পেস"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Submit deliverables, demo URLs, and audit activity logs"
                            : "মাইলস্টোন ডেলিভারি জমা দিন, রিভিশন রিভিউ ও ট্র্যাকিং করুন"}
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Workspaces Link (Clean plain text, no loud buttons) */}
              <Link
                href="/contracts"
                className="px-3 py-2 rounded-lg hover:text-emerald-700 transition-colors"
              >
                <span>{lang === "en" ? "Workspaces" : "কন্ট্রাক্ট"}</span>
              </Link>
            </nav>
          </div>

          {/* Right: Clean, Upwork-style Actions */}
          <div className="hidden sm:flex items-center gap-4">
            
            {/* Upwork Search Bar */}
            <div className="hidden xl:flex items-center relative w-52 2xl:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={lang === "en" ? "Search" : "অনুসন্ধান"}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-full text-xs font-medium focus:outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>

            {/* Language Toggle (Clean minimal text) */}
            <button
              onClick={onToggleLang}
              className="text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer px-1 py-1"
            >
              {lang === "en" ? "বাংলা" : "English"}
            </button>

            {/* Log In */}
            <Link
              href="/login"
              className="text-xs font-bold text-slate-800 hover:text-emerald-600 px-2 py-1.5 transition-colors cursor-pointer"
            >
              <span>{lang === "en" ? "Log In" : "লগইন"}</span>
            </Link>

            {/* Sign Up (Upwork signature green pill button) */}
            <Link
              href="/signup"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-5 py-2 rounded-full transition-all cursor-pointer shadow-xs"
            >
              <span>{lang === "en" ? "Sign Up" : "সাইন আপ"}</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenPostJob}
              className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-full text-xs"
            >
              Post Job
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-200 px-5 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <button
              onClick={onToggleLang}
              className="text-xs font-semibold text-slate-700"
            >
              {lang === "en" ? "বাংলা ভার্সন" : "English Version"}
            </button>
            <button
              onClick={onToggleRole}
              className="text-xs font-bold text-emerald-600"
            >
              {role === "client" ? "Employer Mode" : "Talent Mode"}
            </button>
          </div>

          <div className="space-y-2.5 text-xs font-semibold text-slate-700">
            <a
              href="/#jobs-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-emerald-600"
            >
              {lang === "en" ? "Find Work" : "কাজ খুঁজুন"}
            </a>
            <a
              href="/#freelancers-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-emerald-600"
            >
              {lang === "en" ? "Hire Talent" : "ট্যালেন্ট খুঁজুন"}
            </a>
            <Link
              href="/contracts"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-emerald-600"
            >
              {lang === "en" ? "Contract Workspaces" : "কন্ট্রাক্ট ওয়ার্কস্পেস"}
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-emerald-700 font-bold"
            >
              {lang === "en" ? "Dedicated Dashboards" : "ড্যাশবোর্ড পোর্টাল"}
            </Link>
            {onOpenMyBids && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMyBids();
                }}
                className="w-full text-left py-1 text-slate-700 hover:text-emerald-600 flex items-center justify-between"
              >
                <span>{lang === "en" ? "My Bids" : "আমার বিড"}</span>
                {myBidsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    {myBidsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 text-xs font-bold text-slate-800 border border-slate-200 rounded-full hover:bg-slate-50"
            >
              {lang === "en" ? "Log In" : "লগইন"}
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 text-xs font-bold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 shadow-xs"
            >
              {lang === "en" ? "Sign Up" : "সাইন আপ"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
