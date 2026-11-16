"use client";

import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useNearViewport } from "@/hooks/useNearViewport";
import { stackedSheetEntrance } from "@/components/layout/stackedSheet";
import { steps, type StepIcon } from "@/data/value-chain";
import { THEME } from "./parts/themes";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ---------- sección "Cadena de valor": mazo de tarjetas con índice ----------
 * Escritorio: índice a la izquierda y las etapas apiladas a la derecha (los bordes de las de
 * atrás asoman arriba). Al elegir del índice (o tocar una de atrás), la tarjeta sale hacia la
 * derecha, el mazo se reacomoda y vuelve por encima, al frente. Sin retener el scroll: la página
 * corre libre. Reacomodo con transiciones CSS de translate/scale/opacity (sin reflow).
 * Celular/tablet: tarjetas en lista.
 */

const OFFSET = 36; // px que asoma cada tarjeta por encima de la siguiente
const DEPTH_SCALE = 0.035; // cuánto se achica cada tarjeta de atrás
const DEPTH_DIM = 0.07; // cuánto se oscurece cada tarjeta de atrás
const CARD_H = 430; // alto de la tarjeta (px)
const SHUFFLE_OUT = 380; // ms del viaje de salida al barajar

const pad = (i: number) => String(i + 1).padStart(2, "0");

/** íconos simples por etapa (trazo, heredan el color del tema) */
const ICONS: Record<StepIcon, ReactNode> = {
  building: <path d="M5 21V5l7-2 7 2v16M9 9h2m2 0h2M9 13h2m2 0h2M9 17h2m2 0h2" />,
  box: <path d="M12 3l8 4v10l-8 4-8-4V7l8-4zm0 8L4 7m8 4l8-4m-8 4v10" />,
  network: <path d="M12 5a2 2 0 100-4 2 2 0 000 4zm-7 9a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zm-7 9a2 2 0 100-4 2 2 0 000 4zM12 5v4m-5.5 2.5L11 10m2 0l4.5 1.5M12 15v4" />,
  headset: <path d="M4 13a8 8 0 0116 0m-16 0v4a2 2 0 002 2h1v-6H6a2 2 0 00-2 2zm16 0v4a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2zm-5 7h-3" />,
  product: <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8L12 3z" />,
};

export default function ValueChainSection() {
  const root = useRef<HTMLElement>(null);
  // las animaciones se preparan recién a una pantalla de distancia (no al cargar)
  const near = useNearViewport(root);

  // orden del mazo: el último del arreglo queda al frente
  const [order, setOrder] = useState(() => steps.map((_, i) => i));
  // tarjeta que está viajando y hacia dónde: sale hacia el lado del cambio (avanzar en la cadena
  // → derecha; retroceder → izquierda) mientras el mazo se reacomoda
  const [moving, setMoving] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const busy = useRef(false);
  const front = order[order.length - 1];

  /** trae una tarjeta al frente: sale hacia el lado del cambio, el mazo se reacomoda y vuelve encima */
  const pick = (i: number) => {
    if (i === front || busy.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // sin movimiento: reordena al tiro (las transiciones están apagadas con motion-reduce)
      setOrder((o) => [...o.filter((k) => k !== i), i]);
      return;
    }
    busy.current = true;
    setMoving({ i, dir: i > front ? 1 : -1 });
    setTimeout(() => {
      setOrder((o) => [...o.filter((k) => k !== i), i]);
      setMoving(null);
      setTimeout(() => (busy.current = false), 500);
    }, SHUFFLE_OUT);
  };

  // entrada: título con barrido, índice en cascada y el mazo subiendo
  useGSAP(
    () => {
      if (!near) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // entra como una hoja sobre el hero
        stackedSheetEntrance(root.current);

        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 75%", once: true } })
          .from("[data-vc-eline]", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5, ease: "power2.out" }, 0)
          .from("[data-vc-elabel]", { x: -14, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 0.1)
          .fromTo(
            "[data-vc-title]",
            { clipPath: "inset(0% 100% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut" },
            0.15,
          )
          .from("[data-vc-sub]", { y: 24, autoAlpha: 0, duration: 0.6, ease: "power3.out" }, 0.5)
          .from("[data-vc-idx] > li", { x: -28, autoAlpha: 0, duration: 0.55, ease: "power3.out", stagger: 0.07 }, 0.55)
          // las cartas se reparten de a una, rápido: cada una sube desde abajo y se apila sobre
          // la anterior (01 primero, 05 al final, al frente). GSAP anima `transform`, que se suma
          // al `translate`/`scale` del apilado sin pisarlo
          .from("[data-vc-card]", { y: 140, autoAlpha: 0, duration: 0.5, ease: "power3.out", stagger: 0.16 }, 0.3);

        gsap.utils.toArray<HTMLElement>("[data-vc-mcard]").forEach((card) => {
          gsap.from(card, {
            y: 40,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [near], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="soluciones"
      // hoja que sube sobre el hero: esquinas redondeadas, sombra hacia arriba y por encima de él
      className="relative z-10 rounded-t-[32px] bg-white pb-28 pt-24 text-[#21255c] shadow-[0_-30px_60px_-30px_rgba(13,16,48,0.45)] md:rounded-t-[48px] md:pb-40 md:pt-32 xl:pt-36"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-12">
        {/* índice */}
        <div>
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#248caa] xl:text-[12px]">
            <span data-vc-eline className="h-px w-6 bg-[#248caa] xl:w-8" />
            <span data-vc-elabel>Cadena de valor</span>
          </p>
          <h2 data-vc-title className="mt-5 font-display text-[36px] font-semibold leading-[1.05] tracking-tight md:text-[44px] xl:text-[52px]">
            Del sponsor al <span className="text-[#248caa]">cliente final.</span>
          </h2>
          <p data-vc-sub className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#21255c]/70 xl:text-[17px]">
            Acompañamos cada eslabón de la cadena: desde la idea del producto hasta la conversación con el cliente.
          </p>

          <ol data-vc-idx className="mt-10 hidden space-y-1 lg:block">
            {steps.map((s, i) => {
              const on = i === front;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    aria-current={on}
                    className={`group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors duration-300 motion-reduce:transition-none ${
                      on ? "bg-[#dcebf3]/60" : "hover:bg-[#f5f6f8]"
                    }`}
                  >
                    <span className={`font-mono text-[12px] transition-opacity ${on ? "text-[#248caa]" : "text-[#21255c]/40"}`}>{pad(i)}</span>
                    <span
                      className={`h-px flex-none bg-current transition-all duration-500 motion-reduce:transition-none ${
                        on ? "w-10 text-[#248caa]" : "w-6 text-[#21255c]/25 group-hover:w-8"
                      }`}
                    />
                    <span
                      className={`flex-1 font-display text-[17px] font-semibold tracking-tight transition-opacity duration-300 xl:text-[19px] ${
                        on ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                      }`}
                    >
                      {s.title}
                    </span>
                    <span aria-hidden className={`transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0"}`}>
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* mazo (solo escritorio): más angosto que su columna, con aire a los lados para que el
            viaje de la carta al barajar quede a la vista */}
        <div
          className="relative hidden w-full lg:mx-auto lg:block lg:max-w-[600px] xl:max-w-[680px]"
          style={{ height: CARD_H + OFFSET * (steps.length - 1) }}
        >
          {steps.map((s, i) => {
            const t = THEME[s.theme];
            const depth = order.length - 1 - order.indexOf(i); // 0 = al frente
            const out = moving?.i === i;
            return (
              <article
                key={s.title}
                data-vc-card
                onClick={() => pick(i)}
                className={`absolute inset-x-0 bottom-0 overflow-hidden rounded-[28px] p-7 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] transition-[translate,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none xl:p-9 ${t.card} ${
                  depth ? "cursor-pointer" : ""
                }`}
                style={{
                  height: CARD_H,
                  zIndex: out ? 50 : 10 - depth,
                  translate: out ? `${moving!.dir * 55}% 0` : `0 ${-depth * OFFSET}px`,
                  scale: out ? "1" : String(1 - depth * DEPTH_SCALE),
                  transformOrigin: "50% 100%",
                }}
              >
                <div className="flex items-start justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl xl:h-14 xl:w-14 ${t.icon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 xl:h-7 xl:w-7">
                      {ICONS[s.icon]}
                    </svg>
                  </span>
                  <span className={`font-mono text-[12px] tracking-[0.2em] xl:text-[13px] ${t.muted}`}>
                    {pad(i)} / {pad(steps.length - 1)}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-[26px] font-semibold tracking-tight xl:text-[32px]">{s.title}</h3>
                <p className={`mt-2.5 max-w-[520px] text-[14px] leading-relaxed xl:text-[16px] ${t.muted}`}>{s.text}</p>

                <ul className="mt-5 space-y-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-[13px] font-medium xl:text-[14px]">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-current/15 text-[12px]">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.tags.map((tag) => (
                    <li key={tag} className={`rounded-full border px-3.5 py-1 text-[12px] font-medium xl:text-[13px] ${t.chip}`}>
                      {tag}
                    </li>
                  ))}
                </ul>

                {/* número fantasma */}
                <span aria-hidden className="pointer-events-none absolute -right-3 -top-7 font-display text-[170px] font-bold leading-none tracking-tighter opacity-[0.07]">
                  {pad(i)}
                </span>
                {/* velo de profundidad: oscurece según cuántas tiene delante */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[#0d1030] transition-opacity duration-500 motion-reduce:transition-none"
                  style={{ opacity: out ? 0 : depth * DEPTH_DIM }}
                />
              </article>
            );
          })}
        </div>

        {/* celular/tablet: tarjetas en lista */}
        <div className="space-y-6 lg:hidden">
          {steps.map((s, i) => {
            const t = THEME[s.theme];
            return (
              <article key={s.title} data-vc-mcard className={`relative overflow-hidden rounded-3xl p-6 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] ${t.card}`}>
                <div className="flex items-start justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${t.icon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      {ICONS[s.icon]}
                    </svg>
                  </span>
                  <span className={`font-mono text-[11px] tracking-[0.2em] ${t.muted}`}>
                    {pad(i)} / {pad(steps.length - 1)}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[24px] font-semibold tracking-tight">{s.title}</h3>
                <p className={`mt-2 text-[14px] leading-relaxed ${t.muted}`}>{s.text}</p>
                <ul className="mt-4 space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-[13px] font-medium">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-current/15 text-[11px]">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.tags.map((tag) => (
                    <li key={tag} className={`rounded-full border px-3.5 py-1 text-[12px] font-medium ${t.chip}`}>
                      {tag}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>

      {/* se oscurece cuando la sección siguiente sube por encima (lo anima ServicesSection) */}
      <div data-stack-dim aria-hidden className="pointer-events-none absolute inset-0 z-50 bg-[#0d1030] opacity-0" />
    </section>
  );
}
