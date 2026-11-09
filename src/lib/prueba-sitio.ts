import { z } from "zod";

import { PASOS } from "@/lib/demo";

/**
 * The full-site test (Week 6): testers 4 and 5 walk the whole site from
 * /demo?test=4 or ?test=5 and leave a summary. Testers 1–3 were Week 5's,
 * in /chat. Pure, so the contract is tested without a database.
 */

export type TesterSitio = 4 | 5;

/** Tester links are /demo?test=4 or 5. Anything else is a regular visit. */
export function testerSitioDe(valor: string | string[] | undefined): TesterSitio | null {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return v === "4" || v === "5" ? (Number(v) as TesterSitio) : null;
}

const IDS_PASOS = PASOS.map((p) => p.id) as [string, ...string[]];

export const LO_USARIA = [
  { valor: "si", texto: "Yes" },
  { valor: "tal_vez", texto: "Maybe" },
  { valor: "no", texto: "No" },
] as const;

export const pruebaSitioSchema = z.object({
  tester: z.coerce.number().int().refine((n) => n === 4 || n === 5, "This isn’t a tester link."),
  // A checkbox sends "on"; without it there is no consent and nothing is saved.
  consentimiento: z.literal("on", { error: "Please accept the consent first." }),
  paginas: z
    .array(z.enum(IDS_PASOS))
    .min(1, "Tick at least one step you tried.")
    .max(PASOS.length)
    .transform((p) => [...new Set(p)]),
  funciono: z.string().trim().min(3, "Tell us what worked, in a few words.").max(800),
  confuso: z.string().trim().max(800).default(""),
  puntaje: z.coerce.number().int().min(1, "Choose a score from 1 to 5.").max(5, "Choose a score from 1 to 5."),
  lo_usaria: z.enum(["si", "tal_vez", "no"], { error: "Tell us whether you would use it." }),
});

export type PruebaSitio = z.infer<typeof pruebaSitioSchema>;

/** Reads the form into the shape the schema expects (steps arrive as repeated fields). */
export function leerFormulario(fd: FormData) {
  return {
    tester: fd.get("tester"),
    consentimiento: fd.get("consentimiento") ?? undefined,
    paginas: fd.getAll("paginas").map(String),
    funciono: fd.get("funciono") ?? "",
    confuso: fd.get("confuso") ?? "",
    puntaje: fd.get("puntaje"),
    lo_usaria: fd.get("lo_usaria") ?? undefined,
  };
}
