import { useState, useEffect, useRef } from "react";

type Screen = "form" | "quiz" | "processing" | "error";

interface QuizAnswers {
  job_search_stage: string;
  biggest_challenge: string;
  pm_level: string;
  ai_skill_level: string;
  ai_goal: string;
}

const QUIZ = [
  {
    key: "job_search_stage" as keyof QuizAnswers,
    question: "Where are you in your job search?",
    options: [
      { value: "active", label: "Actively looking right now" },
      { value: "one_to_three_months", label: "Planning to start in 1–3 months" },
      { value: "casually_exploring", label: "Casually exploring what's out there" },
      { value: "internal_promotion", label: "Going for an internal promotion" },
    ],
  },
  {
    key: "biggest_challenge" as keyof QuizAnswers,
    question: "What's your biggest challenge right now?",
    options: [
      { value: "not_getting_interviews", label: "Not getting enough interviews — my resume isn't landing" },
      { value: "not_advancing_in_interviews", label: "Getting interviews but not moving forward" },
      { value: "unsure_of_gaps", label: "Not sure what skills I'm missing for the roles I want" },
      { value: "know_gaps_not_how_to_close", label: "I know my gaps — I just don't know how to close them" },
    ],
  },
  {
    key: "pm_level" as keyof QuizAnswers,
    question: "How would you describe your PM experience?",
    options: [
      { value: "aspiring", label: "Aspiring — looking to break into PM" },
      { value: "early", label: "Early PM (0–3 years)" },
      { value: "mid", label: "Mid-level PM (3–7 years)" },
      { value: "senior", label: "Senior PM or above" },
    ],
  },
  {
    key: "ai_skill_level" as keyof QuizAnswers,
    question: "How would you rate your current AI skills?",
    options: [
      { value: "just_starting", label: "Just starting — learning the basics" },
      { value: "comfortable_with_basics", label: "Comfortable with the basics" },
      { value: "intermediate", label: "Intermediate — using AI tools regularly" },
      { value: "advanced", label: "Advanced — building with AI" },
    ],
  },
  {
    key: "ai_goal" as keyof QuizAnswers,
    question: "What's your main goal with AI?",
    options: [
      { value: "use_ai_for_work", label: "Use AI tools to do my PM job better" },
      { value: "understand_ai_products", label: "Understand AI products well enough to manage them" },
      { value: "build_with_ai", label: "Actually build with AI — code, agents, integrations" },
      { value: "all_of_the_above", label: "All of the above" },
    ],
  },
];

const STAGES = [
  "Analyzing your experience…",
  "Building your learning path…",
  "Sending your report…",
  "Done — opening your report",
];

const SESSION_KEY = "koalafied_form";

export default function KoalafiedFlow() {
  const [screen, setScreen] = useState<Screen>("form");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [email, setEmail] = useState("");
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Partial<QuizAnswers>>({});
  const [stageIndex, setStageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const didComplete = useRef(false);

  // Pre-fill from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const data = JSON.parse(saved) as Partial<{ resume: string; job_description: string; email: string }>;
        if (data.resume) setResume(data.resume);
        if (data.job_description) setJobDescription(data.job_description);
        if (data.email) setEmail(data.email);
      }
    } catch {}
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showTooltip) return;
    const close = () => setShowTooltip(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showTooltip]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAll();
  }, []);

  function clearAll() {
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function saveToSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ resume, job_description: jobDescription, email }));
    } catch {}
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resume.trim()) { setFormError("Please paste your resume or experience summary."); return; }
    if (!jobDescription.trim()) { setFormError("Please paste the job description."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setFormError("");
    saveToSession();
    setQuizStep(0);
    setQuizAnswers({});
    setScreen("quiz");
  }

  // ─── Quiz ────────────────────────────────────────────────────────────────────

  function handleQuizSelect(value: string) {
    setQuizAnswers((prev) => ({ ...prev, [QUIZ[quizStep].key]: value }));
  }

  function handleQuizNext() {
    const current = QUIZ[quizStep];
    if (!quizAnswers[current.key]) return;
    if (quizStep < QUIZ.length - 1) {
      setQuizStep((s) => s + 1);
    } else {
      submitAnalysis(quizAnswers as QuizAnswers);
    }
  }

  function handleQuizBack() {
    if (quizStep > 0) setQuizStep((s) => s - 1);
    else setScreen("form");
  }

  // ─── Submit + polling ────────────────────────────────────────────────────────

  async function submitAnalysis(answers: QuizAnswers) {
    setScreen("processing");
    setStageIndex(0);
    didComplete.current = false;
    clearAll();

    // Stage rotation — time-based approximation of server progress
    stageTimers.current = [
      setTimeout(() => setStageIndex(1), 8000),
      setTimeout(() => setStageIndex(2), 22000),
    ];

    let jobId: string;
    try {
      const res = await fetch("/api/analyze/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, job_description: jobDescription, email, ...answers }),
      });

      if (res.status === 429) {
        fail("You've hit the rate limit. Please try again in an hour.");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        fail(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const data = (await res.json()) as { job_id: string };
      jobId = data.job_id;
    } catch {
      fail("Could not connect to the server. Please check your connection and try again.");
      return;
    }

    // Poll every 4 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}/`);
        const data = (await res.json()) as { status: string; report_id?: string };

        if (data.status === "complete" && !didComplete.current) {
          didComplete.current = true;
          clearAll();
          setStageIndex(3);
          setTimeout(() => {
            window.location.href = `/koalafied/report/${data.report_id}/`;
          }, 1200);
        } else if (data.status === "failed") {
          fail("Something went wrong analyzing your resume. Your email was saved — please try submitting again.");
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 4000);
  }

  function fail(msg: string) {
    clearAll();
    setErrorMsg(msg);
    setScreen("error");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const q = QUIZ[quizStep];
  const currentAnswer = q ? quizAnswers[q.key] : undefined;

  return (
    <>
      {/* Hero */}
      <div style={{ background: "#1a1a1a" }} className="text-white text-center py-16 px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Product Managers: Are you Koalafied?</h1>
        <p style={{ color: "#9ca3af" }} className="text-lg max-w-xl mx-auto leading-relaxed">
          Paste your resume and a job description. Get a free AI-powered analysis of your fit, your
          gaps, and exactly what to do about it.
        </p>
      </div>

      {/* Card area */}
      <div style={{ background: "#f3f4f6", minHeight: "60vh" }} className="py-10 px-6 pb-20">
        <div className="max-w-2xl mx-auto">

          {/* ── Form ── */}
          {screen === "form" && (
            <form onSubmit={handleFormSubmit}>
              <Card>
                <Field label="Your Resume or Bio">
                  <textarea
                    rows={8}
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Paste your resume, LinkedIn About section, or a summary of your experience…"
                    style={textareaStyle}
                  />
                </Field>

                <Field label="The Job Description">
                  <textarea
                    rows={8}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here…"
                    style={textareaStyle}
                  />
                </Field>

                <Field label="Your Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com — your report will be sent here"
                    style={inputStyle}
                  />
                </Field>

                <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {[
                      "Fit score with honest strengths and gaps",
                      "AI skills assessment specific to this role",
                      "Prioritized learning path to close your gaps",
                      "Projects to build that actually demonstrate the skills",
                      "Resume rewrite recommendations",
                    ].map((item) => (
                      <li key={item} style={{ fontSize: "14px", color: "#555", padding: "4px 0" }}>
                        ✓&nbsp; {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {formError && (
                  <p style={{ color: "#dc2626", fontSize: "14px", marginBottom: "12px" }}>{formError}</p>
                )}

                <button type="submit" style={ctaStyle}>
                  Get my free report →
                </button>

                {/* Anthropic disclosure */}
                <div style={{ marginTop: "10px", position: "relative" }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowTooltip((v) => !v); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    ℹ️ Your resume is processed by Anthropic's Claude AI
                  </button>
                  {showTooltip && (
                    <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
                      Your resume and job description are sent to Anthropic's Claude API for analysis. They are not stored by us or Anthropic and are not used for AI training.{" "}
                      <a href="/privacy/" style={{ color: "#93c5fd", textDecoration: "underline" }}>Privacy policy</a>
                    </div>
                  )}
                </div>

                <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>
                  Free. No spam. Unsubscribe anytime.
                </p>
              </Card>
            </form>
          )}

          {/* ── Quiz ── */}
          {screen === "quiz" && q && (
            <Card>
              <p style={{ fontSize: "14px", color: "#6b7280", fontWeight: 600, marginBottom: "12px" }}>
                Answer 5 quick questions to personalize your report
              </p>

              <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "6px", marginBottom: "6px" }}>
                <div
                  style={{
                    background: "#374151",
                    height: "6px",
                    borderRadius: "999px",
                    width: `${((quizStep + 1) / QUIZ.length) * 100}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "28px" }}>
                Question {quizStep + 1} of {QUIZ.length}
              </p>

              <p style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", lineHeight: 1.35 }}>
                {q.question}
              </p>

              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleQuizSelect(opt.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    border: `2px solid ${currentAnswer === opt.value ? "#1a1a1a" : "#d1d5db"}`,
                    borderRadius: "7px",
                    padding: "14px 16px",
                    marginBottom: "10px",
                    cursor: "pointer",
                    fontSize: "15px",
                    color: currentAnswer === opt.value ? "#1a1a1a" : "#4b5563",
                    background: currentAnswer === opt.value ? "#f3f4f6" : "white",
                    fontWeight: currentAnswer === opt.value ? 600 : 400,
                    textAlign: "left",
                    transition: "border-color 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
                <button type="button" onClick={handleQuizBack} style={backBtnStyle}>
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleQuizNext}
                  disabled={!currentAnswer}
                  style={{
                    ...nextBtnStyle,
                    background: currentAnswer ? "#1a1a1a" : "#d1d5db",
                    cursor: currentAnswer ? "pointer" : "not-allowed",
                  }}
                >
                  {quizStep === QUIZ.length - 1 ? "Get my report →" : "Next →"}
                </button>
              </div>
            </Card>
          )}

          {/* ── Processing ── */}
          {screen === "processing" && (
            <Card>
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                {stageIndex < 3 ? (
                  <div style={spinnerStyle} />
                ) : (
                  <div style={{ fontSize: "44px", marginBottom: "28px" }}>✓</div>
                )}
                <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>
                  {STAGES[stageIndex]}
                </h2>
                {stageIndex < 3 && (
                  <p style={{ color: "#9ca3af", fontSize: "15px" }}>
                    This usually takes 1–2 minutes.
                    <br />
                    Your report will also be sent to {email} — feel free to close this tab and check your inbox.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* ── Error ── */}
          {screen === "error" && (
            <Card>
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚠️</div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>
                  Something went wrong
                </h2>
                <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "24px", lineHeight: 1.55 }}>
                  {errorMsg}
                </p>
                <button
                  type="button"
                  onClick={() => { setStageIndex(0); setScreen("form"); }}
                  style={ctaStyle}
                >
                  Try again
                </button>
              </div>
            </Card>
          )}

        </div>
      </div>

      <style>{`
        @keyframes koala-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "2px solid #e5e7eb", borderRadius: "10px", padding: "36px", color: "#1a1a1a" }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "8px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid #e5e7eb",
  borderRadius: "6px",
  padding: "14px",
  fontSize: "14px",
  fontFamily: "inherit",
  resize: "vertical",
  color: "#1a1a1a",
  outline: "none",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid #e5e7eb",
  borderRadius: "6px",
  padding: "14px",
  fontSize: "14px",
  fontFamily: "inherit",
  color: "#1a1a1a",
  outline: "none",
};

const ctaStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#1a1a1a",
  color: "white",
  border: "none",
  padding: "17px",
  fontSize: "16px",
  fontWeight: 700,
  borderRadius: "7px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
};

const backBtnStyle: React.CSSProperties = {
  background: "none",
  border: "2px solid #e5e7eb",
  borderRadius: "6px",
  padding: "10px 22px",
  fontSize: "14px",
  cursor: "pointer",
  color: "#4b5563",
  fontFamily: "inherit",
};

const nextBtnStyle: React.CSSProperties = {
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "12px 28px",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "inherit",
};

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 8px)",
  left: 0,
  background: "#1f2937",
  color: "white",
  padding: "12px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  lineHeight: 1.55,
  width: "320px",
  zIndex: 20,
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
};

const spinnerStyle: React.CSSProperties = {
  width: "52px",
  height: "52px",
  border: "5px solid #e5e7eb",
  borderTopColor: "#374151",
  borderRadius: "50%",
  margin: "0 auto 28px",
  animation: "koala-spin 0.8s linear infinite",
};
