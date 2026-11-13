export const DEFAULT_PLATFORM_FEE_PCT = 7;
export const SUPPORTED_CURRENCY = "BDT" as const;
export const MIN_SSLCOMMERZ_AMOUNT_BDT = 10;

export interface FeeBreakdown {
  grossAmount: number;
  platformFeePct: number;
  platformFeeAmount: number;
  freelancerPayableAmount: number;
}

export function roundBdt(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Computes exact 2-decimal BDT split such that
 * grossAmount === platformFeeAmount + freelancerPayableAmount.
 */
export function calculateContractFeeBreakdown(
  totalAmountBdt: number,
  feePct: number = DEFAULT_PLATFORM_FEE_PCT
): FeeBreakdown {
  const grossAmount = roundBdt(Math.max(0, totalAmountBdt));
  const safeFeePct = roundBdt(Math.min(50, Math.max(0, feePct)));
  const platformFeeAmount = roundBdt(grossAmount * (safeFeePct / 100));
  const freelancerPayableAmount = roundBdt(grossAmount - platformFeeAmount);

  return {
    grossAmount,
    platformFeePct: safeFeePct,
    platformFeeAmount,
    freelancerPayableAmount,
  };
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
  );
}

/**
 * Extracts the proposal UUID from synthetic fallback contract IDs formatted as
 * `ctr-<proposalUuid>` (generated before a `public.contracts` row existed).
 */
export function parseProposalContractAlias(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^ctr-/i.test(trimmed)) return null;
  const candidate = trimmed.slice(4);
  return isUuid(candidate) ? candidate : null;
}

