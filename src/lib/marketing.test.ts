import { describe, expect, it } from "vitest";

import {
  calendarioCsv,
  CIFRAS_PERMITIDAS,
  cifrasInventadas,
  DATOS_VERIFICADOS,
  revisarPost,
  textoParaPegar,
  type Recurso,
} from "./marketing";

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

describe("Contrato del post generado", () => {
  const bueno = {
    titulo: "Ya tienes qué ponerte",
    cuerpo: "Toda tu ropa en tu celular, ordenada sola, y 3 outfits del día hechos con lo que ya tienes. Gratis, para siempre.",
    hashtags: ["#ClosetAI", "#QuéMePongo"],
    formato: "post",
  };

  it("acepta un post completo y sin cifras inventadas", () => {
    const r = revisarPost(JSON.stringify(bueno));
    expect(r.ok).toBe(true);
  });

  it("rechaza un post con una estadística que nadie verificó, y dice cuál", () => {
    const r = revisarPost({ ...bueno, cuerpo: `${bueno.cuerpo} El 80% de tu ropa no la usas.` });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("cifras");
      expect(r.cifras).toEqual(["80"]);
    }
  });

  it("revisa también los hashtags, que son el lugar fácil para colar un número", () => {
    const r = revisarPost({ ...bueno, hashtags: ["#ClosetAI", "#Top10Outfits"] });
    expect(r.ok).toBe(false);
  });

  it("rechaza lo que no es JSON o viene incompleto", () => {
    expect(revisarPost("esto no es json").ok).toBe(false);
    expect(revisarPost({ ...bueno, formato: "historia" }).ok).toBe(false);
    expect(revisarPost({ ...bueno, hashtags: [] }).ok).toBe(false);
  });
});

describe("Exportar", () => {
  const dia = (n: number, titulo: string): Recurso => ({
    id: `dia-${n}`, tipo: "dia", canal: n % 2 ? "instagram" : "tiktok", formato: null, titulo, cuerpo: "",
    detalle: { dia: n, para_que: "Probar" }, origen: "redactado_ia_aprobado", aprobado: true, created_at: "",
  });

  it("el calendario sale en orden, con encabezado, y escapa las comas", () => {
    const csv = calendarioCsv([dia(2, "Post 3 · guion 1"), dia(1, "Post 1 · carrusel «Ya tienes, qué ponerte»")]);
    const lineas = csv.trim().split("\n");
    expect(lineas[0]).toBe("dia,canal,pieza,para_que");
    expect(lineas[1]).toBe('1,Instagram,"Post 1 · carrusel «Ya tienes, qué ponerte»",Probar');
    expect(lineas[2]).toBe("2,TikTok,Post 3 · guion 1,Probar");
  });

  it("el texto para pegar de un carrusel trae sus láminas, el texto y los hashtags", () => {
    const post: Recurso = {
      id: "post-01", tipo: "post", canal: "instagram", formato: "carrusel", titulo: "Ya tienes qué ponerte",
      cuerpo: "", detalle: { laminas: ["Una", "Dos"], texto: "Pie", hashtags: ["#ClosetAI"] },
      origen: "redactado_ia_aprobado", aprobado: true, created_at: "",
    };
    expect(textoParaPegar(post)).toBe("Una\n\nDos\n\nPie\n\n#ClosetAI");
  });
});
