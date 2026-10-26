import type { SupabaseClient } from "@supabase/supabase-js";
import type { WalletEntry } from "@/types";
import { FREELANCER_LEDGER } from "@/data/dashboardData";

export interface PayoutMethod {
  id: string;
  type: "BKASH" | "NAGAD" | "ROCKET" | "BANK";
  accountType?: "Personal" | "Merchant";
  accountNumber: string;
  accountHolder: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  isPrimary: boolean;
  status: "VERIFIED" | "PENDING";
  createdAt?: string;
}

const DEFAULT_METHODS: PayoutMethod[] = [
  {
    id: "pm-1",
    type: "BKASH",
    accountType: "Personal",
    accountNumber: "+880 1712-345678",
    accountHolder: "Tanvir Rahman",
    isPrimary: true,
    status: "VERIFIED",
  },
  {
    id: "pm-2",
    type: "BANK",
    bankName: "BRAC Bank PLC",
    branchName: "Gulshan Branch",
    accountNumber: "1501 2039 4810 2001",
    accountHolder: "Tanvir Rahman",
    routingNumber: "060261345",
    isPrimary: false,
    status: "VERIFIED",
  },
];

const PAYOUT_METHODS_STORAGE_KEY = "muktokormo_payout_methods_v2";
const WALLET_LEDGER_STORAGE_KEY = "muktokormo_wallet_ledger_v2";

export function getStoredPayoutMethods(): PayoutMethod[] {
  if (typeof window === "undefined") return DEFAULT_METHODS;
  try {
    const raw = localStorage.getItem(PAYOUT_METHODS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PAYOUT_METHODS_STORAGE_KEY, JSON.stringify(DEFAULT_METHODS));
      return DEFAULT_METHODS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_METHODS;
  } catch {
    return DEFAULT_METHODS;
  }
}

export function saveStoredPayoutMethod(newMethod: PayoutMethod): PayoutMethod[] {
  const current = getStoredPayoutMethods();
  let updated: PayoutMethod[];
  if (newMethod.isPrimary) {
    updated = [...current.map((m) => ({ ...m, isPrimary: false })), newMethod];
  } else {
    updated = [...current, newMethod];
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PAYOUT_METHODS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save payout methods:", e);
    }
  }
  return updated;
}

export function removeStoredPayoutMethod(id: string): PayoutMethod[] {
  const current = getStoredPayoutMethods();
  const updated = current.filter((m) => m.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PAYOUT_METHODS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to remove payout method:", e);
    }
  }
  return updated;
}

export function setPrimaryStoredPayoutMethod(id: string): PayoutMethod[] {
  const current = getStoredPayoutMethods();
  const updated = current.map((m) => ({ ...m, isPrimary: m.id === id }));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PAYOUT_METHODS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to set primary payout method:", e);
    }
  }
  return updated;
}

// -----------------------------------------------------------------------------
// SUPABASE LIVE DATABASE OPERATIONS
// -----------------------------------------------------------------------------

export async function fetchLivePayoutMethods(
  supabase: SupabaseClient,
  userId?: string | null
): Promise<PayoutMethod[]> {
  try {
    let query = supabase.from("payout_methods").select("*").order("created_at", { ascending: false });
    if (userId) {
      // Fetch user's methods or shared demo methods
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const mapped: PayoutMethod[] = data.map((row: any) => ({
        id: row.id,
        type: row.type as any,
        accountType: row.account_type as any,
        accountNumber: row.account_number,
        accountHolder: row.account_holder,
        bankName: row.bank_name || undefined,
        branchName: row.branch_name || undefined,
        routingNumber: row.routing_number || undefined,
        isPrimary: Boolean(row.is_primary),
        status: (row.status as any) || "VERIFIED",
        createdAt: row.created_at,
      }));

      // Sync to local storage
      if (typeof window !== "undefined") {
        localStorage.setItem(PAYOUT_METHODS_STORAGE_KEY, JSON.stringify(mapped));
      }
      return mapped;
    }
  } catch (err) {
    console.warn("fetchLivePayoutMethods failed, falling back to local storage:", err);
  }

  return getStoredPayoutMethods();
}

export async function saveLivePayoutMethod(
  supabase: SupabaseClient,
  newMethod: PayoutMethod,
  userId?: string | null
): Promise<PayoutMethod[]> {
  // 1. Update local storage first for instant optimistic response
  const localList = saveStoredPayoutMethod(newMethod);

  // 2. Perform live Supabase insert
  try {
    const insertRow: any = {
      id: newMethod.id,
      type: newMethod.type,
      account_type: newMethod.accountType || "Personal",
      account_number: newMethod.accountNumber,
      account_holder: newMethod.accountHolder,
      bank_name: newMethod.bankName || null,
      branch_name: newMethod.branchName || null,
      routing_number: newMethod.routingNumber || null,
      is_primary: Boolean(newMethod.isPrimary),
      status: newMethod.status || "VERIFIED",
    };

    if (userId) {
      // Check if user exists in public.users to avoid foreign key failure
      const { data: userRow } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();
      if (userRow) {
        insertRow.user_id = userId;
      }
    }

    if (newMethod.isPrimary) {
      // Reset other primary flags in Supabase
      await supabase.from("payout_methods").update({ is_primary: false }).neq("id", newMethod.id);
    }

    const { error } = await supabase.from("payout_methods").insert(insertRow);
    if (error) {
      console.error("Supabase insert payout_methods error:", error.message);
    } else {
      console.log("Supabase insert payout_methods SUCCESS:", newMethod.id);
    }
  } catch (err) {
    console.error("Failed to insert payout method to Supabase:", err);
  }

  return localList;
}

export async function removeLivePayoutMethod(
  supabase: SupabaseClient,
  id: string
): Promise<PayoutMethod[]> {
  const localList = removeStoredPayoutMethod(id);

  try {
    const { error } = await supabase.from("payout_methods").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete payout_methods error:", error.message);
    }
  } catch (err) {
    console.error("Failed to delete payout method from Supabase:", err);
  }

  return localList;
}

export async function setPrimaryLivePayoutMethod(
  supabase: SupabaseClient,
  id: string
): Promise<PayoutMethod[]> {
  const localList = setPrimaryStoredPayoutMethod(id);

  try {
    await supabase.from("payout_methods").update({ is_primary: false }).neq("id", id);
    await supabase.from("payout_methods").update({ is_primary: true }).eq("id", id);
  } catch (err) {
    console.error("Failed to set primary payout method in Supabase:", err);
  }

  return localList;
}

// -----------------------------------------------------------------------------
// WALLET LEDGER
// -----------------------------------------------------------------------------

export function getStoredWalletLedger(): WalletEntry[] {
  if (typeof window === "undefined") return FREELANCER_LEDGER;
  try {
    const raw = localStorage.getItem(WALLET_LEDGER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WALLET_LEDGER_STORAGE_KEY, JSON.stringify(FREELANCER_LEDGER));
      return FREELANCER_LEDGER;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : FREELANCER_LEDGER;
  } catch {
    return FREELANCER_LEDGER;
  }
}

export function recordStoredWalletEntry(entry: WalletEntry): WalletEntry[] {
  const current = getStoredWalletLedger();
  const updated = [entry, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(WALLET_LEDGER_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to record wallet entry:", e);
    }
  }
  return updated;
}
