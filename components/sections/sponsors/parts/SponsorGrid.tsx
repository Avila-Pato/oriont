import { SPONSORS } from "@/data/sponsors";

import SponsorLogo from "./SponsorLogo";

/**
 * Celular y tablet: todas las marcas a la vista en una nube compacta (filas centradas que se
 * acomodan según el ancho de cada logo). Logos chicos y poco espacio entre ellos para que la
 * sección no se alargue (antes eran cintas que se deslizaban, y antes una grilla de ~1150px).
 * El logo toma su color de marca al tocarlo o cuando SponsorScrollColor marca la celda con data-on.
 * La entrada con el scroll la hace SponsorsReveal sobre [data-logo-cell].
 * Ancho de cada logo fijado por su proporción (SponsorLogo): sin CLS. En escritorio se usa SponsorCircuit.
 */
export default function SponsorGrid() {
  return (
    <ul
      data-sponsor-grid
      aria-label="Marcas que confían en Oriont"
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5 [--logo-h:22px] md:gap-x-9 md:gap-y-7 md:[--logo-h:28px] lg:hidden"
    >
      {SPONSORS.map((s, i) => (
        // data-sponsor: índice en SPONSORS (SponsorLive muestra el nombre de la que se enciende)
        <li key={s.name} data-logo-cell data-sponsor={i} className="group flex items-center justify-center">
          <SponsorLogo {...s} sizes="(min-width: 768px) 120px, 90px" />
        </li>
      ))}
    </ul>
  );
}
