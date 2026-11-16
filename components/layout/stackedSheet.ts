import gsap from "gsap";

/**
 * Entrada de "hoja apilada": la sección sube como una hoja sobre la anterior, que se queda quieta
 * en pantalla (se corre hacia abajo lo mismo que sube el scroll), se achica un poco y se oscurece
 * tras su velo [data-stack-dim] (un hijo directo con inset-0). Solo transform/opacity: no cambia
 * el layout, así que las posiciones de las demás secciones no se mueven.
 *
 * La sección que entra necesita: fondo propio, esquinas redondeadas arriba, sombra hacia arriba y
 * z-index sobre la anterior. Llamar dentro de un contexto de GSAP (useGSAP) para que se limpie solo.
 */
/**
 * Entrada "acoplada" (variante de la anterior, para que no se repita el mismo efecto): la página
 * sigue corriendo normal, pero la sección llega un poco más abajo y más chica (como una tarjeta
 * que viene en camino) y se endereza hasta calzar al llegar arriba; la anterior solo se atenúa
 * levemente tras su velo [data-stack-dim], sin congelarse. Solo transform/opacity.
 */
export function dockedSheetEntrance(section: HTMLElement | null) {
  if (!section) return;
  const prev = section.previousElementSibling as HTMLElement | null;
  const dim = prev?.querySelector<HTMLElement>(":scope > [data-stack-dim]");
  const tl = gsap.timeline({
    defaults: { ease: "none", immediateRender: false },
    scrollTrigger: {
      trigger: section,
      // empieza justo cuando el borde asoma por abajo: el corrimiento inicial (y) queda fuera de
      // la pantalla y no se ve ningún salto al activarse el tramo
      start: "top bottom",
      end: "top 12%", // termina de calzar un poco antes de llegar arriba
      scrub: true,
      invalidateOnRefresh: true,
      // fuera del tramo no queda ningún transform aplicado
      onLeaveBack: () => gsap.set(dim ? [section, dim] : section, { clearProps: "transform,opacity" }),
      onLeave: () => gsap.set(section, { clearProps: "transform" }),
    },
  });
  tl.fromTo(section, { y: 56, scale: 0.955, transformOrigin: "50% 0%" }, { y: 0, scale: 1 }, 0);
  if (dim) tl.fromTo(dim, { opacity: 0 }, { opacity: 0.3 }, 0);
}

export function stackedSheetEntrance(section: HTMLElement | null, enter = 0.7) {
  const prev = section?.previousElementSibling as HTMLElement | null;
  const dim = prev?.querySelector<HTMLElement>(":scope > [data-stack-dim]");
  if (!section || !prev || !dim) return;
  gsap
    .timeline({
      defaults: { ease: "none", immediateRender: false },
      scrollTrigger: {
        trigger: section,
        start: `top ${enter * 100}%`, // arranca con el borde de la sección a este % de la pantalla
        end: "top top",
        scrub: true, // sin suavizado: la sección de atrás queda clavada en su lugar
        invalidateOnRefresh: true,
        // al volver arriba del inicio, la anterior queda sin transform (nada adentro debe heredarlo)
        onLeaveBack: () => gsap.set([prev, dim], { clearProps: "transform,opacity" }),
      },
    })
    .fromTo(prev, { y: 0, scale: 1 }, { y: () => window.innerHeight * enter, scale: 0.92, transformOrigin: "50% 100%" }, 0)
    .fromTo(dim, { opacity: 0 }, { opacity: 0.55 }, 0);
}
