/**
 * Entrada de los logos (celdas [data-logo-cell]) con transiciones CSS, sin GSAP: SponsorsReveal
 * marca la lista con data-cells="out" (ocultos, un poco más abajo, al tiro) cuando la sección está
 * a una pantalla de distancia, y con data-cells="in" al llegar: cada celda sube con un retraso
 * según su número (--i), en ola. Con GSAP había que leer el estilo de partida de cada celda
 * (getComputedStyle), una tarea larga justo al acercarse la sección.
 * Va en `transform` porque las celdas del abanico ya usan `translate` para centrarse: son
 * propiedades distintas y se suman. Solo opacity/transform (sin CLS).
 */
export const CELL_ENTRANCE =
  "transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.33,1,0.68,1)] [transition-delay:calc(var(--i)*26ms)] " +
  "[[data-cells=out]_&]:opacity-0 [[data-cells=out]_&]:[transform:translateY(24px)] [[data-cells=out]_&]:duration-0 [[data-cells=out]_&]:[transition-delay:0ms]";
