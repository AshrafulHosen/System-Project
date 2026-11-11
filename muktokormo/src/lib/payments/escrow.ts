import { roundBdt } from "@/lib/payments/constants";
import type { EscrowLedgerRecord } from "@/types/payment";

export const ESCROW_SIMULATION_DISCLAIMER =
  "Academic Sandbox Simulation: The internal database ledger tracks simulated escrow custody, payment releases, and commission deductions. Actual funds are not held in a separate regulated escrow bank account.";

export const ESCROW_SIMULATION_DISCLAIMER_BN =
  "একাডেমিক স্যান্ডবক্স সিমুলেশন: অভ্যন্তরীণ ডাটাবেস লেজার সিমুলেটেড এসক্রো, পেমেন্ট রিলিজ এবং কমিশন হিসাব সংরক্ষণ করে। বাস্তবে আলাদা কোনো নিয়ন্ত্রিত এসক্রো ব্যাংক অ্যাকাউন্টে অর্থ জমা থাকে না।";

export interface EscrowSummary {
  totalFundedBdt: number;
  currentlyHeldBdt: number;
  totalReleasedBdt: number;
  totalRefundedBdt: number;
  platformFeeBdt: number;
  freelancerNetBdt: number;
  entryCount: number;
  hasFundEntry: boolean;
  hasReleaseEntry: boolean;
  hasRefundEntry: boolean;
  isSimulated: true;
}

export interface PaymentStatusBadgeMeta {
  label: string;
  labelBn: string;
  tone: "emerald" | "sky" | "amber" | "rose" | "slate" | "indigo";
}

/**
 * Pure aggregation over real public.escrow_ledger records.
 */
export function computeEscrowLedgerSummary(
  entries: EscrowLedgerRecord[]
): EscrowSummary {
  let totalFundedBdt = 0;
  let totalReleasedBdt = 0;
  let totalRefundedBdt = 0;
  let platformFeeBdt = 0;
  let freelancerNetBdt = 0;
  let hasFundEntry = false;
  let hasReleaseEntry = false;
  let hasRefundEntry = false;

  for (const entry of entries) {
    const amount = Number(entry.amount) || 0;
    const fee = Number(entry.platform_fee_amount) || 0;
    const net = Number(entry.freelancer_net_amount) || 0;

    if (entry.entry_type === "FUND") {
      hasFundEntry = true;
      totalFundedBdt += amount;
      if (!hasReleaseEntry) {
        platformFeeBdt = Math.max(platformFeeBdt, fee);
        freelancerNetBdt = Math.max(freelancerNetBdt, net);
      }
    } else if (entry.entry_type === "RELEASE") {
      hasReleaseEntry = true;
      totalReleasedBdt += amount;
      platformFeeBdt = fee;
      freelancerNetBdt = net;
    } else if (entry.entry_type === "REFUND") {
      hasRefundEntry = true;
      totalRefundedBdt += amount;
    }
  }

  const currentlyHeldBdt = Math.max(
    0,
    roundBdt(totalFundedBdt - totalReleasedBdt - totalRefundedBdt)
  );

  return {
    totalFundedBdt: roundBdt(totalFundedBdt),
    currentlyHeldBdt,
    totalReleasedBdt: roundBdt(totalReleasedBdt),
    totalRefundedBdt: roundBdt(totalRefundedBdt),
    platformFeeBdt: roundBdt(platformFeeBdt),
    freelancerNetBdt: roundBdt(freelancerNetBdt),
    entryCount: entries.length,
    hasFundEntry,
    hasReleaseEntry,
    hasRefundEntry,
    isSimulated: true,
  };
}

export function getPaymentStatusMeta(
  status?: string | null
): PaymentStatusBadgeMeta {
  switch (String(status ?? "UNPAID").toUpperCase()) {
    case "PENDING":
      return { label: "Pending", labelBn: "অপেক্ষমান", tone: "amber" };
    case "FUNDED":
      return { label: "Funded", labelBn: "ফান্ডেড", tone: "sky" };
    case "FAILED":
      return { label: "Failed", labelBn: "ব্যর্থ", tone: "rose" };
    case "CANCELLED":
      return { label: "Cancelled", labelBn: "বাতিল", tone: "slate" };
    case "RELEASED":
      return { label: "Released", labelBn: "রিলিজড", tone: "emerald" };
    case "REFUND_REQUESTED":
      return { label: "Refund Requested", labelBn: "রিফান্ড অনুরোধ", tone: "amber" };
    case "REFUNDED":
      return { label: "Refunded", labelBn: "রিফান্ডেড", tone: "indigo" };
    case "DISPUTED":
      return { label: "Disputed", labelBn: "বিরোধপূর্ণ", tone: "rose" };
    default:
      return { label: "Unpaid", labelBn: "অপরিশোধিত", tone: "slate" };
  }
}

export function getWorkStatusMeta(
  status?: string | null
): PaymentStatusBadgeMeta {
  switch (String(status ?? "NOT_STARTED").toUpperCase()) {
    case "FUNDED":
      return { label: "Funded (Ready)", labelBn: "ফান্ডেড (প্রস্তুত)", tone: "sky" };
    case "IN_PROGRESS":
      return { label: "In Progress", labelBn: "চলমান", tone: "sky" };
    case "SUBMITTED":
      return { label: "Submitted", labelBn: "জমা দেওয়া হয়েছে", tone: "amber" };
    case "REVISION_REQUESTED":
      return { label: "Revision Requested", labelBn: "রিভিশন অনুরোধ", tone: "rose" };
    case "APPROVED":
      return { label: "Approved", labelBn: "অনুমোদিত", tone: "emerald" };
    case "RELEASED":
      return { label: "Released", labelBn: "রিলিজড", tone: "emerald" };
    case "DISPUTED":
      return { label: "Disputed", labelBn: "বিরোধপূর্ণ", tone: "rose" };
    case "REFUNDED":
      return { label: "Refunded", labelBn: "রিফান্ডেড", tone: "indigo" };
    default:
      return { label: "Not Started", labelBn: "শুরু হয়নি", tone: "slate" };
  }
}

