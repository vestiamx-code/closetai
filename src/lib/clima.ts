import "server-only";

/**
 * Clima desde open-meteo.com — gratis, sin llave, sin registro (§4.1).
 *
 * Se usa para que el estilista no proponga abrigo con 28° ni tirantes con 12°.
 * Si falla, el estilista sigue funcionando sin clima: es un dato que mejora la
 * recomendación, no uno del que dependa.
 */

export type Clima = {
  ciudad: string;
  temperatura: number;
  descripcion: string;
};

/** Coordenadas de las ciudades más probables. Evita una llamada de geocoding. */
const CIUDADES: Record<string, [number, number]> = {
  "ciudad de méxico": [19.43, -99.13],
  cdmx: [19.43, -99.13],
  guadalajara: [20.67, -103.35],
  monterrey: [25.69, -100.32],
  puebla: [19.04, -98.2],
  querétaro: [20.59, -100.39],
  mérida: [20.97, -89.62],
  tijuana: [32.51, -117.04],
  cancún: [21.16, -86.85],
  "san luis potosí": [22.15, -100.98],
  toluca: [19.29, -99.66],
  león: [21.12, -101.68],
};

/** Códigos WMO de open-meteo, en palabras que una persona entiende. */
function describir(codigo: number): string {
  if (codigo === 0) return "despejado";
  if (codigo <= 2) return "medio nublado";
  if (codigo === 3) return "nublado";
  if (codigo <= 48) return "con neblina";
  if (codigo <= 57) return "con llovizna";
  if (codigo <= 67) return "lloviendo";
  if (codigo <= 77) return "nevando";
  if (codigo <= 82) return "con chubascos";
  return "con tormenta";
}

function coordenadas(ciudad: string): [number, number] {
  const limpia = ciudad.trim().toLowerCase();
  return CIUDADES[limpia] ?? CIUDADES["ciudad de méxico"];
}

export async function obtenerClima(ciudad: string): Promise<Clima | null> {
  const [lat, lon] = coordenadas(ciudad);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=America%2FMexico_City`;

  try {
    // Se cachea una hora: el clima no cambia entre dos peticiones seguidas y
    // así no se llama a open-meteo en cada recarga de pantalla.
    const respuesta = await fetch(url, { next: { revalidate: 3600 } });
    if (!respuesta.ok) return null;

    const datos = await respuesta.json();
    const actual = datos?.current;
    if (typeof actual?.temperature_2m !== "number") return null;

    return {
      ciudad,
      temperatura: Math.round(actual.temperature_2m),
      descripcion: describir(Number(actual.weather_code ?? 0)),
    };
  } catch {
    return null;
  }
}
