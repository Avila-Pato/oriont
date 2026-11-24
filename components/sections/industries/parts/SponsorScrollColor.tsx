"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** cada cuánto se enciende un logo nuevo mientras se hace scroll (ms) */
const EVERY = 220;
/** cada cuánto se enciende uno con la pantalla quieta (ms): más tranquilo que con scroll */
const IDLE_EVERY = 3000; // antes 1300: el nombre de SponsorLive quedaba animándose casi sin pausa
/** cuánto queda encendido cada logo (ms) */
const HOLD = 1100;

/**
 * Enciende logos EN ORDEN (el de la lista de sponsors: 1, 2, 3… y vuelve a empezar) con su color de marca (marca la celda con data-on; el color y la
 * transición los pone SponsorLogo con CSS):
 * - mientras se hace scroll sobre la grilla, seguido
 * - con la grilla en pantalla y sin scroll, de a uno cada tanto
 * Cada logo se apaga solo. Fuera de pantalla no corre nada. No dibuja nada.
 */
export default function SponsorScrollColor() {
  useEffect(() => {
    // la sección solo se muestra en escritorio (abanico); se encienden solo las celdas visibles
    const grids = Array.from(document.querySelectorAll<HTMLElement>("[data-sponsor-grid]"));
    if (!grids.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // cuál se ve sale del ancho de pantalla (lg = 1024px, como en las clases), no de medir el
    // DOM: medir justo después de encender un logo forzaba a recalcular estilos en cada encendido
    const desktop = matchMedia("(min-width: 1024px)");
    const visible = () =>
      grids.find((g) => g.classList.contains("lg:hidden") !== desktop.matches) ?? grids[0];
    let grid = visible();
    // ordenadas por su número de sponsor (en el abanico el DOM va por anillos, no por la lista)
    const cellsOf = (g: HTMLElement) =>
      Array.from(g.querySelectorAll<HTMLElement>("[data-logo-cell]")).sort(
        (a, b) => Number(a.dataset.sponsor) - Number(b.dataset.sponsor),
      );
    let cells = cellsOf(grid);
    const timers = new Map<HTMLElement, number>();
    let last = 0;
    let prev = -1;

    const light = (gap: number) => {
      const now = performance.now();
      if (now - last < gap) return;
      last = now;
      // si cambió el ancho de pantalla y ahora se ve la otra versión
      const g = visible();
      if (g !== grid) {
        grid = g;
        cells = cellsOf(g);
        prev = -1;
      }
      // el siguiente de la lista (de 1 en 1)
      if (!cells.length) return;
      const i = (prev + 1) % cells.length;
      prev = i;
      const cell = cells[i];
      cell.setAttribute("data-on", "");
      clearTimeout(timers.get(cell));
      timers.set(
        cell,
        window.setTimeout(() => cell.removeAttribute("data-on"), HOLD),
      );
    };

    // con scroll. El encendido (escribir data-on) se deja para el final del ticker de GSAP: si se
    // hace dentro de ScrollTrigger.update, el siguiente trigger lee el scroll con el estilo ya
    // cambiado y el navegador tiene que recalcular estilos en el acto (en cada cuadro de scroll)
    let pending = false;
    const flush = () => {
      if (!pending) return;
      pending = false;
      light(EVERY);
    };
    gsap.ticker.add(flush);
    const st = ScrollTrigger.create({
      trigger: grids[0].parentElement ?? grid,
      start: "top bottom",
      end: "bottom top",
      onUpdate: () => {
        pending = true;
      },
    });

    // con la pantalla quieta (si hubo scroll hace poco, light() lo deja pasar: no se duplica)
    let idle = 0;
    const loop = () => {
      light(IDLE_EVERY);
      idle = window.setTimeout(loop, IDLE_EVERY);
    };
    // Solo con al menos un cuarto del muro a la vista: con apenas el borde asomando (en Nosotros
    // quedan ~60 px arriba) el ciclo seguía encendiendo logos y SponsorLive animaba el nombre con
    // GSAP (~65 escrituras de estilo/s y ~30 repintados/s en Firefox) sin que nadie lo viera.
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries.find((x) => x.target === visible()) ?? entries[0];
        clearTimeout(idle);
        if (e.isIntersecting && e.intersectionRatio >= 0.25) idle = window.setTimeout(loop, IDLE_EVERY);
      },
      { threshold: [0, 0.25] },
    );
    grids.forEach((g) => io.observe(g));

    return () => {
      gsap.ticker.remove(flush);
      st.kill();
      io.disconnect();
      clearTimeout(idle);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return null;
}
