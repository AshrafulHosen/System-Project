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
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const [targetRole, setTargetRole] = useState<UserRole | null>(null);

  const goToDashboard = (href: string, delay = 1400) => {
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
    // Honour ?next= redirect (only for safe same-origin paths)
    const destination =
      nextPath && nextPath.startsWith("/") ? nextPath : dashboardPathForRole(resolvedRole);
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
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          <Logo size="sm" />
        </Link>

        <div className="text-xs text-slate-500 flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
          <span className="hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">NID &amp; Bangladesh Bank MFS Compliant</span>
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none" />

          {isSuccess ? (
            <div className="py-12 text-center space-y-3 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome back to MuktoKormo!
              </h2>
              <p className="text-xs text-slate-500">
                Logging you into your{" "}
                {(targetRole ?? role) === "admin"
                  ? "Admin"
                  : (targetRole ?? role) === "client"
                    ? "Employer"
                    : "Freelancer"}{" "}
                dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              {authError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl px-3.5 py-2.5">
                  {authError}
                </div>
              )}
              {info && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl px-3.5 py-2.5">
                  {info}
                </div>
              )}
              {/* Header */}
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {lang === "en" ? "Log in to MuktoKormo" : "মুক্তকর্মে লগইন করুন"}
                </h1>
                <p className="text-xs text-slate-500">
                  {lang === "en"
                    ? "Select your role to access your personalized workspace"
                    : "আপনার ওয়ার্কস্পেস অ্যাক্সেস করতে ভূমিকা নির্বাচন করুন"}
                </p>
              </div>

              {/* Role toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
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

              {/* Role notice */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {role === "client"
                    ? "Employer Portal: Post jobs, manage contracts & fund BDT escrow."
                    : "Freelancer Portal: Submit proposals, track milestones & withdraw via bKash."}
                </span>
              </div>

              {/* Email */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {lang === "en" ? "Username or Email" : "ইউজারনেম বা ইমেইল"}
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? "Signing in..." : "Continue"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Signup */}
              <p className="text-center text-xs text-slate-500">
                Don&apos;t have an account yet?{" "}
                <Link href="/signup" className="font-bold text-emerald-600 hover:underline">
                  Create a MuktoKormo account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center py-4 text-xs text-slate-400">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
