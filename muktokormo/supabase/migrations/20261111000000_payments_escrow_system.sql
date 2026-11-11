-- =============================================================================
-- MuktoKormo Phase 2 Migration: SSLCOMMERZ Sandbox Payments, Internal Escrow Ledger,
-- Work Lifecycle, Refund Requests, Notifications & Strict Financial Security
--
-- Target: Supabase PostgreSQL (Run in Supabase Dashboard -> SQL Editor)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. SHARED TRIGGER HELPERS & TRUSTED CONTEXT CHECKS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Safe helper for admin check (idempotent with 20261013000000_admin_role.sql)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id    UUID PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  note       VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN uid IS NULL THEN FALSE
    ELSE EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = uid)
  END;
$$;

-- Checks whether current execution is running as trusted backend service_role,
-- an internal SECURITY DEFINER financial RPC, or SQL Editor superuser.
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
  -- 1. Extract JWT role from PostgREST request context first
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

  -- 2. Never trust current_user when handling an authenticated/anon HTTP request
  IF v_jwt_role IS NOT NULL THEN
    IF v_jwt_role = 'service_role' THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  -- 3. Explicit transaction-local bypass enabled inside trusted SECURITY DEFINER RPCs
  IF COALESCE(current_setting('app.bypass_financial_guard', TRUE), '') = 'on' THEN
    RETURN TRUE;
  END IF;

  -- 4. Direct privileged sessions without PostgREST JWT (migrations / SQL Editor)
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. EXTEND CONTRACTS FOR FULL PAYMENT, ESCROW & WORK DELIVERY LIFECYCLE
-- -----------------------------------------------------------------------------

-- Drop legacy case-sensitive contracts status check cleanly so both lowercase
-- and uppercase status values remain compatible across existing code & RPCs.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.contracts'::regclass
      AND contype = 'c'
      AND (
        conname = 'contracts_status_check'
        OR pg_get_constraintdef(oid) ~* 'CHECK\s*\(\s*\(?\s*status\s'
      )
  )
  LOOP
    EXECUTE 'ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS freelancer_id UUID REFERENCES public.freelancers (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS contract_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS platform_fee_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freelancer_payable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS funded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS released_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(24) NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS work_status VARCHAR(24) NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS funded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submission_notes TEXT,
  ADD COLUMN IF NOT EXISTS submission_demo_url TEXT,
  ADD COLUMN IF NOT EXISTS submission_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_feedback TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('active', 'completed', 'disputed', 'terminated', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'TERMINATED'));

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_currency_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_currency_check
  CHECK (currency = 'BDT');

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_fee_pct_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_fee_pct_check
  CHECK (platform_fee_pct >= 0 AND platform_fee_pct <= 50);

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_amounts_non_neg_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_amounts_non_neg_check
  CHECK (
    total_amount > 0
    AND platform_fee_amount >= 0
    AND freelancer_payable_amount >= 0
    AND funded_amount >= 0
    AND released_amount >= 0
    AND refunded_amount >= 0
  );

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_payment_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_payment_status_check
  CHECK (payment_status IN ('UNPAID', 'PENDING', 'FUNDED', 'FAILED', 'CANCELLED', 'RELEASED', 'REFUNDED', 'DISPUTED'));

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_work_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_work_status_check
  CHECK (work_status IN ('NOT_STARTED', 'FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'RELEASED', 'DISPUTED', 'REFUNDED'));

-- Backfill client_id, freelancer_id, project_id & calculated amounts on existing contracts
UPDATE public.contracts ct
SET
  project_id = COALESCE(ct.project_id, pr.id),
  client_id = COALESCE(ct.client_id, pr.client_id),
  freelancer_id = COALESCE(ct.freelancer_id, p.freelancer_id),
  contract_code = COALESCE(ct.contract_code, 'MK-CTR-' || UPPER(SUBSTRING(ct.id::text FROM 1 FOR 6))),
  platform_fee_amount = CASE
    WHEN COALESCE(ct.platform_fee_amount, 0) = 0 THEN ROUND(ct.total_amount * (ct.platform_fee_pct / 100.0), 2)
    ELSE ct.platform_fee_amount
  END,
  freelancer_payable_amount = CASE
    WHEN COALESCE(ct.freelancer_payable_amount, 0) = 0 THEN ct.total_amount - ROUND(ct.total_amount * (ct.platform_fee_pct / 100.0), 2)
    ELSE ct.freelancer_payable_amount
  END
FROM public.proposals p
JOIN public.projects pr ON pr.id = p.project_id
WHERE ct.proposal_id = p.id;

-- Backfill contract_code for any contracts without a proposal link
UPDATE public.contracts ct
SET
  contract_code = 'MK-CTR-' || UPPER(SUBSTRING(ct.id::text FROM 1 FOR 6)),
  platform_fee_amount = CASE
    WHEN COALESCE(ct.platform_fee_amount, 0) = 0 THEN ROUND(ct.total_amount * (ct.platform_fee_pct / 100.0), 2)
    ELSE ct.platform_fee_amount
  END,
  freelancer_payable_amount = CASE
    WHEN COALESCE(ct.freelancer_payable_amount, 0) = 0 THEN ct.total_amount - ROUND(ct.total_amount * (ct.platform_fee_pct / 100.0), 2)
    ELSE ct.freelancer_payable_amount
  END
WHERE ct.contract_code IS NULL;

CREATE INDEX IF NOT EXISTS contracts_client_id_idx ON public.contracts (client_id);
CREATE INDEX IF NOT EXISTS contracts_freelancer_id_idx ON public.contracts (freelancer_id);
CREATE INDEX IF NOT EXISTS contracts_project_id_idx ON public.contracts (project_id);
CREATE INDEX IF NOT EXISTS contracts_payment_status_idx ON public.contracts (payment_status);
CREATE INDEX IF NOT EXISTS contracts_work_status_idx ON public.contracts (work_status);

-- Trigger: enforce authentic party links & fee math on contract insert,
-- and protect financial/escrow/status fields from untrusted browser updates.
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

DROP TRIGGER IF EXISTS contracts_before_write_guard_trg ON public.contracts;
CREATE TRIGGER contracts_before_write_guard_trg
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.contracts_before_write_guard();

-- Prevent direct browser modification of freelancers.earned_bdt
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

DROP TRIGGER IF EXISTS freelancers_earnings_guard_trg ON public.freelancers;
CREATE TRIGGER freelancers_earnings_guard_trg
  BEFORE UPDATE ON public.freelancers
  FOR EACH ROW EXECUTE FUNCTION public.freelancers_earnings_guard();

-- -----------------------------------------------------------------------------
-- 3. PAYMENTS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  client_id           UUID NOT NULL REFERENCES public.clients (id) ON DELETE RESTRICT,
  freelancer_id       UUID NOT NULL REFERENCES public.freelancers (id) ON DELETE RESTRICT,
  amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  platform_fee_pct    NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (platform_fee_pct >= 0 AND platform_fee_pct <= 50),
  platform_fee        NUMERIC(12, 2) NOT NULL CHECK (platform_fee >= 0),
  freelancer_amount   NUMERIC(12, 2) NOT NULL CHECK (freelancer_amount >= 0),
  currency            VARCHAR(3) NOT NULL DEFAULT 'BDT' CHECK (currency = 'BDT'),
  transaction_id      VARCHAR(80) NOT NULL UNIQUE,
  status              VARCHAR(24) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'FUNDED', 'FAILED', 'CANCELLED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED')),
  gateway             VARCHAR(32) NOT NULL DEFAULT 'SSLCOMMERZ',
  gateway_session_key TEXT,
  gateway_url         TEXT,
  validation_id       TEXT,
  bank_tran_id        TEXT,
  card_type           TEXT,
  card_brand          TEXT,
  card_issuer         TEXT,
  failure_reason      TEXT,
  initiated_by        UUID REFERENCES public.users (id) ON DELETE SET NULL,
  funded_at           TIMESTAMPTZ,
  released_at         TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_amount_split_check CHECK (amount = platform_fee + freelancer_amount)
);

-- Guarantee at most ONE active funded/released payment per contract even under concurrency
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_settled_per_contract_idx
  ON public.payments (contract_id)
  WHERE status IN ('FUNDED', 'RELEASED', 'REFUND_REQUESTED');

CREATE INDEX IF NOT EXISTS payments_contract_id_idx ON public.payments (contract_id);
CREATE INDEX IF NOT EXISTS payments_client_id_idx ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS payments_freelancer_id_idx ON public.payments (freelancer_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments (created_at DESC);

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. PAYMENT TRANSACTIONS AUDIT LOG TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id             UUID NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  contract_id            UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  event_type             VARCHAR(32) NOT NULL
    CHECK (event_type IN ('INITIATE', 'SUCCESS_CALLBACK', 'FAIL_CALLBACK', 'CANCEL_CALLBACK', 'IPN_CALLBACK', 'VALIDATION_CHECK', 'REFUND_INITIATE', 'REFUND_STATUS')),
  gateway                VARCHAR(32) NOT NULL DEFAULT 'SSLCOMMERZ',
  gateway_transaction_id VARCHAR(80) NOT NULL,
  validation_id          TEXT,
  bank_tran_id           TEXT,
  gateway_status         TEXT NOT NULL,
  amount                 NUMERIC(12, 2),
  currency               VARCHAR(10),
  risk_level             TEXT,
  response_summary       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_transactions_payment_id_idx ON public.payment_transactions (payment_id);
CREATE INDEX IF NOT EXISTS payment_transactions_contract_id_idx ON public.payment_transactions (contract_id);
CREATE INDEX IF NOT EXISTS payment_transactions_tran_id_idx ON public.payment_transactions (gateway_transaction_id);
CREATE INDEX IF NOT EXISTS payment_transactions_created_at_idx ON public.payment_transactions (created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. INTERNAL ESCROW LEDGER TABLE (ACADEMIC TESTING SIMULATION)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.escrow_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id            UUID NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  contract_id           UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  entry_type            VARCHAR(16) NOT NULL CHECK (entry_type IN ('FUND', 'RELEASE', 'REFUND')),
  amount                NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  platform_fee_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (platform_fee_amount >= 0),
  freelancer_net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (freelancer_net_amount >= 0),
  currency              VARCHAR(3) NOT NULL DEFAULT 'BDT' CHECK (currency = 'BDT'),
  is_simulated          BOOLEAN NOT NULL DEFAULT TRUE,
  description           TEXT NOT NULL,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by            UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Strict database-level idempotency: a payment cannot create duplicate entries of the same type
CREATE UNIQUE INDEX IF NOT EXISTS escrow_ledger_unique_payment_entry_idx
  ON public.escrow_ledger (payment_id, entry_type);

-- A contract cannot have duplicate FUND or RELEASE entries
CREATE UNIQUE INDEX IF NOT EXISTS escrow_ledger_unique_contract_fund_release_idx
  ON public.escrow_ledger (contract_id, entry_type)
  WHERE entry_type IN ('FUND', 'RELEASE');

CREATE INDEX IF NOT EXISTS escrow_ledger_contract_id_idx ON public.escrow_ledger (contract_id);
CREATE INDEX IF NOT EXISTS escrow_ledger_payment_id_idx ON public.escrow_ledger (payment_id);
CREATE INDEX IF NOT EXISTS escrow_ledger_entry_type_idx ON public.escrow_ledger (entry_type);
CREATE INDEX IF NOT EXISTS escrow_ledger_created_at_idx ON public.escrow_ledger (created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. REFUND REQUESTS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           UUID NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  contract_id          UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  requested_by_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  client_id            UUID NOT NULL REFERENCES public.clients (id) ON DELETE RESTRICT,
  freelancer_id        UUID NOT NULL REFERENCES public.freelancers (id) ON DELETE RESTRICT,
  amount               NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason               TEXT NOT NULL,
  status               VARCHAR(24) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'GATEWAY_INITIATED', 'COMPLETED', 'FAILED')),
  refund_mode          VARCHAR(32) NOT NULL DEFAULT 'SIMULATED_INTERNAL'
    CHECK (refund_mode IN ('SIMULATED_INTERNAL', 'SSLCOMMERZ_SANDBOX_API')),
  gateway_refund_ref_id TEXT,
  gateway_status       TEXT,
  admin_notes          TEXT,
  reviewed_by          UUID REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS refund_requests_one_open_per_payment_idx
  ON public.refund_requests (payment_id)
  WHERE status IN ('PENDING', 'APPROVED', 'GATEWAY_INITIATED', 'COMPLETED');

CREATE INDEX IF NOT EXISTS refund_requests_contract_id_idx ON public.refund_requests (contract_id);
CREATE INDEX IF NOT EXISTS refund_requests_client_id_idx ON public.refund_requests (client_id);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON public.refund_requests (status);
CREATE INDEX IF NOT EXISTS refund_requests_created_at_idx ON public.refund_requests (created_at DESC);

DROP TRIGGER IF EXISTS refund_requests_set_updated_at ON public.refund_requests;
CREATE TRIGGER refund_requests_set_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE (DEDUPLICATED LIFECYCLE ALERTS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  role_target VARCHAR(16) NOT NULL CHECK (role_target IN ('client', 'freelancer', 'admin')),
  contract_id UUID REFERENCES public.contracts (id) ON DELETE CASCADE,
  payment_id  UUID REFERENCES public.payments (id) ON DELETE CASCADE,
  event_key   VARCHAR(120) NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  title_bn    TEXT,
  message_bn  TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_unique_user_event UNIQUE (user_id, event_key)
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id, is_read, created_at DESC);

-- Prevent users from modifying anything except read status on notifications
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

DROP TRIGGER IF EXISTS notifications_update_guard_trg ON public.notifications;
CREATE TRIGGER notifications_update_guard_trg
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_update_guard();

-- -----------------------------------------------------------------------------
-- 8. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- payments: SELECT only (no browser INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS payments_select_client_own ON public.payments;
CREATE POLICY payments_select_client_own ON public.payments
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS payments_select_freelancer_settled ON public.payments;
CREATE POLICY payments_select_freelancer_settled ON public.payments
  FOR SELECT TO authenticated
  USING (
    status IN ('FUNDED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED')
    AND freelancer_id IN (SELECT f.id FROM public.freelancers f WHERE f.user_id = auth.uid())
  );

DROP POLICY IF EXISTS payments_select_admin ON public.payments;
CREATE POLICY payments_select_admin ON public.payments
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- payment_transactions: SELECT only for owning client & admin (gateway payload log)
DROP POLICY IF EXISTS payment_transactions_select_client_own ON public.payment_transactions;
CREATE POLICY payment_transactions_select_client_own ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (
    payment_id IN (
      SELECT p.id FROM public.payments p
      JOIN public.clients c ON c.id = p.client_id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payment_transactions_select_admin ON public.payment_transactions;
CREATE POLICY payment_transactions_select_admin ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- escrow_ledger: SELECT only for contract parties & admin
DROP POLICY IF EXISTS escrow_ledger_select_parties ON public.escrow_ledger;
CREATE POLICY escrow_ledger_select_parties ON public.escrow_ledger
  FOR SELECT TO authenticated
  USING (
    contract_id IN (
      SELECT ct.id FROM public.contracts ct
      WHERE ct.client_id IN (SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid())
         OR ct.freelancer_id IN (SELECT f.id FROM public.freelancers f WHERE f.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS escrow_ledger_select_admin ON public.escrow_ledger;
CREATE POLICY escrow_ledger_select_admin ON public.escrow_ledger
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- refund_requests: SELECT only for parties & admin (mutations happen server-side)
DROP POLICY IF EXISTS refund_requests_select_parties ON public.refund_requests;
CREATE POLICY refund_requests_select_parties ON public.refund_requests
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid())
    OR freelancer_id IN (SELECT f.id FROM public.freelancers f WHERE f.user_id = auth.uid())
  );

DROP POLICY IF EXISTS refund_requests_select_admin ON public.refund_requests;
CREATE POLICY refund_requests_select_admin ON public.refund_requests
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- notifications: SELECT own/admin, UPDATE own read flags only
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure contracts direct client/freelancer SELECT works cleanly even when using new FKs
DROP POLICY IF EXISTS contracts_select_direct_parties ON public.contracts;
CREATE POLICY contracts_select_direct_parties ON public.contracts
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid())
    OR freelancer_id IN (SELECT f.id FROM public.freelancers f WHERE f.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 9. ATOMIC POSTGRESQL FINANCIAL RPC FUNCTIONS (SERVER-ONLY EXECUTION)
-- -----------------------------------------------------------------------------

-- A. Atomic, idempotent settlement after SSLCOMMERZ validation API verification
CREATE OR REPLACE FUNCTION public.settle_funded_payment(
  p_transaction_id TEXT,
  p_validation_id TEXT,
  p_bank_tran_id TEXT,
  p_gateway_status TEXT,
  p_validated_amount NUMERIC,
  p_validated_currency TEXT,
  p_card_type TEXT DEFAULT NULL,
  p_card_brand TEXT DEFAULT NULL,
  p_card_issuer TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT 'VALIDATION_CHECK',
  p_response_summary JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_contract public.contracts%ROWTYPE;
  v_client_user_id UUID;
  v_freelancer_user_id UUID;
  v_project_title TEXT;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized financial RPC execution';
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE transaction_id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'PAYMENT_NOT_FOUND');
  END IF;

  -- Log every gateway verification check into audit history
  INSERT INTO public.payment_transactions (
    payment_id, contract_id, event_type, gateway, gateway_transaction_id,
    validation_id, bank_tran_id, gateway_status, amount, currency,
    risk_level, response_summary
  )
  VALUES (
    v_payment.id,
    v_payment.contract_id,
    CASE WHEN p_event_type IN ('INITIATE', 'SUCCESS_CALLBACK', 'FAIL_CALLBACK', 'CANCEL_CALLBACK', 'IPN_CALLBACK', 'VALIDATION_CHECK') THEN p_event_type ELSE 'VALIDATION_CHECK' END,
    'SSLCOMMERZ',
    v_payment.transaction_id,
    p_validation_id,
    p_bank_tran_id,
    COALESCE(p_gateway_status, 'UNKNOWN'),
    p_validated_amount,
    UPPER(COALESCE(p_validated_currency, '')),
    p_response_summary ->> 'risk_level',
    COALESCE(p_response_summary, '{}'::jsonb)
  );

  -- Strict idempotency for duplicate IPN / repeated success redirects
  IF v_payment.status IN ('FUNDED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED') THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'already_settled', TRUE,
      'payment_id', v_payment.id,
      'contract_id', v_payment.contract_id,
      'status', v_payment.status
    );
  END IF;

  IF v_payment.status <> 'PENDING' THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'INVALID_PAYMENT_STATE',
      'current_status', v_payment.status
    );
  END IF;

  -- Verify gateway validation status
  IF UPPER(COALESCE(p_gateway_status, '')) NOT IN ('VALID', 'VALIDATED') THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'GATEWAY_STATUS_NOT_VALID',
      'gateway_status', p_gateway_status
    );
  END IF;

  -- Strict amount & currency checks
  IF p_validated_amount IS NULL OR ROUND(p_validated_amount, 2) <> ROUND(v_payment.amount, 2) THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'AMOUNT_MISMATCH',
      'expected', v_payment.amount,
      'received', p_validated_amount
    );
  END IF;

  IF UPPER(COALESCE(p_validated_currency, '')) <> UPPER(v_payment.currency) THEN
    RETURN jsonb_build_object(
      'ok', FALSE,
      'code', 'CURRENCY_MISMATCH',
      'expected', v_payment.currency,
      'received', p_validated_currency
    );
  END IF;

  -- Lock parent contract
  SELECT *
  INTO v_contract
  FROM public.contracts
  WHERE id = v_payment.contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_NOT_FOUND');
  END IF;

  IF v_contract.payment_status IN ('FUNDED', 'RELEASED') THEN
    RETURN jsonb_build_object(
      'ok', TRUE,
      'already_settled', TRUE,
      'payment_id', v_payment.id,
      'contract_id', v_payment.contract_id,
      'status', v_contract.payment_status
    );
  END IF;

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  -- Update payment row
  UPDATE public.payments
  SET
    status = 'FUNDED',
    validation_id = COALESCE(NULLIF(p_validation_id, ''), validation_id),
    bank_tran_id = COALESCE(NULLIF(p_bank_tran_id, ''), bank_tran_id),
    card_type = COALESCE(p_card_type, card_type),
    card_brand = COALESCE(p_card_brand, card_brand),
    card_issuer = COALESCE(p_card_issuer, card_issuer),
    failure_reason = NULL,
    funded_at = NOW()
  WHERE id = v_payment.id;

  -- Update contract financial & work status
  UPDATE public.contracts
  SET
    payment_status = 'FUNDED',
    work_status = CASE WHEN work_status = 'NOT_STARTED' THEN 'FUNDED' ELSE work_status END,
    funded_amount = v_payment.amount,
    platform_fee_pct = v_payment.platform_fee_pct,
    platform_fee_amount = v_payment.platform_fee,
    freelancer_payable_amount = v_payment.freelancer_amount,
    funded_at = NOW()
  WHERE id = v_payment.contract_id;

  -- Record simulated internal FUND entry in escrow_ledger (idempotent via unique indexes)
  INSERT INTO public.escrow_ledger (
    payment_id, contract_id, entry_type, amount, platform_fee_amount, freelancer_net_amount,
    currency, is_simulated, description, metadata, created_by
  )
  VALUES (
    v_payment.id,
    v_payment.contract_id,
    'FUND',
    v_payment.amount,
    v_payment.platform_fee,
    v_payment.freelancer_amount,
    v_payment.currency,
    TRUE,
    'Simulated internal escrow funding confirmed via SSLCOMMERZ Sandbox (' || v_payment.transaction_id || '). Note: Funds are tracked in internal academic simulation ledger.',
    jsonb_build_object('transaction_id', v_payment.transaction_id, 'validation_id', p_validation_id, 'card_type', p_card_type),
    v_payment.initiated_by
  )
  ON CONFLICT DO NOTHING;

  -- Resolve party user IDs & title for deduplicated notifications
  SELECT user_id INTO v_client_user_id FROM public.clients WHERE id = v_payment.client_id;
  SELECT user_id INTO v_freelancer_user_id FROM public.freelancers WHERE id = v_payment.freelancer_id;
  SELECT COALESCE(pr.title, 'Contract ' || COALESCE(v_contract.contract_code, ''))
  INTO v_project_title
  FROM public.projects pr
  WHERE pr.id = v_contract.project_id;

  v_project_title := COALESCE(v_project_title, 'Contract ' || COALESCE(v_contract.contract_code, ''));

  IF v_client_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, role_target, contract_id, payment_id, event_key, title, message, title_bn, message_bn
    )
    VALUES (
      v_client_user_id,
      'client',
      v_payment.contract_id,
      v_payment.id,
      'payment_funded:' || v_payment.id::text,
      'Payment Successful',
      'Payment of ৳' || TRIM(TO_CHAR(v_payment.amount, 'FM999,999,990.00')) || ' for "' || v_project_title || '" is verified and recorded as funded (simulated escrow).',
      'পেমেন্ট সফল হয়েছে',
      '"' || v_project_title || '"-এর জন্য ৳' || TRIM(TO_CHAR(v_payment.amount, 'FM999,999,990.00')) || ' পেমেন্ট যাচাই ও এসক্রো লেজারে যুক্ত হয়েছে।'
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  IF v_freelancer_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, role_target, contract_id, payment_id, event_key, title, message, title_bn, message_bn
    )
    VALUES (
      v_freelancer_user_id,
      'freelancer',
      v_payment.contract_id,
      v_payment.id,
      'contract_funded:' || v_payment.id::text,
      'Contract Funded',
      'Client funded "' || v_project_title || '" (৳' || TRIM(TO_CHAR(v_payment.amount, 'FM999,999,990.00')) || '; net payable after ' || v_payment.platform_fee_pct || '% fee: ৳' || TRIM(TO_CHAR(v_payment.freelancer_amount, 'FM999,999,990.00')) || '). You can now start working.',
      'কন্ট্রাক্ট ফান্ড হয়েছে',
      'ক্লায়েন্ট "' || v_project_title || '" ফান্ড করেছেন। এখন কাজ শুরু করতে পারেন।'
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'already_settled', FALSE,
    'payment_id', v_payment.id,
    'contract_id', v_payment.contract_id,
    'status', 'FUNDED'
  );
END;
$$;

-- B. Atomic internal ledger release upon client work approval (prevents duplicate release)
CREATE OR REPLACE FUNCTION public.release_escrow_payment(
  p_contract_id UUID,
  p_actor_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.contracts%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_client_user_id UUID;
  v_freelancer_user_id UUID;
  v_project_title TEXT;
  v_fee NUMERIC(12, 2);
  v_freelancer_net NUMERIC(12, 2);
  v_release_exists BOOLEAN;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized financial RPC execution';
  END IF;

  SELECT *
  INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_NOT_FOUND');
  END IF;

  SELECT user_id INTO v_client_user_id FROM public.clients WHERE id = v_contract.client_id;
  SELECT user_id INTO v_freelancer_user_id FROM public.freelancers WHERE id = v_contract.freelancer_id;

  IF v_client_user_id IS NULL OR v_client_user_id <> p_actor_user_id THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_NOT_CONTRACT_CLIENT');
  END IF;

  IF v_contract.payment_status = 'RELEASED' OR v_contract.work_status = 'RELEASED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'ALREADY_RELEASED');
  END IF;

  IF v_contract.payment_status <> 'FUNDED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_NOT_FUNDED');
  END IF;

  IF v_contract.work_status <> 'SUBMITTED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'WORK_NOT_SUBMITTED');
  END IF;

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE contract_id = p_contract_id AND status = 'FUNDED'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FUNDED_PAYMENT_NOT_FOUND');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.escrow_ledger WHERE contract_id = p_contract_id AND entry_type = 'RELEASE'
  ) INTO v_release_exists;

  IF v_release_exists THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'ALREADY_RELEASED');
  END IF;

  v_fee := ROUND(v_payment.amount * (v_contract.platform_fee_pct / 100.0), 2);
  v_freelancer_net := v_payment.amount - v_fee;

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  UPDATE public.payments
  SET
    status = 'RELEASED',
    platform_fee = v_fee,
    freelancer_amount = v_freelancer_net,
    released_at = NOW()
  WHERE id = v_payment.id;

  UPDATE public.contracts
  SET
    payment_status = 'RELEASED',
    work_status = 'RELEASED',
    status = CASE WHEN status = UPPER(status) THEN 'COMPLETED' ELSE 'completed' END,
    platform_fee_amount = v_fee,
    freelancer_payable_amount = v_freelancer_net,
    released_amount = v_payment.amount,
    approved_at = NOW(),
    released_at = NOW()
  WHERE id = v_contract.id;

  UPDATE public.freelancers
  SET earned_bdt = COALESCE(earned_bdt, 0) + v_freelancer_net
  WHERE id = v_contract.freelancer_id;

  INSERT INTO public.escrow_ledger (
    payment_id, contract_id, entry_type, amount, platform_fee_amount, freelancer_net_amount,
    currency, is_simulated, description, metadata, created_by
  )
  VALUES (
    v_payment.id,
    v_contract.id,
    'RELEASE',
    v_payment.amount,
    v_fee,
    v_freelancer_net,
    v_payment.currency,
    TRUE,
    'Simulated internal escrow release upon client work approval (Gross: ৳' || v_payment.amount || ', Fee: ৳' || v_fee || ', Freelancer Credit: ৳' || v_freelancer_net || '). Internal ledger entry only.',
    jsonb_build_object('transaction_id', v_payment.transaction_id, 'platform_fee_pct', v_contract.platform_fee_pct),
    p_actor_user_id
  );

  SELECT COALESCE(pr.title, 'Contract ' || COALESCE(v_contract.contract_code, ''))
  INTO v_project_title
  FROM public.projects pr
  WHERE pr.id = v_contract.project_id;
  v_project_title := COALESCE(v_project_title, 'Contract ' || COALESCE(v_contract.contract_code, ''));

  IF v_client_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, role_target, contract_id, payment_id, event_key, title, message, title_bn, message_bn
    )
    VALUES (
      v_client_user_id,
      'client',
      v_contract.id,
      v_payment.id,
      'client_released:' || v_payment.id::text,
      'Work Approved & Payment Released (Simulated Ledger)',
      'You approved "' || v_project_title || '" and recorded an internal release of ৳' || TRIM(TO_CHAR(v_payment.amount, 'FM999,999,990.00')) || ' (Platform fee: ৳' || TRIM(TO_CHAR(v_fee, 'FM999,999,990.00')) || ').',
      'কাজ অনুমোদিত ও পেমেন্ট রিলিজ হয়েছে',
      '"' || v_project_title || '" অনুমোদন ও অভ্যন্তরীণ লেজার রিলিজ সম্পন্ন হয়েছে।'
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  IF v_freelancer_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, role_target, contract_id, payment_id, event_key, title, message, title_bn, message_bn
    )
    VALUES (
      v_freelancer_user_id,
      'freelancer',
      v_contract.id,
      v_payment.id,
      'freelancer_released:' || v_payment.id::text,
      'Work Approved & Earnings Credited (Simulated)',
      'Client approved your submission for "' || v_project_title || '". ৳' || TRIM(TO_CHAR(v_freelancer_net, 'FM999,999,990.00')) || ' net (after ৳' || TRIM(TO_CHAR(v_fee, 'FM999,999,990.00')) || ' fee) credited to your simulated earnings.',
      'কাজ অনুমোদিত ও আয় যুক্ত হয়েছে',
      '"' || v_project_title || '"-এর জন্য ৳' || TRIM(TO_CHAR(v_freelancer_net, 'FM999,999,990.00')) || ' আপনার সিমুলেটেড আয়ে যুক্ত হয়েছে।'
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'contract_id', v_contract.id,
    'payment_id', v_payment.id,
    'gross_amount', v_payment.amount,
    'platform_fee', v_fee,
    'freelancer_net', v_freelancer_net
  );
END;
$$;

-- C. Atomic admin refund decision (simulated internal vs SSLCOMMERZ refund confirmation)
CREATE OR REPLACE FUNCTION public.process_refund_decision(
  p_refund_id UUID,
  p_admin_user_id UUID,
  p_decision TEXT,
  p_refund_mode TEXT DEFAULT 'SIMULATED_INTERNAL',
  p_admin_notes TEXT DEFAULT NULL,
  p_gateway_refund_ref_id TEXT DEFAULT NULL,
  p_gateway_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund public.refund_requests%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_contract public.contracts%ROWTYPE;
  v_client_user_id UUID;
  v_freelancer_user_id UUID;
  v_gateway_confirmed BOOLEAN := FALSE;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized financial RPC execution';
  END IF;

  IF NOT public.is_admin(p_admin_user_id) THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_ADMIN_ONLY');
  END IF;

  SELECT *
  INTO v_refund
  FROM public.refund_requests
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'REFUND_REQUEST_NOT_FOUND');
  END IF;

  IF v_refund.status NOT IN ('PENDING', 'GATEWAY_INITIATED') THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'REFUND_ALREADY_DECIDED', 'current_status', v_refund.status);
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = v_refund.payment_id FOR UPDATE;
  SELECT * INTO v_contract FROM public.contracts WHERE id = v_refund.contract_id FOR UPDATE;

  SELECT user_id INTO v_client_user_id FROM public.clients WHERE id = v_refund.client_id;
  SELECT user_id INTO v_freelancer_user_id FROM public.freelancers WHERE id = v_refund.freelancer_id;

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  IF UPPER(p_decision) = 'REJECT' THEN
    UPDATE public.refund_requests
    SET
      status = 'REJECTED',
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      reviewed_by = p_admin_user_id,
      reviewed_at = NOW()
    WHERE id = v_refund.id;

    -- Restore payment status if it was marked REFUND_REQUESTED
    IF v_payment.status = 'REFUND_REQUESTED' THEN
      UPDATE public.payments SET status = 'FUNDED' WHERE id = v_payment.id;
    END IF;

    IF v_client_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, role_target, contract_id, payment_id, event_key, title, message
      )
      VALUES (
        v_client_user_id,
        'client',
        v_refund.contract_id,
        v_refund.payment_id,
        'refund_rejected:' || v_refund.id::text,
        'Refund Request Rejected',
        'Admin rejected your refund request' || COALESCE(': ' || p_admin_notes, '.')
      )
      ON CONFLICT (user_id, event_key) DO NOTHING;
    END IF;

    IF v_freelancer_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, role_target, contract_id, payment_id, event_key, title, message
      )
      VALUES (
        v_freelancer_user_id,
        'freelancer',
        v_refund.contract_id,
        v_refund.payment_id,
        'refund_rejected_fl:' || v_refund.id::text,
        'Dispute / Refund Request Closed',
        'Admin rejected a refund request on your contract; contract remains funded.'
      )
      ON CONFLICT (user_id, event_key) DO NOTHING;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'REJECTED');
  END IF;

  -- APPROVE path
  IF v_payment.status IN ('RELEASED', 'REFUNDED') THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'PAYMENT_NOT_REFUNDABLE', 'payment_status', v_payment.status);
  END IF;

  v_gateway_confirmed := UPPER(COALESCE(p_gateway_status, '')) IN ('SUCCESS', 'REFUNDED', 'PROCESSING_REFUND_CONFIRMED');

  IF p_refund_mode = 'SSLCOMMERZ_SANDBOX_API' AND NOT v_gateway_confirmed THEN
    -- Never mark a gateway refund completed before gateway confirmation
    UPDATE public.refund_requests
    SET
      status = 'GATEWAY_INITIATED',
      refund_mode = 'SSLCOMMERZ_SANDBOX_API',
      gateway_refund_ref_id = COALESCE(p_gateway_refund_ref_id, gateway_refund_ref_id),
      gateway_status = COALESCE(p_gateway_status, 'INITIATED'),
      admin_notes = COALESCE(p_admin_notes, admin_notes),
      reviewed_by = p_admin_user_id,
      reviewed_at = NOW()
    WHERE id = v_refund.id;

    UPDATE public.payments SET status = 'REFUND_REQUESTED' WHERE id = v_payment.id;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'GATEWAY_INITIATED');
  END IF;

  -- Complete either simulated internal refund OR gateway-confirmed sandbox refund
  UPDATE public.refund_requests
  SET
    status = 'COMPLETED',
    refund_mode = CASE WHEN p_refund_mode = 'SSLCOMMERZ_SANDBOX_API' THEN 'SSLCOMMERZ_SANDBOX_API' ELSE 'SIMULATED_INTERNAL' END,
    gateway_refund_ref_id = COALESCE(p_gateway_refund_ref_id, gateway_refund_ref_id),
    gateway_status = COALESCE(p_gateway_status, CASE WHEN p_refund_mode = 'SIMULATED_INTERNAL' THEN 'SIMULATED_INTERNAL' ELSE 'CONFIRMED' END),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW()
  WHERE id = v_refund.id;

  UPDATE public.payments
  SET status = 'REFUNDED', refunded_at = NOW()
  WHERE id = v_payment.id;

  UPDATE public.contracts
  SET
    payment_status = 'REFUNDED',
    work_status = 'REFUNDED',
    status = CASE WHEN status = UPPER(status) THEN 'TERMINATED' ELSE 'terminated' END,
    refunded_amount = v_refund.amount,
    refunded_at = NOW()
  WHERE id = v_contract.id;

  INSERT INTO public.escrow_ledger (
    payment_id, contract_id, entry_type, amount, platform_fee_amount, freelancer_net_amount,
    currency, is_simulated, description, metadata, created_by
  )
  VALUES (
    v_payment.id,
    v_contract.id,
    'REFUND',
    v_refund.amount,
    0,
    0,
    v_payment.currency,
    (p_refund_mode <> 'SSLCOMMERZ_SANDBOX_API'),
    CASE
      WHEN p_refund_mode = 'SSLCOMMERZ_SANDBOX_API'
        THEN 'SSLCOMMERZ Sandbox gateway refund confirmed (Ref: ' || COALESCE(p_gateway_refund_ref_id, 'N/A') || ').'
      ELSE 'Simulated internal escrow refund approved by Admin (No external bank transfer performed).'
    END,
    jsonb_build_object('refund_id', v_refund.id, 'refund_mode', p_refund_mode, 'gateway_refund_ref_id', p_gateway_refund_ref_id),
    p_admin_user_id
  )
  ON CONFLICT DO NOTHING;

  IF v_client_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, role_target, contract_id, payment_id, event_key, title, message
    )
    VALUES (
      v_client_user_id,
      'client',
      v_refund.contract_id,
      v_refund.payment_id,
      'refund_completed:' || v_refund.id::text,
      CASE WHEN p_refund_mode = 'SSLCOMMERZ_SANDBOX_API' THEN 'Sandbox Gateway Refund Confirmed' ELSE 'Simulated Refund Approved' END,
      'Refund of ৳' || TRIM(TO_CHAR(v_refund.amount, 'FM999,999,990.00')) || ' has been marked Refunded (' || p_refund_mode || ').'
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  IF v_freelancer_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, role_target, contract_id, payment_id, event_key, title, message
    )
    VALUES (
      v_freelancer_user_id,
      'freelancer',
      v_refund.contract_id,
      v_refund.payment_id,
      'refund_completed_fl:' || v_refund.id::text,
      'Contract Refunded',
      'Admin approved a refund on this contract (' || p_refund_mode || '). Escrow simulation closed.'
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'status', 'COMPLETED', 'refund_mode', p_refund_mode);
END;
$$;

-- Restrict financial RPC execution strictly to backend service_role
REVOKE ALL ON FUNCTION public.settle_funded_payment(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_funded_payment(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.release_escrow_payment(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_escrow_payment(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.process_refund_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_refund_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
