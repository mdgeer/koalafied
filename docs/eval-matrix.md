# Koalafied — Pre-Launch Eval Matrix

## Purpose

Validate the Claude system prompt against known scenarios before building the frontend. Run each test case manually via the API and compare actual output against pass criteria.

Not a regression suite — this is a pre-launch sanity check. Run it once before first deploy, and again after any significant prompt revision.

---

## Checklist — Applies to Every Test Run

### Mechanical (binary pass/fail)

- [ ] Output is valid JSON with no preamble, trailing text, or markdown code block
- [ ] `scoring.category_scores` contains exactly 9 items
- [ ] All 9 category_ids are present and match taxonomy exactly
- [ ] Categories with `jd_required: false` have `match_level: "ambiguous"` — never strong or gap
- [ ] None of the DO-NOT-OUTPUT fields appear: `weight`, `weighted_contribution`, `overall_score`, `tier`, `strong_count`, `ambiguous_count`, `gap_count`, `is_free`
- [ ] All `resource_key` values exist in the approved list
- [ ] All resource `title` values match the approved list exactly
- [ ] Every `ambiguous_areas` item has a `fix` field starting with "→ Fix:"
- [ ] `ai_assessment.user_level_match` is "not_applicable" when `required_tier` is "not_required"
- [ ] `learning_path.items` is ordered with priority 1 first
- [ ] `thirty_day_plan.weeks` has 2–4 entries

### Quality (human review)

- [ ] `fit_summary.narrative` references specific resume evidence — not generic category names
- [ ] `strengths` explanations cite actual resume content (names, numbers, artifacts)
- [ ] `ambiguous_areas` explanations identify the specific gap in evidence, not just "more detail needed"
- [ ] `gaps` explanations name the specific JD requirement that's unmet
- [ ] `learning_path` items are ordered by gap severity for this JD, not randomly
- [ ] `resources` descriptions are personalized to this candidate's gap, not generic course copy
- [ ] `projects` are realistic and completable for a working PM with no prior experience in that skill
- [ ] `resume_recommendations` include before/after examples where resume text is available

---

## Test Cases

---

### TC-01 — Strong Fit, Mid-Level B2B SaaS

**Scenario type:** Baseline — validates that strong matches are scored correctly and no phantom gaps are created

**What's being tested:**
- `match_level: "strong"` applied when concrete evidence exists (named tools, quantified outcomes, described process)
- `strengths` section produces evidence-grounded explanations, not generic category descriptions
- AI categories correctly set to `jd_required: false` when the JD doesn't mention AI
- No gaps inflated from categories the JD doesn't require

**Resume:**

```
Sarah Chen — Product Manager | San Francisco, CA

Product Manager II — Kova Analytics (B2B SaaS, Series B)
Jan 2022 – Present
- Owned the roadmap for Kova's core reporting product, serving 400+ enterprise accounts
- Defined and tracked 4 OKRs per quarter; hit 3/4 in Q1 2024, including reducing time-to-first-report from 14 days to 3 days (78% improvement)
- Led prioritization using RICE scoring across 60+ backlog items; presented tradeoff rationale to VP of Product in monthly roadmap reviews
- Designed and ran 12 A/B tests in 2023 using Optimizely; increased dashboard activation rate by 22%
- Self-serve SQL queries in Snowflake; used Amplitude for funnel analysis and retention cohorts
- Partnered with engineering (8 engineers), design (2 designers), and data team to ship 4 major features per quarter; resolved a 6-week engineering vs. design conflict by proposing a phased rollout both teams accepted
- Conducted 20+ customer interviews per quarter; translated findings into 3 major product pivots in 2022–2023
- Wrote PRDs and product briefs; engineering leads described docs as "act-on-without-follow-up-meeting" quality

Product Manager — Loxo Software (HR tech, seed stage)
Jun 2020 – Dec 2021
- Built the initial job matching feature from zero to 1,200 active users in 6 months
- Defined KPIs (match acceptance rate, time-to-place) and reported weekly to the CEO
- Ran weekly user interviews with recruiters; directly incorporated feedback into sprint planning

Skills: SQL, Amplitude, Optimizely, Mixpanel, Figma, JIRA
```

**JD:**

```
Nexus Cloud — Product Manager II

Own our customer analytics product. Responsibilities:
- Define and own the roadmap for the analytics surface, including prioritization and stakeholder communication
- Partner with engineering (10 engineers), design, and data to ship high-quality features on a quarterly cadence
- Define and track KPIs; use data to drive every major decision
- Run A/B tests and experiments to validate hypotheses before full builds
- Conduct user research with enterprise customers to understand pain points
- Write clear PRDs and product specs that engineering can act on without follow-up

Requirements: 3+ years PM in B2B SaaS; strong data fluency (SQL or BI tools);
experimentation platform experience (Optimizely, Statsig, or similar); excellent written communication
```

**Quiz answers:**
```
job_search_stage: active
biggest_challenge: not_getting_interviews
pm_level: mid
ai_skill_level: comfortable_with_basics
ai_goal: use_ai_for_work
```

**Pass criteria:**
- `jd_level`: "mid_level"
- `product_strategy_execution`, `data_fluency_analytics`, `cross_functional_collaboration`, `communication_influence`, `discovery_user_empathy`: all `jd_required: true`; none should be "gap"
- `ai_tool_fluency`, `ai_product_expertise`: `jd_required: false`, `match_level: "ambiguous"`
- `ai_assessment.required_tier`: "not_required"; `user_level_match`: "not_applicable"
- `gaps.items`: empty or length 0
- `fit_summary.narrative`: must reference specific evidence — A/B test numbers, SQL mention, customer interview cadence, or PRD quality comment; NOT generic

---

### TC-02 — Gap-Heavy, Early PM Against Senior JD

**Scenario type:** Gap detection — validates that real gaps are caught, severity is calibrated correctly, and the learning path prioritizes by impact

**What's being tested:**
- `match_level: "gap"` applied when JD requires a category with no resume evidence
- `severity: "significant"` vs. "moderate" calibrated correctly
- Level calibration: execution-only evidence ≠ "strong" or even "ambiguous" for a senior JD requiring strategic ownership
- `learning_path` prioritizes by impact (high-weight significant gaps first)

**Resume:**

```
Marcus Webb — Product Manager | Austin, TX

Product Manager — RetailPro (e-commerce, 50 employees)
Mar 2022 – Present
- Worked with engineering and design to ship new checkout features and bug fixes
- Attended weekly cross-functional syncs; wrote user stories and acceptance criteria
- Helped create the product roadmap based on input from CEO and sales team
- Analyzed customer support tickets to identify top feature requests
- Worked in an Agile environment with 2-week sprints

Associate Product Manager — CloudBase Inc. (SaaS startup, acquired)
Jul 2020 – Feb 2022
- Supported the senior PM with requirements gathering and documentation
- Organized user feedback from support tickets and Intercom conversations
- Created wireframes in Figma based on user feedback

Skills: JIRA, Confluence, Figma, Google Analytics (basic)
```

**JD:**

```
Meridian Financial — Senior Product Manager, Data Platform

Lead our internal data platform serving 4M+ users and 200+ internal analysts.
- Define the 3-year vision and roadmap for our data platform, aligned to company strategy
- Partner with engineering leadership on architecture decisions and build/buy/configure tradeoffs
- Design and own the experimentation program at scale; SQL required — you pull your own analysis
- Mentor and develop 2 junior PMs on the data platform team
- Navigate alignment across engineering, data science, compliance, and finance
- Translate platform capabilities into value narratives for executive leadership

Requirements: 6+ years PM experience, 2+ years Senior PM; SQL required; experimentation
program experience; proven PM mentoring track record; financial data or regulated industry
experience a plus
```

**Quiz answers:**
```
job_search_stage: active
biggest_challenge: unsure_of_gaps
pm_level: early
ai_skill_level: just_starting
ai_goal: use_ai_for_work
```

**Pass criteria:**
- `jd_level`: "senior" — inferred from JD, not from `quiz.pm_level`
- `data_fluency_analytics`: `jd_required: true`, `match_level: "gap"` (no SQL, no experiments, basic GA only)
- `leadership_strategic_thinking`: `jd_required: true`, `match_level: "gap"` (no vision-setting, no mentoring, no business metrics)
- `product_strategy_execution`: `match_level: "ambiguous"` at best — "helped create the roadmap" is not roadmap ownership at senior depth
- Both gap items: `severity: "significant"`
- `learning_path.items[0]`: one of the two significant gaps, not a minor category
- `fit_summary.narrative`: does not soften the gaps; names at least one specific missing skill

---

### TC-03 — Vague Resume, Inference Rule 2

**Scenario type:** Edge case — validates that PM buzzwords without concrete evidence do not inflate `match_level` to "strong"

**What's being tested:**
- Inference rule 2: vague language without specifics → ambiguous, not strong
- A resume full of correct PM terminology but no named tools, numbers, or described outcomes should score mostly "ambiguous"
- `ambiguous_areas` explanations identify what specific evidence is missing, not just "add more detail"

**Resume:**

```
Jordan Kim — Product Manager | New York, NY

Product Manager — TechCorp (SaaS, ~300 employees)
Jan 2021 – Present
- Led cross-functional teams to deliver impactful product initiatives on time
- Data-driven approach to product decisions; regularly analyzed key metrics to drive growth
- Collaborated with stakeholders across engineering, design, and marketing
- Drove strategic product roadmap based on user research and market analysis
- Improved key performance indicators through experimentation and iteration
- Strong communicator — presented product vision to leadership and aligned teams around strategy
- Passionate about user experience; regularly incorporated customer feedback into product decisions

Product Manager — StartupXYZ
Jun 2019 – Dec 2020
- Owned product roadmap and delivered features across multiple work streams
- Worked closely with engineering and design in an Agile environment
- Managed stakeholder relationships and kept teams aligned on priorities
```

**JD:**

```
Prism Health — Product Manager, Patient App

Own our patient-facing mobile product.
- Own and prioritize the roadmap for our patient app (iOS + Android)
- Partner with engineering, design, and clinical teams to ship high-quality features
- Use data to drive decisions — define KPIs, track outcomes, run experiments
- Conduct user research with patients to understand pain points
- Communicate clearly through PRDs and stakeholder updates

Requirements: 3+ years PM; strong analytical skills and comfort with product analytics;
mobile product experience preferred
```

**Quiz answers:**
```
job_search_stage: one_to_three_months
biggest_challenge: not_advancing_in_interviews
pm_level: mid
ai_skill_level: comfortable_with_basics
ai_goal: use_ai_for_work
```

**Pass criteria:**
- No category should be `match_level: "strong"` — there is no concrete evidence for any category
- All `jd_required: true` categories should be "ambiguous"
- `ambiguous_areas.items`: must include `data_fluency_analytics` and `product_strategy_execution`; explanations must name what's absent (e.g., "no analytics tools named, no experiments described, no quantified outcomes") — not generic "add more detail"
- `resume_recommendations.items`: must include at least one before/after showing how to strengthen a specific vague bullet
- `fit_summary.narrative`: must flag the evidence gap; should not describe this as a strong match

---

### TC-04 — Non-AI JD, Inference Rule 3

**Scenario type:** Edge case — validates that AI categories are not penalized when the JD doesn't require them, even when the resume has strong AI evidence

**What's being tested:**
- Inference rule 3: never claim a gap for a skill the JD doesn't require
- `ai_tool_fluency` and `ai_product_expertise`: `jd_required: false`, `match_level: "ambiguous"` regardless of resume evidence
- `ai_assessment.required_tier`: "not_required"; `user_level_match`: "not_applicable"
- The actual gap in this case is domain (retail/hardware) — the report should flag that, not AI

**Resume:**

```
Priya Nair — Senior Product Manager | Seattle, WA

Senior Product Manager — Carto Maps (B2C mapping, 2.4M MAU)
Apr 2021 – Present
- Owned the roadmap for Carto's mobile app; shipped 8 major features in 2023
- Defined and tracked DAU, D1/D7/D30 retention, and session depth KPIs; reported to board quarterly
- Led A/B testing program — 6 concurrent experiments at peak; reduced onboarding drop-off by 34%
- Self-serve SQL in BigQuery; built 4 recurring Looker dashboards for the team
- Conducted 15 user interviews per quarter; ran usability tests with recruited participants
- Aligned 3 engineering teams (18 engineers) across web, mobile, and data on a unified roadmap
- Presented product strategy to executive team and board; wrote strategy memos used as company-wide planning inputs
- Uses Claude and ChatGPT daily for competitive research synthesis, interview transcript analysis, and PRD first drafts
- Used Cursor and v0 to prototype a feature concept independently and hand spec to engineering

Product Manager — BlueCart (grocery delivery, B2C)
Aug 2018 – Mar 2021
- Owned checkout and cart; increased conversion 18% through 12 A/B tests
- Coached 2 junior PMs on experiment design
```

**JD:**

```
Meadowbrook Retail Group — Senior Product Manager, In-Store Experience

Lead our in-store digital experience product (kiosks, digital signage, associate apps).
- Define the multi-year roadmap for in-store digital touchpoints
- Collaborate with store operations, IT, and hardware vendors to ship and maintain in-store systems
- Use customer and in-store analytics to understand behavior and drive improvements
- Run controlled pilot experiments in select stores before broad rollout
- Communicate product strategy to retail leadership and regional operations managers

Requirements: 5+ years PM; experience with physical or retail environments preferred;
strong stakeholder management with non-technical business partners; comfortable with data
and reporting tools. No AI experience required.
```

**Quiz answers:**
```
job_search_stage: active
biggest_challenge: know_gaps_not_how_to_close
pm_level: senior
ai_skill_level: advanced
ai_goal: all_of_the_above
```

**Pass criteria:**
- `ai_tool_fluency`: `jd_required: false`, `match_level: "ambiguous"` — strong resume evidence does not override the jd_required rule
- `ai_product_expertise`: `jd_required: false`, `match_level: "ambiguous"`
- `ai_assessment.required_tier`: "not_required"
- `ai_assessment.user_level_match`: "not_applicable"
- `gaps.items`: no items with `category_id` of "ai_tool_fluency" or "ai_product_expertise"
- `technical_acumen`: `jd_required: true` (JD names hardware, IT, vendor systems); `match_level: "ambiguous"` or "gap" (resume is software-only, no hardware or retail domain)
- `fit_summary.narrative`: mentions the domain or hardware gap; does NOT mention AI as a gap

---

### TC-05 — Level Mismatch, Mid Resume Against Senior JD

**Scenario type:** Level calibration — validates that evidence appropriate for a mid-level role doesn't pass as strong for a senior role

**What's being tested:**
- Feature-area roadmap ownership ≠ "strong" for a JD requiring multi-team pillar strategy
- `jd_level` is inferred from the JD, not from `quiz.pm_level`
- `leadership_strategic_thinking` correctly scored "gap" when no mentoring, vision, or business metrics exist
- Category score mix should imply a borderline outcome (API computes the score, but the pattern of ambiguous + gap should reflect the level mismatch)

**Resume:**

```
Alex Torres — Product Manager | Chicago, IL

Product Manager — Beacon Insurance (insurtech, ~600 employees)
Feb 2022 – Present
- Owned roadmap for the claims intake product (one of 5 product areas within the claims suite)
- Defined KPIs for the claims intake flow: submission rate, abandonment rate, processing time; tracked weekly
- Used Mixpanel for funnel analysis; ran 3 A/B tests on intake form redesign using Optimizely; reduced abandonment by 28%
- Partnered with engineering (5 engineers), design, legal, and compliance to ship FNOL redesign
- Interviewed 8–10 claimants per quarter; synthesized findings into feature requirements
- Wrote PRDs for all major features; led sprint planning and backlog grooming

Product Manager — Fable Tech (SaaS, 80 employees)
Aug 2020 – Jan 2022
- Supported roadmap for core product alongside a senior PM; owned smaller features independently
- Wrote user stories and acceptance criteria; conducted user interviews on behalf of the senior PM
```

**JD:**

```
Northstar Payments — Senior Product Manager, Payments Platform

Own our payments platform strategy spanning 3 engineering teams.
- Define the 2-year product vision and roadmap for the payments platform
- Develop and mentor 1–2 junior and mid-level PMs on the team
- Set and own platform-level KPIs; translate platform performance to P&L impact for executive reporting
- Navigate alignment across engineering, compliance, finance, and 3rd-party payment processors
- Lead cross-team discovery and experimentation strategy for the full payments surface
- Build business cases for major platform investments; present to VP and C-suite

Requirements: 6+ years PM, 2+ years in a senior role; proven multi-team roadmap ownership;
PM mentoring experience; strong business acumen (P&L, unit economics, interchange rate,
authorization rate, chargeback rate); fintech domain knowledge strongly preferred
```

**Quiz answers:**
```
job_search_stage: active
biggest_challenge: not_advancing_in_interviews
pm_level: mid
ai_skill_level: comfortable_with_basics
ai_goal: use_ai_for_work
```

**Pass criteria:**
- `jd_level`: "senior" — inferred from JD; do not use `quiz.pm_level: mid`
- `product_strategy_execution`: `match_level: "ambiguous"` — single-product-area ownership ≠ strong for multi-team pillar strategy at senior depth
- `leadership_strategic_thinking`: `jd_required: true`, `match_level: "gap"`, `severity: "significant"` — no mentoring, no P&L, no vision-setting
- `data_fluency_analytics`: `match_level: "ambiguous"` — Mixpanel + 3 A/B tests at feature level ≠ platform-level measurement strategy
- `technical_acumen`: `jd_required: true`; likely "ambiguous" or "gap" — insurance domain ≠ fintech, no architecture discussion
- `fit_summary.narrative`: does not describe this as a strong match; names the scope or strategy gap specifically

---

## Notes for Future Iterations

- TC-03 (vague resume) is the highest-signal eval for prompt quality. If any category comes back "strong," inference rule 2 is not holding — first thing to check.
- Add a sparse/one-page resume test to validate that ambiguous is applied correctly and the tool doesn't over-infer from job titles alone.
- If `user_level_match` is inconsistent across runs, add an explicit mapping table to the system prompt (e.g., "just_starting" → "below" for required_tier "ai_tools").
- The 50 real JDs from the taxonomy research sample are available for a more rigorous v2 eval once the prompt is stable.

Last updated: 2026-06-05
