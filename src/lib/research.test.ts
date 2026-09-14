import { describe, expect, it } from "vitest";

import {
  datosParaElPrompt,
  filtrarFuentes,
  normalizar,
  resumir,
  riesgoMasAlto,
  type Fuente,
  type Riesgo,
} from "./research";

function fuente(parcial: Partial<Fuente> & Pick<Fuente, "id" | "nombre" | "tipo">): Fuente {
  return {
    pais: null,
    dato_clave: "dato",
    precio: null,
    leccion: null,
    amenaza: null,
    referente_global: false,
    de_mexico: false,
    fuente_nombre: "fuente",
    fuente_url: "https://ejemplo.com",
    fuente_extra_url: null,
    verificado_el: "2026-09-14",
    orden: 0,
    ...parcial,
  };
}

const FUENTES: Fuente[] = [
  fuente({ id: "whering", nombre: "Whering", tipo: "competidor", pais: "Reino Unido", referente_global: true }),
  fuente({ id: "gotrendier", nombre: "GoTrendier", tipo: "sustituto", pais: "México", de_mexico: true }),
  fuente({ id: "google-tryon", nombre: "Try-on de Google", tipo: "sustituto", referente_global: true }),
  fuente({ id: "chicisimo", nombre: "Chicisimo", tipo: "referente", pais: "España" }),
  fuente({ id: "mx-ropa", nombre: "Ropa en línea en México", tipo: "mercado", pais: "México", de_mexico: true }),
];

const riesgo = (id: string, probabilidad: number, impacto: number): Riesgo => ({
  id,
  riesgo: `riesgo ${id}`,
  probabilidad,
  impacto,
  mitigacion: "mitigación",
  evidencia: [],
});

describe("normalizar", () => {
  it("quita acentos y mayúsculas", () => {
    expect(normalizar("  México ")).toBe("mexico");
  });
});

describe("filtrarFuentes", () => {
  it("encuentra «México» escribiendo «mexico», sin la tilde", () => {
    const r = filtrarFuentes(FUENTES, { tipo: "todos", texto: "mexico" });
    expect(r.map((f) => f.id)).toEqual(["gotrendier"]);
  });

  it("nunca mete referentes ni datos de mercado en la tabla, aunque coincidan con la búsqueda", () => {
    // "mx-ropa" dice México y "chicisimo" es referente: ninguno es competidor ni sustituto.
    const ids = filtrarFuentes(FUENTES, { tipo: "todos", texto: "" }).map((f) => f.id);
    expect(ids).toEqual(["whering", "gotrendier", "google-tryon"]);
  });

  it("filtrar por sustituto deja solo sustitutos", () => {
    const r = filtrarFuentes(FUENTES, { tipo: "sustituto", texto: "" });
    expect(new Set(r.map((f) => f.tipo))).toEqual(new Set(["sustituto"]));
    expect(r).toHaveLength(2);
  });

  it("devuelve una lista vacía cuando nada coincide, en vez de ignorar la búsqueda", () => {
    expect(filtrarFuentes(FUENTES, { tipo: "todos", texto: "zzz-no-existe" })).toEqual([]);
  });
});

describe("riesgoMasAlto", () => {
  it("elige el de mayor probabilidad × impacto", () => {
    expect(riesgoMasAlto([riesgo("a", 2, 2), riesgo("b", 3, 3), riesgo("c", 3, 2)])?.id).toBe("b");
  });

  it("en empate se queda con el primero", () => {
    expect(riesgoMasAlto([riesgo("a", 3, 2), riesgo("b", 2, 3)])?.id).toBe("a");
  });

  it("sin riesgos no inventa uno", () => {
    expect(riesgoMasAlto([])).toBeNull();
  });
});

describe("resumir", () => {
  it("cuenta desde las filas, no desde constantes", () => {
    const r = resumir(FUENTES, [riesgo("a", 1, 1)], 0, 4);
    expect(r).toMatchObject({
      competidores: 1,
      sustitutos: 2,
      referentesGlobales: 2,
      datosMexico: 2,
      riesgos: 1,
      validaciones: 0,
      informes: 4,
    });
  });
});

describe("datosParaElPrompt", () => {
  it("pone el id de cada fuente entre corchetes", () => {
    const texto = datosParaElPrompt(FUENTES, []);
    for (const f of FUENTES) expect(texto).toContain(`[${f.id}]`);
  });

  it("no le pone corchetes a los riesgos: no son fuentes y el modelo los citaría", () => {
    const texto = datosParaElPrompt([], [{ riesgo: "Nadie paga", probabilidad: 2, impacto: 3, evidencia: ["stylebook"] }]);
    expect(texto).toContain("Nadie paga");
    expect(texto).not.toMatch(/\[[a-z0-9-]+\]/);
  });
});
