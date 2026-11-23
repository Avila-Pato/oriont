"use client";

import { useEffect, useRef, useState } from "react";
import OriontLogo from "@/components/ui/OriontLogo";
import { NAV_CTA, NAV_LINKS } from "@/data/navigation";
import { openContact } from "@/components/contact/contactEvents";
import { useActiveSection } from "@/hooks/useActiveSection";

/** ids de las secciones del menú (#soluciones → soluciones) */
const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1));

type Box = { left: number; top: number; width: number; height: number; radius: number };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [shift, setShift] = useState({ list: 0, cta: 0 });
  // cápsula azul: solo enlaces arriba, enlaces + botón al bajar
  const [shell, setShell] = useState<{ open: Box; tight: Box } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  // left / width: recorte izquierdo y derecho del indicador dentro de la lista
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const listRef = useRef<HTMLUListElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  // sección en pantalla (href del enlace) y enlace bajo el mouse: el indicador va al que está
  // bajo el mouse y, si no hay ninguno, se queda en la sección actual
  const [hovered, setHovered] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // sección actual: la que cruza una línea al 40 % de la pantalla (arriba del todo, en el hero,
  // ninguna). Con IntersectionObserver: no mide nada en cada scroll (ver useActiveSection)
  const activeId = useActiveSection(SECTION_IDS);
  const active = activeId ? `#${activeId}` : null;

  // al bajar se compacta y se mantiene así; al volver arriba del todo se abre
  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // cuánto mover enlaces y botón para que queden juntos y centrados
  useEffect(() => {
    const measure = () => {
      const list = listRef.current;
      const cta = ctaRef.current;
      const nav = navRef.current;
      if (!nav || !list || !cta || !list.offsetWidth || !cta.offsetWidth) {
        setShell(null);
        return setShift({ list: 0, cta: 0 });
      }
      const GAP = 8;
      const PAD = 6;
      const list0 = -(GAP + cta.offsetWidth) / 2;
      const cta0 = list.offsetLeft + list.offsetWidth + GAP - cta.offsetLeft + list0;
      setShift({ list: list0, cta: cta0 });
      const left = list.offsetLeft + list0 - PAD;
      const right = cta.offsetLeft + cta0 + cta.offsetWidth + PAD;
      const h = Math.max(list.offsetHeight, cta.offsetHeight + PAD * 2);
      const lh = list.offsetHeight;
      setShell({
        open: { left: list.offsetLeft, top: list.offsetTop, width: list.offsetWidth, height: lh, radius: lh / 2 },
        tight: { left, top: (nav.clientHeight - h) / 2, width: right - left, height: h, radius: h / 2 },
      });
    };
    // ResizeObserver entrega su callback después del layout del frame: las lecturas de
    // offset* no fuerzan un reflow síncrono (antes se medía en el montaje, recién hidratado).
    // También cubre el cambio de fuente (cambia el ancho) y el resize de la ventana.
    const ro = new ResizeObserver(measure);
    [navRef.current, listRef.current, ctaRef.current].forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, []);

  const tight = compact && shift.cta !== 0;
  const box = shell ? (tight ? shell.tight : shell.open) : null;
  // La cápsula ocupa siempre la unión de sus dos formas y se recorta con clip-path:
  // animar left/top/width/height al hacer scroll contaría como layout shift (CLS).
  const area = shell && {
    left: Math.min(shell.open.left, shell.tight.left),
    top: Math.min(shell.open.top, shell.tight.top),
    right: Math.max(shell.open.left + shell.open.width, shell.tight.left + shell.tight.width),
    bottom: Math.max(shell.open.top + shell.open.height, shell.tight.top + shell.tight.height),
  };

  // el indicador sigue al enlace bajo el mouse; si no hay, a la sección actual; si no, se oculta
  const target = hovered ?? active;
  useEffect(() => {
    const el = target ? itemRefs.current[target] : null;
    if (!el) {
      setPill((p) => (p.visible ? { ...p, visible: false } : p));
      return;
    }
    const listW = listRef.current?.offsetWidth ?? 0;
    setPill({ left: el.offsetLeft, width: listW - el.offsetLeft - el.offsetWidth, visible: true });
  }, [target]);

  return (
    // pointer-events-none: la caja del header incluye el alto del menú móvil (oculto) y tapaba
    // los toques en lo que queda debajo (ej. el globo); solo sus controles reciben clics
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <nav
        ref={navRef}
        className="relative mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 py-4 md:px-8"
      >
        {/* cápsula azul: envuelve los enlaces y al bajar se estira hasta el botón */}
        {box && area && (
          // la sombra va en el contenedor (drop-shadow sigue la forma recortada)
          <span
            aria-hidden="true"
            className="pointer-events-none absolute hidden drop-shadow-[0_14px_16px_rgba(33,37,92,0.35)] lg:block"
            style={{ left: area.left, top: area.top, width: area.right - area.left, height: area.bottom - area.top }}
          >
            <span
              className="absolute inset-0 bg-navy transition-[clip-path] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                clipPath: `inset(${box.top - area.top}px ${area.right - box.left - box.width}px ${
                  area.bottom - box.top - box.height
                }px ${box.left - area.left}px round ${box.radius}px)`,
              }}
            />
          </span>
        )}
        {/* logo */}
        <a
          href="#"
          aria-label="Oriont, inicio"
          // cápsula blanca con borde y sombra fijos: el logo se despega del fondo claro del hero desde
          // el primer frame. Blanco sólido, sin backdrop-blur: al 95 % el blur casi no se veía y, como
          // el menú es fijo, se recalculaba en cada cuadro de scroll de toda la página (GPU)
          className={`pointer-events-auto relative justify-self-start flex h-14 items-center rounded-full bg-white px-4 shadow-[0_10px_30px_-10px_rgba(33,37,92,0.45)] ring-1 ring-navy/10 transition-opacity duration-500 ${
            tight ? "lg:pointer-events-none lg:opacity-0" : ""
          }`}
        >
          <OriontLogo className="relative h-10 w-auto" eager />
        </a>

        {/* enlaces: cápsula central con indicador deslizante */}
        <ul
          ref={listRef}
          onMouseLeave={() => setHovered(null)}
          className="pointer-events-auto relative hidden h-14 items-center rounded-full p-1.5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex"
          style={{ transform: `translateX(${tight ? shift.list : 0}px)` }}
        >
          {/* indicador: ocupa toda la lista y se recorta con clip-path (sin mover el layout) */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1.5 bottom-1.5 bg-white transition-[clip-path,opacity] duration-300 ease-out"
            style={{
              clipPath: `inset(0 ${pill.width}px 0 ${pill.left}px round 999px)`,
              opacity: pill.visible ? 1 : 0,
            }}
          />
          {NAV_LINKS.map((l) => (
            <li
              key={l.href}
              ref={(el) => {
                itemRefs.current[l.href] = el;
              }}
              className="relative"
            >
              <a
                href={l.href}
                aria-current={active === l.href ? "location" : undefined}
                onMouseEnter={() => setHovered(l.href)}
                onFocus={() => setHovered(l.href)}
                onBlur={() => setHovered(null)}
                // texto oscuro sobre el indicador: el enlace bajo el mouse, o la sección actual
                className={`peer relative z-10 flex h-11 items-center rounded-full px-5 text-[13px] font-medium transition-colors duration-300 focus-visible:outline-none ${
                  target === l.href ? "text-navy" : "text-white/75"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* acciones */}
        <div className="pointer-events-auto col-start-3 flex items-center gap-2 justify-self-end">
          <button
            type="button"
            className={`relative hidden h-10 rounded-full px-3 font-mono text-[11px] tracking-[0.2em] text-navy opacity-75 transition-opacity hover:opacity-100 md:block ${
              tight ? "lg:pointer-events-none lg:opacity-0" : ""
            }`}
            aria-label="Idioma: español"
          >
            ES
          </button>
          <a
            ref={ctaRef}
            href={NAV_CTA.href}
            // abre el panel de contacto en vez de recorrer la página hasta el formulario del final
            onClick={(e) => {
              e.preventDefault();
              openContact();
            }}
            // misma cápsula blanca que el logo, arriba y al bajar (antes crema que cambiaba al
            // hacer scroll). El borde del hover va en ::after y solo anima opacity
            className="group relative hidden h-12 items-center gap-3 rounded-full bg-white pl-6 pr-2 text-[13px] font-medium text-navy shadow-[0_10px_30px_-10px_rgba(33,37,92,0.45)] ring-1 ring-navy/10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] after:absolute after:-inset-px after:rounded-full after:border after:border-navy after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-30 sm:inline-flex"
            style={{ transform: `translateX(${tight ? shift.cta : 0}px)` }}
          >
            {NAV_CTA.label}
            {/* ícono de correo (antes una flecha); al pasar el mouse crece un poco */}
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:scale-110">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            // misma cápsula blanca que el logo al bajar (antes un círculo azul marino macizo)
            className="relative grid h-14 w-14 place-items-center rounded-full border border-navy/10 bg-white/85 shadow-[0_8px_30px_-12px_rgba(33,37,92,0.3)] backdrop-blur-xl lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 top-0 h-[1.5px] w-4 rounded-full bg-navy transition-transform duration-300 ${open ? "translate-y-[5.25px] rotate-45" : ""}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-[1.5px] rounded-full bg-navy transition-transform duration-300 ${open ? "w-4 -translate-y-[5.25px] -rotate-45" : "w-2.5"}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* menú móvil: siempre maquetado (está en el header fijo, no empuja la página); se abre con
          clip-path + opacity en vez de animar max-height */}
      <div
        className={`mx-4 mt-2 rounded-3xl border border-navy/10 bg-white shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] transition-[clip-path,opacity,visibility] duration-300 md:mx-8 lg:hidden ${
          open
            ? "pointer-events-auto visible opacity-100 [clip-path:inset(0_0_0_0_round_24px)]"
            : "pointer-events-none invisible opacity-0 [clip-path:inset(0_0_100%_0_round_24px)]"
        }`}
      >
        <ul className="flex flex-col px-3 pt-3">
          {NAV_LINKS.filter((l) => !("desktopOnly" in l)).map((l, i) => (
            <li key={l.href} className="border-b border-navy/8 last:border-0">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 rounded-2xl px-4 py-3.5 font-display text-[19px] font-semibold tracking-tight text-navy active:bg-ice/60"
              >
                <span className="font-mono text-[11px] font-normal text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">{l.label}</span>
                <span aria-hidden className="text-navy/30">→</span>
              </a>
            </li>
          ))}
        </ul>
        {/* "Contacto" va aparte como botón: abre el panel (igual que el botón de escritorio) */}
        <div className="p-3 pt-2">
          <a
            href={NAV_CTA.href}
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              openContact();
            }}
            className="flex items-center justify-between rounded-2xl bg-accent py-2 pl-5 pr-2 text-[15px] font-medium text-white active:bg-[#1f7a95]"
          >
            {NAV_CTA.label}
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
