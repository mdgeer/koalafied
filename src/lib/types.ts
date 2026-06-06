// Shared types for Koalafied API routes and lib files

// ─── Stored report shape (fetched from Upstash by report page) ───────────────
// sections.resources.items[].is_free is Astro-resolved at render time — not stored.

export interface ReportCategoryScore {
  category_id: string;
  jd_required: boolean;
  match_level: "strong" | "ambiguous" | "gap";
  weight: number;
  weighted_contribution: number;
}

export interface ReportResourceItem {
  resource_key: string;
  title: string;
  description: string;
  skill_label: string;
  tags: string[];
}

export interface Report {
  id: string;
  schema_version: string;
  generated_at: string;
  expires_at: string;
  metadata: {
    role_title: string;
    company_name: string | null;
    jd_level: string;
  };
  quiz: QuizAnswers;
  scoring: {
    overall_score: number;
    tier: "strong_fit" | "borderline" | "not_ready";
    strong_count: number;
    ambiguous_count: number;
    gap_count: number;
    category_scores: ReportCategoryScore[];
  };
  sections: {
    fit_summary: {
      narrative: string;
      top_strengths: string[];
      top_gaps: string[];
    };
    strengths: {
      items: Array<{ category_id: string; category_name: string; explanation: string }>;
    };
    ambiguous_areas: {
      items: Array<{ category_id: string; category_name: string; explanation: string; fix: string }>;
    };
    gaps: {
      items: Array<{ category_id: string; category_name: string; explanation: string; severity: "minor" | "moderate" | "significant" }>;
    };
    ai_assessment: {
      required_tier: "not_required" | "ai_tools" | "ai_product";
      required_tier_label: string;
      required_tier_description: string;
      user_level_match: "below" | "at" | "above" | "not_applicable";
      gap_narrative: string;
      specific_guidance: string;
    };
    learning_path: {
      items: Array<{ priority: number; skill_label: string; category_id: string | null; time_estimate: string; description: string }>;
    };
    resources: {
      items: ReportResourceItem[];
    };
    projects: {
      items: Array<{ title: string; description: string; skill_label: string; time_estimate: string; difficulty: "beginner" | "intermediate" | "advanced"; demonstrates: string[] }>;
    };
    resume_recommendations: {
      items: Array<{ title: string; explanation: string; current_example: string | null; improved_example: string | null }>;
    };
    thirty_day_plan: {
      weeks: Array<{ label: string; focus: string; actions: string[] }>;
    };
  };
}

// ─── Quiz + Job status ────────────────────────────────────────────────────────

export interface QuizAnswers {
  job_search_stage: "active" | "one_to_three_months" | "casually_exploring" | "internal_promotion";
  biggest_challenge: "not_getting_interviews" | "not_advancing_in_interviews" | "unsure_of_gaps" | "know_gaps_not_how_to_close";
  pm_level: "aspiring" | "early" | "mid" | "senior";
  ai_skill_level: "just_starting" | "comfortable_with_basics" | "intermediate" | "advanced";
  ai_goal: "use_ai_for_work" | "understand_ai_products" | "build_with_ai" | "all_of_the_above";
}

export type JobStatus =
  | { status: "pending" }
  | { status: "complete"; report_id: string }
  | { status: "failed" };
