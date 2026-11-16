import SponsorGrid from "./parts/SponsorGrid";
import SponsorNetwork from "./parts/SponsorNetwork";
import SponsorScrollColor from "./parts/SponsorScrollColor";
import SponsorsReveal from "./parts/SponsorsReveal";

export default function SponsorsSection() {
  return (
    <SponsorsReveal id="industrias" className="min-h-[100svh] w-full bg-white">
      {/* título y descripción arriba, todas las marcas abajo */}
      <div className="container-page grid gap-12 py-16 lg:gap-16">
        <div>
          {/* items-start + mt en em: la rayita queda a la altura de la primera línea aunque el título se parta */}
          <h1 className="flex items-start gap-3 font-display text-[11px] tracking-tight font-semibold
           text-[#248caa] md:text-[52px] xl:text-[60px] ">
            <span data-reveal-line className="mt-[0.6em] h-px w-6 shrink-0 bg-[#248caa] xl:w-8" />
            {/* el texto va en su propio span: SplitText parte las palabras sin volverlas items del flex */}
            <span data-reveal-title>Confian en nosotros</span>
          </h1>
          <p data-reveal-text className="mt-5 ml-2 max-w-[420px] text-[15px] leading-relaxed
           text-[#21255c]/70 xl:mt-7 xl:ml-12 xl:max-w-[600px] xl:text-[20px]">
            Trabajamos junto a marcas que confían en nuestra experiencia y
            compromiso. Conoce a nuestros sponsors y aliados estratégicos, que
            forman parte de lo que hacemos.
          </p>
        </div>
        {/* celular/tablet: grilla · escritorio: red con Oriont al centro */}
        <SponsorGrid />
        <SponsorNetwork />
        <SponsorScrollColor />
      </div>
    </SponsorsReveal>
  );
}
