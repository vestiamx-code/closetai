import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { MUESTRA_MINIMA, resultado, varianteDe } from "./ab";

/**
 * Las dos pruebas A/B de la Semana 4.
 *
 * Un experimento puede fallar de dos maneras que no se ven en la pantalla: que
 * reparta mal a los visitantes, o que anuncie un ganador que es pura suerte.
 * Cada prueba cuida una.
 */

describe("Prueba A/B 1 · la asignación", () => {
  it("el mismo visitante ve siempre la misma variante, y 10,000 visitantes se reparten casi a la mitad", () => {
    const visitante = randomUUID();
    const primera = varianteDe(visitante, "titular");
    for (let i = 0; i < 50; i++) {
      expect(varianteDe(visitante, "titular")).toBe(primera);
    }

    let a = 0;
    const total = 10_000;
    for (let i = 0; i < total; i++) {
      if (varianteDe(randomUUID(), "titular") === "a") a++;
    }
    // Con 10,000 visitantes, una moneda justa cae entre 48% y 52% más del
    // 99.99% de las veces. Si sale de ahí, el hash está sesgado.
    expect(a / total).toBeGreaterThan(0.48);
    expect(a / total).toBeLessThan(0.52);
  });

  it("dos experimentos simultáneos son independientes entre sí", () => {
    // Si el titular y el botón usaran la misma asignación, quien ve un titular
    // vería siempre el mismo botón, y no se podría separar un efecto del otro.
    let coinciden = 0;
    const total = 10_000;
    for (let i = 0; i < total; i++) {
      const v = randomUUID();
      if (varianteDe(v, "titular") === varianteDe(v, "boton")) coinciden++;
    }
    expect(coinciden / total).toBeGreaterThan(0.47);
    expect(coinciden / total).toBeLessThan(0.53);
  });
});

describe("Prueba A/B 2 · el ganador", () => {
  it("con poca muestra no hay ganador, aunque la diferencia se vea enorme", () => {
    // 10% contra 40%: parece decisivo, pero con 30 visitantes por lado no lo es.
    const r = resultado({ vistas: 30, clics: 3 }, { vistas: 30, clics: 12 });
    expect(r.ganador).toBeNull();
    expect(r.p).toBeNull();
    expect(r.motivo).toMatch(/faltan 70 visitantes/);
  });

  it("con muestra suficiente pero diferencia chica, tampoco", () => {
    const r = resultado({ vistas: 500, clics: 50 }, { vistas: 500, clics: 56 });
    expect(r.ganador).toBeNull();
    expect(r.p).toBeGreaterThan(0.05);
  });

  it("con muestra suficiente y diferencia real, gana la variante correcta", () => {
    // 10% contra 20% con 500 visitantes por lado: p ≈ 0.00001.
    const r = resultado({ vistas: 500, clics: 50 }, { vistas: 500, clics: 100 });
    expect(r.ganador).toBe("b");
    expect(r.p).toBeLessThan(0.001);

    // Y al revés, gana A: el signo de la diferencia no se pierde.
    const alReves = resultado({ vistas: 500, clics: 100 }, { vistas: 500, clics: 50 });
    expect(alReves.ganador).toBe("a");
  });

  it("el valor p coincide con la prueba z calculada a mano", () => {
    // 120/1000 contra 150/1000. Proporción combinada 0.135; error
    // sqrt(0.135 · 0.865 · 0.002) = 0.015283; z = 0.03 / 0.015283 = 1.963;
    // p de dos colas = 0.0497. Justo por debajo de 0.05.
    const r = resultado({ vistas: 1000, clics: 120 }, { vistas: 1000, clics: 150 });
    expect(r.z!).toBeCloseTo(1.963, 2);
    expect(r.p!).toBeCloseTo(0.0497, 3);
    expect(r.ganador).toBe("b");
  });

  it("el mínimo de muestra es el que dice la página", () => {
    expect(MUESTRA_MINIMA).toBe(100);
    const justo = resultado({ vistas: 100, clics: 10 }, { vistas: 99, clics: 30 });
    expect(justo.ganador).toBeNull();
  });
});
