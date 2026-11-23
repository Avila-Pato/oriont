import type { CountryCode } from "@/data/countries";
import { COLORS } from "@/data/colors";

/** estrella de 5 puntas centrada en (cx, cy) */
function star(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? inner : outer;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    return `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
  }).join(" ");
}

/** dibujo de cada bandera en un cuadrado de 24×24 (se recorta en círculo) */
const FLAGS: Record<CountryCode, React.ReactNode> = {
  CL: (
    <>
      <rect width="24" height="12" fill="#fff" />
      <rect y="12" width="24" height="12" fill="#d52b1e" />
      <rect width="12" height="12" fill="#0039a6" />
      <polygon points={star(6.5, 6.5, 3.2, 1.3)} fill="#fff" />
    </>
  ),
  PE: (
    <>
      <rect width="8" height="24" fill="#d91023" />
      <rect x="8" width="8" height="24" fill="#fff" />
      <rect x="16" width="8" height="24" fill="#d91023" />
    </>
  ),
  CO: (
    <>
      <rect width="24" height="12" fill="#fcd116" />
      <rect y="12" width="24" height="6" fill="#003893" />
      <rect y="18" width="24" height="6" fill="#ce1126" />
    </>
  ),
};

/** Bandera redonda del país (SVG en línea: sin requests ni imágenes). Decorativa: el nombre va al lado. */
export default function CountryFlag({ code, className = "size-5" }: { code: CountryCode; className?: string }) {
  const id = `flag-clip-${code}`;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`}>
      <defs>
        <clipPath id={id}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{FLAGS[code]}</g>
      {/* borde sutil: la parte blanca no se pierde sobre fondos claros */}
      <circle cx="12" cy="12" r="11.5" fill="none" stroke={COLORS.navy} strokeOpacity="0.15" />
    </svg>
  );
}
