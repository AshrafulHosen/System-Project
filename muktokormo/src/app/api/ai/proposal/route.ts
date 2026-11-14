import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/payments/constants";
import { getSessionUserId } from "@/lib/milestones/server";
import { generateJson, getAiConfig } from "@/lib/ai/provider";
import { checkAiRateLimit, logAiGeneration } from "@/lib/ai/usage";
import { aiFailureResponse, cleanList } from "@/lib/ai/route-helpers";
import {
  PROPOSAL_ACTION_INSTRUCTIONS,
  PROPOSAL_SCHEMA,
  PROPOSAL_SYSTEM,
  buildProposalUserMessage,
  type ProposalAction,
  type ProposalOutput,
} from "@/lib/ai/prompts";

const ACTIONS = new Set(Object.keys(PROPOSAL_ACTION_INSTRUCTIONS));
const NEEDS_DRAFT = new Set<ProposalAction>(["improve", "shorten", "professional", "persuasive", "simplify", "tone", "expand"]);
const TONES = new Set(["friendly", "confident", "formal", "concise", "warm"]);

/**
 * POST /api/ai/proposal
 * Body: { jobId, action, currentDraft?, tone?, additionalDetails?, lang? }
 * Returns a draft for the freelancer to edit. Never submits anything.
 */
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in as a freelancer to use the proposal assistant." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const action = (typeof body.action === "string" ? body.action : "generate") as ProposalAction;
  if (!ACTIONS.has(action)) return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  if (!isUuid(body.jobId)) return NextResponse.json({ ok: false, error: "A valid jobId is required." }, { status: 400 });

  const currentDraft = typeof body.currentDraft === "string" ? body.currentDraft.trim() : "";
  if (currentDraft.length > 6000) return NextResponse.json({ ok: false, error: "The draft is too long (max 6,000 characters)." }, { status: 400 });
  if (NEEDS_DRAFT.has(action) && currentDraft.length < 40) {
    return NextResponse.json({ ok: false, error: "Write or generate a draft first (at least 40 characters)." }, { status: 400 });
  }
  const tone = typeof body.tone === "string" ? body.tone.toLowerCase() : "";
  if (action === "tone" && !TONES.has(tone)) return NextResponse.json({ ok: false, error: "Choose a supported tone." }, { status: 400 });
  const additionalDetails = typeof body.additionalDetails === "string" ? body.additionalDetails.trim().slice(0, 1500) : "";
  if (action === "expand" && additionalDetails.length < 10) {
    return NextResponse.json({ ok: false, error: "Add the details you want included." }, { status: 400 });
  }
  const lang = body.lang === "bn" ? "bn" : "en";

  const cfg = getAiConfig();
  if (!cfg) {
    return NextResponse.json(
      { ok: false, code: "NOT_CONFIGURED", error: "The AI proposal assistant isn't configured on this server yet." },
      { status: 503 }
    );
  }

  const db = createAdminClient();
  // Role check: only freelancers, using their own profile
  const { data: fl } = await db
    .from("freelancers")
    .select("id, title, bio, skills, hourly_rate")
    .eq("user_id", userId)
    .maybeSingle();
  if (!fl) return NextResponse.json({ ok: false, error: "Only freelancers can generate proposals." }, { status: 403 });

  const limit = await checkAiRateLimit(userId, "PROPOSAL");
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, code: "RATE_LIMITED", error: limit.message }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  const { data: job } = await db
    .from("projects")
    .select("id, title, description, skills_required, category, job_type, experience_level, budget_bdt, budget_min, budget_max, timeline_days, status")
    .eq("id", body.jobId as string)
    .maybeSingle();
  if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });

  // Facts the freelancer is entitled to use: their own record only.
  const [{ data: doneContracts }, { data: reviews }, { data: pastProposals }] = await Promise.all([
    db.from("contracts").select("projects(title, skills_required, category)").eq("freelancer_id", fl.id).eq("payment_status", "RELEASED").limit(5),
    db.from("reviews").select("feedback, strengths, overall_rating").eq("reviewee_user_id", userId)
      .eq("review_type", "CLIENT_TO_FREELANCER").eq("moderation_status", "VISIBLE").order("created_at", { ascending: false }).limit(3),
    db.from("proposals").select("portfolio_links").eq("freelancer_id", fl.id).limit(20),
  ]);

  const completedProjects = ((doneContracts ?? []) as { projects?: unknown }[])
    .map((c) => (Array.isArray(c.projects) ? c.projects[0] : c.projects) as { title?: string; skills_required?: string[]; category?: string } | null)
    .filter(Boolean)
    .map((p) => ({ title: p!.title, skills: p!.skills_required ?? [], category: p!.category ?? null }));
  const portfolioLinks = Array.from(
    new Set(((pastProposals ?? []) as { portfolio_links?: string[] }[]).flatMap((p) => p.portfolio_links ?? []))
  ).filter((u) => /^https?:\/\//i.test(u)).slice(0, 5);

  const data = {
    ACTION: PROPOSAL_ACTION_INSTRUCTIONS[action],
    LANGUAGE: lang,
    TONE: action === "tone" ? tone : null,
    ADDITIONAL_DETAILS: action === "expand" ? additionalDetails : null,
    CURRENT_DRAFT: currentDraft || null,
    JOB: {
      title: job.title,
      description: String(job.description ?? "").slice(0, 6000),
      required_skills: job.skills_required ?? [],
      category: job.category ?? null,
      contract_type: job.job_type ?? null,
      experience_level: job.experience_level ?? null,
      budget_bdt: job.budget_bdt ?? job.budget_max ?? job.budget_min ?? null,
      timeline_days: job.timeline_days ?? null,
    },
    FREELANCER_PROFILE: {
      title: fl.title ?? null,
      bio: String(fl.bio ?? "").slice(0, 3000) || null,
      skills: fl.skills ?? [],
      hourly_rate_bdt: fl.hourly_rate ?? null,
      completed_projects_on_platform: completedProjects,
      client_reviews: ((reviews ?? []) as { feedback?: string; strengths?: string; overall_rating?: number }[]).map((r) => ({
        rating: r.overall_rating,
        feedback: String(r.feedback ?? "").slice(0, 400),
        strengths: r.strengths ?? null,
      })),
      portfolio_links: portfolioLinks,
    },
  };

  const logBase = { userId, kind: "PROPOSAL" as const, action, relatedId: job.id as string, provider: cfg.provider, model: cfg.model };
  try {
    const result = await generateJson<ProposalOutput>({
      system: PROPOSAL_SYSTEM,
      user: buildProposalUserMessage(data),
      schemaName: "proposal_draft",
      schema: PROPOSAL_SCHEMA as unknown as Record<string, unknown>,
      maxOutputTokens: 1200,
      temperature: action === "regenerate" ? 0.8 : 0.5,
    });

    const proposal = typeof result.data?.proposal === "string" ? result.data.proposal.trim() : "";
    if (proposal.length < 80 || proposal.length > 6000) {
      await logAiGeneration({ ...logBase, model: result.model, status: "FAILED", errorCode: "INVALID_OUTPUT" });
      return NextResponse.json({ ok: false, code: "INVALID_OUTPUT", error: "The AI returned an unusable draft. Try again." }, { status: 502 });
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
      proposal,
      usedFacts: cleanList(result.data.used_facts, 10, 200),
      missingInfo: cleanList(result.data.missing_info, 8, 200),
    });
  } catch (err) {
    return aiFailureResponse(err, logBase);
  }
}
