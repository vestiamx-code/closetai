import { describe, expect, it } from "vitest";

import {
  calcular,
  comisionStripe,
  PRECIOS,
  SUPUESTOS_INICIALES,
  type Supuestos,
} from "./precios";

/**
 * Pruebas de la lógica de precios (Semana 3).
 *
 * No prueban la pantalla: prueban la cuenta. Si un día el margen deja de
 * cubrir el costo de los créditos, esto se pone rojo antes de que lo note la
 * cuenta de banco.
 */

const con = (cambios: Partial<Supuestos>): Supuestos => ({ ...SUPUESTOS_INICIALES, ...cambios });

describe("Lógica de precios", () => {
  it("una venta de 100 MXN deja margen aunque la persona queme sus 30 créditos", () => {
    // Un solo segmento, todos compran, nadie recarga, y se usan los 30 créditos
    // incluidos: el peor caso para el margen del plan Completo.
    const r = calcular(
      con({
        registros: { nucleo: 100, mayores: 0 },
        compranCompleto: { nucleo: 1, mayores: 0 },
        compranRecarga: { nucleo: 0, mayores: 0 },
        creditosAlMes: PRECIOS.creditosDelCompleto,
      }),
    );

    const porVenta = r.total.ingresoNeto / r.total.compradores;
    const comision = comisionStripe(PRECIOS.completoMxn);
    const costoCreditos = PRECIOS.creditosDelCompleto * PRECIOS.costoRenderUsd * PRECIOS.tipoDeCambio;

    // La cuenta completa, en pesos, para que el número se pueda seguir a mano:
    // 100 − 7.66 de Stripe − 42.46 de créditos = 49.89.
    expect(comision).toBeCloseTo(7.66, 2);
    expect(costoCreditos).toBeCloseTo(42.46, 2);
    expect(porVenta).toBeCloseTo(49.89, 2);

    // La regla de negocio del Documento Maestro §2.3: el margen sobre lo que de
    // verdad entra no baja del 50%, ni en el peor caso.
    expect(r.total.margen).toBeGreaterThanOrEqual(0.5);
  });

  it("el escenario optimista nunca da menos que el base, ni el base menos que el conservador", () => {
    const conservador = calcular(con({ escenario: "conservador" }));
    const base = calcular(con({ escenario: "base" }));
    const optimista = calcular(con({ escenario: "optimista" }));

    expect(base.total.ingresoNeto).toBeGreaterThanOrEqual(conservador.total.ingresoNeto);
    expect(optimista.total.ingresoNeto).toBeGreaterThanOrEqual(base.total.ingresoNeto);

    // Y el escenario mueve la conversión, no el precio. Hay que medirlo sin
    // recargas: el escenario también cambia cuántas recargas compra cada
    // persona, así que el ingreso por comprador con recargas sí varía —y eso
    // está bien—. Lo que no puede variar es lo que cuesta el plan.
    const sinRecargas = (escenario: Supuestos["escenario"]) =>
      calcular(con({ escenario, compranRecarga: { nucleo: 0, mayores: 0 } }));
    for (const escenario of ["conservador", "base", "optimista"] as const) {
      const r = sinRecargas(escenario);
      expect(r.total.ingresoBruto / r.total.compradores).toBeCloseTo(100, 6);
    }
  });

  it("sin nadie que pague, el ingreso es 0 y el mes cuesta lo que cuestan los usuarios gratis", () => {
    // El plan de la semana decía "conversión 0 ⇒ ingreso 0 y costo 0". Al
    // escribir la prueba se vio que la segunda mitad era falsa: una persona en el
    // plan gratis cuesta ~0.01 USD al mes. La prueba fija el modelo real.
    const r = calcular(
      con({ compranCompleto: { nucleo: 0, mayores: 0 }, compranRecarga: { nucleo: 0, mayores: 0 } }),
    );

    const gratis = SUPUESTOS_INICIALES.registros.nucleo + SUPUESTOS_INICIALES.registros.mayores;
    const costoEsperado = gratis * PRECIOS.costoUsuarioGratisUsdMes * PRECIOS.tipoDeCambio;

    expect(r.total.ingresoBruto).toBe(0);
    expect(r.total.comisiones).toBe(0);
    expect(r.total.costoVariable).toBeCloseTo(costoEsperado, 6);
    expect(r.total.ingresoNeto).toBeCloseTo(-costoEsperado, 6);
    expect(r.total.margen).toBe(0);
  });

  it("el año son doce meses del mismo mes, y se dice así en la página", () => {
    const r = calcular(con({}));
    expect(r.anual.ingresoNeto).toBeCloseTo(r.total.ingresoNeto * 12, 6);
    expect(r.anual.ingresoBruto).toBeCloseTo(r.total.ingresoBruto * 12, 6);
    // El día que se modele retención o estacionalidad, esta prueba se pone roja y
    // obliga a actualizar la explicación de la página, no solo el código.
  });

  it("el escenario optimista no convierte a más del 100% de quien se registra", () => {
    const r = calcular(
      con({ compranCompleto: { nucleo: 0.6, mayores: 0.6 }, escenario: "optimista" }),
    );
    for (const seg of r.porSegmento) {
      expect(seg.compradores).toBeLessThanOrEqual(seg.registros);
    }
  });

  it("el total es la suma de los dos segmentos, no una cuenta aparte", () => {
    const r = calcular(con({}));
    const suma = r.porSegmento.reduce((t, s) => t + s.ingresoNeto, 0);
    expect(r.total.ingresoNeto).toBeCloseTo(suma, 6);
  });
});
