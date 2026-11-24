"use client";

import { useRef, useState } from "react";
import { useNearViewport } from "@/hooks/useNearViewport";
import { steps } from "@/data/solutions";
import { LAST, OFFSET, SHUFFLE_OUT, depthOf, type Moving } from "./parts/constants";
import { useDeckIntro } from "./parts/useDeckIntro";
import StepIndex from "./parts/StepIndex";
import Deck from "./parts/Deck";
import MobileGrid from "./parts/MobileGrid";

/* ---------- sección "Soluciones" (cadena de valor): mazo de tarjetas con índice ----------
 * Escritorio: índice a la izquierda y las etapas apiladas a la derecha (los bordes de las de
 * atrás asoman arriba). Al elegir del índice (o tocar una de atrás), la tarjeta sale hacia la
 * derecha, el mazo se reacomoda y vuelve por encima, al frente. Reacomodo con transiciones CSS
 * de translate/scale/opacity (sin reflow). La entrada con el scroll está en useDeckIntro.
 * Celular/tablet: tarjetas en grilla de 2 columnas (la 01 a lo ancho).
 */

export default function SolutionsSection() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  // las animaciones se preparan recién a una pantalla de distancia (no al cargar)
  const near = useNearViewport(root);
  const { shown, endIntro } = useDeckIntro({ root, track, spacer }, near);

  // El mazo sigue SIEMPRE el orden de la lista: la elegida va al frente y las demás quedan
  // detrás en orden por número, compactadas (sin huecos), así se leen todos los bordes de arriba
  // (con 04 al frente: 01, 02, 03, 05). Sin elegir, 05 está al frente.
  const [chosen, setChosen] = useState<number | null>(null);
  const [moving, setMoving] = useState<Moving | null>(null);
  const busy = useRef(false);
  const front = chosen ?? LAST;
  // en el índice se marca la última que llegó mientras el mazo se arma; después, la del frente
  const marked = shown !== null && shown < steps.length ? shown - 1 : front;

  /** cambio limpio: la elegida se desvanece hacia la derecha mientras el mazo se reacomoda; ya
   *  invisible pasa adelante y entra desde la derecha. Nunca cruza visible por encima de otra. */
  const pick = (i: number) => {
    // elegir una carta deja el mazo fijo: se completa y se suelta de la rueda (si no, el índice
    // seguía marcando la última que llegó, y al subir la rueda recogía el mazo con la elegida)
    if (shown !== null) endIntro();
    if (i === front || busy.current) return;
    const next = i === LAST ? null : i;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // sin movimiento: cambia al tiro (las transiciones están apagadas con motion-reduce)
      setChosen(next);
      return;
    }
    const depth = depthOf(i, front);
    busy.current = true;
    setMoving({ i, y: -depth * OFFSET, z: 10 - depth });
    setChosen(next);
    setTimeout(() => {
      setMoving(null);
      setTimeout(() => (busy.current = false), 500);
    }, SHUFFLE_OUT);
  };

  return (
    // escritorio: la sección queda sticky mientras se recorre el espaciador de abajo (las cartas)
    <div ref={track} className="relative bg-white">
      <section
        ref={root}
        id="soluciones"
        className="relative overflow-x-clip bg-white pb-28 pt-24 text-navy md:pb-40 md:pt-32 lg:sticky lg:top-0 lg:flex lg:min-h-svh lg:items-center lg:py-20 lg:short:pb-6 lg:short:pt-24"
      >
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-12">
          <div>
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-accent-ink xl:text-[12px]">
              <span data-vc-eline className="h-px w-6 bg-accent xl:w-8" />
              <span data-vc-elabel>Cadena de valor</span>
            </p>
            <h2 data-vc-title className="mt-5 font-display text-[36px] font-semibold leading-[1.05] tracking-tight md:text-[44px] xl:text-[52px] lg:short:mt-3 xl:short:text-[48px] 2xl:tall:text-[64px]">
              Del sponsor al <span className="text-accent">cliente final.</span>
            </h2>
            <p data-vc-sub className="mt-5 max-w-[420px] 2xl:tall:max-w-[500px] text-[15px] leading-relaxed text-navy/70 xl:text-[17px] lg:short:mt-3 xl:short:text-[16px] 2xl:tall:mt-6 2xl:tall:text-[19px]">
              Acompañamos cada eslabón de la cadena: desde la idea del producto hasta la conversación con el cliente.
            </p>
            <StepIndex marked={marked} onPick={pick} />
          </div>

          <Deck front={front} moving={moving} shown={shown} onPick={pick} />
          <MobileGrid />
        </div>
      </section>
      {/* recorrido de scroll de las cartas (solo escritorio): 400 px = 100 px por carta (de la 02 a la
          05), un giro de rueda por carta; las cartas van atadas a este scroll. Oculto de entrada: lo muestra
          useDeckIntro solo si se llega a la sección desde arriba */}
      <div ref={spacer} aria-hidden className="hidden h-[600px]" />
    </div>
  );
}
