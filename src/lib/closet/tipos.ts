import type { GarmentCatalog } from "@/lib/ai/schemas";

/** Una prenda como vive en la base de datos. */
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

/** Traduce la salida del catalogador a columnas de la tabla `garments`. */
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

/** Etiquetas para la UI: la base guarda el valor corto, la usuaria lee esto. */
export const NOMBRE_CATEGORIA: Record<string, string> = {
  top: "Parte de arriba",
  bottom: "Parte de abajo",
  vestido: "Vestidos",
  abrigo: "Abrigos",
  calzado: "Calzado",
  accesorio: "Accesorios",
  bolsa: "Bolsas",
  otro: "Otros",
};
