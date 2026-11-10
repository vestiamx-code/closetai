import { describe, expect, it } from "vitest";

import { esVistaPrevia, leerFormulario, pruebaSitioSchema, testerSitioDe } from "./prueba-sitio";

function formulario(campos: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) for (const x of [v].flat()) fd.append(k, x);
  return pruebaSitioSchema.safeParse(leerFormulario(fd));
}

const valido = {
  tester: "4",
  consentimiento: "on",
  paginas: ["chat", "guardrail", "dashboard"],
  funciono: "The chat understood me",
  confuso: "",
  puntaje: "4",
  lo_usaria: "tal_vez",
};

describe("full-site tester summary", () => {
  it("only tester links 4 and 5 count; 1–3 are Week 5’s chat links", () => {
    expect(testerSitioDe("4")).toBe(4);
    expect(testerSitioDe(["5"])).toBe(5);
    for (const v of ["1", "3", "6", "0", "4.0", "", undefined]) expect(testerSitioDe(v)).toBeNull();
  });

  it("the preview link is Tamara's own: it isn't a tester, and its summary can only be marked as a test", () => {
    expect(esVistaPrevia("preview")).toBe(true);
    expect(testerSitioDe("preview")).toBeNull();
    expect(formulario({ ...valido, vista_previa: "1" }).data?.vista_previa).toBe("1");
    expect(formulario(valido).data?.vista_previa).toBeUndefined();
    expect(formulario({ ...valido, vista_previa: "0" }).success).toBe(false);
  });

  it("accepts a complete summary and keeps the steps that were ticked", () => {
    const r = formulario(valido);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ tester: 4, paginas: ["chat", "guardrail", "dashboard"], puntaje: 4, lo_usaria: "tal_vez" });
  });

  it("saves nothing without consent", () => {
    const { consentimiento: _, ...sin } = valido;
    const r = formulario(sin);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Please accept the consent first.");
  });

  it("refuses a tester number that isn't 4 or 5, even if the page was tampered with", () => {
    expect(formulario({ ...valido, tester: "2" }).success).toBe(false);
    expect(formulario({ ...valido, tester: "9" }).success).toBe(false);
  });

  it("needs at least one real step, and drops repeated ones", () => {
    expect(formulario({ ...valido, paginas: [] }).success).toBe(false);
    expect(formulario({ ...valido, paginas: ["chat", "admin"] }).success).toBe(false);
    expect(formulario({ ...valido, paginas: ["chat", "chat"] }).data?.paginas).toEqual(["chat"]);
  });

  it("needs a score from 1 to 5, an answer to 'would you use it', and a few words on what worked", () => {
    expect(formulario({ ...valido, puntaje: "0" }).success).toBe(false);
    expect(formulario({ ...valido, puntaje: "6" }).success).toBe(false);
    expect(formulario({ ...valido, lo_usaria: "definitely" }).success).toBe(false);
    expect(formulario({ ...valido, funciono: "  ok " }).success).toBe(false);
    expect(formulario({ ...valido, funciono: "x".repeat(801) }).success).toBe(false);
  });
});
