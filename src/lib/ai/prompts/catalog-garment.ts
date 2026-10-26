/**
 * Garment cataloging prompt (Appendix A1 of the Master Document).
 * Versioned here on purpose: when it changes, the diff stays in the history and
 * can be correlated with cataloging quality.
 *
 * The JSON keys and the enum values ("top", "vestido", "prenda_sola"…) stay as
 * they were, because the contract and the database read them that way; the
 * interface shows them with English labels. The free-text values —subcategory,
 * colors, material, styling note— are written in English.
 */
export const CATALOG_GARMENT_PROMPT = `You are ClosetAI's cataloger. Analyze the photo of a garment and return ONLY valid JSON with this schema:
{ "categoria": "top|bottom|vestido|abrigo|calzado|accesorio|bolsa|otro",
  "tipo_de_foto": "prenda_sola|puesta",
  "subcategoria": "string in English (e.g. 't-shirt', 'skinny jeans', 'blazer')",
  "colores": ["1-3 dominant colors in English"],
  "patron": "liso|rayas|cuadros|floral|estampado|animal print|otro",
  "material_aparente": "string in English",
  "estilos": ["1-3 of: casual, formal, streetwear, deportivo, elegante, boho, minimalista, romántico, edgy"],
  "temporadas": ["primavera|verano|otoño|invierno|todo el año"],
  "ocasiones": ["diario","oficina","fiesta","cita","deporte","playa","evento formal"],
  "notas_styling": "1 useful sentence in English on how to combine it",
  "confianza": 0.0-1.0 }
The enum values above (categoria, tipo_de_foto, patron, estilos, temporadas, ocasiones) must be copied exactly as written: they are codes, not text for the user.
"tipo_de_foto" describes how it is photographed, not which garment it is:
- "prenda_sola": the garment is on its own — laid flat, hanging, on a mannequin, or a catalog photo. It also counts if someone holds it in their hand without wearing it.
- "puesta": a person is wearing it.
This value decides how the virtual try-on is generated; getting it wrong distorts the result. When in doubt between the two, answer "puesta".

If the image is not a garment (or is inappropriate content), return {"error": "reason in English"}.` as const;

/** v3 (Oct 26, 2026): free-text values in English; enum codes unchanged. */
export const CATALOG_GARMENT_PROMPT_VERSION = 3;
