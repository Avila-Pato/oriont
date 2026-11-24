import { steps } from "@/data/solutions";

/* Medidas y utilidades del mazo de la sección Soluciones (las comparten la sección y sus partes). */

export const OFFSET = 30; // px que asoma cada tarjeta por encima de la siguiente
export const DEPTH_DIM = 0.07; // cuánto se oscurece cada tarjeta de atrás
export const CARD_H = 455; // alto de la tarjeta (px)
export const SHUFFLE_OUT = 380; // ms del viaje de salida al barajar
export const LAST = steps.length - 1;
/** 0 → "01" */
export const pad = (i: number) => String(i + 1).padStart(2, "0");

/** Tarjeta saliendo al barajar: se desvanece hacia la derecha desde el puesto que tenía (y, z). */
export type Moving = { i: number; y: number; z: number };

/** Profundidad de la carta `i` con `front` al frente: 0 la del frente; las demás en orden de
 *  lista, compactadas (sin huecos), la más alta más atrás. */
export function depthOf(i: number, front: number) {
  if (i === front) return 0;
  const behind = steps.map((_, k) => k).filter((k) => k !== front);
  return behind.length - behind.indexOf(i);
}
