// Upstash Redis client + Koalafied key helpers
// Phase 2 will add the full get/set functions for job status and report storage.
import { Redis } from "@upstash/redis";

if (!import.meta.env.UPSTASH_REDIS_REST_URL || !import.meta.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
}

export const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

// TTL constants (seconds)
export const JOB_TTL = 5 * 60;        // 5 minutes — job status
export const REPORT_TTL = 30 * 24 * 60 * 60; // 30 days — stored report
export const KIT_RETRY_TTL = 24 * 60 * 60;   // 24 hours — Kit retry record

// Key namespaces
export const jobKey = (jobId: string) => `job:${jobId}`;
export const reportKey = (reportId: string) => `report:${reportId}`;
export const kitRetryKey = (jobId: string) => `kit_retry:${jobId}`;
