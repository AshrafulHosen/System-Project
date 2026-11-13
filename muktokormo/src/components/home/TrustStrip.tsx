"use client";

import React from "react";
import { Lock, BadgeCheck, FileSignature, MessagesSquare } from "lucide-react";

interface TrustStripProps {
  lang: "en" | "bn";
}

/** Horizontal credibility band directly under the hero — product facts only. */
export default function TrustStrip({ lang }: TrustStripProps) {
  const en = lang === "en";
  const items = [
    {
      icon: Lock,
      title: en ? "Escrow-held payments" : "এসক্রো-সুরক্ষিত পেমেন্ট",
      desc: en ? "Funds lock before work starts" : "কাজ শুরুর আগেই ফান্ড লক",
    },
    {
      icon: BadgeCheck,
      title: en ? "NID-verified identities" : "এনআইডি-যাচাইকৃত পরিচয়",
      desc: en ? "Porichoy checks for both sides" : "উভয় পক্ষের পরিচয় যাচাই",
    },
    {
      icon: FileSignature,
      title: en ? "Structured contracts" : "সুগঠিত চুক্তি",
      desc: en ? "Submissions, revisions, approvals" : "জমা, রিভিশন ও অনুমোদন",
    },
    {
      icon: MessagesSquare,
      title: en ? "Real-time workspace" : "রিয়েল-টাইম ওয়ার্কস্পেস",
      desc: en ? "Chat beside every contract" : "প্রতিটি চুক্তির পাশে চ্যাট",
    },
  ];

  const rails = ["bKash", "Nagad", "Rocket", "Cards", "SSLCOMMERZ"];

  return (
    <section aria-label={en ? "Why you can trust Muktokormo" : "আস্থার কারণ"} className="bg-white border-y border-line">
      <div className="mk-container">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border-x border-line">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li
                key={it.title}
                className="flex items-start gap-3 bg-white px-4 sm:px-6 py-5 lg:py-7"
              >
                <span className="w-9 h-9 rounded-md bg-subtle text-navy flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-ink tracking-[-0.015em]">
                    {it.title}
                  </span>
                  <span className="block text-[13px] text-ink-3 mt-0.5">{it.desc}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="border-t border-line bg-canvas">
        <div className="mk-container py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="mk-eyebrow text-ink-4">{en ? "Settle in BDT via" : "টাকায় লেনদেন"}</span>
          {rails.map((r) => (
            <span key={r} className="text-[13px] font-semibold text-ink-3 tracking-[-0.01em]">
              {r}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
