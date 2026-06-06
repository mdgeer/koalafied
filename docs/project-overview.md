# Koalafied

**Tagline:** Are you Koalafied?

Lives at: `mattgeer.com/koalafied` (to start)

---

## What It Is

An AI-powered PM career intelligence tool. Paste your resume and a job description — Koalafied tells you where you stand, what you're missing, and exactly what to do about it. The report arrives via email after a short quiz.

---

## The Problem

PMs applying for jobs do a version of this manually — pasting JDs into Claude and asking "am I a good fit?" The output is ad hoc, unstructured, and doesn't tell you what to do next. Existing tools (Jobscan, Teal) focus on ATS optimization, not genuine skill gap analysis, learning paths, or project recommendations.

---

## The Audience

- Mid-career PMs actively job searching or planning to
- Aspiring PMs transitioning from another role
- PMs wanting to understand what skills to build for roles they want

---

## Product Flow

1. User lands on `mattgeer.com/koalafied`
2. Pastes resume/bio + target job description
3. Enters email to receive report
4. Completes 5-question quiz
5. Receives personalized report via Kit email

### Quiz Questions
1. Where are you in your job search? (Active / 1-3 months / Casually exploring / Internal promotion)
2. What's your biggest challenge? (Not getting interviews / Getting interviews but not advancing / Not sure what skills I'm missing / Know the gaps but not how to close them)
3. What PM level are you? (Aspiring/transitioning / Early 0-3 yrs / Mid 3-7 yrs / Senior 7+)
4. How would you rate your AI skills? (Just starting / Comfortable with basics / Intermediate / Advanced)
5. What do you most want to develop with AI? (Use AI tools to do my job better / Understand AI products to manage them / Build with AI / All of the above)

### Report Sections
1. Fit summary — overall read, 3 headline strengths, 3 headline gaps
2. Where you're strong
3. Where it's ambiguous (skills you may have but don't demonstrate)
4. Where you're falling short
5. AI skills assessment — JD requirements vs. your stated level
6. Learning path — prioritized skills to develop, sequenced
7. Where to learn them — specific resources with affiliate links
8. Projects to build — concrete projects to demonstrate each skill
9. Resume recommendations — how to reframe what you have
10. Your next 30 days — concrete action plan

---

## Monetization

- **Phase 1:** Affiliate links in report (Coursera, Udemy, LinkedIn Learning, PM-specific platforms)
- **Phase 2:** Direct partnerships with PM course creators (Reforge, Maven, Lenny, etc.)
- **Phase 3:** Matt's own courses replace affiliate recommendations for relevant topics
- **Future:** Paid tier / accounts if demand warrants

---

## Distribution

- Matt's LinkedIn posts + PM content (the build is the content)
- PM communities (Reddit, Slack groups, Discord servers)
- Product Hunt launch
- Report itself is shareable — designed to be forwarded

---

## Tech Stack

- Astro (existing mattgeer.com site, new route)
- Serverless function (Vercel) calling Claude API
- Kit for email delivery and list management
- No database (stateless to start — no user accounts)
- Claude API (claude-sonnet-4-6) for report generation

---

## Strategic Value Beyond the Tool

- **List building:** Email gate means every report = a new Kit subscriber, tagged by quiz answers for segmented sequences
- **Market research:** Aggregate quiz data + JD analysis reveals what skills PMs are most commonly missing → informs course development
- **Content roadmap:** Report sections map directly to content to write (skills to learn → articles, resources → reviews, projects → tutorials)
- **Resume/portfolio:** Real AI integration (Claude API) for Matt's own GitHub and bio

---

## Open Source

Yes — code on GitHub. Prompt logic in environment variables.

---

## Status

Planning — pre-build. Research in progress.

Last updated: 2026-06-03
