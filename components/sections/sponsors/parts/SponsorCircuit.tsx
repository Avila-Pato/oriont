"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

import { SPONSORS } from "@/data/sponsors";
import { OriontMark } from "@/components/ui/OriontLogo";
import { useNearViewport } from "@/hooks/useNearViewport";

import logoConectados from "@/public/images/Logo_ConectadosTMK_mark.webp";
import logoDental from "@/public/images/Logo_DentalAssist.webp";

import { CELL_ENTRANCE } from "./cellEntrance";
import SponsorLogo from "./SponsorLogo";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, useGSAP);

/*
 * Escritorio: "abanico de circuito". Las 3 marcas del grupo (Conectados TMK, Oriont, Dental Assist)
 * al medio del borde izquierdo y, desde ahí, arcos concéntricos de trazo fino que se abren en
 * medio círculo hacia la derecha, cortados en tramos, con conectores radiales y puntos
 * en las puntas; hacia afuera se desvanecen. Los logos van sobre los arcos.
 * - El dibujo aparece con el scroll desde el centro hacia afuera (un círculo de recorte que crece,
 *   scrub) y los anillos giran lento, cada uno en un sentido (anillos completos: al girar no
 *   aparecen huecos). El giro se pausa fuera de pantalla.
 * Rendimiento: cada anillo son 3 trazos (tramos, conectores, puntos) en vez de ~40 elementos, y la
 * entrada anima un solo valor (el radio del recorte) en vez de cientos de trazos por frame.
 * - Al pasar el cursor por un logo, una señal celeste viaja por su trazo hasta la marca del grupo
 *   más cercana (con el scroll los logos solo toman su color: SponsorScrollColor).
 * - La entrada de los logos la hace SponsorsReveal ([data-logo-cell]).
 * Va a todo el ancho de la pantalla (SponsorsSection lo pone fuera del contenedor) para que el abanico
 * vaya de borde a borde. Arcos circulares (sin deformar): los grandes se recortan arriba y abajo.
 * El dibujo es fijo (azar con semilla): el mismo en servidor y navegador. Contenedor con
 * proporción fija y solo transform/opacity/trazo animados: sin layout shift.
 */

const W = 1500;
const H = 600;
const C = { x: 50, y: H / 2 }; // centro de los arcos: al medio del borde izquierdo
const R_MAX = 1500; // radio del arco más grande (ahí ya se desvaneció)
/** las 3 marcas del grupo sobre un arco chico alrededor del centro (Oriont al medio); las señales llegan a su borde */
const HUB_ARC = 150;
const HUBS = (
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
const RINGS = [330, 500, 670, 840, 1010, 1180, 1350]; // anillos con logos
/** velocidad del giro en el borde de cada anillo (unidades del dibujo por segundo) */
const SPIN_SPEED = 20;
const GHOSTS = [250, 415, 585, 755, 925, 1095, 1265, 1310, 1420]; // anillos solo de trazo (los de afuera, muy tenues)

const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r };
};
const arc = (r: number, a0: number, a1: number) => {
  const p = pt(r, a0);
  const q = pt(r, a1);
  return `M${r1(p.x)} ${r1(p.y)}A${r} ${r} 0 0 1 ${r1(q.x)} ${r1(q.y)}`;
};
/** tramo del medio círculo (grados, -90 = arriba, 0 = derecha, 90 = abajo) que cabe en el recuadro */
const rangeOf = (r: number, fits: (p: { x: number; y: number }) => boolean, margin = 0) => {
  let lo = 93;
  let hi = -93;
  for (let a = -92; a <= 92; a += 0.5)
    if (fits(pt(r, a))) {
      lo = Math.min(lo, a);
      hi = Math.max(hi, a);
    }
  return [lo + margin, hi - margin] as const;
};
const logoFits = (p: { x: number; y: number }) => p.x >= 110 && p.x <= 1400 && p.y >= 45 && p.y <= H - 45;
/** largo de un tramo de arco (para repartir los logos según cuánto cabe en cada anillo) */
const arcLen = (r: number, lo: number, hi: number) => {
  let len = 0;
  for (let a = lo; a < hi; a += 0.5) {
    const p = pt(r, a);
    const q = pt(r, Math.min(hi, a + 0.5));
    len += Math.hypot(q.x - p.x, q.y - p.y);
  }
  return len;
};

/** trazo de la señal: del logo en línea recta al borde de la marca del grupo más cercana */
const toNearestHub = (n: { x: number; y: number }) => {
  const gap = (h: (typeof HUBS)[number]) => Math.hypot(n.x - h.x, n.y - h.y) - h.r;
  const h = HUBS.reduce((a, b) => (gap(b) < gap(a) ? b : a));
  const d = Math.hypot(n.x - h.x, n.y - h.y);
  return `M${n.x} ${n.y}L${r1(h.x + ((n.x - h.x) / d) * h.r)} ${r1(h.y + ((n.y - h.y) / d) * h.r)}`;
};

/** azar con semilla (mulberry32) */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DRAWING = (() => {
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
      nodes.push({ ...p, trace: toNearestHub(p) });
    }
  });
  return { rings, nodes };
})();

const pctX = (x: number) => `${(x / W) * 100}%`;
const pctY = (y: number) => `${(y / H) * 100}%`;
const HUB_CLASS =
  "absolute z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_12px_30px_-12px_rgba(33,37,92,0.35)] ring-1 ring-[#21255c]/10";

function HubMark({ k, className }: { k: string; className: string }) {
  if (k === "oriont") return <OriontMark className={className} />;
  const src = k === "conectados" ? logoConectados : logoDental;
  return <Image src={src} alt="" sizes="96px" className={`${className} object-contain`} />;
}

export default function SponsorCircuit() {
  const root = useRef<HTMLDivElement>(null);
  const near = useNearViewport(root);

  useGSAP(
    () => {
      if (!near) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);

        // el dibujo aparece con el scroll desde las 3 marcas hacia afuera: crece el radio del recorte
        gsap.from(q("[data-reveal]"), {
          attr: { r: HUB_ARC },
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "center 50%", scrub: 0.8 },
        });

        // giro continuo: misma velocidad en el borde de todos los anillos (los grandes giran más
        // lento), sentidos alternos. Solo corre con la sección en pantalla.
        // Rendimiento: cada paso de giro obliga a repintar todo el SVG, así que se actualiza a
        // 30 fps (a ~20 px/s cada paso mueve menos de 1 px: se ve igual) y escribiendo el transform
        // directo, en vez de 17 tweens de GSAP a 60 fps. Va al final del ticker de GSAP (no en un
        // requestAnimationFrame propio): así escribe después de que Lenis y ScrollTrigger leen el
        // scroll, y no los obliga a recalcular estilos.
        const rings = q<SVGGElement>("[data-ring]");
        const degPerMs = DRAWING.rings.map((ring, i) => ((i % 2 ? -1 : 1) * 360 * SPIN_SPEED) / (2 * Math.PI * ring.r) / 1000);
        let running = false;
        let elapsed = 0; // ms de giro acumulados (solo cuenta mientras corre)
        let prev = 0;
        let drawn = 0;
        const tick = () => {
          const now = performance.now();
          elapsed += Math.min(100, now - prev); // tope: al volver de una pausa no da un salto
          prev = now;
          if (now - drawn < 1000 / 30 - 2) return;
          drawn = now;
          rings.forEach((g, i) => g.setAttribute("transform", `rotate(${(elapsed * degPerMs[i]) % 360} ${C.x} ${C.y})`));
        };
        const play = () => {
          if (running) return;
          running = true;
          prev = performance.now();
          gsap.ticker.add(tick);
        };
        const pause = () => {
          running = false;
          gsap.ticker.remove(tick);
        };
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? play() : pause()),
        });

        // señal: al pasar el cursor por un logo, un punto celeste corre por su trazo hasta la marca
        // del grupo más cercana (con el scroll no: los logos solo toman su color)
        const cells = q<HTMLElement>("[data-logo-cell]");
        const traces = q<SVGPathElement>("[data-trace]");
        const sparks = q<SVGCircleElement>("[data-spark]");
        const busy = new Set<number>();
        const signal = (i: number) => {
          if (busy.has(i)) return;
          busy.add(i);
          gsap
            .timeline({ onComplete: () => busy.delete(i) })
            .set([traces[i], sparks[i]], { opacity: 1 })
            .fromTo(traces[i], { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.7, ease: "power2.inOut" })
            .to(
              sparks[i],
              { motionPath: { path: traces[i], align: traces[i], alignOrigin: [0.5, 0.5] }, duration: 0.7, ease: "power2.inOut" },
              0,
            )
            .to(sparks[i], { opacity: 0, duration: 0.2 })
            .to(traces[i], { opacity: 0, duration: 0.8 }, "+=0.3");
        };
        const enter = cells.map((c, i) => {
          const fn = () => signal(i);
          c.addEventListener("pointerenter", fn);
          return fn;
        });
        return () => {
          pause();
          cells.forEach((c, i) => c.removeEventListener("pointerenter", enter[i]));
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [near], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="relative hidden aspect-[1500/600] w-full [--logo-h:26px] lg:block xl:[--logo-h:32px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-hidden" aria-hidden>
        <defs>
          {/* se desvanece hacia afuera */}
          <radialGradient
            id="sponsor-circuit-fade"
            gradientUnits="userSpaceOnUse"
            cx={0}
            cy={0}
            r={R_MAX}
            gradientTransform={`translate(${C.x} ${C.y})`}
          >
            <stop offset="0.55" stopColor="#21255c" />
            <stop offset="1" stopColor="#21255c" stopOpacity="0" />
          </radialGradient>
          {/* recorte de la entrada: un círculo desde el centro (su radio lo anima el scroll) */}
          <clipPath id="sponsor-circuit-reveal">
            <circle data-reveal cx={C.x} cy={C.y} r={R_MAX} />
          </clipPath>
        </defs>
        {/* un grupo por anillo (gira entero); el degradado es radial desde el centro de giro, así
            que girar no cambia dónde se desvanece */}
        <g clipPath="url(#sponsor-circuit-reveal)" fill="none" stroke="url(#sponsor-circuit-fade)" strokeLinecap="round">
          {DRAWING.rings.map((ring) => (
            <g key={ring.r} data-ring>
              <path d={ring.segs} strokeWidth={ring.ghost ? 0.8 : 1.2} opacity={ring.ghost ? 0.12 : 0.26} vectorEffect="non-scaling-stroke" />
              <path d={ring.ticks} strokeWidth={1.4} opacity={0.28} vectorEffect="non-scaling-stroke" />
              <path d={ring.dots} fill="#21255c" stroke="none" opacity={0.32} />
            </g>
          ))}
        </g>
        {/* señales: ocultas hasta que su logo se enciende */}
        <g fill="none" stroke="#248caa" strokeWidth={1.6} strokeLinecap="round">
          {DRAWING.nodes.map((n, i) => (
            <path key={i} data-trace d={n.trace} opacity={0} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g fill="#248caa">
          {DRAWING.nodes.map((_, i) => (
            <circle key={i} data-spark r={4} opacity={0} />
          ))}
        </g>
      </svg>

      <ul data-sponsor-grid aria-label="Marcas que confían en Oriont" className="absolute inset-0">
        {SPONSORS.map((s, i) => {
          const n = DRAWING.nodes[i];
          return (
            <li key={s.name}>
              {/* data-logo-cell: lo enciende SponsorScrollColor y lo hace entrar SponsorsReveal.
                  Fondo blanco para que el trazo no cruce el logo */}
              <span
                data-logo-cell
                data-sponsor={i}
                className={`group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white px-2 py-1.5 ${CELL_ENTRANCE}`}
                style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%`, "--i": i } as CSSProperties}
              >
                <SponsorLogo {...s} sizes="(min-width: 1280px) 180px, 140px" />
              </span>
            </li>
          );
        })}
      </ul>

      {/* las 3 marcas del grupo */}
      {HUBS.map((h) => (
        <div key={h.key} aria-hidden className={HUB_CLASS} style={{ left: pctX(h.x), top: pctY(h.y), width: pctX(h.r * 2), aspectRatio: "1" }}>
          <HubMark k={h.key} className={h.key === "dental" ? "h-[62%] w-[62%]" : "h-[55%] w-[55%]"} />
        </div>
      ))}
    </div>
  );
}
