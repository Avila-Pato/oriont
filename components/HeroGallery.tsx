"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Item = {
  src: string;
  alt: string;
  className: string; // posición y tamaño
  depth: number; // intensidad del parallax
};

const items: Item[] = [
  { src: "/hero/1.jpg", alt: "Edificios corporativos", className: "left-[3%] top-[13%] h-[120px] w-[190px]", depth: 18 },
  { src: "/hero/8.jpg", alt: "Profesional en un centro de datos", className: "-left-[1%] bottom-[16%] h-[150px] w-[130px]", depth: 30 },
  { src: "/hero/6.jpg", alt: "Persona trabajando con laptop y celular", className: "left-[12%] bottom-[4%] h-[130px] w-[200px]", depth: 22 },
  { src: "/hero/2.jpg", alt: "Acuerdo de negocios", className: "left-[25%] top-[9%] h-[110px] w-[170px]", depth: 12 },
  { src: "/hero/4.jpg", alt: "Equipo de trabajo", className: "right-[3%] top-[11%] h-[270px] w-[240px]", depth: 28 },
  { src: "/hero/7.jpg", alt: "Red de telecomunicaciones", className: "right-[9%] top-[55%] h-[160px] w-[220px]", depth: 20 },
  { src: "/hero/3.jpg", alt: "Reunión de equipo", className: "right-[24%] bottom-[4%] h-[150px] w-[240px]", depth: 16 },
  { src: "/hero/9.jpg", alt: "Documentos financieros", className: "right-[25%] top-[8%] h-[95px] w-[150px]", depth: 10 },
];

export default function HeroGallery() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // con "reducir movimiento" activo se mantiene, pero más suave
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.5 : 1;

    // todas las imágenes comparten UN solo desplazamiento (misma dirección);
    // la profundidad solo cambia cuánto avanza cada una.
    const factor = items.map((it) => 0.7 + (it.depth / 30) * 0.6);
    const MAX = 70 * calm; // px máximos del grupo hacia el cursor
    const DRIFT = 12 * calm; // deriva lenta compartida cuando no hay cursor
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

      const wrap = wrapRef.current?.getBoundingClientRect();
      if (wrap) {
        const vw = window.innerWidth;
        refs.current.forEach((el, i) => {
          if (!el) return;
          let x = gx * factor[i];
          let y = gy * factor[i];
          // que nunca salga de la vista
          const left = wrap.left + el.offsetLeft;
          const top = wrap.top + el.offsetTop;
          x = Math.max(Math.min(0, EDGE - left), Math.min(Math.max(0, vw - EDGE - left - el.offsetWidth), x));
          y = Math.max(
            Math.min(0, wrap.top + EDGE - top),
            Math.min(Math.max(0, wrap.bottom - EDGE - top - el.offsetHeight), y),
          );
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 hidden md:block">
      {items.map((it, i) => (
        <div
          key={it.src}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`absolute ${it.className} will-change-transform`}
        >
          <div className="relative h-full w-full overflow-hidden rounded-xl shadow-[0_20px_40px_-20px_rgba(33,37,92,0.35)]">
            <Image src={it.src} alt={it.alt} fill sizes="280px" className="object-cover" />
          </div>
        </div>
      ))}
    </div>
  );
}
