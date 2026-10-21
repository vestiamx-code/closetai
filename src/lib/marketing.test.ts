import { describe, expect, it } from "vitest";

import { CIFRAS_PERMITIDAS, cifrasInventadas, DATOS_VERIFICADOS } from "./marketing";

/**
 * El guardia del generador: ningún post sale con una cifra que no esté en la
 * lista de datos verificados.
 */

describe("Cifras inventadas", () => {
  it("deja pasar las cifras verificadas, escritas como las escribe una persona", () => {
    const texto =
      "Más de 77 millones compran en línea y el 59 % compra ropa, pero solo el 35% queda contenta. " +
      "ClosetAI Completo cuesta $100, una sola vez, con 30 créditos.";
    expect(cifrasInventadas(texto)).toEqual([]);
  });

  it("atrapa la estadística inventada que suena a verdad", () => {
    expect(cifrasInventadas("3 de cada 4 mexicanas no saben qué ponerse.")).toEqual(["4"]);
    expect(cifrasInventadas("El 80% de tu ropa no la usas.")).toEqual(["80"]);
    expect(cifrasInventadas("Ya somos 10,000 usuarias.")).toEqual(["10000"]);
  });

  it("lee los miles y los decimales como números, no como dos cifras sueltas", () => {
    expect(cifrasInventadas("Ahorra 1,267 pesos")).toEqual(["1267"]);
    expect(cifrasInventadas("Stylebook cuesta 4.99")).toEqual(["4.99"]);
  });

  it("cada dato verificado tiene su fuente, y sus cifras están permitidas", () => {
    for (const d of DATOS_VERIFICADOS) {
      expect(d.fuente.length, d.id).toBeGreaterThan(0);
      for (const c of d.cifras) expect(CIFRAS_PERMITIDAS.has(c), `${d.id}: ${c}`).toBe(true);
      // El texto del dato no puede traer una cifra que el propio dato no declare.
      expect(cifrasInventadas(d.texto), d.id).toEqual([]);
    }
  });
});
