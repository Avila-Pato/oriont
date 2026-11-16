import type { StaticImageData } from "next/image";
import imgComercial from "@/public/oriont/comercial.webp";
import imgEquipoTi from "@/public/oriont/equipo-ti.webp";
import imgAuditoria from "@/public/oriont/auditoria.webp";
import imgHalloween1 from "@/public/oriont/halloween-1.webp";
import imgRrhh from "@/public/oriont/rrhh.webp";
import imgSupervisor from "@/public/oriont/supervisor.webp";
import imgTodos from "@/public/oriont/todos.webp";
import imgEquipo from "@/public/oriont/equipo.webp";
import imgJefes from "@/public/oriont/jefes.webp";
import imgOficina from "@/public/oriont/oficina-sala-reunion.webp";
import imgDentalAssist from "@/public/oriont/dental-assist.webp";

/** Textos de la sección "Nuestro equipo" (provisorio). */
export const ABOUT_COPY = {
  eyebrow: "Las personas detrás de Oriont",
  title: "Nuestro",
  highlight: "Equipo",
  text: "Un equipo que diseña, integra y conversa con el cliente final, todos los días.",
};

/** Llamado a la acción que aparece al seguir bajando (las tarjetas se ordenan abajo). */
export const ABOUT_CTA = {
  title: "¿Listo para convertir tus desafíos en",
  highlight: "oportunidades?",
  text: "Descubre hoy nuestras soluciones personalizadas en Oriont y potencia tu crecimiento.",
  eyebrow: "Contáctanos", // etiqueta sobre el texto, junto al formulario
  contact: [
    { icon: "pin", label: "Dirección comercial", value: "Av. Del Valle Norte 945, Of. 3604, Huechuraba" },
    { icon: "mail", label: "Correo electrónico", value: "contacto@oriont.cl", href: "mailto:contacto@oriont.cl" },
  ] as { icon: "pin" | "mail"; label: string; value: string; href?: string }[],
};

/** Formulario que aparece cuando una imagen toma la pantalla completa. */
export const CONTACT_FORM = {
  title: "Escríbenos",
  text: "Déjanos tus datos y te contactamos a la brevedad.",
  to: "contacto@oriont.cl",
};

/**
 * Tarjetas tipo polaroid alrededor del círculo.
 * angle: posición en el borde del círculo, en grados (0 = derecha, 90 = abajo, -90 = arriba).
 * rotate: inclinación de la tarjeta en grados.
 * Usar un número impar de tarjetas: la del medio de la fila (la de angle 90) es la que se agranda.
 * position: encuadre de la foto dentro de la tarjeta (las verticales se suben para no cortar caras).
 */
export type TeamCard = {
  src: StaticImageData;
  alt: string;
  angle: number;
  rotate: number;
  position?: string;
};

const UP = "50% 30%"; // fotos verticales: encuadre hacia arriba

export const TEAM_CARDS: TeamCard[] = [
  { src: imgComercial, alt: "Equipo comercial trabajando en una pizarra", angle: -125, rotate: -6, position: UP },
  { src: imgEquipoTi, alt: "Equipo de TI y operaciones en sus puestos", angle: -55, rotate: 5 },
  { src: imgAuditoria, alt: "Equipo de auditoría frente a sus pantallas", angle: -20, rotate: 9, position: UP },
  { src: imgHalloween1, alt: "El equipo disfrazado celebrando Halloween", angle: 10, rotate: -7 },
  { src: imgRrhh, alt: "Equipo de recursos humanos en la oficina", angle: 40, rotate: 7, position: UP },
  { src: imgSupervisor, alt: "Supervisión atendiendo llamadas con audífonos", angle: 65, rotate: -5, position: UP },
  // abajo al centro: queda al medio de la fila y es la que se agranda a pantalla completa
  { src: imgOficina, alt: "Equipo de Oriont trabajando en la sala de reuniones", angle: 90, rotate: -3 },
  { src: imgEquipo, alt: "Equipo de trabajo en la oficina de Oriont", angle: 115, rotate: 8, position: UP },
  { src: imgJefes, alt: "Jefaturas en reunión", angle: 140, rotate: -8, position: UP },
  { src: imgTodos, alt: "Selfie grupal de todo el equipo de Oriont", angle: 170, rotate: 6 },
  { src: imgDentalAssist, alt: "Equipo de Dental Assist en sus puestos", angle: -160, rotate: -4, position: UP },
];
