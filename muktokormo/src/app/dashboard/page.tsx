"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { dashboardPathForRole } from "@/lib/auth";
import Logo from "@/components/Logo";

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
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="bg-white border border-line rounded-xl p-8 text-center space-y-4 max-w-xs w-full shadow-sm">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-ink-2">
          Loading your MuktoKormo workspace...
        </p>
      </div>
    </div>
  );
}
