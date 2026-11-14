/**
 * Server-only AI provider layer.
 *
 * The rest of the app calls `generateJson()` and never talks to a vendor directly,
 * so the provider or model can be changed via environment variables:
 *
 *   AI_PROVIDER      = openai            (default; the only provider implemented today)
 *   OPENAI_API_KEY   = sk-...            (required — server-side only, never NEXT_PUBLIC_)
 *   AI_MODEL         = gpt-4o-mini       (optional override; must support JSON-schema output)
 *   OPENAI_BASE_URL  = https://api.openai.com/v1   (optional; Azure/OpenAI-compatible proxies)
 *   AI_TIMEOUT_MS    = 30000             (optional)
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
  constructor(public code: AiErrorCode, message: string) {
    super(message);
    this.name = "AiError";
  }
}

export interface AiConfig {
  provider: "openai";
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
}

export function getAiConfig(): AiConfig | null {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (provider !== "openai") return null;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    provider: "openai",
    apiKey,
    model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    timeoutMs: Math.min(120_000, Math.max(5_000, Number(process.env.AI_TIMEOUT_MS) || 30_000)),
  };
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

export async function generateJson<T>(req: AiJsonRequest): Promise<AiJsonResult<T>> {
  const cfg = getAiConfig();
  if (!cfg) throw new AiError("NOT_CONFIGURED", "AI is not configured on this server.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: req.schemaName, strict: true, schema: req.schema },
        },
        max_completion_tokens: req.maxOutputTokens,
        temperature: req.temperature ?? 0.5,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw new AiError("TIMEOUT", "The AI provider took too long to respond.");
    throw new AiError("PROVIDER_ERROR", "Could not reach the AI provider.");
  } finally {
    clearTimeout(timer);
  }

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

  let data: T;
  try {
    data = JSON.parse(content) as T;
  } catch {
    throw new AiError("INVALID_OUTPUT", "The AI response was not valid JSON.");
  }

  return {
    data,
    provider: cfg.provider,
    model: body.model || cfg.model,
    usage: {
      promptTokens: body.usage?.prompt_tokens ?? null,
      completionTokens: body.usage?.completion_tokens ?? null,
    },
  };
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
