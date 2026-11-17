-- Allow the site assistant's usage to be logged (for per-user rate limiting).
ALTER TABLE public.ai_generations DROP CONSTRAINT IF EXISTS ai_generations_kind_check;
ALTER TABLE public.ai_generations ADD CONSTRAINT ai_generations_kind_check
  CHECK (kind IN ('PROPOSAL', 'PROJECT_BRIEF', 'ASSISTANT'));
