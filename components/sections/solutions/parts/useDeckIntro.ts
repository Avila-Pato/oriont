import { useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SKIP_INTRO_EVENT, getLenis, setWheelLimit } from "@/components/layout/SmoothScroll";

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
        let reached = 0; // paso en que la animación ya terminó (carta quieta)
        let animating = false;
        let stepDur = 0.4; // lo que tarda en subir cada carta
        /** De a una carta: con un scroll fuerte el paso pedido salta varios tramos, pero las cartas
         *  igual suben una por una, cada una con su animación completa, hasta alcanzarlo. */
        const advance = () => {
          if (at === target) {
            animating = false;
            return;
          }
          animating = true;
          at += Math.sign(target - at);
          // inOut: arranca y frena suave, se desliza en vez de saltar
          gsap.to(tl, {
            time: at,
            duration: stepDur,
            ease: "power2.inOut",
            overwrite: true,
            onComplete: () => {
              reached = at;
              advance();
            },
          });
        };

        /** Termina para siempre: se completa el mazo, se suelta el trigger y se quita el
         *  espaciador, para que al subir la sección pase normal (sin quedarse fija).
         *  `gentle` (al salir con el scroll): las cartas que faltan siguen subiendo de a una, algo
         *  más rápido, en vez de llegar todas juntas de golpe.
         *  Sin `gentle` (índice o menú): al tiro, porque después viene otra animación o un salto. */
        const ref: { st?: ScrollTrigger } = {};
        const finish = (gentle = false) => {
          if (played.current) return;
          played.current = true;
          setWheelLimit(null);
          ref.st?.kill();
          if (gentle) {
            target = cards.length - 1;
            stepDur = 0.55;
            if (!animating) advance();
          } else {
            gsap.to(tl, { progress: 1, duration: 0.3, ease: "power1.out", overwrite: true });
          }
          setShown(null);
          const sp = spacer.current;
          const sec = root.current;
          if (!sp || !sec) return;
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
            const step = gsap.utils.clamp(0, cards.length - 1, Math.floor(self.progress * cards.length));
            if (step === target) return;
            target = step;
            // si ya hay una carta en camino, al terminar sigue sola hacia el nuevo paso
            if (!animating) advance();
          },
          // pasado el final se suelta para siempre (al subir ya no se repite)
          onLeave: (self) => {
            self.kill();
            finish(true);
          },
        });

        // Freno de la rueda mientras se arma el mazo: el scroll no puede adelantarse más de un tramo
        // a la última carta que terminó de subir. Así un giro fuerte trae solo la carta siguiente
        // (y no saca de la sección): para la otra hay que volver a girar cuando esa ya llegó.
        // Al completar el mazo no hay tope y se sale normal. Solo hacia abajo y solo con Lenis.
        if (!played.current) {
          setWheelLimit(() => {
            const st = ref.st;
            if (played.current || !st) return null;
            const allowed = reached + 1; // tramo de la carta siguiente
            if (allowed > cards.length - 1) return null; // mazo completo: libre
            // fin del tramo `allowed` (un px antes de entrar al siguiente)
            return st.start + ((st.end - st.start) * (allowed + 1)) / cards.length - 1;
          });
        }

        // un enlace a otra sección (menú) la termina antes: al quitar el espaciador cambia el alto
        window.addEventListener(SKIP_INTRO_EVENT, skip);
        return () => {
          setWheelLimit(null);
          endRef.current = null;
          window.removeEventListener(SKIP_INTRO_EVENT, skip);
          if (!played.current) setShown(null);
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [near], revertOnUpdate: true },
  );

  return { shown, endIntro: () => endRef.current?.() };
}
