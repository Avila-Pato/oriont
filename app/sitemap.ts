import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

// sitio de una página: las secciones son anclas (#servicios, #nosotros…), no URL aparte
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }];
}
