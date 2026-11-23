/**
 * Colores de la marca para usar en JS: canvas, atributos SVG, correos, imagen para compartir.
 * En clases de Tailwind NO se usan estos valores: van los tokens de app/globals.css (@theme),
 * p. ej. `text-navy`, `bg-accent/10`, `text-accent-ink`. Si se cambia un color, cambiarlo en
 * los dos lugares.
 */
export const COLORS = {
  /** azul marino: texto y fondos oscuros */
  navy: "#21255c",
  /** celeste de la marca: títulos grandes, líneas, puntos, íconos */
  accent: "#248caa",
  /** celeste para texto chico (contraste ≥ 4.5 sobre blanco) */
  accentInk: "#1d7690",
  /** celeste muy claro: fondos */
  ice: "#dcebf3",
  /** crema */
  cream: "#f5f0e6",
  /** errores */
  danger: "#c2410c",
  /** fondo de la página */
  background: "#f8f9f9",
} as const;
