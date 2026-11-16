"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import { useNearViewport } from "@/hooks/useNearViewport";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Entrada de la sección Sponsors atada al scroll (scrub): avanza y retrocede con la rueda del mouse.
 * La línea del título se dibuja, las palabras suben tras una máscara y aparece el párrafo; los
 * logos de la grilla (SponsorGrid) entran una vez en ola.
 * Solo transform/opacity (sin CLS). El contenido llega renderizado desde el servidor como children;
 * aquí solo se anima, buscando por data-atributos:
 *   [data-reveal-line]  [data-reveal-title]  [data-reveal-text]  [data-logo-cell]  [data-net-line]
 */
export default function SponsorsReveal({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  const scope = useRef<HTMLElement>(null);
  // se prepara a una pantalla de distancia, no durante la carga (igual que las otras secciones)
  const near = useNearViewport(scope);

  useGSAP(
    () => {
      if (!near) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
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

        // logos: entran una vez, en ola desde la esquina (se anima la celda, no la imagen, para
        // no pisar la opacidad del hover)
        gsap.from("[data-logo-cell]", {
          autoAlpha: 0,
          y: 24,
          duration: 0.6,
          ease: "power2.out",
          stagger: { grid: "auto", from: "start", amount: 0.6 },
          scrollTrigger: { trigger: "[data-logo-cell]", start: "top 85%", once: true },
        });

        // red (escritorio): las líneas se dibujan desde cada logo hacia Oriont
        gsap.from("[data-net-line]", {
          strokeDasharray: 1,
          strokeDashoffset: 1,
          duration: 1.2,
          ease: "power2.inOut",
          stagger: { each: 0.03, from: "random" },
          scrollTrigger: { trigger: "[data-net-line]", start: "top 85%", once: true },
          clearProps: "strokeDasharray,strokeDashoffset",
        });

        return () => split.revert();
      });
    },
    { scope, dependencies: [near] },
  );

  return (
    <section ref={scope} id={id} className={className}>
      {children}
    </section>
  );
}
