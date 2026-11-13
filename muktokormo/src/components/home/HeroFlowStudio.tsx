"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Building2,
  Lock,
  UserRound,
  FileText,
  Handshake,
  ShieldCheck,
  Send,
  BadgeCheck,
  Check,
} from "lucide-react";
import { DEFAULT_PLATFORM_FEE_PCT } from "@/lib/payments/constants";

/* ------------------------------------------------------------------ */
/* Illustrative escrow flow — one contract moving through Muktokormo.  */
/* Amounts use the real platform fee so the example is never wrong.    */
/* ------------------------------------------------------------------ */

const BUDGET = 48000;
const BID = 45000;
const FEE = Math.round(BID * (DEFAULT_PLATFORM_FEE_PCT / 100));
const NET = BID - FEE;
const STAGE_MS = 2800;

type Stage = 0 | 1 | 2 | 3 | 4;

const fmt = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

/** prefers-reduced-motion as an external store (no setState-in-effect). */
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** Tweens a number towards `target` with requestAnimationFrame. */
function useTween(target: number, duration = 700, instant = false) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (instant || from === target) {
      fromRef.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      fromRef.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, instant]);

  return value;
}

export default function HeroFlowStudio({ en }: { en: boolean }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance the story; reduced-motion users see the completed state.
  const shownStage: Stage = reduced ? 4 : stage;
  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setStage((s) => ((s + 1) % 5) as Stage);
    }, STAGE_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  const stages = [
    { icon: FileText, label: en ? "Brief posted" : "ব্রিফ পোস্ট", pill: en ? "Open for proposals" : "প্রস্তাবের জন্য উন্মুক্ত", tone: "neutral" },
    { icon: Handshake, label: en ? "Proposal accepted" : "প্রস্তাব গৃহীত", pill: en ? "Contract created" : "চুক্তি তৈরি", tone: "brand" },
    { icon: Lock, label: en ? "Escrow funded" : "এসক্রো ফান্ডেড", pill: en ? "Funded · in escrow" : "ফান্ডেড · এসক্রোতে", tone: "brand" },
    { icon: Send, label: en ? "Work submitted" : "কাজ জমা", pill: en ? "Awaiting approval" : "অনুমোদনের অপেক্ষায়", tone: "accent" },
    { icon: BadgeCheck, label: en ? "Payment released" : "পেমেন্ট রিলিজ", pill: en ? "Released" : "রিলিজড", tone: "success" },
  ] as const;

  const events = [
    en ? `Brief posted · ${fmt(BUDGET)} budget` : `ব্রিফ পোস্ট · বাজেট ${fmt(BUDGET)}`,
    en ? `Proposal accepted · ${fmt(BID)}` : `প্রস্তাব গৃহীত · ${fmt(BID)}`,
    en ? `Escrow funded via bKash · ${fmt(BID)}` : `বিকাশে এসক্রো ফান্ড · ${fmt(BID)}`,
    en ? "Staging link submitted for review" : "রিভিউর জন্য স্টেজিং লিংক জমা",
    en ? `Approved · ${fmt(NET)} released` : `অনুমোদিত · ${fmt(NET)} রিলিজ`,
  ];

  // Money positions for each stage
  const clientHolds = shownStage < 2 ? BID : 0;
  const vaultHolds = shownStage === 2 || shownStage === 3 ? BID : 0;
  const freelancerGets = shownStage === 4 ? NET : 0;

  const clientV = useTween(clientHolds, 700, reduced);
  const vaultV = useTween(vaultHolds, 700, reduced);
  const freelancerV = useTween(freelancerGets, 900, reduced);

  const fundingFlow = shownStage === 2;
  const releaseFlow = shownStage === 4;
  const current = stages[shownStage];

  const pillTone: Record<string, string> = {
    neutral: "bg-subtle text-ink-2 border-muted",
    brand: "bg-brand-soft text-brand-strong border-brand-border",
    accent: "bg-accent-soft text-accent-strong border-accent-border",
    success: "bg-success-soft text-success border-success-border",
  };

  // Most recent three events, newest first
  const feed = [shownStage, shownStage - 1, shownStage - 2].filter((i) => i >= 0);

  return (
    <figure
      className="relative h-full min-h-[560px] lg:min-h-[640px] rounded-3xl mk-dark-card overflow-hidden flex flex-col"
      aria-label={
        en
          ? "Animated example of a Muktokormo escrow contract, from brief to payment"
          : "ব্রিফ থেকে পেমেন্ট পর্যন্ত মুক্তকর্ম এসক্রো চুক্তির অ্যানিমেটেড উদাহরণ"
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div aria-hidden="true" className="absolute inset-0 mk-grid-lines-dark opacity-60" />
      <div aria-hidden="true" className="absolute -right-32 -top-24 w-[460px] h-[460px] rounded-full bg-brand-bright/25 blur-[100px]" />
      <div aria-hidden="true" className="absolute -left-24 bottom-0 w-[320px] h-[320px] rounded-full bg-brand-light/10 blur-[90px]" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 sm:px-7 pt-5 sm:pt-6">
        <span className="inline-flex items-center gap-2 mk-eyebrow text-white/60">
          <span className="relative flex w-2 h-2">
            {!reduced && <span className="absolute inset-0 rounded-full bg-brand-light animate-ping opacity-70" />}
            <span className="relative w-2 h-2 rounded-full bg-brand-light" />
          </span>
          {en ? "How escrow works" : "এসক্রো যেভাবে কাজ করে"}
        </span>
        <span className="mk-eyebrow text-white/40">{en ? "Example" : "উদাহরণ"}</span>
      </div>

      {/* ---------- Money flow: client → escrow → freelancer ---------- */}
      <div className="relative px-5 sm:px-7 pt-8 sm:pt-10" aria-hidden="true">
        <div className="grid grid-cols-[1fr_auto_1.15fr_auto_1fr] items-center">
          <FlowNode
            icon={Building2}
            label={en ? "Client" : "ক্লায়েন্ট"}
            amount={fmt(clientV)}
            dim={clientHolds === 0}
          />
          <Rail active={fundingFlow} done={shownStage > 2} reduced={reduced} />
          <FlowNode
            icon={ShieldCheck}
            label={en ? "Escrow" : "এসক্রো"}
            amount={fmt(vaultV)}
            vault
            holding={vaultHolds > 0}
            reduced={reduced}
          />
          <Rail active={releaseFlow} done={false} reduced={reduced} />
          <FlowNode
            icon={UserRound}
            label={en ? "Freelancer" : "ফ্রিল্যান্সার"}
            amount={freelancerGets > 0 ? `+${fmt(freelancerV)}` : fmt(0)}
            dim={freelancerGets === 0}
            success={freelancerGets > 0}
          />
        </div>
      </div>

      {/* ---------- Contract card ---------- */}
      <div className="relative px-5 sm:px-7 mt-8">
        <div className="bg-white text-ink rounded-2xl shadow-[0_30px_60px_-24px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mk-eyebrow text-ink-4">MK-CTR · Web &amp; App</p>
                <p className="mt-2 text-[16px] sm:text-[17px] font-semibold tracking-[-0.025em] leading-snug">
                  {en ? "Bilingual storefront with bKash checkout" : "বিকাশ চেকআউটসহ দ্বিভাষিক অনলাইন স্টোর"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-ink-4">{shownStage === 0 ? (en ? "Budget" : "বাজেট") : en ? "Contract" : "চুক্তি"}</p>
                <p className="text-lg font-semibold mk-tabular tracking-[-0.03em]">
                  {fmt(shownStage === 0 ? BUDGET : BID)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span
                key={`pill-${shownStage}`}
                className={`mk-stage-in inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[12px] font-medium ${pillTone[current.tone]}`}
              >
                <current.icon className="w-3.5 h-3.5" aria-hidden="true" />
                {current.pill}
              </span>
              {shownStage === 4 && (
                <span key="fee" className="mk-stage-in text-[12px] text-ink-3 mk-tabular">
                  {en ? `Fee ${DEFAULT_PLATFORM_FEE_PCT}% · ${fmt(FEE)}` : `ফি ${DEFAULT_PLATFORM_FEE_PCT}% · ${fmt(FEE)}`}
                </span>
              )}
            </div>
          </div>

          {/* Stage stepper — interactive */}
          <ol className="grid grid-cols-5 border-t border-line" aria-label={en ? "Contract stages" : "চুক্তির ধাপ"}>
            {stages.map((s, i) => {
              const done = i < shownStage;
              const active = i === shownStage;
              const Icon = s.icon;
              return (
                <li key={s.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setStage(i as Stage)}
                    aria-current={active ? "step" : undefined}
                    aria-label={s.label}
                    className={`group w-full flex flex-col items-center gap-1.5 py-3 px-1 transition-colors cursor-pointer ${
                      active ? "bg-brand-soft/60" : "hover:bg-subtle"
                    } ${i > 0 ? "border-l border-line" : ""}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-300 ${
                        active ? "bg-brand text-white" : done ? "bg-ink text-white" : "bg-subtle text-ink-4"
                      }`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
                    </span>
                    <span className={`hidden sm:block text-[10.5px] leading-tight text-center ${active ? "text-ink font-medium" : "text-ink-4"}`}>
                      {s.label}
                    </span>
                  </button>
                  {/* progress fill for the active stage */}
                  <span aria-hidden="true" className="absolute left-0 right-0 top-0 h-[2px] bg-transparent overflow-hidden">
                    {active && !reduced && !paused ? (
                      <span key={`bar-${shownStage}`} className="block h-full bg-brand mk-stage-bar" style={{ animationDuration: `${STAGE_MS}ms` }} />
                    ) : (
                      <span className={`block h-full ${done || active ? "bg-brand w-full" : "w-0"}`} />
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ---------- Activity feed ---------- */}
      <div className="relative px-5 sm:px-7 pb-6 sm:pb-7 mt-auto pt-6" aria-live="off">
        <p className="mk-eyebrow text-white/40 mb-3">{en ? "Activity" : "কার্যক্রম"}</p>
        <ul className="space-y-2">
          {feed.map((i, idx) => (
            <li
              key={`ev-${i}-${shownStage}`}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 border ${
                idx === 0
                  ? "mk-stage-in bg-white/[0.09] border-white/15 text-white"
                  : "bg-white/[0.03] border-white/[0.06] text-white/45"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${idx === 0 ? (i === 4 ? "bg-success-border" : "bg-brand-light") : "bg-white/25"}`} aria-hidden="true" />
              <span className="text-[13px] truncate">{events[i]}</span>
              {idx === 0 && <span className="ml-auto text-[11px] text-white/45 shrink-0">{en ? "now" : "এখন"}</span>}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

/* ---------------- Sub-components ---------------- */

function FlowNode({
  icon: Icon,
  label,
  amount,
  vault = false,
  holding = false,
  dim = false,
  success = false,
  reduced = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  amount: string;
  vault?: boolean;
  holding?: boolean;
  dim?: boolean;
  success?: boolean;
  reduced?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <div className="relative">
        {vault && holding && !reduced && (
          <>
            <span className="absolute inset-0 rounded-2xl border border-brand-light/60 mk-vault-ring" />
            <span className="absolute inset-0 rounded-2xl border border-brand-light/40 mk-vault-ring [animation-delay:900ms]" />
          </>
        )}
        <div
          className={`relative flex items-center justify-center transition-all duration-500 ${
            vault
              ? `w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl ${
                  holding ? "bg-brand-light text-navy shadow-[0_0_40px_-4px_rgba(148,187,228,0.7)]" : "bg-white/10 text-white border border-white/15"
                }`
              : `w-12 h-12 sm:w-14 sm:h-14 rounded-xl border ${
                  success
                    ? "bg-success-soft text-success border-success-border"
                    : dim
                    ? "bg-white/[0.04] text-white/40 border-white/10"
                    : "bg-white/10 text-white border-white/20"
                }`
          }`}
        >
          <Icon className={vault ? "w-7 h-7" : "w-5 h-5"} />
        </div>
      </div>
      <p className="mt-3 text-[12px] text-white/55">{label}</p>
      <p
        className={`mt-0.5 text-[13px] sm:text-[15px] font-semibold mk-tabular tracking-[-0.02em] transition-colors duration-500 ${
          success ? "text-success-border" : dim ? "text-white/35" : "text-white"
        }`}
      >
        {amount}
      </p>
    </div>
  );
}

function Rail({ active, done, reduced }: { active: boolean; done: boolean; reduced: boolean }) {
  return (
    <div className="relative w-8 sm:w-14 lg:w-16 h-[2px] -mt-12 sm:-mt-14 mx-1">
      <span className={`absolute inset-0 rounded-full transition-colors duration-500 ${active || done ? "bg-brand-light/60" : "bg-white/12"}`} />
      {!active && !done && <span className="absolute inset-0 mk-rail-dash opacity-40" />}
      {active && !reduced && (
        <>
          <span className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_14px_3px_rgba(148,187,228,0.9)] mk-coin" />
          <span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-light shadow-[0_0_10px_2px_rgba(148,187,228,0.8)] mk-coin [animation-delay:450ms]" />
        </>
      )}
    </div>
  );
}
