/**
 * Versiones a color de los logos de sponsors con más de un color (Bci, Banco de Bogotá): pinta
 * cada pieza o zona del logo original (PNG negro sobre blanco) con su color de marca, y recorta /
 * escala igual que scripts/build-sponsor-logos.mjs para que calcen exacto sobre el logo base.
 *
 * Uso:
 *   node scripts/build-sponsor-color-logos.mjs "<carpeta con los PNG>"
 *
 * Salida: public/sponsors/<nombre>-color.webp
 */
import { join } from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC) {
  console.error('Falta la carpeta: node scripts/build-sponsor-color-logos.mjs "<carpeta>"');
  process.exit(1);
}

const HEIGHT = 160; // igual que el logo base
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** etiqueta las piezas conectadas de tinta (para pintar por pieza) */
function components(gray, w, h) {
  const lab = new Int32Array(w * h).fill(-1);
  const info = [];
  for (let p = 0; p < w * h; p++) {
    if (gray[p] > 128 || lab[p] >= 0) continue;
    const id = info.length;
    let n = 0;
    let sx = 0;
    let sy = 0;
    const stack = [p];
    lab[p] = id;
    while (stack.length) {
      const q = stack.pop();
      const x = q % w;
      const y = (q / w) | 0;
      n++;
      sx += x;
      sy += y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const r = ny * w + nx;
        if (gray[r] <= 128 && lab[r] < 0) {
          lab[r] = id;
          stack.push(r);
        }
      }
    }
    info.push({ n, cx: sx / n, cy: sy / n });
  }
  return { lab, info };
}

/**
 * Lee una imagen de referencia a color (p. ej. una captura del logo oficial, aunque sea chica) y
 * devuelve una función que, para un punto normalizado (u, v ∈ 0..1) dentro de la caja del símbolo,
 * da el color que tiene ese punto en la referencia.
 * Cada píxel de la referencia se clasifica en una de las clases (los de fondo o borde toman la clase
 * del clasificado más cercano) y el punto se resuelve interpolando entre los 4 píxeles vecinos: así
 * el límite entre colores queda como una línea suave y no en escalones (la referencia es chica).
 */
async function refPicker(file, box, classes) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const [x0, y0, x1, y1] = box;
  const raw = (x, y) => {
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) return -1;
    const i = (y * info.width + x) * 3;
    return classes.findIndex((c) => c.test(data[i], data[i + 1], data[i + 2]));
  };
  // grilla de clases de la caja (+1 de margen), rellenando fondo/borde con la clase más cercana
  const gw = x1 - x0 + 3;
  const gh = y1 - y0 + 3;
  const grid = new Int8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++)
    for (let gx = 0; gx < gw; gx++) {
      let k = -1;
      for (let r = 0; r <= 6 && k < 0; r++)
        for (let dy = -r; dy <= r && k < 0; dy++)
          for (let dx = -r; dx <= r && k < 0; dx++) k = raw(x0 - 1 + gx + dx, y0 - 1 + gy + dy);
      grid[gy * gw + gx] = k < 0 ? classes.length - 1 : k;
    }
  const at = (gx, gy) => grid[Math.min(gh - 1, Math.max(0, gy)) * gw + Math.min(gw - 1, Math.max(0, gx))];
  return (u, v) => {
    const fx = 1 + u * (x1 - x0);
    const fy = 1 + v * (y1 - y0);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    // peso de cada clase según los vecinos (núcleo en carpa de radio R celdas: más suave que
    // bilineal, el límite entre colores no queda dentado); gana la clase de más peso
    const R = 1.6;
    const w = new Float32Array(classes.length);
    for (let dy = -1; dy <= 2; dy++)
      for (let dx = -1; dx <= 2; dx++) {
        const k = Math.max(0, R - Math.abs(dx - tx)) * Math.max(0, R - Math.abs(dy - ty));
        if (k) w[at(ix + dx, iy + dy)] += k;
      }
    let best = 0;
    for (let k = 1; k < w.length; k++) if (w[k] > w[best]) best = k;
    return classes[best].color;
  };
}

// Banco de Bogotá: el color de cada punto del símbolo sale de su logo oficial
// (scripts/sponsor-refs/bancobogota.png, captura con el logo sobre su azul de marca)
const BOGOTA_BLUE = "#0043a9";
const bogotaSymbol = await refPicker("scripts/sponsor-refs/bancobogota.png", [191, 21, 220, 50], [
  { test: (r, g, b) => r > 150 && g < 110 && b < 110, color: "#c83235" }, // arco izquierdo
  { test: (r, g, b) => r > 200 && g > 150 && b < 100, color: "#fbbc02" }, // resto del símbolo
]);
// caja del símbolo en el PNG negro original (bancobogota.png)
const BOGOTA_BOX = [1768, 159, 2158, 543];

/**
 * Reglas de color por logo: reciben (x, y, pieza) del píxel en el PNG original y devuelven el color.
 * Coordenadas medidas sobre los PNG originales.
 */
const LOGOS = {
  bancobogota: {
    file: "bancobogota.png",
    color(x, y) {
      if (x < BOGOTA_BOX[0] - 20) return BOGOTA_BLUE; // texto "Banco de Bogotá"
      const [x0, y0, x1, y1] = BOGOTA_BOX;
      const u = (x - x0) / (x1 - x0);
      const v = (y - y0) / (y1 - y0);
      // unión de abajo (arco rojo → cuerpo amarillo): en el logo es una diagonal limpia, medida
      // sobre la referencia; la referencia es chica y ahí la interpolación quedaba ondulada
      if (v > 0.7) return u < 0.73 - (v - 0.74) * 0.57 ? "#c83235" : "#fbbc02";
      return bogotaSymbol(u, v);
    },
  },
  bci: {
    file: "bci.png",
    color(x, y, c) {
      if (x > 480) return "#1a1a1a"; // texto "Bci"
      // piezas chicas de abajo: la gota del centro en amarillo, la del costado en azul
      if (c && c.n < 20000) return c.cx < 340 ? "#ffc72c" : "#0072ce";
      // la X: cada brazo con su color según el lado del cruce (≈ 290, 300)
      if (y < 300) return x < 290 ? "#e4002b" : "#0072ce";
      return "#00a651";
    },
  },
};

for (const [name, cfg] of Object.entries(LOGOS)) {
  const { data, info } = await sharp(join(SRC, cfg.file))
    .flatten({ background: "#ffffff" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = data[i * channels];
  const { lab, info: comps } = components(gray, w, h);

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const a = 255 - gray[i];
    if (!a) continue;
    const x = i % w;
    const y = (i / w) | 0;
    const [r, g, b] = hex(cfg.color(x, y, lab[i] >= 0 ? comps[lab[i]] : null));
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = a;
  }

  const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
  const out = `public/sponsors/${name}-color.webp`;
  const meta = await sharp(trimmed)
    .resize({ height: HEIGHT, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(out);
  console.log(`${out}  ${meta.width}×${meta.height}`);
}
