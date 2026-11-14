-- =============================================================================
-- Milestone-based contracts & per-milestone escrow
--
-- Design:
--   * Existing contracts keep billing_mode = 'SINGLE' and the original
--     whole-contract payment flow, untouched.
--   * New milestone contracts (billing_mode = 'MILESTONE') fund, submit, approve
--     and release each milestone separately through the SAME payments /
--     escrow_ledger / notifications infrastructure.
--   * All writes go through SECURITY DEFINER RPCs callable only by service_role
--     (Next.js API routes that authenticate the caller first). Browsers can only
--     SELECT rows for contracts they are a party to.
--   * Every state change is written to an append-only milestone_events log.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Contract columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(16) NOT NULL DEFAULT 'SINGLE',
  ADD COLUMN IF NOT EXISTS milestone_plan_status VARCHAR(16) NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS milestone_plan_note TEXT,
  ADD COLUMN IF NOT EXISTS milestone_plan_accepted_at TIMESTAMPTZ;

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_billing_mode_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_billing_mode_check
  CHECK (billing_mode IN ('SINGLE', 'MILESTONE'));

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_milestone_plan_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_milestone_plan_status_check
  CHECK (milestone_plan_status IN ('NONE', 'DRAFT', 'PROPOSED', 'ACCEPTED'));

-- -----------------------------------------------------------------------------
-- 2. Milestones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contract_milestones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  sort_order          INTEGER NOT NULL DEFAULT 1,
  title               VARCHAR(160) NOT NULL CHECK (char_length(btrim(title)) >= 3),
  description         TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  deliverables        TEXT[] NOT NULL DEFAULT '{}',
  amount              NUMERIC(12, 2) NOT NULL CHECK (amount >= 10),
  start_date          DATE,
  deadline            DATE,
  status              VARCHAR(24) NOT NULL DEFAULT 'PENDING',
  agreement_status    VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  cancel_requested_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  revision_count      INTEGER NOT NULL DEFAULT 0 CHECK (revision_count >= 0),
  funded_at           TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  submitted_at        TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  released_at         TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_by          UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contract_milestones_status_check CHECK (status IN (
    'PENDING', 'FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED',
    'APPROVED', 'RELEASED', 'CANCELLED', 'DISPUTED')),
  CONSTRAINT contract_milestones_agreement_check CHECK (agreement_status IN (
    'DRAFT', 'PROPOSED', 'ACCEPTED', 'REJECTED')),
  CONSTRAINT contract_milestones_dates_check CHECK (
    deadline IS NULL OR start_date IS NULL OR deadline >= start_date),
  CONSTRAINT contract_milestones_deliverables_check CHECK (
    cardinality(deliverables) <= 20)
);

CREATE INDEX IF NOT EXISTS contract_milestones_contract_idx
  ON public.contract_milestones (contract_id, sort_order);
CREATE INDEX IF NOT EXISTS contract_milestones_status_idx
  ON public.contract_milestones (status);

DROP TRIGGER IF EXISTS contract_milestones_set_updated_at ON public.contract_milestones;
CREATE TRIGGER contract_milestones_set_updated_at
  BEFORE UPDATE ON public.contract_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Submissions (full revision history per milestone)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milestone_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id    UUID NOT NULL REFERENCES public.contract_milestones (id) ON DELETE RESTRICT,
  contract_id     UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  submitted_by    UUID REFERENCES public.users (id) ON DELETE SET NULL,
  revision_number INTEGER NOT NULL CHECK (revision_number >= 1),
  message         TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 5 AND 4000),
  demo_url        TEXT,
  attachments     JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          VARCHAR(24) NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'SUPERSEDED')),
  review_feedback TEXT,
  reviewed_by     UUID REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT milestone_submissions_unique_revision UNIQUE (milestone_id, revision_number)
);
CREATE INDEX IF NOT EXISTS milestone_submissions_milestone_idx
  ON public.milestone_submissions (milestone_id, revision_number DESC);

-- -----------------------------------------------------------------------------
-- 4. Disputes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milestone_disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id     UUID NOT NULL REFERENCES public.contract_milestones (id) ON DELETE RESTRICT,
  contract_id      UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  raised_by        UUID REFERENCES public.users (id) ON DELETE SET NULL,
  raised_by_role   VARCHAR(16) NOT NULL CHECK (raised_by_role IN ('client', 'freelancer')),
  reason           TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 10 AND 4000),
  previous_status  VARCHAR(24) NOT NULL,
  status           VARCHAR(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  resolution       VARCHAR(32)
    CHECK (resolution IS NULL OR resolution IN ('RELEASE_TO_FREELANCER', 'REFUND_TO_CLIENT', 'RESUME_WORK')),
  resolution_notes TEXT,
  resolved_by      UUID REFERENCES public.users (id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS milestone_disputes_one_open_idx
  ON public.milestone_disputes (milestone_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS milestone_disputes_status_idx
  ON public.milestone_disputes (status, created_at DESC);

DROP TRIGGER IF EXISTS milestone_disputes_set_updated_at ON public.milestone_disputes;
CREATE TRIGGER milestone_disputes_set_updated_at
  BEFORE UPDATE ON public.milestone_disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Append-only audit log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milestone_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id  UUID REFERENCES public.contract_milestones (id) ON DELETE RESTRICT,
  contract_id   UUID NOT NULL REFERENCES public.contracts (id) ON DELETE RESTRICT,
  actor_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  actor_role    VARCHAR(16),
  event_type    VARCHAR(40) NOT NULL,
  from_status   VARCHAR(24),
  to_status     VARCHAR(24),
  details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS milestone_events_contract_idx
  ON public.milestone_events (contract_id, created_at DESC);
CREATE INDEX IF NOT EXISTS milestone_events_milestone_idx
  ON public.milestone_events (milestone_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.milestone_events_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'milestone_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS milestone_events_no_update ON public.milestone_events;
CREATE TRIGGER milestone_events_no_update
  BEFORE UPDATE OR DELETE ON public.milestone_events
  FOR EACH ROW EXECUTE FUNCTION public.milestone_events_immutable();

-- -----------------------------------------------------------------------------
-- 6. Link payments & ledger to milestones; per-milestone idempotency
-- -----------------------------------------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.contract_milestones (id) ON DELETE RESTRICT;
ALTER TABLE public.escrow_ledger
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.contract_milestones (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS payments_milestone_id_idx ON public.payments (milestone_id);
CREATE INDEX IF NOT EXISTS escrow_ledger_milestone_id_idx ON public.escrow_ledger (milestone_id);

-- Single-payment contracts: unchanged guarantee (one settled payment per contract)
DROP INDEX IF EXISTS public.payments_one_settled_per_contract_idx;
CREATE UNIQUE INDEX payments_one_settled_per_contract_idx
  ON public.payments (contract_id)
  WHERE milestone_id IS NULL AND status IN ('FUNDED', 'RELEASED', 'REFUND_REQUESTED');

-- Milestone contracts: one settled payment per milestone
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_settled_per_milestone_idx
  ON public.payments (milestone_id)
  WHERE milestone_id IS NOT NULL AND status IN ('FUNDED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED');

DROP INDEX IF EXISTS public.escrow_ledger_unique_contract_fund_release_idx;
CREATE UNIQUE INDEX escrow_ledger_unique_contract_fund_release_idx
  ON public.escrow_ledger (contract_id, entry_type)
  WHERE milestone_id IS NULL AND entry_type IN ('FUND', 'RELEASE');

CREATE UNIQUE INDEX IF NOT EXISTS escrow_ledger_unique_milestone_entry_idx
  ON public.escrow_ledger (milestone_id, entry_type)
  WHERE milestone_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 7. Row level security — read for contract parties & admins; no browser writes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_contract_party(p_contract_id UUID, p_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN p_uid IS NULL THEN FALSE ELSE EXISTS (
    SELECT 1
    FROM public.contracts ct
    LEFT JOIN public.proposals p ON p.id = ct.proposal_id
    LEFT JOIN public.projects pr ON pr.id = p.project_id
    LEFT JOIN public.clients c ON c.id = COALESCE(ct.client_id, pr.client_id)
    LEFT JOIN public.freelancers f ON f.id = COALESCE(ct.freelancer_id, p.freelancer_id)
    WHERE ct.id = p_contract_id
      AND (c.user_id = p_uid OR f.user_id = p_uid)
  ) END;
$$;

REVOKE ALL ON FUNCTION public.is_contract_party(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_contract_party(UUID, UUID) TO authenticated, service_role;

ALTER TABLE public.contract_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_milestones_select ON public.contract_milestones;
CREATE POLICY contract_milestones_select ON public.contract_milestones
  FOR SELECT TO authenticated
  USING (public.is_contract_party(contract_id, auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS milestone_submissions_select ON public.milestone_submissions;
CREATE POLICY milestone_submissions_select ON public.milestone_submissions
  FOR SELECT TO authenticated
  USING (public.is_contract_party(contract_id, auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS milestone_disputes_select ON public.milestone_disputes;
CREATE POLICY milestone_disputes_select ON public.milestone_disputes
  FOR SELECT TO authenticated
  USING (public.is_contract_party(contract_id, auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS milestone_events_select ON public.milestone_events;
CREATE POLICY milestone_events_select ON public.milestone_events
  FOR SELECT TO authenticated
  USING (public.is_contract_party(contract_id, auth.uid()) OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 8. Internal helpers (never callable by API roles)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._ms_notify(
  p_user_id UUID, p_role TEXT, p_contract_id UUID, p_payment_id UUID,
  p_event_key TEXT, p_title TEXT, p_message TEXT, p_title_bn TEXT, p_message_bn TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (
    user_id, role_target, contract_id, payment_id, event_key, title, message, title_bn, message_bn
  )
  VALUES (p_user_id, p_role, p_contract_id, p_payment_id, LEFT(p_event_key, 120),
          p_title, p_message, p_title_bn, p_message_bn)
  ON CONFLICT (user_id, event_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public._ms_log(
  p_milestone_id UUID, p_contract_id UUID, p_actor UUID, p_actor_role TEXT,
  p_event TEXT, p_from TEXT, p_to TEXT, p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.milestone_events (
    milestone_id, contract_id, actor_user_id, actor_role, event_type, from_status, to_status, details
  )
  VALUES (p_milestone_id, p_contract_id, p_actor, p_actor_role, p_event, p_from, p_to,
          COALESCE(p_details, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public._ms_parties(
  p_contract_id UUID,
  OUT client_user_id UUID, OUT freelancer_user_id UUID,
  OUT client_id UUID, OUT freelancer_id UUID, OUT project_title TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.user_id, f.user_id, c.id, f.id,
         COALESCE(pr.title, 'Contract ' || COALESCE(ct.contract_code, ''))
  FROM public.contracts ct
  LEFT JOIN public.proposals p ON p.id = ct.proposal_id
  LEFT JOIN public.projects pr ON pr.id = COALESCE(ct.project_id, p.project_id)
  LEFT JOIN public.clients c ON c.id = COALESCE(ct.client_id, pr.client_id)
  LEFT JOIN public.freelancers f ON f.id = COALESCE(ct.freelancer_id, p.freelancer_id)
  WHERE ct.id = p_contract_id;
$$;

-- Recomputes a milestone contract's aggregate money & status columns from its
-- milestones and payments. Only ever called inside trusted RPCs.
CREATE OR REPLACE FUNCTION public._ms_recompute_contract(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active INTEGER;
  v_released INTEGER;
  v_disputed INTEGER;
  v_held INTEGER;
  v_pending_pay INTEGER;
  v_total NUMERIC(12, 2);
  v_funded NUMERIC(12, 2);
  v_released_amt NUMERIC(12, 2);
  v_refunded NUMERIC(12, 2);
  v_fee_pct NUMERIC(5, 2);
  v_pay TEXT;
  v_work TEXT;
  v_status TEXT;
  v_cur_status TEXT;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE agreement_status = 'ACCEPTED' AND status <> 'CANCELLED'),
    COUNT(*) FILTER (WHERE agreement_status = 'ACCEPTED' AND status = 'RELEASED'),
    COUNT(*) FILTER (WHERE status = 'DISPUTED'),
    COUNT(*) FILTER (WHERE status IN ('FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED')),
    COALESCE(SUM(amount) FILTER (WHERE agreement_status = 'ACCEPTED' AND status <> 'CANCELLED'), 0)
  INTO v_active, v_released, v_disputed, v_held, v_total
  FROM public.contract_milestones
  WHERE contract_id = p_contract_id;

  SELECT
    COALESCE(SUM(amount) FILTER (WHERE status IN ('FUNDED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED')), 0),
    COALESCE(SUM(amount) FILTER (WHERE status = 'RELEASED'), 0),
    COALESCE(SUM(amount) FILTER (WHERE status = 'REFUNDED'), 0),
    COUNT(*) FILTER (WHERE status = 'PENDING')
  INTO v_funded, v_released_amt, v_refunded, v_pending_pay
  FROM public.payments
  WHERE contract_id = p_contract_id AND milestone_id IS NOT NULL;

  IF v_active > 0 AND v_released = v_active THEN
    v_pay := 'RELEASED';
  ELSIF v_disputed > 0 THEN
    v_pay := 'DISPUTED';
  ELSIF v_held > 0 OR v_released > 0 THEN
    v_pay := 'FUNDED';
  ELSIF v_pending_pay > 0 THEN
    v_pay := 'PENDING';
  ELSE
    v_pay := 'UNPAID';
  END IF;

  SELECT CASE
    WHEN v_active > 0 AND v_released = v_active THEN 'RELEASED'
    WHEN v_disputed > 0 THEN 'DISPUTED'
    WHEN EXISTS (SELECT 1 FROM public.contract_milestones WHERE contract_id = p_contract_id AND status = 'SUBMITTED') THEN 'SUBMITTED'
    WHEN EXISTS (SELECT 1 FROM public.contract_milestones WHERE contract_id = p_contract_id AND status = 'REVISION_REQUESTED') THEN 'REVISION_REQUESTED'
    WHEN EXISTS (SELECT 1 FROM public.contract_milestones WHERE contract_id = p_contract_id AND status = 'IN_PROGRESS') THEN 'IN_PROGRESS'
    WHEN EXISTS (SELECT 1 FROM public.contract_milestones WHERE contract_id = p_contract_id AND status = 'FUNDED') THEN 'FUNDED'
    WHEN EXISTS (SELECT 1 FROM public.contract_milestones WHERE contract_id = p_contract_id AND status = 'APPROVED') THEN 'APPROVED'
    WHEN v_released > 0 THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED'
  END INTO v_work;

  SELECT status, platform_fee_pct INTO v_cur_status, v_fee_pct
  FROM public.contracts WHERE id = p_contract_id;

  IF v_active > 0 AND v_released = v_active THEN
    v_status := 'completed';
  ELSIF v_disputed > 0 THEN
    v_status := 'disputed';
  ELSE
    v_status := 'active';
  END IF;
  IF v_cur_status = UPPER(v_cur_status) THEN
    v_status := UPPER(v_status);
  END IF;

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  UPDATE public.contracts
  SET
    total_amount = CASE WHEN v_total > 0 THEN v_total ELSE total_amount END,
    platform_fee_amount = ROUND(CASE WHEN v_total > 0 THEN v_total ELSE total_amount END * (v_fee_pct / 100.0), 2),
    freelancer_payable_amount = CASE WHEN v_total > 0 THEN v_total ELSE total_amount END
      - ROUND(CASE WHEN v_total > 0 THEN v_total ELSE total_amount END * (v_fee_pct / 100.0), 2),
    funded_amount = v_funded,
    released_amount = v_released_amt,
    refunded_amount = v_refunded,
    payment_status = v_pay,
    work_status = v_work,
    status = v_status,
    released_at = CASE WHEN v_pay = 'RELEASED' THEN COALESCE(released_at, NOW()) ELSE released_at END
  WHERE id = p_contract_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. Milestone settlement (called from settle_funded_payment for milestone payments)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._settle_milestone_payment(
  p_payment_id UUID,
  p_validation_id TEXT,
  p_bank_tran_id TEXT,
  p_card_type TEXT,
  p_card_brand TEXT,
  p_card_issuer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_ms public.contract_milestones%ROWTYPE;
  v_parties RECORD;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  SELECT * INTO v_ms FROM public.contract_milestones WHERE id = v_payment.milestone_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_FOUND');
  END IF;

  IF v_ms.status <> 'PENDING' THEN
    -- Already funded (idempotent duplicate) or no longer fundable
    IF v_ms.funded_at IS NOT NULL THEN
      RETURN jsonb_build_object('ok', TRUE, 'already_settled', TRUE, 'payment_id', v_payment.id,
        'contract_id', v_payment.contract_id, 'milestone_id', v_ms.id, 'status', v_ms.status);
    END IF;
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_FUNDABLE', 'milestone_status', v_ms.status);
  END IF;

  IF v_ms.agreement_status <> 'ACCEPTED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_AGREED');
  END IF;

  IF ROUND(v_ms.amount, 2) <> ROUND(v_payment.amount, 2) THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_AMOUNT_MISMATCH',
      'expected', v_ms.amount, 'received', v_payment.amount);
  END IF;

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  UPDATE public.payments
  SET status = 'FUNDED',
      validation_id = COALESCE(NULLIF(p_validation_id, ''), validation_id),
      bank_tran_id = COALESCE(NULLIF(p_bank_tran_id, ''), bank_tran_id),
      card_type = COALESCE(p_card_type, card_type),
      card_brand = COALESCE(p_card_brand, card_brand),
      card_issuer = COALESCE(p_card_issuer, card_issuer),
      failure_reason = NULL,
      funded_at = NOW()
  WHERE id = v_payment.id;

  UPDATE public.contract_milestones
  SET status = 'FUNDED', funded_at = NOW(), cancel_requested_by = NULL
  WHERE id = v_ms.id;

  INSERT INTO public.escrow_ledger (
    payment_id, contract_id, milestone_id, entry_type, amount, platform_fee_amount,
    freelancer_net_amount, currency, is_simulated, description, metadata, created_by
  )
  VALUES (
    v_payment.id, v_payment.contract_id, v_ms.id, 'FUND', v_payment.amount, v_payment.platform_fee,
    v_payment.freelancer_amount, v_payment.currency, TRUE,
    'Milestone "' || v_ms.title || '" funded via SSLCOMMERZ Sandbox (' || v_payment.transaction_id || '). Internal escrow ledger entry.',
    jsonb_build_object('transaction_id', v_payment.transaction_id, 'validation_id', p_validation_id, 'milestone_id', v_ms.id),
    v_payment.initiated_by
  )
  ON CONFLICT DO NOTHING;

  PERFORM public._ms_log(v_ms.id, v_payment.contract_id, v_payment.initiated_by, 'client',
    'MILESTONE_FUNDED', 'PENDING', 'FUNDED',
    jsonb_build_object('payment_id', v_payment.id, 'amount', v_payment.amount, 'transaction_id', v_payment.transaction_id));

  PERFORM public._ms_recompute_contract(v_payment.contract_id);

  SELECT * INTO v_parties FROM public._ms_parties(v_payment.contract_id);

  PERFORM public._ms_notify(v_parties.client_user_id, 'client', v_payment.contract_id, v_payment.id,
    'ms_funded_client:' || v_ms.id::text, 'Milestone funded',
    'Payment of ৳' || TRIM(TO_CHAR(v_payment.amount, 'FM999,999,990.00')) || ' for milestone "' || v_ms.title || '" is verified and held in escrow.',
    'মাইলস্টোন ফান্ড হয়েছে', 'মাইলস্টোন "' || v_ms.title || '"-এর পেমেন্ট যাচাই হয়ে এসক্রোতে রাখা হয়েছে।');
  PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', v_payment.contract_id, v_payment.id,
    'ms_funded_fl:' || v_ms.id::text, 'Milestone funded — you can start',
    'The client funded milestone "' || v_ms.title || '" (৳' || TRIM(TO_CHAR(v_payment.amount, 'FM999,999,990.00')) || ') on "' || v_parties.project_title || '".',
    'মাইলস্টোন ফান্ড হয়েছে — কাজ শুরু করুন', 'ক্লায়েন্ট মাইলস্টোন "' || v_ms.title || '" ফান্ড করেছেন।');

  RETURN jsonb_build_object('ok', TRUE, 'already_settled', FALSE, 'payment_id', v_payment.id,
    'contract_id', v_payment.contract_id, 'milestone_id', v_ms.id, 'status', 'FUNDED');
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. Milestone release (shared by client release and admin dispute resolution)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._release_milestone_internal(
  p_milestone_id UUID, p_actor_user_id UUID, p_actor_role TEXT, p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ms public.contract_milestones%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_fee NUMERIC(12, 2);
  v_net NUMERIC(12, 2);
  v_parties RECORD;
  v_from TEXT;
BEGIN
  SELECT * INTO v_ms FROM public.contract_milestones WHERE id = p_milestone_id FOR UPDATE;
  v_from := v_ms.status;

  SELECT * INTO v_payment FROM public.payments
  WHERE milestone_id = v_ms.id AND status = 'FUNDED'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FUNDED_PAYMENT_NOT_FOUND');
  END IF;

  IF EXISTS (SELECT 1 FROM public.escrow_ledger WHERE milestone_id = v_ms.id AND entry_type = 'RELEASE') THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'ALREADY_RELEASED');
  END IF;

  v_fee := ROUND(v_payment.amount * (v_payment.platform_fee_pct / 100.0), 2);
  v_net := v_payment.amount - v_fee;

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  UPDATE public.payments
  SET status = 'RELEASED', platform_fee = v_fee, freelancer_amount = v_net, released_at = NOW()
  WHERE id = v_payment.id;

  UPDATE public.contract_milestones
  SET status = 'RELEASED', released_at = NOW(),
      approved_at = COALESCE(approved_at, NOW())
  WHERE id = v_ms.id;

  UPDATE public.freelancers
  SET earned_bdt = COALESCE(earned_bdt, 0) + v_net
  WHERE id = v_payment.freelancer_id;

  INSERT INTO public.escrow_ledger (
    payment_id, contract_id, milestone_id, entry_type, amount, platform_fee_amount,
    freelancer_net_amount, currency, is_simulated, description, metadata, created_by
  )
  VALUES (
    v_payment.id, v_ms.contract_id, v_ms.id, 'RELEASE', v_payment.amount, v_fee, v_net,
    v_payment.currency, TRUE,
    'Milestone "' || v_ms.title || '" released (Gross: ৳' || v_payment.amount || ', Fee: ৳' || v_fee || ', Freelancer credit: ৳' || v_net || '). ' || COALESCE(p_reason, 'Internal ledger entry only.'),
    jsonb_build_object('transaction_id', v_payment.transaction_id, 'platform_fee_pct', v_payment.platform_fee_pct, 'milestone_id', v_ms.id),
    p_actor_user_id
  );

  PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_actor_user_id, p_actor_role,
    'MILESTONE_RELEASED', v_from, 'RELEASED',
    jsonb_build_object('payment_id', v_payment.id, 'gross', v_payment.amount, 'fee', v_fee, 'net', v_net, 'reason', p_reason));

  PERFORM public._ms_recompute_contract(v_ms.contract_id);

  SELECT * INTO v_parties FROM public._ms_parties(v_ms.contract_id);
  PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', v_ms.contract_id, v_payment.id,
    'ms_released_fl:' || v_ms.id::text, 'Milestone payment released',
    '৳' || TRIM(TO_CHAR(v_net, 'FM999,999,990.00')) || ' (after ৳' || TRIM(TO_CHAR(v_fee, 'FM999,999,990.00')) || ' fee) for milestone "' || v_ms.title || '" was credited to your earnings.',
    'মাইলস্টোন পেমেন্ট রিলিজ হয়েছে', 'মাইলস্টোন "' || v_ms.title || '"-এর পেমেন্ট আপনার আয়ে যুক্ত হয়েছে।');
  PERFORM public._ms_notify(v_parties.client_user_id, 'client', v_ms.contract_id, v_payment.id,
    'ms_released_client:' || v_ms.id::text, 'Milestone payment released',
    'Milestone "' || v_ms.title || '" payment of ৳' || TRIM(TO_CHAR(v_payment.amount, 'FM999,999,990.00')) || ' was released to the freelancer.',
    'মাইলস্টোন পেমেন্ট রিলিজ হয়েছে', 'মাইলস্টোন "' || v_ms.title || '"-এর পেমেন্ট ফ্রিল্যান্সারকে রিলিজ হয়েছে।');

  IF (SELECT payment_status FROM public.contracts WHERE id = v_ms.contract_id) = 'RELEASED' THEN
    PERFORM public._ms_notify(v_parties.client_user_id, 'client', v_ms.contract_id, NULL,
      'contract_completed_client:' || v_ms.contract_id::text, 'Contract completed — leave a review',
      'All milestones on "' || v_parties.project_title || '" are released. You can now review the freelancer.',
      'চুক্তি সম্পন্ন — রিভিউ দিন', 'সব মাইলস্টোন রিলিজ হয়েছে। এখন রিভিউ দিতে পারেন।');
    PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', v_ms.contract_id, NULL,
      'contract_completed_fl:' || v_ms.contract_id::text, 'Contract completed — leave a review',
      'All milestones on "' || v_parties.project_title || '" are released. You can now review the client.',
      'চুক্তি সম্পন্ন — রিভিউ দিন', 'সব মাইলস্টোন রিলিজ হয়েছে। এখন রিভিউ দিতে পারেন।');
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'milestone_id', v_ms.id, 'payment_id', v_payment.id,
    'gross_amount', v_payment.amount, 'platform_fee', v_fee, 'freelancer_net', v_net);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_milestone_payment(p_milestone_id UUID, p_actor_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ms public.contract_milestones%ROWTYPE;
  v_parties RECORD;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized financial RPC execution';
  END IF;

  SELECT * INTO v_ms FROM public.contract_milestones WHERE id = p_milestone_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_FOUND');
  END IF;

  PERFORM 1 FROM public.contracts WHERE id = v_ms.contract_id FOR UPDATE;
  SELECT * INTO v_parties FROM public._ms_parties(v_ms.contract_id);

  IF v_parties.client_user_id IS NULL OR v_parties.client_user_id <> p_actor_user_id THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_NOT_CONTRACT_CLIENT');
  END IF;

  IF v_ms.status = 'RELEASED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'ALREADY_RELEASED');
  END IF;

  IF v_ms.status <> 'APPROVED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_APPROVED', 'milestone_status', v_ms.status);
  END IF;

  RETURN public._release_milestone_internal(v_ms.id, p_actor_user_id, 'client', 'Released by client after approval.');
END;
$$;

-- -----------------------------------------------------------------------------
-- 11. Milestone plan agreement & amendments
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.milestone_plan_action(
  p_contract_id UUID,
  p_actor_user_id UUID,
  p_action TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.contracts%ROWTYPE;
  v_parties RECORD;
  v_role TEXT;
  v_action TEXT := LOWER(COALESCE(p_action, ''));
  v_item JSONB;
  v_idx INTEGER := 0;
  v_title TEXT;
  v_amount NUMERIC(12, 2);
  v_count INTEGER;
  v_ms public.contract_milestones%ROWTYPE;
  v_note TEXT;
  v_deliverables TEXT[];
  v_next_order INTEGER;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized financial RPC execution';
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_NOT_FOUND');
  END IF;

  SELECT * INTO v_parties FROM public._ms_parties(p_contract_id);
  IF p_actor_user_id = v_parties.client_user_id THEN
    v_role := 'client';
  ELSIF p_actor_user_id = v_parties.freelancer_user_id THEN
    v_role := 'freelancer';
  ELSE
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_NOT_CONTRACT_PARTY');
  END IF;

  IF LOWER(v_contract.status) NOT IN ('active', 'disputed') THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_NOT_ACTIVE', 'contract_status', v_contract.status);
  END IF;

  v_note := NULLIF(btrim(COALESCE(p_payload ->> 'note', '')), '');
  IF v_note IS NOT NULL AND char_length(v_note) > 2000 THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'NOTE_TOO_LONG');
  END IF;

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  -- ---------------------------------------------------------------- save_plan
  IF v_action IN ('save_plan', 'propose_plan') THEN
    IF v_role <> 'client' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_CLIENT_ONLY');
    END IF;
    IF v_contract.milestone_plan_status = 'ACCEPTED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'PLAN_LOCKED_USE_AMENDMENT');
    END IF;
    -- Switching an existing single-payment contract is only allowed before any money moved
    IF v_contract.billing_mode = 'SINGLE' AND (
      v_contract.payment_status NOT IN ('UNPAID', 'FAILED', 'CANCELLED')
      OR EXISTS (SELECT 1 FROM public.payments WHERE contract_id = p_contract_id
                 AND status IN ('PENDING', 'FUNDED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED'))
    ) THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_ALREADY_HAS_PAYMENTS');
    END IF;

    IF jsonb_typeof(p_payload -> 'milestones') <> 'array'
       OR jsonb_array_length(p_payload -> 'milestones') = 0
       OR jsonb_array_length(p_payload -> 'milestones') > 20 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_MILESTONES', 'message', 'Provide between 1 and 20 milestones.');
    END IF;

    -- Validate every item before writing anything
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload -> 'milestones') LOOP
      v_idx := v_idx + 1;
      v_title := btrim(COALESCE(v_item ->> 'title', ''));
      IF char_length(v_title) < 3 OR char_length(v_title) > 160 THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_TITLE', 'index', v_idx);
      END IF;
      BEGIN
        v_amount := ROUND((v_item ->> 'amount')::NUMERIC, 2);
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_AMOUNT', 'index', v_idx);
      END;
      IF v_amount IS NULL OR v_amount < 10 OR v_amount > 10000000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_AMOUNT', 'index', v_idx);
      END IF;
      IF char_length(COALESCE(v_item ->> 'description', '')) > 4000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'DESCRIPTION_TOO_LONG', 'index', v_idx);
      END IF;
      IF (v_item ? 'deadline') AND NULLIF(v_item ->> 'deadline', '') IS NOT NULL
         AND (v_item ? 'start_date') AND NULLIF(v_item ->> 'start_date', '') IS NOT NULL
         AND (v_item ->> 'deadline')::DATE < (v_item ->> 'start_date')::DATE THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_DATES', 'index', v_idx);
      END IF;
    END LOOP;

    -- Replace the not-yet-agreed plan (nothing here is funded — PENDING only)
    IF EXISTS (SELECT 1 FROM public.contract_milestones WHERE contract_id = p_contract_id AND status <> 'PENDING') THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'PLAN_HAS_ACTIVE_MILESTONES');
    END IF;

    -- Unlink any failed/cancelled payment attempts that referenced draft milestones
    UPDATE public.payments SET milestone_id = NULL
    WHERE contract_id = p_contract_id AND milestone_id IS NOT NULL AND status IN ('FAILED', 'CANCELLED');
    DELETE FROM public.contract_milestones WHERE contract_id = p_contract_id;

    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload -> 'milestones') LOOP
      v_idx := v_idx + 1;
      SELECT COALESCE(array_agg(LEFT(btrim(d), 300)) FILTER (WHERE btrim(d) <> ''), '{}')
      INTO v_deliverables
      FROM (SELECT jsonb_array_elements_text(COALESCE(v_item -> 'deliverables', '[]'::jsonb)) AS d LIMIT 20) s;

      INSERT INTO public.contract_milestones (
        contract_id, sort_order, title, description, deliverables, amount, start_date, deadline,
        status, agreement_status, created_by
      )
      VALUES (
        p_contract_id, v_idx, btrim(v_item ->> 'title'), COALESCE(v_item ->> 'description', ''),
        v_deliverables, ROUND((v_item ->> 'amount')::NUMERIC, 2),
        NULLIF(v_item ->> 'start_date', '')::DATE, NULLIF(v_item ->> 'deadline', '')::DATE,
        'PENDING', CASE WHEN v_action = 'propose_plan' THEN 'PROPOSED' ELSE 'DRAFT' END, p_actor_user_id
      );
    END LOOP;

    UPDATE public.contracts
    SET billing_mode = 'MILESTONE',
        milestone_plan_status = CASE WHEN v_action = 'propose_plan' THEN 'PROPOSED' ELSE 'DRAFT' END,
        milestone_plan_note = COALESCE(v_note, milestone_plan_note)
    WHERE id = p_contract_id;

    PERFORM public._ms_log(NULL, p_contract_id, p_actor_user_id, v_role,
      CASE WHEN v_action = 'propose_plan' THEN 'PLAN_PROPOSED' ELSE 'PLAN_SAVED' END, NULL, NULL,
      jsonb_build_object('milestones', v_idx, 'note', v_note));

    IF v_action = 'propose_plan' THEN
      PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', p_contract_id, NULL,
        'ms_plan_proposed:' || p_contract_id::text || ':' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
        'Milestone plan proposed',
        'The client proposed ' || v_idx || ' milestone(s) for "' || v_parties.project_title || '". Review and accept them to begin.',
        'মাইলস্টোন পরিকল্পনা প্রস্তাবিত', 'ক্লায়েন্ট ' || v_idx || 'টি মাইলস্টোন প্রস্তাব করেছেন। পর্যালোচনা করে গ্রহণ করুন।');
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'milestones', v_idx,
      'plan_status', CASE WHEN v_action = 'propose_plan' THEN 'PROPOSED' ELSE 'DRAFT' END);
  END IF;

  -- -------------------------------------------------------------- accept_plan
  IF v_action = 'accept_plan' THEN
    IF v_role <> 'freelancer' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_FREELANCER_ONLY');
    END IF;
    IF v_contract.milestone_plan_status <> 'PROPOSED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'PLAN_NOT_PROPOSED');
    END IF;

    UPDATE public.contract_milestones
    SET agreement_status = 'ACCEPTED'
    WHERE contract_id = p_contract_id AND agreement_status = 'PROPOSED';
    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE public.contracts
    SET milestone_plan_status = 'ACCEPTED', milestone_plan_accepted_at = NOW()
    WHERE id = p_contract_id;

    PERFORM public._ms_recompute_contract(p_contract_id);
    PERFORM public._ms_log(NULL, p_contract_id, p_actor_user_id, v_role, 'PLAN_ACCEPTED', NULL, NULL,
      jsonb_build_object('milestones', v_count));
    PERFORM public._ms_notify(v_parties.client_user_id, 'client', p_contract_id, NULL,
      'ms_plan_accepted:' || p_contract_id::text, 'Milestone plan accepted',
      'The freelancer accepted the milestone plan for "' || v_parties.project_title || '". You can now fund the first milestone.',
      'মাইলস্টোন পরিকল্পনা গৃহীত', 'ফ্রিল্যান্সার পরিকল্পনা গ্রহণ করেছেন। এখন প্রথম মাইলস্টোন ফান্ড করতে পারেন।');
    RETURN jsonb_build_object('ok', TRUE, 'plan_status', 'ACCEPTED', 'milestones', v_count);
  END IF;

  -- ------------------------------------------------------ request_plan_changes
  IF v_action = 'request_plan_changes' THEN
    IF v_role <> 'freelancer' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_FREELANCER_ONLY');
    END IF;
    IF v_contract.milestone_plan_status <> 'PROPOSED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'PLAN_NOT_PROPOSED');
    END IF;
    IF v_note IS NULL OR char_length(v_note) < 5 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'NOTE_REQUIRED');
    END IF;
    UPDATE public.contract_milestones SET agreement_status = 'DRAFT'
    WHERE contract_id = p_contract_id AND agreement_status = 'PROPOSED';
    UPDATE public.contracts SET milestone_plan_status = 'DRAFT', milestone_plan_note = v_note
    WHERE id = p_contract_id;
    PERFORM public._ms_log(NULL, p_contract_id, p_actor_user_id, v_role, 'PLAN_CHANGES_REQUESTED', NULL, NULL,
      jsonb_build_object('note', v_note));
    PERFORM public._ms_notify(v_parties.client_user_id, 'client', p_contract_id, NULL,
      'ms_plan_changes:' || p_contract_id::text || ':' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
      'Freelancer requested plan changes', LEFT(v_note, 400),
      'ফ্রিল্যান্সার পরিকল্পনায় পরিবর্তন চেয়েছেন', LEFT(v_note, 400));
    RETURN jsonb_build_object('ok', TRUE, 'plan_status', 'DRAFT');
  END IF;

  -- -------------------------------------------- propose_amendment (add a milestone)
  IF v_action = 'propose_amendment' THEN
    IF v_role <> 'client' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_CLIENT_ONLY');
    END IF;
    IF v_contract.milestone_plan_status <> 'ACCEPTED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'PLAN_NOT_ACCEPTED');
    END IF;
    v_item := p_payload -> 'milestone';
    v_title := btrim(COALESCE(v_item ->> 'title', ''));
    IF char_length(v_title) < 3 OR char_length(v_title) > 160 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_TITLE');
    END IF;
    BEGIN
      v_amount := ROUND((v_item ->> 'amount')::NUMERIC, 2);
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_AMOUNT');
    END;
    IF v_amount IS NULL OR v_amount < 10 OR v_amount > 10000000 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_AMOUNT');
    END IF;
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_next_order
    FROM public.contract_milestones WHERE contract_id = p_contract_id;
    SELECT COALESCE(array_agg(LEFT(btrim(d), 300)) FILTER (WHERE btrim(d) <> ''), '{}')
    INTO v_deliverables
    FROM (SELECT jsonb_array_elements_text(COALESCE(v_item -> 'deliverables', '[]'::jsonb)) AS d LIMIT 20) s;

    INSERT INTO public.contract_milestones (
      contract_id, sort_order, title, description, deliverables, amount, start_date, deadline,
      status, agreement_status, created_by
    )
    VALUES (
      p_contract_id, v_next_order, v_title, LEFT(COALESCE(v_item ->> 'description', ''), 4000),
      v_deliverables, v_amount, NULLIF(v_item ->> 'start_date', '')::DATE, NULLIF(v_item ->> 'deadline', '')::DATE,
      'PENDING', 'PROPOSED', p_actor_user_id
    )
    RETURNING * INTO v_ms;

    PERFORM public._ms_log(v_ms.id, p_contract_id, p_actor_user_id, v_role, 'AMENDMENT_PROPOSED', NULL, 'PENDING',
      jsonb_build_object('title', v_title, 'amount', v_amount));
    PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', p_contract_id, NULL,
      'ms_amend:' || v_ms.id::text, 'New milestone proposed',
      'The client proposed an additional milestone "' || v_title || '" (৳' || TRIM(TO_CHAR(v_amount, 'FM999,999,990.00')) || '). Review it to accept or decline.',
      'নতুন মাইলস্টোন প্রস্তাবিত', 'ক্লায়েন্ট নতুন মাইলস্টোন "' || v_title || '" প্রস্তাব করেছেন।');
    RETURN jsonb_build_object('ok', TRUE, 'milestone_id', v_ms.id);
  END IF;

  -- ------------------------------------- accept / reject a proposed amendment
  IF v_action IN ('accept_amendment', 'reject_amendment') THEN
    IF v_role <> 'freelancer' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_FREELANCER_ONLY');
    END IF;
    SELECT * INTO v_ms FROM public.contract_milestones
    WHERE id = NULLIF(p_payload ->> 'milestone_id', '')::UUID AND contract_id = p_contract_id
    FOR UPDATE;
    IF NOT FOUND OR v_ms.agreement_status <> 'PROPOSED' OR v_contract.milestone_plan_status <> 'ACCEPTED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'AMENDMENT_NOT_FOUND');
    END IF;
    IF v_action = 'accept_amendment' THEN
      UPDATE public.contract_milestones SET agreement_status = 'ACCEPTED' WHERE id = v_ms.id;
    ELSE
      UPDATE public.contract_milestones SET agreement_status = 'REJECTED', status = 'CANCELLED', cancelled_at = NOW()
      WHERE id = v_ms.id;
    END IF;
    PERFORM public._ms_recompute_contract(p_contract_id);
    PERFORM public._ms_log(v_ms.id, p_contract_id, p_actor_user_id, v_role,
      CASE WHEN v_action = 'accept_amendment' THEN 'AMENDMENT_ACCEPTED' ELSE 'AMENDMENT_REJECTED' END,
      'PENDING', CASE WHEN v_action = 'accept_amendment' THEN 'PENDING' ELSE 'CANCELLED' END,
      jsonb_build_object('note', v_note));
    PERFORM public._ms_notify(v_parties.client_user_id, 'client', p_contract_id, NULL,
      'ms_amend_decided:' || v_ms.id::text,
      CASE WHEN v_action = 'accept_amendment' THEN 'Milestone amendment accepted' ELSE 'Milestone amendment declined' END,
      'The freelancer ' || CASE WHEN v_action = 'accept_amendment' THEN 'accepted' ELSE 'declined' END || ' milestone "' || v_ms.title || '".',
      CASE WHEN v_action = 'accept_amendment' THEN 'মাইলস্টোন সংশোধন গৃহীত' ELSE 'মাইলস্টোন সংশোধন প্রত্যাখ্যাত' END,
      'মাইলস্টোন "' || v_ms.title || '"');
    RETURN jsonb_build_object('ok', TRUE, 'milestone_id', v_ms.id);
  END IF;

  -- ----------------------------- cancellation of an agreed, UNFUNDED milestone
  IF v_action IN ('request_cancel', 'confirm_cancel', 'withdraw_cancel') THEN
    SELECT * INTO v_ms FROM public.contract_milestones
    WHERE id = NULLIF(p_payload ->> 'milestone_id', '')::UUID AND contract_id = p_contract_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_FOUND');
    END IF;
    IF v_ms.status <> 'PENDING' OR v_ms.agreement_status <> 'ACCEPTED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'ONLY_UNFUNDED_MILESTONES_CAN_BE_CANCELLED');
    END IF;
    IF EXISTS (SELECT 1 FROM public.payments WHERE milestone_id = v_ms.id AND status = 'PENDING') THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'PAYMENT_IN_PROGRESS');
    END IF;

    IF v_action = 'request_cancel' THEN
      IF v_ms.cancel_requested_by IS NOT NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'CANCEL_ALREADY_REQUESTED');
      END IF;
      UPDATE public.contract_milestones SET cancel_requested_by = p_actor_user_id WHERE id = v_ms.id;
      PERFORM public._ms_log(v_ms.id, p_contract_id, p_actor_user_id, v_role, 'CANCEL_REQUESTED', 'PENDING', 'PENDING',
        jsonb_build_object('note', v_note));
      PERFORM public._ms_notify(
        CASE WHEN v_role = 'client' THEN v_parties.freelancer_user_id ELSE v_parties.client_user_id END,
        CASE WHEN v_role = 'client' THEN 'freelancer' ELSE 'client' END, p_contract_id, NULL,
        'ms_cancel_req:' || v_ms.id::text || ':' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
        'Milestone cancellation requested',
        'The ' || v_role || ' asked to cancel unfunded milestone "' || v_ms.title || '". Confirm to remove it from the contract.',
        'মাইলস্টোন বাতিলের অনুরোধ', 'মাইলস্টোন "' || v_ms.title || '" বাতিলের অনুরোধ করা হয়েছে।');
      RETURN jsonb_build_object('ok', TRUE, 'milestone_id', v_ms.id, 'cancel_requested', TRUE);
    END IF;

    IF v_ms.cancel_requested_by IS NULL THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'NO_CANCEL_REQUEST');
    END IF;

    IF v_action = 'withdraw_cancel' THEN
      IF v_ms.cancel_requested_by <> p_actor_user_id THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_NOT_REQUESTER');
      END IF;
      UPDATE public.contract_milestones SET cancel_requested_by = NULL WHERE id = v_ms.id;
      PERFORM public._ms_log(v_ms.id, p_contract_id, p_actor_user_id, v_role, 'CANCEL_WITHDRAWN', 'PENDING', 'PENDING', '{}'::jsonb);
      RETURN jsonb_build_object('ok', TRUE, 'milestone_id', v_ms.id);
    END IF;

    -- confirm_cancel: must be the OTHER party
    IF v_ms.cancel_requested_by = p_actor_user_id THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'OTHER_PARTY_MUST_CONFIRM');
    END IF;
    UPDATE public.contract_milestones
    SET status = 'CANCELLED', cancelled_at = NOW()
    WHERE id = v_ms.id;
    PERFORM public._ms_recompute_contract(p_contract_id);
    PERFORM public._ms_log(v_ms.id, p_contract_id, p_actor_user_id, v_role, 'MILESTONE_CANCELLED', 'PENDING', 'CANCELLED',
      jsonb_build_object('requested_by', v_ms.cancel_requested_by));
    PERFORM public._ms_notify(v_ms.cancel_requested_by,
      CASE WHEN v_role = 'client' THEN 'freelancer' ELSE 'client' END, p_contract_id, NULL,
      'ms_cancelled:' || v_ms.id::text, 'Milestone cancelled',
      'Milestone "' || v_ms.title || '" was cancelled by mutual agreement.',
      'মাইলস্টোন বাতিল হয়েছে', 'মাইলস্টোন "' || v_ms.title || '" পারস্পরিক সম্মতিতে বাতিল হয়েছে।');
    RETURN jsonb_build_object('ok', TRUE, 'milestone_id', v_ms.id, 'status', 'CANCELLED');
  END IF;

  RETURN jsonb_build_object('ok', FALSE, 'code', 'UNKNOWN_ACTION');
END;
$$;

-- -----------------------------------------------------------------------------
-- 12. Milestone work transitions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.milestone_work_action(
  p_milestone_id UUID,
  p_actor_user_id UUID,
  p_action TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ms public.contract_milestones%ROWTYPE;
  v_parties RECORD;
  v_role TEXT;
  v_action TEXT := LOWER(COALESCE(p_action, ''));
  v_message TEXT;
  v_url TEXT;
  v_attach JSONB;
  v_rev INTEGER;
  v_sub_id UUID;
  v_dispute_id UUID;
  v_admin RECORD;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized financial RPC execution';
  END IF;

  SELECT * INTO v_ms FROM public.contract_milestones WHERE id = p_milestone_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_FOUND');
  END IF;

  PERFORM 1 FROM public.contracts WHERE id = v_ms.contract_id FOR UPDATE;
  SELECT * INTO v_parties FROM public._ms_parties(v_ms.contract_id);

  IF p_actor_user_id = v_parties.client_user_id THEN
    v_role := 'client';
  ELSIF p_actor_user_id = v_parties.freelancer_user_id THEN
    v_role := 'freelancer';
  ELSE
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_NOT_CONTRACT_PARTY');
  END IF;

  IF v_ms.agreement_status <> 'ACCEPTED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_AGREED');
  END IF;

  v_message := NULLIF(btrim(COALESCE(p_payload ->> 'message', '')), '');
  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  -- ----------------------------------------------------------------- start
  IF v_action = 'start' THEN
    IF v_role <> 'freelancer' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_FREELANCER_ONLY');
    END IF;
    IF v_ms.status <> 'FUNDED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_FUNDED', 'milestone_status', v_ms.status);
    END IF;
    UPDATE public.contract_milestones SET status = 'IN_PROGRESS', started_at = NOW() WHERE id = v_ms.id;
    PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_actor_user_id, v_role, 'WORK_STARTED', 'FUNDED', 'IN_PROGRESS', '{}'::jsonb);
    PERFORM public._ms_recompute_contract(v_ms.contract_id);
    PERFORM public._ms_notify(v_parties.client_user_id, 'client', v_ms.contract_id, NULL,
      'ms_started:' || v_ms.id::text, 'Work started on milestone',
      'The freelancer started milestone "' || v_ms.title || '".',
      'মাইলস্টোনে কাজ শুরু', 'ফ্রিল্যান্সার মাইলস্টোন "' || v_ms.title || '"-এ কাজ শুরু করেছেন।');
    RETURN jsonb_build_object('ok', TRUE, 'status', 'IN_PROGRESS');
  END IF;

  -- ---------------------------------------------------------------- submit
  IF v_action = 'submit' THEN
    IF v_role <> 'freelancer' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_FREELANCER_ONLY');
    END IF;
    IF v_ms.status NOT IN ('FUNDED', 'IN_PROGRESS', 'REVISION_REQUESTED') THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_STATE_FOR_SUBMIT', 'milestone_status', v_ms.status);
    END IF;
    IF v_message IS NULL OR char_length(v_message) < 5 OR char_length(v_message) > 4000 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_MESSAGE');
    END IF;
    v_url := NULLIF(btrim(COALESCE(p_payload ->> 'demo_url', '')), '');
    IF v_url IS NOT NULL AND v_url !~* '^https?://' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_URL');
    END IF;
    v_attach := COALESCE(p_payload -> 'attachments', '[]'::jsonb);
    IF jsonb_typeof(v_attach) <> 'array' OR jsonb_array_length(v_attach) > 10 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_ATTACHMENTS');
    END IF;

    UPDATE public.milestone_submissions SET status = 'SUPERSEDED'
    WHERE milestone_id = v_ms.id AND status = 'SUBMITTED';

    SELECT COALESCE(MAX(revision_number), 0) + 1 INTO v_rev
    FROM public.milestone_submissions WHERE milestone_id = v_ms.id;

    INSERT INTO public.milestone_submissions (
      milestone_id, contract_id, submitted_by, revision_number, message, demo_url, attachments
    )
    VALUES (v_ms.id, v_ms.contract_id, p_actor_user_id, v_rev, v_message, v_url, v_attach)
    RETURNING id INTO v_sub_id;

    UPDATE public.contract_milestones
    SET status = 'SUBMITTED', submitted_at = NOW(), started_at = COALESCE(started_at, NOW())
    WHERE id = v_ms.id;

    PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_actor_user_id, v_role, 'WORK_SUBMITTED', v_ms.status, 'SUBMITTED',
      jsonb_build_object('submission_id', v_sub_id, 'revision_number', v_rev));
    PERFORM public._ms_recompute_contract(v_ms.contract_id);
    PERFORM public._ms_notify(v_parties.client_user_id, 'client', v_ms.contract_id, NULL,
      'ms_submitted:' || v_sub_id::text, 'Milestone submitted for review',
      'The freelancer submitted milestone "' || v_ms.title || '"' || CASE WHEN v_rev > 1 THEN ' (revision ' || (v_rev - 1) || ')' ELSE '' END || '. Review it to approve or request changes.',
      'মাইলস্টোন জমা দেওয়া হয়েছে', 'মাইলস্টোন "' || v_ms.title || '" রিভিউর জন্য জমা দেওয়া হয়েছে।');
    RETURN jsonb_build_object('ok', TRUE, 'status', 'SUBMITTED', 'submission_id', v_sub_id, 'revision_number', v_rev);
  END IF;

  -- ------------------------------------------------------ request_revision
  IF v_action = 'request_revision' THEN
    IF v_role <> 'client' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_CLIENT_ONLY');
    END IF;
    IF v_ms.status <> 'SUBMITTED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'WORK_NOT_SUBMITTED', 'milestone_status', v_ms.status);
    END IF;
    IF v_message IS NULL OR char_length(v_message) < 10 OR char_length(v_message) > 4000 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'REASON_REQUIRED');
    END IF;
    UPDATE public.milestone_submissions
    SET status = 'REVISION_REQUESTED', review_feedback = v_message, reviewed_by = p_actor_user_id, reviewed_at = NOW()
    WHERE milestone_id = v_ms.id AND status = 'SUBMITTED'
    RETURNING id INTO v_sub_id;
    UPDATE public.contract_milestones
    SET status = 'REVISION_REQUESTED', revision_count = revision_count + 1
    WHERE id = v_ms.id;
    PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_actor_user_id, v_role, 'REVISION_REQUESTED', 'SUBMITTED', 'REVISION_REQUESTED',
      jsonb_build_object('submission_id', v_sub_id, 'reason', v_message));
    PERFORM public._ms_recompute_contract(v_ms.contract_id);
    PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', v_ms.contract_id, NULL,
      'ms_revision:' || COALESCE(v_sub_id::text, v_ms.id::text), 'Revision requested',
      'The client requested changes on milestone "' || v_ms.title || '": ' || LEFT(v_message, 300),
      'রিভিশন অনুরোধ', 'ক্লায়েন্ট মাইলস্টোন "' || v_ms.title || '"-এ পরিবর্তন চেয়েছেন।');
    RETURN jsonb_build_object('ok', TRUE, 'status', 'REVISION_REQUESTED');
  END IF;

  -- --------------------------------------------------------------- approve
  IF v_action = 'approve' THEN
    IF v_role <> 'client' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_CLIENT_ONLY');
    END IF;
    IF v_ms.status <> 'SUBMITTED' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'WORK_NOT_SUBMITTED', 'milestone_status', v_ms.status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.payments WHERE milestone_id = v_ms.id AND status = 'FUNDED') THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_NOT_FUNDED');
    END IF;
    UPDATE public.milestone_submissions
    SET status = 'APPROVED', review_feedback = v_message, reviewed_by = p_actor_user_id, reviewed_at = NOW()
    WHERE milestone_id = v_ms.id AND status = 'SUBMITTED';
    UPDATE public.contract_milestones SET status = 'APPROVED', approved_at = NOW() WHERE id = v_ms.id;
    PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_actor_user_id, v_role, 'MILESTONE_APPROVED', 'SUBMITTED', 'APPROVED', '{}'::jsonb);
    PERFORM public._ms_recompute_contract(v_ms.contract_id);
    PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', v_ms.contract_id, NULL,
      'ms_approved:' || v_ms.id::text, 'Milestone approved',
      'The client approved milestone "' || v_ms.title || '". The payment is now eligible for release.',
      'মাইলস্টোন অনুমোদিত', 'ক্লায়েন্ট মাইলস্টোন "' || v_ms.title || '" অনুমোদন করেছেন।');
    RETURN jsonb_build_object('ok', TRUE, 'status', 'APPROVED');
  END IF;

  -- --------------------------------------------------------- raise_dispute
  IF v_action = 'raise_dispute' THEN
    IF v_ms.status NOT IN ('FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED') THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'DISPUTE_NOT_ALLOWED', 'milestone_status', v_ms.status);
    END IF;
    IF v_message IS NULL OR char_length(v_message) < 10 OR char_length(v_message) > 4000 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'REASON_REQUIRED');
    END IF;
    INSERT INTO public.milestone_disputes (milestone_id, contract_id, raised_by, raised_by_role, reason, previous_status)
    VALUES (v_ms.id, v_ms.contract_id, p_actor_user_id, v_role, v_message, v_ms.status)
    RETURNING id INTO v_dispute_id;
    UPDATE public.contract_milestones SET status = 'DISPUTED' WHERE id = v_ms.id;
    PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_actor_user_id, v_role, 'DISPUTE_OPENED', v_ms.status, 'DISPUTED',
      jsonb_build_object('dispute_id', v_dispute_id, 'reason', v_message));
    PERFORM public._ms_recompute_contract(v_ms.contract_id);

    PERFORM public._ms_notify(
      CASE WHEN v_role = 'client' THEN v_parties.freelancer_user_id ELSE v_parties.client_user_id END,
      CASE WHEN v_role = 'client' THEN 'freelancer' ELSE 'client' END, v_ms.contract_id, NULL,
      'ms_dispute:' || v_dispute_id::text, 'Dispute opened on milestone',
      'A dispute was opened on milestone "' || v_ms.title || '". Funds stay in escrow until an admin resolves it.',
      'মাইলস্টোনে বিরোধ', 'মাইলস্টোন "' || v_ms.title || '"-এ বিরোধ খোলা হয়েছে।');
    FOR v_admin IN SELECT user_id FROM public.admins LOOP
      PERFORM public._ms_notify(v_admin.user_id, 'admin', v_ms.contract_id, NULL,
        'ms_dispute_admin:' || v_dispute_id::text, 'New milestone dispute',
        'A ' || v_role || ' opened a dispute on milestone "' || v_ms.title || '" (' || v_parties.project_title || ').',
        'নতুন মাইলস্টোন বিরোধ', 'মাইলস্টোন "' || v_ms.title || '"-এ বিরোধ খোলা হয়েছে।');
    END LOOP;
    RETURN jsonb_build_object('ok', TRUE, 'status', 'DISPUTED', 'dispute_id', v_dispute_id);
  END IF;

  RETURN jsonb_build_object('ok', FALSE, 'code', 'UNKNOWN_ACTION');
END;
$$;

-- -----------------------------------------------------------------------------
-- 13. Admin dispute resolution
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_milestone_dispute(
  p_dispute_id UUID,
  p_admin_user_id UUID,
  p_resolution TEXT,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute public.milestone_disputes%ROWTYPE;
  v_ms public.contract_milestones%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_parties RECORD;
  v_resolution TEXT := UPPER(COALESCE(p_resolution, ''));
  v_notes TEXT := NULLIF(btrim(COALESCE(p_notes, '')), '');
  v_result JSONB;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized financial RPC execution';
  END IF;
  IF NOT public.is_admin(p_admin_user_id) THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_ADMIN_ONLY');
  END IF;
  IF v_resolution NOT IN ('RELEASE_TO_FREELANCER', 'REFUND_TO_CLIENT', 'RESUME_WORK') THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_RESOLUTION');
  END IF;
  IF v_notes IS NULL OR char_length(v_notes) < 10 OR char_length(v_notes) > 4000 THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'NOTES_REQUIRED');
  END IF;

  SELECT * INTO v_dispute FROM public.milestone_disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'DISPUTE_NOT_FOUND');
  END IF;
  IF v_dispute.status <> 'OPEN' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'DISPUTE_ALREADY_RESOLVED');
  END IF;

  SELECT * INTO v_ms FROM public.contract_milestones WHERE id = v_dispute.milestone_id FOR UPDATE;
  PERFORM 1 FROM public.contracts WHERE id = v_ms.contract_id FOR UPDATE;
  SELECT * INTO v_parties FROM public._ms_parties(v_ms.contract_id);

  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  IF v_resolution = 'RESUME_WORK' THEN
    UPDATE public.contract_milestones SET status = v_dispute.previous_status WHERE id = v_ms.id;
    v_result := jsonb_build_object('ok', TRUE, 'status', v_dispute.previous_status);

  ELSIF v_resolution = 'RELEASE_TO_FREELANCER' THEN
    v_result := public._release_milestone_internal(v_ms.id, p_admin_user_id, 'admin',
      'Released by admin dispute resolution: ' || LEFT(v_notes, 500));
    IF NOT COALESCE((v_result ->> 'ok')::BOOLEAN, FALSE) THEN
      RETURN v_result;
    END IF;

  ELSE -- REFUND_TO_CLIENT
    SELECT * INTO v_payment FROM public.payments WHERE milestone_id = v_ms.id AND status = 'FUNDED' FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'FUNDED_PAYMENT_NOT_FOUND');
    END IF;
    UPDATE public.payments SET status = 'REFUNDED', refunded_at = NOW() WHERE id = v_payment.id;
    UPDATE public.contract_milestones SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = v_ms.id;
    INSERT INTO public.escrow_ledger (
      payment_id, contract_id, milestone_id, entry_type, amount, platform_fee_amount,
      freelancer_net_amount, currency, is_simulated, description, metadata, created_by
    )
    VALUES (
      v_payment.id, v_ms.contract_id, v_ms.id, 'REFUND', v_payment.amount, 0, 0, v_payment.currency, TRUE,
      'Milestone "' || v_ms.title || '" refunded to client by admin dispute resolution (simulated internal refund; no external bank transfer performed).',
      jsonb_build_object('dispute_id', v_dispute.id, 'transaction_id', v_payment.transaction_id),
      p_admin_user_id
    );
    PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_admin_user_id, 'admin', 'MILESTONE_REFUNDED', 'DISPUTED', 'CANCELLED',
      jsonb_build_object('payment_id', v_payment.id, 'amount', v_payment.amount, 'dispute_id', v_dispute.id));
    v_result := jsonb_build_object('ok', TRUE, 'status', 'CANCELLED', 'refunded', v_payment.amount);
  END IF;

  UPDATE public.milestone_disputes
  SET status = 'RESOLVED', resolution = v_resolution, resolution_notes = v_notes,
      resolved_by = p_admin_user_id, resolved_at = NOW()
  WHERE id = v_dispute.id;

  PERFORM public._ms_log(v_ms.id, v_ms.contract_id, p_admin_user_id, 'admin', 'DISPUTE_RESOLVED', 'DISPUTED',
    (SELECT status FROM public.contract_milestones WHERE id = v_ms.id),
    jsonb_build_object('dispute_id', v_dispute.id, 'resolution', v_resolution, 'notes', v_notes));
  PERFORM public._ms_recompute_contract(v_ms.contract_id);

  PERFORM public._ms_notify(v_parties.client_user_id, 'client', v_ms.contract_id, NULL,
    'ms_dispute_resolved_c:' || v_dispute.id::text, 'Dispute resolved',
    'The dispute on milestone "' || v_ms.title || '" was resolved: ' || REPLACE(LOWER(v_resolution), '_', ' ') || '. ' || LEFT(v_notes, 300),
    'বিরোধ নিষ্পত্তি হয়েছে', 'মাইলস্টোন "' || v_ms.title || '"-এর বিরোধ নিষ্পত্তি হয়েছে।');
  PERFORM public._ms_notify(v_parties.freelancer_user_id, 'freelancer', v_ms.contract_id, NULL,
    'ms_dispute_resolved_f:' || v_dispute.id::text, 'Dispute resolved',
    'The dispute on milestone "' || v_ms.title || '" was resolved: ' || REPLACE(LOWER(v_resolution), '_', ' ') || '. ' || LEFT(v_notes, 300),
    'বিরোধ নিষ্পত্তি হয়েছে', 'মাইলস্টোন "' || v_ms.title || '"-এর বিরোধ নিষ্পত্তি হয়েছে।');

  RETURN v_result || jsonb_build_object('dispute_id', v_dispute.id, 'resolution', v_resolution);
END;
$$;

-- -----------------------------------------------------------------------------
-- 14. Lock down execution: only service_role may call; internals callable by nobody
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public._ms_notify(UUID, TEXT, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._ms_log(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._ms_parties(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._ms_recompute_contract(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._settle_milestone_payment(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public._release_milestone_internal(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.release_milestone_payment(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_milestone_payment(UUID, UUID) TO service_role;
REVOKE ALL ON FUNCTION public.milestone_plan_action(UUID, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milestone_plan_action(UUID, UUID, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.milestone_work_action(UUID, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.milestone_work_action(UUID, UUID, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION public.resolve_milestone_dispute(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_milestone_dispute(UUID, UUID, TEXT, TEXT) TO service_role;

-- =============================================================================
-- 15. Existing functions re-created with milestone guards (bodies otherwise verbatim)
-- =============================================================================

-- settle_funded_payment (verbatim + milestone guard)
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

  -- Milestone payments settle per milestone (added by milestone migration)
  IF v_payment.milestone_id IS NOT NULL THEN
    RETURN public._settle_milestone_payment(
      v_payment.id, p_validation_id, p_bank_tran_id, p_card_type, p_card_brand, p_card_issuer
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

-- release_escrow_payment (verbatim + milestone guard)
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

  -- Milestone contracts release per milestone (added by milestone migration)
  IF v_contract.billing_mode = 'MILESTONE' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_CONTRACT_USE_MILESTONE_RELEASE');
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

-- process_refund_decision (verbatim + milestone guard)
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

  -- Milestone payments are refunded via dispute resolution (added by milestone migration)
  IF v_payment.milestone_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'MILESTONE_PAYMENT_USE_DISPUTE');
  END IF;

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

-- contracts_before_write_guard (verbatim + milestone guard)
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
      NEW.billing_mode := 'SINGLE';
      NEW.milestone_plan_status := 'NONE';
      NEW.milestone_plan_accepted_at := NULL;
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
      OR NEW.billing_mode IS DISTINCT FROM OLD.billing_mode
      OR NEW.milestone_plan_status IS DISTINCT FROM OLD.milestone_plan_status
      OR NEW.milestone_plan_note IS DISTINCT FROM OLD.milestone_plan_note
      OR NEW.milestone_plan_accepted_at IS DISTINCT FROM OLD.milestone_plan_accepted_at
    ) THEN
      RAISE EXCEPTION 'Direct client modification of financial, payment, or work-approval fields on contracts is forbidden. Use trusted API endpoints.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;
