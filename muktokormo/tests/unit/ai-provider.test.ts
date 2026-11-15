import test from "node:test";
import assert from "node:assert/strict";
import { generateJson, getAiConfig } from "@/lib/ai/provider";

const REQ = {
  system: "s",
  user: "u",
  schemaName: "x",
  schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
  maxOutputTokens: 100,
};

function withEnv(env: Record<string, string | undefined>, fn: () => Promise<void>) {
  const keys = ["AI_PROVIDER", "GEMINI_API_KEY", "OPENAI_API_KEY", "AI_MODEL", "AI_FALLBACK_MODELS", "GEMINI_BASE_URL", "AI_TIMEOUT_MS"];
  const backup: Record<string, string | undefined> = {};
  for (const k of keys) {
    backup[k] = process.env[k];
    delete process.env[k];
  }
  Object.assign(process.env, Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined)));
  return fn().finally(() => {
    for (const k of keys) {
      if (backup[k] === undefined) delete process.env[k];
      else process.env[k] = backup[k];
    }
  });
}

function mockFetch(handler: (url: string, init: RequestInit) => Response) {
  const original = globalThis.fetch;
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init);
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

const ok = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 } }), { status: 200 });

test("[Unit] Gemini is auto-selected from GEMINI_API_KEY with fallback models", () =>
  withEnv({ GEMINI_API_KEY: "k" }, async () => {
    const cfg = getAiConfig();
    assert.equal(cfg?.provider, "gemini");
    assert.deepEqual(cfg?.models, ["gemini-3.5-flash", "gemini-3.5-flash-lite"]);
  }));

test("[Unit] No key → not configured", () =>
  withEnv({}, async () => {
    assert.equal(getAiConfig(), null);
  }));

test("[Unit] Gemini sends the key in a header (not the URL), JSON schema and system instruction", () =>
  withEnv({ GEMINI_API_KEY: "secret-key" }, async () => {
    const m = mockFetch(() => ok('{"ok":true}'));
    try {
      const r = await generateJson<{ ok: boolean }>(REQ);
      assert.equal(r.data.ok, true);
      assert.equal(m.calls.length, 1);
      assert.ok(!m.calls[0].url.includes("secret-key"), "key must not be in the URL");
      assert.equal((m.calls[0].init.headers as Record<string, string>)["x-goog-api-key"], "secret-key");
      const body = JSON.parse(String(m.calls[0].init.body));
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.deepEqual(body.generationConfig.responseJsonSchema, REQ.schema);
      assert.equal(body.systemInstruction.parts[0].text, "s");
    } finally {
      m.restore();
    }
  }));

test("[Unit] Overloaded (503) primary model falls back to the next model", () =>
  withEnv({ GEMINI_API_KEY: "k" }, async () => {
    const m = mockFetch((url) =>
      url.includes("gemini-3.5-flash:") ? new Response(JSON.stringify({ error: { code: 503, message: "high demand" } }), { status: 503 }) : ok('{"ok":true}')
    );
    try {
      const r = await generateJson<{ ok: boolean }>(REQ);
      assert.equal(r.data.ok, true);
      assert.equal(m.calls.length, 2);
      assert.ok(m.calls[1].url.includes("gemini-3.5-flash-lite:"));
    } finally {
      m.restore();
    }
  }));

test("[Unit] Invalid key does NOT retry other models and maps to PROVIDER_AUTH", () =>
  withEnv({ GEMINI_API_KEY: "bad" }, async () => {
    const m = mockFetch(() => new Response(JSON.stringify({ error: { code: 400, message: "API key not valid. Please pass a valid API key." } }), { status: 400 }));
    try {
      await assert.rejects(() => generateJson(REQ), (e: { code?: string }) => e.code === "PROVIDER_AUTH");
      assert.equal(m.calls.length, 1);
    } finally {
      m.restore();
    }
  }));

test("[Unit] All models busy → friendly PROVIDER_ERROR", () =>
  withEnv({ GEMINI_API_KEY: "k" }, async () => {
    const m = mockFetch(() => new Response(JSON.stringify({ error: { code: 503 } }), { status: 503 }));
    try {
      await assert.rejects(() => generateJson(REQ), (e: { code?: string; message?: string }) => e.code === "PROVIDER_ERROR" && /busy/.test(e.message ?? ""));
      assert.equal(m.calls.length, 2);
    } finally {
      m.restore();
    }
  }));

test("[Unit] Safety block → REFUSED; truncated output → INVALID_OUTPUT; thought parts ignored", () =>
  withEnv({ GEMINI_API_KEY: "k" }, async () => {
    let m = mockFetch(() => new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY" }] }), { status: 200 }));
    try {
      await assert.rejects(() => generateJson(REQ), (e: { code?: string }) => e.code === "REFUSED");
    } finally {
      m.restore();
    }
    m = mockFetch(() => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":' }] }, finishReason: "MAX_TOKENS" }] }), { status: 200 }));
    try {
      await assert.rejects(() => generateJson(REQ), (e: { code?: string }) => e.code === "INVALID_OUTPUT");
    } finally {
      m.restore();
    }
    m = mockFetch(() =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "thinking...", thought: true }, { text: '{"ok":true}' }] }, finishReason: "STOP" }] }), { status: 200 })
    );
    try {
      const r = await generateJson<{ ok: boolean }>(REQ);
      assert.equal(r.data.ok, true);
    } finally {
      m.restore();
    }
  }));
