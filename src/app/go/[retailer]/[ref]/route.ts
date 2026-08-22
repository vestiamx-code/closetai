import { NextResponse, type NextRequest } from "next/server";

import { esTiendaValida, TIENDAS } from "@/lib/compras";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";

/**
 * Resolvedor de enlaces salientes (§3.3 M6).
 *
 * Todo clic a una tienda pasa por aquí en vez de enlazar directo. Eso permite
 * tres cosas: registrar el clic (que es el dato de intención, más valioso al
 * principio que la comisión), aplicar el tag de afiliado cuando exista, y
 * cambiar de tienda o de tag sin volver a desplegar la aplicación.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ retailer: string; ref: string }> },
) {
  const { retailer, ref } = await params;

  if (!esTiendaValida(retailer)) {
    return NextResponse.redirect(new URL("/comprar/recomendaciones", request.url));
  }

  const busqueda = decodeURIComponent(ref).slice(0, 120);
  const destino = TIENDAS[retailer].url(busqueda);

  // El registro no debe demorar la salida de la usuaria: si falla, se va igual.
  try {
    const user = await getUser();
    const admin = createAdminClient();
    const recId = request.nextUrl.searchParams.get("rec");

    await admin.from("affiliate_clicks").insert({
      user_id: user?.id ?? null,
      retailer,
      target_url: destino,
      rec_id: recId && /^[0-9a-f-]{36}$/.test(recId) ? recId : null,
    });
  } catch (error) {
    console.error("[go] no se registró el clic", error);
  }

  return NextResponse.redirect(destino);
}
