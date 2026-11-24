import { stillRingsSvg } from "@/components/sections/industries/parts/circuitDrawing";

/**
 * Anillos quietos del abanico de Sponsors como imagen SVG. No lee nada del request: con
 * cacheComponents se genera una sola vez en el build (archivo estático). Ver SponsorCircuit.
 */
export async function GET() {
  return new Response(stillRingsSvg(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // sin `immutable`: la URL es fija y si cambia el dibujo no debe quedar la versión vieja un año
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
