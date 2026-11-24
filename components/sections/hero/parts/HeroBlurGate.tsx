"use client";

import { useEffect, useRef } from "react";

/**
 * Apaga el desenfoque (backdrop-blur) del panel de texto del Hero cuando la sección ya salió a
 * medias de la pantalla (su borde de abajo sube de la mitad): marca la <section> con
 * data-noblur y el panel usa `in-data-noblur:backdrop-blur-none`.
 * Por qué: al llegar el panel al borde de arriba, el desenfoque obligaba a la GPU a preparar otro
 * tipo de dibujo (~90 ms de tirón la primera vez que se baja). Con la sección a medio salir el
 * panel ya va saliendo y el cambio casi no se ve. No dibuja nada.
 */
export default function HeroBlurGate() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;
    // raíz = mitad de abajo de la pantalla: la sección "se ve" mientras su borde inferior esté
    // por debajo de la mitad (sirve con cualquier alto de sección, también en celular)
    const io = new IntersectionObserver(([e]) => section.toggleAttribute("data-noblur", !e.isIntersecting), {
      rootMargin: "-50% 0px 0px 0px",
    });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return <span ref={ref} hidden />;
}
