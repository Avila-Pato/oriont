"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { SPONSORS } from "@/data/sponsors";
import { OriontMark } from "@/components/ui/OriontLogo";
import { useNearViewport } from "@/hooks/useNearViewport";

import logoConectados from "@/public/images/Logo_ConectadosTMK_mark.webp";
import logoDental from "@/public/images/Logo_DentalAssist.webp";

import { CELL_ENTRANCE } from "./cellEntrance";
import SponsorLogo from "./SponsorLogo";
import { W, H, C, HUBS, SPIN_SPEED, SPIN_PAD, SPINNING, AWAKE_MS, toFirstRing, DRAWING } from "./circuitDrawing";
import { COLORS } from "@/data/colors";

gsap.registerPlugin(useGSAP);

/**
 * DrawSVG + MotionPath (~28 KB) solo los usa la señal al pasar el cursor por un logo: se bajan
 * aparte (import dinámico) cuando el abanico se acerca a la pantalla. En celular el abanico está
 * oculto (display:none), nunca se "acerca" y no se descargan.
 */
let signalPlugins: Promise<void> | null = null;
const loadSignalPlugins = () =>
  (signalPlugins ??= Promise.all([import("gsap/DrawSVGPlugin"), import("gsap/MotionPathPlugin")]).then(([d, m]) => {
    gsap.registerPlugin(d.DrawSVGPlugin, m.MotionPathPlugin);
  }));

/*
 * Escritorio: "abanico de circuito". Las 3 marcas del grupo (Conectados TMK, Oriont, Dental Assist)
 * al medio del borde izquierdo y, desde ahí, arcos concéntricos de trazo fino que se abren en
 * medio círculo hacia la derecha, cortados en tramos, con conectores radiales y puntos
 * en las puntas; hacia afuera se desvanecen. Los logos van sobre los arcos.
 * - El dibujo aparece una vez al llegar, desde el centro hacia afuera (fundido anillo por anillo y
 *   un leve crecimiento) y algunos anillos (SPINNING) giran lento, en sentidos alternos (anillos
 *   completos: al girar no aparecen huecos). El giro se pausa fuera de pantalla.
 * Rendimiento: cada anillo son 3 trazos (tramos, conectores, puntos) en vez de ~40 elementos, y la
 * entrada solo anima transform/opacity de capas (no repinta trazos ni recorta con clip-path). Los
 * anillos que giran van en capas propias rotadas por CSS: el giro no repinta nada en el hilo principal.
 * - Al pasar el cursor por un logo, una señal celeste viaja en línea recta hasta el primer arco del
 *   abanico, a un punto distinto cada vez (el encendido de colores de a uno lo hace SponsorScrollColor).
 * - La entrada de los logos la hace SponsorsReveal ([data-logo-cell]).
 * Va a todo el ancho de la pantalla (IndustriesSection lo pone fuera del contenedor) para que el abanico
 * vaya de borde a borde. Arcos circulares (sin deformar): los grandes se recortan arriba y abajo.
 * El dibujo es fijo (azar con semilla): el mismo en servidor y navegador. Contenedor con
 * proporción fija y solo transform/opacity/trazo animados: sin layout shift.
 */


const pctX = (x: number) => `${(x / W) * 100}%`;
const pctY = (y: number) => `${(y / H) * 100}%`;
const HUB_CLASS =
  "absolute z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_12px_30px_-12px_rgba(33,37,92,0.35)] ring-1 ring-navy/10";

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
      // imágenes del abanico decodificadas por adelantado (la sección está a una pantalla): si no,
      // se decodificaban y subían a la GPU justo en el cuadro en que aparecían (tirón)
      root.current?.querySelectorAll<HTMLImageElement>("[data-art] img").forEach((img) => img.decode().catch(() => {}));
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(root);

        // El dibujo aparece UNA vez, desde las 3 marcas hacia afuera:
        // - todo el dibujo crece apenas desde el centro de los arcos
        // - los anillos que giran aparecen con fundido, del más chico al más grande
        // - los anillos quietos (un solo SVG) aparecen al final
        // Rendimiento:
        // - Web Animations (el.animate), no GSAP: solo transform/opacity, así el navegador la corre
        //   entera en el compositor y el hilo principal no trabaja en cada cuadro.
        // - Ocultos solo con opacity 0 (no visibility:hidden como autoAlpha): así las capas se
        //   rasterizan antes, con la sección aún lejos, y no todas de golpe al empezar la entrada.
        // - El giro espera a que termine la entrada (menos capas cambiando a la vez).
        // Antes crecía un clip-path circular: recortaba todo el dibujo en cada cuadro (lag).
        const el = root.current!;
        const art = q<HTMLElement>("[data-art]")[0];
        const spins = q<HTMLElement>("[data-ring-spin]"); // en el DOM van de menor a mayor radio
        const still = q<HTMLElement>("[data-art-still]")[0];
        const faded = [...spins, still];
        faded.forEach((f) => (f.style.opacity = "0"));

        let entering = false;
        let onScreen = false;
        // Giro (y el punto que late en SponsorLive) solo un rato: al entrar y mientras haya scroll o
        // mouse en la sección; con la página quieta AWAKE_MS se detienen. Cualquier animación
        // continua obliga al navegador a recomponer TODA la pantalla 60 veces por segundo (aunque
        // sea un punto de 6 px): eso era ~todo el gasto de GPU estando en Industrias.
        let awake = false;
        let sleepTimer = 0;
        // data-spin va en la <section>: así alcanza también al punto que late (fuera de este bloque)
        const host = el.closest("section") ?? el;
        const spinIfVisible = () => (onScreen && !entering && awake ? (host.dataset.spin = "on") : delete host.dataset.spin);
        const wake = () => {
          clearTimeout(sleepTimer);
          sleepTimer = window.setTimeout(() => {
            awake = false;
            spinIfVisible();
          }, AWAKE_MS);
          if (!awake) {
            awake = true;
            spinIfVisible();
          }
        };
        const onActivity = () => onScreen && wake();
        host.addEventListener("pointermove", onActivity, { passive: true });
        const anims: Animation[] = [];
        const reveal = () => {
          entering = true;
          spinIfVisible();
          const ease = "cubic-bezier(0.22, 1, 0.36, 1)"; // ~power3.out
          anims.push(
            art.animate([{ transform: "scale(0.94)" }, { transform: "scale(1)" }], {
              duration: 1600,
              easing: ease,
            }),
            ...spins.map((s, i) => s.animate({ opacity: [0, 1] }, { duration: 600, delay: i * 120, easing: "ease-out", fill: "backwards" })),
            still.animate({ opacity: [0, 1] }, { duration: 900, delay: 500, easing: "ease-out", fill: "backwards" }),
          );
          // los valores finales quedan en el estilo y se sueltan las animaciones (nada que componer después)
          faded.forEach((f) => (f.style.opacity = ""));
          void Promise.all(anims.map((a) => a.finished))
            .then(() => {
              anims.forEach((a) => a.cancel());
              entering = false;
              spinIfVisible();
            })
            .catch(() => {}); // cancelada al desmontar
        };
        art.style.transformOrigin = `${(C.x / W) * 100}% 50%`;
        // Los dos momentos (entrar y estar a la vista) los avisan IntersectionObserver, no
        // ScrollTrigger: crear un ScrollTrigger a una pantalla de distancia obliga a medir toda la
        // página en pleno scroll; el observer avisa sin leer estilos ni posiciones.
        // Entrada: cuando el borde superior pasa el 75 % de la pantalla ("top 75%"); si ya está
        // más arriba (salto de ancla), también
        const enterIo = new IntersectionObserver(
          ([e]) => {
            if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
            enterIo.disconnect();
            reveal();
          },
          { rootMargin: "0px 0px -25% 0px" },
        );
        enterIo.observe(el);

        // giro: solo algunos anillos (SPINNING), por CSS en el compositor (globals.css,
        // circuit-spin). Acá solo se pausa fuera de pantalla y durante la entrada.
        const pause = () => {
          clearTimeout(sleepTimer);
          host.removeEventListener("pointermove", onActivity);
          delete host.dataset.spin;
        };
        // Solo con una parte real del abanico a la vista (entre el 80 % y el 20 % de la pantalla):
        // con "top bottom / bottom top" seguía girando con apenas 60 px asomando arriba (en Nosotros),
        // y las capas grandes que giran eran ~todo el uso de GPU de esa sección.
        const viewIo = new IntersectionObserver(
          ([e]) => {
            if (e.isIntersecting === onScreen) return;
            onScreen = e.isIntersecting;
            if (onScreen) wake();
            spinIfVisible();
          },
          { rootMargin: "-20% 0px -20% 0px" },
        );
        viewIo.observe(el);
        // hacer scroll dentro de la sección la mantiene despierta
        window.addEventListener("scroll", onActivity, { passive: true });

        // señal: al pasar el cursor por un logo, un punto celeste corre por su trazo hasta el primer
        // arco del abanico
        const cells = q<HTMLElement>("[data-logo-cell]");
        const traces = q<SVGPathElement>("[data-trace]");
        const sparks = q<SVGCircleElement>("[data-spark]");
        const busy = new Set<number>();
        let ready = false;
        void loadSignalPlugins().then(() => (ready = true));
        const signal = (i: number) => {
          if (!ready || busy.has(i)) return; // sin plugins aún: ese paso del cursor no dispara señal

          busy.add(i);
          // cada vez llega a un punto distinto del primer arco (al azar)
          traces[i].setAttribute("d", toFirstRing(DRAWING.nodes[i], Math.random() * 2 - 1));
          gsap
            .timeline({ onComplete: () => busy.delete(i) })
            // el SVG de las señales va oculto (visibility): solo se muestra la que está corriendo
            .set([traces[i], sparks[i]], { opacity: 1, visibility: "visible" })
            .fromTo(traces[i], { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.7, ease: "power2.inOut" })
            .to(
              sparks[i],
              { motionPath: { path: traces[i], align: traces[i], alignOrigin: [0.5, 0.5] }, duration: 0.7, ease: "power2.inOut" },
              0,
            )
            .to(sparks[i], { opacity: 0, duration: 0.2 })
            .to(traces[i], { opacity: 0, duration: 0.8 }, "+=0.3")
            .set([traces[i], sparks[i]], { visibility: "hidden" });
        };
        const enter = cells.map((c, i) => {
          const fn = () => signal(i);
          c.addEventListener("pointerenter", fn);
          return fn;
        });
        return () => {
          pause();
          enterIo.disconnect();
          viewIo.disconnect();
          window.removeEventListener("scroll", onActivity);
          // lo que no maneja GSAP (Web Animations y estilos puestos a mano) se deshace aquí
          anims.forEach((a) => a.cancel());
          faded.forEach((f) => (f.style.opacity = ""));
          art.style.transformOrigin = "";
          cells.forEach((c, i) => c.removeEventListener("pointerenter", enter[i]));
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [near], revertOnUpdate: true },
  );


  return (
    <div ref={root} className="relative hidden aspect-[1500/600] w-full [--logo-h:26px] lg:block xl:[--logo-h:32px]">
      {/* todo el dibujo (la entrada lo hace crecer apenas y aparecer anillo por anillo) */}
      <div data-art aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* anillos que giran: cada uno en su capa (cuadrado de 2·(r + SPIN_PAD) centrado en C) rotada
            por CSS. Son imágenes WebP (/sponsor-ring-<r>.webp, generadas en el build desde la misma
            geometría): como SVG, la primera vez la GPU tenía que dibujar todos sus trazos y se
            notaba un tirón al acercarse a la sección */}
        {DRAWING.rings
          .filter((ring) => SPINNING.includes(ring.r))
          .map((ring, i) => (
            <div
              key={ring.r}
              data-ring-spin
              className="absolute"
              style={
                {
                  left: pctX(C.x - ring.r - SPIN_PAD),
                  top: pctY(C.y - ring.r - SPIN_PAD),
                  width: pctX((ring.r + SPIN_PAD) * 2),
                  height: pctY((ring.r + SPIN_PAD) * 2),
                  // misma velocidad en el borde (los grandes giran más lento), sentidos alternos
                  "--spin-dur": `${Math.round((2 * Math.PI * ring.r) / SPIN_SPEED)}s`,
                  animationDirection: i % 2 ? "reverse" : "normal",
                } as CSSProperties
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen generada: next/image no aporta nada */}
              <img
                src={`/sponsor-ring-${ring.r}.webp`}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="size-full select-none"
              />
            </div>
          ))}
      {/* anillos quietos: imagen de píxeles (/sponsor-circuit.webp, generada en el build desde la misma
          geometría). Al ser píxeles, volver a mostrarla es solo copiarla; como SVG (en la página o
          como <img> .svg) cada vuelta a la pantalla había que rasterizar todos los trazos con degradado. lazy: en celular el
          abanico está oculto y no se descarga */}
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG generado: next/image no aporta nada */}
      <img
        data-art-still
        src="/sponsor-circuit.webp"
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full select-none"
      />
      {/* señales de cada logo. Oculto (visibility): con
          los 46 trazos/puntos invisibles igual se rasterizaba la capa entera cada vez que la sección
          volvía a la pantalla (~110 ms de GPU al subir). La señal en curso se muestra sola (los
          hijos con visibility:visible se ven aunque el SVG esté oculto) */}
      <svg viewBox={`0 0 ${W} ${H}`} className="invisible absolute inset-0 size-full overflow-hidden">
        {/* señales: ocultas hasta que su logo se enciende */}
        <g fill="none" stroke={COLORS.accent} strokeWidth={1.6} strokeLinecap="round">
          {DRAWING.nodes.map((n, i) => (
            <path key={i} data-trace d={n.trace} opacity={0} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g fill={COLORS.accent}>
          {DRAWING.nodes.map((_, i) => (
            <circle key={i} data-spark r={4} opacity={0} />
          ))}
        </g>
      </svg>
      </div>

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
