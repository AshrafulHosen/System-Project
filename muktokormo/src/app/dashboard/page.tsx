"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { dashboardPathForRole } from "@/lib/auth";

export default function DashboardRootPage() {
  const router = useRouter();
  const { role, email, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading) {
      if (!email) {
        router.replace("/login");
      } else if (role) {
        router.replace(dashboardPathForRole(role));
      } else {
        router.replace("/dashboard/freelancer");
      }
    }
  }, [loading, role, email, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading your MuktoKormo workspace...</p>
      </div>
    </div>
  );
}
