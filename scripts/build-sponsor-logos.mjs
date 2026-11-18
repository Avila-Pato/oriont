/**
 * Convierte los logos de sponsors (PNG negro sobre blanco, sin transparencia) en WebP transparentes
 * de un solo color, recortados al borde de la tinta y a una altura fija. Así todos pesan poco, se
 * ven parejos y el muro (components/sections/industries/parts/SponsorWall.tsx) los anima solo con opacity.
 *
 * Uso:
 *   node scripts/build-sponsor-logos.mjs "<carpeta con los PNG>"
 *
 * Salida: public/sponsors/<nombre>.webp (el nombre del archivo es la clave en data/sponsors.ts)
 */
import { mkdirSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC) {
  console.error('Falta la carpeta: node scripts/build-sponsor-logos.mjs "<carpeta>"');
  process.exit(1);
}

const OUT = "public/sponsors";
const HEIGHT = 160; // se muestran a ~40-52 px de alto → sobra para pantallas 3x
const INK = [0x21, 0x25, 0x5c]; // marino de la marca (#21255c)

mkdirSync(OUT, { recursive: true });

for (const file of readdirSync(SRC)) {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
  const name = basename(file, extname(file)).toLowerCase();

  // escala de grises → la tinta (oscuro) pasa a ser el canal alfa
  const { data, info } = await sharp(join(SRC, file))
    .flatten({ background: "#ffffff" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    rgba[i * 4] = INK[0];
    rgba[i * 4 + 1] = INK[1];
    rgba[i * 4 + 2] = INK[2];
    rgba[i * 4 + 3] = 255 - data[i * info.channels];
  }

  const trimmed = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  const out = join(OUT, `${name}.webp`);
  const meta = await sharp(trimmed)
    .resize({ height: HEIGHT, withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(out);

  console.log(`${out}  ${meta.width}×${meta.height}  ${(meta.size / 1024).toFixed(1)} KB`);
}
