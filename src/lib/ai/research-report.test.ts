import { describe, expect, it } from "vitest";

import { parseResearchReport } from "./schemas";

const IDS = new Set(["whering", "stylebook", "style-dna", "indyx", "gotrendier"]);

const informeValido = {
  respuesta: "Sí hay quien paga: Stylebook cobra una sola vez y Style DNA tiene suscriptores de pago.",
  hallazgos: [
    { afirmacion: "Stylebook cobra $4.99 USD una sola vez.", fuentes: ["stylebook"] },
    { afirmacion: "Style DNA tiene 70 mil suscriptores de pago.", fuentes: ["style-dna"] },
  ],
  hueco: "Un pago único en pesos mexicanos.",
  riesgo: "Que en México nadie pague.",
  falta_validar: "Si una persona en México pagaría $100 MXN: preguntarlo en una conversación real.",
  suficiente: true,
};

describe("parseResearchReport", () => {
  it("acepta un informe cuyas citas existen en los datos", () => {
    const r = parseResearchReport(JSON.stringify(informeValido), IDS);
    expect(r.ok).toBe(true);
  });

  it("rechaza el informe entero si cita una fuente que no está verificada", () => {
    const inventado = {
      ...informeValido,
      hallazgos: [...informeValido.hallazgos, { afirmacion: "Pinterest tiene 20 M de usuarios en México.", fuentes: ["pinterest"] }],
    };
    const r = parseResearchReport(JSON.stringify(inventado), IDS);
    expect(r).toMatchObject({ ok: false, reason: "invented_source" });
    expect(r.ok ? "" : r.message).toContain("pinterest");
  });

  it("rechaza una afirmación sin fuente", () => {
    const sinFuente = { ...informeValido, hallazgos: [{ afirmacion: "La gente paga.", fuentes: [] }] };
    expect(parseResearchReport(JSON.stringify(sinFuente), IDS)).toMatchObject({ ok: false, reason: "unparseable" });
  });

  it("acepta que los datos no alcancen: sin hallazgos y diciendo qué falta", () => {
    const insuficiente = { ...informeValido, hallazgos: [], hueco: "", riesgo: "", suficiente: false };
    expect(parseResearchReport(JSON.stringify(insuficiente), IDS).ok).toBe(true);
  });

  it("rechaza un informe que dice tener evidencia suficiente pero no trae ningún hallazgo", () => {
    const vacio = { ...informeValido, hallazgos: [], suficiente: true };
    expect(parseResearchReport(JSON.stringify(vacio), IDS)).toMatchObject({ ok: false, reason: "unparseable" });
  });

  it("distingue el rechazo del modelo de un error de formato", () => {
    const r = parseResearchReport(JSON.stringify({ error: "Eso no es una pregunta de mercado." }), IDS);
    expect(r).toMatchObject({ ok: false, reason: "rejected" });
  });

  it("desenvuelve un arreglo de un solo informe, y rechaza varios", () => {
    expect(parseResearchReport(JSON.stringify([informeValido]), IDS).ok).toBe(true);
    expect(parseResearchReport(JSON.stringify([informeValido, informeValido]), IDS).ok).toBe(false);
  });
});
