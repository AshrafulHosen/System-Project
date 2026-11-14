import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/milestones/server";
import { generateJson, getAiConfig } from "@/lib/ai/provider";
import { checkAiRateLimit, logAiGeneration } from "@/lib/ai/usage";
import { aiFailureResponse, cleanList } from "@/lib/ai/route-helpers";
import { CATEGORIES } from "@/data/mockData";
import {
  BRIEF_ACTION_INSTRUCTIONS,
  BRIEF_SCHEMA,
  BRIEF_SECTION_KEYS,
  BRIEF_SYSTEM,
  buildBriefUserMessage,
  type BriefAction,
  type BriefOutput,
  type BriefSection,
  type BriefSectionKey,
} from "@/lib/ai/prompts";

const ACTIONS = new Set(Object.keys(BRIEF_ACTION_INSTRUCTIONS));
const NEEDS_BRIEF = new Set<BriefAction>(["regenerate_section", "more_detail", "simplify", "more_technical", "clarity", "trim"]);
const SOURCES = new Set(["client", "suggested", "needs_confirmation"]);
const MONEY = /(৳\s?\d|\bBDT\s?\d|\d[\d,.]*\s?(?:k\s)?(?:BDT|taka|tk)\b|\bTk\.?\s?\d)/i;
const INPUT_FIELDS = ["idea", "category", "features", "technologies", "audience", "deliverables", "budget", "deadline", "design", "special"] as const;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function sanitizeBrief(raw: unknown): BriefOutput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const sectionsIn = (r.sections ?? {}) as Record<string, unknown>;
  const sections = {} as Record<BriefSectionKey, BriefSection>;
  for (const key of BRIEF_SECTION_KEYS) {
    const s = (sectionsIn[key] ?? {}) as Record<string, unknown>;
    const source = typeof s.source === "string" && SOURCES.has(s.source) ? s.source : "suggested";
    sections[key] = { content: str(s.content, 4000), source: source as BriefSection["source"] };
  }
  return {
    title: str(r.title, 120),
    sections,
    required_skills: cleanList(r.required_skills, 10, 60),
    suggested_category: str(r.suggested_category, 120),
    follow_up_questions: cleanList(r.follow_up_questions, 6, 300),
  };
}

/**
 * POST /api/ai/brief
 * Body: { action, input: {idea, category?, features?, …, budget?, deadline?}, answers?, currentBrief?, targetSection?, lang? }
 * Returns an editable brief. Never creates or publishes a job.
 */
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Sign in as a client to use the brief generator." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const action = (typeof body.action === "string" ? body.action : "generate") as BriefAction;
  if (!ACTIONS.has(action)) return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });

  const rawInput = (body.input && typeof body.input === "object" ? body.input : {}) as Record<string, unknown>;
  const input: Record<string, string> = {};
  for (const f of INPUT_FIELDS) {
    const v = str(rawInput[f], f === "idea" ? 3000 : 800);
    if (v) input[f] = v;
  }
  if ((input.idea ?? "").length < 20) {
    return NextResponse.json({ ok: false, error: "Describe your project idea in at least 20 characters." }, { status: 400 });
  }
  const answers = Array.isArray(body.answers)
    ? (body.answers as unknown[]).slice(0, 8).map((a) => {
        const o = (a ?? {}) as Record<string, unknown>;
        return { question: str(o.question, 300), answer: str(o.answer, 800) };
      }).filter((a) => a.question && a.answer)
    : [];

  const currentBrief = NEEDS_BRIEF.has(action) ? sanitizeBrief(body.currentBrief) : null;
  if (NEEDS_BRIEF.has(action) && !currentBrief) {
    return NextResponse.json({ ok: false, error: "Generate a brief first." }, { status: 400 });
  }
  const targetSection = typeof body.targetSection === "string" ? (body.targetSection as BriefSectionKey) : null;
  if (action === "regenerate_section" && (!targetSection || !BRIEF_SECTION_KEYS.includes(targetSection))) {
    return NextResponse.json({ ok: false, error: "Choose a section to regenerate." }, { status: 400 });
  }
  const lang = body.lang === "bn" ? "bn" : "en";

  const cfg = getAiConfig();
  if (!cfg) {
    return NextResponse.json(
      { ok: false, code: "NOT_CONFIGURED", error: "The AI brief generator isn't configured on this server yet." },
      { status: 503 }
    );
  }

  const db = createAdminClient();
  const { data: client } = await db.from("clients").select("id").eq("user_id", userId).maybeSingle();
  if (!client) return NextResponse.json({ ok: false, error: "Only clients can generate project briefs." }, { status: 403 });

  const limit = await checkAiRateLimit(userId, "PROJECT_BRIEF");
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, code: "RATE_LIMITED", error: limit.message }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  const allowedCategories: string[] = CATEGORIES.map((c) => c.name);
  const data = {
    ACTION: BRIEF_ACTION_INSTRUCTIONS[action],
    TARGET_SECTION: action === "regenerate_section" ? targetSection : null,
    LANGUAGE: lang,
    ALLOWED_CATEGORIES: allowedCategories,
    CLIENT_INPUT: input,
    CLIENT_ANSWERS_TO_FOLLOW_UP_QUESTIONS: answers,
    CURRENT_BRIEF: currentBrief,
  };

  const logBase = { userId, kind: "PROJECT_BRIEF" as const, action, provider: cfg.provider, model: cfg.model };
  try {
    const result = await generateJson<BriefOutput>({
      system: BRIEF_SYSTEM,
      user: buildBriefUserMessage(data),
      schemaName: "project_brief",
      schema: BRIEF_SCHEMA as unknown as Record<string, unknown>,
      maxOutputTokens: 3000,
      temperature: action === "regenerate" ? 0.8 : 0.4,
    });

    let brief = sanitizeBrief(result.data);
    if (!brief || brief.title.length < 5 || !brief.sections.overview.content) {
      await logAiGeneration({ ...logBase, model: result.model, status: "FAILED", errorCode: "INVALID_OUTPUT" });
      return NextResponse.json({ ok: false, code: "INVALID_OUTPUT", error: "The AI returned an unusable brief. Try again." }, { status: 502 });
    }

    // Regenerating one section must never change the others.
    if (action === "regenerate_section" && currentBrief && targetSection) {
      brief = { ...currentBrief, sections: { ...currentBrief.sections, [targetSection]: brief.sections[targetSection] } };
    }

    // Server-side guarantees, independent of the model's behaviour:
    const warnings: string[] = [];
    if (!allowedCategories.includes(brief.suggested_category)) brief.suggested_category = "";
    for (const key of ["suggested_milestones", "estimated_timeline"] as const) {
      if (brief.sections[key].source === "client" && !input.deadline) brief.sections[key].source = "suggested";
    }
    if (!input.budget) {
      for (const key of BRIEF_SECTION_KEYS) {
        if (MONEY.test(brief.sections[key].content)) {
          brief.sections[key].source = "needs_confirmation";
          warnings.push(`The "${key.replace(/_/g, " ")}" section mentions an amount you didn't provide. Review or remove it.`);
        }
      }
    }

    await logAiGeneration({
      ...logBase,
      model: result.model,
      status: "SUCCESS",
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });
    return NextResponse.json({
      ok: true,
      brief,
      warnings,
      provided: { budget: input.budget ?? null, deadline: input.deadline ?? null },
    });
  } catch (err) {
    return aiFailureResponse(err, logBase);
  }
}
