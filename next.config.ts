import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
