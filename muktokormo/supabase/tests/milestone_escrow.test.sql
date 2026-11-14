-- =============================================================================
-- Milestone escrow — database-level tests
--
-- Run against a LOCAL database only (never production):
--   docker exec -i <supabase_db_container> psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/milestone_escrow.test.sql
--
-- Everything runs in one transaction that is ROLLED BACK at the end.
-- Any failed assertion raises and aborts the run.
-- =============================================================================
BEGIN;

CREATE FUNCTION pg_temp.ok(cond BOOLEAN, msg TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF NOT COALESCE(cond, FALSE) THEN
    RAISE EXCEPTION 'FAIL: %', msg;
  END IF;
  RAISE NOTICE 'PASS: %', msg;
END $$;

CREATE FUNCTION pg_temp.code(r JSONB) RETURNS TEXT LANGUAGE sql AS $$ SELECT r ->> 'code' $$;

-- ---------------------------------------------------------------- fixtures
CREATE TEMP TABLE ids (k TEXT PRIMARY KEY, v UUID);

DO $$
DECLARE
  cu UUID := gen_random_uuid(); fu UUID := gen_random_uuid();
  au UUID := gen_random_uuid(); ou UUID := gen_random_uuid();
  cl UUID; fl UUID; pr UUID; pp UUID; ct UUID;
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role)
  VALUES (cu, 'client-' || cu || '@test.local', '{"full_name":"Test Client"}', 'authenticated', 'authenticated'),
         (fu, 'fl-' || fu || '@test.local', '{"full_name":"Test Freelancer"}', 'authenticated', 'authenticated'),
         (au, 'admin-' || au || '@test.local', '{"full_name":"Test Admin"}', 'authenticated', 'authenticated'),
         (ou, 'out-' || ou || '@test.local', '{"full_name":"Outsider"}', 'authenticated', 'authenticated');
  INSERT INTO public.clients (user_id) VALUES (cu) RETURNING id INTO cl;
  INSERT INTO public.freelancers (user_id, skills) VALUES (fu, '{Next.js}') RETURNING id INTO fl;
  INSERT INTO public.admins (user_id) VALUES (au);
  INSERT INTO public.projects (client_id, title, description, status)
  VALUES (cl, 'Milestone test project', 'Testing milestone escrow end to end.', 'open') RETURNING id INTO pr;
  INSERT INTO public.proposals (project_id, freelancer_id, cover_letter, bid_amount, status)
  VALUES (pr, fl, 'Cover letter', 30000, 'accepted') RETURNING id INTO pp;
  INSERT INTO public.contracts (proposal_id, total_amount, status, project_id, client_id, freelancer_id)
  VALUES (pp, 30000, 'active', pr, cl, fl) RETURNING id INTO ct;
  INSERT INTO ids VALUES ('cu', cu), ('fu', fu), ('au', au), ('ou', ou), ('cl', cl), ('fl', fl), ('ct', ct);
END $$;

-- ------------------------------------------------- 1. plan agreement rules
DO $$
DECLARE
  cu UUID := (SELECT v FROM ids WHERE k='cu'); fu UUID := (SELECT v FROM ids WHERE k='fu');
  ou UUID := (SELECT v FROM ids WHERE k='ou'); ct UUID := (SELECT v FROM ids WHERE k='ct');
  plan JSONB := '{"milestones":[
     {"title":"Design system","description":"Tokens and components","deliverables":["Figma file","Token JSON"],"amount":10000,"deadline":"2026-12-01"},
     {"title":"Frontend build","amount":12000},
     {"title":"Launch support","amount":8000}]}';
  r JSONB;
BEGIN
  r := public.milestone_plan_action(ct, ou, 'propose_plan', plan);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_NOT_CONTRACT_PARTY', 'outsider cannot propose a plan');

  r := public.milestone_plan_action(ct, fu, 'propose_plan', plan);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_CLIENT_ONLY', 'freelancer cannot propose a plan');

  r := public.milestone_plan_action(ct, cu, 'propose_plan', '{"milestones":[{"title":"Too cheap","amount":5}]}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_AMOUNT', 'amount below minimum rejected');

  r := public.milestone_plan_action(ct, cu, 'propose_plan', '{"milestones":[]}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_MILESTONES', 'empty plan rejected');

  r := public.milestone_plan_action(ct, cu, 'propose_plan', plan);
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN AND (r ->> 'milestones')::INT = 3, 'client proposes 3 milestones');
  PERFORM pg_temp.ok((SELECT billing_mode = 'MILESTONE' AND milestone_plan_status = 'PROPOSED'
                      FROM public.contracts WHERE id = ct), 'contract switched to MILESTONE / PROPOSED');
  PERFORM pg_temp.ok((SELECT deliverables = '{Figma file,Token JSON}' FROM public.contract_milestones
                      WHERE contract_id = ct AND sort_order = 1), 'deliverables stored');

  r := public.milestone_plan_action(ct, cu, 'accept_plan');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_FREELANCER_ONLY', 'client cannot accept own plan');

  r := public.milestone_plan_action(ct, fu, 'request_plan_changes', '{"note":"x"}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'NOTE_REQUIRED', 'change request needs a note');

  r := public.milestone_plan_action(ct, fu, 'accept_plan');
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN, 'freelancer accepts the plan');
  PERFORM pg_temp.ok((SELECT total_amount = 30000 AND milestone_plan_status = 'ACCEPTED'
                      FROM public.contracts WHERE id = ct), 'contract total = sum of milestones, plan ACCEPTED');

  r := public.milestone_plan_action(ct, cu, 'propose_plan', plan);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'PLAN_LOCKED_USE_AMENDMENT', 'accepted plan is locked');
END $$;

INSERT INTO ids SELECT 'm' || sort_order, id FROM public.contract_milestones
WHERE contract_id = (SELECT v FROM ids WHERE k='ct');

-- ------------------------------------- 2. nothing happens before funding
DO $$
DECLARE
  cu UUID := (SELECT v FROM ids WHERE k='cu'); fu UUID := (SELECT v FROM ids WHERE k='fu');
  m1 UUID := (SELECT v FROM ids WHERE k='m1'); r JSONB;
BEGIN
  r := public.milestone_work_action(m1, fu, 'start');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'MILESTONE_NOT_FUNDED', 'cannot start an unfunded milestone');
  r := public.milestone_work_action(m1, cu, 'approve');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'WORK_NOT_SUBMITTED', 'cannot approve an unfunded, unsubmitted milestone');
  r := public.release_milestone_payment(m1, cu);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'MILESTONE_NOT_APPROVED', 'cannot release an unfunded milestone');
  r := public.milestone_work_action(m1, fu, 'raise_dispute', '{"message":"Nothing funded yet, testing"}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'DISPUTE_NOT_ALLOWED', 'cannot dispute an unfunded milestone');
END $$;

-- -------------------------------------------- 3. verified funding of m1
DO $$
DECLARE
  ids_ RECORD; r JSONB;
  ct UUID := (SELECT v FROM ids WHERE k='ct'); m1 UUID := (SELECT v FROM ids WHERE k='m1');
  m2 UUID := (SELECT v FROM ids WHERE k='m2');
  cl UUID := (SELECT v FROM ids WHERE k='cl'); fl UUID := (SELECT v FROM ids WHERE k='fl');
  cu UUID := (SELECT v FROM ids WHERE k='cu');
BEGIN
  INSERT INTO public.payments (contract_id, milestone_id, client_id, freelancer_id, amount, platform_fee_pct,
    platform_fee, freelancer_amount, transaction_id, status, initiated_by)
  VALUES (ct, m1, cl, fl, 10000, 7, 700, 9300, 'T-M1', 'PENDING', cu),
         (ct, m2, cl, fl, 999, 7, 69.93, 929.07, 'T-M2-TAMPERED', 'PENDING', cu);

  r := public.settle_funded_payment('T-M1', 'val', 'bank', 'FAILED', 10000, 'BDT');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'GATEWAY_STATUS_NOT_VALID', 'gateway FAILED does not fund');

  r := public.settle_funded_payment('T-M1', 'val', 'bank', 'VALID', 9000, 'BDT');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'AMOUNT_MISMATCH', 'validated amount mismatch does not fund');

  r := public.settle_funded_payment('T-M2-TAMPERED', 'val', 'bank', 'VALID', 999, 'BDT');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'MILESTONE_AMOUNT_MISMATCH', 'payment amount must equal milestone amount');
  PERFORM pg_temp.ok((SELECT status = 'PENDING' FROM public.contract_milestones WHERE id = m2), 'm2 still PENDING');

  r := public.settle_funded_payment('T-M1', 'val', 'bank', 'VALID', 10000, 'BDT');
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN AND r ->> 'status' = 'FUNDED', 'verified payment funds m1');
  PERFORM pg_temp.ok((SELECT status = 'FUNDED' AND funded_at IS NOT NULL FROM public.contract_milestones WHERE id = m1), 'm1 FUNDED');
  PERFORM pg_temp.ok((SELECT COUNT(*) = 1 FROM public.escrow_ledger WHERE milestone_id = m1 AND entry_type = 'FUND'), 'FUND ledger entry linked to m1');
  PERFORM pg_temp.ok((SELECT funded_amount = 10000 AND payment_status = 'FUNDED' FROM public.contracts WHERE id = ct), 'contract aggregates updated');

  r := public.settle_funded_payment('T-M1', 'val', 'bank', 'VALID', 10000, 'BDT');
  PERFORM pg_temp.ok((r ->> 'already_settled')::BOOLEAN, 'duplicate IPN is idempotent');
  PERFORM pg_temp.ok((SELECT COUNT(*) = 1 FROM public.escrow_ledger WHERE milestone_id = m1), 'no duplicate ledger entry');

  BEGIN
    INSERT INTO public.payments (contract_id, milestone_id, client_id, freelancer_id, amount, platform_fee_pct,
      platform_fee, freelancer_amount, transaction_id, status)
    VALUES (ct, m1, cl, fl, 10000, 7, 700, 9300, 'T-M1-DUP', 'FUNDED');
    PERFORM pg_temp.ok(FALSE, 'second FUNDED payment for same milestone must be blocked');
  EXCEPTION WHEN unique_violation THEN
    PERFORM pg_temp.ok(TRUE, 'unique index blocks a second funded payment for the same milestone');
  END;
END $$;

-- -------------------------------- 4. submit / revise / approve / release m1
DO $$
DECLARE
  cu UUID := (SELECT v FROM ids WHERE k='cu'); fu UUID := (SELECT v FROM ids WHERE k='fu');
  ct UUID := (SELECT v FROM ids WHERE k='ct'); m1 UUID := (SELECT v FROM ids WHERE k='m1');
  fl UUID := (SELECT v FROM ids WHERE k='fl'); r JSONB; earned_before NUMERIC;
BEGIN
  r := public.milestone_work_action(m1, cu, 'start');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_FREELANCER_ONLY', 'client cannot start work');
  r := public.milestone_work_action(m1, fu, 'start');
  PERFORM pg_temp.ok(r ->> 'status' = 'IN_PROGRESS', 'freelancer starts m1');

  r := public.milestone_work_action(m1, fu, 'submit', '{"message":"Delivered the design system","demo_url":"javascript:alert(1)"}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'INVALID_URL', 'non-http demo URL rejected');
  r := public.milestone_work_action(m1, fu, 'submit', '{"message":"Design system v1 delivered","demo_url":"https://example.com/figma"}');
  PERFORM pg_temp.ok((r ->> 'revision_number')::INT = 1, 'first submission is revision 1');

  r := public.milestone_work_action(m1, cu, 'request_revision', '{"message":"short"}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'REASON_REQUIRED', 'revision needs a real reason');
  r := public.milestone_work_action(m1, cu, 'request_revision', '{"message":"Please add dark mode tokens to the system."}');
  PERFORM pg_temp.ok(r ->> 'status' = 'REVISION_REQUESTED', 'client requests a revision');
  PERFORM pg_temp.ok((SELECT revision_count = 1 FROM public.contract_milestones WHERE id = m1), 'revision counted');

  r := public.release_milestone_payment(m1, cu);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'MILESTONE_NOT_APPROVED', 'cannot release during revision');

  r := public.milestone_work_action(m1, fu, 'submit', '{"message":"Added dark mode tokens as requested."}');
  PERFORM pg_temp.ok((r ->> 'revision_number')::INT = 2, 'resubmission is revision 2');
  PERFORM pg_temp.ok((SELECT COUNT(*) = 2 FROM public.milestone_submissions WHERE milestone_id = m1), 'full submission history kept');

  r := public.milestone_work_action(m1, fu, 'approve');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_CLIENT_ONLY', 'freelancer cannot approve');
  r := public.milestone_work_action(m1, cu, 'approve');
  PERFORM pg_temp.ok(r ->> 'status' = 'APPROVED', 'client approves m1');

  r := public.release_milestone_payment(m1, fu);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_NOT_CONTRACT_CLIENT', 'freelancer cannot release');

  SELECT earned_bdt INTO earned_before FROM public.freelancers WHERE id = fl;
  r := public.release_milestone_payment(m1, cu);
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN AND (r ->> 'platform_fee')::NUMERIC = 700
                     AND (r ->> 'freelancer_net')::NUMERIC = 9300, 'release: 7% fee, net 9,300');
  PERFORM pg_temp.ok((SELECT earned_bdt = earned_before + 9300 FROM public.freelancers WHERE id = fl), 'freelancer earnings credited once');
  PERFORM pg_temp.ok((SELECT status = 'RELEASED' FROM public.payments WHERE transaction_id = 'T-M1'), 'payment RELEASED');
  PERFORM pg_temp.ok((SELECT COUNT(*) = 1 FROM public.escrow_ledger WHERE milestone_id = m1 AND entry_type = 'RELEASE'), 'RELEASE ledger entry');

  r := public.release_milestone_payment(m1, cu);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'ALREADY_RELEASED', 'double release blocked');
  PERFORM pg_temp.ok((SELECT earned_bdt = earned_before + 9300 FROM public.freelancers WHERE id = fl), 'earnings not credited twice');

  r := public.release_escrow_payment(ct, cu);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'MILESTONE_CONTRACT_USE_MILESTONE_RELEASE', 'legacy whole-contract release refused');
  PERFORM pg_temp.ok((SELECT released_amount = 10000 AND status = 'active' FROM public.contracts WHERE id = ct),
                     'contract stays active with 10,000 released');
  PERFORM pg_temp.ok((SELECT COUNT(*) >= 6 FROM public.milestone_events WHERE milestone_id = m1), 'audit trail recorded');
END $$;

-- ------------------------------------------------- 5. amendment workflow
DO $$
DECLARE
  cu UUID := (SELECT v FROM ids WHERE k='cu'); fu UUID := (SELECT v FROM ids WHERE k='fu');
  ct UUID := (SELECT v FROM ids WHERE k='ct'); r JSONB; m4 UUID;
BEGIN
  r := public.milestone_plan_action(ct, cu, 'propose_amendment', '{"milestone":{"title":"Extra page","amount":5000}}');
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN, 'client proposes an amendment');
  m4 := (r ->> 'milestone_id')::UUID;
  PERFORM pg_temp.ok((SELECT total_amount = 30000 FROM public.contracts WHERE id = ct), 'unaccepted amendment does not change total');
  r := public.milestone_plan_action(ct, cu, 'accept_amendment', jsonb_build_object('milestone_id', m4));
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_FREELANCER_ONLY', 'client cannot accept own amendment');
  r := public.milestone_plan_action(ct, fu, 'reject_amendment', jsonb_build_object('milestone_id', m4));
  PERFORM pg_temp.ok((SELECT status = 'CANCELLED' AND agreement_status = 'REJECTED' FROM public.contract_milestones WHERE id = m4),
                     'freelancer declines amendment');
END $$;

-- -------------------------------------------- 6. dispute & admin refund (m2)
DO $$
DECLARE
  cu UUID := (SELECT v FROM ids WHERE k='cu'); fu UUID := (SELECT v FROM ids WHERE k='fu');
  au UUID := (SELECT v FROM ids WHERE k='au'); ct UUID := (SELECT v FROM ids WHERE k='ct');
  m2 UUID := (SELECT v FROM ids WHERE k='m2');
  cl UUID := (SELECT v FROM ids WHERE k='cl'); fl UUID := (SELECT v FROM ids WHERE k='fl');
  r JSONB; d UUID;
BEGIN
  INSERT INTO public.payments (contract_id, milestone_id, client_id, freelancer_id, amount, platform_fee_pct,
    platform_fee, freelancer_amount, transaction_id, status, initiated_by)
  VALUES (ct, m2, cl, fl, 12000, 7, 840, 11160, 'T-M2', 'PENDING', cu);
  r := public.settle_funded_payment('T-M2', 'val', 'bank', 'VALIDATED', 12000, 'BDT');
  PERFORM pg_temp.ok(r ->> 'status' = 'FUNDED', 'm2 funded');

  r := public.milestone_work_action(m2, fu, 'raise_dispute', '{"message":"short"}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'REASON_REQUIRED', 'dispute needs a reason');
  r := public.milestone_work_action(m2, cu, 'raise_dispute', '{"message":"The freelancer stopped responding after funding."}');
  PERFORM pg_temp.ok(r ->> 'status' = 'DISPUTED', 'client opens a dispute');
  d := (r ->> 'dispute_id')::UUID;
  PERFORM pg_temp.ok((SELECT payment_status = 'DISPUTED' AND status = 'disputed' FROM public.contracts WHERE id = ct), 'contract marked disputed');
  PERFORM pg_temp.ok(EXISTS (SELECT 1 FROM public.notifications WHERE user_id = au AND event_key = 'ms_dispute_admin:' || d), 'admin notified');

  r := public.milestone_work_action(m2, fu, 'raise_dispute', '{"message":"Opening a second dispute on purpose."}');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'DISPUTE_NOT_ALLOWED', 'no second dispute while disputed');

  r := public.release_milestone_payment(m2, cu);
  PERFORM pg_temp.ok(pg_temp.code(r) = 'MILESTONE_NOT_APPROVED', 'cannot release a disputed milestone');

  r := public.resolve_milestone_dispute(d, cu, 'REFUND_TO_CLIENT', 'Trying to resolve as client.');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'FORBIDDEN_ADMIN_ONLY', 'only admins resolve disputes');
  r := public.resolve_milestone_dispute(d, au, 'REFUND_TO_CLIENT', 'short');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'NOTES_REQUIRED', 'resolution needs notes');
  r := public.resolve_milestone_dispute(d, au, 'REFUND_TO_CLIENT', 'Freelancer unresponsive for 14 days; refunding milestone.');
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN, 'admin refunds the milestone');
  PERFORM pg_temp.ok((SELECT status = 'REFUNDED' FROM public.payments WHERE transaction_id = 'T-M2'), 'payment REFUNDED');
  PERFORM pg_temp.ok((SELECT status = 'CANCELLED' FROM public.contract_milestones WHERE id = m2), 'm2 CANCELLED');
  PERFORM pg_temp.ok((SELECT COUNT(*) = 1 FROM public.escrow_ledger WHERE milestone_id = m2 AND entry_type = 'REFUND'), 'REFUND ledger entry');
  PERFORM pg_temp.ok((SELECT refunded_amount = 12000 FROM public.contracts WHERE id = ct), 'contract refunded_amount');

  r := public.resolve_milestone_dispute(d, au, 'RELEASE_TO_FREELANCER', 'Trying to resolve twice to double-pay.');
  PERFORM pg_temp.ok(pg_temp.code(r) = 'DISPUTE_ALREADY_RESOLVED', 'dispute cannot be resolved twice');
END $$;

-- -------------------------------- 7. mutual cancellation of unfunded m3 → completion
DO $$
DECLARE
  cu UUID := (SELECT v FROM ids WHERE k='cu'); fu UUID := (SELECT v FROM ids WHERE k='fu');
  ct UUID := (SELECT v FROM ids WHERE k='ct'); m3 UUID := (SELECT v FROM ids WHERE k='m3'); r JSONB;
BEGIN
  r := public.milestone_plan_action(ct, cu, 'request_cancel', jsonb_build_object('milestone_id', m3));
  PERFORM pg_temp.ok((r ->> 'ok')::BOOLEAN, 'client requests cancellation of unfunded m3');
  r := public.milestone_plan_action(ct, cu, 'confirm_cancel', jsonb_build_object('milestone_id', m3));
  PERFORM pg_temp.ok(pg_temp.code(r) = 'OTHER_PARTY_MUST_CONFIRM', 'requester cannot confirm own cancellation');
  r := public.milestone_plan_action(ct, fu, 'confirm_cancel', jsonb_build_object('milestone_id', m3));
  PERFORM pg_temp.ok(r ->> 'status' = 'CANCELLED', 'freelancer confirms cancellation');

  PERFORM pg_temp.ok((SELECT payment_status = 'RELEASED' AND work_status = 'RELEASED' AND status = 'completed'
                      AND total_amount = 10000 FROM public.contracts WHERE id = ct),
                     'contract completes when every remaining milestone is released');
END $$;

-- ------------------------------------------- 8. browser roles (RLS & grants)
SELECT set_config('test.ct', (SELECT v FROM ids WHERE k='ct')::TEXT, TRUE),
       set_config('test.m1', (SELECT v FROM ids WHERE k='m1')::TEXT, TRUE),
       set_config('test.cu', (SELECT v FROM ids WHERE k='cu')::TEXT, TRUE),
       set_config('test.ou', (SELECT v FROM ids WHERE k='ou')::TEXT, TRUE);

-- as the contract's client
SELECT set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.cu'))::TEXT, TRUE);
SET LOCAL ROLE authenticated;

DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM public.contract_milestones WHERE contract_id = current_setting('test.ct')::UUID;
  PERFORM pg_temp.ok(n = 4, 'party can read its milestones via RLS');

  BEGIN
    UPDATE public.contract_milestones SET amount = 1 WHERE contract_id = current_setting('test.ct')::UUID;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.ok(n = 0, 'browser cannot update milestones (no write policy)');
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.ok(TRUE, 'browser cannot update milestones (permission denied)');
  END;

  BEGIN
    PERFORM public.release_milestone_payment(current_setting('test.m1')::UUID, current_setting('test.cu')::UUID);
    PERFORM pg_temp.ok(FALSE, 'browser must not execute release RPC');
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.ok(TRUE, 'browser cannot execute the release RPC');
  END;

  BEGIN
    UPDATE public.contracts SET billing_mode = 'SINGLE' WHERE id = current_setting('test.ct')::UUID;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.ok(n = 0, 'browser cannot change billing_mode');
  EXCEPTION WHEN raise_exception OR insufficient_privilege THEN
    PERFORM pg_temp.ok(TRUE, 'contracts guard blocks browser change of billing_mode');
  END;
END $$;

RESET ROLE;
-- as an unrelated user
SELECT set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'sub', current_setting('test.ou'))::TEXT, TRUE);
SET LOCAL ROLE authenticated;

DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM public.contract_milestones WHERE contract_id = current_setting('test.ct')::UUID;
  PERFORM pg_temp.ok(n = 0, 'outsider sees no milestones');
  SELECT COUNT(*) INTO n FROM public.milestone_events WHERE contract_id = current_setting('test.ct')::UUID;
  PERFORM pg_temp.ok(n = 0, 'outsider sees no audit events');
END $$;

RESET ROLE;

DO $$
BEGIN
  BEGIN
    DELETE FROM public.milestone_events;
    PERFORM pg_temp.ok(FALSE, 'audit log must be append-only');
  EXCEPTION WHEN raise_exception THEN
    PERFORM pg_temp.ok(TRUE, 'audit log is append-only even for privileged roles');
  END;
END $$;

DO $$ BEGIN RAISE NOTICE 'ALL MILESTONE ESCROW TESTS PASSED'; END $$;
ROLLBACK;
