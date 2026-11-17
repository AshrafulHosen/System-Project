-- =============================================================================
-- Manual NID (National ID) document verification
--
-- This is a MANUAL document review by Muktokormo administrators. It is NOT an
-- authentication against the Bangladesh Election Commission NID database.
--
-- * public.nid_verifications   one row per submission (history is kept)
-- * public.nid_verification_events  audit log (submit / view / review / purge)
-- * storage bucket nid-documents     PRIVATE, 5 MB, JPEG/PNG/WebP only,
--                                    no storage policies -> service role only
-- * Profile flags reused (no new profile tables):
--     freelancers.is_nid_verified, clients.is_verified
--   They are set exclusively by an admin approval and are guarded against
--   writes from browser (authenticated / anon) sessions.
-- =============================================================================

-- Depends on public.is_trusted_phone_context() from 20261117000000; recreate
-- defensively so this migration can also be applied on its own.
CREATE OR REPLACE FUNCTION public.is_trusted_phone_context()
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
  IF v_jwt_role IS NOT NULL THEN
    RETURN v_jwt_role = 'service_role';
  END IF;
  RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. Submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nid_verifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_role            TEXT NOT NULL CHECK (user_role IN ('client', 'freelancer')),
  front_image_path     TEXT,
  back_image_path      TEXT,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason     TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) BETWEEN 10 AND 500),
  consent_at           TIMESTAMPTZ NOT NULL,
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at          TIMESTAMPTZ,
  reviewed_by          UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  documents_deleted_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nid_paths_present CHECK (
    documents_deleted_at IS NOT NULL OR (front_image_path IS NOT NULL AND back_image_path IS NOT NULL)
  ),
  CONSTRAINT nid_review_consistency CHECK (
    (status = 'pending'  AND reviewed_at IS NULL AND rejection_reason IS NULL)
    OR (status = 'approved' AND reviewed_at IS NOT NULL AND rejection_reason IS NULL)
    OR (status = 'rejected' AND reviewed_at IS NOT NULL AND rejection_reason IS NOT NULL)
  )
);

-- At most one pending and one approved submission per user (race-safe).
CREATE UNIQUE INDEX IF NOT EXISTS nid_one_pending_per_user
  ON public.nid_verifications (user_id) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS nid_one_approved_per_user
  ON public.nid_verifications (user_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS nid_user_submitted_idx ON public.nid_verifications (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS nid_status_submitted_idx ON public.nid_verifications (status, submitted_at DESC);

CREATE OR REPLACE FUNCTION public.nid_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nid_verifications_touch ON public.nid_verifications;
CREATE TRIGGER nid_verifications_touch
  BEFORE UPDATE ON public.nid_verifications
  FOR EACH ROW EXECUTE FUNCTION public.nid_touch_updated_at();

ALTER TABLE public.nid_verifications ENABLE ROW LEVEL SECURITY;

-- Read-only visibility: owners see their own rows, admins see all.
-- There are NO insert/update/delete policies: every write goes through the
-- service-role functions below, so users cannot change status or reviewer.
DROP POLICY IF EXISTS nid_select_own ON public.nid_verifications;
CREATE POLICY nid_select_own ON public.nid_verifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS nid_select_admin ON public.nid_verifications;
CREATE POLICY nid_select_admin ON public.nid_verifications
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

REVOKE ALL ON public.nid_verifications FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.nid_verifications FROM authenticated;
GRANT SELECT ON public.nid_verifications TO authenticated;
GRANT ALL ON public.nid_verifications TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nid_verification_events (
  id              BIGSERIAL PRIMARY KEY,
  verification_id UUID REFERENCES public.nid_verifications (id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  event           TEXT NOT NULL CHECK (event IN ('submitted', 'documents_viewed', 'approved', 'rejected', 'documents_deleted')),
  details         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nid_events_verification_idx ON public.nid_verification_events (verification_id, created_at DESC);

ALTER TABLE public.nid_verification_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nid_events_select_admin ON public.nid_verification_events;
CREATE POLICY nid_events_select_admin ON public.nid_verification_events
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
REVOKE ALL ON public.nid_verification_events FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.nid_verification_events FROM authenticated;
GRANT SELECT ON public.nid_verification_events TO authenticated;
GRANT ALL ON public.nid_verification_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.nid_verification_events_id_seq TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Profile flags: only an approval may set them
-- ---------------------------------------------------------------------------
-- Flags previously had no review behind them; reset so the badge only ever
-- reflects an approved submission.
UPDATE public.freelancers f SET is_nid_verified = FALSE
 WHERE is_nid_verified AND NOT EXISTS (
   SELECT 1 FROM public.nid_verifications v WHERE v.user_id = f.user_id AND v.status = 'approved');
UPDATE public.clients c SET is_verified = FALSE
 WHERE is_verified AND NOT EXISTS (
   SELECT 1 FROM public.nid_verifications v WHERE v.user_id = c.user_id AND v.status = 'approved');

CREATE OR REPLACE FUNCTION public.freelancers_nid_flag_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_phone_context() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_nid_verified := FALSE;
  ELSIF NEW.is_nid_verified IS DISTINCT FROM OLD.is_nid_verified THEN
    RAISE EXCEPTION 'Identity verification can only be granted by an administrator review.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS freelancers_nid_flag_guard ON public.freelancers;
CREATE TRIGGER freelancers_nid_flag_guard
  BEFORE INSERT OR UPDATE ON public.freelancers
  FOR EACH ROW EXECUTE FUNCTION public.freelancers_nid_flag_guard();

CREATE OR REPLACE FUNCTION public.clients_nid_flag_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_phone_context() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := FALSE;
  ELSIF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Identity verification can only be granted by an administrator review.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_nid_flag_guard ON public.clients;
CREATE TRIGGER clients_nid_flag_guard
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.clients_nid_flag_guard();

-- ---------------------------------------------------------------------------
-- 4. Private storage bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('nid-documents', 'nid-documents', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No storage.objects policies are created for this bucket on purpose:
-- anon/authenticated sessions can neither list, read, write nor delete NID
-- objects. Uploads use one-time signed upload tokens minted by the server for
-- the caller's own folder; viewing uses short-lived signed URLs minted for
-- admins only.

-- ---------------------------------------------------------------------------
-- 5. RPC: create a submission
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nid_submit(
  p_user_id       UUID,
  p_role          TEXT,
  p_submission_id UUID,
  p_front_path    TEXT,
  p_back_path     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_superseded TEXT[] := ARRAY[]::TEXT[];
  v_row        public.nid_verifications%ROWTYPE;
BEGIN
  IF p_role NOT IN ('client', 'freelancer') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ROLE_NOT_ALLOWED');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('nid_user:' || p_user_id::text, 0));

  IF EXISTS (SELECT 1 FROM public.nid_verifications WHERE user_id = p_user_id AND status = 'pending') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PENDING_EXISTS');
  END IF;
  IF EXISTS (SELECT 1 FROM public.nid_verifications WHERE user_id = p_user_id AND status = 'approved') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_VERIFIED');
  END IF;

  -- Documents of earlier rejected submissions are no longer needed.
  SELECT COALESCE(array_agg(p.path), ARRAY[]::TEXT[]) INTO v_superseded
    FROM public.nid_verifications v
    CROSS JOIN LATERAL unnest(ARRAY[v.front_image_path, v.back_image_path]) AS p(path)
   WHERE v.user_id = p_user_id
     AND v.status = 'rejected'
     AND v.documents_deleted_at IS NULL
     AND p.path IS NOT NULL;

  UPDATE public.nid_verifications
     SET front_image_path = NULL,
         back_image_path = NULL,
         documents_deleted_at = now()
   WHERE user_id = p_user_id
     AND status = 'rejected'
     AND documents_deleted_at IS NULL;

  INSERT INTO public.nid_verifications (id, user_id, user_role, front_image_path, back_image_path, status, consent_at)
  VALUES (p_submission_id, p_user_id, p_role, p_front_path, p_back_path, 'pending', now())
  RETURNING * INTO v_row;

  INSERT INTO public.nid_verification_events (verification_id, actor_user_id, event)
  VALUES (v_row.id, p_user_id, 'submitted');

  INSERT INTO public.notifications (user_id, role_target, event_key, title, message, title_bn, message_bn)
  VALUES (p_user_id, p_role, 'nid_submitted:' || v_row.id::text,
          'Identity documents submitted',
          'Your NID documents were received and are waiting for review by the Muktokormo team.',
          'পরিচয়পত্র জমা হয়েছে',
          'আপনার এনআইডি নথি গ্রহণ করা হয়েছে এবং পর্যালোচনার অপেক্ষায় আছে।')
  ON CONFLICT (user_id, event_key) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'submitted_at', v_row.submitted_at,
    'superseded_paths', to_jsonb(v_superseded)
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PENDING_EXISTS');
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC: admin review (approve / reject), single transition from pending
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nid_review(
  p_admin_user_id UUID,
  p_verification  UUID,
  p_decision      TEXT,
  p_reason        TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row    public.nid_verifications%ROWTYPE;
  v_reason TEXT := NULLIF(btrim(COALESCE(p_reason, '')), '');
BEGIN
  IF NOT public.is_admin(p_admin_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_ADMIN');
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_DECISION');
  END IF;
  IF p_decision = 'rejected' AND (v_reason IS NULL OR char_length(v_reason) < 10 OR char_length(v_reason) > 500) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'REASON_REQUIRED');
  END IF;

  SELECT * INTO v_row FROM public.nid_verifications WHERE id = p_verification FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;
  IF v_row.user_id = p_admin_user_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'SELF_REVIEW');
  END IF;
  IF v_row.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_REVIEWED', 'status', v_row.status);
  END IF;

  UPDATE public.nid_verifications
     SET status           = p_decision,
         rejection_reason = CASE WHEN p_decision = 'rejected' THEN v_reason ELSE NULL END,
         reviewed_by      = p_admin_user_id,
         reviewed_at      = now()
   WHERE id = p_verification
  RETURNING * INTO v_row;

  IF p_decision = 'approved' THEN
    IF v_row.user_role = 'freelancer' THEN
      UPDATE public.freelancers SET is_nid_verified = TRUE WHERE user_id = v_row.user_id;
    ELSE
      UPDATE public.clients SET is_verified = TRUE WHERE user_id = v_row.user_id;
    END IF;

    INSERT INTO public.notifications (user_id, role_target, event_key, title, message, title_bn, message_bn)
    VALUES (v_row.user_id, v_row.user_role, 'nid_approved:' || v_row.id::text,
            'Identity verified',
            'Your NID documents were reviewed and approved. An Identity Verified badge now appears on your profile.',
            'পরিচয় যাচাই সম্পন্ন',
            'আপনার এনআইডি নথি পর্যালোচনা করে অনুমোদন করা হয়েছে। আপনার প্রোফাইলে এখন পরিচয় যাচাইকৃত ব্যাজ দেখা যাবে।')
    ON CONFLICT (user_id, event_key) DO NOTHING;
  ELSE
    INSERT INTO public.notifications (user_id, role_target, event_key, title, message, title_bn, message_bn)
    VALUES (v_row.user_id, v_row.user_role, 'nid_rejected:' || v_row.id::text,
            'Identity verification needs attention',
            'Your NID submission was not approved: ' || v_reason || ' You can upload corrected documents from your profile settings.',
            'পরিচয় যাচাই অনুমোদিত হয়নি',
            'আপনার এনআইডি জমা অনুমোদিত হয়নি: ' || v_reason || ' প্রোফাইল সেটিংস থেকে সংশোধিত নথি আবার জমা দিন।')
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  INSERT INTO public.nid_verification_events (verification_id, actor_user_id, event, details)
  VALUES (v_row.id, p_admin_user_id, p_decision,
          CASE WHEN p_decision = 'rejected' THEN jsonb_build_object('reason', v_reason) ELSE '{}'::jsonb END);

  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'status', v_row.status, 'reviewed_at', v_row.reviewed_at);
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Retention helpers
--    approved documents: kept 90 days after approval
--    rejected documents: kept 30 days after rejection (or until resubmission)
--    orphan uploads never attached to a submission: removed after 24 hours
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nid_retention_candidates(
  p_approved_days INTEGER DEFAULT 90,
  p_rejected_days INTEGER DEFAULT 30,
  p_orphan_hours  INTEGER DEFAULT 24
)
RETURNS TABLE (verification_id UUID, object_path TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT v.id, p.path
    FROM public.nid_verifications v
    CROSS JOIN LATERAL unnest(ARRAY[v.front_image_path, v.back_image_path]) AS p(path)
   WHERE v.documents_deleted_at IS NULL
     AND p.path IS NOT NULL
     AND (
       (v.status = 'approved' AND v.reviewed_at < now() - make_interval(days => p_approved_days))
       OR (v.status = 'rejected' AND v.reviewed_at < now() - make_interval(days => p_rejected_days))
     )
  UNION ALL
  SELECT NULL::UUID, o.name
    FROM storage.objects o
   WHERE o.bucket_id = 'nid-documents'
     AND o.created_at < now() - make_interval(hours => p_orphan_hours)
     AND NOT EXISTS (
       SELECT 1 FROM public.nid_verifications v
        WHERE v.front_image_path = o.name OR v.back_image_path = o.name
     );
$$;

CREATE OR REPLACE FUNCTION public.nid_mark_documents_deleted(p_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH done AS (
    UPDATE public.nid_verifications
       SET front_image_path = NULL,
           back_image_path = NULL,
           documents_deleted_at = now()
     WHERE id = ANY (p_ids) AND documents_deleted_at IS NULL
    RETURNING id
  ), ev AS (
    INSERT INTO public.nid_verification_events (verification_id, event, details)
    SELECT id, 'documents_deleted', jsonb_build_object('reason', 'retention') FROM done
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM done;
  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Privileges: service role only
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.nid_submit(UUID, TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nid_submit(UUID, TEXT, UUID, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.nid_review(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nid_review(UUID, UUID, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.nid_retention_candidates(INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nid_retention_candidates(INTEGER, INTEGER, INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.nid_mark_documents_deleted(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nid_mark_documents_deleted(UUID[]) TO service_role;
