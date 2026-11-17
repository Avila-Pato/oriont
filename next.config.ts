import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // probar `next dev` desde el celular por la red local (si no, Next bloquea sus scripts de
  // desarrollo, la página no se hidrata y nada responde al toque)
  // y desde un túnel HTTPS (necesario para el sensor de movimiento en el celular):
  // VS Code Dev Tunnels (xxxx-3000.brs.devtunnels.ms) o Cloudflare Tunnel
  allowedDevOrigins: ["192.168.*.*", "**.devtunnels.ms", "*.trycloudflare.com"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  images: {
    // AVIF (~20 % más liviano) con WebP de respaldo; las fotos se importan con hash → caché permanente
    formats: ["image/avif", "image/webp"],
    // Next 16 solo permite las calidades listadas: 100 se usa en la foto a pantalla completa de "Nosotros"
    qualities: [75, 100],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
