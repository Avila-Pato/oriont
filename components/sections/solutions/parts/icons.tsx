import type { ReactNode } from "react";
import type { StepIcon } from "@/data/solutions";

/** íconos simples por etapa (trazo, heredan el color del tema) */
const ICONS: Record<StepIcon, ReactNode> = {
  building: <path d="M5 21V5l7-2 7 2v16M9 9h2m2 0h2M9 13h2m2 0h2M9 17h2m2 0h2" />,
  box: <path d="M12 3l8 4v10l-8 4-8-4V7l8-4zm0 8L4 7m8 4l8-4m-8 4v10" />,
  network: <path d="M12 5a2 2 0 100-4 2 2 0 000 4zm-7 9a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zm-7 9a2 2 0 100-4 2 2 0 000 4zM12 5v4m-5.5 2.5L11 10m2 0l4.5 1.5M12 15v4" />,
  headset: <path d="M4 13a8 8 0 0116 0m-16 0v4a2 2 0 002 2h1v-6H6a2 2 0 00-2 2zm16 0v4a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2zm-5 7h-3" />,
  product: <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8L12 3z" />,
};

/** marca de "incluido" en las listas de las cartas. Va en SVG y no como el carácter ✓: ninguna
 *  de las fuentes de la página lo trae y el navegador tenía que buscar otra fuente del sistema
 *  para dibujarlo (~3–4 ms del primer cálculo de diseño de la página) */
export function CheckGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.5 6.4l2.3 2.3 4.7-5" />
    </svg>
  );
}

export function StepGlyph({ icon, className }: { icon: StepIcon; className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONS[icon]}
    </svg>
  );
}
