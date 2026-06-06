// GET /api/status/[job_id]
// Polled by the client every 4 seconds after form submission.
// Returns: { status: "pending" } | { status: "complete", report_id: string } | { status: "failed" }
export const prerender = false;

import type { APIRoute } from "astro";
import { jobKey, redis } from "@/lib/redis";
import type { JobStatus } from "@/lib/types";

export const GET: APIRoute = async ({ params }) => {
  const { job_id } = params;

  if (!job_id) {
    return json({ error: "Missing job_id." }, 400);
  }

  const job = await redis.get<JobStatus>(jobKey(job_id));

  if (!job) {
    // Job key expired or never existed — treat as failed so the client stops polling
    return json({ status: "failed" }, 404);
  }

  return json(job);
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
