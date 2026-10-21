/**
 * La lógica del experimento A/B de la portada (Semana 4).
 *
 * Dos funciones puras: a quién le toca qué variante, y si los datos alcanzan
 * para decir que una ganó. No saben de React ni de base de datos, así que se
 * prueban en milisegundos y la página y el servidor usan exactamente la misma.
 */

export type Variante = "a" | "b";

/** Mínimo de visitantes por variante antes de siquiera calcular un ganador. */
export const MUESTRA_MINIMA = 100;

/** Nivel de significancia: una diferencia cuenta si p < 0.05. */
export const ALFA = 0.05;

/**
 * FNV-1a de 32 bits, con el mezclador final de MurmurHash3.
 *
 * El mezclador no es adorno. Sin él, `fnv1a % 2` solo depende del último bit,
 * y en FNV-1a ese bit es la paridad de las letras del texto: multiplicar por un
 * primo impar no lo cambia. Así, dos experimentos cuyo nombre tiene distinta
 * paridad quedaban perfectamente opuestos —quien veía el titular A veía siempre
 * el botón B—. Lo encontró la prueba de independencia: 0 coincidencias en
 * 10,000. Con el mezclador, cada bit de salida depende de todos los de entrada.
 */
function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Qué variante ve este visitante en este experimento.
 *
 * El experimento entra en el hash para que dos experimentos simultáneos sean
 * independientes: sin él, quien ve el titular A vería siempre el botón A, y no
 * se podría separar el efecto de uno del otro.
 */
export function varianteDe(visitante: string, experimento: string): Variante {
  // El bit más alto, no el más bajo: después del mezclador cualquiera serviría,
  // pero así la elección no depende de que el mezclador esté.
  return hash(`${experimento}:${visitante}`) >>> 31 === 0 ? "a" : "b";
}

/** Función de distribución normal estándar (Abramowitz y Stegun 7.1.26). */
function normalAcumulada(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export type Conteo = { vistas: number; clics: number };

export type Resultado = {
  tasaA: number;
  tasaB: number;
  /** Puntos porcentuales: b menos a. */
  diferencia: number;
  z: number | null;
  /** Valor p de dos colas; null si no hay muestra para calcularlo. */
  p: number | null;
  ganador: Variante | null;
  motivo: string;
};

const tasa = ({ vistas, clics }: Conteo) => (vistas > 0 ? clics / vistas : 0);

/**
 * ¿Ganó alguna variante?
 *
 * Prueba z de dos proporciones. La regla que importa es la de no mentir: con
 * poca muestra, una diferencia de 20 puntos puede ser pura suerte, así que el
 * resultado es «sin ganador» aunque una cifra se vea más alta que la otra.
 */
export function resultado(a: Conteo, b: Conteo): Resultado {
  const tasaA = tasa(a);
  const tasaB = tasa(b);
  const diferencia = tasaB - tasaA;
  const base = { tasaA, tasaB, diferencia };

  if (a.vistas < MUESTRA_MINIMA || b.vistas < MUESTRA_MINIMA) {
    const faltan = Math.max(MUESTRA_MINIMA - a.vistas, MUESTRA_MINIMA - b.vistas, 0);
    return {
      ...base,
      z: null,
      p: null,
      ganador: null,
      motivo: `Sin ganador todavía: faltan ${faltan} visitantes en la variante con menos para llegar a ${MUESTRA_MINIMA}.`,
    };
  }

  const combinada = (a.clics + b.clics) / (a.vistas + b.vistas);
  const error = Math.sqrt(combinada * (1 - combinada) * (1 / a.vistas + 1 / b.vistas));

  // Las dos variantes en 0% o en 100%: no hay variación que medir.
  if (error === 0) {
    return { ...base, z: 0, p: 1, ganador: null, motivo: "Sin ganador: las dos variantes dieron exactamente lo mismo." };
  }

  const z = diferencia / error;
  const p = 2 * (1 - normalAcumulada(Math.abs(z)));

  if (p >= ALFA) {
    return {
      ...base,
      z,
      p,
      ganador: null,
      motivo: `Sin ganador: con p = ${p.toFixed(2)}, la diferencia puede ser suerte.`,
    };
  }

  const ganador: Variante = diferencia > 0 ? "b" : "a";
  return {
    ...base,
    z,
    p,
    ganador,
    motivo: `Gana la variante ${ganador.toUpperCase()}, con p = ${p.toFixed(3)}.`,
  };
}
