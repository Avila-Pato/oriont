import SponsorGrid from "./parts/SponsorGrid";
import SponsorLive from "./parts/SponsorLive";
import SponsorCircuit from "./parts/SponsorCircuit";
import SponsorScrollColor from "./parts/SponsorScrollColor";
import SponsorsReveal from "./parts/SponsorsReveal";

export default function IndustriesSection() {
  return (
    <SponsorsReveal id="industrias" className="w-full bg-white lg:min-h-[100svh]">
      {/* título y descripción arriba, todas las marcas abajo */}
      <div className="container-page grid gap-12 py-16 lg:gap-16">
        {/* escritorio: título a la izquierda y, a la derecha, la marca encendida en el muro */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
        <div>
          {/* mismo encabezado que las demás secciones: etiqueta chica con rayita + título azul
              marino con el remate en celeste (antes era un título celeste distinto al resto) */}
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#248caa] xl:text-[12px]">
            <span data-reveal-line className="h-px w-6 bg-[#248caa] xl:w-8" />
            <span>Sponsors y aliados</span>
          </p>
          {/* h2: el h1 de la página es el del hero */}
          <h2 className="mt-5 font-display text-[36px] font-semibold leading-[1.05] tracking-tight text-[#21255c] md:text-[44px] xl:text-[52px]">
            <span data-reveal-title>
              Confían en <span className="text-[#248caa]">nosotros.</span>
            </span>
          </h2>
          <p data-reveal-text className="mt-5 max-w-[420px] text-[15px] leading-relaxed
           text-[#21255c]/70 xl:max-w-[600px] xl:text-[17px]">
            Trabajamos junto a marcas que confían en nuestra experiencia y
            compromiso. Conoce a nuestros sponsors y aliados estratégicos, que
            forman parte de lo que hacemos.
          </p>
        </div>
        <div className="hidden lg:block">
          <SponsorLive />
        </div>
        </div>
        {/* celular/tablet: grilla (escritorio: abanico, abajo a todo el ancho) */}
        <SponsorGrid />
        <SponsorScrollColor />
      </div>
      {/* escritorio: abanico de circuito desde el medio del borde izquierdo, fuera del contenedor
          para que vaya de borde a borde de la pantalla */}
      <SponsorCircuit />
    </SponsorsReveal>
  );
}
