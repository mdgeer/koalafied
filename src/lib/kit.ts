// Kit v4 API integration for Koalafied
// Report emails are sent via per-submission broadcasts with the URL baked into
// content at creation time — eliminates the custom-field overwrite race and
// ensures repeat submitters always receive their specific report link.

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

// Creates or updates the subscriber, applies quiz tags, and sends the report
// delivery email. Throws on subscriber create or broadcast failure (both logged
// and surfaced via kitRetry in analyze.ts).
export async function subscribeWithReport(
  email: string,
  reportUrl: string,
  reportId: string,
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
  applyQuizTags(email, quiz).catch((err) =>
    console.error("[koalafied] Kit quiz tagging failed:", err),
  );

  await sendReportEmail(email, reportUrl, reportId);
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

// Creates a unique per-submission tag, applies it to the subscriber, then creates
// a Kit broadcast targeting that tag with the report URL baked into the body.
// published_at = now triggers immediate delivery. Each submission gets its own
// broadcast so repeat submitters always receive the correct URL.
async function sendReportEmail(email: string, reportUrl: string, reportId: string): Promise<void> {
  const tagName = `koalafied:rpt:${reportId.slice(0, 8)}`;
  const tagId = await ensureTag(tagName);
  if (!tagId) throw new Error("Failed to create submission tag for report email");

  const tagRes = await kitFetch(`/tags/${tagId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  });
  if (!tagRes.ok) {
    throw new Error(`Failed to tag subscriber for report delivery: ${tagRes.status} ${await tagRes.text()}`);
  }

  const broadcastRes = await kitFetch("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      subject: "Your Koalafied PM report is ready",
      content: reportEmailHtml(reportUrl),
      subscriber_filter: [{ all: [{ type: "tag", ids: [Number(tagId)] }] }],
      published_at: new Date().toISOString(),
    }),
  });
  if (!broadcastRes.ok) {
    throw new Error(`Kit broadcast failed: ${broadcastRes.status} ${await broadcastRes.text()}`);
  }
}

function reportEmailHtml(reportUrl: string): string {
  return `
<p>Your Koalafied PM fit analysis is ready.</p>
<p style="margin:24px 0;">
  <a href="${reportUrl}"
     style="background:#000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">
    View Your Report &rarr;
  </a>
</p>
<p>Or paste this link in your browser:<br>
  <a href="${reportUrl}">${reportUrl}</a>
</p>
<p style="color:#888;font-size:12px;margin-top:24px;">
  This link expires in 30 days. Run a fresh analysis at
  <a href="https://mattgeer.com/koalafied" style="color:#888;">mattgeer.com/koalafied</a>.
</p>
  `.trim();
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
