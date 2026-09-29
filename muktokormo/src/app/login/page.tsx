"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Briefcase,
  User,
  ArrowLeft,
  Globe,
} from "lucide-react";

type AuthMethod = "phone" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const dashboardHref = role === "client" ? "/dashboard/client" : "/dashboard/freelancer";

  const goToDashboard = (delay = 1400) => {
    setIsSuccess(true);
    setTimeout(() => router.push(dashboardHref), delay);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
    }, 800);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      goToDashboard();
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      goToDashboard();
    }, 1000);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const next = [...otpCode];
    next[index] = val;
    setOtpCode(next);
    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      goToDashboard(1200);
    }, 800);
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
                Logging you into your {role === "client" ? "Employer" : "Freelancer"} dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
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

              {/* Auth method tabs */}
              <div className="flex border-b border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("phone");
                    setOtpSent(false);
                  }}
                  className={`flex-1 pb-2.5 flex items-center justify-center gap-1.5 cursor-pointer border-b-2 transition-all ${
                    authMethod === "phone"
                      ? "border-emerald-600 text-emerald-700 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "BD Mobile (SMS OTP)" : "বাংলাদেশি মোবাইল (ওটিপি)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className={`flex-1 pb-2.5 flex items-center justify-center gap-1.5 cursor-pointer border-b-2 transition-all ${
                    authMethod === "email"
                      ? "border-emerald-600 text-emerald-700 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Email & Password" : "ইমেইল ও পাসওয়ার্ড"}</span>
                </button>
              </div>

              {/* Phone OTP */}
              {authMethod === "phone" && (
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          {lang === "en"
                            ? "Bangladeshi Mobile Number"
                            : "বাংলাদেশি মোবাইল নম্বর"}
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-xs font-bold text-slate-500 border-r border-slate-200 pr-2">
                            +880
                          </span>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="1712-345678"
                            maxLength={10}
                            className="w-full pl-20 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          We will send a 6-digit verification code via Greenweb SMS.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || phone.length < 10}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? "Sending OTP..." : "Send Verification OTP"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="text-center space-y-1">
                        <span className="text-xs text-slate-500">
                          Code sent to <b className="text-slate-800">+880 {phone}</b>
                        </span>
                        <div className="flex justify-center gap-2 pt-2">
                          {otpCode.map((digit, i) => (
                            <input
                              key={i}
                              id={`otp-${i}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              className="w-10 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? "Verifying..." : "Verify & Sign In"}
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-xs text-slate-500 hover:text-emerald-700 font-medium underline cursor-pointer"
                        >
                          Change mobile number
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Email */}
              {authMethod === "email" && (
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
                      <a href="#" className="text-xs font-semibold text-emerald-600 hover:underline">
                        Forgot?
                      </a>
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
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                  or
                </span>
              </div>

              {/* OAuth */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOAuth}
                  disabled={isLoading}
                  className="py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleOAuth}
                  disabled={isLoading}
                  className="py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.365 1.43c0 1.14-.47 2.25-1.24 3.05-.98.98-2.2 1.65-3.4 1.56-.14-1.1.4-2.3 1.1-3.05.98-1.06 2.6-1.83 3.54-1.83zM20.7 16.6c-.56 1.3-.83 1.88-1.55 3.03-1.05 1.68-2.53 3.77-4.36 3.79-1.63.02-2.03-1.06-4.22-1.04-2.19.02-2.65 1.06-4.28 1.04-1.83-.02-3.24-2.05-4.29-3.73-2.93-4.68-3.23-8.5-3.28-9.02-.13-1.32.86-2.85 2.3-2.92 1.42-.07 2.63.94 3.51.94.87 0 2.5-1.16 4.24-.99.72.03 2.75.29 4.05 2.17-.09.06-2.42 1.4-2.39 4.19.02 3.34 2.92 4.45 2.95 4.46.03 0 4.6-2.8 4.3-5.7z" />
                  </svg>
                  <span className="hidden sm:inline">Apple</span>
                </button>
              </div>

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
