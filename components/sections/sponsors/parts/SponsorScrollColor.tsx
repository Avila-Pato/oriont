"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** cada cuánto se enciende un logo nuevo mientras se hace scroll (ms) */
const EVERY = 220;
/** cada cuánto se enciende uno con la pantalla quieta (ms): más tranquilo que con scroll */
const IDLE_EVERY = 1300;
/** cuánto queda encendido cada logo (ms) */
const HOLD = 1100;

/**
 * Enciende logos al azar con su color de marca (marca la celda con data-on; el color y la
 * transición los pone SponsorGrid con CSS):
 * - mientras se hace scroll sobre la grilla, seguido
 * - con la grilla en pantalla y sin scroll, de a uno cada tanto
 * Cada logo se apaga solo. Fuera de pantalla no corre nada. No dibuja nada.
 */
export default function SponsorScrollColor() {
  useEffect(() => {
    // hay dos versiones (grilla en celular, red en escritorio): se encienden solo las visibles
    const grids = Array.from(document.querySelectorAll<HTMLElement>("[data-sponsor-grid]"));
    if (!grids.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const visible = () => grids.find((g) => g.getClientRects().length > 0) ?? grids[0];
    let grid = visible();
    const cellsOf = (g: HTMLElement) => Array.from(g.querySelectorAll<HTMLElement>("[data-logo-cell]"));
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
      // al azar, sin repetir el anterior ni uno que ya está encendido; en la cinta del celular,
      // solo los que están dentro de la pantalla (el resto va pasando fuera de vista)
      const vw = window.innerWidth;
      const inView = (c: HTMLElement) => {
        const r = c.getBoundingClientRect();
        return r.left >= 0 && r.right <= vw;
      };
      const free = cells
        .map((_, i) => i)
        .filter((i) => i !== prev && !cells[i].hasAttribute("data-on") && inView(cells[i]));
      if (!free.length) return;
      const i = free[Math.floor(Math.random() * free.length)];
      prev = i;
      const cell = cells[i];
      cell.setAttribute("data-on", "");
      clearTimeout(timers.get(cell));
      timers.set(
        cell,
        window.setTimeout(() => cell.removeAttribute("data-on"), HOLD),
      );
    };

    // con scroll
    const st = ScrollTrigger.create({
      trigger: grids[0].parentElement ?? grid,
      start: "top bottom",
      end: "bottom top",
      onUpdate: () => light(EVERY),
    });

    // con la pantalla quieta (si hubo scroll hace poco, light() lo deja pasar: no se duplica)
    let idle = 0;
    const loop = () => {
      light(IDLE_EVERY);
      idle = window.setTimeout(loop, IDLE_EVERY);
    };
    const io = new IntersectionObserver((entries) => {
      const e = entries.find((x) => x.target === visible()) ?? entries[0];
      clearTimeout(idle);
      if (e.isIntersecting) idle = window.setTimeout(loop, IDLE_EVERY);
    });
    grids.forEach((g) => io.observe(g));

    return () => {
      st.kill();
      io.disconnect();
      clearTimeout(idle);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return null;
}
