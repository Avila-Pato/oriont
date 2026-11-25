"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useNearViewport } from "@/hooks/useNearViewport";

/**
 * Sección Sponsors: el encabezado (etiqueta, título y párrafo) va quieto, sin animación de entrada
 * (antes la línea se dibujaba, las palabras subían tras una máscara con SplitText y aparecía el
 * párrafo: preparar eso trababa el scroll al acercarse y no aportaba). Solo los logos
 * (SponsorCircuit) entran una vez en ola, con transiciones CSS (cellEntrance.ts): aquí se marca
 * la lista visible con data-cells.
 * El momento de entrar lo avisa un IntersectionObserver, no ScrollTrigger: crear el ScrollTrigger
 * a una pantalla de distancia obligaba a medir toda la página en pleno scroll (~11 ms; 43 ms con
 * la CPU a 4x). El observer avisa sin leer estilos ni posiciones.
 * (el dibujo de los arcos en escritorio lo anima SponsorCircuit por su cuenta)
 */
export default function SponsorsReveal({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  const scope = useRef<HTMLElement>(null);
  // se prepara a una pantalla de distancia, no durante la carga (igual que las otras secciones)
  const near = useNearViewport(scope);

  useEffect(() => {
    if (!near || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // la lista de la versión visible (escritorio: abanico · celular: grilla), según el ancho
    // (lg = 1024px, como en las clases), sin medir el DOM. La ola va en el orden de la lista: en
    // el abanico ese orden ya va de los anillos de adentro hacia afuera.
    const desktop = matchMedia("(min-width: 1024px)").matches;
    const grid = Array.from(scope.current?.querySelectorAll<HTMLElement>("[data-sponsor-grid]") ?? []).find(
      (g) => g.classList.contains("lg:hidden") !== desktop,
    );
    if (!grid || grid.dataset.cells === "in") return;
    grid.dataset.cells = "out";
    // entra cuando su borde superior pasa el 85 % de la pantalla (como el "top 85%" de antes);
    // si ya está más arriba (se llegó con un salto de ancla), entra también
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
        grid.dataset.cells = "in";
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(grid);
    // si se desmonta antes de entrar, los logos quedan a la vista
    return () => {
      io.disconnect();
      if (grid.dataset.cells === "out") delete grid.dataset.cells;
    };
  }, [near]);

  return (
    // data-near: la sección está a una pantalla de distancia. Recién ahí SponsorLogo aplica su
    // máscara de color (mask-image con la URL del logo): las máscaras CSS no tienen carga
    // diferida y, sin esto, los 23 logos (~340 KB) se bajaban y decodificaban al cargar la página
    <section ref={scope} id={id} className={className} data-near={near || undefined}>
      {children}
    </section>
  );
}
