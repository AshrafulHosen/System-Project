"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, ShieldCheck, Wallet, RotateCcw, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import HeroFlowStudio from "@/components/home/HeroFlowStudio";
import { WorkStatusBadge } from "@/components/ui";
import { DEFAULT_PLATFORM_FEE_PCT } from "@/lib/payments/constants";

const EXAMPLE_CONTRACT = 45000;
const fmt = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

export default function HowItWorksPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [searchQuery, setSearchQuery] = useState("");
  const en = lang === "en";

  const fee = Math.round(EXAMPLE_CONTRACT * (DEFAULT_PLATFORM_FEE_PCT / 100));
  const net = EXAMPLE_CONTRACT - fee;

  // Real work statuses from the contract workflow, in lifecycle order.
  const workStatuses = [
    { key: "NOT_STARTED", en: "Contract exists but escrow is not funded yet. Work cannot start.", bn: "চুক্তি তৈরি হয়েছে, কিন্তু এসক্রো এখনো ফান্ড হয়নি। কাজ শুরু করা যাবে না।" },
    { key: "FUNDED", en: "The client has paid into escrow. The freelancer can start work.", bn: "ক্লায়েন্ট এসক্রোতে টাকা জমা দিয়েছেন। ফ্রিল্যান্সার কাজ শুরু করতে পারেন।" },
    { key: "IN_PROGRESS", en: "The freelancer has started and is working in the shared workspace.", bn: "ফ্রিল্যান্সার কাজ শুরু করেছেন এবং ওয়ার্কস্পেসে কাজ করছেন।" },
    { key: "SUBMITTED", en: "Work is delivered — staging links, files or repositories — and waiting for review.", bn: "কাজ জমা দেওয়া হয়েছে এবং রিভিউর অপেক্ষায়।" },
    { key: "REVISION_REQUESTED", en: "The client asked for changes. Feedback is recorded on the contract.", bn: "ক্লায়েন্ট পরিবর্তন চেয়েছেন। মতামত চুক্তিতে সংরক্ষিত।" },
    { key: "APPROVED", en: "The client accepted the delivery.", bn: "ক্লায়েন্ট কাজ গ্রহণ করেছেন।" },
    { key: "RELEASED", en: "Escrow is released to the freelancer, minus the platform fee.", bn: "প্ল্যাটফর্ম ফি বাদে এসক্রো ফ্রিল্যান্সারকে রিলিজ করা হয়েছে।" },
  ];

  const faqs = [
    {
      q: en ? "When can a freelancer start working?" : "ফ্রিল্যান্সার কখন কাজ শুরু করতে পারেন?",
      a: en
        ? "Only after the client has funded the contract in escrow. Until then the contract stays in “Not started” and work cannot begin."
        : "ক্লায়েন্ট এসক্রোতে চুক্তি ফান্ড করার পরেই। তার আগে চুক্তি “শুরু হয়নি” অবস্থায় থাকে।",
    },
    {
      q: en ? "What if I'm not happy with the delivered work?" : "জমা দেওয়া কাজ পছন্দ না হলে কী করব?",
      a: en
        ? "Request a revision from the contract workspace. Your feedback is saved on the contract, and the money stays in escrow until you approve."
        : "চুক্তির ওয়ার্কস্পেস থেকে রিভিশন চান। আপনার মতামত সংরক্ষিত থাকে এবং অনুমোদন না করা পর্যন্ত টাকা এসক্রোতেই থাকে।",
    },
    {
      q: en ? "How do I pay into escrow?" : "এসক্রোতে কীভাবে টাকা দেব?",
      a: en
        ? "Through SSLCOMMERZ checkout — bKash, Nagad, Rocket, or a bank card. Everything is in Bangladeshi Taka, so there is no currency conversion."
        : "এসএসএলকমার্জ চেকআউটের মাধ্যমে — বিকাশ, নগদ, রকেট বা ব্যাংক কার্ড। সবকিছু টাকায়, তাই কোনো কারেন্সি কনভার্সন নেই।",
    },
    {
      q: en ? "Who pays the platform fee?" : "প্ল্যাটফর্ম ফি কে দেন?",
      a: en
        ? `The fee is ${DEFAULT_PLATFORM_FEE_PCT}% of the contract amount and is deducted when escrow is released. The client funds the contract amount; the freelancer receives the amount minus the fee.`
        : `ফি চুক্তির ${DEFAULT_PLATFORM_FEE_PCT}% এবং এসক্রো রিলিজের সময় কাটা হয়। ক্লায়েন্ট চুক্তির পরিমাণ জমা দেন; ফ্রিল্যান্সার ফি বাদে বাকি টাকা পান।`,
    },
    {
      q: en ? "Can I get a refund?" : "রিফান্ড পাওয়া যায়?",
      a: en
        ? "Clients can submit a refund request on a funded contract. Requests are reviewed by the Muktokormo team against the contract's escrow ledger."
        : "ফান্ডেড চুক্তিতে ক্লায়েন্ট রিফান্ডের অনুরোধ করতে পারেন। মুক্তকর্ম টিম চুক্তির এসক্রো লেজার দেখে অনুরোধ যাচাই করে।",
    },
    {
      q: en ? "Where do client and freelancer talk?" : "ক্লায়েন্ট ও ফ্রিল্যান্সার কোথায় কথা বলেন?",
      a: en
        ? "Inside the contract workspace, which includes real-time messaging next to the submissions and payment status."
        : "চুক্তির ওয়ার্কস্পেসে, যেখানে কাজ জমা ও পেমেন্টের পাশেই রিয়েল-টাইম মেসেজিং আছে।",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <Navbar
        onOpenPostJob={() => router.push("/post-job")}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === "en" ? "bn" : "en"))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        {/* ---------- Page hero ---------- */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 mk-grid-lines [mask-image:linear-gradient(to_bottom,black,transparent_90%)] pointer-events-none" />
          <div className="relative mk-container pt-14 pb-12 sm:pt-20 sm:pb-16">
            <nav aria-label="Breadcrumb" className="text-[13px] text-ink-4 mk-fade-up">
              <Link href="/" className="hover:text-ink">{en ? "Home" : "হোম"}</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-ink" aria-current="page">{en ? "How it works" : "কার্যপদ্ধতি"}</span>
            </nav>
            <h1 className="mk-display mt-6 text-ink max-w-[16ch] mk-fade-up mk-delay-1">
              {en ? (
                <>
                  From brief to payout,{" "}
                  <span className="text-brand">every step protected.</span>
                </>
              ) : (
                <>
                  ব্রিফ থেকে পেমেন্ট,{" "}
                  <span className="text-brand">প্রতিটি ধাপ সুরক্ষিত।</span>
                </>
              )}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-ink-3 leading-relaxed max-w-2xl mk-fade-up mk-delay-2">
              {en
                ? "Muktokormo connects clients and freelancers through one structured workflow: proposals become contracts, contracts are funded in escrow, and money is released only when the work is approved."
                : "মুক্তকর্ম একটি সুগঠিত প্রক্রিয়ায় ক্লায়েন্ট ও ফ্রিল্যান্সারকে যুক্ত করে: প্রস্তাব থেকে চুক্তি, চুক্তি এসক্রোতে ফান্ড, আর কাজ অনুমোদনের পরেই টাকা রিলিজ।"}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 mk-fade-up mk-delay-3">
              <a href="#steps" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-ink hover:bg-ink-hover text-white text-sm font-medium transition-colors">
                {en ? "See the steps" : "ধাপগুলো দেখুন"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a href="#escrow" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-white hover:bg-subtle border border-line-strong text-ink text-sm font-medium transition-colors">
                {en ? "How escrow works" : "এসক্রো যেভাবে কাজ করে"}
              </a>
            </div>

            {/* Quick pillars */}
            <ul className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
              {[
                { icon: Lock, t: en ? "Funded before work starts" : "কাজের আগেই ফান্ড", d: en ? "Escrow is paid up front." : "এসক্রোতে আগেই জমা।" },
                { icon: RotateCcw, t: en ? "Revisions on record" : "রিভিশন সংরক্ষিত", d: en ? "Feedback stays with the contract." : "মতামত চুক্তির সাথে থাকে।" },
                { icon: Wallet, t: en ? "Released on approval" : "অনুমোদনে রিলিজ", d: en ? `${DEFAULT_PLATFORM_FEE_PCT}% fee, paid in Taka.` : `${DEFAULT_PLATFORM_FEE_PCT}% ফি, টাকায়।` },
              ].map((p) => (
                <li key={p.t} className="bg-white p-5 sm:p-6 flex items-start gap-3">
                  <span className="w-9 h-9 rounded-md bg-subtle text-navy flex items-center justify-center shrink-0">
                    <p.icon className="w-4.5 h-4.5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">{p.t}</span>
                    <span className="block text-[13px] text-ink-3 mt-0.5">{p.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Steps by role ---------- */}
        <div id="steps" className="scroll-mt-20">
          <HowItWorksSection lang={lang} />
        </div>

        {/* ---------- Escrow, animated ---------- */}
        <section id="escrow" className="py-20 sm:py-24 bg-canvas scroll-mt-20">
          <div className="mk-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-5">
              <span className="mk-eyebrow text-brand">{en ? "Escrow" : "এসক্রো"}</span>
              <h2 className="mk-h2 mt-4 text-ink">{en ? "Watch the money move." : "টাকা কীভাবে চলে দেখুন।"}</h2>
              <p className="mt-5 text-[15px] sm:text-base text-ink-3 leading-relaxed">
                {en
                  ? "The money never goes straight from client to freelancer. It sits in escrow while the work happens, and is released only after the client approves the delivery."
                  : "টাকা সরাসরি ক্লায়েন্ট থেকে ফ্রিল্যান্সারের কাছে যায় না। কাজ চলাকালীন এটি এসক্রোতে থাকে এবং ক্লায়েন্ট অনুমোদন দিলেই রিলিজ হয়।"}
              </p>

              {/* Worked fee example */}
              <dl className="mt-8 bg-white border border-line rounded-xl divide-y divide-line">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <dt className="text-[14px] text-ink-2">{en ? "Client funds the contract" : "ক্লায়েন্টের জমা"}</dt>
                  <dd className="text-[15px] font-semibold mk-tabular">{fmt(EXAMPLE_CONTRACT)}</dd>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <dt className="text-[14px] text-ink-2">
                    {en ? `Platform fee (${DEFAULT_PLATFORM_FEE_PCT}%)` : `প্ল্যাটফর্ম ফি (${DEFAULT_PLATFORM_FEE_PCT}%)`}
                  </dt>
                  <dd className="text-[15px] font-semibold mk-tabular text-ink-3">−{fmt(fee)}</dd>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 bg-success-soft/60 rounded-b-xl">
                  <dt className="text-[14px] font-medium text-ink">{en ? "Freelancer receives" : "ফ্রিল্যান্সার পান"}</dt>
                  <dd className="text-[17px] font-semibold mk-tabular text-success">{fmt(net)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[12px] text-ink-4">{en ? "Example amounts." : "উদাহরণস্বরূপ পরিমাণ।"}</p>
            </div>
            <div className="lg:col-span-7">
              <HeroFlowStudio en={en} />
            </div>
          </div>
        </section>

        {/* ---------- Contract statuses ---------- */}
        <section id="statuses" className="py-20 sm:py-24 bg-white border-y border-line">
          <div className="mk-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <span className="mk-eyebrow text-brand">{en ? "Contract statuses" : "চুক্তির অবস্থা"}</span>
              <h2 className="mk-h2 mt-4 text-ink">{en ? "Always know where things stand." : "সবসময় জানুন কাজ কোথায়।"}</h2>
              <p className="mt-5 text-[15px] text-ink-3 leading-relaxed">
                {en
                  ? "These are the statuses you'll see on every contract, in the order they usually happen."
                  : "প্রতিটি চুক্তিতে এই অবস্থাগুলো দেখবেন, সাধারণত এই ক্রমে।"}
              </p>
            </div>
            <ol className="lg:col-span-8 relative">
              <span aria-hidden="true" className="absolute left-[15px] top-3 bottom-3 w-px bg-line-strong" />
              {workStatuses.map((s, i) => (
                <li key={s.key} className="relative grid grid-cols-[32px_1fr] gap-4 pb-6 last:pb-0">
                  <span className="relative z-10 w-8 h-8 rounded-md bg-white border border-line-strong text-[12px] font-mono text-ink-3 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <WorkStatusBadge status={s.key} lang={lang} />
                    <p className="mt-2 text-[14px] text-ink-2 leading-relaxed">{en ? s.en : s.bn}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="py-20 sm:py-24 bg-canvas">
          <div className="mk-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <span className="mk-eyebrow text-brand">FAQ</span>
              <h2 className="mk-h2 mt-4 text-ink">{en ? "Common questions." : "সাধারণ প্রশ্ন।"}</h2>
            </div>
            <div className="lg:col-span-8 border-t border-line-strong">
              {faqs.map((f) => (
                <details key={f.q} className="group border-b border-line-strong">
                  <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-ink">{f.q}</span>
                    <span className="w-8 h-8 rounded-md border border-line-strong flex items-center justify-center shrink-0 text-ink-2 group-open:bg-ink group-open:text-white group-open:border-ink transition-colors">
                      <Plus className="w-4 h-4 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="pb-6 pr-12 text-[15px] text-ink-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="bg-canvas pb-20 sm:pb-24">
          <div className="mk-container">
            <div className="relative overflow-hidden rounded-3xl bg-brand text-white px-6 py-12 sm:px-12 sm:py-16">
              <div aria-hidden="true" className="absolute inset-0 mk-hatch-dark opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
              <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                  <ShieldCheck className="w-8 h-8 text-white/80" aria-hidden="true" />
                  <h2 className="mk-h2 mt-5 text-white max-w-[18ch]">{en ? "Ready to start?" : "শুরু করতে প্রস্তুত?"}</h2>
                  <p className="mt-4 text-base text-white/80 max-w-lg">
                    {en
                      ? "Post a project to hire, or create a profile to start bidding on open work."
                      : "নিয়োগ দিতে কাজ পোস্ট করুন, অথবা কাজে বিড করতে প্রোফাইল খুলুন।"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/post-job" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-white hover:bg-brand-soft text-navy font-medium text-[15px] transition-colors">
                    {en ? "Post a project" : "কাজ পোস্ট করুন"}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <Link href="/#jobs-section" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-navy/40 hover:bg-navy/60 border border-white/25 text-white font-medium text-[15px] transition-colors">
                    {en ? "Browse open jobs" : "চলমান কাজ দেখুন"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
