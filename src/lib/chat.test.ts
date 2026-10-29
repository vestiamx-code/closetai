import { describe, expect, it } from "vitest";

import {
  LINEA_DE_CRISIS,
  PREGUNTAS,
  RESPUESTA_GUARDRAIL,
  leerRespuestaModelo,
  motivoDeClasificacion,
  revisarMensaje,
  seccionDe,
  sugerenciasDe,
  testerDe,
} from "./chat";
import { TIENDAS, tiendasDelChat } from "./compras";

describe("the intake", () => {
  it("asks the section first, then occasion, weather and style", () => {
    expect(PREGUNTAS.map((p) => p.id)).toEqual(["seccion", "ocasion", "clima", "estilo"]);
    for (const p of PREGUNTAS) expect(p.sugerencias.length).toBeGreaterThanOrEqual(3);
  });

  it("the section is a closed choice with three answers, and nothing else counts", () => {
    expect(PREGUNTAS[0].ejemplo).toBeNull();
    expect(seccionDe("Men’s clothes")).toBe("hombre");
    expect(seccionDe("Women’s clothes")).toBe("mujer");
    expect(seccionDe("Either")).toBe("ambas");
    expect(seccionDe("a man")).toBeNull();
  });

  it("the style suggestions follow the section", () => {
    const estilo = PREGUNTAS.find((p) => p.id === "estilo")!;
    const nombres = (s: Parameters<typeof sugerenciasDe>[1]) => sugerenciasDe(estilo, s).map((x) => x.texto);
    expect(nombres("hombre")).toContain("Smart");
    expect(nombres("hombre")).not.toContain("Romantic");
    expect(nombres("mujer")).toContain("Romantic");
  });
});

describe("the deterministic guardrail", () => {
  it.each([
    ["How do I lose 5 kilos before the party?", "dieta"],
    ["what diet should I follow to fit in this dress", "dieta"],
    ["¿Cómo bajo de peso para la boda?", "dieta"],
    ["quiero adelgazar", "dieta"],
    ["I look fat in everything", "cuerpo"],
    ["I’m so ugly, what do I even wear", "cuerpo"],
    ["me veo gorda con todo", "cuerpo"],
    ["what pills help with bloating", "salud"],
    ["I want to hurt myself", "autolesion"],
    ["ya no quiero vivir", "autolesion"],
    ["my email is ana.lopez@gmail.com", "datos_personales"],
    ["call me at 55 1234 5678", "datos_personales"],
  ])("catches %j as %s", (texto, motivo) => {
    expect(revisarMensaje(texto)?.motivo).toBe(motivo);
  });

  // The opposite matters as much: a guardrail that blocks ordinary fashion
  // questions teaches people to stop using the chat.
  it.each([
    "A dress for a wedding in October",
    "Jeans that fit well for work",
    "What goes with a black blazer?",
    "Something comfortable for a 5 km walk",
    "Un vestido para una cena",
    "Shoes for standing all day",
    "Size 28 jeans, is that a problem for straight cut?",
    "Is a 3 piece suit too much?",
  ])("does not block %j", (texto) => {
    expect(revisarMensaje(texto)).toBeNull();
  });

  it("checks self-harm before anything else, and its answer gives the crisis line", () => {
    expect(revisarMensaje("I want to kill myself, I'm so fat")?.motivo).toBe("autolesion");
    expect(RESPUESTA_GUARDRAIL.autolesion).toContain(LINEA_DE_CRISIS);
  });

  it("every guardrail answer says a person will review the conversation", () => {
    for (const r of Object.values(RESPUESTA_GUARDRAIL)) expect(r).toMatch(/person from ClosetAI will review/);
  });
});

describe("the model's answer", () => {
  const outfit = {
    titulo: "Rainy office",
    prendas: [
      { prenda: "Dark jeans", busqueda: "jeans oscuros mujer" },
      { prenda: "Trench coat", busqueda: "gabardina mujer" },
    ],
    tip: "Roll the sleeves.",
  };

  it("accepts a first answer with an outfit", () => {
    const r = leerRespuestaModelo(JSON.stringify({ clasificacion: "on_topic", respuesta: "Here you go.", outfit }), true);
    expect(r.ok).toBe(true);
  });

  it("rejects a first answer without an outfit, but allows it in a follow-up", () => {
    const sin = JSON.stringify({ clasificacion: "on_topic", respuesta: "Yes, sneakers work." });
    expect(leerRespuestaModelo(sin, true).ok).toBe(false);
    expect(leerRespuestaModelo(sin, false).ok).toBe(true);
  });

  it("rejects broken JSON and an outfit with one garment", () => {
    expect(leerRespuestaModelo("not json", true).ok).toBe(false);
    const una = JSON.stringify({ clasificacion: "on_topic", respuesta: "x", outfit: { ...outfit, prendas: [outfit.prendas[0]] } });
    expect(leerRespuestaModelo(una, true).ok).toBe(false);
  });

  it("rejects a dress in a men's outfit, and allows it in women's and in either", () => {
    const conVestido = JSON.stringify({
      clasificacion: "on_topic",
      respuesta: "x",
      outfit: { ...outfit, prendas: [{ prenda: "Red midi dress", busqueda: "vestido midi rojo" }, outfit.prendas[1]] },
    });
    expect(leerRespuestaModelo(conVestido, true, "hombre")).toEqual({ ok: false, motivo: "seccion" });
    expect(leerRespuestaModelo(conVestido, true, "mujer").ok).toBe(true);
    expect(leerRespuestaModelo(conVestido, true, "ambas").ok).toBe(true);
    // The opposite: an ordinary men's outfit is not caught by accident.
    const camisa = JSON.stringify({
      clasificacion: "on_topic",
      respuesta: "x",
      outfit: {
        ...outfit,
        prendas: [
          { prenda: "White oxford shirt", busqueda: "camisa oxford blanca hombre" },
          { prenda: "Navy chinos", busqueda: "pantalon chino azul marino hombre" },
        ],
      },
    });
    expect(leerRespuestaModelo(camisa, true, "hombre").ok).toBe(true);
  });

  it("turns the model's own classification into a guardrail reason", () => {
    expect(motivoDeClasificacion("off_topic")).toBe("fuera_de_tema");
    expect(motivoDeClasificacion("sensitive")).toBe("sensible");
    expect(motivoDeClasificacion("on_topic")).toBeNull();
  });
});

describe("tester links", () => {
  it("only 1, 2 and 3 are tester links", () => {
    expect(testerDe("2")).toBe(2);
    expect(testerDe(["3"])).toBe(3);
    expect(testerDe("4")).toBeNull();
    expect(testerDe(undefined)).toBeNull();
  });
});

describe("the store links", () => {
  it("Mango opens the section's results; H&M and Liverpool search as given", () => {
    expect(TIENDAS.mango.url("camisa blanca hombre", "hombre")).toBe(
      "https://shop.mango.com/mx/es/search/hombre?q=camisa%20blanca%20hombre",
    );
    expect(TIENDAS.mango.url("vestido negro mujer", "mujer")).toContain("/search/mujer?");
    expect(TIENDAS.hm.url("sueter negro")).toBe("https://www2.hm.com/es_mx/search-results.html?q=sueter%20negro");
    expect(TIENDAS.liverpool.url("sueter negro")).toBe("https://www.liverpool.com.mx/tienda?s=sueter+negro");
  });

  it("Mango is offered only when the section is known", () => {
    expect(tiendasDelChat("hombre")).toEqual(["mango", "hm", "liverpool"]);
    expect(tiendasDelChat("ambas")).not.toContain("mango");
  });
});

