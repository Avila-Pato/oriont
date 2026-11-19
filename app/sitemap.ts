import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

/*
 * SEO → genera /sitemap.xml: la lista de páginas que queremos que Google indexe. Se envía en
 * Google Search Console. Next lo detecta por el nombre: debe quedarse en app/ y llamarse así.
 * Sitio de una página: las secciones son anclas (#servicios, #nosotros…), no URL aparte.
 * Si se agregan páginas (ej. un blog), van en esta lista.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }];
}
