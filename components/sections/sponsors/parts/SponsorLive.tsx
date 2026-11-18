"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { SPONSORS } from "@/data/sponsors";

gsap.registerPlugin(useGSAP);

/** mínimo entre un cambio de nombre y el siguiente (ms): con scroll se encienden logos muy seguido */
const MIN_GAP = 1100;

/**
 * Junto al título: "Conectados con Oriont" y el nombre de la marca que está encendida en el muro
 * (la que enciende SponsorScrollColor al azar, o la que está bajo el cursor), con su industria y su
 * número. El nombre cambia subiendo tras una máscara (como los títulos de la web). Escucha el atributo data-on de las celdas
 * [data-logo-cell][data-sponsor] de la sección: no enciende nada por su cuenta.
 * Alto fijo (una línea de nombre): los cambios de texto no mueven nada (sin CLS).
 */
export default function SponsorLive() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const section = el.closest("section") ?? document.body;
      const nameEl = el.querySelector<HTMLElement>("[data-live-name]")!;
      const indEl = el.querySelector<HTMLElement>("[data-live-industry]")!;
      const numEl = el.querySelector<HTMLElement>("[data-live-num]")!;
      const barEl = el.querySelector<HTMLElement>("[data-live-bar]")!;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let shown = 0;
      let last = 0;
      let pending: number | null = null;
      let timer = 0;
      // marca bajo el cursor: mientras haya una, manda ella (las que se encienden al azar no la cambian)
      let hovered: number | null = null;
      let tl: gsap.core.Timeline | undefined;

      const show = (i: number) => {
        if (i === shown) return;
        shown = i;
        last = performance.now();
        const s = SPONSORS[i];
        numEl.textContent = `${i + 1} de ${SPONSORS.length}`;
        if (reduce) {
          nameEl.textContent = s.name;
          indEl.textContent = s.industry;
          gsap.set(barEl, { scaleX: (i + 1) / SPONSORS.length });
          return;
        }
        // el nombre sale hacia arriba y el nuevo sube detrás de la máscara (como los títulos de la web);
        // la industria cambia con un fundido y la barra avanza. Si llega otro cambio a mitad de
        // camino, el anterior se corta y el nuevo sale desde donde quedó.
        // (Sin overwrite por tween ni immediateRender en la entrada: si no, la entrada se aplicaba
        // al crearse y el nombre anterior desaparecía de golpe en vez de salir.)
        tl?.kill();
        tl = gsap
          .timeline()
          .to(nameEl, { yPercent: -100, opacity: 0, duration: 0.35, ease: "power2.in" })
          .to(indEl, { opacity: 0, duration: 0.25 }, 0)
          .add(() => {
            nameEl.textContent = s.name;
            indEl.textContent = s.industry;
          })
          .fromTo(
            nameEl,
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", immediateRender: false },
          )
          .to(indEl, { opacity: 1, duration: 0.4 }, "<0.15")
          .to(barEl, { scaleX: (i + 1) / SPONSORS.length, duration: 0.8, ease: "power2.inOut" }, 0);
      };

      // si se encienden varias seguidas, se muestra la última cuando pasa el mínimo
      const request = (i: number) => {
        if (hovered !== null) return;
        const wait = MIN_GAP - (performance.now() - last);
        if (wait <= 0) return show(i);
        pending = i;
        if (!timer)
          timer = window.setTimeout(() => {
            timer = 0;
            if (pending !== null) show(pending);
            pending = null;
          }, wait);
      };

      // solo las celdas visibles (celular: grilla · escritorio: circuito)
      const mo = new MutationObserver((list) => {
        for (const m of list) {
          const cell = m.target as HTMLElement;
          // (SponsorScrollColor solo enciende los de la versión visible: no hace falta medir)
          if (!cell.hasAttribute("data-on")) continue;
          request(Number(cell.dataset.sponsor));
        }
      });
      section.querySelectorAll<HTMLElement>("[data-logo-cell][data-sponsor]").forEach((c) => {
        mo.observe(c, { attributes: true, attributeFilter: ["data-on"] });
        // con el cursor: se muestra al tiro (sin esperar el mínimo) y queda fija hasta que sale
        c.addEventListener("pointerenter", () => {
          hovered = Number(c.dataset.sponsor);
          clearTimeout(timer);
          timer = 0;
          pending = null;
          show(hovered);
        });
        c.addEventListener("pointerleave", () => {
          if (hovered === Number(c.dataset.sponsor)) hovered = null;
        });
      });

      return () => {
        mo.disconnect();
        tl?.kill();
        clearTimeout(timer);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="border-l border-[#21255c]/10 pl-8 xl:pl-10">
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#21255c]/50">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#248caa]" />
        Conectados con Oriont
      </p>
      {/* una sola línea de alto fijo (un nombre largo no salta a dos líneas); la máscara recorta
          el nombre mientras sube */}
      <div className="mt-4 overflow-hidden">
        <p
          data-live-name
          className="overflow-hidden text-ellipsis whitespace-nowrap font-display will-change-[transform,opacity] text-[44px] font-semibold leading-[1.1] tracking-tight text-[#21255c] xl:text-[56px]"
        >
          {SPONSORS[0].name}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-[14px] text-[#21255c]/55">
        <span data-live-industry className="font-medium text-[#248caa] will-change-[opacity]">
          {SPONSORS[0].industry}
        </span>
        <span data-live-num>{`1 de ${SPONSORS.length}`}</span>
      </div>
      {/* avance por las marcas: solo transform */}
      <div className="mt-3 h-px w-full bg-[#21255c]/10">
        <div
          data-live-bar
          className="h-px w-full origin-left bg-[#248caa] will-change-transform"
          style={{ transform: `scaleX(${1 / SPONSORS.length})` }}
        />
      </div>
    </div>
  );
}
