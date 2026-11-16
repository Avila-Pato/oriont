/**
 * Precalcula los puntos de tierra del globo (components/sections/hero/parts/Globe.tsx) y los guarda en
 * data/globe-dots.json. Antes el navegador lo hacía al cargar (parsear el mapa, rasterizarlo en un
 * canvas de 1440×720 y recorrer ~60.000 puntos), lo que bloqueaba el hilo principal.
 *
 * Ejecutar solo si cambia la lista de países (data/countries.ts) o el paso de la grilla:
 *   npm run globe:dots
 *
 * Formato: por cada fila de latitud (lat = LAT0 + fila * step) una lista plana de tramos
 * [inicio, largo, país, inicio, largo, país, ...]; país = índice en `codes`, o -1 si no es destacado.
 * La longitud del punto i de una fila con n puntos es -180 + (i / n) * 360.
 */
import { writeFileSync } from "node:fs";
import { geoBounds, geoContains } from "d3-geo";
import { feature } from "topojson-client";
import topo from "world-atlas/countries-110m.json" with { type: "json" };
import { COUNTRIES } from "../data/countries.ts";

const STEP = 0.8;
const LAT0 = -84;
const ROWS = Math.round((84 - LAT0) / STEP) + 1;
const DEG = Math.PI / 180;

const codes = COUNTRIES.map((c) => c.code);
const codeByIso = Object.fromEntries(COUNTRIES.map((c, i) => [c.isoNumeric, i]));

// cada país con su caja (para descartar rápido los que no pueden contener el punto)
const features = feature(topo, topo.objects.countries).features.map((f) => {
  const [[x0, y0], [x1, y1]] = geoBounds(f);
  return { f, x0, y0, x1, y1, code: codeByIso[String(f.id)] ?? -1 };
});

const inBox = (b, lon, lat) =>
  lat >= b.y0 && lat <= b.y1 && (b.x0 <= b.x1 ? lon >= b.x0 && lon <= b.x1 : lon >= b.x0 || lon <= b.x1);

/** -2 = mar; -1 = tierra; >= 0 = país destacado */
const classify = (lon, lat) => {
  let land = false;
  for (const b of features) {
    if (!inBox(b, lon, lat) || !geoContains(b.f, [lon, lat])) continue;
    if (b.code >= 0) return b.code;
    land = true;
  }
  return land ? -1 : -2;
};

let total = 0;
const rows = [];
for (let r = 0; r < ROWS; r++) {
  const lat = LAT0 + r * STEP;
  const n = Math.max(1, Math.round((360 * Math.cos(lat * DEG)) / STEP));
  const runs = [];
  let start = -1;
  let cur = -2;
  for (let i = 0; i <= n; i++) {
    const c = i < n ? classify(-180 + (i / n) * 360, lat) : -2;
    if (c === cur) continue;
    if (cur > -2) runs.push(start, i - start, cur);
    start = i;
    cur = c;
  }
  for (let k = 1; k < runs.length; k += 3) total += runs[k];
  rows.push(runs);
}

writeFileSync(
  new URL("../data/globe-dots.json", import.meta.url),
  JSON.stringify({ step: STEP, lat0: LAT0, codes, rows }),
);
console.log(`globe-dots: ${total} puntos en ${ROWS} filas`);
