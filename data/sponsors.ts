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
import mok from "@/public/sponsors/mok.webp";
import realeseguros from "@/public/sponsors/realeseguros.webp";
import rentanacional from "@/public/sponsors/rentanacional.webp";
import salcobrand from "@/public/sponsors/salcobrand.webp";
import scotiabank from "@/public/sponsors/scotiabank.webp";
import smu from "@/public/sponsors/smu.webp";
import sura from "@/public/sponsors/sura.webp";
import tuya from "@/public/sponsors/tuya.webp";
import zenit from "@/public/sponsors/zenit.webp";

/**
 * Marcas del muro "Confían en nosotros". Los WebP salen de scripts/build-sponsor-logos.mjs
 * (transparentes, marino, recortados); para agregar una marca: sumar el PNG a la carpeta,
 * correr el script e importar el archivo aquí. El orden de la lista es el orden del muro.
 * Cómo se enciende el logo (con el scroll o el cursor):
 * - `colorLogo`: versión a color del logo (logos de varios colores; sale de
 *   scripts/build-sponsor-color-logos.mjs). Si existe, se usa esta.
 * - `color`: si no, un color de marca (fondo CSS recortado por el logo: color o degradado).
 * Colores aproximados: verificar con los oficiales.
 */
export const SPONSORS: { name: string; logo: StaticImageData; color: string; colorLogo?: StaticImageData }[] = [
  { name: "Bci", logo: bci, color: "#1a1a1a", colorLogo: bciColor },
  { name: "MOK", logo: mok, color: "#e4002b" },
  { name: "HDI Seguros", logo: hdi, color: "#006f3c" },
  { name: "Scotiabank", logo: scotiabank, color: "#ec111a" },
  { name: "Banco de Bogotá", logo: bancobogota, color: "#0043a9", colorLogo: bancobogotaColor },
  { name: "BancoEstado", logo: bancoestado, color: "#f47920" },
  { name: "Entel", logo: entel, color: "#002eff" },
  { name: "Grupo Aval", logo: aval, color: "#003b71" },
  { name: "MetLife", logo: metlife, color: "#0090da" },
  { name: "SURA", logo: sura, color: "#0033a0" },
  { name: "Europ Assistance", logo: europassistance, color: "#0066b3" },
  { name: "Itaú", logo: itau, color: "#ec7000" },
  { name: "Mapfre", logo: mapfre, color: "#d81e05" },
  { name: "BNP Paribas Cardif", logo: cardif, color: "#00915a" },
  { name: "Tuya", logo: tuya, color: "#e4007c" },
  { name: "Renta Nacional", logo: rentanacional, color: "#e2001a" },
  { name: "Reale Seguros", logo: realeseguros, color: "#003c78" },
  { name: "Cencosud", logo: cencosud, color: "#0e62ac" },
  { name: "SMU", logo: smu, color: "#e30613" },
  { name: "Inchcape", logo: inchcape, color: "#0b1f45" },
  { name: "Salcobrand", logo: salcobrand, color: "#0056a6" },
  { name: "Zenit", logo: zenit, color: "#e30613" },
  { name: "abc", logo: abc, color: "#e30613" },
];
