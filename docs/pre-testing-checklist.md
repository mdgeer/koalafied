# Koalafied — Pre-End-to-End Testing Checklist

Complete these before running any end-to-end tests. Steps 1–5 unlock API-level testing (Postman/curl). Steps 1–6 unlock full browser testing.

---

## 1. Upstash Redis

- [ ] Create a database at console.upstash.com (free tier is fine)
- [ ] Copy REST URL → `UPSTASH_REDIS_REST_URL` in `.env`
- [ ] Copy REST token → `UPSTASH_REDIS_REST_TOKEN` in `.env`

---

## 2. Anthropic

- [ ] Get API key at console.anthropic.com → `ANTHROPIC_API_KEY` in `.env`
- [ ] Paste full contents of `system-prompt.txt` as the value for `KOALAFIED_SYSTEM_PROMPT` in `.env`
  - Multiline is fine on Linux/Mac
  - On Windows: wrap the entire value in double quotes if the shell complains

---

## 3. Kit

- [ ] Settings → Custom Fields → Add field: name `report_url`, type Text
- [ ] Forms → Create new form → name it "Koalafied"
- [ ] Visual automations → trigger: "Joins Koalafied form" → action: Send email
  - Subject: "Your Koalafied report is ready" (or whatever feels right)
  - Body: one button linking to `{{ subscriber.report_url }}`
- [ ] Copy the form ID from the Kit URL (`/forms/XXXXXXX/edit`) → `KIT_FORM_ID` in `.env`
- [ ] Get API key: app.kit.com → Account Settings → Developer Settings → `KIT_API_KEY` in `.env`
- [ ] *(Optional — can do post-launch)* Create a sequence triggered by the `koalafied:report_failed` tag for failure recovery

---

## 4. Local `.env` file

- [ ] Copy `.env.example` → `.env` in the `projects/mattgeer-new/` root
- [ ] Confirm all 6 required vars are filled:
  - `ANTHROPIC_API_KEY`
  - `KOALAFIED_SYSTEM_PROMPT`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `KIT_API_KEY`
  - `KIT_FORM_ID`

---

## 5. API-level smoke test (no frontend needed)

Run these before Phase 5 and 6 are built to verify the full backend works.

- [ ] Start dev server: `npm run dev` from `projects/mattgeer-new/`
- [ ] POST to `http://localhost:4321/api/analyze` with a real resume + JD + email + quiz answers
  - Use Postman, Insomnia, or curl
  - Body shape:
    ```json
    {
      "resume": "...",
      "job_description": "...",
      "email": "your@email.com",
      "job_search_stage": "active",
      "biggest_challenge": "unsure_of_gaps",
      "pm_level": "mid",
      "ai_skill_level": "comfortable_with_basics",
      "ai_goal": "use_ai_for_work"
    }
    ```
  - Expect: `202` + `{ "job_id": "..." }`
- [ ] Poll `GET http://localhost:4321/api/status/[job_id]` every few seconds
  - Expect: `{ "status": "pending" }` → `{ "status": "complete", "report_id": "..." }`
- [ ] Check Upstash console → confirm report JSON stored under key `report:[report_id]`
- [ ] Check Kit → confirm subscriber created with `report_url` custom field populated correctly
- [ ] Check email inbox → confirm report link email arrived and the link resolves

---

## 6. Still needed for full browser end-to-end

These are the remaining build phases.

- [ ] **Phase 5** — Form + quiz page (`/koalafied`): the UI that submits to the API, shows the processing screen with stage messages, and handles the browser redirect on completion
- [ ] **Phase 6** — Report page (`/koalafied/report/[id]`): SSR page that reads the stored report JSON from Upstash and renders all 10 sections

---

Last updated: 2026-06-06
