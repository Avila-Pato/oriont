"use client";

import { useId, useState, type FormEvent } from "react";
import { ABOUT_CTA, CONTACT_FORM } from "@/data/about";

/**
 * Formulario de contacto. Aún no hay backend: al enviar abre el correo del usuario
 * con los datos ya escritos, dirigido a la casilla de contacto.
 * TODO: conectar a un endpoint (Route Handler / servicio de formularios) cuando exista.
 */
export default function ContactForm({ className = "" }: { className?: string }) {
  const id = useId();
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const body = [
      `Nombre: ${get("nombre")}`,
      `Empresa: ${get("empresa")}`,
      `Correo: ${get("correo")}`,
      `Teléfono: ${get("telefono")}`,
      "",
      get("mensaje"),
    ].join("\n");
    const subject = `Contacto web — ${get("nombre")}${get("empresa") ? ` (${get("empresa")})` : ""}`;
    window.location.href = `mailto:${CONTACT_FORM.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const field =
    "w-full rounded-xl border border-[#21255c]/12 bg-[#f8f9f9] px-4 py-3 text-[14px] text-[#21255c] outline-none transition placeholder:text-[#21255c]/35 focus:border-[#248caa] focus:bg-white focus:ring-4 focus:ring-[#248caa]/15 2xl:py-3.5 2xl:text-[16px]";
  const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#21255c]/55 2xl:text-[11px]";

  return (
    <form
      onSubmit={onSubmit}
      className={`w-full rounded-3xl bg-white p-6 text-left shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)] sm:p-8 2xl:p-10 ${className}`}
    >
      <p className="font-display text-[22px] font-semibold leading-tight text-[#21255c] 2xl:text-[28px]">
        {CONTACT_FORM.title}
      </p>
      <p className="mt-1.5 text-[14px] text-[#21255c]/60 2xl:text-[16px]">{CONTACT_FORM.text}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:gap-5">
        <div>
          <label htmlFor={`${id}-nombre`} className={label}>Nombre</label>
          <input id={`${id}-nombre`} name="nombre" required autoComplete="name" placeholder="Tu nombre" className={field} />
        </div>
        <div>
          <label htmlFor={`${id}-empresa`} className={label}>Empresa</label>
          <input id={`${id}-empresa`} name="empresa" autoComplete="organization" placeholder="Nombre de tu empresa" className={field} />
        </div>
        <div>
          <label htmlFor={`${id}-correo`} className={label}>Correo</label>
          <input id={`${id}-correo`} name="correo" type="email" required autoComplete="email" placeholder="tu@empresa.cl" className={field} />
        </div>
        <div>
          <label htmlFor={`${id}-telefono`} className={label}>Teléfono</label>
          <input id={`${id}-telefono`} name="telefono" type="tel" autoComplete="tel" placeholder="+56 9 1234 5678" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-mensaje`} className={label}>Mensaje</label>
          <textarea
            id={`${id}-mensaje`}
            name="mensaje"
            required
            rows={4}
            placeholder="Cuéntanos qué desafío quieres resolver"
            className={`${field} resize-none`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[12px] text-[#21255c]/50 2xl:text-[13px]">
          {sent ? "¡Gracias! Se abrió tu correo para enviar el mensaje." : `También puedes escribirnos a ${ABOUT_CTA.contact[1].value}`}
        </p>
        <button
          type="submit"
          className="group inline-flex items-center gap-2 rounded-full bg-[#21255c] py-2 pl-5 pr-2 text-[14px] font-medium text-[#f5f0e6] transition hover:bg-[#2c3175] 2xl:py-2.5 2xl:pl-6 2xl:text-[16px]"
        >
          Enviar mensaje
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#248caa] transition group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    </form>
  );
}
