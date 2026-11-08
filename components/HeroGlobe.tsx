"use client";

import { useEffect, useState } from "react";
import Globe from "./Globe";
import { COUNTRIES, type CountryCode } from "./countries";

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
  const now = useClock();
  const active = hovered ?? selected;
  const info = COUNTRIES.find((c) => c.code === active);
  const others = COUNTRIES.filter((c) => c.code !== active);

  const time = (tz: string) =>
    now ? new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now) : "--:--";

  return (
    <div className={className || "relative"}>
      <Globe
        className="h-full w-full"
        active={active}
        focus={selected}
        onHover={setHovered}
        onSelect={setSelected}
      />

      {/* tarjeta del país activo */}
      <div
        className={`pointer-events-none absolute right-0 top-[6%] hidden w-[230px] rounded-2xl border border-[#21255c]/10 bg-[#f5f0e6]/90 p-5 shadow-[0_20px_50px_-25px_rgba(33,37,92,0.45)] backdrop-blur-xl transition-all duration-300 sm:block ${
          info ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        aria-live="polite"
      >
        {info && (
          <>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.25em] text-[#248caa]">{info.code}</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#21255c]/60">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#248caa]" />
                {time(info.timeZone)}
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold leading-tight text-[#21255c]">{info.name}</p>
            <p className="text-sm text-[#21255c]/60">{info.city}</p>
            <div className="mt-4 border-t border-[#21255c]/10 pt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#21255c]/45">Conectado con</p>
              <ul className="mt-2 space-y-1">
                {others.map((o) => (
                  <li key={o.code} className="flex items-center justify-between text-sm text-[#21255c]">
                    <span className="flex items-center gap-2">
                      <span className="h-px w-4 bg-[#248caa]" />
                      {o.city}
                    </span>
                    <span className="font-mono text-[11px] text-[#21255c]/50">{time(o.timeZone)}</span>
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
          className="flex items-center gap-1 rounded-full border border-[#21255c]/10 bg-[#f5f0e6]/85 p-1 shadow-[0_10px_30px_-15px_rgba(33,37,92,0.4)] backdrop-blur-xl"
          onMouseLeave={() => setHovered(null)}
        >
          {COUNTRIES.map((c) => {
            const on = active === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onMouseEnter={() => setHovered(c.code)}
                onFocus={() => setHovered(c.code)}
                onBlur={() => setHovered(null)}
                onClick={() => setSelected((s) => (s === c.code ? null : c.code))}
                aria-pressed={selected === c.code}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  on ? "bg-[#21255c] text-[#f5f0e6]" : "text-[#21255c]/75 hover:text-[#21255c]"
                }`}
              >
                <span className={`font-mono text-[10px] tracking-[0.2em] ${on ? "text-[#8fcbef]" : "text-[#248caa]"}`}>
                  {c.code}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
