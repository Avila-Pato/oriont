import { HERO_COPY } from "@/data/hero";
import HeroGallery from "./parts/HeroGallery";
import HeroGlobe from "./parts/HeroGlobe";
import HeroBlurGate from "./parts/HeroBlurGate";

export default function HeroSection() {
  return (
    // --cw: ancho de la tarjeta de texto por breakpoint (lo usan la tarjeta y el cálculo del globo)
    <section className="relative flex min-h-[100svh] w-full flex-col items-center px-4 pb-12 pt-16 sm:px-8 sm:pt-24 lg:block lg:p-0 lg:[--cw:360px] xl:[--cw:380px] 2xl:[--cw:410px]">
      {/* apaga el desenfoque del panel cuando la sección ya va saliendo (ver HeroBlurGate) */}
      <HeroBlurGate />
      <div className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1680px] lg:block">
        <HeroGallery />
      </div>

      {/* globo centrado. Para no chocar con la tarjeta de texto, su tamaño se limita al espacio libre
          entre la tarjeta y el centro. La esfera ocupa el 84 % de la caja (radio 0.42, ver HeroGlobe),
          así que la caja puede medir libre / 0.42; las órbitas finas sí pasan por detrás de la tarjeta:
            libre = 50vw − borde izq. tarjeta (max(2.5vw, 50vw − 800px)) − ancho tarjeta (--cw) − 24px
          con un mínimo de 380px para que no quede diminuto. --cw se define en la <section>. */}
      <HeroGlobe className="relative z-20 aspect-square w-[min(84vw,46svh,560px)] lg:absolute lg:left-1/2 lg:top-[48%] lg:w-(--gw) lg:-translate-x-1/2 lg:-translate-y-1/2 lg:[--gw:max(380px,min(48vw,78vh,720px,calc((50vw_-_max(2.5vw,50vw_-_800px)_-_var(--cw)_-_24px)/0.42)))] xl:[--gw:max(380px,min(48vw,84vh,760px,calc((50vw_-_max(2.5vw,50vw_-_800px)_-_var(--cw)_-_24px)/0.42)))] 2xl:[--gw:max(380px,min(50vw,84vh,900px,calc((50vw_-_max(2.5vw,50vw_-_800px)_-_var(--cw)_-_24px)/0.42)))]" />

      {/* texto */}
      <div className="relative z-20 mt-10 w-full max-w-[520px] lg:absolute lg:left-[max(2.5%,calc(50%-800px))] lg:top-1/2 lg:mt-0 lg:w-auto lg:max-w-none lg:-translate-y-1/2">
        <div className="rounded-3xl border border-white bg-white/75 p-6 ring-1
         ring-navy/[0.06] sm:p-7 lg:w-(--cw)
        xl:p-7 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.35)] backdrop-blur-md in-data-noblur:backdrop-blur-none lg:p-8">

          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-accent-ink xl:text-[12px]">
            <span className="h-px w-6 bg-accent xl:w-8" />
            {HERO_COPY.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-[30px] font-semibold leading-[1.08] tracking-tight sm:text-[38px] lg:text-[42px] xl:text-[40px] 2xl:text-[50px]">
            {HERO_COPY.title}{" "}
            <span className="text-accent">{HERO_COPY.highlight}</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-navy/70 xl:mt-6 xl:text-[17px]">
            {HERO_COPY.text}
          </p>
          <div className="mt-7 flex items-center gap-5 xl:mt-9">
            <a
              href={HERO_COPY.primary.href}
              // hover: capa ::before con el azul claro que solo cambia opacity (no background-color)
              className="group relative isolate inline-flex items-center gap-2 rounded-full bg-navy py-2 pl-5 pr-2 text-[13px] font-medium text-cream before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-[#2c3175] before:opacity-0 before:transition-opacity hover:before:opacity-100 xl:py-2.5 xl:pl-6 xl:text-[15px]"
            >
              {HERO_COPY.primary.label}
              <span className="grid h-7 w-7 place-items-center rounded-full bg-cream/15 transition-transform group-hover:translate-x-0.5 xl:h-8 xl:w-8">
                →
              </span>
            </a>
            <a
              href={HERO_COPY.secondary.href}
              className="text-[13px] font-medium text-navy opacity-70 underline-offset-4 transition-opacity hover:underline hover:opacity-100 xl:text-[15px]"
            >
              {HERO_COPY.secondary.label}
            </a>
          </div>
        </div>
      </div>

      {/* se oscurece cuando la "Cadena de valor" sube por encima (lo anima esa sección) */}
    </section>
  );
}
