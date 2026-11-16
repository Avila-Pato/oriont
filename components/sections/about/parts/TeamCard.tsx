import Image from "next/image";
import type { CSSProperties } from "react";
import type { TeamCard as TeamCardData } from "@/data/about";

/**
 * Tarjeta tipo polaroid: marco blanco, borde y sombra desplazada en el azul de la marca.
 * zoomOrigin: en escritorio, al pasar el cursor la foto se agranda (solo `scale`, sin mover
 * el layout) creciendo desde este punto, para que las de los bordes no se salgan de la pantalla.
 */
export default function TeamCard({
  card,
  zoomOrigin,
  zoomShift = [0, 0],
  className = "",
}: {
  card: TeamCardData;
  zoomOrigin?: string;
  /** % de su tamaño que se corre (x, y) al hacer hover, hacia el centro de la pantalla */
  zoomShift?: [number, number];
  className?: string;
}) {
  const style = {
    "--r": `${card.rotate}deg`,
    "--zx": `${zoomShift[0].toFixed(1)}%`,
    "--zy": `${zoomShift[1].toFixed(1)}%`,
    transformOrigin: zoomOrigin,
  } as CSSProperties;
  return (
    <figure
      style={style}
      className={`group rotate-(--r) rounded-xl border-2 border-[#21255c] bg-white p-2.5 shadow-[6px_6px_0_#21255c] transition duration-300 ease-out hover:rotate-0 hover:scale-105 hover:shadow-[10px_10px_0_#248caa] 2xl:rounded-2xl 2xl:p-3.5 2xl:shadow-[8px_8px_0_#21255c] max-sm:rounded-lg max-sm:border max-sm:p-1 max-sm:shadow-[3px_3px_0_#21255c] ${
        zoomOrigin
          ? // al entrar crece suave; al salir vuelve con rebote (la transición que manda es la del estado destino)
            "lg:duration-900 lg:ease-spring lg:hover:duration-500 lg:hover:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:lg:hover:translate-x-(--zx) motion-safe:lg:hover:translate-y-(--zy) motion-safe:lg:hover:scale-[1.8]"
          : ""
      } ${className}`}
    >
      <div data-card-photo className="relative aspect-4/3 w-full overflow-hidden rounded-md bg-[#21255c]/10">
        <Image
          src={card.src}
          alt={card.alt}
          fill
          placeholder="blur"
          // en escritorio la tarjeta se ve hasta 1,8× al hacer hover: pedimos la foto a ese tamaño
          sizes="(min-width: 1024px) 24vw, 45vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          style={card.position ? { objectPosition: card.position } : undefined}
        />
      </div>
    
    </figure>
  );
}
