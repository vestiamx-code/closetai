// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { buscarFoto, textoDeBusqueda } from "./fotos";

const RESPUESTA = {
  results: [
    {
      alt_description: "A trench coat",
      urls: { small: "https://images.unsplash.com/photo-1?w=400" },
      links: { html: "https://unsplash.com/photos/1" },
      user: { name: "Ana", links: { html: "https://unsplash.com/@ana" } },
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("a photo for a garment", () => {
  it("searches within the person's section", () => {
    expect(textoDeBusqueda("white shirt", "hombre")).toBe("white shirt men fashion");
    expect(textoDeBusqueda("white shirt", "mujer")).toBe("white shirt women fashion");
    expect(textoDeBusqueda("white shirt", "ambas")).toBe("white shirt fashion");
  });

  it("without a key there is no photo, and Unsplash is not called", async () => {
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "");
    const llamada = vi.fn();
    vi.stubGlobal("fetch", llamada);
    expect(await buscarFoto("trench coat", "mujer")).toBeNull();
    expect(llamada).not.toHaveBeenCalled();
  });

  it("brings the image and the photographer's credit", async () => {
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(RESPUESTA))));
    expect(await buscarFoto("trench coat", "mujer")).toEqual({
      url: "https://images.unsplash.com/photo-1?w=400",
      alt: "A trench coat",
      fotografo: "Ana",
      fotografoUrl: "https://unsplash.com/@ana?utm_source=closetai&utm_medium=referral",
      paginaUrl: "https://unsplash.com/?utm_source=closetai&utm_medium=referral",
    });
  });

  it("an error, a timeout or no results mean no photo, never a broken chat", async () => {
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 429 })));
    expect(await buscarFoto("x", null)).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("t", "TimeoutError"); }));
    expect(await buscarFoto("x", null)).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ results: [] }))));
    expect(await buscarFoto("x", null)).toBeNull();
  });
});
