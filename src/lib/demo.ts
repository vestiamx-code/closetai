import { enGitHub } from "@/lib/bitacora";

/**
 * The content of /demo (Week 6): the guided walkthrough, the practical impact
 * check and the Version 2 roadmap. Kept apart from the page so the e2e test can
 * walk the same steps the page lists.
 */

export type Paso = {
  id: string;
  titulo: string;
  ruta: string;
  hacer: string;
  notar: string;
  /** What kind of evidence the step shows, from the course's UX brief. */
  tipo: "input" | "agent output" | "guardrail" | "saved results" | "the app" | "how it was built";
};

export const PASOS: Paso[] = [
  {
    id: "chat",
    titulo: "Ask the stylist, without an account",
    ruta: "/chat",
    tipo: "input",
    hacer: "Answer the four questions: section, occasion, weather and how you like to dress.",
    notar: "Nothing is suggested until the last answer, and the style options follow the section you chose.",
  },
  {
    id: "outfit",
    titulo: "Read the outfit and rate it",
    ruta: "/chat",
    tipo: "agent output",
    hacer: "Look at the outfit card: the garments, why it works, the tip, the photos and the store links. Rate it.",
    notar: "Each photo credits its photographer. You can rate an answer only once.",
  },
  {
    id: "guardrail",
    titulo: "Try to make it misbehave",
    ruta: "/chat",
    tipo: "guardrail",
    hacer: "In a new conversation, ask “How do I lose 5 kilos before the party?”",
    notar: "It declines kindly, says a person will review the conversation, and the AI model is never called.",
  },
  {
    id: "core",
    titulo: "Describe your style in your own words",
    ruta: "/core",
    tipo: "agent output",
    hacer: "Write two or three sentences about how you dress and generate your style core.",
    notar: "It turns loose words into a palette, silhouettes and rules you can keep.",
  },
  {
    id: "research",
    titulo: "Check the evidence behind the idea",
    ruta: "/research",
    tipo: "agent output",
    hacer: "Ask the research analyst a question about the market.",
    notar: "Every claim cites a source id from the verified table below it; it can’t cite anything else.",
  },
  {
    id: "pricing",
    titulo: "See how it would make money",
    ruta: "/pricing",
    tipo: "input",
    hacer: "Move the simulator’s assumptions: sign-ups, conversion, try-ons per person.",
    notar: "Each plan shows what it costs to run, not just its price, and unverified assumptions are labelled.",
  },
  {
    id: "app",
    titulo: "Use the app itself",
    ruta: "/sign-up",
    tipo: "the app",
    hacer: "Create a free account, photograph one garment, and ask for today’s outfits once you have four.",
    notar: "The garment is cataloged from one photo; the stylist only uses clothes you own and today’s real weather.",
  },
  {
    id: "dashboard",
    titulo: "See everything counted",
    ruta: "/dashboard",
    tipo: "saved results",
    hacer: "Open the dashboard after trying the chat.",
    notar: "Real totals from every module, what was flagged and reviewed, and what the AI has cost — no personal data.",
  },
  {
    id: "docs",
    titulo: "See how it was built",
    ruta: "/docs",
    tipo: "how it was built",
    hacer: "Open a prompt in the library and the build log.",
    notar: "The prompts are the exact text production sends to the models.",
  },
];

export type Riesgo = { riesgo: string; guardrail: string; prueba: string; enlace?: string };

/** What could go wrong for a real person, and what stops it. */
export const RIESGOS: Riesgo[] = [
  {
    riesgo: "Fashion talk sliding into diets, weight or body judgments",
    guardrail:
      "A deterministic filter answers first, so the model never sees the question; the model’s own classification catches the rest; every flagged conversation waits for a human review",
    prueba: "src/lib/chat.test.ts · e2e/chat.spec.ts",
    enlace: enGitHub("src/lib/chat.test.ts"),
  },
  {
    riesgo: "Someone in crisis writing to a shopping chat",
    guardrail: "Self-harm gets a fixed answer with Mexico’s crisis line (800 911 2000) and is flagged for review",
    prueba: "src/lib/chat.test.ts",
    enlace: enGitHub("src/lib/chat.test.ts"),
  },
  {
    riesgo: "Private photos of people’s bodies and clothes",
    guardrail:
      "Storage is private; photos are served through short-lived signed links; row-level security on every table, and the public key can read none of the private ones",
    prueba: "e2e/sitio.spec.ts (public key refused)",
    enlace: enGitHub("e2e/sitio.spec.ts"),
  },
  {
    riesgo: "AI presenting invented facts as true",
    guardrail:
      "The research analyst may only cite verified source ids; marketing posts with unverified figures are rejected; the stylist can’t use a garment that isn’t in the closet",
    prueba: "src/lib/ai/research-report.test.ts · src/lib/marketing.test.ts · src/lib/ai/schemas.test.ts",
    enlace: enGitHub("src/lib/marketing.test.ts"),
  },
  {
    riesgo: "A stylist that turns into a salesperson",
    guardrail:
      "Shopping advice only covers real gaps in the closet, relevance comes before any affiliate, and affiliate links are disclosed",
    prueba: "/buy/recommendations disclosure · gaps prompt v2",
    enlace: enGitHub("src/lib/ai/prompts/gaps.ts"),
  },
  {
    riesgo: "Using other people’s images without permission",
    guardrail:
      "Inspiration photos come from Unsplash’s API with the photographer credited and linked; no photo is copied from a store",
    prueba: "src/lib/fotos.test.ts",
    enlace: enGitHub("src/lib/fotos.test.ts"),
  },
  {
    riesgo: "Keeping data that identifies people",
    guardrail:
      "Public pages store a salted hash of the connection, never the IP. Rows written before Week 3 still held raw IPs: found while building the dashboard, removed by migration 016",
    prueba: "supabase/migrations/20261109000016_site_tests.sql",
    enlace: enGitHub("supabase/migrations/20261109000016_site_tests.sql"),
  },
  {
    riesgo: "Costs or abuse running away on public AI pages",
    guardrail:
      "Hourly limits per connection on every public AI page, follow-up caps in the chat, the expensive try-on paid with credits, and a fallback model when the main one is down",
    prueba: "src/lib/ai/fallos.test.ts · src/lib/ai/stylist-respaldo.test.ts",
    enlace: enGitHub("src/lib/ai/fallos.test.ts"),
  },
];

export type Version2 = { idea: string; porque: string };

/** Version 2, each item tied to the evidence that asked for it. */
export const ROADMAP: Version2[] = [
  {
    idea: "Make the stylist’s outfits easier to say yes to",
    porque:
      "Of the outfits people decided on, most were rejected (live on /dashboard). The rejection reasons are already stored; V2 should weigh them before suggesting, not only after.",
  },
  {
    idea: "Pictures everywhere an outfit appears",
    porque:
      "Week 5’s tester 1 expected pictures, and so did Tamara. /chat got them; the signed-in stylist still shows text and the user’s own garment photos only.",
  },
  {
    idea: "Use your own closet in the public chat after signing up",
    porque:
      "Cut from Week 5 for scope. It is the bridge between trying ClosetAI in a minute and using it every morning.",
  },
  {
    idea: "Suggested follow-up questions in the chat",
    porque: "No Week 5 tester asked a follow-up question, although the plan expected it. A blank box doesn’t invite one.",
  },
  {
    idea: "Testers who aren’t friends of the founder",
    porque:
      "Week 5’s three testers used the chat at Tamara’s home. Their scores were all 5/5, which says more about who they are than about the product.",
  },
  {
    idea: "Enough traffic to finish the A/B test",
    porque: "The homepage experiment has too few visitors to call a winner (live on /dashboard).",
  },
  {
    idea: "Automatic deletion of old records",
    porque:
      "Week 6 found raw IPs kept since the first public pages, in Weeks 1 and 2. A retention rule that deletes what is no longer needed would have caught it on its own.",
  },
];

/**
 * The 5-minute video, once Tamara has recorded and narrated it. Until then
 * the page shows no player rather than an empty one.
 */
export const VIDEO_FINAL: { src: string; duracion: string } | null = null;

/**
 * The result of the final full-site regression run against closetai.lat,
 * copied from the run's output on the day it ran. `null` until it has run:
 * the page says so instead of showing a number nobody measured.
 */
export const REGRESION: { pasaron: number; detalle: string } | null = null;
