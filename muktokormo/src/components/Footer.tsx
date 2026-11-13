"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import Logo from "./Logo";

interface FooterProps {
  lang: "en" | "bn";
}

export default function Footer({ lang }: FooterProps) {
  const en = lang === "en";

  const columns = [
    {
      title: en ? "For clients" : "নিয়োগদাতাদের জন্য",
      links: [
        { href: "/post-job", label: en ? "Post a project" : "কাজ পোস্ট করুন" },
        { href: "/#freelancers-section", label: en ? "Browse verified talent" : "ফ্রিল্যান্সার খুঁজুন" },
        { href: "/dashboard/client", label: en ? "Client dashboard" : "ক্লায়েন্ট ড্যাশবোর্ড" },
        { href: "/contracts", label: en ? "Contracts" : "চুক্তিসমূহ" },
      ],
    },
    {
      title: en ? "For freelancers" : "ফ্রিল্যান্সারদের জন্য",
      links: [
        { href: "/#jobs-section", label: en ? "Explore open jobs" : "চলমান কাজসমূহ" },
        { href: "/signup", label: en ? "Create a profile" : "প্রোফাইল খুলুন", external: true },
        { href: "/dashboard/freelancer", label: en ? "Freelancer dashboard" : "ফ্রিল্যান্সার ড্যাশবোর্ড" },
        { href: "/workspaces", label: en ? "Delivery workspaces" : "ওয়ার্কস্পেস" },
      ],
    },
    {
      title: en ? "Platform" : "প্ল্যাটফর্ম",
      links: [
        { href: "/how-it-works", label: en ? "How it works" : "কার্যপদ্ধতি" },
        { href: "/escrow", label: en ? "Escrow & payouts" : "এসক্রো ও পেমেন্ট" },
        { href: "/messages", label: en ? "Messages" : "মেসেজ" },
        { href: "/login", label: en ? "Log in" : "লগইন" },
      ],
    },
  ];

  return (
    <footer className="relative bg-navy-ink text-white/70 overflow-hidden">
      <div className="mk-container pt-16 sm:pt-20">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-12 pb-14">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4 space-y-5">
            <Logo size="md" inverted />
            <p className="text-[14px] text-white/60 leading-relaxed max-w-sm">
              {en
                ? "Bangladesh's freelance marketplace with BDT escrow — connecting businesses with NID-verified talent through structured, milestone-based delivery."
                : "বাংলাদেশের নিজস্ব আধুনিক ফ্রিল্যান্স মার্কেটপ্লেস। দেশীয় প্রতিষ্ঠান ও এনআইডি-ভেরিফাইড দক্ষ মুক্তপেশাজীবীদের মধ্যে নিরাপদ বিডিটি এসক্রো সেতুবন্ধন।"}
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="lg:col-span-2">
              <h2 className="mk-eyebrow text-white/40">{col.title}</h2>
              <ul className="mt-4 space-y-3 text-[14px]">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-white/75 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      {l.label}
                      {"external" in l && l.external && (
                        <ArrowUpRight className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 lg:col-span-2">
            <h2 className="mk-eyebrow text-white/40">{en ? "Settlement rails" : "পেমেন্ট মাধ্যম"}</h2>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {["bKash", "Nagad", "Rocket", "NPSB Bank", "SSLCOMMERZ"].map((rail) => (
                <li
                  key={rail}
                  className="px-2 py-1 rounded-md bg-white/6 border border-white/10 text-[12px] font-medium text-white/80"
                >
                  {rail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Signature wordmark */}
      <div aria-hidden="true" className="mk-container select-none">
        <p className="font-semibold tracking-[-0.06em] leading-[0.78] text-[22vw] lg:text-[17rem] text-white/[0.05] whitespace-nowrap -mb-[0.06em]">
          muktokormo
        </p>
      </div>

      <div className="border-t border-white/10">
        <div className="mk-container py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px] text-white/45">
          <p>© 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. Dhaka, Bangladesh.</p>
          <p className="inline-flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
            {en
              ? "Work beautifully. Build confidently."
              : "সুন্দরভাবে কাজ করুন। আত্মবিশ্বাসের সাথে গড়ুন।"}
          </p>
        </div>
      </div>
    </footer>
  );
}
