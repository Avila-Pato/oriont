"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * true (y se queda en true) cuando el elemento está a `margin` de entrar en pantalla.
 * Sirve para no preparar animaciones (GSAP/ScrollTrigger) de secciones de abajo durante la
 * carga: esa preparación lee y escribe estilos y alargaba la tarea de hidratación.
 * ademas divide tareas para evitar cargas de js en el navegador
 */
export function useNearViewport(ref: RefObject<Element | null>, margin = "100% 0px") {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);

  return near;
}
