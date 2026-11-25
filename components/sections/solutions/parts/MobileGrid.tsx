import { steps } from "@/data/solutions";
import { THEME } from "./themes";
import { CheckGlyph, StepGlyph } from "./icons";
import { pad } from "./constants";

/** Celular/tablet: grilla de 2 columnas; la 01 (sponsor, inicio de la cadena) va a lo ancho.
 *  En celular las tarjetas son compactas (sin puntos ni etiquetas). */
export default function MobileGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:hidden">
      {steps.map((s, i) => {
        const t = THEME[s.theme];
        const wide = i === 0;
        return (
          <article
            key={s.title}
            data-vc-mcard
            className={`relative flex flex-col overflow-hidden rounded-2xl p-4 shadow-[0_20px_40px_-24px_rgba(33,37,92,0.45)] sm:rounded-3xl sm:p-6 ${
              wide ? "col-span-2" : ""
            } ${t.card}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`grid h-10 w-10 place-items-center rounded-xl sm:h-12 sm:w-12 ${t.icon}`}>
                <StepGlyph icon={s.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className={`font-mono text-[10px] tracking-[0.2em] sm:text-[11px] ${t.muted}`}>
                {pad(i)}
                <span className={wide ? "" : "hidden sm:inline"}> / {pad(steps.length - 1)}</span>
              </span>
            </div>
            <h3 className={`mt-3 font-display font-semibold leading-tight tracking-tight sm:mt-4 sm:text-[24px] ${wide ? "text-[22px]" : "text-[16px]"}`}>
              {s.title}
            </h3>
            <p className={`mt-1.5 leading-relaxed sm:mt-2 sm:text-[14px] ${wide ? "text-[13.5px]" : "text-[12.5px]"} ${t.muted}`}>{s.text}</p>
            <ul className="mt-4 hidden space-y-2 sm:block">
              {s.points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-[13px] font-medium">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-current/15">
                    <CheckGlyph className="size-[11px]" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <ul className="mt-4 hidden flex-wrap gap-2 sm:flex">
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
  );
}
