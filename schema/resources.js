// resources.js
// Affiliate URL lookup — resolved at render time by the Astro report page.
// These keys are the only resource_keys Claude is allowed to use.
// Swap placeholder URLs for affiliate URLs as programs are approved.
// affiliate field: false = no program exists; "pending" = apply before launch; "approved" = live
//
// Fields resolved by Astro at render time (not output by Claude):
//   summary: one-sentence description of what the resource is
//   is_free: whether the resource is free to access at full value
//   certificate_note: shown beneath the resource card when not null
//
// To add a resource: add an entry here, then add the key to the Claude system prompt resource list.
// To update a URL: change it here — all active reports update immediately on next page load.

export const resources = {

  // ─── SQL / Data Fluency ──────────────────────────────────────────
  mode_sql_tutorial: {
    title: "Mode Analytics SQL Tutorial",
    url: "https://mode.com/sql-tutorial/",
    summary: "Interactive SQL tutorial covering basics through advanced queries, built for analysts.",
    is_free: true,
    certificate_note: null,
    affiliate: false,
  },
  khan_academy_sql: {
    title: "Khan Academy — Intro to SQL",
    url: "https://www.khanacademy.org/computing/computer-programming/sql",
    summary: "Beginner-friendly SQL introduction with video lessons and in-browser practice exercises.",
    is_free: true,
    certificate_note: null,
    affiliate: false,
  },
  coursera_ibm_data_analyst: {
    title: "IBM Data Analyst Professional Certificate — Coursera",
    url: "https://www.coursera.org/professional-certificates/ibm-data-analyst",
    summary: "9-course certificate covering data analysis, SQL, Python, and visualization tools.",
    is_free: false,
    certificate_note: "Certificate requires paid enrollment; free audit available for individual courses.",
    affiliate: "pending", // apply via Impact.com before launch
  },
  udemy_sql_bootcamp: {
    title: "The Complete SQL Bootcamp — Udemy",
    url: "https://www.udemy.com/course/the-complete-sql-bootcamp/",
    summary: "Comprehensive SQL course covering queries, joins, aggregations, and advanced techniques.",
    is_free: false,
    certificate_note: null,
    affiliate: "pending", // apply via Rakuten/Impact before launch
  },

  // ─── Product Analytics Tools ─────────────────────────────────────
  amplitude_academy: {
    title: "Amplitude Academy",
    url: "https://academy.amplitude.com/",
    summary: "Official Amplitude training covering product analytics, funnels, cohorts, and retention dashboards.",
    is_free: true,
    certificate_note: null,
    affiliate: false,
  },
  mixpanel_learning: {
    title: "Mixpanel Learning Center",
    url: "https://mixpanel.com/blog/",
    summary: "Official Mixpanel resources including tutorials, documentation, and product analytics guides.",
    is_free: true,
    certificate_note: null,
    affiliate: false,
  },

  // ─── AI Tool Fluency ─────────────────────────────────────────────
  maven_lenny_ai_for_pms: {
    title: "AI for Product Managers — Maven (Lenny Rachitsky)",
    url: "https://maven.com/lenny/ai-for-pms",
    summary: "Live cohort-based course on integrating AI tools into PM workflows, taught by Lenny Rachitsky.",
    is_free: false,
    certificate_note: null,
    affiliate: "pending", // direct outreach to Maven/Lenny — higher priority
  },
  pragmatic_ai_for_pms: {
    title: "AI for Product Managers — Pragmatic Institute",
    url: "https://www.pragmaticinstitute.com/product/ai-for-product-managers/",
    summary: "Structured course covering AI fundamentals and practical applications for product managers.",
    is_free: false,
    certificate_note: "Certificate of completion included with paid enrollment.",
    affiliate: "pending",
  },
  anthropic_prompt_guide: {
    title: "Anthropic Prompt Engineering Guide",
    url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
    summary: "Official Anthropic documentation on prompt engineering techniques, patterns, and best practices.",
    is_free: true,
    certificate_note: null,
    affiliate: false,
  },

  // ─── AI Product Expertise ────────────────────────────────────────
  coursera_ai_for_everyone: {
    title: "AI for Everyone — Coursera (Andrew Ng)",
    url: "https://www.coursera.org/learn/ai-for-everyone",
    summary: "Non-technical introduction to AI concepts, strategy, and organizational impact by Andrew Ng.",
    is_free: false,
    certificate_note: "Certificate requires paid enrollment; free audit available.",
    affiliate: "pending",
  },
  coursera_ml_specialization: {
    title: "Machine Learning Specialization — Coursera (Andrew Ng)",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    summary: "Three-course specialization covering supervised learning, neural networks, and ML best practices.",
    is_free: false,
    certificate_note: "Certificate requires paid enrollment; free audit available for individual courses.",
    affiliate: "pending",
  },
  reforge_ai_product: {
    title: "AI Product Management — Reforge",
    url: "https://www.reforge.com/courses/ai-product-management",
    summary: "Advanced course on building and shipping AI products, including evals, quality metrics, and AI product strategy.",
    is_free: false,
    certificate_note: null,
    affiliate: "pending", // direct partnership outreach — Phase 2 priority
  },

  // ─── PM Career / Interview Prep ──────────────────────────────────
  exponent_pm_prep: {
    title: "Exponent — PM Interview Prep",
    url: "https://www.tryexponent.com/",
    summary: "PM interview preparation platform with mock interviews, structured courses, and a practice community.",
    is_free: false,
    certificate_note: null,
    affiliate: "pending",
  },
  lenny_newsletter: {
    title: "Lenny's Newsletter",
    url: "https://www.lennysnewsletter.com/",
    summary: "Weekly newsletter covering PM strategy, career advice, and frameworks from top industry practitioners.",
    is_free: false,
    certificate_note: null,
    affiliate: false,
  },

  // ─── Product Strategy ────────────────────────────────────────────
  reforge_product_strategy: {
    title: "Product Strategy — Reforge",
    url: "https://www.reforge.com/courses/product-strategy",
    summary: "Advanced Reforge course on product strategy, prioritization frameworks, and roadmap decision-making.",
    is_free: false,
    certificate_note: null,
    affiliate: "pending",
  },
  coursera_google_pm_cert: {
    title: "Google Project Management Certificate — Coursera",
    url: "https://www.coursera.org/professional-certificates/google-project-management",
    summary: "6-course Google certificate covering project management fundamentals, Agile, and PM tools.",
    is_free: false,
    certificate_note: "Certificate requires paid enrollment; free audit available for individual courses.",
    affiliate: "pending",
  },

  // ─── Discovery / User Research ───────────────────────────────────
  continuous_discovery_habits: {
    title: "Continuous Discovery Habits — Teresa Torres",
    url: "https://www.amazon.com/Continuous-Discovery-Habits-Discover-Products/dp/1736633309",
    summary: "Book covering the continuous discovery framework, including user interview techniques and opportunity mapping.",
    is_free: false,
    certificate_note: null,
    affiliate: "pending", // Amazon Associates — easy to apply
  },
  nngroup_ux_research: {
    title: "UX Research — Nielsen Norman Group",
    url: "https://www.nngroup.com/training/",
    summary: "Professional UX research training from Nielsen Norman Group covering research methods and usability testing.",
    is_free: false,
    certificate_note: "UX certification available for additional cost through NNG's certification program.",
    affiliate: false,
  },

  // ─── Technical Acumen ────────────────────────────────────────────
  codecademy_web: {
    title: "Codecademy — Web Development",
    url: "https://www.codecademy.com/catalog/subject/web-development",
    summary: "Interactive web development courses covering HTML, CSS, JavaScript, and related technologies.",
    is_free: false,
    certificate_note: "Certificate requires Pro subscription; some free content available.",
    affiliate: "pending",
  },
  cs50_harvard: {
    title: "CS50 — Harvard (Free)",
    url: "https://cs50.harvard.edu/x/",
    summary: "Harvard's renowned introductory computer science course covering programming fundamentals and web development.",
    is_free: true,
    certificate_note: "Free certificate of completion available; verified certificate through edX costs extra.",
    affiliate: false,
  },

};
