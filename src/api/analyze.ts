// POST /api/analyze
// Validates input, checks rate limits, creates a job in Redis, fires background job, returns job_id immediately.
export const prerender = false;

import type { APIRoute } from "astro";
import { callClaude } from "@/lib/claude";
import { subscribeWithReport, tagReportFailed } from "@/lib/kit";
import { dailyLimit, hourlyLimit } from "@/lib/rate-limit";
import { JOB_TTL, REPORT_TTL, jobKey, kitRetryKey, reportKey, redis } from "@/lib/redis";
import { sanitizeEmail, sanitizeField } from "@/lib/sanitize";
import { computeScore } from "@/lib/scoring";
import type { QuizAnswers } from "@/lib/types";

// Taxonomy weights — must stay in sync with skill-taxonomy.json
const CATEGORY_WEIGHTS: Record<string, number> = {
  product_strategy_execution: 17,
  data_fluency_analytics: 15,
  cross_functional_collaboration: 13,
  communication_influence: 11,
  discovery_user_empathy: 10,
  ai_product_expertise: 10,
  ai_tool_fluency: 9,
  technical_acumen: 8,
  leadership_strategic_thinking: 7,
};

const MATCH_VALUES: Record<string, number> = { strong: 1.0, ambiguous: 0.5, gap: 0 };

const VALID: Record<keyof QuizAnswers, readonly string[]> = {
  job_search_stage: ["active", "one_to_three_months", "casually_exploring", "internal_promotion"],
  biggest_challenge: ["not_getting_interviews", "not_advancing_in_interviews", "unsure_of_gaps", "know_gaps_not_how_to_close"],
  pm_level: ["aspiring", "early", "mid", "senior"],
  ai_skill_level: ["just_starting", "comfortable_with_basics", "intermediate", "advanced"],
  ai_goal: ["use_ai_for_work", "understand_ai_products", "build_with_ai", "all_of_the_above"],
};

function validEnum(key: keyof QuizAnswers, val: unknown): val is string {
  return typeof val === "string" && VALID[key].includes(val);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting — keyed by IP; bypassed if X-Admin-Key header matches env var
  const adminKey = import.meta.env.KOALAFIED_ADMIN_KEY;
  const isAdmin = adminKey && request.headers.get("X-Admin-Key") === adminKey;

  if (!isAdmin) {
    const ip = clientAddress ?? "unknown";
    const [hourly, daily] = await Promise.all([hourlyLimit.limit(ip), dailyLimit.limit(ip)]);
    if (!hourly.success || !daily.success) {
      return json({ error: "Rate limit exceeded. Please try again later." }, 429);
    }
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  // Sanitize text fields
  const resume = sanitizeField(body.resume);
  const job_description = sanitizeField(body.job_description);
  const email = sanitizeEmail(body.email);

  if (!resume || !job_description) {
    return json({ error: "resume and job_description are required." }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email address is required." }, 400);
  }

  // Validate quiz answers
  const quizKeys = Object.keys(VALID) as (keyof QuizAnswers)[];
  for (const key of quizKeys) {
    if (!validEnum(key, body[key])) {
      return json({ error: `Invalid value for ${key}.` }, 400);
    }
  }
  const quiz = Object.fromEntries(quizKeys.map((k) => [k, body[k]])) as unknown as QuizAnswers;

  // Create job — write pending status to Redis, return job_id immediately
  const job_id = crypto.randomUUID();
  await redis.setex(jobKey(job_id), JOB_TTL, { status: "pending" });

  // Store email + job_id for Kit retry (24-hr TTL) before firing background work
  await redis.setex(kitRetryKey(job_id), 24 * 60 * 60, { email, job_id });

  // Fire and forget — response is returned before this completes
  runJob({ job_id, resume, job_description, email, quiz }).catch(console.error);

  return json({ job_id }, 202);
};

// ─── Background job ───────────────────────────────────────────────────────────

interface JobParams {
  job_id: string;
  resume: string;
  job_description: string;
  email: string;
  quiz: QuizAnswers;
}

async function runJob(params: JobParams): Promise<void> {
  const { job_id, resume, job_description, email, quiz } = params;
  try {
    // Step 1: Call Claude — retries once internally on JSON parse failure
    const claudeOut = await callClaude({ resume, job_description, quiz });

    // Step 2: Validate critical structure before computing or storing anything
    const EXPECTED_SECTIONS = [
      "fit_summary", "strengths", "ambiguous_areas", "gaps",
      "ai_assessment", "learning_path", "resources", "projects",
      "resume_recommendations", "thirty_day_plan",
    ];
    for (const s of EXPECTED_SECTIONS) {
      if (!(s in claudeOut.sections)) throw new Error(`Missing section: ${s}`);
    }
    if (claudeOut.scoring.category_scores.length !== 9) {
      throw new Error(`Expected 9 category_scores, got ${claudeOut.scoring.category_scores.length}`);
    }

    // Step 3: Enrich category scores with weights + weighted contributions
    const enrichedScores = claudeOut.scoring.category_scores.map((cs) => ({
      ...cs,
      weight: CATEGORY_WEIGHTS[cs.category_id] ?? 0,
      weighted_contribution:
        (CATEGORY_WEIGHTS[cs.category_id] ?? 0) * (MATCH_VALUES[cs.match_level] ?? 0),
    }));

    // Step 4: Compute aggregate score + tier
    const { overall_score, tier } = computeScore(
      enrichedScores.map((c) => ({ weight: c.weight, match_level: c.match_level })),
    );

    // strong/ambiguous/gap counts scoped to jd_required=true per report-schema.json
    const required = enrichedScores.filter((c) => c.jd_required);
    const strong_count = required.filter((c) => c.match_level === "strong").length;
    const ambiguous_count = required.filter((c) => c.match_level === "ambiguous").length;
    const gap_count = required.filter((c) => c.match_level === "gap").length;

    // Step 5: Build full report
    const report_id = crypto.randomUUID();
    const now = new Date();
    const report = {
      id: report_id,
      schema_version: "1.0",
      generated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REPORT_TTL * 1000).toISOString(),
      metadata: claudeOut.metadata,
      quiz,
      scoring: {
        overall_score,
        tier,
        strong_count,
        ambiguous_count,
        gap_count,
        category_scores: enrichedScores,
      },
      sections: claudeOut.sections,
    };

    // Step 6: Store report — retry once on transient Upstash failure
    try {
      await redis.setex(reportKey(report_id), REPORT_TTL, report);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await redis.setex(reportKey(report_id), REPORT_TTL, report);
    }

    // Step 7: Mark job complete — client polling will redirect to the report page
    await redis.setex(jobKey(job_id), JOB_TTL, { status: "complete", report_id });

    // Step 8: Update kitRetry record to include report_id (enables manual recovery if Kit fails)
    await redis.setex(kitRetryKey(job_id), 24 * 60 * 60, { email, job_id, report_id }).catch(() => {});

    // Step 9: Kit — subscribe, store report URL, trigger report email, apply quiz tags
    const reportUrl = `${import.meta.env.SITE}/koalafied/report/${report_id}`;
    try {
      await subscribeWithReport(email, reportUrl, quiz);
    } catch (kitErr) {
      // Non-fatal: report is already delivered via browser redirect. Log + tag for failure sequence.
      console.error(`[koalafied] Kit failed for job ${job_id}:`, kitErr);
      await tagReportFailed(email).catch(() => {});
    }
  } catch (err) {
    console.error(`[koalafied] job ${job_id} failed:`, err);
    await redis.setex(jobKey(job_id), JOB_TTL, { status: "failed" }).catch(() => {});
    await tagReportFailed(email).catch(() => {}); // Routes to failure sequence; email in kitRetry record
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
