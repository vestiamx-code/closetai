import { z } from "zod";

/**
 * What ClosetAI's marketing is allowed to say (Week 4).
 *
 * The risk of a post generator is not that it writes badly: it is that it writes,
 * with great confidence, a number nobody verified —"3 out of 4 women don't know
 * what to wear"— and that number ends up on Instagram under ClosetAI's name.
 *
 * So here is the closed list of facts that may be used, each with its source, and
 * a function that checks a text does not carry any figure outside it. It is the
 * same principle as Week 2: the AI only reasons over what a person already checked.
 */

export type DatoVerificado = {
  id: string;
  texto: string;
  fuente: string;
  url?: string;
  /** The figures this fact authorizes writing. */
  cifras: string[];
};

export const DATOS_VERIFICADOS: DatoVerificado[] = [
  {
    id: "mx-compradores",
    texto: "More than 77 million people bought online in Mexico in 2025.",
    fuente: "Milenio, citing AMVO data",
    url: "https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo",
    cifras: ["77", "2025"],
  },
  {
    id: "mx-ropa",
    texto: "59% of people who shop online in Mexico buy clothes.",
    fuente: "Milenio, citing AMVO data",
    url: "https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo",
    cifras: ["59"],
  },
  {
    id: "mx-satisfaccion",
    texto: "Only 35% rated their online fashion shopping experience as very satisfying.",
    fuente: "AMVO",
    url: "https://blog.amvo.org.mx/blog/moda-en-ecommerce-2025-alto-inter%C3%A9s-baja-conversi%C3%B3n",
    cifras: ["35"],
  },
  {
    id: "precio-gratis",
    texto: "The ClosetAI closet is free forever, with 3 AI-generated outfits of the day.",
    fuente: "ClosetAI plans, closetai.lat/pricing",
    cifras: ["3"],
  },
  {
    id: "precio-completo",
    texto: "ClosetAI Complete costs 100 pesos, one time, and includes 30 credits to try clothes on.",
    fuente: "ClosetAI plans, closetai.lat/pricing",
    cifras: ["100", "30"],
  },
  {
    id: "precio-recarga",
    texto: "A top-up costs 49 pesos for 20 credits.",
    fuente: "ClosetAI plans, closetai.lat/pricing",
    cifras: ["49", "20"],
  },
  {
    id: "privacidad",
    texto: "Photos live in a private space, are truly deleted when removed, and ClosetAI sells no data and has no ads.",
    fuente: "Privacy notice, closetai.lat/privacidad",
    cifras: [],
  },
  {
    id: "indyx",
    texto: "In the United States, Indyx charges 295 dollars to catalog 100 garments for you.",
    fuente: "Indyx",
    url: "https://www.myindyx.com/how-it-works",
    cifras: ["295", "100"],
  },
];

/**
 * Numbers that may be used without a fact behind them, because they count things
 * in the text itself —"3 steps", "1 photo"— and claim nothing about the world. It
 * stays small on purpose: a 7 or an 8 already sounds like a statistic.
 */
const CONTADORES = ["1", "2", "3"];

export const CIFRAS_PERMITIDAS = new Set([...DATOS_VERIFICADOS.flatMap((d) => d.cifras), ...CONTADORES]);

/**
 * The figures in a text that do not come from any verified fact.
 *
 * It reads numbers the way a person would: "77 million" is 77, "59 %" is 59,
 * "$100" is 100, "1,267" is 1267. A time ("7:00") or a calendar day is never
 * written in a generated post, so neither is exempted.
 */
export function cifrasInventadas(texto: string): string[] {
  const numeros = texto.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const inventadas = numeros
    .map((n) => {
      // "1,267" and "1.267" are one thousand two hundred; "4.99" is four ninety-nine.
      const sinMiles = /^\d{1,3}([.,]\d{3})+$/.test(n) ? n.replace(/[.,]/g, "") : n.replace(",", ".");
      return String(Number(sinMiles));
    })
    .filter((n) => !CIFRAS_PERMITIDAS.has(n));
  return [...new Set(inventadas)];
}

/** What the model has to return for each post. */
export type PostGenerado = {
  titulo: string;
  cuerpo: string;
  hashtags: string[];
  formato: "post" | "carrusel" | "video";
};

export const CANALES = ["instagram", "tiktok"] as const;
export type Canal = (typeof CANALES)[number];

// ---------------------------------------------------------------------------
// Brand system and persona. They live in code, not in the database, so every
// change stays in git history with who made it and why.
// ---------------------------------------------------------------------------

export const MARCA = {
  nombre: "ClosetAI",
  promesa: "Wear what you already own.",
  colores: [
    { nombre: "Ink", hex: "#241A16", uso: "Text and headlines" },
    { nombre: "Clay", hex: "#8D4526", uso: "The accent: one word per headline, never a whole background" },
    { nombre: "Sand", hex: "#EFE3D6", uso: "Surfaces and cards" },
    { nombre: "Bone", hex: "#FDFAF6", uso: "Background" },
  ],
  tipografias: [
    { nombre: "Fraunces", uso: "Headlines. A serif with character: it reads editorial, not like a generic app" },
    { nombre: "Inter", uso: "Everything else. It stays readable at small sizes on a phone" },
  ],
  voz: {
    si: [
      "Talk like a friend who knows about clothes",
      "Plain, everyday words — say “outfit”, not “capsule wardrobe strategy”",
      "Promise only what the product does today",
      "Give a figure with its source, or no figure at all",
    ],
    no: [
      "Blame people for buying clothes or for not knowing how to combine them",
      "Lead with sustainability: in Mexico, budget matters more",
      "Testimonials, reviews or “thousands of users”: they do not exist yet",
      "Promise style results (“you'll look amazing”)",
    ],
  },
  riesgo:
    "There is already an app called “Closet AI – Outfit Planner” on iPhone and another called “AI Closet” on Google Play. Until the name is settled, marketing always writes “ClosetAI” as one word and never buys ads on the separate words “Closet AI”.",
};

export type Rasgo = { texto: string; tipo: "dato" | "hipotesis"; fuente?: string };

export const PERSONA = {
  nombre: "Sofía",
  resumen: "27, Mexico City, in her second job.",
  aviso:
    "Sofía is a composite person: she does not exist. She is the hypothesis of who ClosetAI is talking to, built from the facts that were verified. Nobody with this profile has been interviewed yet; that is the next conversation.",
  rasgos: [
    { texto: "She shops online, and buys clothes online", tipo: "dato", fuente: "AMVO: 59% of people who shop online buy clothes" },
    { texto: "She is not fully happy with those purchases", tipo: "dato", fuente: "AMVO: only 35% rated the experience as very satisfying" },
    { texto: "She lives on her phone: Instagram to browse, TikTok to learn", tipo: "hipotesis" },
    { texto: "She owns more clothes than she wears and repeats the same outfits out of habit", tipo: "hipotesis", fuente: "Said by the only person interviewed, who is outside this segment" },
    { texto: "Not overspending matters more to her than sustainability", tipo: "hipotesis", fuente: "Master Document §1; no interview confirms it" },
    { texto: "She would not upload a photo with her face to an app she doesn't know", tipo: "hipotesis", fuente: "Said by the person interviewed; that is why the photo validator accepts photos without a face" },
  ] satisfies Rasgo[],
  quiere: "Open her closet in the morning and know what to wear in a minute.",
  frena: "Photographing all her clothes feels like a chore, and she doesn't trust apps that ask for her face.",
};

// ---------------------------------------------------------------------------
// The generator's contract
// ---------------------------------------------------------------------------

export const postGeneradoSchema = z.object({
  titulo: z.string().trim().min(3).max(80),
  cuerpo: z.string().trim().min(40).max(700),
  hashtags: z
    .array(z.string().trim().regex(/^#[\p{L}\p{N}_]+$/u))
    .min(1)
    .max(6),
  formato: z.enum(["post", "carrusel", "video"]),
});

export type RevisionDePost =
  | { ok: true; post: PostGenerado }
  | { ok: false; motivo: "formato" | "cifras"; mensaje: string; cifras?: string[] };

/**
 * Checks a post before showing or saving it. It runs twice: when the model
 * answers, and again on the server when saving, because what arrives to be saved
 * comes from the browser, and the browser can be edited.
 */
export function revisarPost(raw: unknown): RevisionDePost {
  const parseado = postGeneradoSchema.safeParse(typeof raw === "string" ? intentarJson(raw) : raw);
  if (!parseado.success) {
    return { ok: false, motivo: "formato", mensaje: "The post came back incomplete. Please try again." };
  }
  const post = parseado.data;
  const cifras = cifrasInventadas(`${post.titulo} ${post.cuerpo} ${post.hashtags.join(" ")}`);
  if (cifras.length > 0) {
    return {
      ok: false,
      motivo: "cifras",
      cifras,
      mensaje: `The post included ${cifras.length === 1 ? "a figure" : "figures"} that are not in the verified facts (${cifras.join(", ")}), so it is not shown. Please try again.`,
    };
  }
  return { ok: true, post };
}

function intentarJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Export: what can be downloaded from /marketing
// ---------------------------------------------------------------------------

export type Toma = { toma: string; se_ve: string; texto: string; voz: string };

export type Recurso = {
  id: string;
  tipo: "landing" | "post" | "guion" | "dia";
  canal: Canal | null;
  formato: "post" | "carrusel" | "video" | null;
  titulo: string;
  cuerpo: string;
  detalle: {
    laminas?: string[];
    texto?: string;
    hashtags?: string[];
    guion?: string;
    duracion?: string;
    tomas?: Toma[];
    dia?: number;
    pieza?: string;
    para_que?: string;
  };
  origen: "redactado_ia_aprobado" | "generado_ia";
  aprobado: boolean;
  created_at: string;
};

const CANAL_LEGIBLE: Record<Canal, string> = { instagram: "Instagram", tiktok: "TikTok" };

export const canalLegible = (c: Canal | null) => (c ? CANAL_LEGIBLE[c] : "—");

/** Post formats as shown on screen; the stored value stays as it was. */
export const FORMATO_LEGIBLE: Record<PostGenerado["formato"], string> = {
  post: "post",
  carrusel: "carousel",
  video: "video",
};

/** A post's text exactly as it is pasted into the social network. */
export function textoParaPegar(r: Recurso): string {
  const partes = [r.detalle.laminas?.length ? r.detalle.laminas.join("\n\n") : r.cuerpo];
  // In videos the body IS the caption; without this check it was pasted twice.
  if (r.detalle.texto && r.detalle.texto !== partes[0]) partes.push(r.detalle.texto);
  if (r.detalle.hashtags?.length) partes.push(r.detalle.hashtags.join(" "));
  return partes.filter(Boolean).join("\n\n");
}

export function postsMarkdown(posts: Recurso[]): string {
  return [
    "# ClosetAI · Launch posts",
    "",
    ...posts.flatMap((p, i) => [
      `## ${i + 1} · ${canalLegible(p.canal)} · ${p.formato ? FORMATO_LEGIBLE[p.formato] : "post"} — ${p.titulo}`,
      "",
      textoParaPegar(p),
      "",
    ]),
  ].join("\n");
}

export function guionesMarkdown(guiones: Recurso[]): string {
  return [
    "# ClosetAI · Short video scripts",
    "",
    ...guiones.flatMap((g, i) => [
      `## Script ${i + 1} · ${g.titulo} · ${g.detalle.duracion ?? ""}`.trimEnd(),
      "",
      "| Shot | What you see | On-screen text | Voice |",
      "|---|---|---|---|",
      ...(g.detalle.tomas ?? []).map((t) => `| ${t.toma} | ${t.se_ve} | ${t.texto || "—"} | ${t.voz || "—"} |`),
      "",
    ]),
  ].join("\n");
}

/** One CSV cell: quoted if it contains a comma, a quote or a line break. */
function celda(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function calendarioCsv(dias: Recurso[]): string {
  const filas = [...dias]
    .sort((a, b) => (a.detalle.dia ?? 0) - (b.detalle.dia ?? 0))
    .map((d) => [d.detalle.dia ?? "", d.canal ? CANAL_LEGIBLE[d.canal] : "", d.titulo, d.detalle.para_que ?? ""]);
  return [["day", "channel", "piece", "purpose"], ...filas].map((f) => f.map(celda).join(",")).join("\n") + "\n";
}

/**
 * The day the site moved to English (Oct 26, 2026). Public lists of things people
 * generated —posts, style cores, research reports, pricing scenarios— only show
 * what was created after it. Earlier entries are in Spanish; they stay in the
 * database, untouched, but are no longer shown.
 */
export const EN_INGLES_DESDE = "2026-10-26T00:00:00Z";
