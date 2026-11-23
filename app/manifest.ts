import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";
import { COLORS } from "@/data/colors";

/*
 * Genera /manifest.webmanifest: la ficha del sitio para el celular. Al "agregar a pantalla de
 * inicio" queda con el logo y nombre de Oriont, y la barra del navegador toma el azul de la marca.
 * Opcional y no influye en el SEO. Debe quedarse en app/ y llamarse así.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "browser",
    background_color: "#F8F9F9",
    theme_color: COLORS.navy,
    lang: "es",
    icons: [
      { src: "/icon.png", type: "image/png" },
      { src: "/apple-icon.png", type: "image/png" },
    ],
  };
}
