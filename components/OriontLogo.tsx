type Props = {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  markClassName?: string;
};

/** Isotipo hexagonal de Oriont: dos piezas entrelazadas + núcleo hexagonal. */
export function OriontMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="or-left" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#3b3f8f" />
          <stop offset="0.6" stopColor="#2c2f72" />
          <stop offset="1" stopColor="#3a8fc0" />
        </linearGradient>
        <linearGradient id="or-right" x1="1" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#8fcbef" />
          <stop offset="0.45" stopColor="#3aa0b8" />
          <stop offset="1" stopColor="#3d2f78" />
        </linearGradient>
      </defs>
      {/* pieza izquierda */}
      <path
        d="M47 4 L10 25.5 L10 72 L29 83 L29 61 L22 57 L22 33 L47 18.5 Z"
        fill="url(#or-left)"
      />
      <path d="M29 61 L44 69.5 L44 55 L36 50.5 L36 44 L29 40 Z" fill="#2c2f72" />
      {/* pieza derecha */}
      <path
        d="M53 96 L90 74.5 L90 28 L71 17 L71 39 L78 43 L78 67 L53 81.5 Z"
        fill="url(#or-right)"
      />
      <path d="M71 39 L56 30.5 L56 45 L64 49.5 L64 56 L71 60 Z" fill="#3aa0b8" />
      {/* núcleo */}
      <path
        d="M50 43 L56 46.5 L56 53.5 L50 57 L44 53.5 L44 46.5 Z"
        fill="none"
        stroke="#8fcbef"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export default function OriontLogo({
  className = "",
  showText = true,
  textClassName = "text-2xl text-white",
  markClassName = "h-10 w-10",
}: Props) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <OriontMark className={`shrink-0 ${markClassName}`} />
      {showText && (
        <span
          className={`font-display font-bold tracking-[0.14em] ${textClassName}`}
        >
          ORIONT
        </span>
      )}
    </span>
  );
}
