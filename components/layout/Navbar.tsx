"use client";

import { useEffect, useRef, useState } from "react";
import OriontLogo from "@/components/ui/OriontLogo";
import { NAV_CTA, NAV_LINKS } from "@/data/navigation";


type Box = { left: number; top: number; width: number; height: number; radius: number };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [shift, setShift] = useState({ list: 0, cta: 0 });
  // cápsula azul: solo enlaces arriba, enlaces + botón al bajar
  const [shell, setShell] = useState<{ open: Box; tight: Box } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  // left / width: recorte izquierdo y derecho del indicador dentro de la lista
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const listRef = useRef<HTMLUListElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // al bajar se compacta y se mantiene así; al volver arriba del todo se abre
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setCompact(y > 80);
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

  const movePill = (el: HTMLElement) => {
    const listW = listRef.current?.offsetWidth ?? 0;
    setPill({ left: el.offsetLeft, width: listW - el.offsetLeft - el.offsetWidth, visible: true });
  };

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
              className="absolute inset-0 bg-[#21255c] transition-[clip-path] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
          className={`pointer-events-auto relative justify-self-start rounded-full px-3 py-2 transition-opacity duration-500 ${
            tight ? "lg:pointer-events-none lg:opacity-0" : ""
          }`}
        >
          {/* fondo del logo al bajar: capa fija que solo cambia opacity (animar fondo, sombra y
              blur obligaba a repintar en cada frame) */}
          <span
            aria-hidden="true"
            className={`absolute inset-0 rounded-full bg-[#f5f0e6]/85 shadow-[0_8px_30px_-12px_rgba(33,37,92,0.3)] backdrop-blur-xl transition-opacity duration-500 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          />
          <OriontLogo className="relative h-9 w-auto" eager />
        </a>

        {/* enlaces: cápsula central con indicador deslizante */}
        <ul
          ref={listRef}
          onMouseLeave={() => setPill((p) => ({ ...p, visible: false }))}
          className="pointer-events-auto relative hidden items-center rounded-full p-1.5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex"
          style={{ transform: `translateX(${tight ? shift.list : 0}px)` }}
        >
          {/* indicador: ocupa toda la lista y se recorta con clip-path (sin mover el layout) */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1.5 bottom-1.5 bg-[#f5f0e6] transition-[clip-path,opacity] duration-300 ease-out"
            style={{
              clipPath: `inset(0 ${pill.width}px 0 ${pill.left}px round 999px)`,
              opacity: pill.visible ? 1 : 0,
            }}
          />
          {NAV_LINKS.map((l) => (
            <li key={l.href} className="relative">
              <a
                href={l.href}
                onMouseEnter={(e) => movePill(e.currentTarget.parentElement as HTMLElement)}
                onFocus={(e) => movePill(e.currentTarget.parentElement as HTMLElement)}
                className="peer relative z-10 block rounded-full px-5 py-2 text-[13px] font-medium text-[#f5f0e6]/75 transition-colors duration-300 hover:text-[#21255c] focus-visible:text-[#21255c] focus-visible:outline-none"
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
            className={`relative hidden h-10 rounded-full px-3 font-mono text-[11px] tracking-[0.2em] text-[#21255c] opacity-60 transition-opacity hover:opacity-100 md:block ${
              tight ? "lg:pointer-events-none lg:opacity-0" : ""
            }`}
            aria-label="Idioma: español"
          >
            ES
          </button>
          <a
            ref={ctaRef}
            href={NAV_CTA.href}
            // fondo y borde en capas (::before / ::after) que solo animan opacity: color,
            // background-color y border-color no se componen en GPU
            className={`group relative isolate hidden items-center gap-3 rounded-full border border-transparent bg-[#f5f0e6]/80 py-1.5 pl-5 pr-1.5 text-[13px] font-medium text-[#21255c] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] before:absolute before:-inset-px before:-z-10 before:rounded-full before:bg-[#f5f0e6] before:transition-opacity before:duration-500 after:absolute after:-inset-px after:-z-10 after:rounded-full after:border after:border-[#21255c] after:transition-opacity after:duration-500 hover:after:opacity-100 sm:inline-flex ${
              tight ? "before:opacity-100 after:opacity-0" : "before:opacity-0 after:opacity-20"
            }`}
            style={{ transform: `translateX(${tight ? shift.cta : 0}px)` }}
          >
            {NAV_CTA.label}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#248caa] text-white transition-transform duration-300 group-hover:-rotate-45">
              →
            </span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="relative grid h-11 w-11 place-items-center rounded-full bg-[#21255c] lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 top-0 h-px w-4 bg-[#f5f0e6] transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-4 bg-[#f5f0e6] transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* menú móvil: siempre maquetado (está en el header fijo, no empuja la página); se abre con
          clip-path + opacity en vez de animar max-height */}
      <div
        className={`mx-4 rounded-3xl bg-[#21255c] transition-[clip-path,opacity,visibility] duration-300 md:mx-8 lg:hidden ${
          open
            ? "pointer-events-auto visible opacity-100 [clip-path:inset(0_0_0_0_round_24px)]"
            : "pointer-events-none invisible opacity-0 [clip-path:inset(0_0_100%_0_round_24px)]"
        }`}
      >
        <ul className="flex flex-col p-3">
          {[...NAV_LINKS, { label: NAV_CTA.mobileLabel, href: NAV_CTA.href }].map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-5 py-4 font-display text-xl text-[#f5f0e6] hover:bg-white/5"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
