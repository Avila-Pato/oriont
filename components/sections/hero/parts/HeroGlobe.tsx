"use client";

import { useEffect, useState } from "react";
import Globe from "./Globe";
import { COUNTRIES, type CountryCode } from "@/data/countries";
import CountryFlag from "@/components/ui/CountryFlag";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 10_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

export default function HeroGlobe({ className = "" }: { className?: string }) {
  const [hovered, setHovered] = useState<CountryCode | null>(null);
  const [selected, setSelected] = useState<CountryCode | null>(null);
  // el canvas ya pintó su primer frame: el placeholder de CSS se desvanece
  const [ready, setReady] = useState(false);
  const now = useClock();
  const active = hovered ?? selected;
  const info = COUNTRIES.find((c) => c.code === active);
  const others = COUNTRIES.filter((c) => c.code !== active);

  const time = (tz: string) =>
    now ? new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now) : "--:--";

  return (
    // touch-none en celular/tablet: sobre el globo el dedo lo gira en vez de hacer scroll
    // (bajo los botones, fuera de este contenedor, el scroll sigue normal)
    <div className={`touch-none select-none lg:touch-pan-y ${className || "relative"}`}>
      {/* Placeholder sin JS: viene en el HTML del servidor y ocupa el lugar exacto de la esfera
          (radio 0.42 del contenedor → inset 8%) mientras carga e hidrata el canvas. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[8%] transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_32%_30%,#ffffff_0%,#f3f5f8_55%,#e3e8ef_88%,#d2d9e3_100%)] opacity-60 ring-1 ring-[#21255c]/15">
          {/* línea de escaneo: el contenedor completo se traslada, la línea va en su borde superior */}
          <div className="absolute inset-0 animate-globe-scan">
            <div className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(36,140,170,0.9),transparent)]" />
            <div className="h-[14%] w-full bg-[linear-gradient(180deg,rgba(36,140,170,0.07),transparent)]" />
          </div>
        </div>
        {/* sombra en el piso */}
        <div className="absolute inset-x-[10%] -bottom-[8%] h-[6%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(33,37,92,0.14),transparent)]" />
      </div>

      <Globe
        className="absolute left-[-14%] top-[-14%] h-[128%] w-[128%]"
        active={active}
        focus={selected}
        onHover={setHovered}
        onSelect={setSelected}
        onReady={() => setReady(true)}
      />

      {/* tarjeta del país activo */}
      <div
        className={`pointer-events-none absolute right-0 top-[6%] w-[230px] rounded-2xl border border-[#21255c]/10 bg-white/90 p-5 shadow-[0_20px_50px_-25px_rgba(33,37,92,0.45)] backdrop-blur-xl transition-[opacity,translate] duration-300 max-sm:right-[-2%] max-sm:top-0 max-sm:w-[150px] max-sm:rounded-xl max-sm:p-3 ${
          info ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        aria-live="polite"
      >
        {info && (
          <>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.25em] text-[#248caa]">{info.code}</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-[#21255c]/60">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#248caa]" />
                {time(info.timeZone)}
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold leading-tight text-[#21255c] max-sm:mt-1 max-sm:text-lg">{info.name}</p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#21255c]/60 max-sm:text-xs">
              {info.city}
              {info.hq && (
                <span className="whitespace-nowrap rounded-full bg-[#21255c] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#f5f0e6]">
                  Sede principal
                </span>
              )}
            </p>
            <div className="mt-4 border-t border-[#21255c]/10 pt-3 max-sm:hidden">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#21255c]/45">Conectado con</p>
              <ul className="mt-2 space-y-1">
                {others.map((o) => (
                  <li key={o.code} className="flex items-center justify-between text-sm text-[#21255c]">
                    <span className="flex items-center gap-2">
                      <span className="h-px w-4 bg-[#248caa]" />
                      {o.city}
                      {o.hq && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#248caa]">Sede</span>
                      )}
                    </span>
                    <span className="whitespace-nowrap font-mono text-[11px] text-[#21255c]/50">{time(o.timeZone)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* selector de países */}
      <div className="absolute inset-x-0 -bottom-2 flex justify-center">
        <div
          className="flex items-center gap-1 rounded-full border border-[#21255c]/10 bg-white/85 p-1 shadow-[0_10px_30px_-15px_rgba(33,37,92,0.4)] backdrop-blur-xl"
          onMouseLeave={() => setHovered(null)}
        >
          {COUNTRIES.map((c) => {
            const on = active === c.code;
            return (
              <button
                key={c.code}
                type="button"
                // en táctil el toque no debe dejar un "hover" pegado: solo mouse y teclado
                onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(c.code)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHovered(c.code)}
                onBlur={() => setHovered(null)}
                onClick={() => setSelected((s) => (s === c.code ? null : c.code))}
                aria-pressed={selected === c.code}
                className={`flex touch-manipulation items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  on ? "bg-[#21255c] text-[#f5f0e6]" : "text-[#21255c]/75 hover:text-[#21255c]"
                }`}
              >
                <CountryFlag code={c.code} className={`size-5 transition-shadow ${on ? "ring-2 ring-white/70 rounded-full" : ""}`} />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
