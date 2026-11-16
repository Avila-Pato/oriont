import type { CSSProperties } from "react";

import { SPONSORS } from "@/data/sponsors";
import { OriontMark } from "@/components/ui/OriontLogo";

import SponsorLogo, { logoWidth } from "./SponsorLogo";

/*
 * Escritorio: Oriont al centro y las marcas como nodos de una red jerárquica en dos órbitas.
 * Las 9 de la órbita interior se conectan a Oriont; cada una de afuera, a la interior más cercana.
 * Líneas rectas que arrancan en el borde de cada logo (no lo cruzan). Cuando un logo se enciende
 * (cursor o data-on de SponsorScrollColor), su camino se marca y un pulso viaja por él hasta
 * Oriont. Todo en CSS (opacidad, escala, trazo); el contenedor tiene proporción fija (sin CLS).
 *
 * Coordenadas en % del contenedor; el SVG usa un viewBox con la misma proporción (W × H).
 */
const W = 1000;
const H = 500;
const INNER_COUNT = 9;
const INNER = { count: INNER_COUNT, rx: 0.27, ry: 0.25, start: -90 };
const OUTER = { count: SPONSORS.length - INNER_COUNT, rx: 0.43, ry: 0.41, start: -90 + 180 / (SPONSORS.length - INNER_COUNT) };
const HUB_R = 0.075; // radio del nodo central, en fracción del alto (las líneas terminan en su borde)
// medio ancho / medio alto aproximado de un logo en unidades del viewBox (por múltiplo de --logo-h)
const LOGO_UNITS = 13;
const PAD = 7; // aire entre el borde del logo y la línea

const f = (n: number) => n.toFixed(1);

type P = { x: number; y: number };

function ringPoints(ring: typeof INNER): P[] {
  return Array.from({ length: ring.count }, (_, i) => {
    const a = ((ring.start + (360 * i) / ring.count) * Math.PI) / 180;
    return { x: (0.5 + Math.cos(a) * ring.rx) * W, y: (0.5 + Math.sin(a) * ring.ry) * H };
  });
}

const POINTS = [...ringPoints(INNER), ...ringPoints(OUTER)];
const HALF = SPONSORS.map((s) => ({ w: (logoWidth(s.logo.width, s.logo.height) * LOGO_UNITS) / 2 + PAD, h: LOGO_UNITS / 2 + 6 + PAD }));
const HUB: P = { x: W / 2, y: H / 2 };

/** punto donde la recta que sale de `p` hacia `to` cruza el borde de la caja del logo `i` */
function edge(p: P, to: P, i: number): P {
  const dx = to.x - p.x;
  const dy = to.y - p.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const t = Math.min(HALF[i].w / Math.max(Math.abs(ux), 1e-6), HALF[i].h / Math.max(Math.abs(uy), 1e-6));
  return { x: p.x + ux * t, y: p.y + uy * t };
}

/** tramo del nodo interior `i` a Oriont (termina en el borde del círculo central) */
function toHub(i: number) {
  const a = edge(POINTS[i], HUB, i);
  const dx = HUB.x - a.x;
  const dy = HUB.y - a.y;
  const len = Math.hypot(dx, dy);
  const r = HUB_R * H + 4;
  return `M${f(a.x)} ${f(a.y)}L${f(HUB.x - (dx / len) * r)} ${f(HUB.y - (dy / len) * r)}`;
}

// camino de cada logo hasta Oriont (los de afuera pasan por su nodo interior más cercano, con un
// corte sobre ese logo para no cruzarlo)
const PATHS = POINTS.map((p, i) => {
  if (i < INNER_COUNT) return toHub(i);
  let near = 0;
  for (let k = 1; k < INNER_COUNT; k++) {
    if (Math.hypot(POINTS[k].x - p.x, POINTS[k].y - p.y) < Math.hypot(POINTS[near].x - p.x, POINTS[near].y - p.y)) near = k;
  }
  const a = edge(p, POINTS[near], i);
  const b = edge(POINTS[near], p, near);
  return `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}${toHub(near)}`;
});

export default function SponsorNetwork() {
  return (
    <div className="group/net relative hidden aspect-[2/1] [--logo-h:28px] lg:block xl:[--logo-h:36px]">
      <ul data-sponsor-grid aria-label="Marcas que confían en Oriont" className="absolute inset-0">
        {SPONSORS.map((s, i) => {
          const n = POINTS[i];
          return (
            // el li no tiene posición: su logo y su línea se ubican respecto del contenedor
            <li key={s.name}>
              {/* data-logo-cell: lo enciende SponsorScrollColor y lo hace entrar SponsorsReveal.
                  peer: su línea (el svg que sigue) reacciona al cursor y a data-on */}
              <span
                data-logo-cell
                className="peer group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center p-2"
                style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` } as CSSProperties}
              >
                <SponsorLogo {...s} sizes="(min-width: 1280px) 200px, 150px" />
              </span>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full overflow-visible text-[#21255c]/12 transition-colors duration-500 peer-hover:text-[#248caa]/60 peer-hover:duration-200 peer-data-on:text-[#248caa]/60"
              >
                {/* línea (se dibuja al entrar: SponsorsReveal anima [data-net-line]) */}
                <path data-net-line d={PATHS[i]} pathLength={1} fill="none" stroke="currentColor" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                {/* pulso: un tramo corto que corre del logo a Oriont cuando se enciende */}
                <path
                  d={PATHS[i]}
                  pathLength={1}
                  fill="none"
                  stroke="#248caa"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeDasharray="0.14 2"
                  strokeDashoffset={0.14}
                  vectorEffect="non-scaling-stroke"
                  className="opacity-0 peer-hover:animate-net-pulse peer-data-on:animate-net-pulse"
                />
              </svg>
            </li>
          );
        })}
      </ul>

      {/* nodo central: Oriont. Late cuando algún logo está encendido */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center"
        style={{ height: `${HUB_R * 2 * 100}%`, aspectRatio: "1" }}
      >
        <span className="absolute inset-0 rounded-full bg-[#248caa]/10 transition-[scale,opacity] duration-700 group-has-[[data-on]]/net:scale-[1.35] group-has-[[data-on]]/net:opacity-0 motion-reduce:transition-none" />
        <span className="relative grid size-full place-items-center rounded-full bg-white shadow-[0_12px_30px_-12px_rgba(33,37,92,0.35)] ring-1 ring-[#21255c]/10">
          <OriontMark className="h-[55%] w-[55%]" />
        </span>
      </div>
    </div>
  );
}
