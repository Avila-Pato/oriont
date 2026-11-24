import { useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SKIP_INTRO_EVENT, getLenis } from "@/components/layout/SmoothScroll";



gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Corre el scroll `d` px sin cortar la inercia. Con Lenis, `scrollTo(..., { immediate })` frena
 * el scroll suave en seco (se sentía un frenón): aquí se corre también su animación en curso
 * (origen, destino y valor), así sigue deslizando igual desde la nueva posición.
 */
function shiftScroll(d: number) {
  const lenis = getLenis();
  if (!lenis) {
    window.scrollTo({ top: window.scrollY + d, behavior: "instant" });
    return;
  }
  // `animate` es interno de Lenis (1.3.x): su tween en curso
  const anim = (lenis as unknown as { animate?: { from: number; to: number; value: number } }).animate;
  if (anim) {
    anim.from += d;
    anim.to += d;
    anim.value += d;
  }
  lenis.animatedScroll += d;
  lenis.targetScroll += d;
  window.scrollTo({ top: lenis.animatedScroll, behavior: "instant" });
}

type Refs = {
  /** la sección (sticky en escritorio) */
  root: RefObject<HTMLElement | null>;
  /** envoltura de sección + espaciador: su recorrido es el del mazo */
  track: RefObject<HTMLDivElement | null>;
  /** espaciador que reserva el scroll de las cartas; se oculta al terminar */
  spacer: RefObject<HTMLDivElement | null>;
};

/**
 * Entrada de la sección Soluciones: título con barrido, índice en cascada y el mazo armándose
 * con el scroll (escritorio) o las tarjetas de la grilla subiendo (celular/tablet).
 *
 * Devuelve `shown` (cuántas cartas entraron; null = sin entrada en curso, todas a la vista) y
 * `endIntro()`, que completa el mazo al tiro (lo usa el índice al elegir una carta a mitad).
 */
export function useDeckIntro({ root, track, spacer }: Refs, near: boolean) {
  // la entrada de las cartas corre una sola vez
  const played = useRef(false);
  const endRef = useRef<(() => void) | null>(null);
  const [shown, setShown] = useState<number | null>(null);

  useGSAP(
    () => {
      if (!near) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 75%", once: true } })
          .from("[data-vc-eline]", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5, ease: "power2.out" }, 0)
          .from("[data-vc-elabel]", { x: -14, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 0.1)
          .fromTo(
            "[data-vc-title]",
            { clipPath: "inset(0% 100% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut" },
            0.15,
          )
          .from("[data-vc-sub]", { y: 24, autoAlpha: 0, duration: 0.6, ease: "power3.out" }, 0.5)
          .from("[data-vc-idx] > li", { x: -28, autoAlpha: 0, duration: 0.55, ease: "power3.out", stagger: 0.07 }, 0.55);

        // celular/tablet: las tarjetas de la grilla suben al aparecer
        gsap.utils.toArray<HTMLElement>("[data-vc-mcard]").forEach((card, i) => {
          gsap.from(card, {
            y: 40,
            autoAlpha: 0,
            duration: 0.7,
            // grilla de 2 columnas (la 01 a lo ancho): la de la derecha de cada fila entra un poco después
            delay: i > 0 && i % 2 === 0 ? 0.1 : 0,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%", once: true },
          });
        });
      });

      // Escritorio: la sección queda fija (sticky dentro de `track`, sin `pin` de GSAP para no
      // generar layout shift) y cada tramo de scroll trae una carta desde abajo que se apila
      // sobre la anterior: 01 primero, 05 al final, al frente. Al subir se van en orden inverso.
      // GSAP anima `transform` de la envoltura, que se suma al `translate` del apilado sin pisarlo.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        // ya se armó una vez: el mazo queda completo y la sección ya no se fija
        if (played.current) return;
        const sp = spacer.current;
        const tr = track.current;
        if (!sp || !tr) return;
        // El espaciador viene oculto y solo se agrega si la sección todavía no llega arriba: así
        // entra por debajo de lo que se ve y nada en pantalla se mueve. Si se llega ya pasada (enlace
        // a otra sección, recarga a mitad de página) no hay recorrido de cartas: el mazo queda
        // completo. Antes el espaciador venía puesto y se quitaba al acercarse desde abajo: sacar
        // 200vh por encima de la pantalla daba CLS ~0.9 aunque el scroll lo compensara.
        if (tr.getBoundingClientRect().top < -1) {
          played.current = true;
          return;
        }
        sp.style.display = "block";
        const cards = gsap.utils.toArray<HTMLElement>("[data-vc-card]");
        const tl = gsap.timeline({
          paused: true,
          // el índice acompaña al mismo tiempo: se marca la carta apenas empieza a subir (la carta k
          // arranca en el segundo k - 1 del timeline). La 01 ya está, así que siempre hay al menos 1.
          onUpdate: () => {
            const n = gsap.utils.clamp(1, cards.length, 1 + Math.ceil(tl.time() - 0.05));
            setShown((s) => (s === n ? s : n));
          },
        });
        // la 01 ya está puesta al llegar a la sección; desde la 02 suben de a una con el scroll
        setShown(1);
        cards.slice(1).forEach((card, k) => {
          // cada carta empieza cuando termina la anterior → de 1 en 1
          // ease suave aquí: la curva fuerte la pone el tween que mueve el timeline (abajo); si las
          // dos eran "out" se sumaban y la carta salía disparada al inicio
          // como repartir una carta a mano: llega levantada (algo más grande, más cerca de quien
          // mira) y girada unos grados, y se endereza y "cae" sobre el mazo al final, con un
          // asentamiento mínimo. Todo en el transform de la envoltura (sin reflow)
          tl.from(card, { y: 220, ease: "power1.out", duration: 1 }, k)
            .from(
              card,
              { rotation: k % 2 ? 4 : -4, scale: 1.05, transformOrigin: "50% 100%", ease: "back.out(1.4)", duration: 1 },
              k,
            )
            // aparece casi al tiro (es una carta que entra, no un fantasma que se materializa)
            .from(card, { autoAlpha: 0, ease: "none", duration: 0.1 }, k);
        });

     
        /** Termina para siempre: al pasar la 05 con el scroll, o al elegir una carta del índice / un
         *  enlace del menú. Se completa el mazo, se suelta el trigger y se quita el espaciador, así la
         *  sección deja de fijarse y la animación no se repite. */
        const ref: { st?: ScrollTrigger } = {};
        const finish = () => {
          if (played.current) return;
          played.current = true;
          ref.st?.kill();
          gsap.to(tl, { progress: 1, duration: 0.3, ease: "power1.out", overwrite: true });
          setShown(null);
          const sec = root.current;
          if (!sec) return;
          // al quitar el espaciador la sección cambia de lugar (deja de estar fija): se mide antes
          // y después y el scroll se corre esa diferencia, así en pantalla nada se mueve
          // (sirve igual al terminar el recorrido o a mitad, si se elige una carta del índice)
          const before = sec.getBoundingClientRect().top;
          sp.style.display = "none";
          const diff = sec.getBoundingClientRect().top - before;
          if (Math.abs(diff) > 0.5) shiftScroll(diff);
          ScrollTrigger.refresh();
        };
        const skip = () => finish();
        endRef.current = skip;

        // Mientras no termina, el mazo va ATADO al scroll (scrub directo): la posición de las cartas es la del scroll, así
        // que siguen a la rueda tal cual (rápido o lento, bajando o subiendo) y la sección no puede
        // irse con cartas a medio camino: terminan justo donde termina el recorrido. El recorrido
        // (espaciador de 400 px) da 100 px por carta = un giro de rueda por carta. El suavizado lo
        // pone Lenis (el scroll mismo); aquí no se agrega otro tween encima.
        const steps = cards.length - 1;
        let settle = 0;
        ref.st = ScrollTrigger.create({
          trigger: track.current,
          start: "top top", // la sección llega con la 01 puesta; la 02 sube al quedar fija
          end: "bottom bottom", // fin del recorrido reservado por el espaciador
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            tl.time(self.progress * steps);
            // quieto a mitad de una carta: se acomoda sola a la más cercana (corto, con Lenis)
            clearTimeout(settle);
            settle = window.setTimeout(() => {
              const lenis = getLenis();
              const st = ref.st;
              if (!lenis || !st || played.current) return;
              const len = st.end - st.start;
              const p = (lenis.animatedScroll - st.start) / len;
              if (p <= 0 || p >= 1) return;
              const dest = st.start + (Math.round(p * steps) / steps) * len;
              if (Math.abs(dest - lenis.animatedScroll) > 2) lenis.scrollTo(dest, { duration: 0.15 }); 
            }, 120);
          },
          // UNA sola vez: pasada la 05 el mazo queda completo para siempre, la sección deja de fijarse
          // (se quita el espaciador, con el scroll compensado) y al volver a subir pasa normal
          onLeave: () => finish(),
          // subir antes de terminar: el mazo queda recogido y se puede volver a repartir
          onLeaveBack: () => tl.time(0),
        });

        // un enlace a otra sección (menú) la termina antes: al quitar el espaciador cambia el alto
        window.addEventListener(SKIP_INTRO_EVENT, skip);
        // el espaciador cambió el alto de la página: los demás triggers (ya creados) deben medir de nuevo
        ScrollTrigger.refresh();
        return () => {
          endRef.current = null;
          clearTimeout(settle);
          window.removeEventListener(SKIP_INTRO_EVENT, skip);
          if (!played.current) {
            setShown(null);
            sp.style.display = "";
          }
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [near], revertOnUpdate: true },
  );

  return { shown, endIntro: () => endRef.current?.() };
}
