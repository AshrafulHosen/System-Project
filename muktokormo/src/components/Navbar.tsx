"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, Menu, X, Globe, ChevronDown, ShieldCheck, User } from "lucide-react";
import Logo from "./Logo";

interface NavbarProps {
  onOpenPostJob: () => void;
  lang: "en" | "bn";
  onToggleLang: () => void;
  role: "client" | "freelancer";
  onToggleRole: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function Navbar({
  onOpenPostJob,
  lang,
  onToggleLang,
  role,
  onToggleRole,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Brand + Upwork-style Nav Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="cursor-pointer group">
              <Logo size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
              <a href="#jobs-section" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                <span>{lang === "en" ? "Find Work" : "কাজ খুঁজুন"}</span>
              </a>
              <a href="#freelancers-section" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                <span>{lang === "en" ? "Hire Talent" : "ট্যালেন্ট খুঁজুন"}</span>
              </a>
              <a href="#escrow-section" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === "en" ? "BDT Escrow" : "নিরাপদ এসক্রো"}</span>
              </a>
            </nav>
          </div>

          {/* Right: Fiverr/Upwork Action Controls */}
          <div className="hidden sm:flex items-center gap-4">
            
            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

            <button
              onClick={onToggleRole}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {role === "client" 
                ? (lang === "en" ? "Switch to Freelancer" : "ফ্রিল্যান্সার মোড") 
                : (lang === "en" ? "Switch to Employer" : "নিয়োগদাতা মোড")}
            </button>

            {/* Log In Link */}
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-emerald-600 px-2 py-2 transition-colors cursor-pointer"
            >
              <span>{lang === "en" ? "Log In" : "লগইন"}</span>
            </Link>

            {/* Sign Up Link */}
            <Link
              href="/signup"
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <span>{lang === "en" ? "Sign Up" : "রেজিস্ট্রেশন"}</span>
            </Link>

            {/* Post Job / Join CTA */}
            <button
              onClick={onOpenPostJob}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{lang === "en" ? "Post a Job (Free)" : "কাজ পোস্ট করুন"}</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenPostJob}
              className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
            >
              + Post
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-lg">
          <div className="flex justify-between items-center pt-1">
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
              {role === "client" ? "Employer" : "Freelancer"}
            </button>
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <a href="#jobs-section" className="text-xs font-semibold text-slate-700">Browse Jobs</a>
            <a href="#freelancers-section" className="text-xs font-semibold text-slate-700">Find Freelancers</a>
            <a href="#escrow-section" className="text-xs font-semibold text-slate-700">Escrow Guarantee</a>
          </div>
        </div>
      )}
    </header>
  );
}
