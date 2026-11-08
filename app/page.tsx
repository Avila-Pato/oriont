import HeroGallery from "@/components/HeroGallery";
import HeroGlobe from "@/components/HeroGlobe";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden bg-[#f5f0e6] text-[#21255c]">
      <Navbar />

      {/* hero */}
      <section className="relative min-h-[100svh] w-full">
        <HeroGallery />

        {/* globo al centro */}
        <HeroGlobe className="absolute left-1/2 top-[48%] z-10 aspect-square w-[min(94vw,62vh,660px)] -translate-x-1/2 -translate-y-1/2 md:w-[min(56vw,78vh,720px)]" />

        {/* texto */}
        <div className="absolute inset-x-4 bottom-20 z-20 md:inset-x-auto md:bottom-auto md:left-[5%] md:top-1/2 md:-translate-y-1/2">
          <div className="max-w-[400px] rounded-3xl border border-[#21255c]/10 bg-[#f5f0e6]/85 p-7 shadow-[0_30px_60px_-30px_rgba(33,37,92,0.35)] backdrop-blur-xl md:p-8">
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#248caa]">
              <span className="h-px w-6 bg-[#248caa]" />
              Somos Oriont
            </p>
            <h1 className="mt-5 font-display text-[34px] font-semibold leading-[1.08] tracking-tight md:text-[42px]">
              Conectamos al sponsor con el{" "}
              <span className="text-[#248caa]">cliente final.</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-[#21255c]/70">
              Ofrecemos servicios, productos y tecnología asociados al segmento bancaseguros y
              telecomunicaciones, en toda la cadena de valor.
            </p>
            <div className="mt-7 flex items-center gap-5">
              <a
                href="#servicios"
                className="group inline-flex items-center gap-2 rounded-full bg-[#21255c] py-2 pl-5 pr-2 text-[13px] font-medium text-[#f5f0e6] transition hover:bg-[#2c3175]"
              >
                Ver soluciones
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f5f0e6]/15 transition group-hover:translate-x-0.5">
                  →
                </span>
              </a>
              <a
                href="#nosotros"
                className="text-[13px] font-medium text-[#21255c]/70 underline-offset-4 transition hover:text-[#21255c] hover:underline"
              >
                Conócenos
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* siguientes secciones (en blanco por ahora) */}
      <section id="nosotros" className="min-h-screen" />
      <section id="servicios" className="min-h-screen" />
    </main>
  );
}
