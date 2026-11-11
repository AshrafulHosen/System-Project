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
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
          <span className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 group-hover:border-emerald-300 group-hover:text-emerald-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          <Logo size="sm" />
        </Link>

        <div className="text-xs text-slate-500 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">NID &amp; Bangladesh Bank MFS Compliant</span>
          </span>
        </div>
      </header>

      {/* Split Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden">
          {/* Left SaaS Value Panel */}
          <div className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white p-9 flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MuktoKormo Workspace</span>
              </div>

              <h2 className="text-2xl font-black tracking-tight leading-snug text-white">
                {lang === "en"
                  ? "Where Bangladeshi businesses and verified talent ship real work."
                  : "বাংলাদেশের প্রতিষ্ঠান ও দক্ষ ফ্রিল্যান্সারদের নির্ভরযোগ্য কাজের জায়গা।"}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === "en"
                  ? "Sign in to manage milestone contracts, collaborate inside real-time TalkJS workspaces, and settle payments safely in BDT."
                  : "আপনার মাইলস্টোন কন্ট্রাক্ট, রিয়েল-টাইম মেসেজিং এবং নিরাপদ বিডিটি পেমেন্ট পরিচালনা করতে লগইন করুন।"}
              </p>

              <div className="space-y-3.5 pt-2">
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
                    className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">{item.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Porichoy NID Verification</span>
              <span className="text-emerald-400 font-semibold">256-bit TLS Encrypted</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            {isSuccess ? (
              <div className="py-16 text-center space-y-3 animate-in fade-in duration-300 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Welcome back to MuktoKormo!
                </h2>
                <p className="text-xs text-slate-500">
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
                    className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3"
                  >
                    {authError}
                  </div>
                )}
                {info && (
                  <div
                    role="status"
                    className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl px-4 py-3"
                  >
                    {info}
                  </div>
                )}

                {/* Header */}
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    {lang === "en" ? "Sign in to your account" : "আপনার অ্যাকাউন্টে লগইন করুন"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {lang === "en"
                      ? "Choose your portal below or sign in with your registered email."
                      : "আপনার ওয়ার্কস্পেস অ্যাক্সেস করতে ভূমিকা নির্বাচন করুন"}
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                  {[
                    { id: "client" as const, icon: Briefcase, en: "I want to hire", bn: "আমি নিয়োগ করতে চাই" },
                    { id: "freelancer" as const, icon: User, en: "I want to work", bn: "আমি কাজ করতে চাই" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        role === r.id
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <r.icon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === "en" ? r.en : r.bn}</span>
                    </button>
                  ))}
                </div>

                {/* Role Context Pill */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
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
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        {lang === "en" ? "Password" : "পাসওয়ার্ড"}
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
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
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <p className="text-center text-xs text-slate-500 pt-1">
                  {lang === "en" ? "New to MuktoKormo? " : "মুক্তকর্মে নতুন? "}
                  <Link href="/signup" className="font-bold text-emerald-600 hover:underline">
                    {lang === "en" ? "Create a free account" : "ফ্রি অ্যাকাউন্ট তৈরি করুন"}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-slate-400">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
