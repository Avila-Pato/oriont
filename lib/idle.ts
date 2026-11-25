/**
 * Corre `fn` cuando el hilo principal queda libre (requestIdleCallback, a más tardar en 500 ms).
 * Sirve para preparar animaciones (GSAP mide estilos y posiciones al crearlas) fuera del render de
 * React y fuera de los cuadros de scroll. Sin requestIdleCallback (Safari) cae a un setTimeout corto.
 */
export const whenIdle = (fn: () => void) =>
  window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 500 }) : window.setTimeout(fn, 60);

export const cancelIdle = (id: number) =>
  window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id);
