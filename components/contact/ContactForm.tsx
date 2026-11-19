"use client";

import { useId, useState, type FormEvent, type FocusEvent, useRef, useEffect } from "react";
import { ABOUT_CTA, CONTACT_FORM } from "@/data/about";
import { useNearViewport } from "@/hooks/useNearViewport";
import { CONTACT_ENDPOINT, TURNSTILE_SITE_KEY } from "./config";
import {
  ADMIN_TEMPLATE,
  MAIL_ADMIN_TO,
  MAIL_FROM_ALIAS,
  MAIL_PROVIDER,
  USER_TEMPLATE,
  escapeHtml,
  toBase64,
} from "./emails";
import { loadTurnstile, preconnectTurnstile } from "./turnstile";

/**
 * Formulario de contacto. Envía JSON a la Azure Function (CONTACT_ENDPOINT) con el token de
 * Cloudflare Turnstile; la Function valida el token con su secret key antes de mandar el correo.
 *
 * Turnstile se carga recién cuando el formulario se acerca a la pantalla (IntersectionObserver):
 * no pesa en la carga inicial, y las copias ocultas (display:none) nunca cargan ni resuelven reto.
 * El espacio del widget (65 px) queda reservado para que al aparecer no mueva nada.
 *
 * Validación propia (noValidate): mensajes en español bajo cada campo, al salir del campo
 * (si ya se escribió algo) y al enviar (todos). El primero con error recibe el foco.
 */

type Name = "nombre" | "empresa" | "correo" | "telefono" | "mensaje";
type Status = "idle" | "captcha" | "sending" | "sent" | "error";

type Field = {
  name: Name;
  label: string;
  placeholder: string;
  required: boolean;
  type: "text" | "email" | "tel" | "textarea";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  maxLength: number;
  /** ocupa las dos columnas */
  wide?: boolean;
  /** mensaje de error, o null si el valor está bien (ya viene sin espacios a los lados) */
  validate: (v: string) => string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// teléfono: dígitos, espacios, +, guiones y paréntesis; entre 8 y 15 dígitos
const phoneDigits = (v: string) => v.replace(/\D/g, "").length;

const FIELDS: Field[] = [
  {
    name: "nombre",
    label: "Nombre",
    placeholder: "Tu nombre",
    required: true,
    type: "text",
    autoComplete: "name",
    maxLength: 80,
    validate: (v) => (!v ? "Escribe tu nombre." : v.length < 2 ? "El nombre es muy corto." : null),
  },
  {
    name: "empresa",
    label: "Empresa",
    placeholder: "Nombre de tu empresa",
    required: false,
    type: "text",
    autoComplete: "organization",
    maxLength: 100,
    validate: () => null,
  },
  {
    name: "correo",
    label: "Correo",
    placeholder: "tu@empresa.cl",
    required: true,
    type: "email",
    autoComplete: "email",
    inputMode: "email",
    maxLength: 120,
    validate: (v) => (!v ? "Escribe tu correo." : !EMAIL.test(v) ? "Revisa el correo, por ejemplo: nombre@empresa.cl" : null),
  },
  {
    name: "telefono",
    label: "Teléfono",
    placeholder: "+56 9 1234 5678",
    required: false,
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    maxLength: 20,
    validate: (v) =>
      !v
        ? null
        : !/^[+\d\s()-]+$/.test(v)
          ? "Usa solo números, espacios y el signo +."
          : phoneDigits(v) < 8 || phoneDigits(v) > 15
            ? "Revisa el número, por ejemplo: +56 9 1234 5678"
            : null,
  },
  {
    name: "mensaje",
    label: "Mensaje",
    placeholder: "Cuéntanos qué desafío quieres resolver",
    required: true,
    type: "textarea",
    maxLength: 1000,
    wide: true,
    validate: (v) =>
      !v ? "Cuéntanos en qué te podemos ayudar." : v.length < 10 ? "Escribe un poco más (mínimo 10 caracteres)." : null,
  },
];

/** Registro en la consola del navegador (filtrar por "[contacto]"): captcha, envío y respuesta.
 *  No muestra el token. Ojo: MailSender responde 202 aunque bloquee el envío, así que un 202
 *  aquí solo confirma que la Function lo recibió; el motivo de un bloqueo queda en sus logs
 *  ("AntiSpam EVAL"). */
const log = (...args: unknown[]) => console.info("[contacto]", ...args);

/** ancho mínimo del widget Turnstile en tamaño "flexible" (px) */
const TURNSTILE_MIN_W = 300;

export default function ContactForm({ className = "" }: { className?: string }) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Name, string>>>({});

  // `_ts` anti-spam: momento en que se montó el formulario (la Function rechaza envíos en < 3 s)
  const loadTime = useRef(0);
  // Turnstile: contenedor del widget, id del widget dibujado y último token válido
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  // Turnstile "flexible" mide mínimo 300 px de ancho: en celulares el formulario queda más angosto
  // (drawer y Nosotros dejan ~260-290 px) y el widget se salía por la derecha. Ahí va "compact"
  // (150 × 140 px), que cabe siempre.
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    loadTime.current = Date.now();
  }, []);

  // Turnstile (script + widget) recién cuando el formulario se acerca a pantalla. En el drawer
  // cerrado (display: none) el elemento no intersecta, así que tampoco carga hasta abrirlo.
  const near = useNearViewport(boxRef, "200px");
  // con más margen solo se abre la conexión con Cloudflare: cuando llega a los 200 px, el script
  // se descarga sin esperar DNS + TLS
  const approaching = useNearViewport(boxRef, "1200px");
  useEffect(() => {
    if (approaching && TURNSTILE_SITE_KEY) preconnectTurnstile();
  }, [approaching]);

  useEffect(() => {
    const el = boxRef.current;
    if (!near || !el || !TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    const load = () => {
      // se mide recién aquí: en el drawer cerrado (display: none) el ancho al montar es 0
      const small = el.clientWidth < TURNSTILE_MIN_W;
      setCompact(small);
      log("cargando Turnstile, site key", `${TURNSTILE_SITE_KEY.slice(0, 8)}…`, small ? "(compacto)" : "");
      loadTurnstile()
        .then((ts) => {
          if (cancelled) return;
          widgetRef.current = ts.render(el, {
            sitekey: TURNSTILE_SITE_KEY,
            language: "es",
            theme: "light",
            size: small ? "compact" : "flexible",
            callback: (token: string) => {
              log("Turnstile OK: token recibido", `(${token.length} caracteres)`);
              tokenRef.current = token;
              setCaptchaFailed(false);
              setStatus((s) => (s === "captcha" ? "idle" : s));
            },
            "expired-callback": () => {
              log("Turnstile: el token venció (se pide otro)");
              tokenRef.current = null;
            },
            "error-callback": (code: string) => {
              // 110200 = dominio no está en los Hostnames del widget · 400020 = site key inválida
              log("Turnstile ERROR", code);
              tokenRef.current = null;
            },
          });
        })
        .catch((err) => {
          log("Turnstile: no se pudo cargar el script", err);
          if (!cancelled) setCaptchaFailed(true);
        });
    };

    // Se carga con el scroll quieto (QUIET_MS sin moverse): el script del reto (en el iframe de
    // Cloudflare) tarda ~80 ms en evaluarse, y en Nosotros (escritorio) el formulario "se acerca"
    // a mitad del recorrido animado de las tarjetas: cargarlo ahí cortaba la animación.
    const QUIET_MS = 400;
    let quiet = 0;
    const arm = () => {
      clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        window.removeEventListener("scroll", arm);
        if (!cancelled) load();
      }, QUIET_MS);
    };
    window.addEventListener("scroll", arm, { passive: true });
    arm();

    return () => {
      cancelled = true;
      clearTimeout(quiet);
      window.removeEventListener("scroll", arm);
      if (widgetRef.current) window.turnstile?.remove(widgetRef.current);
      widgetRef.current = null;
      tokenRef.current = null;
    };
  }, [near]);

  const check = (name: Name, value: string) => {
    const f = FIELDS.find((x) => x.name === name)!;
    const msg = f.validate(value.trim());
    setErrors((e) => (e[name] === (msg ?? undefined) ? e : { ...e, [name]: msg ?? undefined }));
    return msg;
  };

  // al salir del campo: solo si ya escribió algo (no regañar por pasar con Tab sin escribir)
  const onBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    if (value.trim() || errors[name as Name]) check(name as Name, value);
  };
  // mientras corrige: el error desaparece apenas el valor queda bien
  const onInput = (e: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    if (errors[name as Name]) check(name as Name, value);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const get = (k: Name) => String(data.get(k) ?? "").trim();

    // validar todo; el primero con error recibe el foco
    const next: Partial<Record<Name, string>> = {};
    for (const f of FIELDS) {
      const msg = f.validate(get(f.name));
      if (msg) next[f.name] = msg;
    }
    setErrors(next);
    const first = FIELDS.find((f) => next[f.name]);
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first.name}"]`)?.focus();
      setStatus("idle");
      return;
    }

    const token = tokenRef.current;
    if (!CONTACT_ENDPOINT) {
      log("falta NEXT_PUBLIC_CONTACT_ENDPOINT: no se envía");
      setStatus("error");
      return;
    }
    if (!token) {
      log("sin token de Turnstile todavía: no se envía");
      setStatus("captcha");
      return;
    }

    // valores escapados: la Function inserta los placeholders tal cual en el HTML
    const ph = {
      nombre: escapeHtml(get("nombre")),
      empresa: escapeHtml(get("empresa") || "-"),
      correo: escapeHtml(get("correo")),
      telefono: escapeHtml(get("telefono") || "-"),
      mensaje: escapeHtml(get("mensaje")),
    };
    const userPayload = {
      templateB64: toBase64(USER_TEMPLATE),
      subject: "Recibimos tu mensaje — Oriont",
      to: [get("correo")],
      fromAlias: MAIL_FROM_ALIAS,
      provider: MAIL_PROVIDER,
      placeholders: ph,
    };
    const adminPayload = {
      templateB64: toBase64(ADMIN_TEMPLATE),
      subject: `Contacto web — ${get("nombre")}${get("empresa") ? ` (${get("empresa")})` : ""}`,
      to: [MAIL_ADMIN_TO],
      fromAlias: MAIL_FROM_ALIAS,
      provider: MAIL_PROVIDER,
      placeholders: ph,
    };

    setStatus("sending");
    const secs = (Date.now() - loadTime.current) / 1000;
    log("enviando a", CONTACT_ENDPOINT, {
      mensajes: [userPayload, adminPayload].map((m) => ({ to: m.to, subject: m.subject, fromAlias: m.fromAlias, provider: m.provider })),
      segundosDesdeCarga: Math.round(secs * 10) / 10, // MailSender bloquea si son menos de 3
      honeypotVacio: !data.get("_hp"),
    });
    if (secs < 3) log("ATENCIÓN: menos de 3 s desde la carga: MailSender lo va a bloquear (too_fast)");
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken: token,
          _hp: String(data.get("_hp") ?? ""),
          _ts: String(loadTime.current),
          messages: [userPayload, adminPayload],
        }),
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text().catch(() => "");
      log("respuesta", res.status, text, res.ok ? "(recibido por la Function; si no llega el correo, revisar sus logs)" : "");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setStatus("sent");
    } catch (err) {
      // TypeError "Failed to fetch" = red o CORS (el origen no está permitido en la Function)
      log("ERROR al enviar", err);
      setStatus("error");
    } finally {
      // cada token sirve una sola vez: pedir uno nuevo para el próximo envío
      tokenRef.current = null;
      if (widgetRef.current) window.turnstile?.reset(widgetRef.current);
    }
  };

  const errorCount = Object.values(errors).filter(Boolean).length;
  const email = ABOUT_CTA.contact[1].value;
  // mismo estilo que el enlace a la política de privacidad, para que las dos líneas se vean iguales
  const linkClass = "underline underline-offset-2 transition-colors hover:text-[#248caa]";
  const mailLink = (
    <a href={`mailto:${email}`} className={linkClass}>
      {email}
    </a>
  );
  const statusText = errorCount
    ? errorCount === 1
      ? "Falta completar o corregir 1 campo."
      : `Faltan completar o corregir ${errorCount} campos.`
    : {
        idle: <>También puedes escribirnos a {mailLink}.</>,
        captcha: "Completa la verificación de seguridad antes de enviar.",
        sending: "Enviando tu mensaje…",
        sent: "¡Gracias! Recibimos tu mensaje y te responderemos pronto.",
        error: <>No pudimos enviar el mensaje. Intenta de nuevo o escríbenos a {mailLink}.</>,
      }[status];
  const statusBad = errorCount > 0 || status === "captcha" || status === "error";

  // Campo con etiqueta flotante: `peer` para que la etiqueta (que va DESPUÉS en el DOM) sepa si el
  // campo tiene foco o texto. El ejemplo (placeholder) solo se ve con foco, para no chocar con la
  // etiqueta. El autocompletado del navegador pinta el campo de azul: se tapa con sombra interna.
  const field = (bad: boolean) =>
    `peer w-full rounded-xl border bg-white px-4 py-3 text-[14px] text-[#21255c] outline-none transition placeholder:text-transparent focus:ring-4 focus:placeholder:text-[#21255c]/35 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_white] [&:-webkit-autofill]:[-webkit-text-fill-color:#21255c] 2xl:py-3.5 2xl:text-[16px] ${
      bad
        ? "border-[#c2410c]/70 focus:border-[#c2410c] focus:ring-[#c2410c]/15"
        : "border-[#21255c]/15 hover:border-[#21255c]/30 focus:border-[#248caa] focus:ring-[#248caa]/15"
    }`;
  // Etiqueta: en reposo, dentro del campo a la altura del texto; con foco o texto escrito sube y
  // se posa sobre el borde de arriba (fondo blanco que corta la línea), más chica y en color.
  // Se anima `top` de un elemento absoluto: no mueve nada más de la página.
  const label = (bad: boolean) =>
    `pointer-events-none absolute left-3 top-[22px] flex -translate-y-1/2 items-center gap-1 bg-white px-1 text-[14px] leading-none transition-all duration-200 ease-out 2xl:top-[26px] 2xl:text-[16px]
     peer-focus:top-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[11px] 2xl:peer-focus:top-0 2xl:peer-focus:text-[12px] 2xl:peer-[:not(:placeholder-shown)]:top-0 2xl:peer-[:not(:placeholder-shown)]:text-[12px] ${
       bad ? "text-[#c2410c]" : "text-[#21255c]/50 peer-focus:text-[#248caa]"
     }`;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`relative w-full rounded-3xl bg-white p-6 text-left shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)] sm:p-8 2xl:p-10 lg:short:p-6 ${className}`}
    >
      {/* Aviso de enviado: cubre el formulario (absoluto, sin mover nada de la página) con un
          fundido. Antes solo cambiaba el texto gris junto al botón y pasaba desapercibido. */}
      <div
        role="status"
        aria-hidden={status !== "sent"}
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit] bg-white p-8 text-center transition-opacity duration-300 ${
          status === "sent" ? "opacity-100" : "pointer-events-none invisible opacity-0"
        }`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#248caa]/12 text-[#248caa]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <p className="mt-5 font-display text-[24px] font-semibold leading-tight text-[#21255c] 2xl:text-[30px]">
          ¡Mensaje enviado correctamente!
        </p>
      </div>

      <p className="font-display text-[22px] font-semibold leading-tight text-[#21255c] 2xl:text-[28px]">
        {CONTACT_FORM.title}
      </p>
      <p className="mt-1.5 text-[14px] text-[#21255c]/60 2xl:text-[16px]">{CONTACT_FORM.text}</p>
      <p className="mt-1 text-[12px] text-[#21255c]/45">
        Los campos con <span className="text-[#248caa]">*</span> son obligatorios.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:gap-5 lg:short:mt-4 lg:short:gap-3">
        {FIELDS.map((f) => {
          const inputId = `${id}-${f.name}`;
          const errId = `${inputId}-error`;
          const err = errors[f.name];

          // Elementos requeridos dentro del input tambien hace la animacion
          const common = {
            id: inputId,
            name: f.name,
            required: f.required,
            maxLength: f.maxLength,
            placeholder: f.placeholder,
            autoComplete: f.autoComplete,
            "aria-required": f.required,
            "aria-invalid": err ? true : undefined,
            "aria-describedby": err ? errId : undefined,
            onBlur,
            onInput,
          };

          return (
            <div key={f.name} className={f.wide ? "sm:col-span-2" : undefined}>
              {/* el campo va primero (peer) y la etiqueta después, encima, flotando */}
              <div className="relative">
                {f.type === "textarea" ? (
                  // texto multilínea (mensaje): 4 filas de alto, sin tirador para no mover el layout
                  <textarea {...common} rows={4} className={`${field(!!err)} resize-none lg:short:h-16`} />
                ) : (
                  // una sola línea: `type` valida el formato y `inputMode` elige el teclado en móvil
                  <input {...common} type={f.type} inputMode={f.inputMode} className={field(!!err)} />
                )}
                <label htmlFor={inputId} className={label(!!err)}>
                  {/* seccion del input texto */}
                  {f.label}

                  {/* elementos requeridos */}
                  {f.required && (
                    <span aria-hidden className="text-[#248caa]">*</span>
                  )}

                </label>
              </div>
              {/* alto reservado solo cuando hay error: aparece debajo sin mover lo de al lado */}
              {err && (
                <p id={errId} className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#c2410c]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5 shrink-0" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.5v5.5M12 16.5v.01" />
                  </svg>
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* honeypot anti-spam: invisible para personas; si un bot lo llena, la Function descarta el envío */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {/* widget de Cloudflare Turnstile: alto reservado (65 px; 140 px el compacto de celular) para
          que al cargar no mueva el layout. El alto se fija al medir, ~200 px antes de verse */}
      {TURNSTILE_SITE_KEY && (
        <div className={`mt-5 lg:short:mt-3 ${compact ? "min-h-35" : "min-h-16.25"}`}>
          <div ref={boxRef} />
          {captchaFailed && (
            <p className="text-[12px] text-[#c2410c]">
              No se pudo cargar la verificación de seguridad. Recarga la página o escríbenos a {mailLink}.
            </p>
          )}
        </div>
      )}

      {/* Texto de estado + botón sin saltos: antes era una fila flex-wrap y, según el largo del
          texto ("También puedes escribirnos…", "Enviando…", "¡Gracias!…"), el botón bajaba o
          subía de línea al enviar. Ahora la disposición depende del ancho del formulario (container
          query), no del texto: angosto = texto arriba y botón abajo; ancho = texto a la izquierda.
          El texto reserva 3 líneas y el botón mide siempre lo de "Enviar mensaje". */}
      <div className="@container mt-6 lg:short:mt-4">
        <div className="grid items-center gap-3 @sm:grid-cols-[minmax(0,1fr)_auto] @sm:gap-4">
          {/* aria-live: el lector de pantalla anuncia el resultado al enviar */}
          <p
            aria-live="polite"
            className={`flex min-h-[3lh] items-center text-[12px] leading-snug 2xl:text-[13px] ${statusBad ? "text-[#c2410c]" : "text-[#21255c]/50"}`}
          >
            {/* span: con flex, el texto y el enlace serían ítems separados y no fluirían juntos */}
            <span>{statusText}</span>
          </p>

          <button
            type="submit"
            disabled={status === "sending"}
            aria-busy={status === "sending"}
            className="group inline-flex cursor-pointer items-center gap-2 justify-self-end rounded-full bg-[#21255c] py-2 pl-5 pr-2 text-[14px] font-medium text-[#f5f0e6] transition hover:bg-[#2c3175] disabled:cursor-wait disabled:opacity-70 2xl:py-2.5 2xl:pl-6 2xl:text-[16px]"
          >
            {/* las dos etiquetas apiladas: el botón toma el ancho de la más larga y no cambia */}
            <span className="grid">
              <span aria-hidden className="invisible col-start-1 row-start-1">
                Enviar mensaje
              </span>
              <span className="col-start-1 row-start-1 text-center">{status === "sending" ? "Enviando…" : "Enviar mensaje"}</span>
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#248caa] transition group-hover:translate-x-0.5">→</span>
          </button>
        </div>
      </div>

      {/* aviso de consentimiento (Ley 21.719): siempre visible, así no aparece y mueve nada.
          Pestaña nueva: el formulario puede estar en el panel y no se pierde lo escrito.
          En pantallas bajas el mensaje se achica (h-16) para que la tarjeta siga cabiendo en 1280×600 */}
      <p className="mt-3 lg:short:mt-1.5 text-[12px] leading-snug text-[#21255c]/50 2xl:text-[13px]">
        Al enviar aceptas que usemos tus datos para responderte, según nuestra{" "}
        <a href="/privacidad" target="_blank" rel="noopener" className={linkClass}>
          política de privacidad
        </a>
        .
      </p>
    </form>
  );
}
