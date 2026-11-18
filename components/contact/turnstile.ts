/**
 * Carga el script de Cloudflare Turnstile UNA sola vez para toda la página (el formulario aparece
 * en varias partes: Nosotros escritorio/móvil y el drawer). Modo `render=explicit`: cada formulario
 * dibuja su widget con `turnstile.render()` y lo quita con `turnstile.remove()` al desmontarse.
 */

export type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const ORIGIN = "https://challenges.cloudflare.com";
const SRC = `${ORIGIN}/turnstile/v0/api.js?render=explicit`;
let loading: Promise<TurnstileApi> | null = null;
let preconnected = false;

/**
 * Abre por adelantado la conexión (DNS + TCP + TLS) con Cloudflare cuando es probable que se use
 * Turnstile (el formulario se acerca o el usuario apunta a "Contacto"). No va en el <head>: el
 * formulario está al final o en el drawer, y una conexión ociosa se cierra a los ~10 s.
 * Sin `crossorigin`: el script y el iframe del widget se piden en modo no-CORS.
 */
export function preconnectTurnstile() {
  if (preconnected || loading || window.turnstile) return;
  preconnected = true;
  const l = document.createElement("link");
  l.rel = "preconnect";
  l.href = ORIGIN;
  document.head.appendChild(l);
}

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile no disponible")));
    s.onerror = () => {
      // permitir reintentar más tarde (p. ej. si falló la red)
      loading = null;
      s.remove();
      reject(new Error("No se pudo cargar Turnstile"));
    };
    document.head.appendChild(s);
  });
  return loading;
}
