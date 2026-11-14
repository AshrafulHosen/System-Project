-- =============================================================================
-- Two-sided reviews & ratings (extends the existing public.reviews table)
--
--   * A client can review the freelancer and the freelancer can review the client,
--     once per contract each, only after the contract is COMPLETED (fully released).
--   * Category scores (1–5) are validated in the database; the overall rating is
--     computed server-side and never accepted from the browser.
--   * Profile ratings (freelancers/clients.rating, reviews_count) are recomputed
--     from VISIBLE reviews only and can no longer be edited from the browser.
--   * Reviews are final once submitted (no editing) — avoids rating manipulation.
--   * Reports & admin moderation are recorded in an append-only audit log.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extend reviews
-- -----------------------------------------------------------------------------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_type VARCHAR(32),
  ADD COLUMN IF NOT EXISTS reviewer_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewee_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS overall_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS highlights TEXT,
  ADD COLUMN IF NOT EXISTS strengths TEXT,
  ADD COLUMN IF NOT EXISTS improvements TEXT,
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(16) NOT NULL DEFAULT 'VISIBLE',
  ADD COLUMN IF NOT EXISTS contract_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill legacy rows (the original policies only allowed client → freelancer reviews)
UPDATE public.reviews r
SET review_type = 'CLIENT_TO_FREELANCER',
    reviewer_user_id = COALESCE(r.reviewer_user_id, c.user_id),
    reviewee_user_id = COALESCE(r.reviewee_user_id, f.user_id),
    overall_rating = COALESCE(r.overall_rating, r.rating),
    contract_completed_at = COALESCE(r.contract_completed_at, ct.released_at)
FROM public.contracts ct
LEFT JOIN public.proposals p ON p.id = ct.proposal_id
LEFT JOIN public.projects pr ON pr.id = p.project_id
LEFT JOIN public.clients c ON c.id = COALESCE(ct.client_id, pr.client_id)
LEFT JOIN public.freelancers f ON f.id = COALESCE(ct.freelancer_id, p.freelancer_id)
WHERE ct.id = r.contract_id AND r.review_type IS NULL;

UPDATE public.reviews SET review_type = 'CLIENT_TO_FREELANCER' WHERE review_type IS NULL;
UPDATE public.reviews SET overall_rating = rating WHERE overall_rating IS NULL;

ALTER TABLE public.reviews ALTER COLUMN review_type SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN overall_rating SET NOT NULL;

-- One review per contract → one review per contract PER SIDE
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_contract_id_key;
DROP INDEX IF EXISTS public.reviews_contract_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_side_idx ON public.reviews (contract_id, review_type);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON public.reviews (reviewee_user_id, moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_reviewer_idx ON public.reviews (reviewer_user_id, created_at DESC);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_type_check
  CHECK (review_type IN ('CLIENT_TO_FREELANCER', 'FREELANCER_TO_CLIENT'));
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_moderation_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_moderation_check
  CHECK (moderation_status IN ('VISIBLE', 'HIDDEN', 'REMOVED'));
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_overall_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_overall_check
  CHECK (overall_rating >= 1 AND overall_rating <= 5);
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_text_limits_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_text_limits_check CHECK (
  char_length(COALESCE(feedback, '')) <= 2000
  AND char_length(COALESCE(highlights, '')) <= 500
  AND char_length(COALESCE(strengths, '')) <= 500
  AND char_length(COALESCE(improvements, '')) <= 500
);
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_not_self_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_not_self_check
  CHECK (reviewer_user_id IS NULL OR reviewee_user_id IS NULL OR reviewer_user_id <> reviewee_user_id);

DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Reports & moderation audit
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id        UUID NOT NULL REFERENCES public.reviews (id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  reason           VARCHAR(32) NOT NULL
    CHECK (reason IN ('HARASSMENT', 'FALSE_INFORMATION', 'PRIVATE_INFORMATION', 'SPAM', 'OFF_TOPIC', 'OTHER')),
  details          TEXT CHECK (char_length(COALESCE(details, '')) <= 1000),
  status           VARCHAR(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'DISMISSED', 'ACTIONED')),
  resolved_by      UUID REFERENCES public.users (id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT review_reports_one_per_reporter UNIQUE (review_id, reporter_user_id)
);
CREATE INDEX IF NOT EXISTS review_reports_status_idx ON public.review_reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.review_moderation_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     UUID NOT NULL REFERENCES public.reviews (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  action        VARCHAR(24) NOT NULL,
  from_status   VARCHAR(16),
  to_status     VARCHAR(16),
  notes         TEXT,
  report_id     UUID REFERENCES public.review_reports (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS review_moderation_events_review_idx ON public.review_moderation_events (review_id, created_at DESC);

DROP TRIGGER IF EXISTS review_moderation_events_no_update ON public.review_moderation_events;
CREATE TRIGGER review_moderation_events_no_update
  BEFORE UPDATE OR DELETE ON public.review_moderation_events
  FOR EACH ROW EXECUTE FUNCTION public.milestone_events_immutable();

-- -----------------------------------------------------------------------------
-- 3. RLS — reads only; every write goes through service-role RPCs
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS reviews_select_authenticated ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_parties ON public.reviews;
DROP POLICY IF EXISTS reviews_update_parties ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_parties ON public.reviews;
DROP POLICY IF EXISTS reviews_select_admin ON public.reviews;

DROP POLICY IF EXISTS reviews_select_visible ON public.reviews;
CREATE POLICY reviews_select_visible ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (moderation_status = 'VISIBLE');

DROP POLICY IF EXISTS reviews_select_involved ON public.reviews;
CREATE POLICY reviews_select_involved ON public.reviews
  FOR SELECT TO authenticated
  USING (reviewer_user_id = auth.uid() OR reviewee_user_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS review_reports_select ON public.review_reports;
CREATE POLICY review_reports_select ON public.review_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid() OR public.is_admin(auth.uid()));

ALTER TABLE public.review_moderation_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS review_moderation_events_select ON public.review_moderation_events;
CREATE POLICY review_moderation_events_select ON public.review_moderation_events
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 4. Ratings can only be changed by trusted server code (closes self-rating hole)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profile_rating_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_payment_context() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.rating := 0;
    NEW.reviews_count := 0;
  ELSIF NEW.rating IS DISTINCT FROM OLD.rating OR NEW.reviews_count IS DISTINCT FROM OLD.reviews_count THEN
    RAISE EXCEPTION 'Ratings are computed from reviews and cannot be edited directly.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS freelancers_rating_guard ON public.freelancers;
CREATE TRIGGER freelancers_rating_guard
  BEFORE INSERT OR UPDATE ON public.freelancers
  FOR EACH ROW EXECUTE FUNCTION public.profile_rating_guard();

DROP TRIGGER IF EXISTS clients_rating_guard ON public.clients;
CREATE TRIGGER clients_rating_guard
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.profile_rating_guard();

-- -----------------------------------------------------------------------------
-- 5. Rating aggregation (VISIBLE reviews only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._recompute_profile_rating(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_f_avg NUMERIC; v_f_cnt INTEGER;
  v_c_avg NUMERIC; v_c_cnt INTEGER;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);

  SELECT ROUND(AVG(overall_rating), 2), COUNT(*) INTO v_f_avg, v_f_cnt
  FROM public.reviews
  WHERE reviewee_user_id = p_user_id AND review_type = 'CLIENT_TO_FREELANCER' AND moderation_status = 'VISIBLE';
  UPDATE public.freelancers SET rating = COALESCE(v_f_avg, 0), reviews_count = v_f_cnt WHERE user_id = p_user_id;

  SELECT ROUND(AVG(overall_rating), 2), COUNT(*) INTO v_c_avg, v_c_cnt
  FROM public.reviews
  WHERE reviewee_user_id = p_user_id AND review_type = 'FREELANCER_TO_CLIENT' AND moderation_status = 'VISIBLE';
  UPDATE public.clients SET rating = COALESCE(v_c_avg, 0), reviews_count = v_c_cnt WHERE user_id = p_user_id;
END;
$$;

-- Bring existing profile ratings in line with real reviews (removes any manual values)
DO $$
DECLARE r RECORD;
BEGIN
  PERFORM set_config('app.bypass_financial_guard', 'on', TRUE);
  UPDATE public.freelancers SET rating = 0, reviews_count = 0;
  UPDATE public.clients SET rating = 0, reviews_count = 0;
  FOR r IN SELECT DISTINCT reviewee_user_id AS uid FROM public.reviews WHERE reviewee_user_id IS NOT NULL LOOP
    PERFORM public._recompute_profile_rating(r.uid);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 6. Submit a review (eligibility enforced here, not in the browser)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_review(
  p_contract_id UUID,
  p_actor_user_id UUID,
  p_categories JSONB,
  p_feedback TEXT,
  p_highlights TEXT DEFAULT NULL,
  p_strengths TEXT DEFAULT NULL,
  p_improvements TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.contracts%ROWTYPE;
  v_parties RECORD;
  v_type TEXT;
  v_reviewee UUID;
  v_keys TEXT[];
  v_key TEXT;
  v_val INTEGER;
  v_sum INTEGER := 0;
  v_overall NUMERIC(3, 2);
  v_clean JSONB := '{}'::jsonb;
  v_feedback TEXT := btrim(COALESCE(p_feedback, ''));
  v_id UUID;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized RPC execution';
  END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_NOT_FOUND');
  END IF;

  SELECT * INTO v_parties FROM public._ms_parties(p_contract_id);
  IF p_actor_user_id = v_parties.client_user_id THEN
    v_type := 'CLIENT_TO_FREELANCER';
    v_reviewee := v_parties.freelancer_user_id;
    v_keys := ARRAY['work_quality', 'communication', 'technical_skills', 'professionalism', 'deadline_management'];
  ELSIF p_actor_user_id = v_parties.freelancer_user_id THEN
    v_type := 'FREELANCER_TO_CLIENT';
    v_reviewee := v_parties.client_user_id;
    v_keys := ARRAY['communication', 'requirement_clarity', 'professionalism', 'payment_reliability', 'cooperation'];
  ELSE
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_NOT_CONTRACT_PARTY');
  END IF;

  IF v_reviewee IS NULL OR v_reviewee = p_actor_user_id THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_REVIEWEE');
  END IF;

  -- Completion = every payment released and the contract marked completed.
  IF v_contract.payment_status <> 'RELEASED' OR LOWER(v_contract.status) <> 'completed' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CONTRACT_NOT_COMPLETED');
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews WHERE contract_id = p_contract_id AND review_type = v_type) THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'ALREADY_REVIEWED');
  END IF;

  IF jsonb_typeof(p_categories) <> 'object' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_CATEGORIES');
  END IF;
  -- Exactly the expected category keys, each an integer 1–5
  IF (SELECT COUNT(*) FROM jsonb_object_keys(p_categories) k WHERE k <> ALL (v_keys)) > 0 THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_CATEGORIES');
  END IF;
  FOREACH v_key IN ARRAY v_keys LOOP
    IF NOT (p_categories ? v_key) OR jsonb_typeof(p_categories -> v_key) <> 'number' THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_CATEGORIES', 'missing', v_key);
    END IF;
    v_val := (p_categories ->> v_key)::NUMERIC;
    IF (p_categories ->> v_key)::NUMERIC <> v_val OR v_val < 1 OR v_val > 5 THEN
      RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_CATEGORIES', 'key', v_key);
    END IF;
    v_sum := v_sum + v_val;
    v_clean := v_clean || jsonb_build_object(v_key, v_val);
  END LOOP;
  v_overall := ROUND(v_sum::NUMERIC / array_length(v_keys, 1), 2);

  IF char_length(v_feedback) < 20 OR char_length(v_feedback) > 2000 THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_FEEDBACK');
  END IF;
  IF char_length(COALESCE(p_highlights, '')) > 500 OR char_length(COALESCE(p_strengths, '')) > 500
     OR char_length(COALESCE(p_improvements, '')) > 500 THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'OPTIONAL_TEXT_TOO_LONG');
  END IF;

  INSERT INTO public.reviews (
    contract_id, rating, feedback, review_type, reviewer_user_id, reviewee_user_id,
    category_ratings, overall_rating, highlights, strengths, improvements, contract_completed_at
  )
  VALUES (
    p_contract_id, ROUND(v_overall)::INTEGER, v_feedback, v_type, p_actor_user_id, v_reviewee,
    v_clean, v_overall, NULLIF(btrim(p_highlights), ''), NULLIF(btrim(p_strengths), ''),
    NULLIF(btrim(p_improvements), ''), COALESCE(v_contract.released_at, NOW())
  )
  RETURNING id INTO v_id;

  PERFORM public._recompute_profile_rating(v_reviewee);

  PERFORM public._ms_notify(v_reviewee,
    CASE WHEN v_type = 'CLIENT_TO_FREELANCER' THEN 'freelancer' ELSE 'client' END,
    p_contract_id, NULL, 'review_received:' || v_id::text,
    'You received a new review',
    'A ' || ROUND(v_overall, 1) || '★ review was posted for "' || v_parties.project_title || '".',
    'নতুন রিভিউ পেয়েছেন',
    '"' || v_parties.project_title || '"-এর জন্য একটি নতুন রিভিউ দেওয়া হয়েছে।');

  RETURN jsonb_build_object('ok', TRUE, 'review_id', v_id, 'overall_rating', v_overall, 'review_type', v_type);
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Report a review
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.report_review(
  p_review_id UUID, p_actor_user_id UUID, p_reason TEXT, p_details TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review public.reviews%ROWTYPE;
  v_id UUID;
  v_admin RECORD;
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized RPC execution';
  END IF;
  SELECT * INTO v_review FROM public.reviews WHERE id = p_review_id;
  IF NOT FOUND OR v_review.moderation_status = 'REMOVED' THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'REVIEW_NOT_FOUND');
  END IF;
  IF v_review.reviewer_user_id = p_actor_user_id THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'CANNOT_REPORT_OWN_REVIEW');
  END IF;
  IF UPPER(COALESCE(p_reason, '')) NOT IN ('HARASSMENT', 'FALSE_INFORMATION', 'PRIVATE_INFORMATION', 'SPAM', 'OFF_TOPIC', 'OTHER') THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_REASON');
  END IF;
  IF char_length(COALESCE(p_details, '')) > 1000 THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'DETAILS_TOO_LONG');
  END IF;
  IF EXISTS (SELECT 1 FROM public.review_reports WHERE review_id = p_review_id AND reporter_user_id = p_actor_user_id) THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'ALREADY_REPORTED');
  END IF;

  INSERT INTO public.review_reports (review_id, reporter_user_id, reason, details)
  VALUES (p_review_id, p_actor_user_id, UPPER(p_reason), NULLIF(btrim(COALESCE(p_details, '')), ''))
  RETURNING id INTO v_id;

  INSERT INTO public.review_moderation_events (review_id, actor_user_id, action, from_status, to_status, notes, report_id)
  VALUES (p_review_id, p_actor_user_id, 'REPORTED', v_review.moderation_status, v_review.moderation_status, UPPER(p_reason), v_id);

  FOR v_admin IN SELECT user_id FROM public.admins LOOP
    PERFORM public._ms_notify(v_admin.user_id, 'admin', v_review.contract_id, NULL,
      'review_reported:' || v_id::text, 'Review reported',
      'A review was reported for ' || REPLACE(LOWER(UPPER(p_reason)), '_', ' ') || '.',
      'রিভিউ রিপোর্ট করা হয়েছে', 'একটি রিভিউ রিপোর্ট করা হয়েছে।');
  END LOOP;

  RETURN jsonb_build_object('ok', TRUE, 'report_id', v_id);
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. Admin moderation (hide / remove / restore, resolving reports)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.moderate_review(
  p_review_id UUID, p_admin_user_id UUID, p_action TEXT, p_notes TEXT, p_report_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review public.reviews%ROWTYPE;
  v_action TEXT := UPPER(COALESCE(p_action, ''));
  v_to TEXT;
  v_notes TEXT := NULLIF(btrim(COALESCE(p_notes, '')), '');
BEGIN
  IF NOT public.is_trusted_payment_context() THEN
    RAISE EXCEPTION 'Unauthorized RPC execution';
  END IF;
  IF NOT public.is_admin(p_admin_user_id) THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'FORBIDDEN_ADMIN_ONLY');
  END IF;
  IF v_action NOT IN ('HIDE', 'REMOVE', 'RESTORE', 'DISMISS_REPORT') THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_ACTION');
  END IF;
  IF v_notes IS NULL OR char_length(v_notes) < 10 OR char_length(v_notes) > 2000 THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'NOTES_REQUIRED');
  END IF;

  SELECT * INTO v_review FROM public.reviews WHERE id = p_review_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'code', 'REVIEW_NOT_FOUND');
  END IF;

  v_to := CASE v_action
    WHEN 'HIDE' THEN 'HIDDEN'
    WHEN 'REMOVE' THEN 'REMOVED'
    WHEN 'RESTORE' THEN 'VISIBLE'
    ELSE v_review.moderation_status
  END;

  IF v_action <> 'DISMISS_REPORT' THEN
    UPDATE public.reviews SET moderation_status = v_to WHERE id = v_review.id;
  END IF;

  IF p_report_id IS NOT NULL THEN
    UPDATE public.review_reports
    SET status = CASE WHEN v_action = 'DISMISS_REPORT' OR v_action = 'RESTORE' THEN 'DISMISSED' ELSE 'ACTIONED' END,
        resolved_by = p_admin_user_id, resolution_notes = v_notes, resolved_at = NOW()
    WHERE id = p_report_id AND review_id = v_review.id AND status = 'OPEN';
  ELSIF v_action IN ('HIDE', 'REMOVE') THEN
    UPDATE public.review_reports
    SET status = 'ACTIONED', resolved_by = p_admin_user_id, resolution_notes = v_notes, resolved_at = NOW()
    WHERE review_id = v_review.id AND status = 'OPEN';
  END IF;

  INSERT INTO public.review_moderation_events (review_id, actor_user_id, action, from_status, to_status, notes, report_id)
  VALUES (v_review.id, p_admin_user_id, v_action, v_review.moderation_status, v_to, v_notes, p_report_id);

  PERFORM public._recompute_profile_rating(v_review.reviewee_user_id);

  IF v_action IN ('HIDE', 'REMOVE') THEN
    PERFORM public._ms_notify(v_review.reviewer_user_id,
      CASE WHEN v_review.review_type = 'CLIENT_TO_FREELANCER' THEN 'client' ELSE 'freelancer' END,
      v_review.contract_id, NULL, 'review_moderated:' || v_review.id::text || ':' || v_action,
      'Your review was moderated',
      'A review you wrote was ' || LOWER(v_to) || ' for violating platform rules: ' || LEFT(v_notes, 300),
      'আপনার রিভিউ মডারেট করা হয়েছে', 'প্ল্যাটফর্ম নীতিমালা লঙ্ঘনের কারণে আপনার রিভিউ সরানো হয়েছে।');
  END IF;

  RETURN jsonb_build_object('ok', TRUE, 'review_id', v_review.id, 'moderation_status', v_to);
END;
$$;

REVOKE ALL ON FUNCTION public._recompute_profile_rating(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_review(UUID, UUID, JSONB, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_review(UUID, UUID, JSONB, TEXT, TEXT, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.report_review(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_review(UUID, UUID, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.moderate_review(UUID, UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_review(UUID, UUID, TEXT, TEXT, UUID) TO service_role;
