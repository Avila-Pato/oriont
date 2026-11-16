import Image from "next/image";
import markImg from "@/public/images/Logo_Oriont_mark.webp";
import logoImg from "@/public/images/Logo_Oriont_trim.webp";

/** Isotipo hexagonal de Oriont (recorte cuadrado del logo oficial). */
export function OriontMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <Image
      src={markImg}
      alt=""
      aria-hidden="true"
      // tamaño de pantalla (máx. 64px), no el del archivo: Next pide 1× y 2× de este ancho
      width={64}
      height={64}
      className={`object-contain ${className}`}
    />
  );
}

/** Logo oficial completo (isotipo + ORIONT), recortado sin márgenes. El alto se controla con className. */
export default function OriontLogo({ className = "h-9 w-auto", eager = false }: { className?: string; eager?: boolean }) {
  return (
    <Image
      src={logoImg}
      alt="Oriont"
      // misma proporción que el archivo (976×397) pero al tamaño en que se ve (~36px de alto)
      width={96}
      height={39}
      loading={eager ? "eager" : "lazy"}
      className={`object-contain ${className}`}
    />
  );
}
