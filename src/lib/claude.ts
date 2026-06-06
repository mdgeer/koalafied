// Anthropic client + Claude call helpers for Koalafied
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import type { QuizAnswers } from "@/lib/types";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("Missing ANTHROPIC_API_KEY");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const CLAUDE_TEMPERATURE = 0.3;
export const CLAUDE_MAX_TOKENS = 16000;

// [Claude]-annotated fields from report-schema.json.
// [Computed] fields (weights, overall_score, tier, counts) are added by the API route.
export interface ClaudeOutput {
  metadata: {
    role_title: string;
    company_name: string | null;
    jd_level: string;
  };
  scoring: {
    category_scores: Array<{
      category_id: string;
      jd_required: boolean;
      match_level: "strong" | "ambiguous" | "gap";
    }>;
  };
  sections: Record<string, unknown>;
}

export interface ClaudeInput {
  resume: string;
  job_description: string;
  quiz: QuizAnswers;
}

export function buildPrompt({ resume, job_description, quiz }: ClaudeInput): string {
  return `"""
${resume}
"""

"""
${job_description}
"""

Quiz answers:
  job_search_stage: ${quiz.job_search_stage}
  biggest_challenge: ${quiz.biggest_challenge}
  pm_level: ${quiz.pm_level}
  ai_skill_level: ${quiz.ai_skill_level}
  ai_goal: ${quiz.ai_goal}`;
}

function loadSystemPrompt(): string {
  // Prefer env var (useful for VPS without a deployed file); fall back to file at project root.
  const fromEnv = process.env.KOALAFIED_SYSTEM_PROMPT;
  if (fromEnv) return fromEnv;
  try {
    return readFileSync(join(process.cwd(), "system-prompt.txt"), "utf8");
  } catch {
    throw new Error("KOALAFIED_SYSTEM_PROMPT env var not set and system-prompt.txt not found");
  }
}

// Calls Claude with the system prompt cached. Retries once on JSON parse failure.
export async function callClaude(input: ClaudeInput): Promise<ClaudeOutput> {
  const systemPrompt = loadSystemPrompt();

  const userMessage = buildPrompt(input);
  const raw = await fetchClaude(systemPrompt, userMessage);

  try {
    return JSON.parse(raw) as ClaudeOutput;
  } catch {
    // Retry once with an explicit JSON reminder injected at the end of the user message
    const retryMessage =
      userMessage +
      "\n\nCRITICAL: Return a raw JSON object only. No preamble. No markdown code fences. Start with { and end with }.";
    const retryRaw = await fetchClaude(systemPrompt, retryMessage);
    return JSON.parse(retryRaw) as ClaudeOutput; // throws → caught by runJob, job marked failed
  }
}

async function fetchClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    temperature: CLAUDE_TEMPERATURE,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned unexpected content type");
  }
  return block.text;
}
