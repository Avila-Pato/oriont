"use client";

import { useEffect, useState } from "react";

/**
 * id de la sección que cruza una línea horizontal de la pantalla (por defecto al 40 % desde
 * arriba), o null si ninguna la cruza (p. ej. arriba del todo, en el hero).
 * Usa IntersectionObserver: la "pantalla" del observer es solo esa línea (-40 % arriba,
 * -60 % abajo), así el navegador avisa cuando una sección la cruza sin medir nada en cada scroll
 * (medir con getBoundingClientRect forzaba a recalcular estilos y layout en cada cuadro).
 * Si dos la tocan a la vez (justo en el borde), gana la última de la lista.
 */
export function useActiveSection(ids: readonly string[], line = 0.4) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    const list = key.split(",").filter(Boolean);
    const crossing = new Set<string>();
    const top = Math.round(line * 100);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) crossing.add(e.target.id);
          else crossing.delete(e.target.id);
        }
        let current: string | null = null;
        for (const id of list) if (crossing.has(id)) current = id;
        setActive((a) => (a === current ? a : current));
      },
      { rootMargin: `-${top}% 0px -${100 - top}% 0px` },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [key, line]);

  return active;
}
