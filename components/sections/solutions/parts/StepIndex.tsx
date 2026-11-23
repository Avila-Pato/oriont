import { steps } from "@/data/solutions";
import { pad } from "./constants";

/** Índice de etapas (solo escritorio): marca `marked` y elige una carta al hacer click. */
export default function StepIndex({ marked, onPick }: { marked: number; onPick: (i: number) => void }) {
  return (
    <ol data-vc-idx className="mt-10 hidden space-y-1 lg:block short:mt-5 2xl:tall:mt-12">
      {steps.map((s, i) => {
        const on = i === marked;
        return (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-current={on}
              className={`group flex w-full items-center cursor-pointer gap-4 rounded-xl px-3 py-3 text-left short:py-2.5 2xl:tall:py-3.5 transition-colors duration-150 motion-reduce:transition-none ${
                on ? "bg-ice/60" : "hover:bg-[#f5f6f8]"
              }`}
            >
              <span className={`font-mono text-[12px] 2xl:tall:text-[13px] transition-opacity ${on ? "text-accent-ink" : "text-navy/70"}`}>{pad(i)}</span>
              {/* la rayita crece con scale (no con width: animar el ancho recalculaba el layout
                  de la fila en cada frame y corría el texto de al lado). El color no se anima
                  (repinta en cada cuadro): son dos líneas, gris debajo y celeste encima, y solo
                  cambia la opacidad de la celeste. Así todo va en el compositor */}
              <span
                className={`relative h-px w-10 flex-none origin-left transition-[scale] duration-200 motion-reduce:transition-none ${
                  on ? "scale-x-100" : "scale-x-60 group-hover:scale-x-80"
                }`}
              >
                <span className="absolute inset-0 bg-navy/25" />
                <span
                  className={`absolute inset-0 bg-accent transition-opacity duration-200 motion-reduce:transition-none ${
                    on ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
              <span
                className={`flex-1 font-display text-[17px] font-semibold tracking-tight transition-opacity duration-150 xl:text-[19px] xl:short:text-[18px] 2xl:tall:text-[22px] ${
                  on ? "opacity-100" : "opacity-70 group-hover:opacity-100"
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
  );
}
