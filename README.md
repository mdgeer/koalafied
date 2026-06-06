# Koalafied

**AI-powered PM career intelligence tool.**

Paste your resume and a job description, answer 5 quick questions about where you are in your search — and get back a personalized gap report: what's a strong match, what's ambiguous, what's missing, and a concrete 30-day plan to close the gaps.

**Live:** [mattgeer.com/koalafied](https://mattgeer.com/koalafied)

---

## What it does

1. User pastes resume + job description, enters email, answers 5-question quiz
2. API validates input, creates a job in Redis, returns `job_id` immediately
3. Background job calls Claude with the full PM skill taxonomy as system prompt
4. Claude returns a structured 10-section JSON report
5. API computes scores, stores report in Redis (30-day TTL), marks job complete
6. Browser polls for completion and redirects to the report page
7. Kit sends a backup email with the report link

**10 report sections:** Fit summary · Strengths · Ambiguous areas · Gaps · AI assessment · Learning path · Resources · Portfolio projects · Resume recommendations · 30-day action plan

---

## Stack

| Layer | Choice |
|---|---|
| Frontend + API | Astro SSR (lives inside [mattgeer.com](https://mattgeer.com)) |
| AI | Claude API — `claude-sonnet-4-6`, temp 0.3, 16K max tokens |
| Job queue / report storage | Upstash Redis |
| Email + list | Kit (ConvertKit v4 API) |
| Deployment | Hostinger VPS, Docker, Traefik |

---

## How the scoring works

9 skill categories, 100 total weight points. Claude evaluates each category against the resume + JD and returns `strong`, `ambiguous`, or `gap`. The API route computes:

```
weighted_contribution = category_weight × match_value
overall_score = sum(weighted_contributions) / 100
```

Match values: `strong = 1.0`, `ambiguous = 0.5`, `gap = 0`

Score tiers: `strong_fit ≥ 70` · `borderline 50–69` · `not_ready < 50`

Full taxonomy: [`schema/skill-taxonomy.json`](schema/skill-taxonomy.json)

---

## File structure

```
src/
├── lib/
│   ├── claude.ts          # Anthropic client, prompt builder, retry logic
│   ├── kit.ts             # Kit v4 subscriber creation, quiz tagging, report email
│   ├── rate-limit.ts      # Upstash rate limiting (3/hour, 6/day per IP)
│   ├── redis.ts           # Redis client, key helpers, TTL constants
│   ├── sanitize.ts        # Input sanitization for resume/JD text and email
│   ├── scoring.ts         # Score computation and tier assignment
│   └── types.ts           # Shared TypeScript types
├── api/
│   ├── analyze.ts         # POST /api/analyze — validates, creates job, fires async work
│   └── status/[job_id].ts # GET /api/status/[job_id] — polls job completion
├── pages/
│   └── koalafied/
│       ├── index.astro           # Form + quiz page
│       └── report/[id].astro     # Report page — reads from Redis, renders 10 sections
└── components/
    ├── KoalafiedFlow.tsx  # React component: form → processing screen → redirect
    └── StarRating.tsx     # Score visualization component

schema/
├── skill-taxonomy.json    # 9 categories, weights, depth levels, resume signals
├── report-schema.json     # Full report structure with [Claude] vs [Computed] annotations
└── resources.js           # Approved resource key → URL mapping

docs/
├── architecture.md        # System design, stack rationale, async job flow
├── decisions.md           # A-vs-B decision log (why each choice was made)
├── project-overview.md    # Full product vision, monetization, distribution plan
└── eval-matrix.md         # 5 test cases for evaluating report quality

system-prompt.txt          # Full Claude system prompt (taxonomy + schema + rules)
```

---

## Running locally

This tool lives inside a larger Astro site. To run it standalone you'd need an Astro project with SSR enabled. The source files here are the complete implementation — drop them into an Astro SSR project and wire up the env vars.

**Required env vars** (see [`.env.example`](.env.example)):
- `ANTHROPIC_API_KEY`
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `KIT_API_KEY` + `KIT_FORM_ID`
- `KOALAFIED_ADMIN_KEY` (bypass rate limits during testing)

**Kit setup gotchas:**
- Use `X-Kit-Api-Key` header — not `Authorization: Bearer`
- Custom fields use `fields` in the API body — not `custom_fields`
- Create a `report_url` custom field (Text type) before testing

---

## Built by

[Matt Geer](https://mattgeer.com) — PM by day, builder on the side. Writing about AI × automation × product at [mattgeer.com](https://mattgeer.com) and [@mattdgeer](https://x.com/ItsMattGeer).
