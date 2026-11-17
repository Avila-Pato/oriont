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

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<TurnstileApi> | null = null;

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
