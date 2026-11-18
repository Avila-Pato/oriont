import { steps } from "@/data/solutions";
import { pad } from "./constants";

/** Índice de etapas (solo escritorio): marca `marked` y elige una carta al hacer click. */
export default function StepIndex({ marked, onPick }: { marked: number; onPick: (i: number) => void }) {
  return (
    <ol data-vc-idx className="mt-10 hidden space-y-1 lg:block">
      {steps.map((s, i) => {
        const on = i === marked;
        return (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-current={on}
              className={`group flex w-full items-center cursor-pointer gap-4 rounded-xl px-3 py-3 text-left transition-colors duration-150 motion-reduce:transition-none ${
                on ? "bg-[#dcebf3]/60" : "hover:bg-[#f5f6f8]"
              }`}
            >
              <span className={`font-mono text-[12px] transition-opacity ${on ? "text-[#248caa]" : "text-[#21255c]/40"}`}>{pad(i)}</span>
              {/* la rayita crece con scale (no con width: animar el ancho recalculaba el layout
                  de la fila en cada frame y corría el texto de al lado) */}
              <span
                className={`h-px w-10 flex-none origin-left bg-current transition-[scale,color] duration-200 motion-reduce:transition-none ${
                  on ? "scale-x-100 text-[#248caa]" : "scale-x-60 text-[#21255c]/25 group-hover:scale-x-80"
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
  );
}
