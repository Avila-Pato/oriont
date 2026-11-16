"use client";

// VISTA PREVIA TEMPORAL: la "Cadena de valor" como lista editorial (el diseño alternativo).
// Filas grandes; la activa se abre con texto, puntos y foto. Hover abre, clic en la abierta
// cierra. Borrar al decidir.

import Image, { type StaticImageData } from "next/image";
import { useRef, useState } from "react";
import { steps } from "@/data/value-chain";
import sala from "@/public/oriont/oficina-sala-reunion.webp";
import jefes from "@/public/oriont/jefes.webp";
import ti from "@/public/oriont/equipo-ti.webp";
import supervisor from "@/public/oriont/supervisor.webp";
import todos from "@/public/oriont/todos.webp";

const PHOTOS: StaticImageData[] = [sala, jefes, ti, supervisor, todos];

const ROW = 88; // alto de una fila cerrada (px)
const OPEN = 430; // alto de la fila abierta (px)
const LIST_H = ROW * (steps.length - 1) + OPEN; // alto total, fijo (CLS 0)

const pad = (i: number) => String(i + 1).padStart(2, "0");

export default function PreviewCadenaLista() {
  const [active, setActive] = useState<number | null>(0);
  const wasOpen = useRef(false);

  return (
    <main className="bg-white text-[#21255c]">
      <div className="grid h-[60vh] place-items-center bg-[#f8f9f9] text-sm text-[#21255c]/50">
        ↓ baja para ver la sección (vista previa: lista editorial)
      </div>

      <section className="pb-28 pt-24 md:pb-40 md:pt-32">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#248caa] xl:text-[12px]">
              <span className="h-px w-6 bg-[#248caa] xl:w-8" />
              Cadena de valor
            </p>
            <h2 className="mt-5 font-display text-[36px] font-semibold leading-[1.02] tracking-tight md:text-[56px] xl:text-[72px]">
              Del sponsor al <span className="text-[#248caa]">cliente final.</span>
            </h2>
          </div>
          <p className="max-w-[460px] text-[15px] leading-relaxed text-[#21255c]/70 lg:justify-self-end xl:text-[19px]">
            Acompañamos cada eslabón de la cadena: desde la idea del producto hasta la conversación con el cliente.
          </p>
        </div>

        {/* escritorio */}
        <div className="container-page mt-16 hidden lg:block">
          <ol className="relative" style={{ height: LIST_H }}>
            {steps.map((s, i) => {
              const on = i === active;
              const y = i * ROW + (active !== null && i > active ? OPEN - ROW : 0);
              return (
                <li
                  key={s.title}
                  onMouseEnter={() => setActive(i)}
                  onPointerDown={() => (wasOpen.current = active === i)}
                  onClick={() => setActive(wasOpen.current ? null : i)}
                  className="absolute inset-x-0 top-0 cursor-pointer border-t border-[#21255c]/12 transition-[translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ height: OPEN, translate: `0 ${y}px` }}
                >
                  <div className="flex items-center gap-6 md:gap-10" style={{ height: ROW }}>
                    <span className={`w-12 font-mono text-[13px] tracking-[0.2em] transition-colors duration-500 ${on ? "text-[#248caa]" : "text-[#21255c]/40"}`}>
                      {pad(i)}
                    </span>
                    <h3 className="flex-1">
                      <button
                        type="button"
                        aria-expanded={on}
                        className={`font-display text-[26px] font-semibold tracking-tight transition-colors duration-500 focus-visible:outline-none md:text-[36px] xl:text-[44px] ${
                          on ? "text-[#21255c]" : "text-[#21255c]/35"
                        }`}
                      >
                        {s.title}
                      </button>
                    </h3>
                    <ul aria-hidden={on} className={`flex gap-2 transition-opacity duration-500 ${on ? "opacity-0" : "opacity-100"}`}>
                      {s.tags.map((t) => (
                        <li key={t} className="rounded-full border border-[#21255c]/12 px-3 py-1 text-[12px] text-[#21255c]/50">
                          {t}
                        </li>
                      ))}
                    </ul>
                    <span
                      aria-hidden
                      className={`grid h-10 w-10 place-items-center rounded-full border text-lg transition-[rotate,background-color,color,border-color] duration-500 ${
                        on ? "rotate-90 border-[#21255c] bg-[#21255c] text-white" : "border-[#21255c]/20 text-[#21255c]/50"
                      }`}
                    >
                      →
                    </span>
                  </div>

                  <div
                    aria-hidden={!on}
                    className={`grid gap-8 transition-[clip-path,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[180px_1fr_minmax(0,0.9fr)] ${
                      on ? "opacity-100 [clip-path:inset(0_0_0_0)]" : "pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]"
                    }`}
                    style={{ height: OPEN - ROW - 32 }}
                  >
                    <span aria-hidden className="hidden font-display text-[150px] font-bold leading-[0.8] tracking-tighter text-[#248caa]/15 xl:block">
                      {pad(i)}
                    </span>
                    <div className="flex flex-col justify-between py-2">
                      <p className="max-w-[520px] text-[16px] leading-relaxed text-[#21255c]/75 xl:text-[19px]">{s.text}</p>
                      <ul className="mt-5 space-y-2.5 xl:space-y-3">
                        {s.points.map((p) => (
                          <li key={p} className="flex items-center gap-3 text-[14px] font-medium xl:text-[16px]">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#248caa]/12 text-[12px] text-[#248caa]">✓</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {s.tags.map((t) => (
                          <li key={t} className="rounded-full bg-[#21255c] px-4 py-1.5 text-[13px] font-medium text-[#f5f0e6]">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="relative overflow-hidden rounded-[28px]">
                      <Image src={PHOTOS[i]} alt="" fill sizes="600px" className="object-cover" />
                    </div>
                  </div>
                </li>
              );
            })}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-[#21255c]/12 transition-[translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ translate: `0 ${active === null ? steps.length * ROW : LIST_H}px` }}
            />
          </ol>
        </div>

        {/* celular / tablet */}
        <ol className="container-page mt-12 space-y-10 lg:hidden">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t border-[#21255c]/12 pt-6">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[12px] tracking-[0.2em] text-[#248caa]">{pad(i)}</span>
                <h3 className="font-display text-[24px] font-semibold tracking-tight sm:text-[28px]">{s.title}</h3>
              </div>
              <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-2xl">
                <Image src={PHOTOS[i]} alt="" fill sizes="(min-width: 640px) 600px, 92vw" className="object-cover" />
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-[#21255c]/75">{s.text}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <li key={t} className="rounded-full border border-[#21255c]/15 px-3.5 py-1 text-[12px] font-medium text-[#21255c]/70">
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid h-[60vh] place-items-center bg-[#f8f9f9] text-sm text-[#21255c]/50">fin de la sección</div>
    </main>
  );
}
