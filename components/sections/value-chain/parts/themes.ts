import type { StepTheme } from "@/data/value-chain";



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
    card: "bg-[#21255c] text-[#f5f0e6]",
    muted: "text-[#f5f0e6]/70",
    chip: "border-[#f5f0e6]/20 text-[#f5f0e6]/85",
    icon: "bg-[#f5f0e6]/10 text-[#8fcbef]",
  },
  cream: {
    card: "bg-[#f5f0e6] text-[#21255c] ring-1 ring-[#21255c]/10",
    muted: "text-[#21255c]/65",
    chip: "border-[#21255c]/15 text-[#21255c]/80",
    icon: "bg-[#248caa]/10 text-[#248caa]",
  },
  teal: {
    card: "bg-[#248caa] text-white",
    muted: "text-white/80",
    chip: "border-white/30 text-white/90",
    icon: "bg-white/15 text-white",
  },
  sky: {
    card: "bg-[#dcebf3] text-[#21255c]",
    muted: "text-[#21255c]/70",
    chip: "border-[#21255c]/15 text-[#21255c]/80",
    icon: "bg-[#1f7fc4] text-white",
  },
  // el producto final: une el marino del sponsor con el celeste de la tecnología
  gradient: {
    card: "bg-linear-to-br from-[#21255c] via-[#1d4f7f] to-[#248caa] text-white",
    muted: "text-white/75",
    chip: "border-white/25 text-white/90",
    icon: "bg-white/15 text-[#8fcbef]",
  },
};
