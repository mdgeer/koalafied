// Rate limiting via Upstash — Phase 2 implementation
// 3 submissions per IP per hour, 6 per day. Applied as middleware on /api/analyze.
// Uses @upstash/ratelimit with the shared Redis client.
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// TODO: tighten back to 3/hour and 6/day before wider promotion
// Temporarily elevated for pre-launch testing
export const hourlyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(25, "60 m"),
  prefix: "koalafied:rl:hour",
});

export const dailyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "24 h"),
  prefix: "koalafied:rl:day",
});
