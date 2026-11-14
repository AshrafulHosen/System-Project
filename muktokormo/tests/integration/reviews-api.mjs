/**
 * Two-sided reviews — end-to-end HTTP API test (LOCAL Supabase only).
 *   node --env-file=.env.local tests/integration/reviews-api.mjs
 *   (with Supabase env vars overridden to the local stack; TEST_BASE_URL → local build)
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const BASE_URL = (process.env.TEST_BASE_URL || "http://localhost:3200").replace(/\/+$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+/.test(SUPABASE_URL ?? ""), "Refusing to run against a non-local Supabase.");

const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
let passed = 0;
const pass = (m) => { passed += 1; console.log(`  PASS: ${m}`); };
const section = (t) => console.log(`\n=== ${t} ===`);

async function session(email, password) {
  const jar = new Map();
  const c = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      setAll: (l) => l.forEach(({ name, value, options }) => (value === "" || options?.maxAge === 0 ? jar.delete(name) : jar.set(name, value))),
    },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  return () => Array.from(jar.entries()).map(([n, v]) => `${n}=${v}`).join("; ");
}

async function api(path, { method = "GET", cookie, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(cookie ? { Cookie: cookie() } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* */ }
  return { status: res.status, json };
}

async function makeUser(role) {
  const email = `rv-${role}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const password = `Pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Rv ${role} Person` } });
  assert.ifError(error);
  return { id: data.user.id, email, password };
}

async function makeContract(cl, fl, completed) {
  const { data: pr } = await admin.from("projects").insert({ client_id: cl, title: completed ? "Done project" : "Open project", description: "Review API test project", status: completed ? "completed" : "in_progress" }).select("id").single();
  const { data: pp } = await admin.from("proposals").insert({ project_id: pr.id, freelancer_id: fl, cover_letter: "c", bid_amount: 8000, status: "accepted" }).select("id").single();
  const { data: ct, error } = await admin.from("contracts").insert({
    proposal_id: pp.id, total_amount: 8000, project_id: pr.id, client_id: cl, freelancer_id: fl,
    status: completed ? "completed" : "active", payment_status: completed ? "RELEASED" : "FUNDED",
    work_status: completed ? "RELEASED" : "IN_PROGRESS", released_at: completed ? new Date().toISOString() : null,
  }).select("id").single();
  assert.ifError(error);
  return ct.id;
}

const freelancerScores = { work_quality: 5, communication: 5, technical_skills: 4, professionalism: 5, deadline_management: 4 };
const clientScores = { communication: 4, requirement_clarity: 4, professionalism: 5, payment_reliability: 5, cooperation: 4 };

const run = async () => {
  section("Fixtures");
  const [cu, fu, au, ou] = await Promise.all(["client", "freelancer", "admin", "outsider"].map(makeUser));
  const { data: cl } = await admin.from("clients").insert({ user_id: cu.id }).select("id").single();
  const { data: fl } = await admin.from("freelancers").insert({ user_id: fu.id }).select("id").single();
  await admin.from("admins").insert({ user_id: au.id });
  const done = await makeContract(cl.id, fl.id, true);
  const open = await makeContract(cl.id, fl.id, false);
  const [client, freelancer, adminS, outsider] = await Promise.all([cu, fu, au, ou].map((u) => session(u.email, u.password)));
  pass("users, profiles, one completed and one active contract");

  section("Eligibility");
  let r = await api("/api/reviews", { method: "POST", body: { contractId: done, categories: freelancerScores, feedback: "x".repeat(30) } });
  assert.equal(r.status, 401); pass("anonymous submit → 401");
  r = await api(`/api/contracts/${open}/reviews`, { cookie: client });
  assert.equal(r.json.canReview, false); pass("active contract: canReview = false");
  r = await api("/api/reviews", { method: "POST", cookie: client, body: { contractId: open, categories: freelancerScores, feedback: "Great work on this project overall." } });
  assert.equal(r.status, 409); pass("review on unfinished contract → 409");
  r = await api("/api/reviews", { method: "POST", cookie: outsider, body: { contractId: done, categories: freelancerScores, feedback: "I was never part of this contract." } });
  assert.equal(r.status, 403); pass("outsider review → 403");
  r = await api(`/api/contracts/${done}/reviews`, { cookie: client });
  assert.equal(r.json.canReview, true); assert.equal(r.json.viewerReviewType, "CLIENT_TO_FREELANCER"); pass("completed contract: client may review");

  section("Submission");
  r = await api("/api/reviews", { method: "POST", cookie: client, body: { contractId: done, categories: { ...freelancerScores, work_quality: 9 }, feedback: "Out of range score attempt here." } });
  assert.equal(r.status, 400); pass("score 9 rejected → 400");
  r = await api("/api/reviews", {
    method: "POST", cookie: client,
    body: { contractId: done, categories: freelancerScores, feedback: "Excellent communication and a polished delivery.", overall_rating: 5, reviewer_user_id: ou.id, strengths: "Clean code" },
  });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(Number(r.json.result.overall_rating), 4.6);
  pass("client review accepted; injected overall_rating/reviewer ignored, overall computed = 4.60");
  r = await api("/api/reviews", { method: "POST", cookie: client, body: { contractId: done, categories: freelancerScores, feedback: "Trying to review a second time." } });
  assert.equal(r.status, 409); pass("duplicate review → 409");
  r = await api("/api/reviews", { method: "POST", cookie: freelancer, body: { contractId: done, categories: clientScores, feedback: "Clear requirements and paid on time." } });
  assert.equal(r.status, 200); assert.equal(Number(r.json.result.overall_rating), 4.4); pass("freelancer reviews client (4.40)");

  section("Display & summaries");
  r = await api(`/api/reviews?freelancerId=${fl.id}`);
  assert.equal(r.status, 200);
  assert.equal(r.json.summary.count, 1);
  assert.equal(r.json.summary.average, 4.6);
  assert.equal(r.json.summary.distribution["5"], 1);
  assert.equal(r.json.summary.categoryAverages.technical_skills, 4);
  assert.equal(r.json.reviews[0].reviewer_name, "Rv"); pass("public profile reviews: average, distribution, category averages; first name only");
  assert.equal(r.json.reviews[0].reviewer_user_id, undefined); pass("reviewer user ids are not exposed publicly");
  const { data: flRow } = await admin.from("freelancers").select("rating, reviews_count").eq("id", fl.id).single();
  assert.equal(Number(flRow.rating), 4.6); assert.equal(flRow.reviews_count, 1); pass("freelancers.rating stored from reviews");
  r = await api(`/api/reviews/me`, { cookie: freelancer });
  assert.equal(r.json.received.length, 1); assert.equal(r.json.written.length, 1); pass("freelancer sees 1 received + 1 written");

  section("Reporting & moderation");
  const reviewId = (await api(`/api/reviews?freelancerId=${fl.id}`)).json.reviews[0].id;
  r = await api(`/api/reviews/${reviewId}/report`, { method: "POST", cookie: client, body: { reason: "SPAM" } });
  assert.equal(r.status, 409); pass("reviewer cannot report own review → 409");
  r = await api(`/api/reviews/${reviewId}/report`, { method: "POST", cookie: freelancer, body: { reason: "PRIVATE_INFORMATION", details: "Mentions my phone number." } });
  assert.equal(r.status, 200); pass("reviewee reports the review");
  r = await api(`/api/admin/reviews`, { cookie: client });
  assert.equal(r.status, 403); pass("non-admin cannot open moderation queue → 403");
  r = await api(`/api/admin/reviews`, { cookie: adminS });
  const report = r.json.reports.find((x) => x.review_id === reviewId);
  assert.ok(report); assert.ok(r.json.reviews.find((x) => x.id === reviewId)); pass("admin sees report with the full review");
  r = await api(`/api/admin/reviews`, { method: "POST", cookie: adminS, body: { reviewId, reportId: report.id, action: "HIDE", notes: "Contains personal contact details." } });
  assert.equal(r.status, 200); pass("admin hides the review");
  r = await api(`/api/reviews?freelancerId=${fl.id}`);
  assert.equal(r.json.summary.count, 0); pass("hidden review disappears from the public profile");
  const { data: flRow2 } = await admin.from("freelancers").select("rating, reviews_count").eq("id", fl.id).single();
  assert.equal(Number(flRow2.rating), 0); assert.equal(flRow2.reviews_count, 0); pass("rating recomputed without the hidden review");
  r = await api(`/api/contracts/${done}/reviews`, { cookie: client });
  assert.equal(r.json.reviews.find((x) => x.id === reviewId).moderation_status, "HIDDEN"); pass("parties still see the review with its HIDDEN status");

  console.log(`\nALL ${passed} REVIEW API CHECKS PASSED`);
};

run().catch((e) => { console.error("\nFAILED:", e?.message || e); process.exit(1); });
