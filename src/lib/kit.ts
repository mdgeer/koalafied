// Kit v4 API integration for Koalafied
// Handles subscriber creation, quiz tagging, and report email delivery via form automation.

import type { QuizAnswers } from "@/lib/types";

if (!import.meta.env.KIT_API_KEY) {
  throw new Error("Missing KIT_API_KEY");
}

const KIT_API_KEY = import.meta.env.KIT_API_KEY as string;
const KIT_BASE = "https://api.kit.com/v4";

// Tag names applied per quiz answer — prefixed with "koalafied:" for easy filtering in Kit.
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

// Creates or updates the subscriber with the report URL as a custom field, then adds
// them to the Koalafied Kit form (which triggers the report email automation).
// Quiz tagging is fired and forgotten — tag failures don't fail the job.
// Throws on subscriber create or form-add failure (both logged + surfaced via kitRetry).
export async function subscribeWithReport(
  email: string,
  reportUrl: string,
  quiz: QuizAnswers,
): Promise<void> {
  const formId = import.meta.env.KIT_FORM_ID as string | undefined;
  if (!formId) throw new Error("Missing KIT_FORM_ID");

  // Create or update subscriber — stores report_url as a custom field so the
  // email template can reference {{ subscriber.report_url }}
  const subRes = await kitFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify({
      email_address: email,
      fields: { report_url: reportUrl },
    }),
  });
  if (!subRes.ok) {
    throw new Error(`Kit subscriber create failed: ${subRes.status} ${await subRes.text()}`);
  }

  // Add to the Koalafied form — this is what triggers the report link email in Kit
  const formRes = await kitFetch(`/forms/${formId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  });
  if (!formRes.ok) {
    throw new Error(`Kit form add failed: ${formRes.status} ${await formRes.text()}`);
  }

  // Apply quiz tags — non-critical, fire and forget
  applyQuizTags(email, quiz).catch((err) =>
    console.error("[koalafied] Kit quiz tagging failed:", err),
  );
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

async function applyQuizTags(email: string, quiz: QuizAnswers): Promise<void> {
  const tagNames = (Object.keys(quiz) as (keyof QuizAnswers)[])
    .map((field) => QUIZ_TAGS[field]?.[quiz[field]])
    .filter(Boolean) as string[];

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

// Creates the tag if it doesn't exist; Kit returns the existing tag if the name matches.
// Returns the tag ID or null on any failure.
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
