/**
 * Server-only AI provider layer.
 *
 * The rest of the app calls `generateJson()` and never talks to a vendor directly,
 * so the provider or model can be changed with environment variables (server-side
 * only — never prefix these with NEXT_PUBLIC_):
 *
 *   AI_PROVIDER        = gemini | openai     (optional; auto-detected from which key is set,
 *                                             Gemini first)
 *   --- Gemini (Google AI Studio) ---
 *   GEMINI_API_KEY     = ...                 (required for Gemini)
 *   AI_MODEL           = gemini-3.5-flash    (optional; must support JSON-schema output)
 *   AI_FALLBACK_MODELS = gemini-3.5-flash-lite  (optional, comma-separated; tried when a model
 *                                             is overloaded, rate-limited or retired)
 *   GEMINI_BASE_URL    = https://generativelanguage.googleapis.com/v1beta  (optional)
 *   --- OpenAI ---
 *   OPENAI_API_KEY     = sk-...              (required for OpenAI)
 *   AI_MODEL           = gpt-4o-mini         (optional)
 *   OPENAI_BASE_URL    = https://api.openai.com/v1  (optional; Azure/OpenAI-compatible proxies)
 *   ---
 *   AI_TIMEOUT_MS      = 45000               (optional, per attempt, 5000–120000)
 */
if (typeof window !== "undefined") {
  throw new Error("src/lib/ai/provider.ts cannot be imported in browser code.");
}

export type AiErrorCode =
  | "NOT_CONFIGURED"
  | "PROVIDER_AUTH"
  | "PROVIDER_RATE_LIMITED"
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "REFUSED"
  | "INVALID_OUTPUT";

export class AiError extends Error {
  code: AiErrorCode;
  /** True for transient/availability failures where another model may succeed. */
  retryable: boolean;
  constructor(code: AiErrorCode, message: string, retryable = false) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.retryable = retryable;
  }
}

export interface AiConfig {
  provider: "openai" | "gemini";
  apiKey: string;
  /** Primary model first, then fallbacks. */
  models: string[];
  /** Primary model (kept for logging/compatibility). */
  model: string;
  baseUrl: string;
  timeoutMs: number;
}

function timeoutFromEnv(defaultMs: number) {
  return Math.min(120_000, Math.max(5_000, Number(process.env.AI_TIMEOUT_MS) || defaultMs));
}

export function getAiConfig(): AiConfig | null {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const provider = explicit || (geminiKey ? "gemini" : openaiKey ? "openai" : "");

  if (provider === "gemini" && geminiKey) {
    const primary = process.env.AI_MODEL?.trim() || "gemini-3.5-flash";
    const fallbacks = (process.env.AI_FALLBACK_MODELS ?? "gemini-3.5-flash-lite")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const models = Array.from(new Set([primary, ...fallbacks]));
    return {
      provider: "gemini",
      apiKey: geminiKey,
      models,
      model: primary,
      baseUrl: (process.env.GEMINI_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, ""),
      timeoutMs: timeoutFromEnv(45_000),
    };
  }
  if (provider === "openai" && openaiKey) {
    const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
    return {
      provider: "openai",
      apiKey: openaiKey,
      models: [model],
      model,
      baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
      timeoutMs: timeoutFromEnv(30_000),
    };
  }
  return null;
}

export interface AiJsonRequest {
  system: string;
  user: string;
  schemaName: string;
  /** JSON Schema (strict mode: every property required, additionalProperties false). */
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  temperature?: number;
}

export interface AiJsonResult<T> {
  data: T;
  provider: string;
  model: string;
  usage: { promptTokens: number | null; completionTokens: number | null };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new AiError("TIMEOUT", "The AI provider took too long to respond.", true);
    }
    throw new AiError("PROVIDER_ERROR", "Could not reach the AI provider.", true);
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonContent<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AiError("INVALID_OUTPUT", "The AI response was not valid JSON.");
  }
}

/* ------------------------------------------------------------------ OpenAI */
async function callOpenAi<T>(cfg: AiConfig, req: AiJsonRequest): Promise<AiJsonResult<T>> {
  const model = cfg.models[0];
  const res = await postJson(
    `${cfg.baseUrl}/chat/completions`,
    { Authorization: `Bearer ${cfg.apiKey}` },
    {
      model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
      response_format: { type: "json_schema", json_schema: { name: req.schemaName, strict: true, schema: req.schema } },
      max_completion_tokens: req.maxOutputTokens,
      temperature: req.temperature ?? 0.5,
    },
    cfg.timeoutMs
  );

  if (res.status === 401 || res.status === 403) throw new AiError("PROVIDER_AUTH", "The AI provider rejected the server's credentials.");
  if (res.status === 429) throw new AiError("PROVIDER_RATE_LIMITED", "The AI provider is rate limiting requests. Try again shortly.");
  if (!res.ok) throw new AiError("PROVIDER_ERROR", `The AI provider returned an error (${res.status}).`);

  let body: {
    choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };
  try {
    body = await res.json();
  } catch {
    throw new AiError("INVALID_OUTPUT", "The AI provider returned an unreadable response.");
  }
  const choice = body.choices?.[0];
  if (choice?.message?.refusal) throw new AiError("REFUSED", "The AI declined to generate this content.");
  if (choice?.finish_reason === "length") throw new AiError("INVALID_OUTPUT", "The AI response was cut off. Try again.");
  const content = choice?.message?.content;
  if (!content) throw new AiError("INVALID_OUTPUT", "The AI returned an empty response.");

  return {
    data: parseJsonContent<T>(content),
    provider: "openai",
    model: body.model || model,
    usage: { promptTokens: body.usage?.prompt_tokens ?? null, completionTokens: body.usage?.completion_tokens ?? null },
  };
}

/* ------------------------------------------------------------------ Gemini */
interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  modelVersion?: string;
  error?: { code?: number; message?: string; status?: string };
}

async function callGeminiModel<T>(cfg: AiConfig, model: string, req: AiJsonRequest): Promise<AiJsonResult<T>> {
  const res = await postJson(
    `${cfg.baseUrl}/models/${encodeURIComponent(model)}:generateContent`,
    // Key in a header, not the URL, so it never appears in request logs.
    { "x-goog-api-key": cfg.apiKey },
    {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: [{ role: "user", parts: [{ text: req.user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: req.schema,
        // Thinking tokens count toward this limit on current Gemini models; leave headroom
        // so the actual answer isn't truncated.
        maxOutputTokens: req.maxOutputTokens + 8192,
        temperature: req.temperature ?? 0.5,
      },
    },
    cfg.timeoutMs
  );

  let body: GeminiResponse = {};
  try {
    body = (await res.json()) as GeminiResponse;
  } catch {
    if (!res.ok) throw new AiError("PROVIDER_ERROR", `The AI provider returned an error (${res.status}).`, res.status >= 500);
    throw new AiError("INVALID_OUTPUT", "The AI provider returned an unreadable response.");
  }

  if (!res.ok) {
    const msg = String(body.error?.message ?? "");
    if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key/i.test(msg))) {
      throw new AiError("PROVIDER_AUTH", "The AI provider rejected the server's credentials.");
    }
    if (res.status === 429) {
      throw new AiError("PROVIDER_RATE_LIMITED", "The AI provider is rate limiting requests. Try again shortly.", true);
    }
    if (res.status === 404) {
      // Model retired or not available to this key — try the next configured model.
      throw new AiError("PROVIDER_ERROR", "The configured AI model is not available.", true);
    }
    throw new AiError("PROVIDER_ERROR", `The AI provider returned an error (${res.status}).`, res.status >= 500);
  }

  if (body.promptFeedback?.blockReason) throw new AiError("REFUSED", "The AI declined to generate this content.");
  const candidate = body.candidates?.[0];
  const finish = candidate?.finishReason ?? "";
  if (["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"].includes(finish)) {
    throw new AiError("REFUSED", "The AI declined to generate this content.");
  }
  if (finish === "MAX_TOKENS") throw new AiError("INVALID_OUTPUT", "The AI response was cut off. Try again.");
  const content = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!content) throw new AiError("INVALID_OUTPUT", "The AI returned an empty response.");

  return {
    data: parseJsonContent<T>(content),
    provider: "gemini",
    model: body.modelVersion || model,
    usage: {
      promptTokens: body.usageMetadata?.promptTokenCount ?? null,
      completionTokens:
        body.usageMetadata?.candidatesTokenCount === undefined
          ? null
          : body.usageMetadata.candidatesTokenCount + (body.usageMetadata.thoughtsTokenCount ?? 0),
    },
  };
}

async function callGemini<T>(cfg: AiConfig, req: AiJsonRequest): Promise<AiJsonResult<T>> {
  let lastErr: unknown = null;
  for (const model of cfg.models) {
    try {
      return await callGeminiModel<T>(cfg, model, req);
    } catch (err) {
      lastErr = err;
      // Only fall through to the next model for transient/availability problems.
      if (!(err instanceof AiError) || !err.retryable) throw err;
    }
  }
  if (lastErr instanceof AiError && lastErr.code === "PROVIDER_ERROR") {
    throw new AiError("PROVIDER_ERROR", "The AI service is busy right now. Please try again in a minute.");
  }
  throw lastErr;
}

/* ---------------------------------------------------------------- public */
export async function generateJson<T>(req: AiJsonRequest): Promise<AiJsonResult<T>> {
  const cfg = getAiConfig();
  if (!cfg) throw new AiError("NOT_CONFIGURED", "AI is not configured on this server.");
  return cfg.provider === "gemini" ? callGemini<T>(cfg, req) : callOpenAi<T>(cfg, req);
}

export function aiErrorStatus(code: AiErrorCode): number {
  switch (code) {
    case "NOT_CONFIGURED":
      return 503;
    case "PROVIDER_RATE_LIMITED":
      return 429;
    case "TIMEOUT":
      return 504;
    case "REFUSED":
      return 422;
    default:
      return 502;
  }
}
