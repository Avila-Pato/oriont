import type { Brand } from "@/data/services";
import type { CardColors } from "@/components/sections/solutions/parts/themes";

/** Nombre del tema de una marca (definido en data/services.ts) */
export type BrandTheme = Brand["theme"];

/** Colores de la tarjeta de una marca */
export type BrandColors = CardColors & {
  cta: string;
  plus: string;
};

// MARCAS
export const BRAND_THEME: Record<BrandTheme, BrandColors> = {
  light: {
    card: "bg-cream text-navy ring-1 ring-navy/10",
    muted: "text-navy/65",
    chip: "border-navy/15 text-navy/80",
    cta: "bg-navy text-cream",
    plus: "border-navy/20",
  },
  navy: {
    card: "bg-navy text-cream",
    muted: "text-cream/70",
    chip: "border-cream/20 text-cream/85",
    cta: "bg-cream text-navy",
    plus: "border-cream/30",
  },
  sky: {
    card: "bg-ice text-navy",
    muted: "text-navy/70",
    chip: "border-navy/15 text-navy/80",
    cta: "bg-[#1c74b4] text-white",
    plus: "border-navy/20",
  },
};
