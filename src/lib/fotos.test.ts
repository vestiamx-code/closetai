// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { buscarFoto, textoDeBusqueda } from "./fotos";

const RESPUESTA = {
  photos: [
    {
      url: "https://www.pexels.com/photo/1/",
      alt: "A trench coat",
      photographer: "Ana",
      photographer_url: "https://www.pexels.com/@ana",
      src: { medium: "https://images.pexels.com/photos/1/a.jpeg" },
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

  it("without a key there is no photo, and Pexels is not called", async () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    const llamada = vi.fn();
    vi.stubGlobal("fetch", llamada);
    expect(await buscarFoto("trench coat", "mujer")).toBeNull();
    expect(llamada).not.toHaveBeenCalled();
  });

  it("brings the image and the photographer's credit", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(RESPUESTA))));
    expect(await buscarFoto("trench coat", "mujer")).toEqual({
      url: "https://images.pexels.com/photos/1/a.jpeg",
      alt: "A trench coat",
      fotografo: "Ana",
      fotografoUrl: "https://www.pexels.com/@ana",
      paginaUrl: "https://www.pexels.com/photo/1/",
    });
  });

  it("an error, a timeout or no results mean no photo, never a broken chat", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 429 })));
    expect(await buscarFoto("x", null)).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("t", "TimeoutError"); }));
    expect(await buscarFoto("x", null)).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ photos: [] }))));
    expect(await buscarFoto("x", null)).toBeNull();
  });
});
