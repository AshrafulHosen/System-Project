"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { 
  ShieldCheck, 
  Briefcase, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  ArrowLeft, 
  Lock, 
  Smartphone, 
  Mail, 
  MapPin, 
  Check, 
  Sparkles 
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer">("freelancer");
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [skillCategory, setSkillCategory] = useState("Web & App Development");
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const bdDistricts = [
    "Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", 
    "Barishal", "Rangpur", "Mymensingh", "Gazipur", "Narayanganj", "Cumilla"
  ];

  const primarySkills = [
    "Web & App Development",
    "UI/UX & Graphic Design",
    "Digital Marketing & SEO",
    "Video Editing & Motion Graphics",
    "Bangla & English Content Writing",
    "Virtual Assistance & Data Entry"
  ];

  const handleNextStep = () => {
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1800);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          <Logo size="sm" />
        </Link>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>Already have an account?</span>
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          
          {/* Ambient Glow Blob */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

          {/* Success Splash */}
          {isSuccess ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Welcome to MuktoKormo, {fullName.split(" ")[0] || "Friend"}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                Your {selectedRole === "client" ? "Employer" : "Freelancer"} account has been created. Setting up your workspace...
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              
              {/* STEP 1: ROLE SELECTION (Upwork/Fiverr Style) */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="text-center space-y-1.5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                      Join as a Client or Freelancer
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Choose how you want to use Bangladesh’s premier freelance platform
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    
                    {/* Role Card 1: Client */}
                    <div
                      onClick={() => setSelectedRole("client")}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                        selectedRole === "client"
                          ? "border-emerald-600 bg-emerald-50/40 shadow-md shadow-emerald-600/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {selectedRole === "client" && (
                        <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 text-emerald-600">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 mb-1">
                          I'm a Client
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          I want to post jobs, hire verified Bangladeshi talent, and fund contracts in BDT.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Protected by BDT Escrow</span>
                      </div>
                    </div>

                    {/* Role Card 2: Freelancer */}
                    <div
                      onClick={() => setSelectedRole("freelancer")}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                        selectedRole === "freelancer"
                          ? "border-emerald-600 bg-emerald-50/40 shadow-md shadow-emerald-600/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {selectedRole === "freelancer" && (
                        <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 text-emerald-600">
                          <User className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 mb-1">
                          I'm a Freelancer
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          I want to offer my digital skills, submit bids on projects, and earn in Taka.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Flat 7% lowest service fee</span>
                      </div>
                    </div>

                  </div>

                  <button
                    onClick={handleNextStep}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <span>
                      {selectedRole === "client" ? "Apply as Client" : "Apply as Freelancer"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: PROFILE & CREDENTIALS FORM */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
                  
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">
                        Sign up to {selectedRole === "client" ? "Hire Talent" : "Find Work"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Create your free MuktoKormo account
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
                    >
                      Change Role
                    </button>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Legal Name (as per NID)
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        BD Phone (+880)
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-slate-500 border-r border-slate-200 pr-1.5">
                          +880
                        </span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="1712-345678"
                          maxLength={10}
                          className="w-full pl-16 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        District / City
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      >
                        {bdDistricts.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Password (8+ characters)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Freelancer Skill Category Picker */}
                  {selectedRole === "freelancer" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Primary Expertise Area
                      </label>
                      <select
                        value={skillCategory}
                        onChange={(e) => setSkillCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      >
                        {primarySkills.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-500 leading-normal">
                      Yes, I understand and agree to the MuktoKormo Terms of Service and Privacy Policy under Bangladesh ICT Regulations.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !agreedTerms}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {isLoading ? "Creating Account..." : "Create My Account (বিনামূল্যে)"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Google OAuth alternative */}
                  <div className="pt-2 text-center">
                    <div className="relative flex items-center justify-center mb-3">
                      <div className="border-t border-slate-200 w-full" />
                      <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                        or
                      </span>
                    </div>

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
                      <span>Sign up with Google</span>
                    </button>
                  </div>

                </form>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-slate-400">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </div>

    </div>
  );
}
