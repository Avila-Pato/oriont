"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { Flip as FlipPlugin } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { TEAM_CARDS } from "@/data/about";
import { useNearViewport } from "@/hooks/useNearViewport";
import TeamCard from "./TeamCard";
import { COLORS } from "@/data/colors";

gsap.registerPlugin(useGSAP);

/**
 * Flip (~14 KB) solo hace falta al revolver, y la grilla está al final de la página: se baja aparte
 * (import dinámico) cuando la grilla se acerca a la pantalla, no en la carga inicial.
 */
let Flip: typeof FlipPlugin | null = null;
let flipLoading: Promise<typeof FlipPlugin> | null = null;
const loadFlip = () =>
  (flipLoading ??= import("gsap/Flip").then((m) => {
    gsap.registerPlugin(m.Flip);
    return (Flip = m.Flip);
  }));


type MotionPermission = "granted" | "denied";
type DeviceMotionEventIOS = typeof DeviceMotionEvent & { requestPermission?: () => Promise<MotionPermission> };
// "silent": el navegador tiene la API pero no entrega datos (Brave bloquea los sensores de
// movimiento por defecto): se ofrece tocar la burbuja en vez de agitar
type Sensor = "unknown" | "unsupported" | "needs-permission" | "on" | "denied" | "silent";

const SHAKE_DELTA = 14; // m/s² de cambio brusco entre lecturas para contar como sacudida (bajo = más sensible)
const SHAKE_HITS = 2; // sacudidas seguidas necesarias (evita disparos al caminar)
const SHAKE_WINDOW = 800; // ms en que deben ocurrir esas sacudidas
const COOLDOWN = 1300;
const SILENT_AFTER = 2000; // ms sin lecturas del sensor para darlo por bloqueado
const DURATION = 0.75; // s que dura el viaje de cada foto
const MAX_DELAY = 0.18; // s de desfase máximo entre fotos (que no salten todas a la vez) // ms mínimos entre revueltas
const MESSAGES = [
  "¡Así somos en Oriont!",
  "Otra vez, otra vez",
  "Equipo revuelto, mismas ganas",
  "Ya nos conoces mejor",
  "¡Con todo!",
];

const shuffle = (arr: number[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // que siempre se note el cambio
  return a.every((v, i) => v === arr[i]) ? [...a.slice(1), a[0]] : a;
};

export default function ShakeTeamGrid() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<ReturnType<typeof FlipPlugin.getState> | null>(null);
  const busy = useRef(false);
  const delays = useRef(new Map<HTMLElement, number>()); // retraso de cada foto en la revuelta
  const visible = useRef(false);

  const [order, setOrder] = useState(() => TEAM_CARDS.map((_, i) => i));
  const [sensor, setSensor] = useState<Sensor>("unknown");
  const shakes = useRef(0); // revueltas hechas: elige el mensaje siguiente
  const [msg, setMsg] = useState<string | null>(null);

  // el mensaje dura un rato y la burbuja vuelve a "escribir"
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);

  // al desmontar, GSAP limpia las animaciones creadas en este alcance
  useGSAP(() => {}, { scope: root });
  const shakeRef = useRef<() => void>(() => {});

  // Flip se pide cuando la grilla está a una pantalla de distancia: al revolver ya está listo
  const near = useNearViewport(root);
  useEffect(() => {
    if (near) void loadFlip();
  }, [near]);

  /**
   * La revuelta, en un solo movimiento continuo (sin pausa entre "saltar" y "cambiar de lugar"):
   * - capa [data-card]: Flip la lleva de su celda vieja a la nueva
   * - capa [data-tilt]: al mismo tiempo hace el arco (sube y baja), gira y crece un poco
   * Ambas usan el mismo retraso por foto, así el arco y el viaje van sincronizados.
   */
  const shake = () => {
    if (busy.current || !grid.current) return;
    // caso raro: revolvieron antes de que llegara Flip (red muy lenta): se revuelve al llegar
    const F = Flip;
    if (!F) {
      void loadFlip().then(() => shakeRef.current());
      return;
    }
    busy.current = true;
    navigator.vibrate?.([40, 30, 60]);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = gsap.utils.toArray<HTMLElement>("[data-card]", grid.current);

    delays.current = new Map(cards.map((c) => [c, reduce ? 0 : gsap.utils.random(0, MAX_DELAY)]));
    flipState.current = F.getState(cards);
    setOrder((o) => shuffle(o));
    setMsg(MESSAGES[shakes.current++ % MESSAGES.length]);
    gsap.delayedCall(reduce ? 0.3 : DURATION + MAX_DELAY, () => (busy.current = false));

    if (reduce) return;
    cards.forEach((card) => {
      const tilt = card.querySelector<HTMLElement>("[data-tilt]");
      if (!tilt) return;
      const spin = gsap.utils.random(-22, 22);
      gsap.to(tilt, {
        keyframes: { yPercent: [0, -28, 0], rotation: [0, spin, 0], scale: [1, 1.1, 1] },
        duration: DURATION,
        delay: delays.current.get(card),
        ease: "none",
        easeEach: "sine.inOut",
        overwrite: "auto",
      });
    });
  };

  useEffect(() => {
    shakeRef.current = shake;
  });

  // tras re-renderizar con el nuevo orden: cada foto vuela desde donde estaba a su nueva celda
  useLayoutEffect(() => {
    const state = flipState.current;
    const F = Flip;
    if (!state || !grid.current || !F) return;
    flipState.current = null;
    const cards = gsap.utils.toArray<HTMLElement>("[data-card]", grid.current);
    const delay = delays.current;
    F.from(state, {
      targets: cards,
      scale: true, // escala en vez de width/height: solo transform
      duration: DURATION,
      ease: "power2.inOut",
      stagger: (_i: number, el: Element) => delay.get(el as HTMLElement) ?? 0,
    });
  }, [order]);

  // ¿hay sensor? (se decide en el cliente para no desajustar la hidratación)
  useEffect(() => {
    const DME = (typeof window !== "undefined" ? window.DeviceMotionEvent : undefined) as DeviceMotionEventIOS | undefined;
    // solo celulares: pantalla táctil y angosta (en tablet la grilla queda quieta)
    const coarse = window.matchMedia("(pointer: coarse) and (max-width: 767px)").matches;
    const next: Sensor =
      !DME || !window.isSecureContext || !coarse
        ? "unsupported"
        : typeof DME.requestPermission === "function"
          ? "needs-permission"
          : "on";
    const t = setTimeout(() => setSensor(next), 0);
    return () => clearTimeout(t);
  }, []);

  // solo se escucha el sensor mientras la grilla está en pantalla
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** iOS (y Chrome/Brave recientes en Android) piden permiso: solo se puede pedir en un toque */
  const askPermission = async () => {
    const DME = window.DeviceMotionEvent as DeviceMotionEventIOS;
    try {
      const res = await DME.requestPermission!();
      setSensor(res === "granted" ? "on" : "denied");
      return res === "granted";
    } catch {
      setSensor("denied");
      return false;
    }
  };

  // Mientras falte el permiso, el primer toque en cualquier parte de la sección lo pide
  // (la burbuja no tiene texto: no se puede esperar que la toquen a ella justo)
  useEffect(() => {
    const el = root.current;
    if (sensor !== "needs-permission" || !el) return;
    const onTap = () => void askPermission();
    el.addEventListener("click", onTap, { once: true });
    return () => el.removeEventListener("click", onTap);
  });

  // lectura del acelerómetro: sacudidas + inclinación. Se escucha también mientras falta el
  // permiso: en Android los datos llegan igual sin pedirlo; en iOS empiezan al concederlo.
  useEffect(() => {
    if ((sensor !== "on" && sensor !== "needs-permission") || !grid.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tilters = gsap.utils.toArray<HTMLElement>("[data-tilt]", grid.current);
    const moveX = tilters.map((t) => gsap.quickTo(t, "x", { duration: 0.6, ease: "power3.out" }));
    const moveY = tilters.map((t) => gsap.quickTo(t, "y", { duration: 0.6, ease: "power3.out" }));
    const depth = tilters.map(() => gsap.utils.random(0.6, 1.4));

    let last: { x: number; y: number; z: number } | null = null;
    // Brave (y otros con los sensores bloqueados) no manda eventos, o los manda con valores nulos:
    // si no llega ninguna lectura real en un rato, se pasa a "toca para revolver"
    let gotData = false;
    const silentTimer =
      sensor === "on" ? setTimeout(() => !gotData && setSensor("silent"), SILENT_AFTER) : undefined;
    let hits: number[] = [];
    let lastShake = 0;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      gotData = true;
      if (!visible.current) return;
      const now = performance.now();
      if (last) {
        const d = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z);
        if (d > SHAKE_DELTA) {
          hits = [...hits.filter((t) => now - t < SHAKE_WINDOW), now];
          if (hits.length >= SHAKE_HITS && now - lastShake > COOLDOWN) {
            lastShake = now;
            hits = [];
            shakeRef.current();
          }
        }
      }
      last = { x: a.x, y: a.y, z: a.z };
      // inclinación: la gravedad reparte ~9.8 m/s² entre los ejes según cómo se sostiene
      if (!reduce && !busy.current) {
        const tx = gsap.utils.clamp(-1, 1, -a.x / 5);
        const ty = gsap.utils.clamp(-1, 1, (a.y - 7) / 5); // ~7 = celular sostenido normal
        tilters.forEach((_, i) => {
          moveX[i](tx * 7 * depth[i]);
          moveY[i](ty * 5 * depth[i]);
        });
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => {
      clearTimeout(silentTimer);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [sensor]);

  // en la burbuja el toque además revuelve (el permiso, si falta, lo pide el efecto de arriba)
  const onButton = () => shake();

  // Toque en una foto: rebota y queda levantada (sube y crece un poco). Tocar otra baja la
  // anterior; tocar la misma la baja. Tweens de transform sobre su propia capa ([data-pop]),
  // así no pelea con la revuelta ni la inclinación. Solo transform: barato en celular.
  const lifted = useRef<HTMLElement | null>(null);
  const lower = (pop: HTMLElement) => {
    gsap.to(pop, { y: 0, scale: 1, duration: 0.35, ease: "power3.out", overwrite: true });
    // vuelve a su capa cuando termina de bajar (si no, tapa a las vecinas mientras baja)
    const card = pop.closest<HTMLElement>("[data-card]");
    if (card) gsap.delayedCall(0.35, () => lifted.current?.closest("[data-card]") !== card && gsap.set(card, { zIndex: "auto" }));
  };
  const onCardTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const pop = (e.target as HTMLElement).closest<HTMLElement>("[data-pop]");
    if (!pop) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prev = lifted.current;
    if (prev) lower(prev);
    lifted.current = null;
    if (prev === pop) return; // segundo toque: solo baja
    lifted.current = pop;
    navigator.vibrate?.(8);
    // por encima de las vecinas (las celdas son hermanas: el z-index va en la celda)
    gsap.set(pop.closest("[data-card]"), { position: "relative", zIndex: 5 });
    const up = { y: -10, scale: 1.08 };
    if (reduce) gsap.set(pop, up);
    else gsap.fromTo(pop, { y: 0, scale: 0.92 }, { ...up, duration: 0.6, ease: "elastic.out(1, 0.5)", overwrite: true });
  };

  // el texto solo lo leen los lectores de pantalla; a la vista va el "escribiendo…"
  const label =
    sensor === "needs-permission"
      ? "Activar movimiento y revolver las fotos"
      : sensor === "on"
        ? "Agita tu celular para revolver las fotos"
        : "Revolver las fotos";

  return (
    <div ref={root} className="relative mt-10 flex w-full flex-col items-center sm:mt-12">
      {/* burbuja: ícono de celular sacudiéndose ("agítalo"); tras revolver, responde con un mensaje */}
      <button
        type="button"
        onClick={onButton}
        aria-label={label}
        className="inline-flex h-10 touch-manipulation items-center rounded-full rounded-bl-md md:hidden border border-navy/15 bg-white/80 px-4 text-[13px] font-medium text-navy shadow-[0_10px_30px_-15px_rgba(33,37,92,0.4)] backdrop-blur-xl transition-transform active:scale-95"
      >
        <span aria-live="polite">
          {msg ?? (sensor === "silent" ? (
            "Toca para revolver"
          ) : (
            <svg width="34" height="22" viewBox="0 0 34 22" fill="none" aria-hidden="true" className="block">
              {/* ondas de movimiento a los lados */}
              <g
                stroke={COLORS.accent}
                strokeWidth="1.6"
                strokeLinecap="round"
                className="origin-center motion-safe:animate-shake-waves"
              >
                <path d="M6.5 7.5c-1.4 2-1.4 5 0 7" />
                <path d="M3 5c-2.4 3.4-2.4 8.6 0 12" opacity="0.5" />
                <path d="M27.5 7.5c1.4 2 1.4 5 0 7" />
                <path d="M31 5c2.4 3.4 2.4 8.6 0 12" opacity="0.5" />
              </g>
              {/* celular */}
              <g className="origin-center motion-safe:animate-phone-shake">
                <rect x="11.5" y="2" width="11" height="18" rx="2.5" stroke={COLORS.navy} strokeWidth="1.6" />
                <path d="M15.5 4.6h3" stroke={COLORS.navy} strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="17" cy="16.8" r="0.9" fill={COLORS.accent} />
              </g>
            </svg>
          ))}
        </span>
      </button>

      <div
        ref={grid}
        onClick={onCardTap}
        className="relative mt-6 grid w-full md:mt-0 shrink-0 grid-cols-3 gap-x-3 gap-y-4 sm:gap-x-6 sm:gap-y-6 md:w-[calc(100vw-4rem)] md:max-w-225 md:grid-cols-4"
      >
        {order.map((i) => (
          <div key={i} data-card>
            <div data-tilt>
              <div data-pop className="touch-manipulation">
                <TeamCard card={TEAM_CARDS[i]} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
