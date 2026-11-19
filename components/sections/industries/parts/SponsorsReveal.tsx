"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextPlugin } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import { useNearViewport } from "@/hooks/useNearViewport";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** SplitText (~10 KB) solo lo usa esta entrada, más abajo en la página: se baja aparte (import
 *  dinámico) cuando la sección se acerca, no en la carga inicial */
let splitLoading: Promise<typeof SplitTextPlugin> | null = null;
const loadSplitText = () =>
  (splitLoading ??= import("gsap/SplitText").then((m) => {
    gsap.registerPlugin(m.SplitText);
    return m.SplitText;
  }));

/**
 * Entrada de la sección Sponsors atada al scroll (scrub): avanza y retrocede con la rueda del mouse.
 * La línea del título se dibuja, las palabras suben tras una máscara y aparece el párrafo; los
 * logos (SponsorGrid / SponsorCircuit) entran una vez en ola, con transiciones CSS (cellEntrance.ts).
 * Solo transform/opacity (sin CLS). El contenido llega renderizado desde el servidor como children;
 * aquí solo se anima, buscando por data-atributos:
 *   [data-reveal-line]  [data-reveal-title]  [data-reveal-text]  [data-logo-cell]
 * (el dibujo de los arcos en escritorio lo anima SponsorCircuit por su cuenta)
 */
export default function SponsorsReveal({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  const scope = useRef<HTMLElement>(null);
  // se prepara a una pantalla de distancia, no durante la carga (igual que las otras secciones)
  const near = useNearViewport(scope);

  useGSAP(
    (_, contextSafe) => {
      if (!near) return;
      const mm = gsap.matchMedia();

      // Se arma en un momento libre, no en el mismo cuadro en que se activa data-near: ese cambio
      // deja los estilos sin calcular (máscaras de los logos) y GSAP, al leer los valores de
      // partida, obligaba a recalcularlos en el acto (una tarea de ~120 ms con CPU lenta, que se
      // sentía como un salto justo al soltarse la cadena de valor). La sección está a una
      // pantalla de distancia, así que hay tiempo de sobra.
      const build = contextSafe!((SplitText: typeof SplitTextPlugin) =>
        mm.add(
          { motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" },
          (ctx) => {
            if (!ctx.conditions?.motion) return;
            const split = SplitText.create("[data-reveal-title]", { type: "words", mask: "words" });

            const tl = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: scope.current,
                start: "top 85%",
                end: "top 15%",
                scrub: 0.8, // segundos que tarda en "alcanzar" al scroll: suaviza la rueda
              },
            });

            tl.from("[data-reveal-line]", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.3 }, 0)
              .from(split.words, { yPercent: 110, duration: 0.4, stagger: 0.06, ease: "power2.out" }, 0.08)
              .from("[data-reveal-text]", { opacity: 0, y: 24, duration: 0.4 }, 0.3);

            // logos: entran una vez, en ola, con transiciones CSS (cellEntrance.ts): aquí solo se
            // marca la lista de la versión visible (escritorio: abanico · celular: grilla), sin
            // leer estilos. La ola va en el orden de la lista: en el abanico ese orden ya va de los
            // anillos de adentro hacia afuera.
            const grid = gsap.utils
              .toArray<HTMLElement>("[data-sponsor-grid]")
              .find((g) => g.classList.contains("lg:hidden") !== !!ctx.conditions?.desktop);
            if (grid && grid.dataset.cells !== "in") {
              grid.dataset.cells = "out";
              ScrollTrigger.create({
                trigger: grid,
                start: "top 85%",
                once: true,
                onEnter: () => (grid.dataset.cells = "in"),
              });
            }

            return () => {
              split.revert();
              // si se revierte antes de entrar (cambio de tamaño), los logos quedan a la vista
              if (grid?.dataset.cells === "out") delete grid.dataset.cells;
            };
          },
        ),
      );

      // el plugin se pide ya (en paralelo); se arma en el momento libre, cuando ya llegó
      let cancelled = false;
      const split = loadSplitText();
      const setup = () => void split.then((S) => !cancelled && build(S));
      const idle = window.requestIdleCallback?.(setup, { timeout: 400 }) ?? window.setTimeout(setup, 60);
      return () => {
        cancelled = true;
        if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
        else clearTimeout(idle);
        mm.revert();
      };
    },
    { scope, dependencies: [near] },
  );

  return (
    // data-near: la sección está a una pantalla de distancia. Recién ahí SponsorLogo aplica su
    // máscara de color (mask-image con la URL del logo): las máscaras CSS no tienen carga
    // diferida y, sin esto, los 23 logos (~340 KB) se bajaban y decodificaban al cargar la página
    <section ref={scope} id={id} className={className} data-near={near || undefined}>
      {children}
    </section>
  );
}
