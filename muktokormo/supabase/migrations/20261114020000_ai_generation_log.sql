-- =============================================================================
-- AI generation log (usage metadata + rate limiting)
--
-- Stores ONLY metadata: who, which feature, which model, token counts, outcome.
-- Prompts, job descriptions, profiles and generated text are never stored.
-- Written only by the server (service role); users can read their own rows.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  kind              VARCHAR(24) NOT NULL CHECK (kind IN ('PROPOSAL', 'PROJECT_BRIEF')),
  action            VARCHAR(32) NOT NULL,
  related_id        UUID,
  provider          VARCHAR(32) NOT NULL,
  model             VARCHAR(80) NOT NULL,
  prompt_tokens     INTEGER CHECK (prompt_tokens IS NULL OR prompt_tokens >= 0),
  completion_tokens INTEGER CHECK (completion_tokens IS NULL OR completion_tokens >= 0),
  status            VARCHAR(16) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'REJECTED')),
  error_code        VARCHAR(48),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_generations_user_window_idx
  ON public.ai_generations (user_id, kind, created_at DESC);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_generations_select_own ON public.ai_generations;
CREATE POLICY ai_generations_select_own ON public.ai_generations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
-- No INSERT/UPDATE/DELETE policies: only the service role writes this table.
