"use client";

import React from "react";

interface TestimonialsSectionProps {
  lang: "en" | "bn";
}

/**
 * Platform commitments.
 *
 * This section previously showed testimonials attributed to named people
 * without any backing data. Until real, consented reviews exist, it states
 * what the platform guarantees to each side instead — no invented identities.
 */
export default function TestimonialsSection({ lang }: TestimonialsSectionProps) {
  const en = lang === "en";

  const commitments = [
    {
      audience: en ? "To clients" : "ক্লায়েন্টদের প্রতি",
      statement: en
        ? "Your money stays in escrow until you approve the delivered work."
        : "কাজ অনুমোদন না করা পর্যন্ত আপনার টাকা এসক্রোতেই থাকবে।",
      detail: en
        ? "Request revisions with feedback on record before anything is released."
        : "রিলিজের আগে মতামতসহ রিভিশন চাইতে পারবেন।",
    },
    {
      audience: en ? "To freelancers" : "ফ্রিল্যান্সারদের প্রতি",
      statement: en
        ? "You start only after the contract is funded — never on a promise."
        : "চুক্তি ফান্ডেড হওয়ার পরেই কাজ শুরু—শুধু প্রতিশ্রুতিতে নয়।",
      detail: en
        ? "See your net payout in Taka before you submit a proposal."
        : "প্রস্তাব পাঠানোর আগেই টাকায় আপনার নিট আয় দেখুন।",
    },
    {
      audience: en ? "To both" : "উভয়ের প্রতি",
      statement: en
        ? "Every payment, submission and decision is written to a shared record."
        : "প্রতিটি পেমেন্ট, জমা ও সিদ্ধান্ত একটি যৌথ রেকর্ডে সংরক্ষিত।",
      detail: en
        ? "Refund requests and disputes are reviewed against the ledger, not screenshots."
        : "রিফান্ড ও বিরোধ যাচাই হয় লেজার দেখে, স্ক্রিনশট দেখে নয়।",
    },
  ];

  return (
    <section id="commitments" className="py-20 sm:py-24 bg-white border-t border-line">
      <div className="mk-container">
        <div className="max-w-2xl mb-12 lg:mb-14">
          <span className="mk-eyebrow text-brand">{en ? "Our commitments" : "আমাদের প্রতিশ্রুতি"}</span>
          <h2 className="mk-h2 mt-4 text-ink">
            {en ? "Promises written into the product." : "প্রতিশ্রুতি, যা প্রোডাক্টেই লেখা।"}
          </h2>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden">
          {commitments.map((c, idx) => (
            <li
              key={c.audience}
              className={`p-7 sm:p-9 flex flex-col justify-between gap-10 min-h-[280px] ${
                idx === 1 ? "bg-navy text-white" : "bg-white"
              }`}
            >
              <blockquote
                className={`text-xl sm:text-2xl font-medium tracking-[-0.025em] leading-[1.3] ${
                  idx === 1 ? "text-white" : "text-ink"
                }`}
              >
                {c.statement}
              </blockquote>
              <div className={`pt-5 border-t ${idx === 1 ? "border-white/15" : "border-line"}`}>
                <p className={`mk-eyebrow ${idx === 1 ? "text-brand-light" : "text-brand"}`}>{c.audience}</p>
                <p className={`mt-2 text-[14px] leading-relaxed ${idx === 1 ? "text-white/65" : "text-ink-3"}`}>
                  {c.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
