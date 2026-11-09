/**
 * The build log, week by week (Week 6, /docs). Dates are the day each week's
 * packet or first file entered git; the packets themselves are on GitHub.
 */
export const REPO = "https://github.com/vestiamx-code/closetai";
export const enGitHub = (ruta: string) => `${REPO}/blob/main/${ruta}`;

export type Semana = {
  semana: string;
  fecha: string;
  titulo: string;
  resumen: string;
  rutas: string[];
  plan: string;
  demo: string;
};

export const SEMANAS: Semana[] = [
  {
    semana: "Week 0",
    fecha: "Aug 19, 2026",
    titulo: "The app",
    resumen:
      "Sign-up, a closet cataloged by AI from one photo, a stylist that builds outfits from clothes she owns with the real weather, a learning profile, virtual try-on and Stripe credits.",
    rutas: ["/today", "/closet", "/try-on", "/style"],
    plan: "docs/DOCUMENTO-MAESTRO.md",
    demo: "/demo/week-0",
  },
  {
    semana: "Week 1",
    fecha: "Sep 2, 2026",
    titulo: "Style core",
    resumen: "A public generator that turns how someone describes their style into a structured, savable core.",
    rutas: ["/core"],
    plan: "docs/SEMANA-1-PACKET.md",
    demo: "/demo/week-1",
  },
  {
    semana: "Week 2",
    fecha: "Sep 14, 2026",
    titulo: "Research and benchmarking",
    resumen:
      "Verified sources, competitors, risks and validation conversations in the database, and an analyst that may only cite them.",
    rutas: ["/research"],
    plan: "docs/SEMANA-2-PACKET.md",
    demo: "/demo/week-2",
  },
  {
    semana: "Week 3",
    fecha: "Oct 6, 2026",
    titulo: "Product architecture and pricing",
    resumen: "A feature map by plan, and a revenue simulator with editable assumptions that shows what each plan costs to run.",
    rutas: ["/product", "/pricing"],
    plan: "docs/SEMANA-3-PACKET.md",
    demo: "/demo/week-3",
  },
  {
    semana: "Week 4",
    fecha: "Oct 21, 2026",
    titulo: "Marketing engine",
    resumen:
      "A post generator that rejects invented figures, a homepage A/B test with real traffic, and the move of the whole product to English.",
    rutas: ["/marketing", "/"],
    plan: "docs/WEEK-4-PACKET.md",
    demo: "/demo/week-4",
  },
  {
    semana: "Week 5",
    fecha: "Oct 28, 2026",
    titulo: "Public stylist chat",
    resumen:
      "Four guided questions, an outfit with photos and store links, a two-layer guardrail, human review in /admin, ratings and three external testers.",
    rutas: ["/chat"],
    plan: "docs/WEEK-5-PACKET.md",
    demo: "/demo/week-5",
  },
  {
    semana: "Week 6",
    fecha: "Nov 9, 2026",
    titulo: "The integrated venture",
    resumen:
      "One navigation, a public dashboard of real records, this page, the guided demo with the agent map, five external users and a full-site regression test.",
    rutas: ["/demo", "/dashboard", "/docs"],
    plan: "docs/WEEK-6-PACKET.md",
    demo: "/demo",
  },
];

/** The running logs, kept since Week 0. */
export const BITACORAS = [
  { titulo: "Prompt log", ruta: "docs/evidencia/PROMPT_LOG.md", que: "Every prompt given to the coding agent, and what came of it" },
  { titulo: "Iteration log", ruta: "docs/evidencia/ITERATION_LOG.md", que: "What changed after each round of testing, and why" },
  { titulo: "Test evidence", ruta: "docs/evidencia/TEST_EVIDENCE.md", que: "Every test run, including the ones that failed" },
  { titulo: "Decision notes", ruta: "docs/evidencia/DECISION_NOTES.md", que: "Tamara’s decisions, rejections and corrections, week by week" },
];
