"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { useNearViewport } from "@/hooks/useNearViewport";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Sección Sponsors: el encabezado (etiqueta, título y párrafo) va quieto, sin animación de entrada
 * (antes la línea se dibujaba, las palabras subían tras una máscara con SplitText y aparecía el
 * párrafo: preparar eso trababa el scroll al acercarse y no aportaba). Solo los logos
 * (SponsorCircuit) entran una vez en ola, con transiciones CSS (cellEntrance.ts): aquí se marca
 * la lista visible con data-cells, sin leer estilos.
 * (el dibujo de los arcos en escritorio lo anima SponsorCircuit por su cuenta)
 */
export default function SponsorsReveal({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  const scope = useRef<HTMLElement>(null);
  // se prepara a una pantalla de distancia, no durante la carga (igual que las otras secciones)
  const near = useNearViewport(scope);

  useGSAP(
    () => {
      if (!near) return;
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 1024px)" },
        (ctx) => {
          if (!ctx.conditions?.motion) return;
          // logos: entran una vez, en ola, con transiciones CSS (cellEntrance.ts): aquí solo se
          // marca la lista de la versión visible (escritorio: abanico · celular: grilla). La ola va
          // en el orden de la lista: en el abanico ese orden ya va de los anillos de adentro hacia afuera.
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
          // si se revierte antes de entrar (cambio de tamaño), los logos quedan a la vista
          return () => {
            if (grid?.dataset.cells === "out") delete grid.dataset.cells;
          };
        },
      );
      return () => mm.revert();
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
