"use client";

import { useEffect, useRef, useState } from "react";
import OriontLogo from "@/components/OriontLogo";

const links = [
  { label: "Nosotros", href: "#nosotros" },
  { label: "Servicios", href: "#servicios" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Industrias", href: "#industrias" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const movePill = (el: HTMLElement) => {
    setPill({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 py-4 md:px-8">
        {/* logo */}
        <a
          href="#"
          aria-label="Oriont, inicio"
          className={`justify-self-start rounded-full px-3 py-2 transition-all duration-300 ${
            scrolled ? "bg-[#f5f0e6]/85 shadow-[0_8px_30px_-12px_rgba(33,37,92,0.3)] backdrop-blur-xl" : ""
          }`}
        >
          <OriontLogo markClassName="h-8 w-8" textClassName="text-xl text-[#21255c]" />
        </a>

        {/* enlaces: cápsula central con indicador deslizante */}
        <ul
          ref={listRef}
          onMouseLeave={() => setPill((p) => ({ ...p, visible: false }))}
          className="relative hidden items-center rounded-full bg-[#21255c] p-1.5 shadow-[0_12px_30px_-12px_rgba(33,37,92,0.6)] lg:flex"
        >
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 rounded-full bg-[#f5f0e6] transition-all duration-300 ease-out"
            style={{ left: pill.left, width: pill.width, opacity: pill.visible ? 1 : 0 }}
          />
          {links.map((l) => (
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
        <div className="flex items-center gap-2 justify-self-end">
          <button
            type="button"
            className="hidden h-10 rounded-full px-3 font-mono text-[11px] tracking-[0.2em] text-[#21255c]/60 transition hover:text-[#21255c] md:block"
            aria-label="Idioma: español"
          >
            ES
          </button>
          <a
            href="#contacto"
            className="group hidden items-center gap-3 rounded-full border border-[#21255c]/20 bg-[#f5f0e6]/80 py-1.5 pl-5 pr-1.5 text-[13px] font-medium text-[#21255c] backdrop-blur-xl transition hover:border-[#21255c] sm:inline-flex"
          >
            Contáctanos
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#248caa] text-white transition-transform duration-300 group-hover:-rotate-45">
              →
            </span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#21255c] lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 top-0 h-px w-4 bg-[#f5f0e6] transition ${open ? "top-1.5 rotate-45" : ""}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-4 bg-[#f5f0e6] transition ${open ? "bottom-1.5 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* menú móvil */}
      <div
        className={`mx-4 overflow-hidden rounded-3xl bg-[#21255c] transition-all duration-300 md:mx-8 lg:hidden ${
          open ? "max-h-[420px] opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col p-3">
          {[...links, { label: "Contacto", href: "#contacto" }].map((l) => (
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
