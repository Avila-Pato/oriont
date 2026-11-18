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
    card: "bg-[#f5f0e6] text-[#21255c] ring-1 ring-[#21255c]/10",
    muted: "text-[#21255c]/65",
    chip: "border-[#21255c]/15 text-[#21255c]/80",
    cta: "bg-[#21255c] text-[#f5f0e6]",
    plus: "border-[#21255c]/20",
  },
  navy: {
    card: "bg-[#21255c] text-[#f5f0e6]",
    muted: "text-[#f5f0e6]/70",
    chip: "border-[#f5f0e6]/20 text-[#f5f0e6]/85",
    cta: "bg-[#f5f0e6] text-[#21255c]",
    plus: "border-[#f5f0e6]/30",
  },
  sky: {
    card: "bg-[#dcebf3] text-[#21255c]",
    muted: "text-[#21255c]/70",
    chip: "border-[#21255c]/15 text-[#21255c]/80",
    cta: "bg-[#1f7fc4] text-white",
    plus: "border-[#21255c]/20",
  },
};
