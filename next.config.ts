import type { NextConfig } from "next";

// Dominio canónico (mismo valor que data/site.ts): www.<dominio> redirige aquí
const SITE_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://oriont.cl").host;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SECURITY_HEADERS = [
  // 2 años; el sitio actual ya se publica con includeSubDomains + preload
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // CSP mínima sin nonce (un nonce obligaría a renderizar dinámico y se pierde el prerender).
  // No restringe scripts: Next y Turnstile usan scripts en línea / de challenges.cloudflare.com
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // acelerómetro/giroscopio permitidos: los usa la grilla del equipo al agitar el celular (ShakeTeamGrid)
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(self), gyroscope=(self), camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www\\.${escapeRegex(SITE_HOST)}` }],
        destination: `https://${SITE_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // la URL por defecto del App Service no se indexa (evita contenido duplicado). No se redirige
        // a propósito: es la única forma de ver el sitio nuevo antes de apuntar el dominio aquí
        source: "/:path*",
        has: [{ type: "host", value: ".*\\.azurewebsites\\.net" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // Azure App Service: `next build` deja en .next/standalone un servidor mínimo (server.js) con
  // solo las dependencias necesarias. Se publica esa carpeta (ver .github/workflows/deploy-azure.yml)
  output: "standalone",
  // probar `next dev` desde el celular por la red local (si no, Next bloquea sus scripts de
  // desarrollo, la página no se hidrata y nada responde al toque)
  // y desde un túnel HTTPS (necesario para el sensor de movimiento en el celular):
  // VS Code Dev Tunnels (xxxx-3000.brs.devtunnels.ms) o Cloudflare Tunnel
  allowedDevOrigins: ["192.168.*.*", "**.devtunnels.ms", "*.trycloudflare.com"],
  experimental: {
    agentFeedback: true,
    // inlineCss probado y descartado (nov 2026): en Next 16.4 el CSS (80 KB) queda 3 veces en el
    // HTML (<style> + 2 copias en el payload RSC) y Lighthouse móvil dio FCP/LCP 1.07 s → 1.29 s.
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
