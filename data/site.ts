import { ABOUT_CTA } from "./about";

/**
 * Datos del sitio para SEO (metadatos, sitemap, robots, imagen para compartir y JSON-LD).
 * URL pública: NEXT_PUBLIC_SITE_URL (en .env.local / variables del hosting). Sin ella se usa el
 * dominio principal; en un ambiente de prueba conviene definirla para que las URL apunten ahí.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://oriont.cl").replace(/\/+$/, "");

export const SITE = {
  name: "Oriont",
  // la palabra que más se busca va primero (pesa más al inicio del título)
  title: "Bancaseguros y Telecomunicaciones en Chile | Oriont",
  description:
    "Servicios, productos y tecnología para bancaseguros y telecomunicaciones en Chile, Perú y Colombia. Conectamos al sponsor con el cliente final.",
  locale: "es_CL",
  email: ABOUT_CTA.contact.find((c) => c.icon === "mail")?.value ?? "contacto@oriont.cl",
  address: {
    streetAddress: "Av. Del Valle Norte 945, Of. 3604",
    addressLocality: "Huechuraba",
    addressRegion: "Región Metropolitana",
    addressCountry: "CL",
  },
};
