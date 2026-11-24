import { useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SKIP_INTRO_EVENT, getLenis, setWheelLimit } from "@/components/layout/SmoothScroll";
import { STEP_DUR, STEP_DUR_FAST } from "./constants";



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
        tl.to({}, { duration: 0.3 }); // pausa con el mazo completo antes de soltar la sección

     
        let target = 0; // paso que pide el scroll: cuántas cartas (además de la 01) deben estar arriba
        let at = 0; // paso hacia el que va la animación
        let animating = false;
        // un giro hacia abajo que llegó al tope mientras la 05 subía: se aplica al aterrizar
        let pendingLeave = false;
        /** El mazo sigue a la rueda, en los dos sentidos: cada cambio de paso lanza UN tween hacia
         *  él. Un paso (giro lento) = una carta en STEP_DUR; varios de golpe (giro rápido o grande)
         *  = todas esas cartas barajadas en STEP_DUR_FAST. Al subir se recogen igual. */
        const advance = () => {
          const dist = Math.abs(target - tl.time());
          if (dist < 0.01) return;
          at = target;
          animating = true;
          const many = dist > 1.2;
          gsap.to(tl, {
            time: at,
            duration: many ? STEP_DUR_FAST : STEP_DUR,
            // una carta: inOut suave (la carta ya trae su propia curva "out"); varias: arranca rápido
            ease: many ? "power2.out" : "sine.inOut",
            overwrite: true,
            onComplete: () => {
              animating = false;
              // aterrizó la 05 con un giro guardado: la página sigue sola (sin pedir otro giro)
              if (pendingLeave && at === cards.length - 1) {
                pendingLeave = false;
                const lenis = getLenis();
                lenis?.scrollTo(lenis.targetScroll + 100);
              }
            },
          });
        };

        /** Termina para siempre (índice o menú): se completa el mazo al tiro, se suelta el trigger y
         *  se quita el espaciador, así la sección deja de fijarse. Con el scroll NO se llama: el mazo
         *  queda atado a la rueda (al volver a subir se recoge, al bajar se reparte de nuevo). */
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

        // si la página carga ya pasada la sección, onLeave corre dentro de create (antes de asignar)
        ref.st = ScrollTrigger.create({
          trigger: track.current,
          start: "top top", // la sección llega con la 01 puesta; la 02 sube al quedar fija
          end: "bottom bottom", // fin del recorrido reservado por el espaciador
          invalidateOnRefresh: true,
          // por pasos: el recorrido se divide en un tramo por carta y apenas se entra a un tramo
          // (un poquito de scroll) la carta sube completa sola, sin quedar a medio camino.
          // Un tramo por carta, también para la 01: así se alcanza a leer antes de que suba la 02.
          onUpdate: (self) => {
            // con Lenis se mira el DESTINO del scroll (lo que pidió el giro), no la posición actual:
            // el scroll suave tarda ~0,4 s en recorrer el tramo y la carta esperaba. Así arranca
            // en el cuadro siguiente al giro.
            const lenis = getLenis();
            const progress = lenis ? (lenis.targetScroll - self.start) / (self.end - self.start || 1) : self.progress;
            const step = gsap.utils.clamp(0, cards.length - 1, Math.floor(progress * cards.length));
            if (step === target) return;
            target = step;
            advance();
          },
          // pasado el final queda todo arriba; al volver a subir el mazo se recoge con la rueda
          onLeave: () => {
            target = cards.length - 1;
            advance();
          },
          onLeaveBack: () => {
            target = 0;
            advance();
          },
        });

        // Tope SOLO al final del recorrido: entre cartas el scroll sigue fluido, pero la página no
        // se va hasta que la última carta (05) terminó de subir (si no, con 80 px por carta la
        // sección se iba con cartas aún en camino). Un giro dado contra el tope no se pierde: queda
        // guardado (pendingLeave) y se aplica solo cuando la 05 aterriza → 1 giro = 1 paso.
        const deckDone = () => played.current || (at === cards.length - 1 && !animating);
        setWheelLimit(() => (deckDone() ? null : (ref.st?.end ?? null)));
        // captura: corre antes que el manejador de Lenis, con el destino del giro anterior
        const onWheel = (e: WheelEvent) => {
          const lenis = getLenis();
          const end = ref.st?.end;
          if (e.deltaY > 0 && lenis && end != null && !deckDone() && lenis.targetScroll >= end - 1) pendingLeave = true;
        };
        window.addEventListener("wheel", onWheel, { capture: true, passive: true });

        // un enlace a otra sección (menú) la termina antes: al quitar el espaciador cambia el alto
        window.addEventListener(SKIP_INTRO_EVENT, skip);
        // el espaciador cambió el alto de la página: los demás triggers (ya creados) deben medir de nuevo
        ScrollTrigger.refresh();
        return () => {
          endRef.current = null;
          setWheelLimit(null);
          window.removeEventListener("wheel", onWheel, { capture: true });
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
