/**
 * La aritmética del simulador de precios (Semana 3).
 *
 * Esto es una función pura: entran supuestos, salen números. No sabe de React,
 * de red ni de base de datos, y por eso se puede probar en milisegundos y correr
 * igual en el navegador —para que el resultado se vea al instante— y en el
 * servidor —que es el que decide qué se guarda—.
 *
 * Qué modela: **un mes típico**, repetido doce veces. No acumula clientes ni
 * modela abandono. Es deliberado: ClosetAI no tiene un solo cliente de pago del
 * cual aprender una tasa de retención, y un modelo con retención inventada da
 * números más grandes y menos ciertos.
 *
 * De dónde salen las constantes: Documento Maestro §2.3 y la tabla
 * `pricing_assumptions`, que es la que se muestra en la página.
 */

export type Segmento = "nucleo" | "mayores";
export type Escenario = "conservador" | "base" | "optimista";

export const SEGMENTOS: { id: Segmento; nombre: string; detalle: string }[] = [
  { id: "nucleo", nombre: "Núcleo 18–35", detalle: "Urbanos en México, compran ropa en línea, viven en el celular." },
  { id: "mayores", nombre: "36 y más", detalle: "El perfil de la conversación real de la Semana 2, fuera del núcleo." },
];

export const ESCENARIOS: { id: Escenario; nombre: string; factor: number; nota: string }[] = [
  { id: "conservador", nombre: "Conservador", factor: 0.5, nota: "La mitad de la conversión supuesta." },
  { id: "base", nombre: "Base", factor: 1, nota: "Los supuestos tal como están." },
  { id: "optimista", nombre: "Optimista", factor: 2, nota: "El doble de la conversión supuesta." },
];

/** Precios y costos. Cada uno tiene su fila en `pricing_assumptions`. */
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
  /** Registros nuevos al mes, por segmento. */
  registros: Record<Segmento, number>;
  /** Proporción (0–1) de los registros que compra el plan Completo, por segmento. */
  compranCompleto: Record<Segmento, number>;
  /** Proporción (0–1) de quienes pagaron que compra además una recarga ese mes. */
  compranRecarga: Record<Segmento, number>;
  /** Créditos de try-on que usa al mes una persona de pago. */
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
  /** Lo que de verdad llega a la cuenta: bruto menos comisiones. */
  ingresoCobrado: number;
  costoCreditos: number;
  costoGratis: number;
  costoVariable: number;
  ingresoNeto: number;
  /** Sobre lo cobrado, no sobre lo bruto: es la cuenta del Documento Maestro §2.3. */
  margen: number;
};

export type Resultado = {
  escenario: Escenario;
  porSegmento: ResultadoSegmento[];
  total: ResultadoSegmento;
  /** Doce meses del mismo mes típico. */
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

/** Comisión de Stripe México por un cobro, con IVA incluido. */
export function comisionStripe(montoMxn: number): number {
  if (montoMxn <= 0) return 0;
  return (montoMxn * PRECIOS.stripePorcentaje + PRECIOS.stripeFijoMxn) * (1 + PRECIOS.iva);
}

const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function calcularSegmento(segmento: Segmento, s: Supuestos): ResultadoSegmento {
  const factor = factorDelEscenario(s.escenario);
  const registros = Math.max(0, s.registros[segmento]);

  // El escenario mueve la conversión, nunca el precio. Y una conversión no puede
  // pasar de 100%: sin este tope, el escenario optimista "convertiría" a 120%.
  const tasaCompleto = acotar(s.compranCompleto[segmento] * factor, 0, 1);
  const tasaRecarga = acotar(s.compranRecarga[segmento] * factor, 0, 1);

  const compradores = registros * tasaCompleto;
  const recargas = compradores * tasaRecarga;
  const gratis = Math.max(0, registros - compradores);

  const ingresoBruto = compradores * PRECIOS.completoMxn + recargas * PRECIOS.recargaMxn;
  const comisiones =
    compradores * comisionStripe(PRECIOS.completoMxn) + recargas * comisionStripe(PRECIOS.recargaMxn);
  const ingresoCobrado = ingresoBruto - comisiones;

  // Los créditos cuestan cuando se usan, no cuando se venden.
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
    // Sin cobro no hay margen que calcular: 0 es honesto, NaN no se puede leer.
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
    segmento: "nucleo", // el total no es de un segmento; el campo se ignora al mostrarlo
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

/** Pesos mexicanos, sin centavos: los centavos dan una precisión que no tenemos. */
export function pesos(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function porcentaje(n: number): string {
  return new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 1 }).format(n);
}
