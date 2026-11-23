import Image from "next/image";
import conectadosImg from "@/public/images/Logo_ConectadosTMK.webp";
import dentalImg from "@/public/images/Logo_DentalAssist.webp";
import type { ReactNode } from "react";
import { OriontMark } from "@/components/ui/OriontLogo";
import type { BrandId } from "@/data/services";

/* ---------- logos de las empresas ---------- */

export const BRAND_LOGOS: Record<BrandId, ReactNode> = {
  conectados: (
      <Image src={conectadosImg} alt="Conectados TMK" width={255} height={80} className="h-12 w-auto sm:h-16 md:h-20" />
  ),
  oriont: (
      <div className="flex items-center gap-3 sm:gap-4">
        <OriontMark className="h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16" />
        <div className="font-display text-[22px] font-bold tracking-[0.14em] sm:text-[30px] text-cream md:text-[38px]">ORIONT</div>
      </div>
  ),
  dental: (
      <Image src={dentalImg} alt="Dental Assist" width={142} height={123} className="h-14 w-auto sm:h-20 md:h-24" />
  ),
};

/* ---------- íconos ---------- */

export function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="6" r="2.6" />
      <circle cx="5.5" cy="7" r="2.2" />
      <circle cx="18.5" cy="7" r="2.2" />
      <path d="M8.5 11.5c0-1 1-1.8 2-1.8h3c1 0 2 .8 2 1.8V17h-1.6v5h-3.8v-5H8.5z" />
      <path d="M2.5 12c0-.9.8-1.6 1.7-1.6h2.6c.5 0 1 .2 1.3.5V17H6.5v4H4v-4H2.5zM21.5 12c0-.9-.8-1.6-1.7-1.6h-2.6c-.5 0-1 .2-1.3.5V17h1.6v4H20v-4h1.5z" />
    </svg>
  );
}
