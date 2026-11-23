"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useNearViewport } from "@/hooks/useNearViewport";
import { ABOUT_COPY, ABOUT_CTA, TEAM_CARDS } from "@/data/about";
import Image from "next/image";
import imgOficinaHd from "@/public/oriont/oficina-sala-reunion-hd.webp";
import CircleBottom from "./parts/CircleBottom";
import ContactForm from "@/components/contact/ContactForm";
import ShakeTeamGrid from "./parts/ShakeTeamGrid";
import TeamCard from "./parts/TeamCard";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DESKTOP = "(min-width: 1024px)";

/** radios (en % del escenario) de la elipse donde van las tarjetas: así llenan cualquier pantalla */
const RADIUS_X = 41;
const RADIUS_Y = 38;
/** % de su propio tamaño que la tarjeta se corre hacia el centro al hacer hover */
const ZOOM_SHIFT = 35;

/** Orden de izquierda a derecha en la fila de abajo (según su posición en la elipse), para que no se crucen. */
const SLOT = (() => {
  const order = TEAM_CARDS.map((c, i) => ({ i, x: Math.cos((c.angle * Math.PI) / 180) }))
    .sort((a, b) => a.x - b.x)
    .map((o) => o.i);
  return TEAM_CARDS.map((_, i) => order.indexOf(i));
})();
const MID = (TEAM_CARDS.length - 1) / 2;

/** Composición final (llamado + fila de tarjetas + flecha), centrada en el alto visible. */
const HOLD = 0.5; // pausa inicial (en unidades del timeline) con el círculo completo a la vista
/** Scroll (en altos de pantalla) que dura la parte atada al scroll: círculo → fila → llamado. */
const SCRUB_VH = 1; // antes 1,9 (~17 giros de rueda hasta el llamado: demasiado)
// Después de abrirse el formulario la sección sigue fija 60vh más de scroll antes de que siga
// la página: va en el alto de `track` (140vh = SCRUB_VH − 0,2 + 0,6).
/** Velocidad de la apertura automática (1 = 1 s por unidad del timeline; dura ~1 s en total). */
const OPEN_SPEED = 1;
const CTA_TOP = 96; // px libres arriba (menú flotante)
const BOTTOM_PAD = 14; // px libres abajo
const GAP_CTA_ROW = 32; // px entre el llamado y la fila
const GAP_ROW_ARROW = 14; // px entre la fila y la flecha
const MIN_CTA_SCALE = 0.72; // el llamado se achica hasta aquí si no cabe (después se achican las tarjetas)
const ROW_SCALE = 0.6;
const MIN_ROW_SCALE = 0.5;
const FAN_DEG = 3; // inclinación entre tarjetas
const FAN_ARC = 3; // px que baja cada tarjeta (al cuadrado) hacia los extremos

/** Tarjeta que se agranda a pantalla completa: la del centro de la fila (con un número impar de tarjetas queda justo al medio). */
const EXPAND = SLOT.indexOf(Math.ceil(MID));
const EXPAND_SCALE = 1.15; // cuánto más grande queda en la fila (destacada)
const EXPAND_LIFT = 22; // px que sube sobre las demás

export default function AboutSection() {
  const track = useRef<HTMLDivElement>(null);
  const scope = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const expand = useRef<HTMLDivElement>(null);
  const expandImg = useRef<HTMLDivElement>(null);
  const ctaBox = useRef<HTMLDivElement>(null);
  const arrowBox = useRef<HTMLDivElement>(null);
  // las animaciones de esta sección se preparan recién a una pantalla de distancia (no al cargar):
  // GSAP lee y escribe estilos al crearlas y eso alargaba la tarea de hidratación
  const near = useNearViewport(track);

  // el fondo del formulario rota fotos solo mientras la pantalla completa está abierta
  const [slidesOn, setSlidesOn] = useState(false);

  // Fotos decodificadas por adelantado, en un momento libre, con la sección a una pantalla: si no,
  // la primera vez se decodificaban al aparecer (las tarjetas al salir del centro y la foto grande
  // al abrirse) y ese cuadro tardaba 60-80 ms. decode() espera a que la foto termine de bajar.
  useEffect(() => {
    if (!near) return;
    const run = () =>
      scope.current?.querySelectorAll("img").forEach((img) => {
        img.decode().catch(() => {});
      });
    const id = window.requestIdleCallback?.(run, { timeout: 1500 }) ?? window.setTimeout(run, 200);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, [near]);

  useGSAP(
    () => {
      if (!near) return;
      const mm = gsap.matchMedia();

      mm.add(DESKTOP, () => {
        const outers = gsap.utils.toArray<HTMLElement>("[data-orbit-card]");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // 1) entrada: las tarjetas salen desde el centro hacia su lugar (sobre el contenedor interno,
        //    para no pelear con el movimiento atado al scroll del contenedor externo)
        if (!reduce) {
          const pull = window.innerWidth * 0.15;
          gsap.from("[data-orbit-inner]", {
            x: (i) => -Math.cos((TEAM_CARDS[i].angle * Math.PI) / 180) * pull,
            y: (i) => -Math.sin((TEAM_CARDS[i].angle * Math.PI) / 180) * pull,
            scale: 0.6,
            autoAlpha: 0,
            duration: 1.5,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: scope.current, start: "top 65%", once: true },
          });
          gsap.from("[data-stage-text] > *", {
            y: 24,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: scope.current, start: "top 60%", once: true },
          });
        }

        // 2) al seguir bajando: la sección queda fija, las tarjetas se ordenan abajo y aparece el llamado
        // 3) y luego la tarjeta del centro se agranda a pantalla completa con el formulario encima
        const W = () => stage.current?.clientWidth ?? window.innerWidth;
        const H = () => stage.current?.clientHeight ?? window.innerHeight;
        // alto realmente visible: el escenario tiene min-h, así que en pantallas bajas sobresale del viewport
        const VH = () => Math.min(H(), window.innerHeight);

        // GSAP absorbe el translate(-50%) de Tailwind al animar: lo fijamos explícito para que "left/top" sea el centro
        // (x/y en 0: GSAP ya había convertido ese translate a px y quedaría doble)
        gsap.set(outers, { x: 0, y: 0, xPercent: -50, yPercent: -50 });

        // escala de la fila: baja de ROW_SCALE si la pantalla es baja (la ajusta layout)
        let rs = ROW_SCALE;
        const scaleOf = (i: number) => rs * (i === EXPAND ? EXPAND_SCALE : 1);

        const fanRot = (i: number) => (i === EXPAND ? 0 : (SLOT[i] - MID) * FAN_DEG);
        const liftOf = (i: number) => (i === EXPAND ? EXPAND_LIFT : 0);
        const baseY = (i: number) => (SLOT[i] - MID) ** 2 * FAN_ARC - liftOf(i);
        // medio alto que ocupa cada tarjeta ya escalada y girada (+ sombra)
        const extent = (i: number, el: HTMLElement) => {
          const s = scaleOf(i);
          const r = (Math.abs(fanRot(i)) * Math.PI) / 180;
          return ((el.offsetHeight * s) / 2) * Math.cos(r) + ((el.offsetWidth * s) / 2) * Math.sin(r) + 6;
        };

        // línea base de la fila (la calcula layout)
        let baseline = 0;

        // centro de cada tarjeta en la fila final (coordenadas del escenario)
        const rowX = (i: number, el: HTMLElement) => {
          const spacing = Math.min(W() * 0.1, el.offsetWidth * rs * 0.95);
          return W() / 2 + (SLOT[i] - MID) * spacing;
        };
        const rowY = (i: number) => baseline + baseY(i);

        // apila llamado + fila + flecha y lo centra en lo visible; si no cabe, achica el llamado
        // Caja de la foto a pantalla completa con la proporción de la foto destacada, cubriendo
        // la sección (object-cover "a mano"). Así, al escalarla hacia la tarjeta, la foto se ve
        // igual que en la tarjeta y no hay salto de encuadre al abrirse.
        const IMG_AR = TEAM_CARDS[EXPAND].src.width / TEAM_CARDS[EXPAND].src.height;
        let imgBox = { w: 0, h: 0 };
        const secSize = () => ({ w: scope.current?.clientWidth ?? W(), h: scope.current?.clientHeight ?? H() });

        const layout = () => {
          const box = ctaBox.current;
          const cta = box?.firstElementChild as HTMLElement | null;
          const arrow = arrowBox.current;
          if (!box || !cta || !arrow || !outers.length) return;
          // todas las lecturas de layout antes de cualquier gsap.set (si no, cada lectura
          // posterior a una escritura fuerza un reflow síncrono)
          const sec = secSize();
          const ctaH = cta.offsetHeight;
          const arrowH = arrow.offsetHeight;
          const vh = VH();
          const avail = vh - CTA_TOP - BOTTOM_PAD;
          // prioridad: texto grande. Primero se achica el texto hasta MIN_CTA_SCALE, luego las tarjetas
          let rowTop = 0, rowBot = 0, s = 1, fixed = 0;
          for (rs = ROW_SCALE; ; rs -= 0.02) {
            rowTop = Math.min(...outers.map((el, i) => baseY(i) - extent(i, el)));
            rowBot = Math.max(...outers.map((el, i) => baseY(i) + extent(i, el)));
            fixed = GAP_CTA_ROW + (rowBot - rowTop) + GAP_ROW_ARROW + arrowH;
            s = gsap.utils.clamp(MIN_CTA_SCALE, 1, (avail - fixed) / ctaH);
            if (ctaH * s + fixed <= avail || rs <= MIN_ROW_SCALE) break;
          }
          const start = CTA_TOP + Math.max(0, (avail - (ctaH * s + fixed)) / 2);
          const ctaBot = start + ctaH * s;
          baseline = ctaBot + GAP_CTA_ROW - rowTop;
          // posiciones con transform (no top/bottom): recolocarlos no cuenta como layout shift.
          // La caja mide ctaH y se escala desde su centro, así que se corre lo que encoge.
          gsap.set(box, { y: start - (ctaH * (1 - s)) / 2 });
          gsap.set(cta, { scale: s, transformOrigin: "50% 50%" });
          // la flecha nunca queda bajo el borde visible
          const arrowTop = Math.min(baseline + rowBot + GAP_ROW_ARROW, vh - arrowH - BOTTOM_PAD);
          gsap.set(arrow, { y: arrowTop });
          // capa invisible y absoluta: cambiarle el tamaño no mueve nada de la página
          const bw = Math.max(sec.w, sec.h * IMG_AR);
          imgBox = { w: bw, h: bw / IMG_AR };
          gsap.set(expandImg.current, { width: imgBox.w, height: imgBox.h, left: (sec.w - imgBox.w) / 2, top: (sec.h - imgBox.h) / 2 });
        };
        layout();
        ScrollTrigger.addEventListener("refreshInit", layout);

        // la foto de la tarjeta del centro ya en la fila: centro y tamaño en coordenadas de la sección
        // (la tarjeta queda derecha y la foto va centrada dentro del marco)
        const cardPhoto = () => {
          const el = outers[EXPAND];
          const photo = el?.querySelector<HTMLElement>("[data-card-photo]");
          if (!el || !photo || !stage.current) return null;
          const s = scaleOf(EXPAND);
          return {
            cx: stage.current.offsetLeft + rowX(EXPAND, el),
            cy: stage.current.offsetTop + rowY(EXPAND),
            w: photo.offsetWidth * s,
            h: photo.offsetHeight * s,
            s,
          };
        };
        // recorte inicial de la capa de pantalla completa = la foto de la tarjeta (sin el marco)
        const cardClip = () => {
          const p = cardPhoto();
          const sec = secSize();
          if (!p) return "inset(0px 0px 0px 0px round 0px)";
          const t = p.cy - p.h / 2;
          const l = p.cx - p.w / 2;
          const r = sec.w - (p.cx + p.w / 2);
          const b = sec.h - (p.cy + p.h / 2);
          return `inset(${t}px ${r}px ${b}px ${l}px round ${6 * p.s}px)`;
        };
        // la foto grande arranca encogida sobre la tarjeta, cubriendo su foto igual que object-cover
        const imgFrom = () => {
          const p = cardPhoto();
          const sec = secSize();
          if (!p || !imgBox.w) return { x: 0, y: 0, scale: 1 };
          return {
            x: p.cx - sec.w / 2,
            y: p.cy - sec.h / 2,
            scale: Math.max(p.w / imgBox.w, p.h / imgBox.h),
          };
        };

        // Sin `pin` de GSAP: pasar a position:fixed lo cuenta Chrome como un layout shift de
        // toda la sección (CLS ≈ 1). La fija `sticky` dentro de `track`, cuyo alto ya reserva
        // el recorrido; el timeline solo se ata al scroll de ese contenedor.
        // 2) va atado al scroll (scrub) hasta el llamado con la flecha. 3) la apertura con el
        // formulario NO: se dispara sola al seguir bajando apenas un poco (ver `open` más abajo).
        const tl = gsap
          .timeline({
            scrollTrigger: {
              trigger: track.current,
              // arranca antes de que la sección quede fija: al llegar ya se está moviendo
              start: "top 20%",
              // scroll que dura la parte 2 (en altos de pantalla). Si se cambia, ajustar el alto
              // de `track` (140vh)
              end: () => `+=${window.innerHeight * SCRUB_VH}`,
              scrub: 1, // suavidad respecto a la rueda: más alto = la animación alcanza al scroll con más inercia (más fluido)
              invalidateOnRefresh: true,
            },
          })
          .to({}, { duration: HOLD }, 0) // pausa: se ve el círculo completo antes de que se muevan
          .to("[data-stage-text]", { autoAlpha: 0, y: -60, scale: 0.94, duration: 0.35, ease: "power2.in" }, HOLD)
          .to(
            outers,
            {
              // "left/top" del contenedor marcan el centro de la tarjeta (el -50% va por CSS)
              x: (i, el: HTMLElement) => rowX(i, el) - el.offsetLeft,
              y: (i, el: HTMLElement) => rowY(i) - el.offsetTop,
              // anula la inclinación propia de la tarjeta y deja un abanico prolijo
              // la destacada queda derecha: así la imagen a pantalla completa nace justo desde ella
              rotation: (i) => fanRot(i) - TEAM_CARDS[i].rotate,
              scale: scaleOf,
              zIndex: (i) => (i === EXPAND ? 15 : 10),
              duration: 0.5, // duracion que dura las fotos en la fila 
              ease: "power2.inOut",
              stagger: 0.03,
            },
            HOLD,
          )
          // en la fila la del centro no se agranda con hover: de ella nace la imagen a pantalla completa,
          // que parte del tamaño normal de su foto (agrandada se veían las dos superpuestas)
          .set(outers[EXPAND], { pointerEvents: "none" }, HOLD)
          .to("[data-about-circle]", { scale: 1.12, opacity: 0.7, duration: 1, ease: "none" }, HOLD)
          .fromTo(
            "[data-stage-cta] > * > *",
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.08 },
            HOLD + 0.65,
          )
          .fromTo("[data-stage-arrow]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" }, HOLD + 1.1)
          // margen mínimo tras la flecha (~25 px de scroll): con el llamado completo, UN toque de
          // rueda (~100 px) ya pasa el punto de apertura. Más largo = hacen falta 2 toques.
          .to({}, { duration: 0.03 });

        // 3) la imagen del centro toma la pantalla y entra el formulario: animación con su propio
        //    tiempo (no atada al scroll). Se reproduce al pasar el final de la parte 2 y se
        //    devuelve al volver a subir.
        const open = gsap
          .timeline({
            paused: true,
            // pasada la apertura (label "expand" + 1), el fondo empieza a rotar fotos
            onUpdate: () => setSlidesOn(open.time() >= open.labels.expand + 1),
          })
          .addLabel("expand", 0)
          // Ocultan los CONTENEDORES del llamado y de la flecha, no los mismos elementos que anima
          // `tl`: si ambos timelines tocaban los mismos, al subir rápido el scrub dejaba el llamado
          // oculto y luego open.reverse() (más lento) lo volvía a mostrar encima de "Nuestro Equipo".
          .to("[data-stage-cta]", { autoAlpha: 0, y: -40, duration: 0.35, ease: "power2.in" }, "expand")
          // solo opacidad: su `y` lo pone layout
          .to(arrowBox.current, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, "expand")
          .set(expand.current, { autoAlpha: 1 }, "expand")
          // la capa la reemplaza: el marco se desvanece mientras la foto ya empieza a crecer
          .to(outers[EXPAND], { autoAlpha: 0, duration: 0.2, ease: "power1.out" }, "expand")
          .fromTo(
            expand.current,
            { clipPath: cardClip },
            // duracion de la foto central se posiciona
            { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 1, ease: "power3.inOut" },
            "expand",
          )
          // misma curva que el recorte: la foto crece junto con él y siempre lo cubre
          .fromTo(
            expandImg.current,
            { x: () => imgFrom().x, y: () => imgFrom().y, scale: () => imgFrom().scale },
            { x: 0, y: 0, scale: 1, duration: 1, ease: "power3.inOut" },
            "expand",
          )
          // el velo azul entra con fundido mientras se abre (antes aparecía de golpe)
          .fromTo("[data-expand-shade]", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.inOut" }, "expand+=0.2")
          .fromTo(
            "[data-expand-content] > *",
            { autoAlpha: 0, y: 50 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.1 },
            "expand+=0.15", // cuánto después de empezar a abrirse la foto aparece el formulario
          );
        open.timeScale(OPEN_SPEED);

        ScrollTrigger.create({
          trigger: track.current,
          // justo donde termina la parte 2 (se recalcula después de ella: se creó antes)
          start: () => tl.scrollTrigger?.end ?? 0,
          onEnter: () => {
            // el scrub (inercia de 1 s) puede venir atrasado: se completa para que no pelee con
            // la apertura por el llamado y la flecha
            tl.scrollTrigger?.getTween()?.progress(1);
            if (reduce) open.progress(1);
            else open.play();
          },
          onLeaveBack: () => (reduce ? open.progress(0) : open.reverse()),
        });

        return () => ScrollTrigger.removeEventListener("refreshInit", layout);
      });
    },
    { scope, dependencies: [near], revertOnUpdate: true },
  );

  return (
    // escritorio: alto de la sección + recorrido sticky = SCRUB_VH − 0,2 (arranca en "top 20%")
    // + 0,6 con el formulario abierto → 80vh + 60vh. Si se cambia SCRUB_VH, actualizar el 140vh.
    <div ref={track} id="nosotros" className="relative lg:h-[calc(max(100svh,560px)+140vh)]">
    <section
      ref={scope}
      className="relative flex w-full flex-col items-center overflow-hidden px-4 py-24 lg:sticky lg:top-0 lg:block lg:p-0"
    >
      {/* escenario a pantalla completa: círculo de fondo + tarjetas en una elipse */}
      <div ref={stage} className="relative mx-auto h-svh min-h-[560px] w-full max-w-[2200px] max-lg:hidden">
        <CircleBottom />

        {TEAM_CARDS.map((card, i) => {
          const rad = (card.angle * Math.PI) / 180;
          return (
            <div
              key={i}
              data-orbit-card
              // z-30! le gana al zIndex en línea que pone GSAP cuando las tarjetas forman la fila
              // group/card: este contenedor (tamaño normal) es el que recibe el hover, no la tarjeta agrandada
              className="group/card absolute z-10 w-[clamp(130px,min(13vw,23svh),310px)] -translate-x-1/2 -translate-y-1/2 hover:z-30!"
              style={{
                // redondeado: servidor y navegador dan decimales distintos y React avisa de un desajuste
                left: `${(50 + Math.cos(rad) * RADIUS_X).toFixed(3)}%`,
                top: `${(50 + Math.sin(rad) * RADIUS_Y).toFixed(3)}%`,
              }}
            >
              <div data-orbit-inner>
                {/* al hacer hover crece hacia el centro (origen en su lado exterior) y además se corre
                    hacia el centro de la pantalla, para que el borde no la tape */}
                <TeamCard
                  card={card}
                  zoomOrigin={`${(50 + Math.cos(rad) * 50).toFixed(1)}% ${(50 + Math.sin(rad) * 50).toFixed(1)}%`}
                  zoomShift={[-Math.cos(rad) * ZOOM_SHIFT, -Math.sin(rad) * ZOOM_SHIFT]}
                />
              </div>
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div data-stage-text className="pointer-events-auto">
            <AboutText />
          </div>
        </div>

        {/* llamado final: oculto hasta que las tarjetas bajan */}
        <div
          ref={ctaBox}
          className="pointer-events-none absolute inset-x-0 top-0 grid place-items-center px-8"
        >
          <div data-stage-cta className="pointer-events-auto">
            <CtaText hidden />
          </div>
        </div>

        {/* flecha para seguir bajando: aparece con el llamado y se va al abrirse la imagen */}
        {/* la franja es de ancho completo: sin pointer-events-none tapaba el hover/clic de las tarjetas */}
        <div ref={arrowBox} className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
          <button
            type="button"
            data-stage-arrow
            aria-label="Seguir bajando"
            onClick={() => window.scrollBy({ top: window.innerHeight * 1.2, behavior: "smooth" })}
            // se nota por el color (celeste de la marca) y no por el tamaño: mismo diseño del
            // original, con círculo blanco y sombra leve; al pasar el mouse, azul oscuro
            className="group pointer-events-auto invisible flex cursor-pointer flex-col items-center gap-5 text-accent opacity-0 transition-colors hover:text-navy"
          >
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] 2xl:text-[12px]">Scroll</span>

            <span className="grid h-12 w-12 animate-bounce place-items-center rounded-full border-[1.5px] border-current bg-white shadow-[0_8px_20px_-10px_rgba(33,37,92,0.35)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 5v14" />
                <path d="m6 13 6 6 6-6" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* capa de pantalla completa: la imagen del centro se abre y muestra el formulario (solo escritorio) */}
      <div ref={expand} className="invisible absolute inset-0 z-30 overflow-hidden max-lg:hidden">
        {/* tamaño y posición los pone layout (proporción de la foto destacada, cubriendo la sección) */}
        <div ref={expandImg} className="absolute inset-0">
          <ExpandSlides playing={slidesOn} />
        </div>
        {/* Velo y contenido parten ocultos por CSS (como CtaText): si solo los ocultaba GSAP, al
            recalcular ScrollTrigger (invalidateOnRefresh, resize, carga de fuentes) revertía los
            estilos y el formulario quedaba visible antes de tiempo, y luego "aparecía" otra vez. */}
        <div data-expand-shade className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/45 opacity-0" />
        <div
          data-expand-content
          className="container-page relative grid h-full grid-cols-[1.05fr_1fr] items-center gap-12 pb-8 pt-28 short:pb-4 short:pt-24 xl:gap-20 2xl:gap-28 [&>*]:invisible [&>*]:opacity-0"
        >
          <ContactIntro />
          <ContactForm className="max-w-[640px] justify-self-end 2xl:max-w-[760px]" />
        </div>
      </div>

      {/* móvil / tablet: texto + grilla de tarjetas + llamado + formulario */}
      <div className="flex w-full max-w-[640px] flex-col items-center lg:hidden">
        <AboutText />
        {/* agitar el celular revuelve las fotos */}
        <ShakeTeamGrid />
        <div className="mt-20">
          <CtaText />
        </div>
        <ContactForm className="mt-14 border border-navy/10" />
      </div>
    </section>
    {/* ancla de "Contacto": la última pantalla del recorrido, donde ya está el formulario */}
    <span id="contacto" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-svh" />
    </div>
  );
}

/** Fotos del fondo a pantalla completa: parte con la destacada (la que se abrió) y sigue con el resto. */
// la destacada usa una versión agrandada a 2560 px con nitidez (la original mide 1566 px y a
// pantalla completa se estiraba); misma proporción, así el cálculo de IMG_AR sigue valiendo
const SLIDES = [{ ...TEAM_CARDS[EXPAND], src: imgOficinaHd }, ...TEAM_CARDS.filter((_, i) => i !== EXPAND)];
const SLIDE_MS = 4500;

/**
 * Fondo que rota fotos con fundido (solo opacity: sin layout shift). Monta únicamente la foto
 * anterior (debajo), la actual y la siguiente (invisible, para que ya esté cargada al entrar).
 * Al dejar de reproducir vuelve a la destacada, que coincide con la tarjeta de la que nace.
 */
function ExpandSlides({ playing }: { playing: boolean }) {
  const [{ cur, prev }, setState] = useState({ cur: 0, prev: -1 });
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!playing || reduce) {
      // vuelve a la destacada (con fundido) al cerrarse la pantalla completa
      const id = setTimeout(() => setState((s) => (s.cur === 0 ? s : { cur: 0, prev: s.cur })));
      return () => clearTimeout(id);
    }
    // el intervalo solo corre con la capa en pantalla y la pestaña visible
    let id = 0;
    let inView = false;
    const sync = () => {
      const run = inView && !document.hidden;
      if (run && !id) id = window.setInterval(() => setState((s) => ({ cur: (s.cur + 1) % SLIDES.length, prev: s.cur })), SLIDE_MS);
      if (!run && id) {
        clearInterval(id);
        id = 0;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      sync();
    });
    if (host.current) io.observe(host.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      clearInterval(id);
    };
  }, [playing]);

  const next = (cur + 1) % SLIDES.length;
  return (
    <div ref={host} className="absolute inset-0">
      {SLIDES.map((s, i) => {
    const role = i === cur ? 2 : i === prev ? 1 : i === next && playing ? 0 : -1;
    if (role < 0) return null;
    return (
      <Image
        key={s.src.src}
        src={s.src}
        alt=""
        fill
        sizes="100vw"
        // la primera (la foto que se abre a pantalla completa) con más calidad que el 75 por defecto
        quality={i === 0 ? 100 : undefined}
        className="object-cover transition-opacity duration-[1200ms] ease-out"
        style={{ zIndex: role, opacity: role === 0 ? 0 : 1, objectPosition: s.position }}
      />
    );
      })}
    </div>
  );
}

function AboutText() {
  return (
    <div className="relative flex max-w-[420px] flex-col items-center text-center 2xl:max-w-[560px]">
      <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-accent-ink xl:text-[12px] 2xl:text-[14px]">
        <span className="h-px w-8 bg-accent/50 xl:w-12" />
        {ABOUT_COPY.eyebrow}
        <span className="h-px w-8 bg-accent/50 xl:w-12" />
      </p>
      <h2 className="mt-5 font-display text-[52px] font-semibold leading-[0.95] tracking-tight sm:text-[64px] xl:text-[96px] 2xl:text-[clamp(110px,6.5vw,150px)]">
        {ABOUT_COPY.title}
        <br />
        <span className="text-accent">{ABOUT_COPY.highlight}</span>
      </h2>
      <p className="mt-6 max-w-[340px] text-[15px] leading-relaxed text-navy/65 xl:text-[17px] 2xl:max-w-[440px] 2xl:text-[20px]">
        {ABOUT_COPY.text}
      </p>
    </div>
  );
}

/** hidden: en escritorio parte invisible y GSAP lo muestra al hacer scroll. */
function CtaText({ hidden = false }: { hidden?: boolean }) {
  const start = hidden ? "invisible opacity-0" : "";
  return (
    <div className="flex max-w-[860px] flex-col items-center text-center 2xl:max-w-[1100px]">
      <h3
        className={`font-display text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[44px] xl:text-[52px] 2xl:text-[clamp(52px,3.3vw,76px)] ${start}`}
      >
        {ABOUT_CTA.title} <span className="text-accent">{ABOUT_CTA.highlight}</span>
      </h3>
      <p
        className={`mt-5 max-w-[520px] text-[15px] leading-relaxed text-navy/65 xl:text-[17px] 2xl:max-w-[640px] 2xl:text-[20px] ${start}`}
      >
        {ABOUT_CTA.text}
      </p>

      {/* datos de contacto */}
      <ul
        className={`mt-8 flex flex-col items-center gap-4 border-t border-navy/10 pt-6 sm:flex-row sm:items-start sm:gap-10 xl:mt-9 ${start}`}
      >
        {ABOUT_CTA.contact.map((c) => (
          <li key={c.label} className="flex items-center  gap-3 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center  rounded-full bg-accent/10 text-accent 2xl:h-12 2xl:w-12">
              <ContactIcon name={c.icon} />
            </span>
            <span>
              <span className="block items-center justify-center text-center font-mono text-[10px] uppercase tracking-[0.2em] text-navy/70 2xl:text-[11px]">
                {c.label}  
              </span>
              {c.href ? (
                <a href={c.href} className="text-[14px] font-medium text-navy hover:text-accent 2xl:text-[16px]">
                  {c.value}
                </a>
              ) : (
                <span className="text-[14px] font-medium text-navy 2xl:text-[16px]">{c.value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactIcon({ name }: { name: "pin" | "mail" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  return name === "pin" ? (
    <svg {...common}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ) : (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

/** Texto a la izquierda del formulario, sobre la imagen. */
function ContactIntro() {
  return (
    <div className="text-white">
      <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#7fd0e6] xl:text-[12px] 2xl:text-[14px]">
        <span className="h-px w-8 bg-[#7fd0e6]/60 xl:w-12" />
        {ABOUT_CTA.eyebrow}
      </p>
      <h3 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] tracking-tight xl:text-[56px] 2xl:text-[clamp(60px,4.2vw,92px)] short:mt-3 xl:short:text-[48px] 2xl:short:text-[52px]">
        {ABOUT_CTA.title} <span className="text-[#7fd0e6]">{ABOUT_CTA.highlight}</span>
      </h3>
      <p className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-white/75 xl:text-[18px] 2xl:max-w-[620px] 2xl:text-[21px] short:mt-4 xl:short:text-[17px] 2xl:short:text-[18px]">
        {ABOUT_CTA.text}
      </p>
      <ul className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-8 short:mt-6 short:gap-3 short:pt-5">
        {ABOUT_CTA.contact.map((c) => (
          <li key={c.label} className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-[#7fd0e6] 2xl:h-12 2xl:w-12">
              <ContactIcon name={c.icon} />
            </span>
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 2xl:text-[11px]">
                {c.label}
              </span>
              {c.href ? (
                <a href={c.href} className="text-[15px] font-medium hover:text-[#7fd0e6] 2xl:text-[17px]">
                  {c.value}
                </a>
              ) : (
                <span className="text-[15px] font-medium 2xl:text-[17px] ">{c.value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
