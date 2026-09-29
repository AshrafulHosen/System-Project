"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, User, Check, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import OnboardingShell, { WizardStep } from "@/components/onboarding/OnboardingShell";
import { ClientOrgStep } from "@/components/onboarding/ClientOrgStep";
import {
  FreelancerAccountStep,
  FreelancerAccount,
  ResumeImportStep,
  CategoriesSkillsStep,
  ProfileInfoSteps,
  ProfileFormState,
} from "@/components/onboarding/FreelancerSteps";
import { ClientOrgDetails } from "@/types";
import {
  SAMPLE_EMPLOYMENT,
  SAMPLE_EDUCATION,
  SAMPLE_LANGUAGES,
} from "@/data/dashboardData";

const CLIENT_STEPS: WizardStep[] = [
  { id: "company", label: "Your business", labelBn: "আপনার প্রতিষ্ঠান" },
  { id: "post", label: "First job post", labelBn: "প্রথম কাজ পোস্ট" },
];

const FREELANCER_STEPS: WizardStep[] = [
  { id: "account", label: "Account", labelBn: "অ্যাকাউন্ট" },
  { id: "resume", label: "Resume", labelBn: "রিজিউমে" },
  { id: "skills", label: "Skills", labelBn: "দক্ষতা" },
  { id: "profile", label: "Profile", labelBn: "প্রোফাইল" },
];

const EMPTY_ACCOUNT: FreelancerAccount = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  country: "Bangladesh",
  marketingOptIn: true,
  agreedTerms: false,
};

const EMPTY_ORG: ClientOrgDetails = {
  companyName: "",
  website: "",
  orgSize: "",
  role: "Founder / Owner",
};

const EMPTY_PROFILE: ProfileFormState = {
  title: "",
  intro: "",
  hourlyRate: 1200,
  employment: [],
  education: [],
  languages: [{ id: "lang-en", name: "English", proficiency: "Fluent" }],
  portfolioUrls: [],
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md h-64 bg-white border border-slate-200/90 rounded-3xl shadow-xl animate-pulse" />
        </div>
      }
    >
      <SignUpFlow />
    </Suspense>
  );
}

function SignUpFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deep links from the dashboards: /signup?step=skills | profile
  const deepLink = searchParams.get("step");
  const wantsSkills = deepLink === "skills";
  const wantsProfile = deepLink === "profile";
  const isFreelancerDeepLink = wantsSkills || wantsProfile;

  const [role, setRole] = useState<"client" | "freelancer" | null>(
    isFreelancerDeepLink ? "freelancer" : null
  );
  const [clientStep, setClientStep] = useState(0);
  const [freelancerStep, setFreelancerStep] = useState(
    wantsSkills ? 2 : wantsProfile ? 3 : 0
  );

  const [org, setOrg] = useState<ClientOrgDetails>(EMPTY_ORG);
  const [account, setAccount] = useState<FreelancerAccount>(EMPTY_ACCOUNT);
  const [category, setCategory] = useState("Web, Mobile & Software Dev");
  const [skills, setSkills] = useState<string[]>(
    wantsSkills ? ["Web Development", "TypeScript", "React"] : []
  );
  const [profile, setProfile] = useState<ProfileFormState>(() =>
    isFreelancerDeepLink
      ? {
          ...EMPTY_PROFILE,
          employment: SAMPLE_EMPLOYMENT,
          education: SAMPLE_EDUCATION,
          languages: SAMPLE_LANGUAGES,
        }
      : EMPTY_PROFILE
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const finish = (target: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => router.push(target), 1800);
    }, 1200);
  };

  const headerRight = (
    <span className="hidden sm:flex items-center gap-1.5">
      <span>Already have an account?</span>
      <Link href="/login" className="font-bold text-emerald-600 hover:underline">
        Sign In
      </Link>
    </span>
  );

  /* ---------------- Success ---------------- */
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl shadow-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Check className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Welcome to MuktoKormo, {account.firstName || org.companyName || "Friend"}!
          </h2>
          <p className="text-xs text-slate-500">
            Your {role === "client" ? "Employer" : "Freelancer"} account has been created. Setting up
            your workspace...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- Role selection ---------------- */
  if (role === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <span className="text-slate-500 text-xs font-bold group-hover:-translate-x-0.5 transition-transform">
                &larr;
              </span>
              <span className="text-xs font-bold text-slate-600 hidden sm:inline">Home</span>
            </Link>
            <span className="text-lg font-black tracking-tight text-slate-950">
              Mukto<span className="text-emerald-600">Kormo</span>
            </span>
            {headerRight}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Welcome to MuktoKormo
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">Which describes you best?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: "client" as const,
                  icon: Briefcase,
                  title: "Client",
                  titleBn: "নিয়োগদাতা",
                  body: "Post jobs and hire",
                  bodyBn: "কাজ পোস্ট করুন ও নিয়োগ দিন",
                  foot: "Protected by BDT escrow",
                  footBn: "বিডিটি এসক্রো দ্বারা সুরক্ষিত",
                  footIcon: ShieldCheck,
                },
                {
                  id: "freelancer" as const,
                  icon: User,
                  title: "Freelancer",
                  titleBn: "ফ্রিল্যান্সার",
                  body: "Work and get paid",
                  bodyBn: "কাজ করুন ও টাকা নিন",
                  foot: "Flat 7% service fee",
                  footBn: "মাত্র ৭% সার্ভিস ফি",
                  footIcon: Sparkles,
                },
              ].map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setRole(card.id)}
                  className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 text-emerald-600">
                      <card.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">{card.titleBn}</h3>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">{card.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2">{card.bodyBn}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <card.footIcon className="w-3.5 h-3.5" />
                    <span>{card.footBn}</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-emerald-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center py-5 text-xs text-slate-400">
          © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd.
        </div>
      </div>
    );
  }

  /* ---------------- Client flow ---------------- */
  if (role === "client") {
    return (
      <>
        {clientStep === 0 && (
          <OnboardingShell
            eyebrow="Step 1 of 2"
            title="Welcome to MuktoKormo!"
            subtitle="Tell us about your business and you'll be on your way to connect with talent."
            steps={CLIENT_STEPS}
            currentIndex={0}
            onBack={() => setRole(null)}
            backLabel="Change role"
            headerRight={headerRight}
          >
            <ClientOrgStep
              value={org}
              onChange={setOrg}
              onBack={() => setRole(null)}
              onNext={() => setClientStep(1)}
            />
          </OnboardingShell>
        )}

        {clientStep === 1 && (
          <OnboardingShell
            eyebrow="Step 2 of 2"
            title="Post your first job"
            subtitle="Posting jobs is always free. You only pay when you fund a contract."
            steps={CLIENT_STEPS}
            currentIndex={1}
            onBack={() => setClientStep(0)}
            backLabel="Back"
            headerRight={headerRight}
            width="lg"
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-emerald-900">{org.companyName}</p>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">
                    {org.role}
                    {org.website ? ` · ${org.website}` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-900">Before you publish</p>
                {[
                  "Verify your phone number (required to publish)",
                  "Add a billing method (required to hire)",
                  "Verify your NID (required for escrow funding)",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      !
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setClientStep(0)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => finish("/dashboard/client")}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {isLoading ? "Creating account..." : "Go to my dashboard"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </OnboardingShell>
        )}
      </>
    );
  }

  /* ---------------- Freelancer flow ---------------- */
  return (
    <OnboardingShell
      eyebrow={`Step ${freelancerStep + 1} of ${FREELANCER_STEPS.length}`}
      title={
        freelancerStep === 0
          ? "Create your account"
          : freelancerStep === 1
            ? "Build your profile"
            : freelancerStep === 2
              ? "Your skills"
              : "Your profile"
      }
      subtitle={
        freelancerStep === 0
          ? "Sign up to find work you love"
          : "A strong, complete profile helps clients find you and increases your chances of getting hired."
      }
      steps={FREELANCER_STEPS}
      currentIndex={freelancerStep}
      onBack={() => {
        if (freelancerStep === 0) setRole(null);
        else setFreelancerStep(freelancerStep - 1);
      }}
      backLabel={freelancerStep === 0 ? "Change role" : "Back"}
      headerRight={headerRight}
      width={freelancerStep === 2 ? "lg" : "md"}
    >
      {freelancerStep === 0 && (
        <FreelancerAccountStep
          value={account}
          onChange={setAccount}
          onNext={() => setFreelancerStep(1)}
          onSwitchToClient={() => setRole("client")}
          isLoading={isLoading}
        />
      )}

      {freelancerStep === 1 && (
        <ResumeImportStep
          onBack={() => setFreelancerStep(0)}
          onManual={() => setFreelancerStep(2)}
          onNext={() => setFreelancerStep(2)}
        />
      )}

      {freelancerStep === 2 && (
        <CategoriesSkillsStep
          category={category}
          onCategoryChange={setCategory}
          skills={skills}
          onSkillsChange={setSkills}
          onBack={() => setFreelancerStep(1)}
          onNext={() => setFreelancerStep(3)}
        />
      )}

      {freelancerStep === 3 && (
        <ProfileInfoSteps
          value={profile}
          onChange={setProfile}
          onBack={() => setFreelancerStep(2)}
          isFinal
          onFinish={() => finish("/dashboard/freelancer")}
        />
      )}
    </OnboardingShell>
  );
}
