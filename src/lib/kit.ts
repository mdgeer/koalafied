// Kit v4 API integration for Koalafied
// Handles subscriber creation and quiz/lifecycle tagging.
// Report delivery email is handled by Resend (src/lib/resend.ts) — not Kit.

import { sendReportEmail } from "@/lib/resend";
import type { QuizAnswers } from "@/lib/types";

if (!process.env.KIT_API_KEY) {
  throw new Error("Missing KIT_API_KEY");
}

const KIT_API_KEY = process.env.KIT_API_KEY as string;
const KIT_BASE = "https://api.kit.com/v4";

const QUIZ_TAGS: Record<keyof QuizAnswers, Record<string, string>> = {
  job_search_stage: {
    active:               "koalafied:search:active",
    one_to_three_months:  "koalafied:search:1_3_months",
    casually_exploring:   "koalafied:search:exploring",
    internal_promotion:   "koalafied:search:internal",
  },
  pm_level: {
    aspiring: "koalafied:level:aspiring",
    early:    "koalafied:level:early",
    mid:      "koalafied:level:mid",
    senior:   "koalafied:level:senior",
  },
  ai_skill_level: {
    just_starting:           "koalafied:ai_skill:starting",
    comfortable_with_basics: "koalafied:ai_skill:basics",
    intermediate:            "koalafied:ai_skill:intermediate",
    advanced:                "koalafied:ai_skill:advanced",
  },
  biggest_challenge: {
    not_getting_interviews:       "koalafied:challenge:no_interviews",
    not_advancing_in_interviews:  "koalafied:challenge:not_advancing",
    unsure_of_gaps:               "koalafied:challenge:unsure_gaps",
    know_gaps_not_how_to_close:   "koalafied:challenge:know_gaps",
  },
  ai_goal: {
    use_ai_for_work:        "koalafied:goal:use_tools",
    understand_ai_products: "koalafied:goal:understand_products",
    build_with_ai:          "koalafied:goal:build",
    all_of_the_above:       "koalafied:goal:all",
  },
};

// Creates or updates the subscriber in Kit, applies all tags, and sends the
// report delivery email via Resend. Throws on subscriber create or email failure.
export async function subscribeWithReport(
  email: string,
  reportUrl: string,
  quiz: QuizAnswers,
): Promise<void> {
  const subRes = await kitFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  });
  if (!subRes.ok) {
    throw new Error(`Kit subscriber create failed: ${subRes.status} ${await subRes.text()}`);
  }

  // Fire and forget — tag failures don't fail the job
  applySubscriberTags(email, quiz).catch((err) =>
    console.error("[koalafied] Kit tagging failed:", err),
  );

  await sendReportEmail(email, reportUrl);
}

// Tags subscriber with report_failed so Kit routes them to the failure sequence.
// Best-effort — errors are swallowed so this never compounds an already-failed job.
export async function tagReportFailed(email: string): Promise<void> {
  const tagId = await ensureTag("koalafied:report_failed");
  if (!tagId) return;
  await kitFetch(`/tags/${tagId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  }).catch(() => {});
}

// koalafied:subscriber     — every successful submission; master Koalafied segment
// koalafied:report_delivered — successful reports only; nurture sequence trigger
async function applySubscriberTags(email: string, quiz: QuizAnswers): Promise<void> {
  const tagNames = [
    "koalafied:subscriber",
    "koalafied:report_delivered",
    ...(Object.keys(quiz) as (keyof QuizAnswers)[])
      .map((field) => QUIZ_TAGS[field]?.[quiz[field]])
      .filter(Boolean) as string[],
  ];

  await Promise.all(
    tagNames.map(async (name) => {
      const tagId = await ensureTag(name);
      if (!tagId) return;
      await kitFetch(`/tags/${tagId}/subscribers`, {
        method: "POST",
        body: JSON.stringify({ email_address: email }),
      });
    }),
  );
}

async function ensureTag(name: string): Promise<string | null> {
  try {
    const res = await kitFetch("/tags", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    const tag = data?.tag as Record<string, unknown> | undefined;
    return (tag?.id as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function kitFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${KIT_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Kit-Api-Key": KIT_API_KEY,
    },
  });
}
