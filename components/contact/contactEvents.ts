/** Evento que abre el panel de contacto (lo escucha ContactDrawer). Archivo aparte para que
 *  SmoothScroll y Navbar puedan abrirlo sin importar el panel completo (ni crear un ciclo). */
export const OPEN_CONTACT_EVENT = "oriont:open-contact";

/** Abre el panel de contacto desde cualquier parte. */
export const openContact = () => window.dispatchEvent(new Event(OPEN_CONTACT_EVENT));
