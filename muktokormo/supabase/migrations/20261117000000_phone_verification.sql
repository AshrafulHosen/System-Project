-- =============================================================================
-- Phone number verification (Nishchit SMS OTP)
--
-- * public.users gains phone_number / phone_verified / phone_verified_at.
--   Existing rows are NOT marked verified.
-- * Verification columns can only be changed from trusted server context
--   (service_role or direct DB session). A browser session holding an
--   `authenticated` JWT cannot flip phone_verified, even though the
--   users_update_own RLS policy lets it update its own row.
-- * public.phone_verifications holds at most one pending OTP per user
--   (HMAC hash only, never the plain code).
-- * public.phone_otp_send_log backs rate limiting by user, phone and IP hash.
-- * All OTP state transitions go through SECURITY DEFINER functions that only
--   service_role may execute, so attempt counting and single-use consumption
--   are atomic.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profile columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone_number      TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_number_format;
ALTER TABLE public.users
  ADD CONSTRAINT users_phone_number_format
  CHECK (phone_number IS NULL OR phone_number ~ '^\+8801[3-9][0-9]{8}$') NOT VALID;

-- A phone number can be the verified number of only one account.
CREATE UNIQUE INDEX IF NOT EXISTS users_verified_phone_unique
  ON public.users (phone_number)
  WHERE phone_verified AND phone_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Trusted-context helper + guard trigger on public.users
-- ---------------------------------------------------------------------------
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

  -- Any PostgREST request: only service_role is trusted.
  IF v_jwt_role IS NOT NULL THEN
    RETURN v_jwt_role = 'service_role';
  END IF;

  -- No JWT at all: direct database session (migrations, SQL editor, auth hooks).
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.users_phone_guard()
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
    NEW.phone_number      := NULL;
    NEW.phone_verified    := FALSE;
    NEW.phone_verified_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.phone_number      IS DISTINCT FROM OLD.phone_number
  OR NEW.phone_verified    IS DISTINCT FROM OLD.phone_verified
  OR NEW.phone_verified_at IS DISTINCT FROM OLD.phone_verified_at THEN
    RAISE EXCEPTION 'Phone verification fields can only be changed through phone verification.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_phone_guard ON public.users;
CREATE TRIGGER users_phone_guard
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_phone_guard();

-- ---------------------------------------------------------------------------
-- 3. Pending OTP records (one per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL CHECK (phone_number ~ '^\+8801[3-9][0-9]{8}$'),
  otp_hash     TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
-- No policies: anon/authenticated have no access; only service_role (bypasses RLS)
REVOKE ALL ON public.phone_verifications FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.phone_verifications TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Send log for rate limiting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phone_otp_send_log (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  ip_hash      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otp_send_log_user_idx  ON public.phone_otp_send_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS phone_otp_send_log_phone_idx ON public.phone_otp_send_log (phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS phone_otp_send_log_ip_idx    ON public.phone_otp_send_log (ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;

ALTER TABLE public.phone_otp_send_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.phone_otp_send_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.phone_otp_send_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.phone_otp_send_log_id_seq TO service_role;

-- ---------------------------------------------------------------------------
-- 5. RPC: reserve an OTP send (cooldown + rate limits + uniqueness, atomic)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.phone_otp_begin_send(
  p_user_id         UUID,
  p_phone           TEXT,
  p_ip_hash         TEXT,
  p_otp_hash        TEXT,
  p_ttl_seconds     INTEGER,
  p_cooldown_secs   INTEGER,
  p_max_per_user    INTEGER,
  p_max_per_phone   INTEGER,
  p_max_per_ip      INTEGER,
  p_window_seconds  INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_sent  TIMESTAMPTZ;
  v_count      INTEGER;
  v_window     TIMESTAMPTZ := now() - make_interval(secs => p_window_seconds);
  v_retry      INTEGER;
  v_log_id     BIGINT;
  v_expires    TIMESTAMPTZ;
BEGIN
  IF p_phone !~ '^\+8801[3-9][0-9]{8}$' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PHONE');
  END IF;

  -- Serialise concurrent sends for the same user and the same phone.
  PERFORM pg_advisory_xact_lock(hashtextextended('phone_otp_user:' || p_user_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('phone_otp_phone:' || p_phone, 0));

  -- Already the caller's verified number?
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND phone_verified AND phone_number = p_phone
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_VERIFIED');
  END IF;

  -- Verified on another account?
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id <> p_user_id AND phone_verified AND phone_number = p_phone
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PHONE_IN_USE');
  END IF;

  -- Per-user resend cooldown.
  SELECT max(created_at) INTO v_last_sent
  FROM public.phone_otp_send_log WHERE user_id = p_user_id;
  IF v_last_sent IS NOT NULL AND v_last_sent > now() - make_interval(secs => p_cooldown_secs) THEN
    v_retry := CEIL(EXTRACT(EPOCH FROM (v_last_sent + make_interval(secs => p_cooldown_secs) - now())))::INTEGER;
    RETURN jsonb_build_object('ok', false, 'code', 'COOLDOWN', 'retry_after', GREATEST(v_retry, 1));
  END IF;

  -- Rolling-window rate limits.
  SELECT count(*) INTO v_count FROM public.phone_otp_send_log
  WHERE user_id = p_user_id AND created_at > v_window;
  IF v_count >= p_max_per_user THEN
    RETURN jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  END IF;

  SELECT count(*) INTO v_count FROM public.phone_otp_send_log
  WHERE phone_number = p_phone AND created_at > v_window;
  IF v_count >= p_max_per_phone THEN
    RETURN jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  END IF;

  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.phone_otp_send_log
    WHERE ip_hash = p_ip_hash AND created_at > v_window;
    IF v_count >= p_max_per_ip THEN
      RETURN jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
    END IF;
  END IF;

  INSERT INTO public.phone_otp_send_log (user_id, phone_number, ip_hash)
  VALUES (p_user_id, p_phone, p_ip_hash)
  RETURNING id INTO v_log_id;

  v_expires := now() + make_interval(secs => p_ttl_seconds);

  -- Replacing the pending row invalidates any previously issued code.
  INSERT INTO public.phone_verifications (user_id, phone_number, otp_hash, expires_at, attempts, created_at)
  VALUES (p_user_id, p_phone, p_otp_hash, v_expires, 0, now())
  ON CONFLICT (user_id) DO UPDATE
    SET phone_number = EXCLUDED.phone_number,
        otp_hash     = EXCLUDED.otp_hash,
        expires_at   = EXCLUDED.expires_at,
        attempts     = 0,
        created_at   = EXCLUDED.created_at;

  RETURN jsonb_build_object('ok', true, 'log_id', v_log_id, 'expires_at', v_expires);
END;
$$;

-- Undo a reservation when the SMS provider rejected the message, so the user
-- is not stuck behind a cooldown for an SMS that was never sent.
CREATE OR REPLACE FUNCTION public.phone_otp_abort_send(
  p_user_id  UUID,
  p_log_id   BIGINT,
  p_otp_hash TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.phone_verifications
  WHERE user_id = p_user_id AND otp_hash = p_otp_hash;
  DELETE FROM public.phone_otp_send_log
  WHERE id = p_log_id AND user_id = p_user_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC: atomically spend one verification attempt
--    Returns the stored hash to the trusted server, which compares it with a
--    timing-safe equality check.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.phone_otp_take_attempt(
  p_user_id      UUID,
  p_max_attempts INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.phone_verifications%ROWTYPE;
BEGIN
  UPDATE public.phone_verifications
     SET attempts = attempts + 1
   WHERE user_id = p_user_id
     AND attempts < p_max_attempts
     AND expires_at > now()
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'phone_number', v_row.phone_number,
      'otp_hash', v_row.otp_hash,
      'attempts', v_row.attempts
    );
  END IF;

  SELECT * INTO v_row FROM public.phone_verifications WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_PENDING');
  ELSIF v_row.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'EXPIRED');
  ELSE
    RETURN jsonb_build_object('ok', false, 'code', 'TOO_MANY_ATTEMPTS');
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC: consume a matched OTP and mark the phone verified (single use)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.phone_otp_complete(
  p_user_id  UUID,
  p_otp_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_now   TIMESTAMPTZ := now();
BEGIN
  -- Deleting by (user, hash) makes the code single-use even under races.
  DELETE FROM public.phone_verifications
   WHERE user_id = p_user_id
     AND otp_hash = p_otp_hash
     AND expires_at > v_now
  RETURNING phone_number INTO v_phone;

  IF v_phone IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_PENDING');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('phone_otp_phone:' || v_phone, 0));

  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id <> p_user_id AND phone_verified AND phone_number = v_phone
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PHONE_IN_USE');
  END IF;

  UPDATE public.users
     SET phone_number      = v_phone,
         phone_verified    = TRUE,
         phone_verified_at = v_now
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_PROFILE');
  END IF;

  RETURN jsonb_build_object('ok', true, 'phone_number', v_phone, 'verified_at', v_now);
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Privileges: server (service_role) only
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.phone_otp_begin_send(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_otp_begin_send(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.phone_otp_abort_send(UUID, BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_otp_abort_send(UUID, BIGINT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.phone_otp_take_attempt(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_otp_take_attempt(UUID, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.phone_otp_complete(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_otp_complete(UUID, TEXT) TO service_role;
