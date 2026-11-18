"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { openContact } from "@/components/contact/contactEvents";

gsap.registerPlugin(ScrollTrigger);

/**
 * Se emite antes de saltar a un ancla: las animaciones con pin que corren una sola vez (cadena de
 * valor) lo escuchan y terminan antes, porque al soltar el pin cambia el alto de la página y el
 * destino quedaría corrido.
 */
export const SKIP_INTRO_EVENT = "oriont:skip-intro";

/** Instancia activa de Lenis (null con scroll nativo: táctil o "reducir movimiento"). */
let current: Lenis | null = null;
/** Para scroll programático que no pelee con Lenis (si está activo, hay que usar su scrollTo). */
export const getLenis = () => current;

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Sin Lenis (scroll nativo) en:
    // - pantallas táctiles (celulares/tablets): el scroll nativo es más fluido ahí
    // - "reducir movimiento" activado
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (touch || reduce) return;

    const lenis = new Lenis({
      duration: 2.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    current = lenis;

    // Un solo loop: el ticker de GSAP mueve Lenis y Lenis avisa a ScrollTrigger.
    // Lenis va PRIMERO en el ticker (tercer argumento): mueve el scroll y ScrollTrigger lee
    // posiciones con el DOM todavía limpio, y recién después GSAP escribe los estilos de las
    // animaciones. Al final (como estaba) cada frame escribía estilos y después scrollTo los
    // obligaba a recalcularse en el acto (recálculo de estilo y layout forzados en cada frame).
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick, false, true);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      current = null;
    };
  }, []);

  // Enlaces a anclas (#nosotros, #contacto…) de toda la página: menú, botones del hero, etc.
  // Con o sin Lenis. El destino se calcula después de soltar los pin (SKIP_INTRO_EVENT).
  // Se llega al borde superior de la sección (cada una ya trae su espacio arriba para el menú);
  // con data-anchor-align="center", el elemento queda centrado en la pantalla.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href") ?? "#";
      // contacto: se abre el panel lateral en vez de recorrer toda la página hasta el final
      if (hash === "#contacto") {
        e.preventDefault();
        openContact();
        return;
      }
      const el = hash === "#" ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
      if (hash !== "#" && !el) return;
      e.preventDefault();

      window.dispatchEvent(new Event(SKIP_INTRO_EVENT));
      // un frame después: ya se quitaron los pin y ScrollTrigger recalculó
      requestAnimationFrame(() => {
        let top = 0;
        if (el) {
          const r = el.getBoundingClientRect();
          top = r.top + window.scrollY;
          // centrado en pantalla (si cabe): donde la sección se ve armada, p. ej. la cadena de valor
          if (el.dataset.anchorAlign === "center" && r.height < window.innerHeight)
            top -= (window.innerHeight - r.height) / 2;
          // [data-anchor-focus] dentro de la sección: lo importante (p. ej. las tarjetas de
          // servicios) debe quedar entero en pantalla. Si con el borde de arriba se corta por abajo,
          // se baja lo justo, sin que su parte de arriba quede bajo el menú flotante.
          const focus = el.querySelector<HTMLElement>("[data-anchor-focus]");
          if (focus) {
            const f = focus.getBoundingClientRect();
            const MENU = 96; // alto del menú flotante + aire
            const MARGIN = 24;
            const fitBottom = f.bottom + window.scrollY + MARGIN - window.innerHeight;
            const maxTop = f.top + window.scrollY - MENU;
            top = Math.max(top, Math.min(fitBottom, maxTop));
          }
          top = Math.max(0, top);
        }
        if (current) current.scrollTo(top);
        else {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
        }
        history.pushState(null, "", hash === "#" ? location.pathname + location.search : hash);
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return <>{children}</>;
}
