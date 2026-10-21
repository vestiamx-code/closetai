import { z } from "zod";

/**
 * Lo que el marketing de ClosetAI tiene permitido decir (Semana 4).
 *
 * El riesgo de un generador de posts no es que escriba mal: es que escriba con
 * mucha seguridad un número que nadie verificó —«3 de cada 4 mexicanas no saben
 * qué ponerse»— y que ese número termine en Instagram con el nombre de ClosetAI.
 *
 * Así que aquí está la lista cerrada de datos que se pueden usar, cada uno con su
 * fuente, y una función que revisa que un texto no traiga ninguna cifra fuera de
 * ella. Es el mismo principio de la Semana 2: la IA solo razona sobre lo que una
 * persona ya comprobó.
 */

export type DatoVerificado = {
  id: string;
  texto: string;
  fuente: string;
  url?: string;
  /** Las cifras que este dato autoriza a escribir. */
  cifras: string[];
};

export const DATOS_VERIFICADOS: DatoVerificado[] = [
  {
    id: "mx-compradores",
    texto: "Más de 77 millones de personas compraron en línea en México en 2025.",
    fuente: "Milenio, con datos de AMVO",
    url: "https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo",
    cifras: ["77", "2025"],
  },
  {
    id: "mx-ropa",
    texto: "El 59% de quienes compran en línea en México compra ropa.",
    fuente: "Milenio, con datos de AMVO",
    url: "https://www.milenio.com/negocios/mexico-supera-77-millones-compradores-digitales-2025-amvo",
    cifras: ["59"],
  },
  {
    id: "mx-satisfaccion",
    texto: "Solo el 35% calificó su experiencia de compra de moda en línea como muy satisfactoria.",
    fuente: "AMVO",
    url: "https://blog.amvo.org.mx/blog/moda-en-ecommerce-2025-alto-inter%C3%A9s-baja-conversi%C3%B3n",
    cifras: ["35"],
  },
  {
    id: "precio-gratis",
    texto: "El clóset de ClosetAI es gratis para siempre, con 3 outfits del día generados por IA.",
    fuente: "Planes de ClosetAI, closetai.lat/pricing",
    cifras: ["3"],
  },
  {
    id: "precio-completo",
    texto: "ClosetAI Completo cuesta 100 pesos, una sola vez, e incluye 30 créditos para probarte la ropa.",
    fuente: "Planes de ClosetAI, closetai.lat/pricing",
    cifras: ["100", "30"],
  },
  {
    id: "precio-recarga",
    texto: "Una recarga cuesta 49 pesos por 20 créditos.",
    fuente: "Planes de ClosetAI, closetai.lat/pricing",
    cifras: ["49", "20"],
  },
  {
    id: "privacidad",
    texto: "Las fotos viven en un espacio privado, se borran de verdad al quitarlas y ClosetAI no vende datos ni tiene anuncios.",
    fuente: "Aviso de privacidad, closetai.lat/privacidad",
    cifras: [],
  },
  {
    id: "indyx",
    texto: "En Estados Unidos, Indyx cobra 295 dólares por catalogar 100 prendas por ti.",
    fuente: "Indyx",
    url: "https://www.myindyx.com/how-it-works",
    cifras: ["295", "100"],
  },
];

/**
 * Números que se pueden usar sin dato detrás, porque cuentan cosas del propio
 * texto —«3 pasos», «1 foto»— y no afirman nada del mundo. Se queda chico a
 * propósito: un 7 o un 8 ya suena a estadística.
 */
const CONTADORES = ["1", "2", "3"];

export const CIFRAS_PERMITIDAS = new Set([...DATOS_VERIFICADOS.flatMap((d) => d.cifras), ...CONTADORES]);

/**
 * Las cifras de un texto que no salen de ningún dato verificado.
 *
 * Lee los números como los leería una persona: «77 millones» es 77, «59 %» es
 * 59, «$100» es 100, «1,267» es 1267. Una hora («7:00») o un día del calendario
 * no se escriben en un post generado, así que no se exceptúan.
 */
export function cifrasInventadas(texto: string): string[] {
  const numeros = texto.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const inventadas = numeros
    .map((n) => {
      // «1,267» y «1.267» son mil doscientos; «4.99» es cuatro con noventa y nueve.
      const sinMiles = /^\d{1,3}([.,]\d{3})+$/.test(n) ? n.replace(/[.,]/g, "") : n.replace(",", ".");
      return String(Number(sinMiles));
    })
    .filter((n) => !CIFRAS_PERMITIDAS.has(n));
  return [...new Set(inventadas)];
}

/** Lo que el modelo tiene que devolver por cada post. */
export type PostGenerado = {
  titulo: string;
  cuerpo: string;
  hashtags: string[];
  formato: "post" | "carrusel" | "video";
};

export const CANALES = ["instagram", "tiktok"] as const;
export type Canal = (typeof CANALES)[number];

// ---------------------------------------------------------------------------
// Sistema de marca y persona. Viven en código, no en la base, para que cada
// cambio quede en el historial de git con quién lo hizo y por qué.
// ---------------------------------------------------------------------------

export const MARCA = {
  nombre: "ClosetAI",
  promesa: "Vístete con lo que ya tienes.",
  colores: [
    { nombre: "Tinta", hex: "#241A16", uso: "Texto y titulares" },
    { nombre: "Barro", hex: "#8D4526", uso: "El acento: una palabra por titular, nunca un fondo entero" },
    { nombre: "Arena", hex: "#EFE3D6", uso: "Superficies y tarjetas" },
    { nombre: "Hueso", hex: "#FDFAF6", uso: "Fondo" },
  ],
  tipografias: [
    { nombre: "Fraunces", uso: "Titulares. Serif con carácter: se ve editorial, no de app genérica" },
    { nombre: "Inter", uso: "Todo lo demás. Se lee bien chiquita en el celular" },
  ],
  voz: {
    si: [
      "Hablar de tú, como una amiga que sabe de ropa",
      "Español de México, sin anglicismos que no se usan («outfit» sí, «look book» no)",
      "Prometer solo lo que el producto hace hoy",
      "Dar la cifra con su fuente, o no dar cifra",
    ],
    no: [
      "Culpar por comprar ropa o por no saber combinarla",
      "Vender sostenibilidad como argumento principal: en México pesa más el presupuesto",
      "Testimonios, reseñas o «miles de usuarias»: todavía no existen",
      "Prometer resultados de estilo («te verás increíble»)",
    ],
  },
  riesgo:
    "Ya existe una app llamada «Closet AI – Outfit Planner» en iPhone y otra «AI Closet» en Google Play. Mientras no se resuelva el nombre, el marketing escribe siempre «ClosetAI», junto, y nunca compra anuncios con la palabra «Closet AI» suelta.",
};

export type Rasgo = { texto: string; tipo: "dato" | "hipotesis"; fuente?: string };

export const PERSONA = {
  nombre: "Sofía",
  resumen: "27 años, Ciudad de México, segundo trabajo.",
  aviso:
    "Sofía es una persona compuesta: no existe. Es la hipótesis de a quién le habla ClosetAI, armada con los datos que sí se verificaron. Todavía no se ha entrevistado a nadie con este perfil; esa es la siguiente conversación.",
  rasgos: [
    { texto: "Compra en línea, y compra ropa en línea", tipo: "dato", fuente: "AMVO: 59% de quienes compran en línea compra ropa" },
    { texto: "No queda del todo contenta con esas compras", tipo: "dato", fuente: "AMVO: solo 35% calificó la experiencia como muy satisfactoria" },
    { texto: "Vive en el celular: Instagram para ver, TikTok para aprender", tipo: "hipotesis" },
    { texto: "Tiene más ropa de la que usa y repite lo mismo por costumbre", tipo: "hipotesis", fuente: "Lo dijo la única persona entrevistada, que está fuera de este segmento" },
    { texto: "Le importa más no gastar de más que la sostenibilidad", tipo: "hipotesis", fuente: "Documento Maestro §1; sin entrevista que lo confirme" },
    { texto: "No subiría una foto con su cara a una app que no conoce", tipo: "hipotesis", fuente: "Lo dijo la persona entrevistada; por eso el validador de fotos acepta fotos sin cara" },
  ] satisfies Rasgo[],
  quiere: "Abrir el clóset en la mañana y saber qué ponerse en un minuto.",
  frena: "Fotografiar toda su ropa le da flojera, y no confía en apps que piden su cara.",
};

// ---------------------------------------------------------------------------
// El contrato del generador
// ---------------------------------------------------------------------------


export const postGeneradoSchema = z.object({
  titulo: z.string().trim().min(3).max(80),
  cuerpo: z.string().trim().min(40).max(700),
  hashtags: z
    .array(z.string().trim().regex(/^#[\p{L}\p{N}_]+$/u))
    .min(1)
    .max(6),
  formato: z.enum(["post", "carrusel", "video"]),
});

export type RevisionDePost =
  | { ok: true; post: PostGenerado }
  | { ok: false; motivo: "formato" | "cifras"; mensaje: string; cifras?: string[] };

/**
 * Revisa un post antes de mostrarlo o guardarlo. Se llama dos veces: cuando el
 * modelo responde, y otra vez en el servidor al guardar, porque lo que llega a
 * guardar viene del navegador y el navegador se puede editar.
 */
export function revisarPost(raw: unknown): RevisionDePost {
  const parseado = postGeneradoSchema.safeParse(typeof raw === "string" ? intentarJson(raw) : raw);
  if (!parseado.success) {
    return { ok: false, motivo: "formato", mensaje: "El post no vino completo. Vuelve a intentarlo." };
  }
  const post = parseado.data;
  const cifras = cifrasInventadas(`${post.titulo} ${post.cuerpo} ${post.hashtags.join(" ")}`);
  if (cifras.length > 0) {
    return {
      ok: false,
      motivo: "cifras",
      cifras,
      mensaje: `El post traía ${cifras.length === 1 ? "una cifra" : "cifras"} que no están en los datos verificados (${cifras.join(", ")}), así que no se muestra. Vuelve a intentarlo.`,
    };
  }
  return { ok: true, post };
}

function intentarJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Exportar: lo que se descarga desde /marketing
// ---------------------------------------------------------------------------

export type Toma = { toma: string; se_ve: string; texto: string; voz: string };

export type Recurso = {
  id: string;
  tipo: "landing" | "post" | "guion" | "dia";
  canal: Canal | null;
  formato: "post" | "carrusel" | "video" | null;
  titulo: string;
  cuerpo: string;
  detalle: {
    laminas?: string[];
    texto?: string;
    hashtags?: string[];
    guion?: string;
    duracion?: string;
    tomas?: Toma[];
    dia?: number;
    pieza?: string;
    para_que?: string;
  };
  origen: "redactado_ia_aprobado" | "generado_ia";
  aprobado: boolean;
  created_at: string;
};

const CANAL_LEGIBLE: Record<Canal, string> = { instagram: "Instagram", tiktok: "TikTok" };

export const canalLegible = (c: Canal | null) => (c ? CANAL_LEGIBLE[c] : "—");

/** El texto de un post tal como se pega en la red social. */
export function textoParaPegar(r: Recurso): string {
  const partes = [r.detalle.laminas?.length ? r.detalle.laminas.join("\n\n") : r.cuerpo];
  // En los videos el cuerpo ES el pie; sin esta comparación se pegaba dos veces.
  if (r.detalle.texto && r.detalle.texto !== partes[0]) partes.push(r.detalle.texto);
  if (r.detalle.hashtags?.length) partes.push(r.detalle.hashtags.join(" "));
  return partes.filter(Boolean).join("\n\n");
}

export function postsMarkdown(posts: Recurso[]): string {
  return [
    "# ClosetAI · Posts de lanzamiento",
    "",
    ...posts.flatMap((p, i) => [
      `## ${i + 1} · ${canalLegible(p.canal)} · ${p.formato ?? "post"} — ${p.titulo}`,
      "",
      textoParaPegar(p),
      "",
    ]),
  ].join("\n");
}

export function guionesMarkdown(guiones: Recurso[]): string {
  return [
    "# ClosetAI · Guiones de video corto",
    "",
    ...guiones.flatMap((g, i) => [
      `## Guion ${i + 1} · ${g.titulo} · ${g.detalle.duracion ?? ""}`.trimEnd(),
      "",
      "| Toma | Qué se ve | Texto en pantalla | Voz |",
      "|---|---|---|---|",
      ...(g.detalle.tomas ?? []).map((t) => `| ${t.toma} | ${t.se_ve} | ${t.texto || "—"} | ${t.voz || "—"} |`),
      "",
    ]),
  ].join("\n");
}

/** Una celda de CSV: entre comillas si trae coma, comilla o salto de línea. */
function celda(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function calendarioCsv(dias: Recurso[]): string {
  const filas = [...dias]
    .sort((a, b) => (a.detalle.dia ?? 0) - (b.detalle.dia ?? 0))
    .map((d) => [d.detalle.dia ?? "", d.canal ? CANAL_LEGIBLE[d.canal] : "", d.titulo, d.detalle.para_que ?? ""]);
  return [["dia", "canal", "pieza", "para_que"], ...filas].map((f) => f.map(celda).join(",")).join("\n") + "\n";
}
