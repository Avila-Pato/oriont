import type { StaticImageData } from "next/image";
import logoConectadosTMKMark from "@/public/images/Logo_ConectadosTMK_mark.webp";
import logoOriontMark from "@/public/images/Logo_Oriont_mark.webp";
import logoDentalAssist from "@/public/images/Logo_DentalAssist.webp";

/**
 * Contenido de la sección "Servicios": empresas del grupo (provisorio: reemplazar textos).
 * Los logos se eligen por clave y viven en components/sections/services/parts/visuals.tsx.
 */

export type BrandId = "conectados" | "oriont" | "dental";

export type BrandStat = { value: number; decimals?: number; prefix?: string; suffix?: string; label: string; sub: string };

export type Brand = {
  /** clave del logo en visuals.tsx */
  id: BrandId;
  name: string;
  /** junto al nombre en la tarjeta cerrada: emoji/texto, o una imagen importada */
  icon?: string | StaticImageData;
  tagline: string;
  text: string;
  tags: string[];
  href: string;
  theme: "light" | "navy" | "sky";
  stats?: BrandStat[];
};

/** Empresas del grupo (paneles "Así llegamos a tus clientes"). */
export const brands: Brand[] = [
  {
    id: "conectados",
    name: "Conectados TMK",
    icon: logoConectadosTMKMark,
    tagline: "Contact center que vende y fideliza.",
    text: "Telemarketing y servicio especializado en bancaseguros y telecomunicaciones, con equipos entrenados para cada sponsor.",
    tags: ["Telemarketing", "Servicio al cliente", "Retención"],
    href: "https://clientes.conectadostmk.cl/",
    theme: "light",
  },
  {
    id: "oriont",
    name: "Oriont",
    icon: logoOriontMark,
    tagline: "Estructuramos productos que conectan.",
    text: "Consultoría y estructuración de productos para bancaseguros y telecomunicaciones, de la idea al cliente final.",
    tags: ["Consultoría", "Estructuración", "Tecnología"],
    href: "#nosotros",
    theme: "navy",
    stats: [
      { value: 8, prefix: "+", label: "Años", sub: "de trayectoria" },
      { value: 200, prefix: "+", label: "Personas", sub: "en el equipo" },
      { value: 1.4, decimals: 1, suffix: "MM", label: "Clientes", sub: "Banca, Retail y Telco" },
    ],
  },
  {
    id: "dental",
    name: "Dental Assist",
    icon: logoDentalAssist,
    tagline: "Asistencia dental para tus clientes.",
    text: "Planes de asistencia dental para los clientes de nuestros sponsors, con red de prestadores a nivel nacional.",
    tags: ["Asistencia", "Red de prestadores", "Cobertura nacional"],
    href: "https://dentalassist.cl/",
    theme: "sky",
  },
];
