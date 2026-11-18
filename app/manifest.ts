import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "browser",
    background_color: "#F8F9F9",
    theme_color: "#21255c",
    lang: "es",
    icons: [
      { src: "/icon.png", type: "image/png" },
      { src: "/apple-icon.png", type: "image/png" },
    ],
  };
}
