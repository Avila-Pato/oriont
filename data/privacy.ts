import { SITE } from "./site";

/**
 * Política de privacidad (página /privacidad). Cubre lo que hace hoy el sitio: el formulario de
 * contacto (Azure Function + correo por Microsoft 365) y la verificación anti-bots (Cloudflare
 * Turnstile). Si se agrega analítica, otro formulario u otro proveedor, hay que actualizarla y
 * cambiar `updated`. Marco legal: Ley 19.628 y Ley 21.719 (vigente desde el 1/12/2026).
 */

const { streetAddress, addressLocality } = SITE.address;

export const PRIVACY = {
  updated: "19 de noviembre de 2026",
  company: SITE.legalName,
  intro: `En ${SITE.name} cuidamos los datos personales que nos entregas. Aquí explicamos qué datos recogemos en este sitio, para qué los usamos y cómo puedes ejercer tus derechos.`,
  sections: [
    {
      title: "Responsable",
      body: [
        `${SITE.legalName}, con domicilio en ${streetAddress}, ${addressLocality}, Santiago, Chile. Para cualquier consulta sobre tus datos escríbenos a ${SITE.email}.`,
      ],
    },
    {
      title: "Qué datos recogemos",
      body: [
        "Solo los que escribes en el formulario de contacto: nombre, correo y mensaje (obligatorios), y empresa y teléfono (opcionales).",
        "Para evitar envíos automáticos (spam), el formulario usa una verificación de seguridad que procesa datos técnicos de tu navegador, como la dirección IP.",
        "Este sitio no usa cookies de publicidad ni de analítica.",
      ],
    },
    {
      title: "Para qué los usamos",
      body: [
        "Para responder tu consulta, enviarte la confirmación de que la recibimos y, si corresponde, darle seguimiento comercial a lo que nos planteas.",
        "No vendemos ni cedemos tus datos a terceros, ni los usamos para enviarte publicidad sin tu autorización.",
      ],
    },
    {
      title: "Base legal",
      body: [
        "Tu consentimiento, que entregas al enviar el formulario. Puedes retirarlo cuando quieras escribiéndonos; eso no afecta lo que se haya hecho antes con tu autorización.",
      ],
    },
    {
      title: "Quién más los procesa",
      body: [
        "Para operar el formulario usamos proveedores que tratan los datos por encargo nuestro y solo para ese fin: Microsoft (servidores en Azure y envío de correos con Microsoft 365) y Cloudflare (verificación anti-spam).",
        "Estos proveedores pueden procesar datos fuera de Chile, bajo sus propias medidas de seguridad y acuerdos de protección de datos.",
      ],
    },
    {
      title: "Cuánto tiempo los guardamos",
      body: [
        "Mientras sea necesario para atender tu consulta y la relación comercial que surja de ella. Si no continúa, los eliminamos dentro de los 24 meses siguientes a tu último contacto, o antes si nos lo pides.",
      ],
    },
    {
      title: "Tus derechos",
      body: [
        "Puedes pedir acceso a tus datos, su rectificación, supresión o portabilidad, oponerte a su tratamiento o solicitar su bloqueo.",
        `Escríbenos a ${SITE.email} indicando qué necesitas; te responderemos en los plazos que establece la ley. Si no quedas conforme, puedes recurrir a la Agencia de Protección de Datos Personales.`,
      ],
    },
    {
      title: "Seguridad",
      body: [
        "El sitio funciona solo con conexión cifrada (HTTPS) y el acceso a los datos está limitado a las personas que necesitan responder tu consulta.",
      ],
    },
    {
      title: "Cambios a esta política",
      body: [
        "Si cambiamos cómo tratamos los datos, actualizaremos esta página y la fecha de abajo.",
      ],
    },
  ],
};
