-- =============================================================================
-- Two-sided reviews — database-level tests (LOCAL database only; rolled back)
--   docker exec -i <supabase_db_container> psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/reviews.test.sql
-- =============================================================================
BEGIN;

CREATE FUNCTION pg_temp.ok(cond BOOLEAN, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF NOT COALESCE(cond, FALSE) THEN RAISE EXCEPTION 'FAIL: %', msg; END IF;
  RAISE NOTICE 'PASS: %', msg;
END $$;
CREATE FUNCTION pg_temp.code(r JSONB) RETURNS TEXT LANGUAGE sql AS $$ SELECT r ->> 'code' $$;

CREATE TEMP TABLE ids (k TEXT PRIMARY KEY, v UUID);

DO $$
DECLARE
  cu UUID := gen_random_uuid(); fu UUID := gen_random_uuid(); au UUID := gen_random_uuid(); ou UUID := gen_random_uuid();
  cl UUID; fl UUID; pr UUID; pp UUID; pp2 UUID; done UUID; open_ct UUID;
BEGIN
  INSERT INTO auth.users (id, email, aud, role) VALUES
    (cu, 'rc-' || cu || '@t.local', 'authenticated', 'authenticated'),
    (fu, 'rf-' || fu || '@t.local', 'authenticated', 'authenticated'),
    (au, 'ra-' || au || '@t.local', 'authenticated', 'authenticated'),
    (ou, 'ro-' || ou || '@t.local', 'authenticated', 'authenticated');
  INSERT INTO public.clients (user_id, rating, reviews_count) VALUES (cu, 5, 99) RETURNING id INTO cl;
  INSERT INTO public.freelancers (user_id) VALUES (fu) RETURNING id INTO fl;
  INSERT INTO public.admins (user_id) VALUES (au);
  INSERT INTO public.projects (client_id, title, description, status) VALUES (cl, 'Review test', 'Review test project here', 'completed') RETURNING id INTO pr;
  INSERT INTO public.proposals (project_id, freelancer_id, cover_letter, bid_amount, status) VALUES (pr, fl, 'c', 5000, 'accepted') RETURNING id INTO pp;
  INSERT INTO public.contracts (proposal_id, total_amount, status, project_id, client_id, freelancer_id, payment_status, work_status, released_at)
  VALUES (pp, 5000, 'completed', pr, cl, fl, 'RELEASED', 'RELEASED', NOW()) RETURNING id INTO done;

  INSERT INTO public.projects (client_id, title, description, status) VALUES (cl, 'Open project', 'Not finished yet at all', 'in_progress') RETURNING id INTO pr;
  INSERT INTO public.proposals (project_id, freelancer_id, cover_letter, bid_amount, status) VALUES (pr, fl, 'c', 5000, 'accepted') RETURNING id INTO pp2;
  INSERT INTO public.contracts (proposal_id, total_amount, status, project_id, client_id, freelancer_id, payment_status, work_status)
  VALUES (pp2, 5000, 'active', pr, cl, fl, 'FUNDED', 'SUBMITTED') RETURNING id INTO open_ct;

  INSERT INTO ids VALUES ('cu', cu), ('fu', fu), ('au', au), ('ou', ou), ('done', done), ('open', open_ct), ('cl', cl), ('fl', fl);
END $$;

DO $$
DECLARE
  cu UUID := (SELECT v FROM ids WHERE k='cu'); fu UUID := (SELECT v FROM ids WHERE k='fu');
  au UUID := (SELECT v FROM ids WHERE k='au'); ou UUID := (SELECT v FROM ids WHERE k='ou');
  done UUID := (SELECT v FROM ids WHERE k='done'); open_ct UUID := (SELECT v FROM ids WHERE k='open');
  good_fl JSONB := '{"work_quality":5,"communication":4,"technical_skills":5,"professionalism":4,"deadline_management":5}';
  good_cl JSONB := '{"communication":5,"requirement_clarity":3,"professionalism":4,"payment_reliability":5,"cooperation":4}';
  fb TEXT := 'Delivered a clean, well documented storefront ahead of schedule.';
  r JSONB; rid UUID; rep UUID;
BEGIN
  r := public.submit_review(open_ct, cu, good_fl, fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'CONTRACT_NOT_COMPLETED', 'cannot review an unfinished contract');
  r := public.submit_review(done, ou, good_fl, fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_NOT_CONTRACT_PARTY', 'unrelated user cannot review');
  r := public.submit_review(done, cu, '{"work_quality":5}', fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_CATEGORIES', 'missing categories rejected');
  r := public.submit_review(done, cu, good_fl || '{"bonus":5}', fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_CATEGORIES', 'unknown category rejected');
  r := public.submit_review(done, cu, jsonb_set(good_fl, '{work_quality}', '6'), fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_CATEGORIES', 'score above 5 rejected');
  r := public.submit_review(done, cu, jsonb_set(good_fl, '{work_quality}', '4.5'), fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_CATEGORIES', 'fractional score rejected');
  r := public.submit_review(done, cu, good_cl, fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_CATEGORIES', 'client must use freelancer categories');
  r := public.submit_review(done, cu, good_fl, 'Too short');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_FEEDBACK', 'feedback under 20 characters rejected');

  r := public.submit_review(done, cu, good_fl, fb, 'Great storefront', 'Fast, clear communicator', NULL);
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN AND (r ->> 'overall_rating')::NUMERIC = 4.60, 'client review accepted, overall = 4.60 computed server-side');
  rid := (r ->> 'review_id')::UUID;
  PERFORM pg_temp.ok((SELECT rating = 4.60 AND reviews_count = 1 FROM public.freelancers WHERE user_id = fu), 'freelancer rating recomputed from reviews');

  r := public.submit_review(done, cu, good_fl, fb);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'ALREADY_REVIEWED', 'second client review blocked');

  r := public.submit_review(done, fu, good_cl, 'Clear brief and paid promptly on approval.');
  PERFORM pg_temp.ok((r ->> 'review_type') = 'FREELANCER_TO_CLIENT' AND (r ->> 'overall_rating')::NUMERIC = 4.20, 'freelancer reviews client (4.20)');
  PERFORM pg_temp.ok((SELECT rating = 4.20 AND reviews_count = 1 FROM public.clients WHERE user_id = cu), 'client rating recomputed');
  PERFORM pg_temp.ok(EXISTS (SELECT 1 FROM public.notifications WHERE user_id = fu AND event_key = 'review_received:' || rid), 'reviewee notified');

  -- reports
  r := public.report_review(rid, cu, 'SPAM', NULL);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'CANNOT_REPORT_OWN_REVIEW', 'cannot report your own review');
  r := public.report_review(rid, fu, 'NOT_A_REASON', NULL);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_REASON', 'unknown report reason rejected');
  r := public.report_review(rid, fu, 'FALSE_INFORMATION', 'The deadline claim is wrong.');
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN, 'reviewee reports the review');
  rep := (r ->> 'report_id')::UUID;
  r := public.report_review(rid, fu, 'SPAM', NULL);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'ALREADY_REPORTED', 'duplicate report blocked');
  PERFORM pg_temp.ok(EXISTS (SELECT 1 FROM public.notifications WHERE user_id = au AND event_key = 'review_reported:' || rep), 'admins notified of report');

  -- moderation
  r := public.moderate_review(rid, fu, 'HIDE', 'Trying to hide a review about myself.');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_ADMIN_ONLY', 'only admins moderate');
  r := public.moderate_review(rid, au, 'HIDE', 'short');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'NOTES_REQUIRED', 'moderation requires notes');
  r := public.moderate_review(rid, au, 'HIDE', 'Contains a disputed factual claim; hidden pending review.', rep);
  PERFORM pg_temp.ok(r ->> 'moderation_status' = 'HIDDEN', 'admin hides the review');
  PERFORM pg_temp.ok((SELECT rating = 0 AND reviews_count = 0 FROM public.freelancers WHERE user_id = fu), 'hidden review excluded from rating');
  PERFORM pg_temp.ok((SELECT status = 'ACTIONED' FROM public.review_reports WHERE id = rep), 'report marked actioned');
  r := public.moderate_review(rid, au, 'RESTORE', 'Claim verified against the contract timeline.');
  PERFORM pg_temp.ok((SELECT rating = 4.60 AND reviews_count = 1 FROM public.freelancers WHERE user_id = fu), 'restored review counts again');
  PERFORM pg_temp.ok((SELECT COUNT(*) = 3 FROM public.review_moderation_events WHERE review_id = rid), 'every moderation step audited');
END $$;

-- ------------------------------------------------- browser roles
SELECT set_config('test.fu', (SELECT v FROM ids WHERE k='fu')::TEXT, TRUE),
       set_config('test.done', (SELECT v FROM ids WHERE k='done')::TEXT, TRUE);
SELECT set_config('test.ou', (SELECT v FROM ids WHERE k='ou')::TEXT, TRUE);

-- an authenticated user creating their own client profile cannot seed a rating
SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',current_setting('test.ou'))::TEXT, TRUE);
SET LOCAL ROLE authenticated;
INSERT INTO public.clients (user_id, rating, reviews_count) VALUES (current_setting('test.ou')::UUID, 5, 99);
RESET ROLE;
DO $$ BEGIN
  PERFORM pg_temp.ok((SELECT rating = 0 AND reviews_count = 0 FROM public.clients WHERE user_id = current_setting('test.ou')::UUID),
    'browser-created profile cannot seed a rating (forced to 0)');
END $$;

SELECT set_config('request.jwt.claims', json_build_object('role','authenticated','sub',current_setting('test.fu'))::TEXT, TRUE);
SET LOCAL ROLE authenticated;

DO $$
DECLARE n INT;
BEGIN
  BEGIN
    UPDATE public.freelancers SET rating = 5, reviews_count = 500 WHERE user_id = current_setting('test.fu')::UUID;
    PERFORM pg_temp.ok(FALSE, 'freelancer must not set own rating');
  EXCEPTION WHEN raise_exception THEN
    PERFORM pg_temp.ok(TRUE, 'freelancer cannot edit own rating (self-rating hole closed)');
  END;

  BEGIN
    UPDATE public.freelancers SET bio = 'Updated bio' WHERE user_id = current_setting('test.fu')::UUID;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.ok(n = 1, 'normal profile edits still work');
  END;

  BEGIN
    INSERT INTO public.reviews (contract_id, rating, feedback, review_type, overall_rating)
    VALUES (current_setting('test.done')::UUID, 5, 'Self-serving fake review text', 'FREELANCER_TO_CLIENT', 5);
    PERFORM pg_temp.ok(FALSE, 'direct review insert must be blocked');
  EXCEPTION WHEN insufficient_privilege OR unique_violation THEN
    PERFORM pg_temp.ok(TRUE, 'browser cannot insert reviews directly');
  END;

  BEGIN
    PERFORM public.submit_review(current_setting('test.done')::UUID, current_setting('test.fu')::UUID, '{}'::jsonb, 'x');
    PERFORM pg_temp.ok(FALSE, 'browser must not call submit_review');
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.ok(TRUE, 'browser cannot call submit_review RPC');
  END;
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', TRUE);
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM pg_temp.ok((SELECT COUNT(*) = 2 FROM public.reviews WHERE contract_id = current_setting('test.done')::UUID),
    'visible reviews are public');
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL REVIEW TESTS PASSED'; END $$;
ROLLBACK;
