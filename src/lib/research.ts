/**
 * Semana 2 · `/research` — la lógica pura, sin red ni base de datos.
 *
 * Vive aparte para probarse sola: filtrar la tabla, encontrar el riesgo más alto
 * y decidir cómo se le presentan los datos al modelo no dependen de Supabase ni
 * de Gemini, y es justo donde un error pasaría desapercibido.
 */

export type TipoFuente = "competidor" | "sustituto" | "referente" | "mercado";

export type Fuente = {
  id: string;
  nombre: string;
  tipo: TipoFuente;
  pais: string | null;
  dato_clave: string;
  precio: string | null;
  leccion: string | null;
  amenaza: number | null;
  referente_global: boolean;
  de_mexico: boolean;
  fuente_nombre: string;
  fuente_url: string;
  fuente_extra_url: string | null;
  verificado_el: string;
  orden: number;
};

export type Riesgo = {
  id: string;
  riesgo: string;
  probabilidad: number;
  impacto: number;
  mitigacion: string;
  evidencia: string[];
};

export type FiltroTabla = { tipo: "todos" | "competidor" | "sustituto"; texto: string };

/**
 * Minúsculas y sin acentos. Quien busca "mexico" en el celular no escribe la
 * tilde, y la tabla dice "México": sin esto la búsqueda falla en silencio.
 */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** La tabla solo muestra competidores y sustitutos; referentes y datos de mercado van en otras secciones. */
export function filasDeLaTabla<T extends Pick<Fuente, "tipo">>(fuentes: T[]): T[] {
  return fuentes.filter((f) => f.tipo === "competidor" || f.tipo === "sustituto");
}

export function filtrarFuentes(fuentes: Fuente[], filtro: FiltroTabla): Fuente[] {
  const buscado = normalizar(filtro.texto);
  return filasDeLaTabla(fuentes)
    .filter((f) => filtro.tipo === "todos" || f.tipo === filtro.tipo)
    .filter(
      (f) =>
        buscado === "" ||
        [f.nombre, f.pais ?? "", f.dato_clave, f.precio ?? "", f.leccion ?? ""].some((campo) =>
          normalizar(campo).includes(buscado),
        ),
    );
}

export function severidad(r: Pick<Riesgo, "probabilidad" | "impacto">): number {
  return r.probabilidad * r.impacto;
}

/** El riesgo con mayor probabilidad × impacto. En empate gana el primero, que es el orden en que se escribieron. */
export function riesgoMasAlto<T extends Pick<Riesgo, "probabilidad" | "impacto">>(riesgos: T[]): T | null {
  return riesgos.reduce<T | null>(
    (maximo, r) => (maximo === null || severidad(r) > severidad(maximo) ? r : maximo),
    null,
  );
}

export type Resumen = {
  competidores: number;
  sustitutos: number;
  referentesGlobales: number;
  datosMexico: number;
  riesgos: number;
  validaciones: number;
  informes: number;
  riesgoMasAlto: Riesgo | null;
};

/** Los números del panel. Salen de las filas que devolvió la base, nunca de constantes. */
export function resumir(fuentes: Fuente[], riesgos: Riesgo[], validaciones: number, informes: number): Resumen {
  return {
    competidores: fuentes.filter((f) => f.tipo === "competidor").length,
    sustitutos: fuentes.filter((f) => f.tipo === "sustituto").length,
    referentesGlobales: fuentes.filter((f) => f.referente_global).length,
    datosMexico: fuentes.filter((f) => f.de_mexico).length,
    riesgos: riesgos.length,
    validaciones,
    informes,
    riesgoMasAlto: riesgoMasAlto(riesgos),
  };
}

export type FuenteParaInforme = Pick<Fuente, "id" | "nombre" | "tipo" | "pais" | "dato_clave" | "precio" | "leccion">;
export type RiesgoParaInforme = Pick<Riesgo, "riesgo" | "probabilidad" | "impacto" | "evidencia">;

/**
 * Los datos verificados, como texto para el prompt.
 *
 * Solo las fuentes llevan su id entre corchetes. Los riesgos van sin id a
 * propósito: son análisis, no evidencia, y si llevaran corchetes el modelo los
 * citaría como si fueran fuentes.
 */
export function datosParaElPrompt(fuentes: FuenteParaInforme[], riesgos: RiesgoParaInforme[]): string {
  const lineasFuentes = fuentes.map((f) => {
    const partes = [`[${f.id}] ${f.nombre} — ${f.tipo}${f.pais ? `, ${f.pais}` : ""}: ${f.dato_clave}.`];
    if (f.precio) partes.push(`Precio: ${f.precio}.`);
    if (f.leccion) partes.push(`Lección: ${f.leccion}.`);
    return partes.join(" ");
  });

  const lineasRiesgos = riesgos.map(
    (r) =>
      `- ${r.riesgo} (probabilidad ${r.probabilidad}/3, impacto ${r.impacto}/3; evidencia: ${
        r.evidencia.length > 0 ? r.evidencia.join(", ") : "ninguna"
      })`,
  );

  return [
    "DATOS VERIFICADOS (cita solo estos ids):",
    ...lineasFuentes,
    "",
    "RIESGOS YA IDENTIFICADOS (contexto; no se citan):",
    ...lineasRiesgos,
  ].join("\n");
}
