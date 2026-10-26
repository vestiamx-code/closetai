/**
 * The pricing simulator's arithmetic (Week 3).
 *
 * This is a pure function: assumptions in, numbers out. It knows nothing about
 * React, the network or the database, so it can be tested in milliseconds and run
 * the same way in the browser —so the result shows instantly— and on the server
 * —which is what decides what gets saved.
 *
 * What it models: **one typical month**, repeated twelve times. It does not
 * accumulate customers or model churn. That is deliberate: ClosetAI does not have
 * a single paying customer to learn a retention rate from, and a model with an
 * invented retention rate gives bigger, less certain numbers.
 *
 * Where the constants come from: Master Document §2.3 and the
 * `pricing_assumptions` table, which is what the page shows.
 *
 * Internal identifiers (segment and scenario ids, field names) stay as they were:
 * they are stored inside saved scenarios. Only what is shown on screen changed.
 */

export type Segmento = "nucleo" | "mayores";
export type Escenario = "conservador" | "base" | "optimista";

export const SEGMENTOS: { id: Segmento; nombre: string; detalle: string }[] = [
  { id: "nucleo", nombre: "Core 18–35", detalle: "Urban, in Mexico, buy clothes online, live on their phones." },
  { id: "mayores", nombre: "36 and over", detalle: "The profile of the real Week 2 conversation, outside the core." },
];

export const ESCENARIOS: { id: Escenario; nombre: string; factor: number; nota: string }[] = [
  { id: "conservador", nombre: "Conservative", factor: 0.5, nota: "Half the assumed conversion." },
  { id: "base", nombre: "Base", factor: 1, nota: "The assumptions as they are." },
  { id: "optimista", nombre: "Optimistic", factor: 2, nota: "Double the assumed conversion." },
];

/** Prices and costs. Each one has its row in `pricing_assumptions`. */
export const PRECIOS = {
  completoMxn: 100,
  recargaMxn: 49,
  creditosDelCompleto: 30,
  creditosDeLaRecarga: 20,
  costoRenderUsd: 0.075,
  costoUsuarioGratisUsdMes: 0.01,
  tipoDeCambio: 18.87,
  stripePorcentaje: 0.036,
  stripeFijoMxn: 3,
  iva: 0.16,
} as const;

export type Supuestos = {
  /** New sign-ups per month, by segment. */
  registros: Record<Segmento, number>;
  /** Share (0–1) of sign-ups that buy the Complete plan, by segment. */
  compranCompleto: Record<Segmento, number>;
  /** Share (0–1) of paying customers who also buy a top-up that month. */
  compranRecarga: Record<Segmento, number>;
  /** Try-on credits a paying customer uses per month. */
  creditosAlMes: number;
  escenario: Escenario;
};

export type ResultadoSegmento = {
  segmento: Segmento;
  registros: number;
  compradores: number;
  recargas: number;
  ingresoBruto: number;
  comisiones: number;
  /** What actually reaches the bank account: gross minus fees. */
  ingresoCobrado: number;
  costoCreditos: number;
  costoGratis: number;
  costoVariable: number;
  ingresoNeto: number;
  /** Over what is collected, not over gross: the Master Document §2.3 calculation. */
  margen: number;
};

export type Resultado = {
  escenario: Escenario;
  porSegmento: ResultadoSegmento[];
  total: ResultadoSegmento;
  /** Twelve months of the same typical month. */
  anual: {
    ingresoBruto: number;
    ingresoCobrado: number;
    costoVariable: number;
    ingresoNeto: number;
  };
};

export const SUPUESTOS_INICIALES: Supuestos = {
  registros: { nucleo: 400, mayores: 120 },
  compranCompleto: { nucleo: 0.03, mayores: 0.03 },
  compranRecarga: { nucleo: 0.08, mayores: 0.08 },
  creditosAlMes: 6,
  escenario: "base",
};

export function factorDelEscenario(escenario: Escenario): number {
  return ESCENARIOS.find((e) => e.id === escenario)?.factor ?? 1;
}

/** Stripe Mexico fee for one charge, VAT included. */
export function comisionStripe(montoMxn: number): number {
  if (montoMxn <= 0) return 0;
  return (montoMxn * PRECIOS.stripePorcentaje + PRECIOS.stripeFijoMxn) * (1 + PRECIOS.iva);
}

const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function calcularSegmento(segmento: Segmento, s: Supuestos): ResultadoSegmento {
  const factor = factorDelEscenario(s.escenario);
  const registros = Math.max(0, s.registros[segmento]);

  // The scenario moves conversion, never the price. And conversion cannot exceed
  // 100%: without this cap, the optimistic scenario would "convert" 120%.
  const tasaCompleto = acotar(s.compranCompleto[segmento] * factor, 0, 1);
  const tasaRecarga = acotar(s.compranRecarga[segmento] * factor, 0, 1);

  const compradores = registros * tasaCompleto;
  const recargas = compradores * tasaRecarga;
  const gratis = Math.max(0, registros - compradores);

  const ingresoBruto = compradores * PRECIOS.completoMxn + recargas * PRECIOS.recargaMxn;
  const comisiones =
    compradores * comisionStripe(PRECIOS.completoMxn) + recargas * comisionStripe(PRECIOS.recargaMxn);
  const ingresoCobrado = ingresoBruto - comisiones;

  // Credits cost money when they are used, not when they are sold.
  const costoCreditos = compradores * s.creditosAlMes * PRECIOS.costoRenderUsd * PRECIOS.tipoDeCambio;
  const costoGratis = gratis * PRECIOS.costoUsuarioGratisUsdMes * PRECIOS.tipoDeCambio;
  const costoVariable = costoCreditos + costoGratis;

  const ingresoNeto = ingresoCobrado - costoVariable;

  return {
    segmento,
    registros,
    compradores,
    recargas,
    ingresoBruto,
    comisiones,
    ingresoCobrado,
    costoCreditos,
    costoGratis,
    costoVariable,
    ingresoNeto,
    // With nothing collected there is no margin: 0 is honest, NaN is unreadable.
    margen: ingresoCobrado > 0 ? ingresoNeto / ingresoCobrado : 0,
  };
}

export function calcular(s: Supuestos): Resultado {
  const porSegmento = SEGMENTOS.map(({ id }) => calcularSegmento(id, s));

  const suma = (campo: keyof ResultadoSegmento) =>
    porSegmento.reduce((t, r) => t + (r[campo] as number), 0);

  const ingresoCobrado = suma("ingresoCobrado");
  const ingresoNeto = suma("ingresoNeto");

  const total: ResultadoSegmento = {
    segmento: "nucleo", // the total belongs to no segment; this field is ignored when shown
    registros: suma("registros"),
    compradores: suma("compradores"),
    recargas: suma("recargas"),
    ingresoBruto: suma("ingresoBruto"),
    comisiones: suma("comisiones"),
    ingresoCobrado,
    costoCreditos: suma("costoCreditos"),
    costoGratis: suma("costoGratis"),
    costoVariable: suma("costoVariable"),
    ingresoNeto,
    margen: ingresoCobrado > 0 ? ingresoNeto / ingresoCobrado : 0,
  };

  return {
    escenario: s.escenario,
    porSegmento,
    total,
    anual: {
      ingresoBruto: total.ingresoBruto * 12,
      ingresoCobrado: total.ingresoCobrado * 12,
      costoVariable: total.costoVariable * 12,
      ingresoNeto: total.ingresoNeto * 12,
    },
  };
}

/** Mexican pesos, no cents: cents suggest a precision we do not have. Shown as MX$. */
export function pesos(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function porcentaje(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(n);
}
