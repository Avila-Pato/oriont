import SponsorLive from "./parts/SponsorLive";
import SponsorCircuit from "./parts/SponsorCircuit";
import SponsorScrollColor from "./parts/SponsorScrollColor";
import SponsorsReveal from "./parts/SponsorsReveal";

export default function IndustriesSection() {
  return (
    // solo escritorio: en celular la sección no se muestra (decisión de contenido). Con display:none
    // sus observers nunca la ven "cerca", así que tampoco se preparan sus animaciones.
    <SponsorsReveal id="industrias" className="w-full bg-white max-lg:hidden lg:min-h-[100svh]">
      {/* título y descripción arriba, todas las marcas abajo */}
      <div className="container-page grid gap-12 py-16 lg:gap-16">
        {/* escritorio: título a la izquierda y, a la derecha, la marca encendida en el muro */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
        <div>
          {/* mismo encabezado que las demás secciones: etiqueta chica con rayita + título azul
              marino con el remate en celeste (antes era un título celeste distinto al resto) */}
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-accent-ink xl:text-[12px]">
            <span data-reveal-line className="h-px w-6 bg-accent xl:w-8" />
            <span>Sponsors y aliados</span>
          </p>
          {/* h2: el h1 de la página es el del hero. data-reveal-title va en el h2 (no en un span):
              SplitText le pone aria-label, que solo es válido en elementos con rol */}
          <h2
            data-reveal-title
            className="mt-5 font-display text-[36px] font-semibold leading-[1.05] tracking-tight text-navy md:text-[44px] xl:text-[52px]"
          >
            Confían en <span className="text-accent">nosotros.</span>
          </h2>
          <p data-reveal-text className="mt-5 max-w-[420px] text-[15px] leading-relaxed
           text-navy/70 xl:max-w-[600px] xl:text-[17px]">
            Trabajamos junto a marcas que confían en nuestra experiencia y
            compromiso. Conoce a nuestros sponsors y aliados estratégicos, que
            forman parte de lo que hacemos.
          </p>
        </div>
        <div>
          <SponsorLive />
        </div>
        </div>
        <SponsorScrollColor />
      </div>
      {/* escritorio: abanico de circuito desde el medio del borde izquierdo, fuera del contenedor
          para que vaya de borde a borde de la pantalla */}
      <SponsorCircuit />
    </SponsorsReveal>
  );
}
