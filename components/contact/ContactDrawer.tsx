"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { getLenis } from "@/components/layout/SmoothScroll";
import { ABOUT_CTA } from "@/data/about";
import ContactForm from "./ContactForm";
import { OPEN_CONTACT_EVENT } from "./contactEvents";

/**
 * Panel lateral de contacto: "Contáctanos" lo abre encima de la página, sin recorrer todas las
 * secciones hasta el formulario del final. El usuario se queda donde estaba y al cerrar sigue ahí.
 * Usa <dialog> nativo (showModal): foco atrapado dentro, Esc cierra y el resto queda inerte.
 * La entrada/salida la anima GSAP (con transiciones CSS el primer cuadro se saltaba y aparecía de golpe).
 */
/**
 * SmoothScroll pone gsap.ticker.lagSmoothing(0) para que Lenis no se atrase: con eso, un cuadro
 * lento (abrir el dialog, el globo redibujando…) hace avanzar las animaciones de un salto y el
 * panel aparecía de golpe. Mientras el panel se anima se compensa: un cuadro de más de 100 ms
 * cuenta como 1/60 s. Al terminar se vuelve a 0 (el scroll está detenido mientras tanto).
 */
const smoothFrames = (on: boolean) => gsap.ticker.lagSmoothing(on ? 100 : 0, on ? 16 : 0);

export default function ContactDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const closing = useRef(false);

  const lockScroll = (lock: boolean) => {
    const lenis = getLenis();
    if (lenis) {
      if (lock) lenis.stop();
      else lenis.start();
    } else {
      // scroll nativo (táctil): sin barra de scroll que desaparezca, no mueve el layout
      document.documentElement.style.overflow = lock ? "hidden" : "";
    }
  };

  const open = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    tl.current?.kill();
    closing.current = false;
    // estado inicial ANTES de mostrarlo: afuera a la derecha y transparente
    gsap.set(veil.current, { opacity: 0 });
    gsap.set(panel.current, { xPercent: 100 });
    gsap.set(content.current, { opacity: 0, y: 16 });
    d.showModal();
    lockScroll(true);
    smoothFrames(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Abrir el <dialog> hace un cuadro pesado. Arranca 2 cuadros después, y además con
    // smoothFrames: si igual cae un cuadro lento, la animación no salta al final.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!d.open || closing.current) return; // se cerró antes de arrancar
        tl.current = gsap
          .timeline({ onComplete: () => smoothFrames(false) })
          .to(veil.current, { opacity: 1, duration: reduce ? 0 : 0.45, ease: "power1.out" }, 0)
          .to(panel.current, { xPercent: 0, duration: reduce ? 0 : 0.7, ease: "expo.out" }, 0)
          .to(content.current, { opacity: 1, y: 0, duration: reduce ? 0 : 0.5, ease: "power3.out" }, reduce ? 0 : 0.18);
      }),
    );
  }, []);

  const close = useCallback(() => {
    const d = dialog.current;
    if (!d?.open || closing.current) return;
    closing.current = true;
    tl.current?.kill();
    smoothFrames(true);
    tl.current = gsap
      .timeline({
        onComplete: () => {
          d.close();
          // el scroll se libera al final, no durante la salida
          lockScroll(false);
          smoothFrames(false);
          closing.current = false;
        },
      })
      .to(content.current, { opacity: 0, duration: 0.2, ease: "power1.in" }, 0)
      .to(panel.current, { xPercent: 100, duration: 0.45, ease: "power3.in" }, 0)
      .to(veil.current, { opacity: 0, duration: 0.4, ease: "power1.in" }, 0.05);
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_CONTACT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONTACT_EVENT, open);
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label="Contacto"
      // Esc: cierra con la animación en vez del cierre seco del navegador
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-transparent"
    >
      {/* velo: click afuera cierra */}
      {/* velo: click afuera cierra (la rueda sobre él la bloquea Lenis, detenido) */}
      <div ref={veil} aria-hidden onClick={close} className="absolute inset-0 bg-[#21255c]/25 opacity-0" />

      {/* panel claro, como el resto de la web: fondo de la página, texto azul y acento celeste.
          data-lenis-prevent: aquí la rueda es nativa, para poder hacer scroll si no cabe */}
      <aside
        ref={panel}
        data-lenis-prevent
        className="absolute inset-y-0 right-0 flex w-full max-w-150 flex-col overflow-y-auto overscroll-contain bg-background
         text-[#21255c] shadow-[-30px_0_80px_-40px_rgba(33,37,92,0.45)]"
      >
        <div className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#248caa]">
            <span className="h-px w-6 bg-current" />
            {ABOUT_CTA.eyebrow}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[#21255c]/15 transition-colors hover:bg-[#21255c]/5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div ref={content} className="px-6 pb-8 pt-6 opacity-0 sm:px-10 sm:pb-10">
          <h2 className="font-display text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">
            {ABOUT_CTA.title} <span className="text-[#248caa]">{ABOUT_CTA.highlight}</span>
          </h2>

          {/* tarjeta blanca con borde suave (la sombra negra fuerte era para el fondo de foto) */}
          <ContactForm className="mt-8 border border-[#21255c]/10 shadow-[0_20px_50px_-35px_rgba(33,37,92,0.35)]!" />

          <ul className="mt-8 space-y-4">
            {ABOUT_CTA.contact.map((c) => (
              <li key={c.label} className="text-[14px]">
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#21255c]/50">{c.label}</span>
                {c.href ? (
                  <a href={c.href} className="mt-1 inline-block text-[#248caa] underline-offset-4 hover:underline">
                    {c.value}
                  </a>
                ) : (
                  <span className="mt-1 block text-[#21255c]/80">{c.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </dialog>
  );
}
