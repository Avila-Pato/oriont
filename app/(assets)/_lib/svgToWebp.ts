import { cacheLife } from "next/cache";
import sharp from "sharp";

/**
 * Convierte un SVG generado (dibujos del abanico de Sponsors) en una imagen WebP al doble de su
 * tamaño (pantallas retina). Con `use cache` la imagen entra en el prerender del build: sin él,
 * sharp hacía la ruta dinámica y se generaba en cada visita. Devuelve base64 porque lo que guarda
 * la caché tiene que ser serializable. (`_lib`: carpeta privada, no es una ruta.)
 */
export async function svgToWebp(svg: string, w: number, h: number) {
  "use cache";
  cacheLife("max");
  const buf = await sharp(Buffer.from(svg), { density: 72 * 2 })
    .resize(w * 2, h * 2)
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toBuffer();
  return buf.toString("base64");
}

/** Respuesta con la imagen. Sin `immutable`: la URL es fija y si cambia el dibujo no debe quedar
 *  la versión vieja un año en la caché del navegador. */
export function webpResponse(base64: string) {
  return new Response(new Uint8Array(Buffer.from(base64, "base64")), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
