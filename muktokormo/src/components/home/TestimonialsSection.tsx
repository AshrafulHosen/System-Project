"use client";

import React from "react";
import { Quote, ShieldCheck } from "lucide-react";

interface TestimonialsSectionProps {
  lang: "en" | "bn";
}

export default function TestimonialsSection({ lang }: TestimonialsSectionProps) {
  const quotes = [
    {
      quote:
        lang === "en"
          ? "Moving our e-commerce engineering sprints onto MuktoKormo cut out international card hassle completely. Locking milestones in BDT gave both our finance team and developers clear accountability."
          : "আমাদের ই-কমার্স ডেভেলপমেন্ট স্প্রিন্ট মুক্তকর্মে নেওয়ার পর বিদেশি কার্ডের ঝামেলা একদম কমে গেছে। বিডিটি মাইলস্টোন এসক্রোতে কাজ অনেক সহজ হয়েছে।",
      author: "Tanvir Rahman",
      role: lang === "en" ? "Operations Lead, Dhanmondi Commerce" : "অপারেশনস লিড, ঢাকা",
      badge: lang === "en" ? "Verified Client" : "যাচাইকৃত ক্লায়েন্ট",
    },
    {
      quote:
        lang === "en"
          ? "I used to lose nearly 8% on international payout conversion and wire delays. Having BDT milestone escrow funded upfront via local channels lets me focus purely on delivering clean code."
          : "আগে ডলার কনভার্সন ও ব্যাংক ডিলেতে অনেক ক্ষতি হতো। এখন কাজ শুরুর আগেই এসক্রো ফান্ড দেখে নিশ্চিন্তে কোডিংয়ে মনোযোগ দিতে পারি।",
      author: "Nusrat Jahan",
      role: lang === "en" ? "Senior Full-Stack Engineer, Chattogram" : "সিনিয়র ফুল-স্ট্যাক ইঞ্জিনিয়ার, চট্টগ্রাম",
      badge: lang === "en" ? "NID Verified Pro" : "ভেরিফাইড ফ্রিল্যান্সার",
    },
    {
      quote:
        lang === "en"
          ? "The shared workspace with live demo links and revision audit history replaced dozens of scattered WhatsApp screenshots. Approving design handoffs now takes seconds."
          : "লাইভ ডেমো লিংক ও রিভিশন হিস্ট্রি এক জায়গায় থাকায় হোয়াটসঅ্যাপে স্ক্রিনশট খোঁজার ঝামেলা আর নেই।",
      author: "Farhan Karim",
      role: lang === "en" ? "Product Founder, Banani Tech Studio" : "প্রোডাক্ট ফাউন্ডার, বনানী",
      badge: lang === "en" ? "Verified Client" : "যাচাইকৃত ক্লায়েন্ট",
    },
  ];

  return (
    <section className="py-20 bg-[#F4F2EC]/70 border-t border-[rgba(17,19,21,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F6E50] block mb-1.5">
            {lang === "en" ? "Community Perspectives" : "ব্যবহারকারীদের অভিজ্ঞতা"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111315]">
            {lang === "en"
              ? "Trusted by growing businesses and independent specialists"
              : "উদ্যোক্তা ও স্বাধীন পেশাজীবীদের আস্থার প্রতীক"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((item) => (
            <div
              key={item.author}
              className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-7 flex flex-col justify-between shadow-[0_1px_2px_rgba(17,19,21,0.03)]"
            >
              <div>
                <Quote className="w-6 h-6 text-[#0F6E50]/35 mb-4" />
                <p className="text-xs sm:text-[13px] text-[#3E434A] leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[rgba(17,19,21,0.07)] flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#111315]">{item.author}</p>
                  <p className="text-[11px] text-[#686E78]">{item.role}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5] text-[10px] font-semibold shrink-0">
                  <ShieldCheck className="w-3 h-3 text-[#0F6E50]" />
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

