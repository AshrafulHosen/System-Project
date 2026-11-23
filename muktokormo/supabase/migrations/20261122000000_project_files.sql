-- =============================================================================
-- Project files: documents a client attaches to a job post.
--
-- Before this migration the job-post "Attach file" control only kept the file
-- name in browser state; nothing was uploaded or stored, so hired freelancers
-- never received the client's files.
--
-- * public.project_files    metadata, one row per file
-- * bucket project-files     PRIVATE, 20 MB, document/image/zip types only,
--                            no storage policies -> service role only
-- * public.project_file_access(project, user) decides who may see files:
--     owner  - the client who owns the project (may upload / delete)
--     hired  - a freelancer with a contract on the project
--     admin  - platform administrators
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  uploaded_by  UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL UNIQUE,
  file_name    TEXT NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 200),
  mime_type    TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 20971520),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_files_project_idx ON public.project_files (project_id, created_at);

-- ---------------------------------------------------------------------------
-- Access helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.project_file_access(p_project_id UUID, p_uid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_uid IS NULL THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM public.projects pr
      JOIN public.clients c ON c.id = pr.client_id
      WHERE pr.id = p_project_id AND c.user_id = p_uid
    ) THEN 'owner'
    WHEN EXISTS (
      SELECT 1
      FROM public.contracts ct
      LEFT JOIN public.proposals p ON p.id = ct.proposal_id
      JOIN public.freelancers f ON f.id = COALESCE(ct.freelancer_id, p.freelancer_id)
      WHERE COALESCE(ct.project_id, p.project_id) = p_project_id
        AND f.user_id = p_uid
    ) THEN 'hired'
    WHEN public.is_admin(p_uid) THEN 'admin'
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.project_file_access(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.project_file_access(UUID, UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS: read-only for parties; all writes go through the server (service role)
-- ---------------------------------------------------------------------------
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_files_select_party ON public.project_files;
CREATE POLICY project_files_select_party ON public.project_files
  FOR SELECT TO authenticated
  USING (public.project_file_access(project_id, auth.uid()) IS NOT NULL);

REVOKE ALL ON public.project_files FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.project_files FROM authenticated;
GRANT SELECT ON public.project_files TO authenticated;
GRANT ALL ON public.project_files TO service_role;

-- ---------------------------------------------------------------------------
-- Private storage bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files', 'project-files', FALSE, 20971520,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
-- No storage.objects policies: browser sessions cannot read or write this
-- bucket directly. The server mints signed upload/download URLs after
-- checking project_file_access().
