/**
 * Configuración del formulario de contacto. Sin valores en el código: todo sale de variables
 * de entorno (`.env.local` en desarrollo, variables del hosting en producción).
 * Ver `.env.example` para los nombres.
 *
 * - NEXT_PUBLIC_TURNSTILE_SITE_KEY: site key pública de Cloudflare Turnstile.
 *   (En desarrollo se puede usar la clave de prueba de Cloudflare, documentada en su sitio.)
 * - NEXT_PUBLIC_CONTACT_ENDPOINT: URL de /api/form-email de la Azure Function.
 *
 * Si falta alguna, el widget no se muestra y el envío responde con el mensaje de error.
 * La SECRET key de Turnstile NUNCA va en el frontend: solo en la Azure Function.
 */

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const CONTACT_ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? "";
