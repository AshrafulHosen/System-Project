"use client";

import React, { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { dashboardPathForRole, resolveUserRole, UserRole } from "@/lib/auth";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Briefcase,
  User,
  ArrowLeft,
  Globe,
  Eye,
  EyeOff,
  Lock,
  FolderKanban,
  Smartphone,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const [targetRole, setTargetRole] = useState<UserRole | null>(null);

  const goToDashboard = (href: string, delay = 1100) => {
    setIsSuccess(true);
    setTimeout(() => router.push(href), delay);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setInfo(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }

    const storedRole = data.user ? await resolveUserRole(supabase, data.user.id) : null;
    const resolvedRole = storedRole ?? role;
    setTargetRole(resolvedRole);

    let destination = dashboardPathForRole(resolvedRole);
    if (nextPath && nextPath.startsWith("/")) {
      if (resolvedRole === "client" && nextPath.includes("freelancer")) {
        destination = "/dashboard/client";
      } else if (resolvedRole === "freelancer" && nextPath.includes("client")) {
        destination = "/dashboard/freelancer";
      } else {
        destination = nextPath;
      }
    }
    goToDashboard(destination);
  };

  const handleForgotPassword = async () => {
    if (!email.includes("@")) {
      setAuthError("Enter your email address first to reset your password.");
      return;
    }
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setInfo(`Password reset link sent to ${email}.`);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-navy selection:text-white">
      {/* Top Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
          <span className="w-8 h-8 rounded-lg bg-white border border-line text-ink-2 flex items-center justify-center group-hover:border-brand group-hover:text-brand transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
          <Logo size="sm" />
        </Link>

        <div className="text-xs text-ink-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-ink bg-white border border-line hover:border-line-strong transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-brand" />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-soft border border-brand/15 text-navy font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            <span className="hidden md:inline">NID &amp; Bangladesh Bank MFS Compliant</span>
          </span>
        </div>
      </header>

      {/* Split Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-line rounded-xl shadow-[var(--mk-shadow-elevated)] overflow-hidden">
          {/* Left SaaS Value Panel */}
          <div className="hidden lg:flex lg:col-span-5 mk-dark-card p-9 flex-col justify-between relative overflow-hidden">
            <div className="mk-grid-lines absolute inset-0 opacity-[0.06] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-light/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-brand-light mk-eyebrow">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-light" />
                <span>MuktoKormo Workspace</span>
              </div>

              <h2 className="text-[26px] font-semibold tracking-tight leading-[1.2] text-white">
                {lang === "en" ? (
                  <>
                    Where Bangladeshi teams and verified talent{" "}
                    <span className="font-medium text-brand-light">
                      ship real work.
                    </span>
                  </>
                ) : (
                  "বাংলাদেশের প্রতিষ্ঠান ও দক্ষ ফ্রিল্যান্সারদের নির্ভরযোগ্য কাজের জায়গা।"
                )}
              </h2>

              <p className="text-xs text-white/75 leading-relaxed">
                {lang === "en"
                  ? "Sign in to manage milestone contracts, collaborate inside real-time TalkJS workspaces, and settle payments safely in BDT."
                  : "আপনার মাইলস্টোন কন্ট্রাক্ট, রিয়েল-টাইম মেসেজিং এবং নিরাপদ বিডিটি পেমেন্ট পরিচালনা করতে লগইন করুন।"}
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    icon: Lock,
                    title: "100% BDT Escrow Protection",
                    desc: "Milestone funds are locked before work begins and released on approval.",
                  },
                  {
                    icon: FolderKanban,
                    title: "Dedicated Delivery Workspaces",
                    desc: "Structured milestone submissions, demo URLs, and 1-to-1 live chat.",
                  },
                  {
                    icon: Smartphone,
                    title: "Direct bKash & Nagad Payouts",
                    desc: "Transparent 7% flat freelancer fee with instant local settlement.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-white/[0.06] border border-white/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand/45 border border-white/10 text-brand-light flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white">{item.title}</h3>
                      <p className="text-[11px] text-white/65 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-white/65 font-mono mk-tabular">
              <span>Porichoy NID Verification</span>
              <span className="text-brand-light font-medium">256-bit TLS Encrypted</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-11 flex flex-col justify-center bg-white">
            {isSuccess ? (
              <div className="py-16 text-center space-y-3 animate-in fade-in duration-300 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-xl bg-brand-soft text-brand flex items-center justify-center mx-auto border border-brand/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  Welcome back to MuktoKormo!
                </h2>
                <p className="text-xs text-ink-3">
                  Redirecting you to your{" "}
                  {(targetRole ?? role) === "admin"
                    ? "Admin"
                    : (targetRole ?? role) === "client"
                      ? "Client"
                      : "Freelancer"}{" "}
                  command center...
                </p>
              </div>
            ) : (
              <div className="w-full max-w-md mx-auto space-y-6">
                {authError && (
                  <div
                    role="alert"
                    className="bg-danger-soft border border-danger/20 text-danger-ink text-xs font-medium rounded-lg px-4 py-3"
                  >
                    {authError}
                  </div>
                )}
                {info && (
                  <div
                    role="status"
                    className="bg-brand-soft border border-brand/25 text-navy text-xs font-medium rounded-lg px-4 py-3"
                  >
                    {info}
                  </div>
                )}

                {/* Header */}
                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-ink">
                    {lang === "en" ? "Sign in to your account" : "আপনার অ্যাকাউন্টে লগইন করুন"}
                  </h1>
                  <p className="text-xs sm:text-sm text-ink-3">
                    {lang === "en"
                      ? "Choose your portal below or sign in with your registered email."
                      : "আপনার ওয়ার্কস্পেস অ্যাক্সেস করতে ভূমিকা নির্বাচন করুন"}
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-subtle rounded-lg border border-line">
                  {[
                    { id: "client" as const, icon: Briefcase, en: "I want to hire", bn: "আমি নিয়োগ করতে চাই" },
                    { id: "freelancer" as const, icon: User, en: "I want to work", bn: "আমি কাজ করতে চাই" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        role === r.id
                          ? "bg-white text-ink shadow-xs border border-line"
                          : "text-ink-3 hover:text-ink"
                      }`}
                    >
                      <r.icon className={`w-3.5 h-3.5 ${role === r.id ? "text-brand" : "text-ink-3"}`} />
                      <span>{lang === "en" ? r.en : r.bn}</span>
                    </button>
                  ))}
                </div>

                {/* Role Context Pill */}
                <div className="bg-brand-soft border border-brand/20 rounded-lg p-3.5 flex items-center gap-2.5 text-xs text-navy">
                  <Sparkles className="w-4 h-4 text-brand shrink-0" />
                  <span className="leading-relaxed">
                    {role === "client"
                      ? "Client Portal: Post jobs, review bids, fund BDT escrow & approve milestones."
                      : "Freelancer Portal: Submit bids, deliver milestones & withdraw to bKash/Nagad."}
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block mk-eyebrow text-ink-2 mb-1.5"
                    >
                      {lang === "en" ? "Email Address" : "ইমেইল ঠিকানা"}
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-line-strong rounded-lg text-xs sm:text-sm text-ink placeholder-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="block mk-eyebrow text-ink-2"
                      >
                        {lang === "en" ? "Password" : "পাসওয়ার্ড"}
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs font-semibold text-brand hover:text-navy hover:underline cursor-pointer"
                      >
                        {lang === "en" ? "Forgot password?" : "পাসওয়ার্ড ভুলে গেছেন?"}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-line-strong rounded-lg text-xs sm:text-sm text-ink placeholder-ink-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg bg-navy hover:bg-navy-ink disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {isLoading
                        ? lang === "en"
                          ? "Signing in..."
                          : "লগইন হচ্ছে..."
                        : lang === "en"
                          ? "Sign In to Workspace"
                          : "ওয়ার্কস্পেসে প্রবেশ করুন"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Signup Link */}
                <p className="text-center text-xs text-ink-3 pt-1">
                  {lang === "en" ? "New to MuktoKormo? " : "মুক্তকর্মে নতুন? "}
                  <Link href="/signup" className="font-semibold text-brand hover:text-navy hover:underline">
                    {lang === "en" ? "Create a free account" : "ফ্রি অ্যাকাউন্ট তৈরি করুন"}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-5 text-xs text-ink-3">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
