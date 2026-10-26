/**
 * The logic of the homepage A/B experiment (Week 4).
 *
 * Two pure functions: which variant each visitor gets, and whether the data is
 * enough to say one of them won. They know nothing about React or the database,
 * so they are tested in milliseconds and the page and the server use exactly the
 * same code.
 */

export type Variante = "a" | "b";

/**
 * The live experiment's id. It changed on Oct 26, 2026, when the site moved to
 * English: the old experiment ("titular") measured the Spanish headlines, and its
 * visits must not be mixed with visits to the English ones. A new id also
 * re-randomizes who sees what.
 */
export const EXPERIMENTO = "headline";

/** Minimum visitors per variant before even computing a winner. */
export const MUESTRA_MINIMA = 100;

/** Significance level: a difference counts if p < 0.05. */
export const ALFA = 0.05;

/**
 * 32-bit FNV-1a, with MurmurHash3's final mixer.
 *
 * The mixer is not decoration. Without it, `fnv1a % 2` depends only on the last
 * bit, and in FNV-1a that bit is the parity of the text's letters: multiplying by
 * an odd prime does not change it. So two experiments whose names had different
 * parity were perfect opposites —whoever saw headline A always saw button B. The
 * independence test found it: 0 agreements in 10,000. With the mixer, every
 * output bit depends on every input bit.
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
 * Which variant this visitor sees in this experiment.
 *
 * The experiment goes into the hash so two simultaneous experiments are
 * independent: without it, whoever saw headline A would always see button A, and
 * the effect of one could not be separated from the other.
 */
export function varianteDe(visitante: string, experimento: string): Variante {
  // The highest bit, not the lowest: after the mixer either would do, but this
  // way the choice does not depend on the mixer being there.
  return hash(`${experimento}:${visitante}`) >>> 31 === 0 ? "a" : "b";
}

/** Standard normal cumulative distribution (Abramowitz and Stegun 7.1.26). */
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
  /** Percentage points: b minus a. */
  diferencia: number;
  z: number | null;
  /** Two-tailed p-value; null when there is not enough sample to compute it. */
  p: number | null;
  ganador: Variante | null;
  motivo: string;
};

const tasa = ({ vistas, clics }: Conteo) => (vistas > 0 ? clics / vistas : 0);

/**
 * Did either variant win?
 *
 * Two-proportion z-test. The rule that matters is not lying: with a small sample,
 * a 20-point difference can be pure luck, so the result is "no winner" even if one
 * number looks higher than the other.
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
      motivo: `No winner yet: the variant with fewer visitors needs ${faltan} more to reach ${MUESTRA_MINIMA}.`,
    };
  }

  const combinada = (a.clics + b.clics) / (a.vistas + b.vistas);
  const error = Math.sqrt(combinada * (1 - combinada) * (1 / a.vistas + 1 / b.vistas));

  // Both variants at 0% or at 100%: there is no variation to measure.
  if (error === 0) {
    return { ...base, z: 0, p: 1, ganador: null, motivo: "No winner: both variants gave exactly the same result." };
  }

  const z = diferencia / error;
  const p = 2 * (1 - normalAcumulada(Math.abs(z)));

  if (p >= ALFA) {
    return {
      ...base,
      z,
      p,
      ganador: null,
      motivo: `No winner: with p = ${p.toFixed(2)}, the difference could be luck.`,
    };
  }

  const ganador: Variante = diferencia > 0 ? "b" : "a";
  return {
    ...base,
    z,
    p,
    ganador,
    motivo: `Variant ${ganador.toUpperCase()} wins, with p = ${p.toFixed(3)}.`,
  };
}

/**
 * Was this visit made by a machine?
 *
 * The experiment counts people. After every deployment, Vercel opens the homepage
 * with an automated browser to take a screenshot, and that browser runs
 * JavaScript: without this filter, every deployment added visitors who are nobody.
 * On Oct 21, 2026 ten views appeared in pairs, one of them 26 seconds after a
 * deployment. Same risk with search crawlers and WhatsApp or Facebook link previews.
 *
 * Returns the category so it can be logged, or null if it looks like a person.
 */
export function traficoAutomatico(userAgent: string | null): string | null {
  if (!userAgent || userAgent.trim() === "") return "no-user-agent";
  const ua = userAgent.toLowerCase();
  const reglas: [string, RegExp][] = [
    ["automated-browser", /headlesschrome|headless|playwright|puppeteer|phantomjs|selenium|lighthouse/],
    ["vercel", /vercel/],
    ["link-preview", /whatsapp|facebookexternalhit|slackbot|twitterbot|discordbot|telegrambot|linkedinbot/],
    ["search-engine", /googlebot|bingbot|duckduckbot|yandex|baiduspider|applebot|slurp/],
    ["bot", /bot\b|crawler|spider|preview|screenshot/],
  ];
  for (const [categoria, patron] of reglas) if (patron.test(ua)) return categoria;
  return null;
}
