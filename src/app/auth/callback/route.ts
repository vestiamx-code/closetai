import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Aterrizaje de los enlaces que Supabase manda por correo (confirmación de
 * cuenta y recuperación de contraseña). Intercambia el código por una sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const siguiente = searchParams.get("siguiente");
  const destino = siguiente?.startsWith("/") ? siguiente : "/closet";

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?error=enlace-invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/entrar?error=enlace-expirado`);
  }

  return NextResponse.redirect(`${origin}${destino}`);
}
