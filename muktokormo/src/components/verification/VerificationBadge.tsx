import { Clock, ShieldCheck, ShieldOff, XCircle } from "lucide-react";
import { Badge } from "@/components/ui";
import type { NidStatus } from "@/lib/nid/shared";

const CONFIG: Record<
  NidStatus,
  { variant: "verified" | "warning" | "danger" | "neutral"; icon: React.ReactNode; en: string; bn: string }
> = {
  approved: { variant: "verified", icon: <ShieldCheck className="w-3 h-3" />, en: "Identity Verified", bn: "পরিচয় যাচাইকৃত" },
  pending: { variant: "warning", icon: <Clock className="w-3 h-3" />, en: "Pending Review", bn: "পর্যালোচনাধীন" },
  rejected: { variant: "danger", icon: <XCircle className="w-3 h-3" />, en: "Verification Rejected", bn: "যাচাই প্রত্যাখ্যাত" },
  not_verified: { variant: "neutral", icon: <ShieldOff className="w-3 h-3" />, en: "Not Verified", bn: "যাচাই করা হয়নি" },
};

/** Status badge for manual NID document review. `approved` is the Identity Verified badge. */
export default function VerificationBadge({
  status,
  lang = "en",
  className = "",
}: {
  status: NidStatus;
  lang?: "en" | "bn";
  className?: string;
}) {
  const c = CONFIG[status] ?? CONFIG.not_verified;
  return (
    <Badge variant={c.variant} icon={c.icon} className={className}>
      {lang === "en" ? c.en : c.bn}
    </Badge>
  );
}

/** Compact inline marker for cards and lists (only rendered when verified). */
export function IdentityVerifiedMark({ lang = "en" }: { lang?: "en" | "bn" }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium text-success"
      title={
        lang === "en"
          ? "Identity documents reviewed and approved by Muktokormo"
          : "Muktokormo কর্তৃক পরিচয়পত্র পর্যালোচনা ও অনুমোদিত"
      }
    >
      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
      {lang === "en" ? "Identity verified" : "পরিচয় যাচাইকৃত"}
    </span>
  );
}

