import { SPONSORS } from "@/data/sponsors";

import SponsorLogo from "./SponsorLogo";

/**
 * Celular y tablet: grilla con todas las marcas a la vista. El logo toma su color de marca al pasar
 * el cursor o cuando SponsorScrollColor marca la celda con data-on. La entrada con el scroll la hace
 * SponsorsReveal sobre [data-logo-cell]. Celdas de alto fijo: sin saltos de diseño (CLS).
 * En escritorio se usa SponsorNetwork.
 */
export default function SponsorGrid() {
  return (
    <ul
      data-sponsor-grid
      aria-label="Marcas que confían en Oriont"
      className="grid grid-cols-2 gap-x-8 gap-y-2 [--logo-h:34px] sm:grid-cols-3 md:grid-cols-4 md:[--logo-h:40px] lg:hidden"
    >
      {SPONSORS.map((s) => (
        <li key={s.name} data-logo-cell className="group flex h-24 items-center justify-center px-[5%] md:h-28">
          <SponsorLogo {...s} sizes="(min-width: 768px) 200px, 45vw" />
        </li>
      ))}
    </ul>
  );
}
