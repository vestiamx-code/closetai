import { z } from "zod";

/**
 * `/chat` — Week 5. The guided "What should I wear?" assistant.
 *
 * Everything here is pure: the intake questions, the deterministic guardrail,
 * the fixed answers it gives, and the contract the model's reply must meet.
 * The Server Actions in `src/app/chat/actions.ts` only put these together.
 */

// --------------------------------------------------------------------- intake

export type PreguntaId = "ocasion" | "clima" | "estilo";

export type Sugerencia = { texto: string; icono: string };

export type Pregunta = {
  id: PreguntaId;
  /** The step's name in the progress bar. */
  paso: string;
  texto: string;
  sugerencias: Sugerencia[];
  ejemplo: string;
};

/** The three questions, in the order they are asked. */
export const PREGUNTAS: Pregunta[] = [
  {
    id: "ocasion",
    paso: "Occasion",
    texto: "What’s the occasion?",
    sugerencias: [
      { texto: "Work", icono: "💼" },
      { texto: "A date", icono: "🍷" },
      { texto: "Weekend plans", icono: "☀️" },
      { texto: "A wedding", icono: "💍" },
      { texto: "A night out", icono: "✨" },
    ],
    ejemplo: "e.g. a job interview",
  },
  {
    id: "clima",
    paso: "Weather",
    texto: "Where are you, and what’s the weather like?",
    sugerencias: [
      { texto: "Mexico City, cool", icono: "🌤️" },
      { texto: "Hot and sunny", icono: "🔆" },
      { texto: "Rainy", icono: "🌧️" },
      { texto: "Cold", icono: "❄️" },
    ],
    ejemplo: "e.g. Monterrey, very hot",
  },
  {
    id: "estilo",
    paso: "Style",
    texto: "How do you like to dress?",
    sugerencias: [
      { texto: "Comfortable", icono: "🧶" },
      { texto: "Minimal", icono: "🤍" },
      { texto: "Elegant", icono: "🖤" },
      { texto: "Bold", icono: "🔥" },
      { texto: "Sporty", icono: "👟" },
    ],
    ejemplo: "e.g. comfortable but put together",
  },
];

export type Intake = Record<PreguntaId, string>;

/** A free-text intake answer: short, and never empty. */
export const respuestaIntakeSchema = z
  .string()
  .trim()
  .min(2, "Write a few words.")
  .max(120, "Keep it under 120 characters.");

export const intakeSchema = z.object({
  ocasion: respuestaIntakeSchema,
  clima: respuestaIntakeSchema,
  estilo: respuestaIntakeSchema,
});

/** Follow-up questions allowed after the first suggestion. */
export const SEGUIMIENTOS_MAXIMOS = 4;
/** New conversations allowed per connection per hour. */
export const CONVERSACIONES_POR_HORA = 10;

export const mensajeSchema = z
  .string()
  .trim()
  .min(2, "Write a few words.")
  .max(400, "Keep it under 400 characters.");

// ------------------------------------------------------------------ guardrail

export type MotivoGuardrail =
  | "dieta"
  | "cuerpo"
  | "salud"
  | "autolesion"
  | "datos_personales"
  | "fuera_de_tema"
  | "sensible";

/** Lowercase and without accents, so "dieta" and "díeta" are the same word. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'"); // phones type curly apostrophes: "I’m"
}

/**
 * Patterns that never reach the model. The list is narrow on purpose: it
 * catches what is unambiguous, in English and Spanish, and leaves the nuanced
 * cases ("is this flattering?") to the model's own classification. A wide list
 * would block ordinary fashion questions, and a guardrail that refuses "jeans
 * that fit well" teaches people to stop using the chat.
 *
 * Order matters: self-harm is checked first, because its answer is the only
 * one that has to say more than "I can't help with that".
 */
const PATRONES: Array<[MotivoGuardrail, RegExp[]]> = [
  [
    "autolesion",
    [
      /\b(kill|hurt|harm)\s+myself\b/,
      /\bself[\s-]?harm/,
      /\bsuicid/,
      /\bwant\s+to\s+die\b/,
      /\b(matarme|suicidarme|lastimarme|cortarme)\b/,
      /\bquitarme\s+la\s+vida\b/,
      /\bhacerme\s+dano\b/,
      /\bno\s+quiero\s+vivir\b/,
    ],
  ],
  [
    "dieta",
    [
      /\bdiet(s|ing)?\b/,
      /\b(lose|losing|drop|dropping)\s+(\d+\s*)?(weight|kilos?|kg|pounds?|lbs?)\b/,
      /\bweight\s+loss\b/,
      /\bcalories?\b/,
      /\bfasting\b/,
      /\bdietas?\b/,
      /\b(baj\w*|perd\w*|pierd\w*)\s+(de\s+)?(peso|\d+\s*kilos?|kilos?)\b/, // bajar, bajo, pierdo…
      /\badelgazar\b/,
      /\bcalorias?\b/,
      /\bayuno\b/,
    ],
  ],
  [
    "cuerpo",
    [
      /\b(i('| a)?m|i look|look|looks|so|too)\s+(fat|ugly|gross|disgusting)\b/,
      /\bmy\s+(fat|ugly)\b/,
      /\b(estoy|me veo|soy|muy)\s+(gorda|gordo|fea|feo|asquerosa)\b/,
    ],
  ],
  [
    "salud",
    [
      /\b(medication|medicine|pills?|prescription|diagnos\w*)\b/,
      /\b(medicamentos?|pastillas?|receta medica|diagnostic\w*)\b/,
    ],
  ],
  [
    "datos_personales",
    [
      /[\w.+-]+@[\w-]+\.[\w.-]+/, // an email address
      /(\+?\d[\s-]?){10,}/, // a phone or card number
      /\b(password|contrasena)\b/,
    ],
  ],
];

/** `null` when the message can go to the model; otherwise, why it can't. */
export function revisarMensaje(texto: string): { motivo: MotivoGuardrail } | null {
  const t = normalizar(texto);
  for (const [motivo, patrones] of PATRONES) {
    if (patrones.some((p) => p.test(t))) return { motivo };
  }
  return null;
}

/** Mexico's national crisis line (Línea de la Vida), free and 24 hours. */
export const LINEA_DE_CRISIS = "800 911 2000";

/**
 * What the assistant says instead of a model answer. Calm, short, never a
 * lecture, and always honest that a person will look at the conversation.
 */
export const RESPUESTA_GUARDRAIL: Record<MotivoGuardrail, string> = {
  autolesion: `I’m really sorry you’re feeling this way. I’m a clothing assistant and I can’t help with this, but you don’t have to go through it alone. In Mexico you can call Línea de la Vida at ${LINEA_DE_CRISIS}, free and 24 hours a day, or 911 if you are in danger. A person from ClosetAI will review this conversation.`,
  dieta:
    "That’s not something I can help with: I don’t give advice on diets or weight. I can help you find an outfit you feel good in, as you are today. A person from ClosetAI will review this conversation.",
  cuerpo:
    "I don’t judge bodies, and I won’t start now. If you tell me the occasion and what you like to wear, I’ll suggest something that works for you. A person from ClosetAI will review this conversation.",
  salud:
    "I can’t help with health or medical questions. Please ask a doctor. I can help with what to wear. A person from ClosetAI will review this conversation.",
  datos_personales:
    "Please don’t share personal details like emails, phone numbers or passwords here. I don’t need them to suggest an outfit. A person from ClosetAI will review this conversation.",
  fuera_de_tema:
    "I only talk about clothes and what to wear. Ask me about an outfit and I’ll help. A person from ClosetAI will review this conversation.",
  sensible:
    "That’s not something I can help with. I can suggest what to wear for an occasion. A person from ClosetAI will review this conversation.",
};

/** Labels for the review list in /admin. */
export const NOMBRE_MOTIVO: Record<MotivoGuardrail, string> = {
  autolesion: "self-harm",
  dieta: "diet",
  cuerpo: "body judgment",
  salud: "health",
  datos_personales: "personal data",
  fuera_de_tema: "off topic",
  sensible: "sensitive",
};

// --------------------------------------------------------- the model's answer

export const respuestaModeloSchema = z.object({
  /** The model classifies the message too: the second layer of the guardrail. */
  clasificacion: z.enum(["on_topic", "off_topic", "sensitive"]),
  respuesta: z.string().trim().min(1).max(700),
  outfit: z
    .object({
      titulo: z.string().trim().min(1).max(80),
      prendas: z.array(z.string().trim().min(1).max(80)).min(2).max(5),
      tip: z.string().trim().min(1).max(240),
    })
    .nullable()
    .optional(),
});

export type RespuestaModelo = z.infer<typeof respuestaModeloSchema>;

export type ResultadoRespuesta =
  | { ok: true; respuesta: RespuestaModelo }
  | { ok: false; motivo: string };

/**
 * Reads the model's reply. The first answer of a conversation must bring an
 * outfit: that is the whole point of the intake. A follow-up may answer in
 * words only ("yes, sneakers work too").
 */
export function leerRespuestaModelo(raw: string, esPrimera: boolean): ResultadoRespuesta {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, motivo: "the model did not return JSON" };
  }
  const r = respuestaModeloSchema.safeParse(json);
  if (!r.success) return { ok: false, motivo: "the answer did not match the contract" };
  if (esPrimera && r.data.clasificacion === "on_topic" && !r.data.outfit) {
    return { ok: false, motivo: "the first answer came without an outfit" };
  }
  return { ok: true, respuesta: r.data };
}

/** The model's classification, translated into a guardrail reason, if any. */
export function motivoDeClasificacion(c: RespuestaModelo["clasificacion"]): MotivoGuardrail | null {
  if (c === "off_topic") return "fuera_de_tema";
  if (c === "sensitive") return "sensible";
  return null;
}

// -------------------------------------------------------------- test summary

export const resumenSchema = z.object({
  tester: z.coerce.number().int().min(1).max(3),
  funciono: z.string().trim().min(3, "Tell us what worked, in a few words.").max(600),
  confuso: z.string().trim().max(600).default(""),
  puntaje: z.coerce.number().int().min(1).max(5),
});

/** Tester links are /chat?test=1, 2 or 3. Anything else is a regular visit. */
export function testerDe(valor: string | string[] | undefined): 1 | 2 | 3 | null {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return v === "1" || v === "2" || v === "3" ? (Number(v) as 1 | 2 | 3) : null;
}
