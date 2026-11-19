import type { StaticImageData } from "next/image";

import abc from "@/public/sponsors/abc.webp";
import aval from "@/public/sponsors/aval.webp";
import bancobogota from "@/public/sponsors/bancobogota.webp";
import bancobogotaColor from "@/public/sponsors/bancobogota-color.webp";
import bancoestado from "@/public/sponsors/bancoestado.webp";
import bci from "@/public/sponsors/bci.webp";
import bciColor from "@/public/sponsors/bci-color.webp";
import cardif from "@/public/sponsors/cardif.webp";
import cencosud from "@/public/sponsors/cencosud.webp";
import entel from "@/public/sponsors/entel.webp";
import europassistance from "@/public/sponsors/europassistance.webp";
import hdi from "@/public/sponsors/hdi.webp";
import inchcape from "@/public/sponsors/inchcape.webp";
import itau from "@/public/sponsors/itau.webp";
import mapfre from "@/public/sponsors/mapfre.webp";
import metlife from "@/public/sponsors/metlife.webp";
import metlifeColor from "@/public/sponsors/metlife-color.webp";
import mok from "@/public/sponsors/mok.webp";
import realeseguros from "@/public/sponsors/realeseguros.webp";
import realesegurosColor from "@/public/sponsors/realeseguros-color.webp";
import rentanacional from "@/public/sponsors/rentanacional.webp";
import salcobrand from "@/public/sponsors/salcobrand.webp";
import scotiabank from "@/public/sponsors/scotiabank.webp";
import smu from "@/public/sponsors/smu.webp";
import sura from "@/public/sponsors/sura.webp";
import suraColor from "@/public/sponsors/sura-color.webp";
import tuya from "@/public/sponsors/tuya.webp";
import zenit from "@/public/sponsors/zenit.webp";


export type Industry = "Banca" | "Seguros y asistencia" | "Retail" | "Telecomunicaciones";

export const SPONSORS: { name: string; industry: Industry; logo: StaticImageData; color: string; colorLogo?: StaticImageData }[] = [
  { name: "Bci", industry: "Banca", logo: bci, color: "#1a1a1a", colorLogo: bciColor },
  { name: "MOK", industry: "Seguros y asistencia", logo: mok, color: "#e5007d" },
  { name: "HDI Seguros", industry: "Seguros y asistencia", logo: hdi, color: "#00843d" },
  { name: "Scotiabank", industry: "Banca", logo: scotiabank, color: "#ec111a" },
  { name: "Banco de Bogotá", industry: "Banca", logo: bancobogota, color: "#0043a9", colorLogo: bancobogotaColor },
  { name: "BancoEstado", industry: "Banca", logo: bancoestado, color: "#f47920" },
  { name: "Entel", industry: "Telecomunicaciones", logo: entel, color: "#002eff" },
  { name: "Grupo Aval", industry: "Banca", logo: aval, color: "#003b71" },
  { name: "MetLife", industry: "Seguros y asistencia", logo: metlife, color: "#0090da", colorLogo: metlifeColor },
  { name: "SURA", industry: "Seguros y asistencia", logo: sura, color: "#0033a0", colorLogo: suraColor },
  { name: "Europ Assistance", industry: "Seguros y asistencia", logo: europassistance, color: "#0066b3" },
  { name: "Itaú", industry: "Banca", logo: itau, color: "#ec7000" },
  { name: "Mapfre", industry: "Seguros y asistencia", logo: mapfre, color: "#d81e05" },
  { name: "BNP Paribas Cardif", industry: "Seguros y asistencia", logo: cardif, color: "#00915a" },
  { name: "Tuya", industry: "Banca", logo: tuya, color: "#e4007c" },
  { name: "Renta Nacional", industry: "Seguros y asistencia", logo: rentanacional, color: "#e2001a" },
  { name: "Reale Seguros", industry: "Seguros y asistencia", logo: realeseguros, color: "#0a3c84", colorLogo: realesegurosColor },
  { name: "Cencosud", industry: "Retail", logo: cencosud, color: "#0e62ac" },
  { name: "SMU", industry: "Retail", logo: smu, color: "#e30613" },
  { name: "Inchcape", industry: "Retail", logo: inchcape, color: "#0b1f45" },
  { name: "Salcobrand", industry: "Retail", logo: salcobrand, color: "#0056a6" },
  { name: "Zenit", industry: "Seguros y asistencia", logo: zenit, color: "#e30613" },
  { name: "abc", industry: "Retail", logo: abc, color: "#e30613" },
];
