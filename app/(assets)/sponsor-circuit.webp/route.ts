import { H, W, stillRingsSvg } from "@/components/sections/industries/parts/circuitDrawing";
import { svgToWebp, webpResponse } from "../_lib/svgToWebp";

/**
 * Anillos quietos del abanico de Sponsors como imagen de PÍXELES (WebP), generada desde la misma
 * geometría que la página, al doble del tamaño del dibujo (3000 × 1200) para pantallas retina.
 * Por qué píxeles y no SVG: un SVG se rasteriza trazo por trazo cada vez que la sección vuelve a la
 * pantalla (~90 ms de GPU al subir desde Nosotros); una imagen de píxeles solo se copia.
 */
export async function GET() {
  return webpResponse(await svgToWebp(stillRingsSvg({ raster: true }), W, H));
}
