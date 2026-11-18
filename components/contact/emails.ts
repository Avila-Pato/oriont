/**
 * Correos que envía el formulario de contacto vía AzFunc.MailSender (/api/form-email).
 * Un solo request lleva dos mensajes: confirmación al usuario + aviso interno a Oriont.
 *
 * Las plantillas son HTML con {{placeholders}}; el servicio los reemplaza al enviar.
 * El servicio NO escapa los valores: se escapan aquí antes de mandarlos (ver `escapeHtml`).
 * CSS inline: los clientes de correo ignoran casi todo lo demás.
 */

import { CONTACT_FORM } from "@/data/about";

/** Alias de remitente configurado en la Function (shared/config.py). Soporta solo GRAPH. */
export const MAIL_FROM_ALIAS = "no-responder";
export const MAIL_PROVIDER = "GRAPH";
/** Casilla interna que recibe el aviso de cada contacto. NEXT_PUBLIC_CONTACT_ADMIN_TO (opcional,
 *  solo en .env.local) la reemplaza para pruebas: así el aviso no le llega a contacto@. */
export const MAIL_ADMIN_TO = process.env.NEXT_PUBLIC_CONTACT_ADMIN_TO || CONTACT_FORM.to;

const wrap = (content: string) => `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f5f0e6;font-family:Arial,Helvetica,sans-serif;color:#21255c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px">
<tr><td style="padding:32px">${content}</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#21255c99;text-align:center">Oriont Consulting · oriont.cl</p>
</body></html>`;

export const USER_TEMPLATE = wrap(`
<h1 style="margin:0 0 12px;font-size:22px">Hola {{nombre}}, recibimos tu mensaje</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Gracias por escribirnos. Nuestro equipo lo revisará y te contactaremos a la brevedad.</p>
<p style="margin:0 0 6px;font-size:13px;color:#21255c99">Esto es lo que nos enviaste:</p>
<div style="padding:14px 16px;border-left:3px solid #248caa;background:#f5f0e6;font-size:14px;line-height:1.6;white-space:pre-wrap">{{mensaje}}</div>
<p style="margin:20px 0 0;font-size:13px;color:#21255c99">Este correo se envió automáticamente; por favor no lo respondas. Si necesitas algo más, escríbenos a ${CONTACT_FORM.to}.</p>`);

export const ADMIN_TEMPLATE = wrap(`
<h1 style="margin:0 0 16px;font-size:20px">Nuevo contacto desde la web</h1>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6">
<tr><td style="padding:2px 16px 2px 0;color:#21255c99">Nombre</td><td>{{nombre}}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#21255c99">Empresa</td><td>{{empresa}}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#21255c99">Correo</td><td>{{correo}}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#21255c99">Teléfono</td><td>{{telefono}}</td></tr>
</table>
<p style="margin:16px 0 6px;font-size:13px;color:#21255c99">Mensaje</p>
<div style="padding:14px 16px;border-left:3px solid #248caa;background:#f5f0e6;font-size:14px;line-height:1.6;white-space:pre-wrap">{{mensaje}}</div>`);

/** HTML → Base64 (UTF-8, soporta tildes y ñ), como pide `templateB64`. */
export function toBase64(html: string) {
  const bytes = new TextEncoder().encode(html);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
