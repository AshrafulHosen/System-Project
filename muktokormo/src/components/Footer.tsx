"use client";

import React from "react";
import { ShieldCheck, Heart } from "lucide-react";
import Logo from "./Logo";

interface FooterProps {
  lang: "en" | "bn";
}

export default function Footer({ lang }: FooterProps) {
  return (
    <footer className="bg-slate-50 text-slate-500 border-t border-slate-200/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200">
          
          {/* Brand Col */}
          <div className="space-y-3.5 md:col-span-1">
            <Logo size="sm" />

            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === "en"
                ? "The dedicated freelance marketplace platform for Bangladesh. Connecting local enterprises with verified talent through secure BDT escrow."
                : "বাংলাদেশের নিজস্ব ফ্রিল্যান্স মার্কেটপ্লেস। দেশীয় ব্যবসা প্রতিষ্ঠান ও দক্ষ মুক্তপেশাজীবীদের মধ্যে বিশ্বস্ত সেতুবন্ধন।"}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{lang === "en" ? "Porichoy NID & MFS Compliant" : "পরিচয় ও এনআইডি দ্বারা সুরক্ষিত"}</span>
            </div>
          </div>

          {/* Col 2: For Clients */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {lang === "en" ? "For Clients" : "নিয়োগদাতাদের জন্য"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#jobs-section" className="hover:text-sky-600 transition-colors">{lang === "en" ? "How to Hire" : "কীভাবে নিয়োগ দেবেন"}</a></li>
              <li><a href="#freelancers-section" className="hover:text-sky-600 transition-colors">{lang === "en" ? "Browse Freelancers" : "ফ্রিল্যান্সার খুঁজুন"}</a></li>
              <li><a href="#escrow-section" className="hover:text-sky-600 transition-colors">{lang === "en" ? "BDT Escrow Protection" : "এসক্রো পলিসি"}</a></li>
            </ul>
          </div>

          {/* Col 3: For Talent */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {lang === "en" ? "For Freelancers" : "ফ্রিল্যান্সারদের জন্য"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#jobs-section" className="hover:text-sky-600 transition-colors">{lang === "en" ? "Browse Open Jobs" : "কাজের তালিকা"}</a></li>
              <li><a href="#" className="hover:text-sky-600 transition-colors">{lang === "en" ? "Flat 7% Fee Breakdown" : "মাত্র ৭% ফি কাঠামো"}</a></li>
              <li><a href="#" className="hover:text-sky-600 transition-colors">{lang === "en" ? "bKash & Nagad Payouts" : "বিকাশ ও নগদ উইথড্রয়াল"}</a></li>
            </ul>
          </div>

          {/* Col 4: Payment Badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {lang === "en" ? "Supported Payment Channels" : "সমর্থিত পেমেন্ট মাধ্যম"}
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-pink-600">bKash</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-orange-600">Nagad</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-purple-600">Rocket</span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-sky-600">Bank (NPSB)</span>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 MuktoKormo Technologies Ltd. Dhaka, Bangladesh.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for Bangladesh's independent talent</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
