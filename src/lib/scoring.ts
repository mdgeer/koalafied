// Koalafied scoring — Phase 3 implementation
// Takes Claude's category_scores output (match_level per category) and computes
// weighted_contribution, overall_score, tier, strong_count, ambiguous_count, gap_count.
// These are [Computed] fields in report-schema.json — never output by Claude.

export type MatchLevel = "strong" | "ambiguous" | "gap";
export type ScoreTier = "strong_fit" | "borderline" | "not_ready";

const MATCH_VALUES: Record<MatchLevel, number> = {
  strong: 1.0,
  ambiguous: 0.5,
  gap: 0,
};

// Tier thresholds — preliminary, finalize during pre-launch eval testing
const TIER_THRESHOLDS = { strong_fit: 70, borderline: 50 };

export function computeScore(
  categoryScores: Array<{ weight: number; match_level: MatchLevel }>,
): { overall_score: number; tier: ScoreTier; strong_count: number; ambiguous_count: number; gap_count: number } {
  const maxPossible = categoryScores.reduce((sum, c) => sum + c.weight, 0);

  let weighted = 0;
  let strong_count = 0;
  let ambiguous_count = 0;
  let gap_count = 0;

  for (const c of categoryScores) {
    const value = MATCH_VALUES[c.match_level] ?? 0;
    weighted += c.weight * value;
    if (c.match_level === "strong") strong_count++;
    else if (c.match_level === "ambiguous") ambiguous_count++;
    else gap_count++;
  }

  const overall_score = Math.round((weighted / maxPossible) * 100);

  let tier: ScoreTier;
  if (overall_score >= TIER_THRESHOLDS.strong_fit) tier = "strong_fit";
  else if (overall_score >= TIER_THRESHOLDS.borderline) tier = "borderline";
  else tier = "not_ready";

  return { overall_score, tier, strong_count, ambiguous_count, gap_count };
}
