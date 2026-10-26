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
 * The generator's guard: no post goes out with a figure that is not in the list
 * of verified facts.
 */

describe("Invented figures", () => {
  it("lets verified figures through, written the way a person writes them", () => {
    const texto =
      "More than 77 million people shop online and 59 % buy clothes, but only 35% are happy with it. " +
      "ClosetAI Complete costs MX$100, one time, with 30 credits.";
    expect(cifrasInventadas(texto)).toEqual([]);
  });

  it("catches the invented statistic that sounds true", () => {
    expect(cifrasInventadas("3 out of 4 women don't know what to wear.")).toEqual(["4"]);
    expect(cifrasInventadas("You never wear 80% of your clothes.")).toEqual(["80"]);
    expect(cifrasInventadas("We already have 10,000 users.")).toEqual(["10000"]);
  });

  it("reads thousands and decimals as one number, not as two separate figures", () => {
    expect(cifrasInventadas("Save 1,267 pesos")).toEqual(["1267"]);
    expect(cifrasInventadas("Stylebook costs 4.99")).toEqual(["4.99"]);
  });

  it("every verified fact has its source, and its figures are allowed", () => {
    for (const d of DATOS_VERIFICADOS) {
      expect(d.fuente.length, d.id).toBeGreaterThan(0);
      for (const c of d.cifras) expect(CIFRAS_PERMITIDAS.has(c), `${d.id}: ${c}`).toBe(true);
      // A fact's text cannot carry a figure the fact itself does not declare.
      expect(cifrasInventadas(d.texto), d.id).toEqual([]);
    }
  });
});

describe("The generated post's contract", () => {
  const bueno = {
    titulo: "You already have something to wear",
    cuerpo: "All your clothes on your phone, sorted for you, and 3 outfits of the day made from what you own. Free, forever.",
    hashtags: ["#ClosetAI", "#WhatToWear"],
    formato: "post",
  };

  it("accepts a complete post with no invented figures", () => {
    const r = revisarPost(JSON.stringify(bueno));
    expect(r.ok).toBe(true);
  });

  it("rejects a post with a statistic nobody verified, and says which one", () => {
    const r = revisarPost({ ...bueno, cuerpo: `${bueno.cuerpo} You never wear 80% of your clothes.` });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("cifras");
      expect(r.cifras).toEqual(["80"]);
    }
  });

  it("checks hashtags too, which is the easy place to slip in a number", () => {
    const r = revisarPost({ ...bueno, hashtags: ["#ClosetAI", "#Top10Outfits"] });
    expect(r.ok).toBe(false);
  });

  it("rejects anything that is not JSON or comes back incomplete", () => {
    expect(revisarPost("this is not json").ok).toBe(false);
    expect(revisarPost({ ...bueno, formato: "story" }).ok).toBe(false);
    expect(revisarPost({ ...bueno, hashtags: [] }).ok).toBe(false);
  });
});

describe("Export", () => {
  const dia = (n: number, titulo: string): Recurso => ({
    id: `dia-${n}`, tipo: "dia", canal: n % 2 ? "instagram" : "tiktok", formato: null, titulo, cuerpo: "",
    detalle: { dia: n, para_que: "Test" }, origen: "redactado_ia_aprobado", aprobado: true, created_at: "",
  });

  it("the calendar comes out in order, with a header, and escapes commas", () => {
    const csv = calendarioCsv([dia(2, "Post 3 · script 1"), dia(1, "Post 1 · carousel “Already, something to wear”")]);
    const lineas = csv.trim().split("\n");
    expect(lineas[0]).toBe("day,channel,piece,purpose");
    expect(lineas[1]).toBe('1,Instagram,"Post 1 · carousel “Already, something to wear”",Test');
    expect(lineas[2]).toBe("2,TikTok,Post 3 · script 1,Test");
  });

  it("a carousel's paste text carries its slides, the caption and the hashtags", () => {
    const post: Recurso = {
      id: "post-01", tipo: "post", canal: "instagram", formato: "carrusel", titulo: "You already have something to wear",
      cuerpo: "", detalle: { laminas: ["One", "Two"], texto: "Caption", hashtags: ["#ClosetAI"] },
      origen: "redactado_ia_aprobado", aprobado: true, created_at: "",
    };
    expect(textoParaPegar(post)).toBe("One\n\nTwo\n\nCaption\n\n#ClosetAI");
  });

  it("in a video, where the body is the caption, the text does not appear twice", () => {
    const video: Recurso = {
      id: "post-03", tipo: "post", canal: "tiktok", formato: "video", titulo: "How it works",
      cuerpo: "Take a photo of your clothes.", detalle: { texto: "Take a photo of your clothes.", hashtags: ["#ClosetAI"] },
      origen: "redactado_ia_aprobado", aprobado: true, created_at: "",
    };
    expect(textoParaPegar(video)).toBe("Take a photo of your clothes.\n\n#ClosetAI");
  });
});
