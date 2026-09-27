"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Briefcase, 
  User, 
  ArrowLeft,
  KeyRound
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }, 1000);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }, 1000);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);

    // auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Top Simple Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          <Logo size="sm" />
        </Link>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">NID & Bangladesh Bank MFS Compliant</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          {/* Subtle brand ambient glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none -z-0" />

          {/* Success Overlay */}
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
                  Sign in to your account
                </h1>
                <p className="text-xs text-slate-500">
                  Select your role to access your personalized workspace
                </p>
              </div>

              {/* Role Toggle Switcher (Client vs Freelancer) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    role === "client"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>I want to hire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("freelancer")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    role === "freelancer"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>I want to work</span>
                </button>
              </div>

              {/* Role context notice banner */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {role === "client"
                    ? "Employer Portal: Post jobs, manage contracts & fund BDT escrow."
                    : "Freelancer Portal: Submit proposals, track milestones & withdraw via bKash."}
                </span>
              </div>

              {/* Auth Method Tabs: Bangladeshi Phone SMS vs Email */}
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
                  <span>BD Mobile (SMS OTP)</span>
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
                  <span>Email & Password</span>
                </button>
              </div>

              {/* TAB 1: PHONE SMS OTP AUTH (BANGLADESH STANDARD) */}
              {authMethod === "phone" && (
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Bangladeshi Mobile Number
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

              {/* TAB 2: EMAIL & PASSWORD AUTH */}
              {authMethod === "email" && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
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
                    {isLoading ? "Signing in..." : "Sign in with Email"}
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

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsLoading(false);
                    setIsSuccess(true);
                    setTimeout(() => router.push("/"), 1200);
                  }, 800);
                }}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Sign up prompt */}
              <p className="text-center text-xs text-slate-500">
                Don't have an account yet?{" "}
                <Link href="/signup" className="font-bold text-emerald-600 hover:underline">
                  Create a MuktoKormo account
                </Link>
              </p>

            </div>
          )}

        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center py-4 text-xs text-slate-400">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </div>

    </div>
  );
}
