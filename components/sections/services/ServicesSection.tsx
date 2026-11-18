"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useNearViewport } from "@/hooks/useNearViewport";
import { brands, type BrandStat } from "@/data/services";
import { BRAND_THEME } from "./parts/themes";
import { BRAND_LOGOS, IconPeople } from "./parts/visuals";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ---------- sección ---------- */

/** "Así llegamos a tus clientes": empresas del grupo (banda a todo el ancho con el color de fondo). */
export default function ServicesSection() {
  const root = useRef<HTMLElement>(null);
  // la entrada se prepara recién a una pantalla de distancia (no al cargar)
  const near = useNearViewport(root);

  useGSAP(
    () => {
      if (!near) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-brand]", {
          y: 60,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-brands]", start: "top 75%" },
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [near], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="servicios"
      // hoja que sube sobre la sección anterior: va encima, con esquinas redondeadas y sombra hacia arriba
      className="relative bg-background py-24 text-[#21255c] "
    >
      <div data-brands className="container-page">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#21255c] p-3 text-[#f5f0e6] xl:h-16 xl:w-16 xl:p-3.5">
            <IconPeople />
          </span>
          <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight tracking-tight md:text-[40px] xl:text-[48px]">
            Así llegamos a tus <span className="text-[#248caa]">clientes</span>
          </h2>
          <p className="mt-3 max-w-[480px] text-[15px] leading-relaxed text-[#21255c]/70 xl:mt-5 xl:max-w-[560px] xl:text-[18px]">
            A través de nuestras empresas. Pasa el mouse o toca cada una para conocerla.
          </p>
        </div>

        {/* al llegar desde el menú (#servicios) las tarjetas quedan enteras a la vista */}
        <div data-anchor-focus>
          <BrandGrid />
          <BrandPanels />
        </div>
      </div>
    </section>
  );
}

/* ---------- paneles de empresas que se expanden ---------- */

const fmt = (v: number, d = 0) => v.toFixed(d).replace(".", ",");

/** Cifras de la tarjeta: cuentan desde cero cada vez que la tarjeta se abre. */
function BrandStats({ stats, on, muted }: { stats: BrandStat[]; on: boolean; muted: string }) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!on) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      stats.forEach((s, i) => {
        const el = refs.current[i];
        if (!el) return;
        if (reduce) return void (el.textContent = fmt(s.value, s.decimals));
        const o = { v: 0 };
        gsap.to(o, {
          v: s.value,
          duration: 1.8,
          delay: 0.35 + i * 0.12,
          ease: "power3.out",
          onUpdate: () => (el.textContent = fmt(o.v, s.decimals)),
        });
      });
      if (!reduce) {
        gsap.from("[data-bstat]", { y: 24, autoAlpha: 0, duration: 0.7, delay: 0.3, ease: "power3.out", stagger: 0.12 });
        gsap.from("[data-bline]", { scaleY: 0, duration: 0.8, delay: 0.4, ease: "power3.inOut", stagger: 0.12 });
      }
    }, wrap);
    return () => ctx.revert();
  }, [on, stats]);

  return (
    <div ref={wrap} className="grid grid-cols-3 gap-3 md:gap-6">
      {stats.map((s, i) => (
        <div key={s.label} className="flex gap-3 md:gap-6">
          {i > 0 && <span data-bline aria-hidden className="w-px origin-top bg-[#f5f0e6]/15" />}
          <div data-bstat>
            <p className="whitespace-nowrap font-display text-[26px] font-semibold leading-none tracking-tight sm:text-[34px] md:text-[44px] xl:text-[56px]">
              <span className="text-[#8fcbef]">{s.prefix}</span>
              {/* el valor final (invisible) reserva el ancho; el contador va encima y no empuja el sufijo */}
              <span className="relative inline-block">
                <span aria-hidden className="invisible">
                  {fmt(s.value, s.decimals)}
                </span>
                <span
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  className="absolute left-0 top-0"
                >
                  {fmt(s.value, s.decimals)}
                </span>
              </span>
              <span className="text-[#8fcbef]">{s.suffix}</span>
            </p>
            <p className="mt-2 text-[12px] font-medium md:text-[14px] xl:text-[15px]">{s.label}</p>
            <p className={`hidden font-mono text-[10px] uppercase tracking-[0.18em] md:block ${muted}`}>{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Escritorio: el panel abierto mide GROW unidades y cada cerrado 1; entre ellos, GAP px.
// Todos los paneles tienen siempre el ancho del abierto y están en posición absoluta:
// solo cambian `translate` (dónde empieza) y `clip-path` (cuánto se ve). Así el layout
// nunca se mueve (CLS 0) aunque el cambio venga de un hover, que no cuenta como interacción.
// En móvil la altura sí cambia, pero tras un toque y en menos de 500 ms, que el CLS excluye.
/** los sitios de las otras empresas se abren en otra pestaña; los anclas internos no */
const externalLink = (href: string) =>
  href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};

const GROW = 3.4;
const GAP = 12;
const PANEL_UNIT = `calc((100cqw - ${(brands.length - 1) * GAP}px) / ${brands.length - 1 + GROW})`;

/**
 * Celular / tablet: grilla fija sin acordeón. Las empresas sin cifras van arriba lado a lado y
 * la que tiene cifras (Oriont) abajo a todo el ancho. Las cifras cuentan al entrar en pantalla.
 */
function BrandGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref, "0px");
  const ordered = [...brands.filter((b) => !b.stats), ...brands.filter((b) => b.stats)];

  return (
    <div ref={ref} className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
      {ordered.map((b) => {
        const t = BRAND_THEME[b.theme];
        const wide = !!b.stats;
        return (
          <article
            key={b.name}
            className={`flex flex-col justify-between gap-5 overflow-hidden rounded-3xl p-4 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] sm:p-6 ${
              wide ? "col-span-2" : ""
            } ${t.card}`}
          >
            {/* logos: más chicos en las tarjetas angostas */}
            <div className={wide ? "" : "[&_img]:h-9 [&_img]:max-w-full sm:[&_img]:h-12"}>{BRAND_LOGOS[b.id]}</div>

            {b.stats && <BrandStats stats={b.stats} on={near} muted={t.muted} />}

            <div>
              <h3 className={`font-display font-semibold leading-tight tracking-tight ${wide ? "text-[20px] sm:text-[24px]" : "text-[15px] sm:text-[19px]"}`}>
                {b.tagline}
              </h3>
              {/* en celular basta con la bajada: el párrafo largo solo desde tablet */}
              <p className={`mt-2 hidden text-[14px] leading-snug md:block ${t.muted}`}>{b.text}</p>
              {wide && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {b.tags.map((tag) => (
                    <li key={tag} className={`rounded-full border px-3 py-1 text-[11px] font-medium sm:text-[12px] ${t.chip}`}>
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              <a
                href={b.href}
                {...externalLink(b.href)}
                aria-label={`Conocer ${b.name}`}
                className={`mt-4 inline-flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-[12px] font-medium sm:text-[13px] ${t.cta}`}
              >
                {wide ? `Conocer ${b.name}` : "Conocer"}
                <span className="grid h-6 w-6 place-items-center rounded-full bg-current/15">→</span>
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// un engranaje en cada unión, a medias sobre las dos tarjetas: turquesa, que se lee sobre las tres
function BrandPanels() {
  const [active, setActive] = useState(1);
  const go = (i: number) => setActive(i);

  return (
    <div
      className="mt-12 hidden lg:relative lg:block lg:h-[560px] lg:drop-shadow-[0_24px_24px_rgba(33,37,92,0.22)] lg:@container xl:mt-16 xl:h-[min(600px,82vh)]"
      style={{ "--u": PANEL_UNIT } as CSSProperties}
    >
      {/* tarjetas cerradas */}
      {brands.map((b, i) => {
        const on = i === active;
        const t = BRAND_THEME[b.theme];
        const x = `calc(${i} * (var(--u) + ${GAP}px) + ${active < i ? GROW - 1 : 0} * var(--u))`;
        const clip = `calc(${on ? 0 : GROW - 1} * var(--u))`;
        return (
          // data-brand (entrada con GSAP) va en un contenedor aparte: GSAP convierte el `translate`
          // de CSS del elemento que anima en un transform fijo, y la tarjeta dejaría de moverse.
          <div key={b.name} data-brand className="lg:pointer-events-none lg:absolute lg:inset-0">
          <article
            onMouseEnter={() => go(i)}
            onClick={() => go(i)}
            style={{ "--x": x, "--clip": clip } as CSSProperties}
            className={`relative cursor-pointer overflow-hidden rounded-3xl shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] transition-[height,translate,clip-path] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pointer-events-auto lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[calc(3.4*var(--u))] lg:translate-x-(--x) sm:rounded-[28px] lg:shadow-none lg:duration-700 lg:[clip-path:inset(0_var(--clip)_0_0_round_28px)] ${
              t.card
            } ${on ? (b.stats ? "h-[460px] sm:h-[560px] md:h-[600px]" : "h-[360px] sm:h-[440px]") : "h-[64px] sm:h-[84px]"}`}
          >
            {/* cerrado: nombre */}
            <button
              type="button"
              onFocus={() => go(i)}
              aria-expanded={on}
              aria-label={`Ver ${b.name}`}
              className={`absolute inset-0 flex items-center justify-between px-5 text-left sm:px-7 transition-opacity duration-300 focus-visible:outline-none lg:right-auto lg:w-(--u) lg:flex-col lg:items-start lg:justify-between lg:py-8 ${
                on ? "pointer-events-none opacity-0" : "opacity-100 delay-200"
              }`}
            >
              <span className={`font-mono text-[12px] tracking-[0.2em] xl:text-[13px] ${t.muted}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="inline-flex items-center gap-[0.35em] font-display text-[18px] font-semibold sm:text-[22px] leading-none tracking-tight lg:rotate-180 lg:text-[26px] lg:[writing-mode:vertical-rl] xl:text-[30px]">
                {b.name}
                {b.icon && typeof b.icon !== "string" ? (
                  // mismo alto que el texto; contrarrotado para que no quede de cabeza en la tarjeta vertical
                  <Image src={b.icon} alt="" width={64} height={64} className="h-[1.05em] w-[1.05em] shrink-0 object-contain lg:rotate-180" />
                ) : (
                  b.icon && <span>{b.icon}</span>
                )}
              </span>
              <span className={`grid h-8 w-8 place-items-center rounded-full border text-base sm:h-10 sm:w-10 sm:text-lg lg:order-first lg:self-end ${t.plus}`}>
                +
              </span>
            </button>

            {/* abierto: info */}
            <div
              aria-hidden={!on}
              className={`absolute inset-0 flex flex-col justify-between p-5 transition-[opacity,translate] sm:p-7 md:p-10 lg:max-w-[680px] xl:p-12 ${
                on ? "translate-y-0 opacity-100 delay-200 duration-500" : "pointer-events-none translate-y-4 opacity-0 duration-200"
              }`}
            >
              <div className="flex items-start justify-between gap-6">
                {BRAND_LOGOS[b.id]}
                <span className={`font-mono text-[12px] tracking-[0.2em] xl:text-[13px] ${t.muted}`}>
                  {String(i + 1).padStart(2, "0")} / {String(brands.length).padStart(2, "0")}
                </span>
              </div>

              {b.stats && <BrandStats stats={b.stats} on={on} muted={t.muted} />}

              <div>
                <h3 className="font-display text-[20px] font-semibold leading-tight tracking-tight sm:text-[24px] md:text-[32px] xl:text-[36px]">{b.tagline}</h3>
                <p className={`mt-2 max-w-[480px] text-[13px] leading-snug sm:mt-3 sm:text-[14px] sm:leading-relaxed md:text-[16px] xl:mt-4 xl:max-w-[600px] xl:text-[19px] ${t.muted}`}>{b.text}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                  {b.tags.map((tag) => (
                    <li key={tag} className={`rounded-full border px-3 py-1 text-[11px] font-medium sm:px-3.5 sm:py-1.5 sm:text-[12px] xl:px-5 xl:py-2 xl:text-[14px] ${t.chip}`}>
                      {tag}
                    </li>
                  ))}
                </ul>
                <a
                  href={b.href}
                  {...externalLink(b.href)}
                  tabIndex={on ? 0 : -1}
                  className={`group mt-4 inline-flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-[12px] sm:mt-7 sm:py-2 sm:pl-5 sm:pr-2 sm:text-[13px] font-medium transition hover:opacity-90 ${t.cta}`}
                >
                  Conocer {b.name}
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-current/15 transition group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
              </div>
            </div>
          </article>
          </div>
        );
      })}
    </div>
  );
}
