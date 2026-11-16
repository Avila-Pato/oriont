import Image, { type StaticImageData } from "next/image";

/**
 * Tamaño visual parejo: a igual alto, un logo ancho (Scotiabank) se ve mucho más grande que uno
 * cuadrado (Itaú). Se iguala el área aproximada y se limita cuánto crecen los cuadrados.
 * Devuelve el ancho en múltiplos de --logo-h.
 */
export function logoWidth(w: number, h: number) {
  const aspect = w / h;
  return aspect * Math.min(1.35, Math.sqrt(3.2 / aspect));
}

type Props = { name: string; logo: StaticImageData; color: string; colorLogo?: StaticImageData; sizes: string };

/**
 * Un logo del muro: en marino y, al pasar el cursor o con el scroll (data-on en el `group` que lo
 * contiene), con su color de marca. Todo con transiciones CSS de opacidad/escala.
 */
export default function SponsorLogo({ name, logo, color, colorLogo, sizes }: Props) {
  return (
    <span
      className="relative block max-w-full transition-[scale] duration-300 group-hover:scale-105 group-data-on:scale-105"
      style={{ width: `calc(var(--logo-h) * ${logoWidth(logo.width, logo.height).toFixed(3)})` }}
    >
      <Image
        src={logo}
        alt={name}
        sizes={sizes}
        draggable={false}
        className="block h-auto w-full opacity-75 transition-opacity duration-300 select-none group-hover:opacity-0 group-data-on:opacity-0"
      />
      {/* el logo a color: su versión a color si existe, o el logo pintado con su color de marca
          (el logo recorta el color). Aparece por opacidad con el scroll (data-on) o el cursor */}
      {colorLogo ? (
        <Image
          src={colorLogo}
          alt=""
          aria-hidden
          sizes={sizes}
          draggable={false}
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-500 select-none group-hover:opacity-100 group-hover:duration-300 group-data-on:opacity-100"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:duration-300 group-data-on:opacity-100"
          style={{
            background: color,
            maskImage: `url(${logo.src})`,
            maskSize: "100% 100%",
            maskRepeat: "no-repeat",
          }}
        />
      )}
    </span>
  );
}
