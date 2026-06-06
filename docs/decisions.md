# Koalafied — Decision Log

---

## 2026-06-03

### Name: Koalafied
**Options considered:** Qualified, Calibrate, Role Ready, Scope Check, Koalafied
**Decision:** Koalafied
**Why:** Most memorable and distinctive in the space. "Are you Koalafied?" writes itself as a tagline. Mascot (koala) built in. The lightness makes a stressful process more approachable — differentiator in a dry space. .com unavailable but irrelevant while tool lives on mattgeer.com.
**Note:** Scope Check parked as a potentially better name for a different PM tool (scope management).

---

## 2026-06-06

### Kit API v4 auth header
**Issue discovered during testing:** Kit v4 API rejects `Authorization: Bearer <token>` with 401. The correct header is `X-Kit-Api-Key: <token>`.
**Evidence:** All three PAT tokens failed with `Bearer` auth; immediately succeeded when switched to `X-Kit-Api-Key`. Confirmed by checking quiz-component repo which already uses the correct header.
**Applied to:** `src/lib/kit.ts` — `kitFetch()` function.
**Note:** If debugging Kit 401 errors in future, check header name first.

### Kit API v4 custom fields parameter name
**Issue discovered during testing:** Custom fields on subscriber create/update must use `fields`, not `custom_fields`. Using `custom_fields` silently succeeds (200) but the field is not saved.
**Applied to:** `src/lib/kit.ts` — `subscribeWithReport()` body.
**Note:** Confirmed against quiz-component which uses `fields` correctly.

---

### Location: mattgeer.com/koalafied
**Options considered:** Standalone domain, mattgeer.com subdirectory
**Decision:** Subdirectory on mattgeer.com to start
**Why:** Concentrates traffic to main property, grows Kit list directly, no additional infrastructure needed. Migrate to own domain if/when traffic warrants.

---

### Business model: Free tool, email gate for report
**Options considered:** Paid from day one, free with ads, freemium
**Decision:** Free with email opt-in to receive report
**Why:** Lower friction for distribution and word of mouth. Email gate builds Kit list with high-intent subscribers (they gave you their resume + a real JD). Monetize through affiliate links embedded in report. Go paid only if users demonstrate strong enough demand.

---

### Architecture: Stateless first
**Options considered:** Full SaaS app with accounts from day one, stateless form
**Decision:** Stateless — form input → Claude API → Kit email → no stored data
**Why:** Simpler build, lower security surface area, faster to validate core value. Add accounts only after users demonstrate they want to save/revisit reports.

---

### Open source: Yes
**Decision:** Open source on GitHub
**Why:** Demonstrates AI integration skills for Matt's resume and personal brand. Minimal competitive risk — moat is prompt quality, affiliate relationships, and distribution, not the code structure. Prompt logic kept in environment variables.

---

### AI: Claude API
**Decision:** claude-sonnet-4-6 (or latest Sonnet) for report generation
**Why:** Matt already works with Claude. Real API integration = legitimate "built with AI" resume and portfolio claim. Stateless call — no data persistence required.

---

### PM-specific focus with AI skills layer
**Decision:** PM audience to start, with AI skills assessment baked into quiz and report
**Why:** Matches Matt's audience and personal brand. PM-specific skill taxonomies, resources, and project recommendations are more useful than generic. AI skills increasingly appear in PM JDs — cross-referencing stated AI level vs. JD requirements is a differentiating insight no other tool offers.

---

### Quiz: 5 questions before report delivery
**Decision:** 5 questions asked after email entry, before report is sent
**Why:** Post-email timing maximizes completion rate (user is motivated, hasn't received value yet). Answers both personalize the report and create Kit tags for segmented follow-up sequences. 5 is the ceiling — they're waiting for a report, not filling out a form.

---

### Report delivery: hosted HTML page + simple link email
**Options considered:** HTML email (full report), PDF attachment, hosted HTML page with email link
**Decision:** Hosted report page at `mattgeer.com/koalafied/report/[unique-id]` with a simple link-only Kit email
**Why:** HTML email rendering is unreliable across clients (Outlook, Apple Mail disable images, no modern CSS). Hosted page gives full design control, is shareable (distribution bonus), and supports browser print-to-PDF with no extra library. Email is bulletproof because it's just a button link.
**Storage:** Report HTML saved with unique ID + 30-day TTL (Vercel KV or similar). Lightweight, no full database needed.

---

### Form page design: new template, not current blog theme
**Decision:** New Astro page template — brand colors and typography but tool/landing page layout, not blog layout
**Why:** Current mattgeer.com theme is built for reading content, not tool conversion. Koalafied needs a centered, focused, conversion-oriented layout. Should look like a product, not a blog post. Needs to look good but doesn't need to be pixel-perfect at launch.

---

## 2026-06-04

### AI Layer: Model Selection
**Decision:** claude-sonnet-4-6 for MVP  
**Why:** ~5× cheaper than Opus (~$0.05–0.08/report vs ~$0.25–0.40). Cost matters when the tool is free. Latency matters less because report delivery is via email, not instant.  
**Upgrade path:** Build a pre-launch eval matrix defining what a good report looks like. Run 10+ post-launch reports against it. Upgrade specific sections to Opus if Sonnet quality is weak there — don't pay for Opus until Sonnet proves insufficient.  
**Note:** Prompt caching enabled from day one — caches the system prompt, reducing per-report input costs ~60–70% at scale.

---

### AI Layer: Scoring Methodology
**Decision:** Formula-computed score from a weighted PM skill taxonomy + tier label  
**How it works:** Pull 20–30 real PM JDs pre-build. Extract common skill requirements. Assign weights by frequency/importance. Claude maps the target JD + resume to this taxonomy. Score = `sum(weight × match_level) / max_possible × 100`. Output: single number (0–100) + tier (Strong Fit / Borderline / Not Ready).  
**Pre-build deliverable required:** Taxonomy + weights must exist before the prompt can be written.  
**Why:** Raw Claude-generated scores are inconsistent and ungrounded. A taxonomy anchors scoring in something defensible and reproducible.  
**Disclaimer on report:** "This score reflects resume-to-JD alignment only — not likelihood of getting hired. It's a directional data point, not a verdict."  
**Ambiguous items:** Still receive ranked recommendations by likely impact. Ambiguous ≠ gap ≠ strong — all three categories get actionable next steps.

---

### AI Layer: Claude Inference Rules
**Decision:** Explicit numbered constraint rules baked into the system prompt  
**Core rules:**
1. Only evaluate what is explicitly written in the resume and JD — no inferences from company names, schools, or background
2. Vague resume language without specific examples or outcomes → classify as AMBIGUOUS
3. Never claim a gap exists if the JD does not explicitly require that skill
4. Never predict hiring likelihood — score measures text alignment only
5. Never fabricate course names, instructors, or resource URLs  
**Note:** Constraint list to be expanded during pre-launch testing as edge cases surface.

---

### AI Layer: Prompt Design
**Options considered:** One-pass JSON (A), two-pass extraction + synthesis (B), section-by-section (C)  
**Decision:** Option A — one API call, full 10-section report as structured JSON  
**Why:** Simplest and cheapest. Pre-launch testing will surface fragility before shipping to prod.  
**Upgrade trigger:** If JSON failures or hallucinations are frequent in pre-launch testing → migrate to Option B.  
**Ruled out:** Option C (section-by-section) — orchestration cost and complexity not justified at any stage.  
**Format:** Full JSON schema in system prompt. Claude returns raw JSON only — no preamble, no markdown code block.

---

### AI Layer: Consistency Controls
**Decision:**
- Temperature: 0.3
- max_tokens: 4,000
- Retry: parse JSON → if fail, retry once with explicit JSON reminder → if fail twice, return error to user
- Pre-store validation: all 10 sections present, score is integer 0–100, required arrays non-empty

---

### AI Layer: Pre-Launch Evals
**Decision:** Build a scoring matrix defining what a "good" report looks like before any testing begins. Run enough test pairs to dial in the matrix — budget ~$5–10 total on API costs.  
**Required cases:** Diverse resume/JD pairs, one clearly weak candidate, one clearly strong candidate, 1+ prompt injection attempt.  
**Post-launch quality proxies:** affiliate click rate + Kit unsubscribe rate. No eval infrastructure needed now — nothing to architect that would block V2.

---

### AI Layer: Cost Management
**Decision:** Prompt caching from day one. Cost is not a business problem at MVP volumes.  
**Threshold logic:** If volume trends up, introduce a paid tier before costs become unsustainable — the trend is visible well before it's a crisis. At $0.05/report (cached), 500 reports/month = ~$10–20.

---

### AI Layer: Failure Handling
**Decision:**
- Failed report (Claude error, JSON validation failure, timeout) → tag Kit subscriber with `report_failed` → routes to a separate sequence, not standard nurture
- Matt receives an email notification on each failure for potential personal follow-up
- User-facing message: "Something went wrong. Please try again — your email is saved and won't be lost."
- Kit subscriber is never lost even when report generation fails

---

### Data: Raw Input Storage
**Options considered:** Store analysis only (A), store analysis + raw resume/JD (B)  
**Decision:** Option A — store analysis only. Raw resume and JD are never persisted.  
**Why:** Storing raw inputs requires a proper database and user account model to be meaningful (re-run, versioning, history). That's V2 complexity. For MVP, the analysis alone is everything needed to render the report. Cleaner privacy surface area. Consistent with stateless-first architecture.  
**V2 trigger:** User accounts → persistent storage (Supabase) → stored resumes → multi-JD comparison → re-run. Don't build this until the tool proves it can generate revenue.

---

### Data: Report JSON Schema
**Decision:** Structured JSON with 10 report sections + metadata + scoring + quiz answers. Analysis only — raw resume and JD are never stored.  
**Top-level fields:** `id` (UUID), `version`, `generated_at`, `expires_at`, `metadata` (role_title, company_name), `scoring` (overall_score, tier, strong_count, ambiguous_count, gap_count), `quiz` (all 5 answers as enum strings), `sections` (10 report sections)  
**Schema is designed for Supabase migration in V2** — structured JSON with typed fields, not a blob.  
**File:** `projects/koalafied/report-schema.json` (v1.0, complete)

**Resources / affiliate links:** Claude recommends resources using a `resource_key`, not a raw URL. A local lookup file (`resources.js`) maps keys → affiliate URLs. URLs are resolved at render time, not stored in the schema.  
**Why render-time resolution:** One edit to `resources.js` updates all active reports immediately.  
**File:** `projects/koalafied/resources.js` — starter list with placeholder URLs. Matt will backfill with real affiliate deals during the build.

---

### Schema: Two-Phase Construction
**Decision:** Claude outputs judgment fields only. API route computes all math before storing.  
**Claude outputs:** `match_level` per category + all narrative section content  
**API route computes and adds:** `weighted_contribution`, `overall_score`, `tier`, `strong_count`, `ambiguous_count`, `gap_count`  
**Why:** The original scoring decision said "raw Claude-generated scores are inconsistent and ungrounded." Applying that same principle to schema design: Claude is good at judgments, code is good at math. Separating them keeps scoring deterministic and protects against LLM arithmetic errors.

---

### Schema: Category Scores Always 9 Items
**Decision:** `category_scores` always includes all 9 taxonomy categories, not just JD-required ones.  
**Non-required categories:** `jd_required: false`, `match_level` forced to `ambiguous`.  
**Why:** Enables future analytics on skill gaps even when the JD doesn't require them. A PM who doesn't demonstrate data fluency on a JD that didn't ask for it is still useful signal for course development.

---

### Schema: AI Tier Enum
**Decision:** AI assessment uses a 3-value hierarchical enum: `not_required` / `ai_tools` / `ai_product`.  
**Ruled out:** Separate independent flags for each AI category; a 4-value enum (had previously split product management and building).  
**Why:** The tiers are hierarchical, not independent. `ai_product` (managing/shipping AI features) implies `ai_tools` (using AI for PM work) by definition — you can't ship AI products without using AI tools. No realistic case where someone has AI product expertise but not tool fluency. One callout box in Section 05, narrative covers both dimensions when `ai_product` is required.

---

### Schema: Score Tier Thresholds (Preliminary)
**Decision:** `strong_fit` ≥70, `borderline` 50–69, `not_ready` <50.  
**Why 50 as the floor:** 50 = all-ambiguous baseline (every category scored ambiguous = 50 points). Below 50 means gaps outweigh the no-evidence default — meaningful signal of unreadiness.  
**Note:** Preliminary — finalize during pre-launch eval testing. Easy to adjust in application constants without schema changes.

---

### Data: PII Map
**What we collect and where it lives:**
- **Email** → Kit. Stored until unsubscribe.
- **Resume content** → Claude API (processed only). Never stored anywhere.
- **Job description** → Claude API (processed only). Never stored anywhere.
- **Quiz answers** → Kit (as subscriber tags, tied to email) + Upstash (in report JSON, tied to UUID only). Kit: until unsubscribe. Upstash: 30-day TTL.
- **Report analysis** → Upstash (UUID-keyed). 30-day TTL.
- **Report UUID** → Kit (embedded in the email link). Until unsubscribe.

**Kit profile per subscriber:** email + job_search_stage + pm_level + ai_level + biggest_challenge + ai_goals. Real profile data — disclosed in privacy policy.

**Anthropic disclosure:** Resume and JD are sent to Anthropic's API for processing. Not stored by Koalafied or Anthropic. Not used for AI training (per Anthropic API ToS). Disclosed via tooltip on the form page (ℹ icon near submit button) + full privacy policy. Tooltip is plain-language, no legal jargon, links to privacy policy.

---

### Data: Retention + Deletion Policy
**Report TTL:** 30 days in Upstash — automatic deletion, no manual action required. Expired report links return 404.  
**Kit records:** Persist until unsubscribe or deletion. Quiz tags persist with the record.

**Deletion on request:** Manual (Option A). User emails a dedicated address or submits a contact form — not Matt's personal email. Specific address or form TBD before launch. Record deleted from Kit manually within a reasonable timeframe.

**Proactive unsubscribe cleanup:** Weekly scheduled process (via Kit MCP) to find unsubscribed records and fully delete them. Full deletion is appropriate here because re-adding requires a deliberate, multi-step action (paste resume + JD + email + 5-question quiz) — accidental re-add is not a realistic risk.  
**Privacy policy language:** "If you submit the form after requesting deletion, your submission constitutes a fresh opt-in." This covers re-adds cleanly under CAN-SPAM and GDPR — re-submission is affirmative consent.  
**Analytics note:** Kit provides aggregate unsubscribe stats without needing individual records. No reason to retain full records for analytics.  
**Note:** Build as a scheduled routine (Claude Code + Kit MCP) — add to backlog.

---

### Security: Rate Limiting
**Decision:** 3 submissions per IP per hour, 6 per day  
**Why:** Free tool — keeping limits tight prevents cost abuse from the Claude API. Real users retrying after an error won't hit 3/hour. 6/day is enough for legitimate use; if someone's getting that much value, the path forward is monetization not more free runs.  
**Implementation:** Upstash Redis rate limiting library (already in the stack) applied as Astro middleware on `/api/analyze`. No extra infrastructure.

---

### Security: Prompt Injection
**Decision:** Two-layer defense — prompt structure + input sanitization. No pattern-check layer for MVP.  
**Layer 1 — Prompt structure:** User content is clearly delimited (triple quotes). System prompt explicitly instructs Claude to ignore any instructions embedded in the RESUME or JOB DESCRIPTION fields.  
**Layer 2 — Input sanitization:** Strip HTML. Cap each field at 15,000 characters. Applied before content reaches Claude.  
**Open source + env var:** System prompt content lives in an environment variable — never in the repo. Code structure is visible; prompt text is not. Partial protection, sufficient for MVP.  
**Scope of concern:** Self-gaming (user tricks the tool into a high score) is a user problem, not a system problem. The two-layer defense targets system-harming attacks: liability-creating outputs, prompt extraction, behavior that affects other users. Claude's content policies provide a floor regardless of injection.

---

### Security: API Key Management
**Decision:** `.env` file on the VPS with real keys. Never committed to the repo. `.env.example` committed with placeholder values so contributors know what's needed.  
**Keys in scope:** `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `KIT_API_KEY`  
**`.gitignore`:** `.env` and `.env.*` explicitly excluded — confirmed before first commit.  
**Same pattern already in use** on the Quiz App with Kit. No new infrastructure needed.

---

### Security: Report URL Security
**Decision:** UUID is the only access mechanism — by design. Reports are shareable. Privacy policy notes: "Your report link is private by default. Anyone you share it with can view your report."

**Expired report handling:** Custom expiry page (not a generic 404). On-brand, acknowledges the report expired, prompts the user to run a new analysis. Warm lead — someone whose report expired already knows the tool delivers value. This page is a conversion opportunity, especially before a paid tier or account state exists.

**Search engine indexing:** Report pages must not be indexed.  
- `robots.txt`: `Disallow: /koalafied/report/`  
- Report page template: `<meta name="robots" content="noindex, nofollow">`  
**Why:** Individual report pages contain personal career analysis data and have no SEO value. Only `/koalafied` (the form page) should rank. Belt and suspenders — both mechanisms applied.

---

### Performance: Processing Architecture
**Options considered:** Background job with polling (A), synchronous with extended timeout (B)  
**Decision:** Option A — background job with client polling  
**How it works:** Form submits → `/api/analyze` immediately returns a `job_id` → client polls `/api/status/[job_id]` every 3–4 seconds → on completion, client redirects to report page. Heavy work (Claude + Upstash + Kit) runs in the background.  
**Why:** Synchronous requests held open for 60+ seconds are fragile — mobile networks drop them, users switching tabs lose the session, and Nginx timeouts kill the connection before the work finishes. Polling is bulletproof and enables richer UX (status message updates during processing). Email delivery means users who close the tab still receive their report.  
**Job status storage:** Temporary Upstash key (`job:[job_id]`) with a short TTL (5 minutes). Stores status: `pending` → `complete` (with report UUID) or `failed`.

---

### Performance: Processing UX
**Options considered:** Static spinner (A), stage-based status messages (B), fake progress bar (C)  
**Decision:** Option B — stage-based status messages that reflect what's actually happening  
**Stages:**
1. "Analyzing your experience…" — Claude API call in progress
2. "Building your learning path…" — Claude returned, writing report
3. "Sending your report…" — Kit call in progress
4. "Done — opening your report" — redirect to report page  
**Why:** Accurate copy that reflects real system state. Perceived wait time drops when something is visibly changing. Consistent with the tool's overall tone — honest, direct, no fluff. Progress bar ruled out: can't map fake visual progress to real latency without lying to the user.  
**Copy update:** Processing screen copy to say "30–45 seconds" not "20–30 seconds" — under-promise on wait time.

---

### Performance: User Flow + Email Gate
**Confirmed flow:** Form (resume + JD + email) → quiz (5 questions, framed as personalization) → Claude starts on quiz submit → processing screen with stage messages → browser redirect to report page on completion + Kit email sent as backup.

**Email is required for MVP.** User gets the report both in-browser (via polling redirect) and via Kit email. Requiring email for the browser experience is justified since we're giving the report away there too.  
**Revisit trigger:** If report sharing/virality proves to be a meaningful distribution lever, reconsider making email optional for the browser experience. List building doesn't automatically trump virality — evaluate with data post-launch.

**Quiz framing:** Quiz is positioned as a personalization step, not a wait screen. Copy: "Answer 5 questions to personalize your report." Claude starts after quiz submit. Preserves report quality (quiz answers needed for AI skills section + level calibration).

**Processing screen:** 20–30 seconds after quiz completes. Stage messages already decided. Post-MVP: explore adding job search tips or useful content to fill this window — not an MVP priority.

---

### Performance: Mobile Experience
**Decision:** Mobile-responsive layout (mocks already are), but submission flow is not optimized for mobile at MVP. Primary use case is laptop/desktop — pasting a resume on a phone is not a realistic user behavior. Mobile matters most for the read-only report experience (sharing).  
**Post-launch:** Monitor mobile submission rate in analytics. Keep an eye on whether mobile users drop off at the form vs. completing.  
**V2+ input improvements (backlog):** Resume/JD file upload, Google Drive integration, paste-a-link for job descriptions. Keep MVP to plain text paste — simple, no dependencies.

---

### Error Handling: Claude Bad Output
**Sequence:** JSON parse fail → retry once with JSON reminder → if retry fails, job status set to `failed` → polling catches it → error state shown to user.  
**User-facing message:** "Something went wrong analyzing your resume. Your email was saved — please try submitting again."  
**Retry experience:** One-click "Try again" that pre-fills the form from browser session storage (resume, JD, quiz answers held in-tab until the tab closes). User doesn't have to re-paste anything — reduces abandonment on failure.  
**Kit:** Subscriber tagged `report_failed` → routed to failure sequence, not standard nurture. Matt notified by email.

---

### Error Handling: Upstash Unavailable
**Decision:** Retry the Upstash write once (2-second delay), then fail gracefully.  
**Why:** Transient failures resolve quickly — one retry catches most cases. If it fails twice, mark job failed and show the standard error screen. Do not send a degraded Kit email with the report embedded — HTML email rendering is unreliable and bypasses the report page design. A clean failure is better than a broken first impression.  
**Cost:** Worst case, user retries and Claude runs again (~$0.05). Acceptable.

---

### Error Handling: Kit Email Failure
**Decision:** Option C — show the report URL on the completion screen regardless of Kit status.  
**Copy on completion screen:** "Your report is ready — we also emailed it to you at: [email]." No "tried" language — confident and clean. User doesn't need to know about Kit internals.  
**Kit failure handling:** Email + report UUID stored in the Upstash job record (24-hour TTL). If Kit fails, Matt receives a failure notification with the email and UUID — enough to manually resend or investigate. No silent failures.  
**Why not auto-retry:** At MVP volume, manual retry is sufficient and keeps the error handling simple. Kit is reliable; this is an edge case.

---

### Analytics: Tracking Setup
**Decision:** GA4 as primary tracking tool. Custom analytics tracker running in parallel.  
**GA4:** Goal tracking + custom events (form submitted, quiz completed, affiliate clicks) + funnel reporting. Battle-tested for this use case — everything needed is built in. Needs to be added to mattgeer.com if not already installed.  
**Custom tracker:** Running alongside GA4 on the same pages. Produces side-by-side data for comparison — validates the custom tool against GA4 as a real-world test. Case study: "We tracked Koalafied with our own analytics tool and compared it to GA4."  
**Email funnel:** Kit native analytics + Kit MCP for open rates, click rates, unsubscribe rates. No extra setup needed.  
**Aggregation:** Agent or workflow to pull GA4 + Kit data into a single view post-launch. Not an MVP build — set up once there's data worth watching.

---

### Analytics: MVP Success Criteria
**Framing:** The process itself — planning, building, testing, open-sourcing — is the baseline win regardless of metrics. Resume, GitHub, case study, and content value are guaranteed outcomes. Metrics are signals to improve from, not pass/fail gates.

**Milestones (no timeframe — distribution-dependent):**
- 50–100 reports generated (volume for quality iteration)
- 70%+ overall completion rate (form start → report generated; quiz is the last step so this tracks full funnel completion; split out if quiz friction becomes a hypothesis)
- <15% Kit unsubscribe rate in first 48 hours (high early unsubscribes = report disappointed)
- 10%+ click rate on any recommended resource (affiliate link or not — measures whether recommendations are landing and helps calibrate copy and course matching)

**Qualitative signal — three mechanisms:**
1. **1–5 star rating on the report page** (above PDF download button) — in-context, low friction, gives quantitative read on report quality over time
2. **Day 3 Kit email** — "Did your report help? Hit reply and tell me one thing." Direct replies to Matt's inbox. One reply is worth ten star ratings.
3. **Personal calls with first cohort** — 3–5 conversations with early users surfaces what the report gets right, misses, and leaves unanswered. Standard early-stage PM validation.

**Note:** Welcome/onboarding Kit sequence to reduce early unsubscribes — plan in Room 8 (Affiliate & Monetization).

---

### Legal: Privacy Policy
**Decision:** Single site-wide privacy policy at `mattgeer.com/privacy`. No separate Koalafied-scoped policy.  
**Why:** GA4 is being added to the site for Koalafied and needs disclosure regardless. Custom analytics tracker should be mentioned. Kit is already in use for the newsletter. One policy covers everything; Koalafied-specific items are a section within it, not a separate document.

**Site-wide disclosures to include:**
- GA4 analytics (new — being added for Koalafied)
- Custom analytics tracker (privacy-forward but should be mentioned)
- Kit email collection and tagging

**Koalafied-specific section:**
- Resume and job description are processed by Anthropic's API and not stored by us or Anthropic
- Quiz answers stored in Kit as subscriber tags; report analysis stored in Upstash with 30-day TTL
- Anthropic tooltip on form page supplements the full privacy policy for in-context transparency

**Pre-launch:** Privacy policy page must exist at `/privacy` before Koalafied goes live. Link from footer of both form page and report page.

---

### Legal: Terms of Service
**Decision:** Single site-wide terms page at `mattgeer.com/terms`. Same rationale as the privacy policy — global rules apply globally. Any future tool, lead magnet, or list-building mechanism on the site operates under the same terms.  
**Key provisions:**
- Koalafied is an informational tool, not professional career counseling
- Scores and recommendations are text-analysis only — not hiring predictions
- Not liable for decisions made based on report content
- Recommended resources are selected for relevance — we haven't personally tested every product. Users should do their own research before purchasing.
- Submitting any form = consent to receive emails; re-submitting after deletion = fresh opt-in
- Tool can be changed or discontinued at any time  
**Pre-launch:** Must exist at `/terms` before Koalafied goes live. Linked from footer of form page and report page, alongside privacy policy.

---

### Legal: GDPR, CCPA, Cookies
**Decision:** No cookie consent banner at MVP. Revisit only if EU/UK traffic becomes significant enough to warrant it.  
**Reasoning:** Enforcement targets large companies, not solo builders at MVP scale. Adding consent friction before audience origin is known adds cost with no clear benefit. GDPR/CCPA data handling requirements are already covered by privacy policy + deletion process + no data selling.  
**GA4 path:** If the custom analytics tool proves sufficient after comparison, GA4 may be phased out — which largely eliminates the GDPR cookie concern since the custom tool is built privacy-first.  
**Trigger to revisit:** Meaningful EU/UK traffic visible in analytics, or any enforcement-related contact.

---

### Monetization: Affiliate Link Structure
**Decision:** `resources.js` lookup table maps resource keys → affiliate URLs, resolved at render time (already decided in Room 2). Helpfulness first — recommend the right resource regardless of affiliate status. Track non-affiliate clicks as candidates for future partnership outreach.

**Launch programs:** Apply for Coursera (Impact) and Udemy (Rakuten/Impact) before launch — standard approvals, days not weeks. Add whatever else is approved by launch day. Non-affiliated links for everything else; no holding up launch for pending applications. Target: also pursue Exponent, LinkedIn Learning, and begin direct outreach to Maven/Reforge for future partnerships.

**FTC disclosure:** One-liner in the report near the resources section — "Some links are affiliate links. We may earn a commission if you enroll — at no extra cost to you." Also referenced in Terms of Service and Privacy Policy for full coverage.  
**Due diligence disclaimer:** Adjacent to the FTC disclosure in the report — "Resources are selected based on relevance to your gaps. We haven't personally tested every recommendation — do your own research before purchasing." Also in Terms of Service. Keeps the tool honest and protects against complaints about recommended products.

---

### Monetization: Kit Sequence Design
**Direction set — full sequence design in a separate brainstorm session.**

**Key decisions:**
- Compressed timeline: 5–7 day aggressive sequence, not spread over 30 days. They're hottest immediately after the report. Don't let them cool down.
- Focus: helpful, gap-filling. Push them toward closing the gaps identified in their report.
- Call booking CTA: early in the sequence (Day 1 or 2). Ask for a 30-minute call. Explore incentive (free something, early access to a future product, etc.)
- Personalization: Kit liquid conditionals (`{% if subscriber.tags contains 'ai_level:basics' %}`). Native to Kit — use for dynamic content blocks based on tags.
- Tagging at MVP: quiz-based tags only. Focus on AI gap signals specifically. Keep it simple — don't build tag infrastructure beyond what the quiz generates. Reason: Kit has limits, and overcomplicating the onboarding flow for MVP isn't worth it.

**V2+ sequence ideas (backlog):**
- Job recommendations based on gaps + JD type
- Job board integration built into the sequence
- Extended nurture once relationship is established

---

### Launch: Soft Launch + Distribution Plan
**Phase 1 — Private testing (before any public announcement):**
5–15 people Matt knows personally. Doesn't have to be PMs — anyone who can use the tool and give honest feedback. Goal: catch broken flows, bad output, and UX issues before public eyes. Target 10–15 if reachable. Combined with the QA process, this is sufficient validation to launch.

**Phase 2 — Public announcement (once Phase 1 feedback is addressed):**
- **LinkedIn:** Primary lever. Matt's existing audience. Treat it as content — the build story, the tool, what it revealed about PM skill gaps.
- **Product Hunt:** Launch same week as LinkedIn. Coordinate for a strong Day 1 (upvotes from the network matter in the first 24 hours).
- **Reddit:** DM people in relevant subreddits (r/productmanagement, r/cscareerquestions) who seem to be in the target situation. Not mass posting — targeted outreach to people who would genuinely benefit. Ask them to share if it's useful, not to promote it.

**Note:** Matt doesn't have existing PM community presence (Slack groups, Discord) to use for Phase 2 — LinkedIn and Product Hunt are the main public levers. Reddit is supplementary.

**Feedback collection during launch:** Already decided — 1–5 star rating on report, Day 3 Kit email, personal calls with willing early users.

**Pre-launch minimum:** 5 private testers, ideally 10–15. No public announcement until known issues from private testing are resolved.

---

## 2026-06-05

### Taxonomy: Structure and Category Design
**Decision:** 9 categories, 100 total points. Categories: Product Strategy & Execution, Data Fluency & Experimentation, Cross-Functional Collaboration, Communication & Influence, Product Discovery & User Empathy, Technical Acumen, Leadership & Strategic Thinking, AI Tool Fluency, AI Product Expertise.  
**Why 9 vs. fewer:** Granular enough for Claude to distinguish and match, broad enough to avoid noise. Each category maps to a distinguishable set of resume signals.  
**AI split into two categories** (AI Tool Fluency + AI Product Expertise) rather than one — using AI tools to do PM work is a meaningfully different skill from building AI products. Conflating them would obscure both.  
**Depth levels added to all categories:** 4-tier ladder (foundational → proficient → advanced → expert) describing what each skill looks like at each depth. Solves the calibration problem — e.g., "data fluency" at foundational = reading dashboards; at advanced = writing SQL and owning measurement strategy. Claude uses depth levels to determine whether evidence in the resume is a strong, ambiguous, or gap match for a given JD level.

---

### Taxonomy: Research Methodology
**Sample:** 76 JDs total. Pass 1: ~25 company career page / Greenhouse / Lever JDs (Figma, Anthropic, Stripe, GitLab, G-P, Google, Meta, DoorDash, etc.). Pass 2: 51 LinkedIn JDs — 26 from "product manager" search, 25 from "AI product manager" search. Deliberate 50/50 split so AI frequency reflects a blended market view, not just AI-native companies.  
**Update cadence:** Twice per year (January and July). Next update: 2027-01.  
**File:** `projects/koalafied/skill-taxonomy.json` (v1.2)

---

### Taxonomy: AI Category Weights — Revised After LinkedIn Analysis
**Initial weights (v1.1):** AI Tool Fluency = 6 pts, AI Product Expertise = 8 pts  
**Revised weights (v1.2):** AI Tool Fluency = 9 pts, AI Product Expertise = 10 pts  
**Why revised:** LinkedIn JD sample showed AI Tool Fluency at 65% explicit mention rate across a broad PM sample — well above the 28% initial estimate from company career pages alone. No longer a niche signal; approaching table stakes. AI Product Expertise also confirmed at 59% (vs. 52% prior estimate). Funded by -1 or -2 across the 7 existing categories.  
**Combined AI weight:** 19/100 points (up from 14/100 in v1.1).

---

### Taxonomy: Domain Expertise — Not Weighted for MVP
**Decision:** Domain / vertical expertise (healthcare, fintech, education, legal) is NOT a weighted taxonomy category for MVP. It appeared in ~43% of the LinkedIn sample but is too role-specific to score meaningfully across all PM roles.  
**MVP handling:** Surfaced as a flag in the report narrative — "this JD requires [domain] experience" — rather than a scored category.  
**Post-MVP path:** If JD volume grows and patterns emerge (users can upload JDs, or data is collected at scale), domain expertise may be added as a category or modifier. Not blocking launch.

---

### Taxonomy: Prototype / Vibe-Coding as a Skill
**Decision:** Hands-on AI prototyping (v0, Cursor, Bolt, Replit, Claude Code) is NOT a separate category. Folded into AI Tool Fluency's skills list and depth levels — it sits at the "advanced" tier.  
**Why:** It's an expression of AI tool fluency, not a distinct competency. Showed up in ~24% of the LinkedIn sample — meaningful but not frequent enough to warrant its own category.

### System Prompt: Full Taxonomy Detail vs. Compact Reference
**Options considered:** Include only category names, weights, and match_level criteria (compact); include full depth_levels and resume_signals for all 9 categories (full)
**Decision:** Full — depth_levels and resume_signals included in the system prompt for all 9 categories
**Why:** Claude needs the depth level ladder to distinguish "strong" from "ambiguous" for a given JD level (e.g., the same data fluency evidence can be "strong" for an APM role and "ambiguous" for a Senior PM role). Without the resume_signals, Claude has no grounding for what constitutes concrete evidence vs. vague language. The prompt is long but is the cacheable prefix — token cost is paid once per session, not per report.
**Trade-off acknowledged:** Longer system prompt = more tokens cached = higher cost per cold session start. Acceptable at MVP volumes. If cost becomes a concern at scale, compact the taxonomy to depth level names only and test against the eval matrix.

---

### Resources: `is_free` — Claude Output vs. Astro-Resolved
**Options considered:** A) Keep `is_free` as a Claude-output field (Claude reads the approved list and echoes the value); B) Move `is_free` to Astro-resolved (sourced from `resources.js` at render time, same as URL)
**Decision:** Option B — Astro-resolved
**Why:** `is_free` is static data about a resource, not a judgment call. If it's in `resources.js`, Claude literally cannot get it wrong because it doesn't output it at all. Option A introduces a failure mode (Claude misreads or hallucinates the value) with no benefit — the value is already known at build time. A user who sees "Free" and hits a paywall is a bad experience worth eliminating by design.
**Changes:** `is_free` removed from Claude's output schema in `report-schema.json` (marked [Astro-resolved]) and from the output schema section of `system-prompt.txt`. Claude still reads the [Free]/[Paid] indicator from the approved resource list to set the first tag correctly — but doesn't output the boolean field.

---

### Resources: Data Structure — Summary and Certificate Note
**Decision:** Added `summary`, `is_free`, and `certificate_note` fields to every entry in `resources.js`. All three resolved by Astro at render time from the resource key — not stored in the report JSON and not output by Claude.
**Why:** The report needs a static 1-sentence description of what each resource is (summary), a reliable free/paid flag (is_free — see decision above), and a way to surface "certificate available for additional cost" for resources like Coursera that have free audit tiers (certificate_note). Storing these in `resources.js` means one edit updates all active reports immediately, same as the URL.
**Tags:** First tag in Claude's output tags array must match the [Free]/[Paid] indicator from the approved list. This keeps the resource card's visual free/paid signal consistent with the ground truth in `resources.js`.

---

### Eval Matrix: Structure and Scope
**Decision:** Pre-launch eval matrix built as 5 synthetic test cases + two-tier checklist (mechanical pass/fail + human quality review). Stored in `eval-matrix.md`.
**Test cases cover:** (1) strong fit baseline, (2) gap-heavy early PM against senior JD, (3) vague resume testing inference rule 2, (4) non-AI JD testing inference rule 3, (5) level mismatch testing depth calibration.
**Why synthetic not real JDs:** Synthetic test cases allow precise control over what's present and absent in each resume/JD pair — essential for testing specific inference rules. Real JDs from the 76-sample corpus are better for a v2 stress test once the prompt is stable.
**Why two tiers:** Mechanical checks catch schema violations and can be automated. Quality checks require human judgment on whether explanations are specific enough and scoring feels right — can't be automated without building a meta-eval, which isn't worth it pre-launch.

---

## 2026-06-05 — Phase 1 Build Log (reviewed and approved by Matt)

### Phase 1: Project Setup — Complete

**What was done:**

- **Astro config** (`astro.config.mjs`): Added `@astrojs/node@9.5.3` adapter (`mode: "standalone"`) — required for SSR routes on the Hostinger VPS. Output stays `"static"` (Astro 5 removed `"hybrid"` as a named option; the same behavior is achieved by keeping `output: "static"` with the adapter installed and using `export const prerender = false` on individual SSR routes).

- **Packages installed**: `@astrojs/node@9.5.3`, `@upstash/redis`, `@upstash/ratelimit`, `@anthropic-ai/sdk`. Node adapter pinned to 9.5.3 — v10+ requires Astro 6.

- **`.env.example`** created with all required vars: `ANTHROPIC_API_KEY`, `KOALAFIED_SYSTEM_PROMPT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `KIT_API_KEY`, `KOALAFIED_ALERT_EMAIL`.

- **Page scaffolding**:
  - `src/pages/koalafied/index.astro` — static placeholder (Phase 5)
  - `src/pages/koalafied/report/[id].astro` — `prerender = false`, placeholder (Phase 6)
  - `src/pages/api/analyze.ts` — `prerender = false`, returns 501 (Phase 2)
  - `src/pages/api/status/[job_id].ts` — `prerender = false`, returns 501 (Phase 2)

- **`src/lib/` created**:
  - `redis.ts` — Upstash client + key helpers (`jobKey`, `reportKey`, `kitRetryKey`) + TTL constants
  - `claude.ts` — Anthropic client + model/temp/token constants
  - `scoring.ts` — Full score computation: `computeScore()` takes `{weight, match_level}[]` → returns `overall_score`, `tier`, counts. Complete implementation — no external deps.
  - `sanitize.ts` — `sanitizeField()` (strip HTML + 15k char cap) and `sanitizeEmail()`
  - `kit.ts` — Kit API base URL + key init
  - `rate-limit.ts` — `hourlyLimit` (3/hr) and `dailyLimit` (6/day) via `@upstash/ratelimit`

- **`src/data/koalafied/resources.js`** — resources lookup table copied from pre-build artifact.

- **`robots.txt.ts`** updated: added `Disallow: /koalafied/report/`.

- **Build check**: 0 errors, 0 warnings (125 pre-existing hints from template code).

**Pending before Phase 2 testing:** Real `.env` file needed on VPS and locally — copy `.env.example` and fill in Upstash + Anthropic credentials. System prompt can stay empty until Phase 3.

**Deployment note (for launch, not now):** Current VPS serves static files from `dist/`. Once SSR routes are live, VPS will need to run `node dist/server/entry.mjs` as a persistent process (PM2 or equivalent). No action needed until first SSR route is being tested live.

---

Last updated: 2026-06-05
