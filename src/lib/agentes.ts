import { AVATAR_PROMPT, AVATAR_PROMPT_VERSION } from "@/lib/ai/prompts/avatar";
import { CATALOG_GARMENT_PROMPT, CATALOG_GARMENT_PROMPT_VERSION } from "@/lib/ai/prompts/catalog-garment";
import { CHAT_PROMPT, CHAT_PROMPT_VERSION } from "@/lib/ai/prompts/chat";
import { CORE_PROMPT, CORE_PROMPT_VERSION } from "@/lib/ai/prompts/core";
import { GAPS_PROMPT, GAPS_PROMPT_VERSION } from "@/lib/ai/prompts/gaps";
import { MARKETING_PROMPT, MARKETING_PROMPT_VERSION } from "@/lib/ai/prompts/marketing";
import { RESEARCH_PROMPT, RESEARCH_PROMPT_VERSION } from "@/lib/ai/prompts/research";
import {
  PROFILE_PROMPT,
  PROFILE_PROMPT_VERSION,
  STYLIST_PROMPT,
  STYLIST_PROMPT_VERSION,
} from "@/lib/ai/prompts/stylist";

/**
 * Every AI agent ClosetAI runs in production, described once (Week 6).
 *
 * `/demo` draws the agent map from this list and `/docs` builds the prompt
 * library from it. The prompt text is imported from the same files the agents
 * send to the model, so neither page can show a prompt that production doesn't
 * use, or miss one it does (src/lib/agentes.test.ts checks it).
 */
export type Agente = {
  id: string;
  nombre: string;
  /** Where it lives: the signed-in app or the public site. */
  donde: "app" | "publico";
  semana: string;
  ruta: string;
  entrada: string;
  salida: string;
  modelo: string;
  /** What stops it from doing harm or making things up. */
  guardrail: string;
  /** Where a person decides, not the model. */
  humano: string;
  prompt: { texto: string; version: number; archivo: string } | null;
};

const FLASH = "Gemini 3.5 Flash";
const FLASH_LITE = "Gemini 3.5 Flash-Lite";

export const AGENTES: Agente[] = [
  {
    id: "catalogador",
    nombre: "Cataloger",
    donde: "app",
    semana: "Week 0",
    ruta: "/closet/add",
    entrada: "One photo of a garment",
    salida: "Category, colors, pattern, season and formality, plus a clean cut-out",
    modelo: `${FLASH_LITE} (vision) + fal.ai BiRefNet (cut-out)`,
    guardrail: "A JSON schema imposed on the model and a zod contract; anything that doesn't fit is rejected, never saved half-made",
    humano: "She can correct the category the model chose; each correction is recorded",
    prompt: { texto: CATALOG_GARMENT_PROMPT, version: CATALOG_GARMENT_PROMPT_VERSION, archivo: "catalog-garment.ts" },
  },
  {
    id: "estilista",
    nombre: "Stylist",
    donde: "app",
    semana: "Week 0",
    ruta: "/today",
    entrada: "Her closet, today's real weather, her style profile and recent rejections",
    salida: "Three outfits with the reason each one works",
    modelo: `${FLASH}, ${FLASH_LITE} as fallback`,
    guardrail: "Every garment id must exist in her closet: an outfit with an invented garment is dropped",
    humano: "She accepts or rejects each outfit, with a reason",
    prompt: { texto: STYLIST_PROMPT, version: STYLIST_PROMPT_VERSION, archivo: "stylist.ts" },
  },
  {
    id: "aprendizaje",
    nombre: "Learning engine",
    donde: "app",
    semana: "Week 0",
    ruta: "/style",
    entrada: "Her accepted and rejected outfits",
    salida: "A style profile: what she likes and avoids",
    modelo: FLASH,
    guardrail: "Below a minimum of feedback it says it doesn't know her yet instead of guessing",
    humano: "She sees what it learned and can correct it",
    prompt: { texto: PROFILE_PROMPT, version: PROFILE_PROMPT_VERSION, archivo: "stylist.ts" },
  },
  {
    id: "compras",
    nombre: "Shopping advisor",
    donde: "app",
    semana: "Week 0",
    ruta: "/buy/recommendations",
    entrada: "Her closet and style profile",
    salida: "The few garments that would unlock the most new outfits",
    modelo: FLASH,
    guardrail: "Conservative by design: only real gaps, relevance before the affiliate, affiliate links disclosed",
    humano: "She decides whether to buy anything; nothing is bought for her",
    prompt: { texto: GAPS_PROMPT, version: GAPS_PROMPT_VERSION, archivo: "gaps.ts" },
  },
  {
    id: "validador",
    nombre: "Photo validator",
    donde: "app",
    semana: "Week 0",
    ruta: "/try-on",
    entrada: "Her full-body base photo",
    salida: "Accept or reject, with the reason",
    modelo: `${FLASH_LITE} (vision)`,
    guardrail: "When in doubt, or if the model fails, it rejects: no credit is spent on a bad photo",
    humano: "She chooses which photo to upload and can replace it",
    prompt: { texto: AVATAR_PROMPT, version: AVATAR_PROMPT_VERSION, archivo: "avatar.ts" },
  },
  {
    id: "probador",
    nombre: "Try-on renderer",
    donde: "app",
    semana: "Week 0",
    ruta: "/try-on",
    entrada: "Her validated base photo and a garment",
    salida: "An image of her wearing it",
    modelo: "fal.ai FASHN v1.6 (image model, no text prompt)",
    guardrail: "Only runs on a photo the validator accepted; photos are private and served by short-lived signed URLs",
    humano: "She starts each try-on and pays with her own credits",
    prompt: null,
  },
  {
    id: "investigacion",
    nombre: "Research analyst",
    donde: "publico",
    semana: "Week 2",
    ruta: "/research",
    entrada: "A question about the market",
    salida: "An answer citing only verified sources",
    modelo: `${FLASH}, ${FLASH_LITE} as fallback`,
    guardrail: "It may only cite the source ids it was given; an answer with an invented source is rejected",
    humano: "The sources were found and verified by Tamara, not by the model",
    prompt: { texto: RESEARCH_PROMPT, version: RESEARCH_PROMPT_VERSION, archivo: "research.ts" },
  },
  {
    id: "nucleo",
    nombre: "Style core extractor",
    donde: "publico",
    semana: "Week 1",
    ruta: "/core",
    entrada: "How someone describes the way they dress, in their own words",
    salida: "A structured style core: palette, silhouettes, rules",
    modelo: `${FLASH}, ${FLASH_LITE} as fallback`,
    guardrail: "Rate-limited per connection; nothing is saved unless the person chooses to save it",
    humano: "The person decides whether to keep the result",
    prompt: { texto: CORE_PROMPT, version: CORE_PROMPT_VERSION, archivo: "core.ts" },
  },
  {
    id: "marketing",
    nombre: "Marketing copywriter",
    donde: "publico",
    semana: "Week 4",
    ruta: "/marketing",
    entrada: "A topic and a channel",
    salida: "A post with hook, body and call to action",
    modelo: `${FLASH}, ${FLASH_LITE} as fallback`,
    guardrail: "A post with invented figures or promises is rejected before anyone sees it",
    humano: "Nothing is published automatically: every post is saved unapproved until Tamara approves it",
    prompt: { texto: MARKETING_PROMPT, version: MARKETING_PROMPT_VERSION, archivo: "marketing.ts" },
  },
  {
    id: "chat",
    nombre: "Public stylist chat",
    donde: "publico",
    semana: "Week 5",
    ruta: "/chat",
    entrada: "Four guided answers: section, occasion, weather, style",
    salida: "One outfit card with photos and store links",
    modelo: `${FLASH_LITE}, ${FLASH} as fallback`,
    guardrail: "Two layers: a deterministic filter for diets, weight, bodies and self-harm that the model never sees, then the model's own classification",
    humano: "Every flagged conversation waits in /admin until Tamara marks it reviewed",
    prompt: { texto: CHAT_PROMPT, version: CHAT_PROMPT_VERSION, archivo: "chat.ts" },
  },
];

/** The prompt library: every agent with a text prompt. */
export const PROMPTS = AGENTES.flatMap((a) => (a.prompt ? [{ agente: a, ...a.prompt }] : []));
