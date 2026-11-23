/**
 * Project files (client attachments shared with the hired freelancer) —
 * end-to-end HTTP + Storage test (LOCAL Supabase only, Storage enabled).
 *   node --env-file=.env.local tests/integration/project-files-api.mjs
 *   (Supabase env vars overridden to the local stack; TEST_BASE_URL → local Next server.)
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

const BUCKET = "project-files";
const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
let passed = 0;
const pass = (m) => { passed += 1; console.log(`  PASS: ${m}`); };
const section = (t) => console.log(`\n=== ${t} ===`);

const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(3000, 0x20), Buffer.from("\n%%EOF")]);
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
  return { client: c, cookie: () => Array.from(jar.entries()).map(([n, v]) => `${n}=${v}`).join("; ") };
}

async function api(path, { method = "GET", s, body, redirect = "follow" } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    redirect,
    headers: { ...(s ? { Cookie: s.cookie() } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  if ((res.headers.get("content-type") ?? "").includes("json")) {
    try { json = await res.json(); } catch { /* */ }
  }
  return { status: res.status, json, headers: res.headers };
}

async function makeUser(role) {
  const email = `pf-${role}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const password = `Pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Pf ${role}` } });
  assert.ifError(error);
  const id = data.user.id;
  let profileId = null;
  if (role.startsWith("client")) profileId = (await admin.from("clients").insert({ user_id: id }).select("id").single()).data.id;
  if (role.startsWith("freelancer")) profileId = (await admin.from("freelancers").insert({ user_id: id }).select("id").single()).data.id;
  if (role === "admin") await admin.from("admins").insert({ user_id: id });
  return { id, email, password, profileId };
}

async function put(url, bytes, type) {
  return (await fetch(url, { method: "PUT", headers: { "Content-Type": type }, body: bytes })).status;
}

async function upload(s, projectId, { bytes = PDF, type = "application/pdf", putType, name = "brief.pdf" } = {}) {
  const m = await api(`/api/projects/${projectId}/files/upload-url`, { method: "POST", s, body: { contentType: type, size: bytes.length } });
  if (m.status !== 200) return { mint: m };
  const putStatus = await put(m.json.signedUrl, bytes, putType ?? type);
  const reg = await api(`/api/projects/${projectId}/files`, { method: "POST", s, body: { fileId: m.json.fileId, path: m.json.path, fileName: name } });
  return { mint: m, putStatus, reg };
}

const run = async () => {
  section("Fixtures");
  const [ou, hu, au, xu, ad] = await Promise.all(["client-owner", "freelancer-hired", "freelancer-applicant", "client-other", "admin"].map(makeUser));
  const [owner, hired, applicant, otherClient, adminS] = await Promise.all([ou, hu, au, xu, ad].map((u) => session(u.email, u.password)));

  // The client posts the job through their own session, exactly like the wizard.
  const { data: project, error: projErr } = await owner.client
    .from("projects")
    .insert({ client_id: ou.profileId, title: "Brand refresh", description: "Need a full brand refresh with assets attached.", status: "open" })
    .select("id")
    .single();
  assert.ifError(projErr);
  const projectId = project.id;
  const { data: accepted } = await admin.from("proposals").insert({ project_id: projectId, freelancer_id: hu.profileId, cover_letter: "c", bid_amount: 9000, status: "accepted" }).select("id").single();
  await admin.from("proposals").insert({ project_id: projectId, freelancer_id: au.profileId, cover_letter: "c", bid_amount: 9500, status: "pending" });
  const { data: contract, error: ctErr } = await admin.from("contracts").insert({
    proposal_id: accepted.id, total_amount: 9000, project_id: projectId, client_id: ou.profileId, freelancer_id: hu.profileId,
    status: "active", payment_status: "FUNDED", work_status: "IN_PROGRESS",
  }).select("id").single();
  assert.ifError(ctErr);
  pass("client posted a job; freelancer A hired (contract), freelancer B only applied");

  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  assert.equal(bucket.public, false);
  assert.equal(bucket.file_size_limit, 20971520);
  pass("project-files bucket is private with a 20 MB limit");

  section("Client uploads");
  const up = await upload(owner, projectId, { name: "Brand brief v2.pdf" });
  assert.equal(up.mint.status, 200, JSON.stringify(up.mint.json));
  assert.ok(up.putStatus < 300);
  assert.equal(up.reg.status, 200, JSON.stringify(up.reg.json));
  assert.equal(up.reg.json.file.fileName, "Brand brief v2.pdf");
  assert.equal(up.reg.json.file.sizeBytes, PDF.length);
  assert.match(up.mint.json.path, new RegExp(`^${projectId}/[0-9a-f-]{36}\\.pdf$`));
  const docx = await upload(owner, projectId, { bytes: Buffer.from("PK\u0003\u0004 fake docx body"), type: DOCX_TYPE, name: "Requirements.docx" });
  assert.equal(docx.reg.status, 200, JSON.stringify(docx.reg.json));
  pass("client attaches PDF and Word files; original names kept, storage path uses random ids");

  const ownerList = await api(`/api/projects/${projectId}/files`, { s: owner });
  assert.equal(ownerList.json.access, "owner");
  assert.equal(ownerList.json.files.length, 2);
  pass("client sees their files");

  section("Hired freelancer can see and download");
  const hiredList = await api(`/api/projects/${projectId}/files`, { s: hired });
  assert.equal(hiredList.status, 200);
  assert.equal(hiredList.json.access, "hired");
  assert.deepEqual(hiredList.json.files.map((f) => f.fileName).sort(), ["Brand brief v2.pdf", "Requirements.docx"]);
  const viaContract = await api(`/api/contracts/${contract.id}/files`, { s: hired });
  assert.equal(viaContract.status, 200);
  assert.equal(viaContract.json.projectId, projectId);
  assert.equal(viaContract.json.files.length, 2);
  pass("hired freelancer sees the files on the job and on the contract");

  const fileId = up.reg.json.file.id;
  const dl = await api(`/api/projects/${projectId}/files/${fileId}`, { s: hired, redirect: "manual" });
  assert.equal(dl.status, 302);
  const signed = dl.headers.get("location");
  assert.match(signed, /token=/);
  const got = await fetch(signed);
  assert.equal(got.status, 200);
  assert.ok(Buffer.from(await got.arrayBuffer()).equals(PDF));
  assert.match(got.headers.get("content-disposition") ?? "", /Brand brief v2\.pdf/);
  pass("hired freelancer downloads the exact file under its original name");

  section("Everyone else");
  const appList = await api(`/api/projects/${projectId}/files`, { s: applicant });
  assert.equal(appList.json.access, "none");
  assert.equal(appList.json.count, 2);
  assert.deepEqual(appList.json.files, []);
  assert.equal((await api(`/api/projects/${projectId}/files/${fileId}`, { s: applicant, redirect: "manual" })).status, 403);
  assert.equal((await api(`/api/contracts/${contract.id}/files`, { s: applicant })).status, 403);
  pass("non-hired applicant only sees a count; download and contract route forbidden");
  assert.equal((await api(`/api/projects/${projectId}/files/${fileId}`, { s: otherClient, redirect: "manual" })).status, 403);
  assert.equal((await api(`/api/projects/${projectId}/files`)).status, 401);
  assert.equal((await api(`/api/projects/${projectId}/files/${fileId}`, { redirect: "manual" })).status, 401);
  pass("other clients and signed-out visitors cannot download");
  const adminList = await api(`/api/projects/${projectId}/files`, { s: adminS });
  assert.equal(adminList.json.access, "admin");
  assert.equal(adminList.json.files.length, 2);
  pass("admins can see files (for disputes)");

  section("Only the client can change files");
  for (const s of [hired, applicant, otherClient]) {
    assert.equal((await api(`/api/projects/${projectId}/files/upload-url`, { method: "POST", s, body: { contentType: "application/pdf", size: 100 } })).status, 403);
    assert.equal((await api(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE", s })).status, 403);
  }
  pass("freelancers and other clients cannot upload or delete");

  section("Validation");
  for (const bad of ["text/html", "image/svg+xml", "application/x-msdownload", "application/javascript"]) {
    assert.equal((await api(`/api/projects/${projectId}/files/upload-url`, { method: "POST", s: owner, body: { contentType: bad, size: 100 } })).json.code, "INVALID_FILE", bad);
  }
  assert.equal((await api(`/api/projects/${projectId}/files/upload-url`, { method: "POST", s: owner, body: { contentType: "application/pdf", size: 20 * 1024 * 1024 + 1 } })).status, 413);
  pass("dangerous types and files over 20 MB rejected by the API");

  const big = await api(`/api/projects/${projectId}/files/upload-url`, { method: "POST", s: owner, body: { contentType: "application/pdf", size: 1000 } });
  assert.ok((await put(big.json.signedUrl, Buffer.alloc(20 * 1024 * 1024 + 50, 0x20), "application/pdf")) >= 400);
  const html = await api(`/api/projects/${projectId}/files/upload-url`, { method: "POST", s: owner, body: { contentType: "application/pdf", size: 1000 } });
  assert.ok((await put(html.json.signedUrl, Buffer.from("<script>alert(1)</script>"), "text/html")) >= 400);
  pass("Storage itself refuses oversize and HTML uploads even with a valid token");

  const spoof = await upload(owner, projectId, { type: "application/pdf", putType: "image/png", bytes: PDF });
  assert.equal(spoof.reg.json.code, "INVALID_FILE");
  const { data: leftover } = await admin.storage.from(BUCKET).list(projectId, { search: spoof.mint.json.fileId });
  assert.equal((leftover ?? []).length, 0);
  pass("type mismatch between path and stored object rejected and deleted");

  const { data: project2 } = await otherClient.client.from("projects").insert({ client_id: xu.profileId, title: "Other", description: "Another project entirely here.", status: "open" }).select("id").single();
  const m2 = await api(`/api/projects/${project2.id}/files/upload-url`, { method: "POST", s: otherClient, body: { contentType: "application/pdf", size: PDF.length } });
  await put(m2.json.signedUrl, PDF, "application/pdf");
  const crossReg = await api(`/api/projects/${projectId}/files`, { method: "POST", s: owner, body: { fileId: m2.json.fileId, path: m2.json.path, fileName: "x.pdf" } });
  assert.equal(crossReg.status, 400);
  pass("cannot register an object that belongs to another project");
  assert.equal((await api(`/api/projects/${projectId}/files`, { method: "POST", s: owner, body: { fileId: crypto.randomUUID(), path: `${projectId}/${crypto.randomUUID()}.pdf`, fileName: "ghost.pdf" } })).status, 400);
  pass("cannot register a file that was never uploaded");

  section("Limit");
  for (let i = 0; i < 8; i++) {
    const r = await upload(owner, projectId, { name: `extra-${i}.pdf` });
    assert.equal(r.reg.status, 200, JSON.stringify(r.reg?.json ?? r.mint.json));
  }
  const over = await api(`/api/projects/${projectId}/files/upload-url`, { method: "POST", s: owner, body: { contentType: "application/pdf", size: 100 } });
  assert.equal(over.json.code, "TOO_MANY_FILES");
  pass("maximum of 10 files per project enforced");

  section("Database + storage protection");
  const direct = await hired.client.storage.from(BUCKET).download(up.mint.json.path);
  assert.ok(direct.error, "raw storage read must be blocked");
  const listRaw = await hired.client.storage.from(BUCKET).list(projectId);
  assert.ok(listRaw.error || (listRaw.data ?? []).length === 0);
  const writeRaw = await owner.client.storage.from(BUCKET).upload(`${projectId}/evil.pdf`, PDF, { contentType: "application/pdf" });
  assert.ok(writeRaw.error);
  assert.ok((await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${up.mint.json.path}`)).status >= 400);
  pass("no direct or public Storage access for anyone");

  const rlsHired = await hired.client.from("project_files").select("id").eq("project_id", projectId);
  assert.equal(rlsHired.data.length, 10);
  const rlsApplicant = await applicant.client.from("project_files").select("id").eq("project_id", projectId);
  assert.equal((rlsApplicant.data ?? []).length, 0);
  const ins = await owner.client.from("project_files").insert({ project_id: projectId, storage_path: "x", file_name: "x", mime_type: "application/pdf", size_bytes: 1 });
  assert.ok(ins.error);
  const del = await owner.client.from("project_files").delete().eq("project_id", projectId).select();
  assert.ok(del.error || (del.data ?? []).length === 0);
  pass("RLS: parties read metadata, nobody writes it directly");

  section("Delete");
  const rm = await api(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE", s: owner });
  assert.equal(rm.status, 200);
  const { data: gone } = await admin.storage.from(BUCKET).download(up.mint.json.path);
  assert.equal(gone, null);
  assert.equal((await api(`/api/projects/${projectId}/files`, { s: hired })).json.files.length, 9);
  assert.equal((await api(`/api/projects/${projectId}/files/${fileId}`, { s: hired, redirect: "manual" })).status, 404);
  pass("client removes a file; it disappears for the freelancer and from Storage");

  console.log(`\nAll ${passed} project file checks passed.`);
};

run().catch((e) => {
  console.error("\nFAILED:", e);
  process.exit(1);
});
