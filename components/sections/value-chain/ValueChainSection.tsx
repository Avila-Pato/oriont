"use client";

import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useNearViewport } from "@/hooks/useNearViewport";
import { steps, type StepIcon } from "@/data/value-chain";
import { THEME } from "./parts/themes";
import { SKIP_INTRO_EVENT, getLenis } from "@/components/layout/SmoothScroll";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ---------- sección "Cadena de valor": mazo de tarjetas con índice ----------
 * Escritorio: índice a la izquierda y las etapas apiladas a la derecha (los bordes de las de
 * atrás asoman arriba). Al elegir del índice (o tocar una de atrás), la tarjeta sale hacia la
 * derecha, el mazo se reacomoda y vuelve por encima, al frente. Sin retener el scroll: la página
 * corre libre. Reacomodo con transiciones CSS de translate/scale/opacity (sin reflow).
 * Celular/tablet: tarjetas en lista.
 */

const OFFSET = 36; // px que asoma cada tarjeta por encima de la siguiente
const DEPTH_DIM = 0.07; // cuánto se oscurece cada tarjeta de atrás
const CARD_H = 455; // alto de la tarjeta (px)
const SHUFFLE_OUT = 380; // ms del viaje de salida al barajar
const LAST = steps.length - 1;

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

const pad = (i: number) => String(i + 1).padStart(2, "0");

/** íconos simples por etapa (trazo, heredan el color del tema) */
const ICONS: Record<StepIcon, ReactNode> = {
  building: <path d="M5 21V5l7-2 7 2v16M9 9h2m2 0h2M9 13h2m2 0h2M9 17h2m2 0h2" />,
  box: <path d="M12 3l8 4v10l-8 4-8-4V7l8-4zm0 8L4 7m8 4l8-4m-8 4v10" />,
  network: <path d="M12 5a2 2 0 100-4 2 2 0 000 4zm-7 9a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zm-7 9a2 2 0 100-4 2 2 0 000 4zM12 5v4m-5.5 2.5L11 10m2 0l4.5 1.5M12 15v4" />,
  headset: <path d="M4 13a8 8 0 0116 0m-16 0v4a2 2 0 002 2h1v-6H6a2 2 0 00-2 2zm16 0v4a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2zm-5 7h-3" />,
  product: <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8L12 3z" />,
};

export default function ValueChainSection() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  // la entrada de las cartas corre una sola vez
  const played = useRef(false);
  // termina la entrada al tiro (mazo completo); lo deja listo el efecto de GSAP
  const endIntro = useRef<(() => void) | null>(null);
  // las animaciones se preparan recién a una pantalla de distancia (no al cargar)
  const near = useNearViewport(root);

  // El mazo sigue SIEMPRE el orden de la lista: la elegida va al frente y las demás quedan
  // detrás en orden por número, compactadas (sin huecos), así se leen todos los bordes de arriba
  // (con 04 al frente: 01, 02, 03, 05). Sin elegir, 05 está al frente.
  const [chosen, setChosen] = useState<number | null>(null);
  // tarjeta saliendo: se desvanece hacia la derecha desde el puesto que tenía (y, z)
  const [moving, setMoving] = useState<{ i: number; y: number; z: number } | null>(null);
  const busy = useRef(false);
  const front = chosen ?? LAST;
  // cartas que ya entraron con el scroll (null = sin animación de entrada: todas a la vista)
  const [shown, setShown] = useState<number | null>(null);
  // en el índice se marca la última que llegó mientras el mazo se arma; después, la del frente
  const marked = shown !== null && shown < steps.length ? shown - 1 : front;

  /** cambio limpio: la elegida se desvanece hacia la derecha mientras el mazo se reacomoda; ya
   *  invisible pasa adelante y entra desde la derecha. Nunca cruza visible por encima de otra. */
  const pick = (i: number) => {
    // elegir mientras el mazo se arma con el scroll: primero se completa el mazo (si no, el índice
    // seguía marcando la última que llegó y no la que quedaba al frente)
    if (shown !== null && shown < steps.length) endIntro.current?.();
    if (i === front || busy.current) return;
    const next = i === LAST ? null : i;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // sin movimiento: cambia al tiro (las transiciones están apagadas con motion-reduce)
      setChosen(next);
      return;
    }
    const behind = steps.map((_, k) => k).filter((k) => k !== front);
    const depth = behind.length - behind.indexOf(i);
    busy.current = true;
    setMoving({ i, y: -depth * OFFSET, z: 10 - depth });
    setChosen(next);
    setTimeout(() => {
      setMoving(null);
      setTimeout(() => (busy.current = false), 500);
    }, SHUFFLE_OUT);
  };

  // entrada: título con barrido, índice en cascada y el mazo subiendo
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

        // Escritorio: la sección queda fija (sticky dentro de `track`, sin `pin` de GSAP para no
        // generar layout shift) y cada tramo de scroll trae una carta desde abajo que se apila
        // sobre la anterior: 01 primero, 05 al final, al frente. Al subir se van en orden inverso.
        // GSAP anima `transform` de la envoltura, que se suma al `translate` del apilado sin pisarlo.
        gsap.utils.toArray<HTMLElement>("[data-vc-mcard]").forEach((card) => {
          gsap.from(card, {
            y: 40,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%", once: true },
          });
        });
      });
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
          tl.from(card, { y: 220, ease: "power2.out", duration: 1 }, k)
            // opaca casi al tiro: si se desvanecía todo el viaje, se veía la de atrás a través
            .from(card, { autoAlpha: 0, ease: "none", duration: 0.15 }, k);
        });
        tl.to({}, { duration: 0.3 }); // pausa con el mazo completo antes de soltar la sección

        /** Termina para siempre: el mazo se completa suave, se suelta el trigger y se quita el
         *  espaciador, para que al subir la sección pase normal (sin quedarse fija). */
        const ref: { st?: ScrollTrigger } = {};
        const finish = () => {
          if (played.current) return;
          played.current = true;
          ref.st?.kill();
          gsap.to(tl, { progress: 1, duration: 0.3, ease: "power1.out", overwrite: true });
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
        endIntro.current = finish;

        // mientras se arma, el mazo sigue al scroll en los dos sentidos: al bajar trae la siguiente
        // carta y al subir devuelve la anterior. Al terminar (onLeave) queda armado para siempre y
        // desde ahí se cambia de carta solo con el índice.
        let target = 0; // paso actual: cuántas cartas (además de la 01) ya subieron
        // si la página carga ya pasada la sección, onLeave corre dentro de create (antes de asignar)
        ref.st =ScrollTrigger.create({
          trigger: track.current,
          start: "top top", // la sección llega con la 01 puesta; la 02 sube al quedar fija
          end: "bottom bottom", // fin del recorrido reservado por el espaciador
          invalidateOnRefresh: true,
          // por pasos: el recorrido se divide en un tramo por carta y apenas se entra a un tramo
          // (un poquito de scroll) la carta sube completa sola, sin quedar a medio camino
          onUpdate: (self) => {
            const steps = cards.length - 1; // la 01 ya está puesta
            // un tramo por carta, también para la 01: así se alcanza a leer antes de que suba la 02
            // (antes la 02 subía apenas la sección quedaba fija)
            const step = gsap.utils.clamp(0, steps, Math.floor(self.progress * cards.length));
            if (step === target) return;
            target = step;
            // la carta k (desde la 02) termina de subir en el segundo k del timeline
            gsap.to(tl, { time: step, duration: 0.6, ease: "power3.out", overwrite: true });
          },
          // pasado el final se suelta para siempre (al subir ya no se repite)
          onLeave: (self) => {
            self.kill();
            finish();
          },
        });
        // un enlace a otra sección (menú) la termina antes: al quitar el espaciador cambia el alto
        window.addEventListener(SKIP_INTRO_EVENT, finish);
        return () => {
          endIntro.current = null;
          window.removeEventListener(SKIP_INTRO_EVENT, finish);
          if (!played.current) setShown(null);
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [near], revertOnUpdate: true },
  );

  return (
    // escritorio: la sección queda sticky mientras se recorre el espaciador de abajo (las cartas)
    <div ref={track} className="relative bg-white">
    <section
      ref={root}
      id="soluciones"
      // hoja que sube sobre el hero: esquinas redondeadas, sombra hacia arriba y por encima de él
      className="relative overflow-x-clip bg-white pb-28 pt-24 text-[#21255c] md:pb-40 md:pt-32 lg:sticky lg:top-0 lg:flex lg:min-h-svh lg:items-center lg:py-20"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-12">
        {/* índice */}
        <div>
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#248caa] xl:text-[12px]">
            <span data-vc-eline className="h-px w-6 bg-[#248caa] xl:w-8" />
            <span data-vc-elabel>Cadena de valor</span>
          </p>
          <h2 data-vc-title className="mt-5 font-display text-[36px] font-semibold leading-[1.05] tracking-tight md:text-[44px] xl:text-[52px]">
            Del sponsor al <span className="text-[#248caa]">cliente final.</span>
          </h2>
          <p data-vc-sub className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#21255c]/70 xl:text-[17px]">
            Acompañamos cada eslabón de la cadena: desde la idea del producto hasta la conversación con el cliente.
          </p>

          <ol data-vc-idx className="mt-10 hidden space-y-1 lg:block">
            {steps.map((s, i) => {
              const on = i === marked;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    aria-current={on}
                    className={`group flex w-full items-center cursor-pointer gap-4 rounded-xl px-3 py-3 text-left transition-colors duration-150 motion-reduce:transition-none ${
                      on ? "bg-[#dcebf3]/60" : "hover:bg-[#f5f6f8]"
                    }`}
                  >
                    <span className={`font-mono text-[12px] transition-opacity ${on ? "text-[#248caa]" : "text-[#21255c]/40"}`}>{pad(i)}</span>
                    <span
                      className={`h-px flex-none bg-current transition-all duration-200 motion-reduce:transition-none ${
                        on ? "w-10 text-[#248caa]" : "w-6 text-[#21255c]/25 group-hover:w-8"
                      }`}
                    />
                    <span
                      className={`flex-1 font-display text-[17px] font-semibold tracking-tight transition-opacity duration-150 xl:text-[19px] ${
                        on ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                      }`}
                    >
                      {s.title}
                    </span>
                    <span aria-hidden className={`transition-opacity duration-150 ${on ? "opacity-100" : "opacity-0"}`}>
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* mazo (solo escritorio): más angosto que su columna, con aire a los lados para que el
            viaje de la carta al barajar quede a la vista */}
        <div
          className="relative hidden w-full lg:mx-auto lg:block lg:max-w-[620px] xl:max-w-[700px]"
          style={{ height: CARD_H + OFFSET * (steps.length - 1) }}
        >
          {steps.map((s, i) => {
            const t = THEME[s.theme];
            const isFront = i === front;
            const out = moving?.i === i;
            // profundidad: 0 al frente; las demás en orden de lista, la más alta más atrás
            const behind = steps.map((_, k) => k).filter((k) => k !== front);
            const depth = isFront ? 0 : behind.length - behind.indexOf(i);
            // mientras el mazo se arma con el scroll, la que va llegando se ve con su color pleno
            // (sin velo) y solo se oscurecen las que ya quedaron debajo de ella
            const building = shown !== null && shown < steps.length;
            const dim = building ? Math.max(0, shown - 1 - i) : depth;
            return (
              // envoltura: la anima GSAP en la entrada (GSAP pasa el `translate`/`scale` de CSS del
              // elemento que anima a su propio transform y los deja en `none`: si animara la
              // tarjeta, el mazo perdería las posiciones). También lleva el z-index del apilado.
              <div
                key={s.title}
                data-vc-card
                className="pointer-events-none absolute inset-0"
                // al salir conserva su z; ya invisible pasa al frente (z alto)
                style={{ zIndex: out ? moving!.z : isFront ? 30 : 10 - depth }}
              >
              <article
                onClick={() => pick(i)}
                className={`pointer-events-auto absolute inset-x-0 bottom-0 overflow-hidden rounded-[28px] p-8 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none xl:p-10 ${t.card} ${
                  isFront ? "" : "cursor-pointer"
                }`}
                style={{
                  height: CARD_H,
                  // el frente abajo; las de atrás asoman su borde de ARRIBA (suben un paso por puesto)
                  // al barajar la carta sale visible hacia la derecha (sin desvanecerse), por debajo
                  // del mazo; afuera pasa al frente y vuelve deslizándose por encima de las demás
                  translate: out ? `62% ${moving!.y}px` : `0 ${-depth * OFFSET}px`,
                  transformOrigin: "50% 100%",
                }}
              >
                <div className="flex items-start justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl xl:h-14 xl:w-14 ${t.icon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 xl:h-7 xl:w-7">
                      {ICONS[s.icon]}
                    </svg>
                  </span>
                  <span className={`font-mono text-[12px] tracking-[0.2em] xl:text-[13px] ${t.muted}`}>
                    {pad(i)} / {pad(steps.length - 1)}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-[28px] font-semibold tracking-tight xl:text-[34px]">{s.title}</h3>
                <p className={`mt-3 max-w-[540px] text-[15px] leading-relaxed xl:text-[16px] ${t.muted}`}>{s.text}</p>

                <ul className="mt-5 space-y-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-[13px] font-medium xl:text-[14px]">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-current/15 text-[12px]">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.tags.map((tag) => (
                    <li key={tag} className={`rounded-full border px-3.5 py-1 text-[12px] font-medium xl:text-[13px] ${t.chip}`}>
                      {tag}
                    </li>
                  ))}
                </ul>

                {/* número fantasma: entra subiendo cuando la tarjeta llega al frente */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-7 font-display text-[170px] font-bold leading-none tracking-tighter transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  // solo en la del frente: en las de atrás ensuciaba las franjas que asoman
                  style={{ translate: isFront && !out ? "0 0" : "0 22px", opacity: isFront && !out ? 0.07 : 0 }}
                >
                  {pad(i)}
                </span>
                {/* velo de profundidad: oscurece según cuántas tiene delante */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[#0d1030] transition-opacity duration-500 motion-reduce:transition-none"
                  style={{ opacity: out ? 0 : dim * DEPTH_DIM }}
                />
              </article>
              </div>
            );
          })}
        </div>

        {/* celular/tablet: tarjetas en lista */}
        <div className="space-y-6 lg:hidden">
          {steps.map((s, i) => {
            const t = THEME[s.theme];
            return (
              <article key={s.title} data-vc-mcard className={`relative overflow-hidden rounded-3xl p-6 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] ${t.card}`}>
                <div className="flex items-start justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${t.icon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      {ICONS[s.icon]}
                    </svg>
                  </span>
                  <span className={`font-mono text-[11px] tracking-[0.2em] ${t.muted}`}>
                    {pad(i)} / {pad(steps.length - 1)}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[24px] font-semibold tracking-tight">{s.title}</h3>
                <p className={`mt-2 text-[14px] leading-relaxed ${t.muted}`}>{s.text}</p>
                <ul className="mt-4 space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-[13px] font-medium">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-current/15 text-[11px]">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.tags.map((tag) => (
                    <li key={tag} className={`rounded-full border px-3.5 py-1 text-[12px] font-medium ${t.chip}`}>
                      {tag}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>

      {/* se oscurece cuando la sección siguiente sube por encima (lo anima ServicesSection) */}
    </section>
    {/* recorrido de scroll de las cartas (solo escritorio): ~35vh por carta + pausa final */}
    <div ref={spacer} aria-hidden className="hidden h-[120vh] lg:block" />
    </div>
  );
}
