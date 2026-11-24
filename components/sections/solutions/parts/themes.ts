import type { StepTheme } from "@/data/solutions";



/** Clases compartidas por cualquier tarjeta */
export type CardColors = {
  card: string;
  muted: string;
  chip: string;
};

/** Colores de la tarjeta de una etapa */
export type StepColors = CardColors & {
  icon: string;
};

// ETAPAS
export const THEME: Record<StepTheme, StepColors> = {
  navy: {
    card: "bg-navy text-cream",
    muted: "text-cream/70",
    chip: "border-cream/20 text-cream/85",
    icon: "bg-cream/10 text-[#8fcbef]",
  },
  cream: {
    card: "bg-cream text-navy ring-1 ring-navy/10",
    muted: "text-navy/65",
    chip: "border-navy/15 text-navy/80",
    icon: "bg-accent/10 text-accent",
  },
  teal: {
    card: "bg-accent text-white",
    muted: "text-white/80",
    chip: "border-white/30 text-white/90",
    icon: "bg-white/15 text-white",
  },
  sky: {
    card: "bg-ice text-navy",
    muted: "text-navy/70",
    chip: "border-navy/15 text-navy/80",
    icon: "bg-[#1f7fc4] text-white",
  },
  // el producto final: une el marino del sponsor con el celeste de la tecnología.
  // /srgb: Tailwind mezcla en oklab por defecto y la GPU tenía que preparar ese tipo de degradado
  // aparte la primera vez (~200 ms de tirón al terminar el reparto del mazo)
  gradient: {
    card: "bg-linear-to-br/srgb from-navy via-[#1d4f7f] to-accent text-white",
    muted: "text-white/75",
    chip: "border-white/25 text-white/90",
    icon: "bg-white/15 text-[#8fcbef]",
  },
};
