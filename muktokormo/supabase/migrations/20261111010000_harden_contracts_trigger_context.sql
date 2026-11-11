-- =============================================================================
-- MuktoKormo Security Hardening Patch (Phase 10 Audit)
--
-- Root Cause Fixed:
--   Previously, `public.contracts_before_write_guard()` was declared
--   `SECURITY DEFINER`, which switched `current_user` to `postgres` inside the
--   trigger, and `public.is_trusted_payment_context()` checked `current_user`
--   BEFORE PostgREST's JWT role (`request.jwt.claims` / `request.jwt.claim.role`).
--   That allowed an authenticated browser session holding an `authenticated`
--   JWT to bypass the contracts financial update trigger.
--
-- Fix:
--   1. Inspect PostgREST JWT role FIRST in `is_trusted_payment_context()`. If a
--      JWT role is present and is NOT `service_role`, immediately return FALSE.
--   2. Change `contracts_before_write_guard()` from `SECURITY DEFINER` to
--      `SECURITY INVOKER` (and pin `search_path = public` on all guard functions).
--
-- Target: Supabase PostgreSQL (Run in Supabase Dashboard -> SQL Editor)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_trusted_payment_context()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_claim_role TEXT;
  v_claims_raw TEXT;
  v_jwt_role   TEXT;
BEGIN
  -- 1. Extract JWT role from PostgREST request context (supports both legacy & v12+ GUCs)
  v_claim_role := NULLIF(current_setting('request.jwt.claim.role', TRUE), '');
  v_claims_raw := NULLIF(current_setting('request.jwt.claims', TRUE), '');

  IF v_claims_raw IS NOT NULL THEN
    BEGIN
      v_jwt_role := NULLIF(v_claims_raw::jsonb ->> 'role', '');
    EXCEPTION WHEN OTHERS THEN
      v_jwt_role := NULL;
    END;
  END IF;

  v_jwt_role := COALESCE(v_claim_role, v_jwt_role);

  -- 2. Any HTTP/PostgREST request carrying an `authenticated` or `anon` JWT
  --    MUST return FALSE, even if invoked via a trigger or helper function.
  IF v_jwt_role IS NOT NULL THEN
    IF v_jwt_role = 'service_role' THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  -- 3. Explicit transaction-local bypass enabled inside trusted backend RPCs
  IF COALESCE(current_setting('app.bypass_financial_guard', TRUE), '') = 'on' THEN
    RETURN TRUE;
  END IF;

  -- 4. Direct privileged connections without PostgREST JWT (migrations / SQL Editor)
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

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
      NEW.platform_fee_pct := 10.00;
      NEW.platform_fee_amount := ROUND(NEW.total_amount * 0.10, 2);
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
      NEW.platform_fee_pct := COALESCE(NEW.platform_fee_pct, 10.00);
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

CREATE OR REPLACE FUNCTION public.freelancers_earnings_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF (NEW.earned_bdt IS DISTINCT FROM OLD.earned_bdt) AND NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Direct client modification of freelancers.earned_bdt is forbidden.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    IF (
      NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.role_target IS DISTINCT FROM OLD.role_target
      OR NEW.contract_id IS DISTINCT FROM OLD.contract_id
      OR NEW.payment_id IS DISTINCT FROM OLD.payment_id
      OR NEW.event_key IS DISTINCT FROM OLD.event_key
      OR NEW.title IS DISTINCT FROM OLD.title
      OR NEW.message IS DISTINCT FROM OLD.message
      OR NEW.title_bn IS DISTINCT FROM OLD.title_bn
      OR NEW.message_bn IS DISTINCT FROM OLD.message_bn
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    ) THEN
      RAISE EXCEPTION 'Only is_read and read_at may be updated by notification owners.';
    END IF;
    IF NEW.is_read = TRUE AND NEW.read_at IS NULL THEN
      NEW.read_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

