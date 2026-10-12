"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import JobPostWizard from "@/components/jobpost/JobPostWizard";
import useCurrentUser from "@/lib/hooks/useCurrentUser";

export default function PostJobPage() {
  const router = useRouter();
  const { role, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    if (role === null) {
      // Not logged in — send to login, return here after
      router.replace("/login?next=/post-job");
    } else if (role === "freelancer") {
      // Freelancers can't post jobs
      router.replace("/dashboard/freelancer");
    }
  }, [loading, role, router]);

  // Spinner while resolving auth, or while redirecting
  if (loading || role !== "client") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <JobPostWizard onExit={() => window.history.back()} />;
}
