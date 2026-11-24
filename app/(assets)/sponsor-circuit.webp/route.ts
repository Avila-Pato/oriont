import { cacheLife } from "next/cache";
import sharp from "sharp";
import { H, W, stillRingsSvg } from "@/components/sections/industries/parts/circuitDrawing";

/**
 * Anillos quietos del abanico de Sponsors como imagen de PÍXELES (WebP), generada desde la misma
 * geometría que la página, al doble del tamaño del dibujo (3000 × 1200) para pantallas retina.
 * Por qué píxeles y no SVG: un SVG se rasteriza trazo por trazo cada vez que la sección vuelve a la
 * pantalla (~90 ms de GPU al subir desde Nosotros); una imagen de píxeles solo se copia.
 * `sharp` viene con Next (lo usa para optimizar imágenes).
 */
export async function GET() {
  const webp = Buffer.from(await renderWebp(), "base64");
  return new Response(new Uint8Array(webp), {
    headers: {
      "Content-Type": "image/webp",
      // sin `immutable`: la URL es fija y si cambia el dibujo no debe quedar la versión vieja un año
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

/** Con `use cache` la imagen entra en el prerender del build (sin él, sharp hacía la ruta dinámica
 *  y se generaba en cada visita). Devuelve base64: lo que guarda la caché tiene que ser serializable. */
async function renderWebp() {
  "use cache";
  cacheLife("max");
  const buf = await sharp(Buffer.from(stillRingsSvg({ raster: true })), { density: 72 * 2 })
    .resize(W * 2, H * 2)
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toBuffer();
  return buf.toString("base64");
}
