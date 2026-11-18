import type { Metadata } from "next";
import Link from "next/link";
import OriontLogo from "@/components/ui/OriontLogo";

// sin canónica ni "index" (si no, heredaba los del inicio desde el layout y chocaban con el
// noindex que Next agrega a los 404)
export const metadata: Metadata = {
  title: "Página no encontrada",
  alternates: { canonical: null },
  robots: { index: false, follow: true },
};



export default function NotFound() {
  return (
    <main className="container-page flex min-h-dvh  items-center flex-col py-6 text-[#21255c] md:py-8">
      <Link href="/" aria-label="Oriont, ir al inicio" className="self-start">
        <OriontLogo className="h-8 w-auto md:h-9" eager />
      </Link>

      <div className="flex flex-1 items-center py-16">
        <div className="grid w-full items-end gap-10 lg:grid-cols-[auto_minmax(0,520px)] lg:gap-20">
          {/* número grande: solo tipografía, ancla visual de la página */}
          <p
            aria-hidden="true"
            className="font-display text-[120px] font-semibold leading-[0.8] tracking-tighter text-[#21255c]/10 sm:text-[180px] lg:text-[260px] 2xl:text-[320px]"
          >
            404
          </p>

          <div>
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#248caa] xl:text-[12px]">
              <span className="h-px w-6 bg-[#248caa] xl:w-8" />
              Error 404
            </p>
            <h1 className="mt-5 font-display text-[30px] font-semibold leading-[1.08] tracking-tight sm:text-[38px] xl:text-[44px]">
              Esta página <span className="text-[#248caa]">no existe</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-[#21255c]/70 xl:text-[17px]">
              Puede que el enlace esté mal escrito o que la página se haya movido. Vuelve al inicio o
              entra directo a alguna sección.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/"
                // hover: capa ::before con el azul claro que solo cambia opacity (igual que el hero)
                className="group relative isolate inline-flex items-center gap-2 rounded-full bg-[#248caa] py-2 pl-5 pr-2 text-[13px] font-medium text-[#f5f0e6] before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-[#2c3175] before:opacity-0 before:transition-opacity hover:before:opacity-100 xl:py-2.5 xl:pl-6 xl:text-[15px]"
              >
                Volver al inicio
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f5f0e6]/15 transition-transform group-hover:translate-x-0.5 xl:h-8 xl:w-8">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
