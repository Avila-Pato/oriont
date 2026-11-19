import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

/*
 * SEO → genera /robots.txt: les dice a los buscadores (Google, Bing…) que pueden revisar todo el
 * sitio y dónde está el sitemap. Next lo detecta por el nombre: debe quedarse en app/ y llamarse así.
 * Ojo: no copiar el ejemplo de la documentación de Next (bloquea Bing y Apple).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
