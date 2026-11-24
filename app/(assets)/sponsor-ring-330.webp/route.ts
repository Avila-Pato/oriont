import { SPIN_PAD, spinRingSvg } from "@/components/sections/industries/parts/circuitDrawing";
import { svgToWebp, webpResponse } from "../_lib/svgToWebp";

/**
 * Anillo que gira de radio 330 (ver SPINNING en circuitDrawing) como imagen WebP. Como SVG, la
 * primera vez que se dibujaba costaba un tirón (~60 ms al acercarse a Sponsors). Si se cambia
 * SPINNING, crear/borrar las carpetas sponsor-ring-<r>.webp que correspondan.
 */
const R = 330 + SPIN_PAD;

export async function GET() {
  return webpResponse(await svgToWebp(spinRingSvg(330), R * 2, R * 2));
}
