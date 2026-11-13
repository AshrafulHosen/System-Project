-- Platform fee: 10% -> 7%
--
-- The product's published fee (bid, escrow and job-post previews, signup/login
-- copy) is 7%. The database still defaulted new contracts and payments to 10%.
-- This migration aligns the database with the 7% rate for NEW records only.
--
-- Existing contracts/payments keep the platform_fee_pct they were created with,
-- so historical ledger entries and already-agreed contract splits are unchanged.

ALTER TABLE public.contracts ALTER COLUMN platform_fee_pct SET DEFAULT 7.00;
ALTER TABLE public.payments  ALTER COLUMN platform_fee_pct SET DEFAULT 7.00;

-- Re-create the contracts guard with the 7% rate. Body is identical to
-- 20261111010000_harden_contracts_trigger_context.sql except for the fee rate.
CREATE OR REPLACE FUNCTION public.contracts_before_write_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_client_id UUID;
  v_freelancer_id UUID;
  v_bid_amount NUMERIC(12, 2);
  v_prop_status TEXT;
  v_trusted BOOLEAN;
BEGIN
  v_trusted := public.is_trusted_payment_context();

  IF TG_OP = 'INSERT' THEN
    IF NEW.proposal_id IS NOT NULL THEN
      SELECT p.project_id, pr.client_id, p.freelancer_id, p.bid_amount, p.status
      INTO v_project_id, v_client_id, v_freelancer_id, v_bid_amount, v_prop_status
      FROM public.proposals p
      JOIN public.projects pr ON pr.id = p.project_id
      WHERE p.id = NEW.proposal_id;

      IF NOT v_trusted AND LOWER(COALESCE(v_prop_status, '')) <> 'accepted' THEN
        RAISE EXCEPTION 'Cannot create a contract before the proposal is accepted.';
      END IF;

      NEW.project_id := COALESCE(NEW.project_id, v_project_id);
      NEW.client_id := COALESCE(NEW.client_id, v_client_id);
      NEW.freelancer_id := COALESCE(NEW.freelancer_id, v_freelancer_id);

      IF NOT v_trusted AND v_bid_amount IS NOT NULL AND v_bid_amount > 0 THEN
        NEW.total_amount := v_bid_amount;
      END IF;
    END IF;

    IF NEW.contract_code IS NULL OR NEW.contract_code = '' THEN
      NEW.contract_code := 'MK-CTR-' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 6));
    END IF;

    IF NOT v_trusted THEN
      -- Browser contract creation must always start active + UNPAID/NOT_STARTED with zero escrow/released
      NEW.status := 'active';
      NEW.platform_fee_pct := 7.00;
      NEW.platform_fee_amount := ROUND(NEW.total_amount * 0.07, 2);
      NEW.freelancer_payable_amount := NEW.total_amount - NEW.platform_fee_amount;
      NEW.funded_amount := 0;
      NEW.released_amount := 0;
      NEW.refunded_amount := 0;
      NEW.payment_status := 'UNPAID';
      NEW.work_status := 'NOT_STARTED';
      NEW.funded_at := NULL;
      NEW.work_started_at := NULL;
      NEW.submitted_at := NULL;
      NEW.approved_at := NULL;
      NEW.released_at := NULL;
      NEW.refunded_at := NULL;
    ELSE
      NEW.platform_fee_pct := COALESCE(NEW.platform_fee_pct, 7.00);
      IF COALESCE(NEW.platform_fee_amount, 0) = 0 THEN
        NEW.platform_fee_amount := ROUND(NEW.total_amount * (NEW.platform_fee_pct / 100.0), 2);
        NEW.freelancer_payable_amount := NEW.total_amount - NEW.platform_fee_amount;
      END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NOT v_trusted THEN
    IF (
      NEW.total_amount IS DISTINCT FROM OLD.total_amount
      OR NEW.client_id IS DISTINCT FROM OLD.client_id
      OR NEW.freelancer_id IS DISTINCT FROM OLD.freelancer_id
      OR NEW.project_id IS DISTINCT FROM OLD.project_id
      OR NEW.platform_fee_pct IS DISTINCT FROM OLD.platform_fee_pct
      OR NEW.platform_fee_amount IS DISTINCT FROM OLD.platform_fee_amount
      OR NEW.freelancer_payable_amount IS DISTINCT FROM OLD.freelancer_payable_amount
      OR NEW.funded_amount IS DISTINCT FROM OLD.funded_amount
      OR NEW.released_amount IS DISTINCT FROM OLD.released_amount
      OR NEW.refunded_amount IS DISTINCT FROM OLD.refunded_amount
      OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
      OR NEW.work_status IS DISTINCT FROM OLD.work_status
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.funded_at IS DISTINCT FROM OLD.funded_at
      OR NEW.work_started_at IS DISTINCT FROM OLD.work_started_at
      OR NEW.submission_notes IS DISTINCT FROM OLD.submission_notes
      OR NEW.submission_demo_url IS DISTINCT FROM OLD.submission_demo_url
      OR NEW.submission_files IS DISTINCT FROM OLD.submission_files
      OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
      OR NEW.revision_feedback IS DISTINCT FROM OLD.revision_feedback
      OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
      OR NEW.released_at IS DISTINCT FROM OLD.released_at
      OR NEW.refunded_at IS DISTINCT FROM OLD.refunded_at
    ) THEN
      RAISE EXCEPTION 'Direct client modification of financial, payment, or work-approval fields on contracts is forbidden. Use trusted API endpoints.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

