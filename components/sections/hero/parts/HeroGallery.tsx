"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { HERO_GALLERY as items } from "@/data/hero";


export default function HeroGallery() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // "reducir movimiento": fotos quietas, sin loop de rAF
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // todas las imágenes comparten UN solo desplazamiento (misma dirección);
    // la profundidad solo cambia cuánto avanza cada una.
    const factor = items.map((it) => 0.7 + (it.depth / 30) * 0.6);
    const MAX = 70; // px máximos del grupo hacia el cursor
    const DRIFT = 12; // deriva lenta compartida cuando no hay cursor
    const EASE = 0.02; // lento y suave
    const EDGE = 8;

    let gx = 0;
    let gy = 0;
    let target: { x: number; y: number } | null = null;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      // dirección del cursor respecto al centro de la pantalla (-1..1)
      target = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    const onLeave = () => {
      target = null;
    };

    const tick = (now: number) => {
      // destino común: hacia el cursor, o una deriva circular muy lenta
      const tx = target ? target.x * MAX : Math.sin((now / 30000) * Math.PI * 2) * DRIFT;
      const ty = target ? target.y * MAX : Math.cos((now / 30000) * Math.PI * 2) * DRIFT * 0.6;
      gx += (tx - gx) * EASE;
      gy += (ty - gy) * EASE;

      // límites precalculados: sin lecturas de layout dentro del loop
      refs.current.forEach((el, i) => {
        const b = box[i];
        if (!el || !b) return;
        const x = Math.max(b.minX, Math.min(b.maxX, gx * factor[i]));
        const y = Math.max(b.minY, Math.min(b.maxY, gy * factor[i]));
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };

    // cuánto puede moverse cada foto sin salir de la vista (se mide al cambiar el tamaño, no por frame)
    let box: { minX: number; maxX: number; minY: number; maxY: number }[] = [];
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const vw = document.documentElement.clientWidth;
      const left0 = wrap.getBoundingClientRect().left;
      const wh = wrap.offsetHeight;
      box = refs.current.map((el) => {
        if (!el) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        const left = left0 + el.offsetLeft;
        return {
          minX: Math.min(0, EDGE - left),
          maxX: Math.max(0, vw - EDGE - left - el.offsetWidth),
          minY: Math.min(0, EDGE - el.offsetTop),
          maxY: Math.max(0, wh - EDGE - el.offsetTop - el.offsetHeight),
        };
      });
    };

    // el loop solo corre con el hero en pantalla (y en escritorio: en móvil el contenedor está oculto)
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const wrap = wrapRef.current!;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(wrap);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
      io.disconnect();
      stop();
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 hidden lg:block">
      {items.map((it, i) => (
        <div
          key={it.src.src}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`absolute ${it.className} will-change-transform`}
        >
          <div className="relative h-full w-full overflow-hidden rounded-xl shadow-[0_20px_40px_-20px_rgba(33,37,92,0.35)] xl:scale-110 2xl:scale-[1.3]">
            <Image src={it.src} alt={it.alt} fill sizes="(min-width: 1536px) 360px, 280px" loading="eager" placeholder="blur" className="object-cover" />
          </div>
        </div>
      ))}
    </div>
  );
}
