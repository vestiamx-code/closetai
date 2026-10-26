import type { GarmentCatalog } from "@/lib/ai/schemas";

/** A garment as it lives in the database. */
export type Prenda = {
  id: string;
  user_id: string;
  image_path: string;
  clean_image_path: string | null;
  category: string | null;
  subcategory: string | null;
  colors: string[];
  pattern: string | null;
  material: string | null;
  styles: string[];
  seasons: string[];
  occasions: string[];
  styling_note: string | null;
  status: "active" | "archived" | "processing" | "failed";
  ai_meta: Record<string, unknown>;
  created_at: string;
};

/** Maps the cataloger's output to columns of the `garments` table. */
export function catalogoAColumnas(c: GarmentCatalog) {
  return {
    category: c.categoria,
    subcategory: c.subcategoria,
    colors: c.colores,
    pattern: c.patron,
    material: c.material_aparente,
    styles: c.estilos,
    seasons: c.temporadas,
    occasions: c.ocasiones,
    styling_note: c.notas_styling,
  };
}

export const CATEGORIAS = [
  "top",
  "bottom",
  "vestido",
  "abrigo",
  "calzado",
  "accesorio",
  "bolsa",
  "otro",
] as const;

/** UI labels: the database stores the short code, the user reads this. */
export const NOMBRE_CATEGORIA: Record<string, string> = {
  top: "Tops",
  bottom: "Bottoms",
  vestido: "Dresses",
  abrigo: "Outerwear",
  calzado: "Shoes",
  accesorio: "Accessories",
  bolsa: "Bags",
  otro: "Other",
};


// The codes below are stored in Spanish (they are the catalog's enum values);
// these are the English labels the interface shows.
export const NOMBRE_PATRON: Record<string, string> = {
  liso: "solid",
  rayas: "stripes",
  cuadros: "check",
  floral: "floral",
  estampado: "print",
  "animal print": "animal print",
  otro: "other",
};

export const NOMBRE_ESTILO: Record<string, string> = {
  casual: "casual",
  formal: "formal",
  streetwear: "streetwear",
  deportivo: "sporty",
  elegante: "elegant",
  boho: "boho",
  minimalista: "minimalist",
  "romántico": "romantic",
  edgy: "edgy",
};

export const NOMBRE_TEMPORADA: Record<string, string> = {
  primavera: "spring",
  verano: "summer",
  "otoño": "fall",
  invierno: "winter",
  "todo el año": "all year",
};

export const NOMBRE_OCASION: Record<string, string> = {
  diario: "everyday",
  oficina: "office",
  fiesta: "party",
  cita: "date",
  deporte: "sports",
  playa: "beach",
  "evento formal": "formal event",
};

/** Shows a list of stored codes with their English labels. */
export function etiquetas(codigos: string[], nombres: Record<string, string>): string {
  return codigos.map((c) => nombres[c] ?? c).join(", ");
}
