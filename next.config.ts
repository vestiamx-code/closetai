import type { NextConfig } from "next";

/**
 * The routes were in Spanish until Oct 26, 2026, when the course required the
 * whole product in English. The old addresses keep working: emails already sent,
 * earlier weeks' submissions and anyone's bookmarks point at them. The most
 * specific paths go first.
 */
const RUTAS_ANTERIORES: Array<[string, string]> = [
  ["/registro/revisa-tu-correo", "/sign-up/check-email"],
  ["/registro", "/sign-up"],
  ["/entrar", "/sign-in"],
  ["/recuperar", "/forgot-password"],
  ["/nueva-contrasena", "/new-password"],
  ["/hoy", "/today"],
  ["/closet/subir", "/closet/add"],
  ["/probar", "/try-on"],
  ["/comprar/recomendaciones", "/buy/recommendations"],
  ["/comprar/gracias", "/buy/thanks"],
  ["/comprar", "/buy"],
  ["/estilo", "/style"],
  ["/perfil", "/profile"],
  ["/privacidad", "/privacy"],
  ["/demo/semana-:n", "/demo/week-:n"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return RUTAS_ANTERIORES.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  images: {
    remotePatterns: [
      {
        // Las fotos viven en Storage y se sirven con URL firmada de 15 minutos.
        // next/image exige declarar el host a propósito: evita que la app
        // termine optimizando imágenes de cualquier dominio ajeno.
        protocol: "https",
        hostname: "gmchukoycgrrjwhmudbt.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
