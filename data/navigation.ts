/** Enlaces del menú principal (anclas a las secciones, en el orden de la página). */
export const NAV_LINKS = [
  { label: "Soluciones", href: "#soluciones" },
  { label: "Servicios", href: "#servicios" },
  // la sección de sponsors solo existe en escritorio: no va en el menú de celular
  { label: "Industrias", href: "#industrias", desktopOnly: true },
  { label: "Nosotros", href: "#nosotros" },
];

/** Botón de contacto del menú. */
export const NAV_CTA = { label: "Contáctanos", mobileLabel: "Contacto", href: "#contacto" };
