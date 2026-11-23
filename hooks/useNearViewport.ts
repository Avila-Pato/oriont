"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * cuando el elemento está a `margin` de entrar en pantalla.
 * Sirve para no preparar animaciones (GSAP/ScrollTrigger) de secciones de abajo durante la
 * carga: esa preparación lee y escribe estilos y alargaba la tarea de hidratación.
 * ademas divide tareas para evitar cargas de js en el navegador
 */
/**
 * Para loops de animación (rAF): llama `onChange(true)` cuando el elemento se ve y `onChange(false)`
 * cuando deja de verse, cada vez. A diferencia de useNearViewport no usa estado de React (no
 * re-renderiza) y se usa dentro de un efecto. `minRatio`: fracción del elemento que debe verse
 * (0 = basta 1 px). Devuelve la función para desconectar.
 */
export function watchVisible(el: Element, onChange: (visible: boolean) => void, minRatio = 0) {
  const io = new IntersectionObserver(
    ([e]) => onChange(e.isIntersecting && e.intersectionRatio >= minRatio),
    { threshold: minRatio ? [0, minRatio] : 0 },
  );
  io.observe(el);
  return () => io.disconnect();
}

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
