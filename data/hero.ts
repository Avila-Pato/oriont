import type { StaticImageData } from "next/image";
import hero1 from "@/public/hero/1.jpg";
import hero8 from "@/public/hero/8.jpg";
import hero6 from "@/public/hero/6.jpg";
import hero2 from "@/public/hero/2.jpg";
import hero4 from "@/public/hero/4.jpg";
import hero7 from "@/public/hero/7.jpg";
import hero3 from "@/public/hero/3.jpg";
import hero9 from "@/public/hero/9.jpg";

/** Textos del hero (provisorio). */
export const HERO_COPY = {
  eyebrow: "Somos Oriont",
  title: "Conectamos al sponsor con el",
  highlight: "cliente final.",
  text: "Ofrecemos servicios, productos y tecnología asociados al segmento bancaseguros y telecomunicaciones, en toda la cadena de valor.",
  primary: { label: "Ver soluciones", href: "#servicios" },
  secondary: { label: "Conócenos", href: "#nosotros" },
};

/** Fotos flotantes alrededor del globo (archivos en public/hero). */
export type GalleryItem = {
  src: StaticImageData;
  alt: string;
  className: string; // posición y tamaño
  depth: number; // intensidad del parallax
};

export const HERO_GALLERY: GalleryItem[] = [
  { src: hero1, alt: "Edificios corporativos", className: "left-[3%] top-[13%] h-[120px] w-[190px]", depth: 18 },
  { src: hero8, alt: "Profesional en un centro de datos", className: "-left-[1%] bottom-[16%] h-[150px] w-[130px]", depth: 30 },
  { src: hero6, alt: "Persona trabajando con laptop y celular", className: "left-[12%] bottom-[4%] h-[130px] w-[200px]", depth: 22 },
  { src: hero2, alt: "Acuerdo de negocios", className: "left-[25%] top-[9%] h-[110px] w-[170px]", depth: 12 },
  { src: hero4, alt: "Equipo de trabajo", className: "right-[3%] top-[11%] h-[270px] w-[240px]", depth: 28 },
  { src: hero7, alt: "Red de telecomunicaciones", className: "right-[9%] top-[55%] h-[160px] w-[220px]", depth: 20 },
  { src: hero3, alt: "Reunión de equipo", className: "right-[24%] bottom-[4%] h-[150px] w-[240px]", depth: 16 },
  { src: hero9, alt: "Documentos financieros", className: "right-[25%] top-[8%] h-[95px] w-[150px]", depth: 10 },
];
