import { steps, type Step } from "@/data/solutions";
import { THEME } from "./themes";
import { StepGlyph } from "./icons";
import { CARD_H, DEPTH_DIM, OFFSET, depthOf, pad, type Moving } from "./constants";

type DeckProps = {
  /** carta al frente */
  front: number;
  /** carta saliendo al barajar (null si no) */
  moving: Moving | null;
  /** cartas que ya entraron con el scroll (null = sin animación de entrada: todas a la vista) */
  shown: number | null;
  onPick: (i: number) => void;
};

/** Mazo (solo escritorio): las etapas apiladas, con los bordes de las de atrás asomando arriba.
 *  Más angosto que su columna, con aire a los lados para que el viaje de la carta al barajar
 *  quede a la vista. */
export default function Deck({ front, moving, shown, onPick }: DeckProps) {
  // mientras el mazo se arma con el scroll, la que va llegando se ve con su color pleno
  // (sin velo) y solo se oscurecen las que ya quedaron debajo de ella
  const building = shown !== null && shown < steps.length;
  return (
    <div
      // pantallas bajas: el mazo se achica con `scale` (sin reflow) y el margen negativo devuelve
      // el alto que deja libre (575px × 0.08 ≈ 46px → 23px arriba y abajo). Pantallas anchas y altas:
      // se agranda igual (×1.15 → 86px más → 43px arriba y abajo)
      className="relative hidden w-full lg:mx-auto lg:block lg:max-w-[620px] xl:max-w-[700px] lg:short:-my-[23px] lg:short:scale-92 2xl:tall:my-[43px] 2xl:tall:scale-115"
      style={{ height: CARD_H + OFFSET * (steps.length - 1) }}
    >
      {steps.map((s, i) => {
        const depth = depthOf(i, front);
        return (
          <DeckCard
            key={s.title}
            step={s}
            i={i}
            isFront={i === front}
            depth={depth}
            out={moving?.i === i ? moving : null}
            dim={building ? Math.max(0, shown - 1 - i) : depth}
            onPick={onPick}
          />
        );
      })}
    </div>
  );
}

type DeckCardProps = {
  step: Step;
  i: number;
  isFront: boolean;
  /** 0 al frente; más alto, más atrás */
  depth: number;
  /** puesto que tenía si está saliendo al barajar */
  out: Moving | null;
  /** cuántos pasos de velo oscuro lleva */
  dim: number;
  onPick: (i: number) => void;
};

function DeckCard({ step: s, i, isFront, depth, out, dim, onPick }: DeckCardProps) {
  const t = THEME[s.theme];
  return (
    // envoltura: la anima GSAP en la entrada (GSAP pasa el `translate`/`scale` de CSS del
    // elemento que anima a su propio transform y los deja en `none`: si animara la
    // tarjeta, el mazo perdería las posiciones). También lleva el z-index del apilado.
    <div
      data-vc-card
      className="pointer-events-none absolute inset-0"
      // al salir conserva su z; ya invisible pasa al frente (z alto)
      style={{ zIndex: out ? out.z : isFront ? 30 : 10 - depth }}
    >
      <article
        onClick={() => onPick(i)}
        className={`pointer-events-auto absolute inset-x-0 bottom-0 overflow-hidden rounded-[28px] p-8 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.45)] transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none xl:p-10 ${t.card} ${
          isFront ? "" : "cursor-pointer"
        }`}
        style={{
          height: CARD_H,
          // el frente abajo; las de atrás asoman su borde de ARRIBA (suben un paso por puesto)
          // al barajar la carta sale visible hacia la derecha (sin desvanecerse), por debajo
          // del mazo; afuera pasa al frente y vuelve deslizándose por encima de las demás
          translate: out ? `62% ${out.y}px` : `0 ${-depth * OFFSET}px`,
          transformOrigin: "50% 100%",
        }}
      >
        <div className="flex items-start justify-between">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl xl:h-14 xl:w-14 ${t.icon}`}>
            <StepGlyph icon={s.icon} className="h-6 w-6 xl:h-7 xl:w-7" />
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

        {/* grilla abajo: líneas finas del color del texto de la carta (currentColor), que se
            desvanecen hacia arriba para no tocar el contenido. Solo fondo: no ocupa espacio */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            backgroundPosition: "0 100%",
            maskImage: "linear-gradient(to top, black 10%, transparent)",
          }}
        />
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
}
