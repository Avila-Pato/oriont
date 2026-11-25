import { SPONSORS } from "@/data/sponsors";
import { COLORS } from "@/data/colors";

/*
 * Geometría del abanico de Sponsors (anillos, conectores, puntos y lugar de cada logo). Fija:
 * azar con semilla, la misma en el servidor y en el navegador. Va aparte (sin "use client") para
 * que la use también la ruta /sponsor-circuit.svg, que dibuja los anillos quietos como imagen.
 */

export const W = 1500;
export const H = 600;
export const C = { x: 50, y: H / 2 }; // centro de los arcos: al medio del borde izquierdo
export const R_MAX = 1500; // radio del arco más grande (ahí ya se desvaneció)
/** las 3 marcas del grupo sobre un arco chico alrededor del centro (Oriont al medio) */
export const HUB_ARC = 150;
export const HUBS = (
  [
    ["conectados", -62, 48],
    ["oriont", 0, 56],
    ["dental", 62, 48],
  ] as const
).map(([key, deg, r]) => {
  const a = (deg * Math.PI) / 180;
  return { key, x: Math.round(C.x + Math.cos(a) * HUB_ARC), y: Math.round(C.y + Math.sin(a) * HUB_ARC), r };
});
// arcos circulares: los grandes se recortan arriba y abajo y llegan hasta el borde derecho
export const RINGS = [330, 500, 670, 840, 1010, 1180, 1350]; // anillos con logos
/** velocidad del giro en el borde de cada anillo (unidades del dibujo por segundo) */
export const SPIN_SPEED = 15;
export const GHOSTS = [250, 415, 585, 755, 925, 1095, 1265, 1310, 1420]; // anillos solo de trazo (los de afuera, muy tenues)
/** solo estos anillos giran (los demás quedan quietos). Cada uno va en su propia capa rotada por
 *  CSS (compositor, sin repintar): la capa es un cuadrado de 2r y su costo crece con r², por eso
 *  solo los dos más chicos (con 500 y 670 también, la entrada de la sección daba tirones) */
export const SPINNING = [250, 330];
/** cuánto siguen girando los anillos (y latiendo el punto) sin scroll ni mouse en la sección (ms) */
export const AWAKE_MS = 7000;

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r };
};
export const arc = (r: number, a0: number, a1: number) => {
  const p = pt(r, a0);
  const q = pt(r, a1);
  return `M${r1(p.x)} ${r1(p.y)}A${r} ${r} 0 0 1 ${r1(q.x)} ${r1(q.y)}`;
};
/** tramo del medio círculo (grados, -90 = arriba, 0 = derecha, 90 = abajo) que cabe en el recuadro */
export const rangeOf = (r: number, fits: (p: { x: number; y: number }) => boolean, margin = 0) => {
  let lo = 93;
  let hi = -93;
  for (let a = -92; a <= 92; a += 0.5)
    if (fits(pt(r, a))) {
      lo = Math.min(lo, a);
      hi = Math.max(hi, a);
    }
  return [lo + margin, hi - margin] as const;
};
export const logoFits = (p: { x: number; y: number }) => p.x >= 110 && p.x <= 1400 && p.y >= 45 && p.y <= H - 45;
/** largo de un tramo de arco (para repartir los logos según cuánto cabe en cada anillo) */
export const arcLen = (r: number, lo: number, hi: number) => {
  let len = 0;
  for (let a = lo; a < hi; a += 0.5) {
    const p = pt(r, a);
    const q = pt(r, Math.min(hi, a + 0.5));
    len += Math.hypot(q.x - p.x, q.y - p.y);
  }
  return len;
};

/** primer arco del abanico: ahí termina la señal (no llega a las marcas del grupo) */
export const FIRST_RING = 250;
/** cuánto puede desviarse (grados, a cada lado) el punto de llegada respecto del ángulo del logo.
 *  Con el anillo con logos más chico (330) y ±30° la recta no se mete dentro del primer arco */
export const SIGNAL_SPREAD = 30;

/** trazo de la señal: del logo en línea recta hasta un punto del primer arco, `jitter` grados
 *  (-1..1 × SIGNAL_SPREAD) corrido del ángulo del logo */
/** punto del primer arco al que llega la señal de un logo (jitter -1…1: corrimiento al azar) */
export const firstRingPoint = (n: { x: number; y: number }, jitter = 0) => {
  const deg = (Math.atan2(n.y - C.y, n.x - C.x) * 180) / Math.PI + jitter * SIGNAL_SPREAD;
  const p = pt(FIRST_RING, deg);
  return { x: r1(p.x), y: r1(p.y) };
};

export const toFirstRing = (n: { x: number; y: number }, jitter = 0) => {
  const p = firstRingPoint(n, jitter);
  return `M${n.x} ${n.y}L${p.x} ${p.y}`;
};

/** azar con semilla (mulberry32) */
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DRAWING = (() => {
  const rnd = seeded(7);
  // cada anillo completo (gira): tramos de arco con cortes al azar (algunos faltan) y conectores
  // radiales cortos con un punto en la punta, que giran con su anillo. Cada cosa va unida en un
  // solo trazo por anillo (menos elementos que estilar y pintar)
  const rings = [...RINGS, ...GHOSTS]
    .sort((a, b) => a - b)
    .map((r) => {
      const ghost = r > 1150;
      const segs: string[] = [];
      for (let a = -180 + rnd() * 4; a < 178; ) {
        const b = Math.min(179, a + 5 + rnd() * 18);
        if (rnd() > 0.18) segs.push(arc(r, a, b));
        a = b + 1.5 + rnd() * 4;
      }
      const ticks = Array.from({ length: Math.round(r / 130) }, () => {
        const deg = -180 + rnd() * 360;
        const p = pt(r, deg);
        const q = pt(r + 18 + rnd() * 40, deg);
        return { d: `M${r1(p.x)} ${r1(p.y)}L${r1(q.x)} ${r1(q.y)}`, x: r1(q.x), y: r1(q.y) };
      });
      const DOT = 2.6;
      return {
        r,
        ghost,
        segs: segs.join(""),
        ticks: ticks.map((t) => t.d).join(""),
        // puntos como círculos dentro de un solo trazo (dos medios arcos cada uno)
        dots: ticks.map((t) => `M${r1(t.x - DOT)} ${t.y}a${DOT} ${DOT} 0 1 0 ${DOT * 2} 0a${DOT} ${DOT} 0 1 0 ${-DOT * 2} 0`).join(""),
      };
    });
  // logos repartidos entre los anillos según el largo de arco que cabe (los de afuera llevan más)
  const spans = RINGS.map((r) => rangeOf(r, logoFits, (1.5 * 330) / r));
  const lens = spans.map(([lo, hi], i) => arcLen(RINGS[i], lo, hi));
  const total = lens.reduce((a, b) => a + b, 0);
  const counts = lens.map((l) => Math.floor((l / total) * SPONSORS.length));
  for (let i = counts.length - 1; counts.reduce((a, b) => a + b, 0) < SPONSORS.length; i = (i + counts.length - 1) % counts.length) counts[i]++;
  const nodes: { x: number; y: number; trace: string }[] = [];
  // desfase por anillo (fracción de paso) para que los logos de anillos vecinos no queden alineados
  // ni encimados (buscado para la mayor separación entre logos)
  const OFFSET = [0, 0, 0, 0.5, 0, 0.5, 0];
  RINGS.forEach((r, ri) => {
    const n = counts[ri];
    const [lo, hi] = spans[ri];
    if (!n) return;
    const step = (hi - lo) / (n - 0.25);
    for (let i = 0; i < n; i++) {
      const deg = lo + step * (i + OFFSET[ri]);
      const p = { x: r1(pt(r, deg).x), y: r1(pt(r, deg).y) };
      nodes.push({ ...p, trace: toFirstRing(p) });
    }
  });
  return { rings, nodes };
})();

/** Grosor/opacidad de cada trazo de un anillo (lo comparten el SVG en la página y la imagen). */
export const RING_STYLE = {
  segs: (ghost: boolean) => ({ width: ghost ? 0.8 : 1.2, opacity: ghost ? 0.12 : 0.26 }),
  ticks: { width: 1.4, opacity: 0.28 },
  dots: { opacity: 0.32 },
};

/**
 * SVG independiente con los anillos QUIETOS (los que no giran). Se muestra como <img>: el navegador
 * lo rasteriza una vez y después solo copia esa imagen. Dentro de la página como SVG, Firefox
 * volvía a dibujar cada trazo (con degradado) al repintar la zona.
 */
export function stillRingsSvg({ raster = false } = {}) {
  // raster (WebP): sin vector-effect. En una imagen de píxeles el grosor escala con la imagen, y el
  // conversor (librsvg) interpretaba mal non-scaling-stroke y dejaba los arcos casi invisibles. Con
  // el dibujo de 1500 de ancho mostrado a ~1600 px, el grosor queda prácticamente el mismo.
  const ve = raster ? "" : ` vector-effect="non-scaling-stroke"`;
  const rings = DRAWING.rings
    .filter((ring) => !SPINNING.includes(ring.r))
    .map((ring) => {
      const sg = RING_STYLE.segs(ring.ghost);
      return (
        `<path d="${ring.segs}" stroke-width="${sg.width}" opacity="${sg.opacity}"${ve}/>` +
        `<path d="${ring.ticks}" stroke-width="${RING_STYLE.ticks.width}" opacity="${RING_STYLE.ticks.opacity}"${ve}/>` +
        `<path d="${ring.dots}" fill="${COLORS.navy}" stroke="none" opacity="${RING_STYLE.dots.opacity}"/>`
      );
    })
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<defs><radialGradient id="f" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${R_MAX}" gradientTransform="translate(${C.x} ${C.y})">` +
    `<stop offset="0.55" stop-color="${COLORS.navy}"/><stop offset="1" stop-color="${COLORS.navy}" stop-opacity="0"/></radialGradient></defs>` +
    `<g fill="none" stroke="url(#f)" stroke-linecap="round">${rings}</g></svg>`
  );
}

/** margen alrededor de un anillo que gira: los conectores salen hasta r + 58 (+ el punto) */
export const SPIN_PAD = 70;

/**
 * Un anillo que gira como SVG suelto (para generar su imagen WebP): cuadrado de 2·(r + SPIN_PAD)
 * centrado en C, en marino sólido (a estos radios el degradado del dibujo todavía es sólido) y
 * sin vector-effect (en píxeles el grosor escala con la imagen, como en stillRingsSvg).
 */
export function spinRingSvg(r: number) {
  const ring = DRAWING.rings.find((x) => x.r === r);
  if (!ring) throw new Error(`anillo ${r} no existe`);
  const R = r + SPIN_PAD;
  const sg = RING_STYLE.segs(ring.ghost);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${C.x - R} ${C.y - R} ${R * 2} ${R * 2}" width="${R * 2}" height="${R * 2}">` +
    `<g fill="none" stroke="${COLORS.navy}" stroke-linecap="round">` +
    `<path d="${ring.segs}" stroke-width="${sg.width}" opacity="${sg.opacity}"/>` +
    `<path d="${ring.ticks}" stroke-width="${RING_STYLE.ticks.width}" opacity="${RING_STYLE.ticks.opacity}"/>` +
    `<path d="${ring.dots}" fill="${COLORS.navy}" stroke="none" opacity="${RING_STYLE.dots.opacity}"/>` +
    `</g></svg>`
  );
}
