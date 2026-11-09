import { describe, expect, it } from "vitest";

import { costosPorOperacion, dolares, porcentaje, resumenAB, resumenChat, resumenOutfits } from "./tablero";

describe("/dashboard maths", () => {
  it("never divides by zero: an empty table shows no percentage, not 0% or NaN", () => {
    expect(porcentaje(0, 0)).toBeNull();
    expect(porcentaje(3, 0)).toBeNull();
    expect(porcentaje(1, 3)).toBe(33);
    expect(porcentaje(2, 3)).toBe(67);
    expect(resumenChat([], []).utiles).toBeNull();
    expect(resumenOutfits([]).tasaAceptacion).toBeNull();
    expect(resumenAB([]).a.conversion).toBeNull();
  });

  it("leaves test conversations out of every chat total", () => {
    const r = resumenChat(
      [
        { es_prueba: false, needs_review: true, revisado_at: "2026-11-04" },
        { es_prueba: false, needs_review: true, revisado_at: null },
        { es_prueba: false, needs_review: false, revisado_at: null },
        { es_prueba: true, needs_review: true, revisado_at: null },
        { es_prueba: true, needs_review: false, revisado_at: null },
      ],
      [1, 1, 1, -1],
    );
    expect(r).toEqual({ conversaciones: 3, marcadas: 2, revisadas: 1, pendientes: 1, arriba: 3, abajo: 1, utiles: 75 });
  });

  it("groups the AI spend by operation, most expensive first, and skips bad amounts", () => {
    const c = costosPorOperacion([
      { operation: "chat_reply", est_cost_usd: "0.0002" },
      { operation: "tryon", est_cost_usd: 0.075 },
      { operation: "chat_reply", est_cost_usd: 0.0002 },
      { operation: "tryon", est_cost_usd: "0.075" },
      { operation: "new_thing", est_cost_usd: 0.01 },
      { operation: "tryon", est_cost_usd: null },
      { operation: "tryon", est_cost_usd: "not a number" },
      { operation: "tryon", est_cost_usd: -1 },
    ]);
    expect(c.filas.map((f) => f.operacion)).toEqual(["tryon", "new_thing", "chat_reply"]);
    expect(c.filas[0]).toMatchObject({ nombre: "Virtual try-on", llamadas: 3 });
    expect(c.filas[0].usd).toBeCloseTo(0.15);
    // An operation the page doesn't know yet still shows, readably.
    expect(c.filas[1].nombre).toBe("new thing");
    // `null` counts as $0 for a call that happened; NaN and negatives are dropped.
    expect(c.llamadas).toBe(6);
    expect(c.total).toBeCloseTo(0.1604);
  });

  it("counts favourites and worn outfits as accepted", () => {
    expect(resumenOutfits(["accepted", "favorite", "worn", "rejected", "suggested"])).toEqual({
      sugeridos: 5,
      aceptados: 3,
      rechazados: 1,
      tasaAceptacion: 75,
    });
  });

  it("splits the A/B experiment by variant", () => {
    const r = resumenAB([
      { variante: "a", evento: "vista" },
      { variante: "a", evento: "vista" },
      { variante: "a", evento: "clic" },
      { variante: "b", evento: "vista" },
    ]);
    expect(r).toEqual({ a: { vistas: 2, clics: 1, conversion: 50 }, b: { vistas: 1, clics: 0, conversion: 0 } });
  });

  it("formats fractions of a cent so they don't read as $0.00", () => {
    expect(dolares(0.6726)).toBe("$0.67");
    expect(dolares(0.0106)).toBe("$0.0106");
    expect(dolares(0)).toBe("$0.00");
    expect(dolares(Number.NaN)).toBe("$0.00");
  });
});
