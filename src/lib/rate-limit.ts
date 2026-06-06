// Rate limiting via Upstash — Phase 2 implementation
// 3 submissions per IP per hour, 6 per day. Applied as middleware on /api/analyze.
// Uses @upstash/ratelimit with the shared Redis client.
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// 3 requests per 60-minute sliding window
export const hourlyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 m"),
  prefix: "koalafied:rl:hour",
});

// 6 requests per 24-hour sliding window
export const dailyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, "24 h"),
  prefix: "koalafied:rl:day",
});
