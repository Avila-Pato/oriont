"use client";

import { useEffect, useRef } from "react";
import { COUNTRIES, type CountryCode } from "@/data/countries";
import { watchVisible } from "@/hooks/useNearViewport";
// puntos de tierra precalculados por scripts/build-globe-dots.mjs (npm run globe:dots)
import DOTS from "@/data/globe-dots.json";

type Vec = [number, number, number];
type Dot = { v: Vec; c: CountryCode | null };

const DEG = Math.PI / 180;
const LINE = "33,37,92"; // marino de la marca: órbitas, rutas, marcadores
const DOT = "33,37,92"; // partículas de los continentes
const GLOW = "36,140,170"; // celeste petróleo de la marca: países y pulsos

const CODES: CountryCode[] = COUNTRIES.map((c) => c.code);

function toVec(lat: number, lon: number): Vec {
  const c = Math.cos(lat * DEG);
  return [c * Math.sin(lon * DEG), Math.sin(lat * DEG), c * Math.cos(lon * DEG)];
}

/**
 * Expande los tramos precalculados a puntos 3D. Antes se rasterizaba el mapa en el navegador
 * al cargar (tarea larga en el hilo principal); ahora es un recorrido simple de ~18.000 puntos.
 */
function loadLandDots(): Dot[] {
  const { step, lat0, codes, rows } = DOTS as { step: number; lat0: number; codes: string[]; rows: number[][] };
  const pts: Dot[] = [];
  rows.forEach((runs, r) => {
    const lat = lat0 + r * step;
    const n = Math.max(1, Math.round((360 * Math.cos(lat * DEG)) / step));
    for (let k = 0; k < runs.length; k += 3) {
      const code = runs[k + 2] >= 0 ? (codes[runs[k + 2]] as CountryCode) : null;
      for (let i = runs[k]; i < runs[k] + runs[k + 1]; i++) pts.push({ v: toVec(lat, -180 + (i / n) * 360), c: code });
    }
  });
  return pts;
}

function slerp(a: Vec, b: Vec, t: number): Vec {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  if (om < 1e-4) return a;
  const s = Math.sin(om);
  const k1 = Math.sin((1 - t) * om) / s;
  const k2 = Math.sin(t * om) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

// `label` en mayúsculas ya calculado: no se rehace en cada cuadro
const CITIES = COUNTRIES.map((c) => ({ code: c.code, name: c.city, label: c.city.toUpperCase(), hq: !!c.hq, v: toVec(c.lat, c.lon) }));
// red radial: todas las rutas salen de la sede principal
const HUB = Math.max(0, CITIES.findIndex((c) => c.hq));
const SPOKES = CITIES.map((_, i) => i).filter((i) => i !== HUB);
// rutas principales (sede → oficina) y secundarias entre oficinas
const ROUTES: { pair: [number, number]; main: boolean }[] = [
  ...SPOKES.map((i) => ({ pair: [HUB, i] as [number, number], main: true })),
  ...SPOKES.flatMap((i, k) => SPOKES.slice(k + 1).map((j) => ({ pair: [i, j] as [number, number], main: false }))),
];

/** tamaño del canvas respecto del contenedor del globo (HeroGlobe: left/top -14%, w/h 128%) */
export const CANVAS_SCALE = 1.28;

type Props = {
  className?: string;
  /** país resaltado (hover o seleccionado) */
  active?: CountryCode | null;
  /** país seleccionado: el globo gira hacia él */
  focus?: CountryCode | null;
  onHover?: (code: CountryCode | null) => void;
  onSelect?: (code: CountryCode | null) => void;
  /** se llama una vez, cuando el canvas pinta su primer frame */
  onReady?: () => void;
};

/** duración de la entrada: el globo se materializa de abajo hacia arriba */
const INTRO_MS = 2400;
/** ancho (en radios) de la franja brillante justo bajo el frente de escaneo */
const INTRO_BAND = 0.16;
/** pasadas del soplete (de derecha a izquierda) mientras se arma la esfera */
const WELD_PASSES = 5;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
/** pseudoaleatorio estable por índice (0..1) */
const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export default function Globe({ className = "", active = null, focus = null, onHover, onSelect, onReady }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ active, focus, onHover, onSelect, onReady });

  useEffect(() => {
    live.current = { active, focus, onHover, onSelect, onReady };
  }, [active, focus, onHover, onSelect, onReady]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const COARSE = window.matchMedia("(pointer: coarse)").matches;
    const points = loadLandDots();
    // Datos de los puntos en arreglos contiguos (el bucle de dibujo los recorre ~18.000 veces por
    // frame): coordenadas, país (índice en CODES, -1 = ninguno) y la fase del destello de cada uno
    // ya en seno/coseno, para no llamar a Math.sin por punto en cada frame.
    const N = points.length;
    const PX = new Float32Array(N);
    const PY = new Float32Array(N);
    const PZ = new Float32Array(N);
    const PCODE = new Int8Array(N);
    const TW_SIN = new Float32Array(N);
    const TW_COS = new Float32Array(N);
    points.forEach((p, i) => {
      [PX[i], PY[i], PZ[i]] = p.v;
      PCODE[i] = p.c ? CODES.indexOf(p.c) : -1;
      TW_SIN[i] = Math.sin(i * 12.9898);
      TW_COS[i] = Math.cos(i * 12.9898);
    });
    // desfase de cada punto respecto del frente de escaneo: el borde queda irregular, "digital"
    const jitter = Float32Array.from(points, (_, i) => hash(i) * 0.03);
    // búferes de pantalla reutilizados entre frames (antes se creaban arreglos nuevos en cada
    // frame y el recolector de basura trabajaba de más): x, y por punto, con su cantidad usada
    const BUCKETS = 10;
    const inkBuf = Array.from({ length: BUCKETS }, () => new Float32Array(N * 2));
    const inkLen = new Int32Array(BUCKETS);
    const countryBuf = CODES.map(() => new Float32Array(N * 2));
    const countryLen = new Int32Array(CODES.length);
    const freshBuf = new Float32Array(N * 3); // x, y, intensidad
    let freshLen = 0;
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
    const monoFont = `${mono ? mono + ", " : ""}ui-monospace, monospace`;
    // Fuentes de las etiquetas armadas una sola vez. Asignar ctx.font obliga al navegador a
    // interpretar el texto de la fuente (en Firefox era ~40 ms en un recorrido): se asigna solo
    // cuando cambia (setFont) y no una o dos veces por ciudad en cada cuadro.
    const FONT_CITY = `500 11px ${monoFont}`;
    const FONT_CITY_STRONG = `700 12px ${monoFont}`;
    const FONT_HQ = `600 9px ${monoFont}`;
    let lastFont = "";
    const setFont = (f: string) => {
      if (f !== lastFont) {
        ctx.font = f;
        lastFont = f;
      }
    };

    const arcs = ROUTES.map(({ pair: [i, j], main }, k) => {
      const a = CITIES[i].v;
      const b = CITIES[j].v;
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const dist = Math.acos(Math.min(1, Math.max(-1, dot)));
      return { a, b, main, codes: [CITIES[i].code, CITIES[j].code], lift: 0.04 + dist * 0.35, offset: k / ROUTES.length };
    });

    let w = 0;
    let h = 0;
    let dpr = 1;
    // El tamaño llega del ResizeObserver (ya calculado tras el layout): antes se llamaba a
    // getBoundingClientRect en el montaje, lo que forzaba un reflow síncrono recién hidratado.
    // El primer callback llega antes del primer paint, así que no se ve un frame vacío.
    const resize = ([entry]: ResizeObserverEntry[]) => {
      // En táctil, tope 1,5: a este tamaño no se distingue de 2 y son ~44 % menos píxeles que
      // pintar por frame (en el perfil, pintar el canvas era la mayor parte del trabajo)
      dpr = Math.min(window.devicePixelRatio || 1, COARSE ? 1.5 : 2);
      w = entry.contentRect.width;
      h = entry.contentRect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // Capas fijas de la esfera (atmósfera + cuerpo detrás de los puntos; sombra + brillo del borde
    // delante), pintadas UNA vez en canvas ocultos. Antes se rehacían 4 degradados radiales grandes
    // en cada frame; ahora cada frame solo las copia (drawImage). Solo dependen del radio: se
    // generan al radio máximo (hover + zoom de país) y se copian escaladas, siempre hacia abajo.
    const SPRITE_MAX = 1.05 * 1.18;
    let sprR = 0;
    let sprDpr = 0;
    const back = document.createElement("canvas");
    const front = document.createElement("canvas");
    const makeSprites = (Rs: number) => {
      sprR = Rs;
      sprDpr = dpr;
      const ATMO = 1.18;
      back.width = back.height = Math.ceil(2 * Rs * ATMO * dpr);
      const b = back.getContext("2d")!;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      const o = back.width / dpr / 2;
      const atmo = b.createRadialGradient(o, o, Rs * 0.96, o, o, Rs * ATMO);
      atmo.addColorStop(0, `rgba(${LINE},0.08)`);
      atmo.addColorStop(1, `rgba(${LINE},0)`);
      b.fillStyle = atmo;
      b.beginPath();
      b.arc(o, o, Rs * ATMO, 0, Math.PI * 2);
      b.fill();
      // esfera clara (blanco → gris azulado), en la familia del fondo #F8F9F9
      const body = b.createRadialGradient(o - Rs * 0.35, o - Rs * 0.4, Rs * 0.05, o, o, Rs);
      body.addColorStop(0, "#ffffff");
      body.addColorStop(0.55, "#f3f5f8");
      body.addColorStop(0.88, "#e3e8ef");
      body.addColorStop(1, "#d2d9e3");
      b.fillStyle = body;
      b.beginPath();
      b.arc(o, o, Rs, 0, Math.PI * 2);
      b.fill();

      // volumen: luz a la derecha, sombra a la izquierda (recortado a la esfera)
      front.width = front.height = Math.ceil(2 * Rs * dpr);
      const f = front.getContext("2d")!;
      f.setTransform(dpr, 0, 0, dpr, 0, 0);
      const c = front.width / dpr / 2;
      f.beginPath();
      f.arc(c, c, Rs, 0, Math.PI * 2);
      f.clip();
      const shade = f.createRadialGradient(c + Rs * 0.25, c - Rs * 0.15, Rs * 0.75, c + Rs * 0.25, c - Rs * 0.15, Rs * 1.3);
      shade.addColorStop(0, "rgba(33,37,92,0)");
      shade.addColorStop(1, "rgba(33,37,92,0.14)");
      f.fillStyle = shade;
      f.fillRect(c - Rs, c - Rs, Rs * 2, Rs * 2);
      const rim = f.createRadialGradient(c - Rs * 0.12, c, Rs * 0.92, c - Rs * 0.12, c, Rs * 1.12);
      rim.addColorStop(0, "rgba(255,255,255,0)");
      rim.addColorStop(1, "rgba(255,255,255,0.9)");
      f.fillStyle = rim;
      f.fillRect(c - Rs, c - Rs, Rs * 2, Rs * 2);
    };
    /** copia una capa centrada en (cx, cy) para el radio R actual */
    const blit = (spr: HTMLCanvasElement, cx: number, cy: number, R: number) => {
      const s = (spr.width / dpr) * (R / sprR);
      ctx.drawImage(spr, cx - s / 2, cy - s / 2, s, s);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // --- estado ---
    const BASE_TILT = -0.15;
    let rot = -72 * DEG;
    let tilt = BASE_TILT;
    let velRot = 0;
    let velTilt = 0;
    let dragging = false;
    let moved = false;
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let mouse: { x: number; y: number } | null = null;
    let touch = false; // el último puntero fue un dedo/lápiz (no mouse)
    let hover = 0;
    let zoom = 0;
    let focusZoom = 0;
    let magCode: CountryCode | null = null; // país ampliado (se mantiene mientras la lupa se cierra)
    const MAG = 0.25; // cuánto crece el país al pasar el cursor (0.25 → 1.25×)
    const LIFT = 6; // px que se eleva el país al pasar el cursor
    let hovered: CountryCode | null = null;
    let raf = 0;
    let last = performance.now();
    let lastCursor = "";
    let cosT = Math.cos(tilt);
    let sinT = Math.sin(tilt);
    const AUTO = 0.00001; // velocidad de giro solo (rad/ms ≈ 0,6°/s)
    let introStart = 0; // momento del primer frame con tamaño (0 = aún no)
    // chispas de la entrada ("soldadura" del frente): x, y, vx, vy en px y px/ms; vida en ms
    const sparks: { x: number; y: number; vx: number; vy: number; life: number; max: number }[] = [];

    const setHovered = (c: CountryCode | null) => {
      if (c === hovered) return;
      hovered = c;
      live.current.onHover?.(c);
    };

    const localPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    // Los toques se escuchan en el contenedor del globo (no en el canvas, que es 28% más grande
    // y se sale por abajo de los botones): así el área interactiva termina en los botones y bajo
    // ellos el dedo vuelve a hacer scroll. El contenedor lleva touch-action: none en celular.
    const hit = canvas.parentElement ?? canvas;
    // lo que pasa sobre los botones de países (hijos del contenedor) no es del globo
    const own = (e: PointerEvent) => e.target === hit || e.target === canvas;
    const onDown = (e: PointerEvent) => {
      if (!own(e)) return;
      dragging = true;
      moved = false;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      // en táctil no hay "hover" previo: el punto del toque sirve para saber qué país se tocó
      mouse = localPos(e);
      touch = e.pointerType !== "mouse";
      velRot = 0;
      velTilt = 0;
      hit.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging && !own(e)) {
        if (mouse) onLeave();
        return;
      }
      mouse = localPos(e);
      if (e.pointerType === "mouse") touch = false;
      if (!dragging) return;
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
        moved = true;
        if (live.current.focus) live.current.onSelect?.(null);
      }
      if (!moved) return;
      const R = Math.min(w, h) * 0.42;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velRot = -dx / R;
      velTilt = dy / R;
      rot += velRot;
      tilt = Math.max(-1.2, Math.min(1.2, tilt + velTilt));
    };
    const onUp = (e: PointerEvent) => {
      if (dragging && !moved) live.current.onSelect?.(hovered);
      dragging = false;
      moved = false;
      // en táctil el dedo se levanta: no dejar el "hover" pegado (agranda el globo y sus colores)
      if (e.pointerType !== "mouse") {
        mouse = null;
        setHovered(null);
      }
      if (hit.hasPointerCapture(e.pointerId)) hit.releasePointerCapture(e.pointerId);
    };
    const onLeave = () => {
      if (!dragging) {
        mouse = null;
        setHovered(null);
      }
    };
    hit.addEventListener("pointerdown", onDown);
    hit.addEventListener("pointermove", onMove);
    hit.addEventListener("pointerup", onUp);
    hit.addEventListener("pointercancel", onUp);
    hit.addEventListener("pointerleave", onLeave);

    const rotate = (p: Vec) => {
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      const x = p[0] * cr - p[2] * sr;
      const z0 = p[0] * sr + p[2] * cr;
      const y = p[1] * cosT - z0 * sinT;
      const z = p[1] * sinT + z0 * cosT;
      return { nx: x, ny: y, z };
    };
    const hidden = (q: { nx: number; ny: number; z: number }) => q.z < 0 && q.nx * q.nx + q.ny * q.ny < 1;

    // ms entre dibujos cuando nadie interactúa. En reposo el giro es tan lento (~0,03° por frame)
    // que 20 fps se ve igual de fluido; la entrada sigue a 30 (el frente de escaneo se mueve rápido).
    // Sin esto el globo ocupaba el hilo principal de forma continua (TBT alto en móvil).
    const IDLE_FRAME = 1000 / 20;
    const INTRO_FRAME = 1000 / 30;
    // En reposo, además, entre un dibujo y el siguiente pasa al menos 3× lo que costó el frame
    // (promedio móvil): en un teléfono lento un frame cuesta ~65 ms y a 20 fps el hilo principal
    // no quedaba nunca libre. Así baja de fps solo donde hace falta y deja ≥ 2/3 del hilo libre.
    // El costo se mide como el tiempo hasta el siguiente rAF (incluye el rasterizado del canvas,
    // que es la mayor parte y ocurre después del JS); en un equipo rápido es ~16 ms → 20 fps.
    const IDLE_BUSY = 3;
    const INTRO_BUSY = 2;
    let cost = 0;
    let drewAt = 0; // timestamp del último frame dibujado, hasta medir su costo (0 = ya medido)
    const draw = (now: number) => {
      // sin tamaño todavía (el ResizeObserver aún no llega): no dibujar, pero mantener el loop
      if (!w || !h) {
        raf = requestAnimationFrame(draw);
        return;
      }
      // primer rAF después de un dibujo: lo que tardó en llegar = costo completo de ese frame
      if (drewAt) {
        cost += (now - drewAt - cost) * 0.3;
        drewAt = 0;
      }
      // --- entrada: frente de escaneo que sube desde el polo sur ---
      if (!introStart) {
        introStart = now;
        live.current.onReady?.();
      }
      const ip = reduce ? 1 : clamp01((now - introStart) / INTRO_MS);
      const introing = ip < 1;
      const scan = easeInOut(clamp01(ip / 0.8)); // la esfera se arma en el 80 % del tiempo
      const late = clamp01((ip - 0.55) / 0.45); // órbitas, rutas y ciudades aparecen al final
      // altura del frente en coordenadas de la esfera (-1 abajo, 1 arriba), con margen para el jitter
      const frontN = -1.15 + scan * 2.4;

      // En reposo (sin cursor, arrastre, país activo ni inercia) el giro es de ~1°/s:
      // dibujar a 30 fps se ve igual y deja la mitad de frames libres en el hilo principal.
      const { active: act, focus: foc } = live.current;
      const idle =
        !introing && !sparks.length && !mouse && !dragging && !act && !foc && hover < 0.01 && zoom < 0.01 && focusZoom < 0.01 &&
        Math.abs(velRot) < 1e-4 && Math.abs(velTilt) < 1e-4 && Math.abs(tilt - BASE_TILT) < 1e-3;
      // La entrada también va a 30 fps (si nadie interactúa): coincide con la carga e hidratación
      // de la página y a 60 fps duplicaba el trabajo del hilo principal sin verse distinto.
      const calmIntro = introing && !mouse && !dragging;
      // la entrada también se espacia en equipos lentos (2×: un poco más fluida que el reposo);
      // su avance va por reloj, así que igual dura lo mismo, solo con menos cuadros
      const gap = idle
        ? Math.max(IDLE_FRAME, cost * IDLE_BUSY)
        : calmIntro
          ? Math.max(INTRO_FRAME, cost * INTRO_BUSY)
          : 0;
      if (gap && now - last < gap - 2) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const dt = Math.min(64, now - last);
      last = now;
      const { active, focus } = live.current;
      const focused = focus ? COUNTRIES.find((c) => c.code === focus) : undefined;

      // el globo todavía viaja hacia el país elegido: la lupa espera a que llegue
      let aligning = false;
      if (!dragging || !moved) {
        if (focused) {
          // girar suavemente hacia el país seleccionado (por el camino más corto)
          const targetRot = focused.view[1] * DEG;
          let d = (targetRot - rot) % (Math.PI * 2);
          if (d > Math.PI) d -= Math.PI * 2;
          if (d < -Math.PI) d += Math.PI * 2;
          aligning = Math.abs(d) > 0.15 || Math.abs(focused.view[0] * DEG - tilt) > 0.15;
          rot += d * 0.07;
          tilt += (focused.view[0] * DEG - tilt) * 0.07;
          velRot = 0;
          velTilt = 0;
        } else if (!dragging) {
          velRot *= 0.95;
          velTilt *= 0.92;
          rot += velRot + (reduce ? 0 : dt * AUTO);
          tilt += velTilt + (BASE_TILT - tilt) * 0.01;
          tilt = Math.max(-1.2, Math.min(1.2, tilt));
        }
      }
      cosT = Math.cos(tilt);
      sinT = Math.sin(tilt);

      ctx.clearRect(0, 0, w, h);
      // el canvas es un 28% más grande que el contenedor (ver HeroGlobe) para que las
      // órbitas (hasta ~1.36R con zoom) no se corten en el borde; el globo mantiene su tamaño
      const baseR = (Math.min(w, h) * 0.42) / CANVAS_SCALE;
      let ox = 0;
      let oy = 0;
      let inside = false;
      if (mouse) {
        const dx = mouse.x - w / 2;
        const dy = mouse.y - h / 2;
        inside = Math.hypot(dx, dy) < baseR * 1.05;
        ox = (dx / w) * 14;
        oy = (dy / h) * 14;
      }
      hover += ((inside || dragging ? 1 : 0) - hover) * 0.08;
      // Al cambiar de país la lupa no salta de uno a otro: primero baja el anterior y recién
      // entonces sube el nuevo, y si es el seleccionado, solo cuando el globo ya llegó a él.
      if (active && !magCode) magCode = active;
      const zoomOn = !!active && active === magCode && !(aligning && focus === active);
      zoom += ((zoomOn ? 1 : 0) - zoom) * 0.1;
      // en pantallas chicas la tarjeta del país no cabe al lado: el globo se acerca al país elegido
      focusZoom += ((focus && w < 640 * CANVAS_SCALE ? 1 : 0) - focusZoom) * 0.08;
      const R = baseR * (1 + hover * 0.05) * (1 + focusZoom * 0.18); // en escritorio solo se amplía el país
      if (zoom < 0.01) magCode = active;
      const cx = w / 2 + ox;
      const cy = h / 2 + oy;
      const sx = (q: { nx: number }) => cx + q.nx * R;
      const sy = (q: { ny: number }) => cy - q.ny * R;

      // posición en pantalla del frente de escaneo durante la entrada
      const frontY = cy - frontN * R;

      // sombra en el piso
      ctx.save();
      ctx.globalAlpha = scan;
      ctx.translate(cx, cy + R * 1.06);
      ctx.scale(1, 0.12);
      const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.8);
      floor.addColorStop(0, "rgba(33,37,92,0.22)");
      floor.addColorStop(1, "rgba(33,37,92,0)");
      ctx.fillStyle = floor;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // órbitas (mitad trasera antes de la esfera, delantera al final)
      const orbits = (front: boolean) => {
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-0.9 + i * 0.5 + rot * 0.08);
          const rx = R * (1.07 + i * 0.06);
          const ry = R * (0.2 + i * 0.14);
          const a0 = front ? 0 : Math.PI;
          ctx.lineWidth = 0.8;
          ctx.setLineDash(i % 2 ? [2, 5] : []);
          ctx.strokeStyle = `rgba(${LINE},${0.3 - i * 0.05})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, a0, a0 + Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);
          if (front) {
            // marcas de graduación
            ctx.strokeStyle = `rgba(${LINE},${0.28 - i * 0.04})`;
            for (let k = 1; k < 12; k++) {
              const a = (k / 12) * Math.PI;
              const x = Math.cos(a) * rx;
              const y = Math.sin(a) * ry;
              const nx = Math.cos(a) / rx;
              const ny = Math.sin(a) / ry;
              const nl = Math.hypot(nx, ny) || 1;
              const len = k % 3 ? 3 : 6;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + (nx / nl) * len, y + (ny / nl) * len);
              ctx.stroke();
            }
            // nodo ⊕ que recorre la órbita
            const a = (((now * 0.00005 * (i + 1) + i * 0.7) % 1) * Math.PI);
            const nxp = Math.cos(a) * rx;
            const nyp = Math.sin(a) * ry;
            ctx.fillStyle = "#f8f9f9";
            ctx.strokeStyle = `rgba(${LINE},0.55)`;
            ctx.beginPath();
            ctx.arc(nxp, nyp, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(nxp - 3, nyp);
            ctx.lineTo(nxp + 3, nyp);
            ctx.moveTo(nxp, nyp - 3);
            ctx.lineTo(nxp, nyp + 3);
            ctx.stroke();
          }
          ctx.restore();
        }
      };
      ctx.globalAlpha = late;
      orbits(false);
      ctx.globalAlpha = 1;

      // durante la entrada la esfera solo existe bajo el frente de escaneo
      ctx.save();
      if (introing) {
        ctx.beginPath();
        ctx.rect(0, frontY, w, h - frontY);
        ctx.clip();
      }

      // atmósfera (halo cian) + esfera clara: capa fija ya pintada (ver makeSprites).
      // Se regenera solo si cambió el tamaño del globo o la densidad de píxeles.
      const Rmax = baseR * SPRITE_MAX;
      if (sprDpr !== dpr || Math.abs(Rmax - sprR) > 0.5) makeSprites(Rmax);
      blit(back, cx, cy, R);

      // puntos (agrupados por brillo) + detección de hover por país
      const LENS = 80;
      inkLen.fill(0);
      countryLen.fill(0);
      freshLen = 0;
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      // destello: sin(now·k + fase) = sin(now·k)·cos(fase) + cos(now·k)·sin(fase)
      const twS = Math.sin(now * 0.0025);
      const twC = Math.cos(now * 0.0025);
      let nearest: CountryCode | null = null;
      // con el dedo se apunta mucho menos preciso que con el mouse: área de toque más grande
      let nearestD = touch ? 30 : 12;
      for (let pi = 0; pi < N; pi++) {
        const vx = PX[pi];
        const vy = PY[pi];
        const vz = PZ[pi];
        const x0 = vx * cr - vz * sr;
        const z0 = vx * sr + vz * cr;
        const ny = vy * cosT - z0 * sinT;
        const z = vy * sinT + z0 * cosT;
        if (z < 0.01) continue;
        let x = cx + x0 * R;
        let y = cy - ny * R;
        if (introing) {
          const d = frontN - ny - jitter[pi];
          if (d < 0) continue; // todavía sobre el frente: no existe
          if (d < INTRO_BAND) {
            // recién aparecido (franja brillante bajo el frente): celeste junto al frente, se funde
            // a su color normal al alejarse
            freshBuf[freshLen++] = x;
            freshBuf[freshLen++] = y;
            freshBuf[freshLen++] = 1 - d / INTRO_BAND;
            continue;
          }
        }
        const ci = PCODE[pi];
        // brillo según profundidad + destello propio de cada partícula
        const tw = 0.7 + 0.3 * (twS * TW_COS[pi] + twC * TW_SIN[pi]);
        let a = (0.35 + 0.65 * z) * tw;
        if (mouse) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (ci >= 0 && !moved && d < nearestD) {
            nearestD = d;
            nearest = CODES[ci];
          }
          if (d < LENS && ci < 0) {
            const k = (1 - d / LENS) * hover;
            x += (dx / (d || 1)) * k * 6;
            y += (dy / (d || 1)) * k * 6;
            a += k * 0.3;
          }
        }
        if (ci >= 0) {
          const buf = countryBuf[ci];
          buf[countryLen[ci]++] = x;
          buf[countryLen[ci]++] = y;
        } else {
          const b = Math.min(BUCKETS - 1, Math.floor(Math.min(1, a) * BUCKETS));
          const buf = inkBuf[b];
          buf[inkLen[b]++] = x;
          buf[inkLen[b]++] = y;
        }
      }
      // lupa: el país seleccionado se agranda desde su centro, el resto del globo no cambia
      let mcx = cx;
      let mcy = cy;
      const mi = magCode ? CODES.indexOf(magCode) : -1;
      if (mi >= 0 && countryLen[mi]) {
        const marr = countryBuf[mi];
        const mlen = countryLen[mi];
        mcx = 0;
        mcy = 0;
        for (let i = 0; i < mlen; i += 2) {
          mcx += marr[i];
          mcy += marr[i + 1];
        }
        mcx /= mlen / 2;
        mcy /= mlen / 2;
      }
      const mk = zoom * MAG;
      /** desplaza un punto de pantalla según la lupa; w = 1 dentro del país, 0 fuera */
      const lens = (x: number, y: number, w: number): [number, number] => {
        const f = 1 + mk * w;
        return [mcx + (x - mcx) * f, mcy + (y - mcy) * f - zoom * LIFT * w];
      };

      // las ciudades también cuentan para el hover
      if (mouse && !moved) {
        for (const c of CITIES) {
          const q = rotate(c.v);
          if (q.z <= 0) continue;
          const [x, y] = lens(sx(q), sy(q), c.code === magCode ? 1 : 0);
          if (Math.hypot(x - mouse.x, y - mouse.y) < (touch ? 32 : 16)) nearest = c.code;
        }
      }
      if (!moved) setHovered(nearest);
      // solo tocar el estilo si cambia (escribirlo en cada frame invalida estilos)
      const cursor = moved ? "grabbing" : nearest ? "pointer" : "grab";
      if (cursor !== lastCursor) hit.style.cursor = lastCursor = cursor;

      // dots que marcan los paises y territorio
      const ds = Math.max(1.4, R / 210);
      // en el globo chico (celular) los puntos quedan casi pegados y se ven como manchas
      // sólidas: se bajan la opacidad y el tamaño de los países para que no se vea tan fuerte
      const small = R < 200;
      const inkK = small ? 0.7 : 1;
      for (let b = 0; b < BUCKETS; b++) {
        const arr = inkBuf[b];
        const len = inkLen[b];
        if (!len) continue;
        ctx.fillStyle = `rgba(${DOT},${(0.1 + ((b + 1) / BUCKETS) * 0.7) * inkK})`;
        ctx.beginPath();
        for (let i = 0; i < len; i += 2) ctx.rect(arr[i] - ds / 2, arr[i + 1] - ds / 2, ds, ds);
        ctx.fill();
      }
      // territorio marcado santiago, lima, bogota
      for (let ci = 0; ci < CODES.length; ci++) {
        const code = CODES[ci];
        const arr = countryBuf[ci];
        const len = countryLen[ci];
        if (!len) continue;
        const isActive = active === code;
        const dim = active && !isActive;
        const s = ds * (isActive ? (small ? 1.4 : 1.75) : small ? 1.05 : 1.35);
        ctx.fillStyle = `rgba(${GLOW},${isActive ? (small ? 0.9 : 1) : dim ? 0.3 : small ? 0.6 : 0.85})`;
        ctx.beginPath();
        if (code === magCode && mk > 0.001) {
          const sm = s * (1 + mk * 0.8);
          // sombra bajo el país elevado
          ctx.save();
          ctx.fillStyle = `rgba(${LINE},${0.14 * zoom})`;
          ctx.beginPath();
          for (let i = 0; i < len; i += 2) {
            const [x, y] = lens(arr[i], arr[i + 1], 1);
            ctx.rect(x - sm / 2 + zoom * 2, y - sm / 2 + zoom * LIFT * 1.2, sm, sm);
          }
          ctx.fill();
          ctx.restore();
          ctx.beginPath();
          for (let i = 0; i < len; i += 2) {
            const [x, y] = lens(arr[i], arr[i + 1], 1);
            ctx.rect(x - sm / 2, y - sm / 2, sm, sm);
          }
        } else {
          for (let i = 0; i < len; i += 2) ctx.rect(arr[i] - s / 2, arr[i + 1] - s / 2, s, s);
        }
        ctx.fill();
      }
      // franja recién materializada: degradé suave de celeste (junto al frente) a tinta normal
      if (freshLen) {
        const STEPS_F = 4;
        for (let band = 0; band < STEPS_F; band++) {
          const lo = band / STEPS_F;
          ctx.fillStyle = `rgba(${GLOW},${0.35 + (band / (STEPS_F - 1)) * 0.5})`;
          ctx.beginPath();
          for (let i = 0; i < freshLen; i += 3) {
            const k = freshBuf[i + 2];
            if (k < lo || k >= lo + 1 / STEPS_F) continue;
            ctx.rect(freshBuf[i] - ds / 2, freshBuf[i + 1] - ds / 2, ds, ds);
          }
          ctx.fill();
        }
      }

      // volumen: luz a la derecha, sombra a la izquierda (capa fija, ver makeSprites)
      blit(front, cx, cy, R);
      ctx.strokeStyle = `rgba(${LINE},0.18)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore(); // fin del recorte de la entrada

      // lo que falta por armar (sobre el frente): plano de la esfera en líneas finas + porcentaje
      if (introing && scan < 1) {
        const ghost = Math.min(1, (1 - scan) * 6);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, frontY);
        ctx.clip();
        ctx.strokeStyle = `rgba(${LINE},${0.14 * ghost})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        // paralelos (elipses según la inclinación) y meridianos (giran con el globo)
        for (let k = -2; k <= 2; k++) {
          const lat = (k * Math.PI) / 6;
          const ry = R * Math.cos(lat) * Math.abs(sinT);
          ctx.moveTo(cx + R * Math.cos(lat), cy - R * Math.sin(lat) * cosT);
          ctx.ellipse(cx, cy - R * Math.sin(lat) * cosT, R * Math.cos(lat), Math.max(0.5, ry), 0, 0, Math.PI * 2);
        }
        for (let k = 0; k < 6; k++) {
          const rx = R * Math.abs(Math.sin(rot + (k * Math.PI) / 6));
          ctx.moveTo(cx + rx, cy);
          ctx.ellipse(cx, cy, Math.max(0.5, rx), R, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();

        // avance: cifra chica a la derecha del frente, como una cota del plano; sube con la línea
        // que va pintando (cerca de los polos la cuerda es corta: ahí se desvanece)
        const fyN = Math.max(-1, Math.min(1, frontN));
        const half = Math.sqrt(Math.max(0, 1 - fyN * fyN)) * R;
        const room = clamp01((half / R - 0.25) / 0.2);
        if (room > 0) {
          const x0 = cx + half * 1.12 + 16; // pasado el final de la línea del frente
          ctx.save();
          ctx.globalAlpha = room * ghost;
          ctx.strokeStyle = `rgba(${LINE},0.35)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0, frontY);
          ctx.lineTo(x0 + 14, frontY);
          ctx.stroke();
          ctx.fillStyle = `rgba(${LINE},0.6)`;
          ctx.font = `${Math.max(10, Math.round(R * 0.042))}px ${monoFont}`;
          ctx.textBaseline = "middle";
          ctx.fillText(`${Math.round(scan * 100)}%`, x0 + 20, frontY);
          ctx.restore();
        }
      }

      // frente de escaneo: costura que se suelda de derecha a izquierda + resplandor hacia abajo
      if (introing && scan > 0 && scan < 1) {
        const fade = Math.min(1, scan * 8, (1 - scan) * 8);
        const fy = Math.max(-1, Math.min(1, frontN));
        const chord = Math.sqrt(Math.max(0, 1 - fy * fy)) * R;
        const hw = chord * 1.12 + 12;
        const glow = ctx.createLinearGradient(0, frontY, 0, frontY + R * 0.22);
        glow.addColorStop(0, `rgba(${GLOW},${0.05 * fade})`);
        glow.addColorStop(1, `rgba(${GLOW},0)`);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = glow;
        ctx.fillRect(cx - R, frontY, R * 2, R * 0.22);
        ctx.restore();

        // soplete: recorre la cuerda de derecha a izquierda, varias pasadas durante la entrada
        const pass = (scan * WELD_PASSES) % 1;
        const tx = cx + chord * 0.9 * (1 - 2 * pass);
        // costura: ya soldada a la derecha del soplete (línea fina), apenas insinuada a la izquierda
        const u = Math.min(1, Math.max(0, (tx - (cx - hw)) / (hw * 2)));
        const line = ctx.createLinearGradient(cx - hw, 0, cx + hw, 0);
        line.addColorStop(0, `rgba(${GLOW},0)`);
        line.addColorStop(u, `rgba(${GLOW},${0.15 * fade})`);
        line.addColorStop(Math.min(1, u + 0.02), `rgba(${GLOW},${0.6 * fade})`);
        line.addColorStop(1, `rgba(${GLOW},0)`);
        ctx.fillStyle = line;
        ctx.fillRect(cx - hw, frontY - 0.5, hw * 2, 1);
        // punto del soplete: chico, centro claro y halo corto
        const tr = R * 0.035;
        const torch = ctx.createRadialGradient(tx, frontY, 0, tx, frontY, tr);
        torch.addColorStop(0, `rgba(255,255,255,${fade})`);
        torch.addColorStop(0.3, `rgba(${GLOW},${0.6 * fade})`);
        torch.addColorStop(1, `rgba(${GLOW},0)`);
        ctx.fillStyle = torch;
        ctx.beginPath();
        ctx.arc(tx, frontY, tr, 0, Math.PI * 2);
        ctx.fill();
        // pocas chispas: saltan hacia arriba y hacia atrás (a la derecha, lo ya soldado) y caen
        if (Math.random() < (dt / 16) * 0.6 * fade && sparks.length < 40) {
          const ang = -Math.PI / 2 + Math.random() * Math.PI * 0.45;
          const sp = (0.08 + Math.random() * 0.14) * (R / 260);
          const max = 220 + Math.random() * 260;
          sparks.push({ x: tx, y: frontY, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: max, max });
        }
      }

      // chispas vivas (siguen cayendo un instante después de terminar la entrada)
      if (sparks.length) {
        const g = 0.0007 * (R / 260); // gravedad, px/ms²
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineWidth = 1;
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life -= dt;
          if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          s.vy += g * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          const k = s.life / s.max; // 1 recién salida → 0 apagada
          // estela corta según su velocidad (no según el frame)
          ctx.strokeStyle = `rgba(${GLOW},${0.7 * k})`;
          ctx.beginPath();
          ctx.moveTo(s.x - s.vx * 14, s.y - s.vy * 14);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.globalAlpha = late;

      // rutas entre países
      const t = now * 0.00016;
      const STEPS = 64;
      ctx.save();
      ctx.shadowColor = `rgba(${GLOW},0.5)`;
      for (const arc of arcs) {
        const touches = active ? arc.codes.includes(active) : false;
        const pts = [];
        for (let i = 0; i <= STEPS; i++) {
          const f = i / STEPS;
          const lift = 1 + Math.sin(f * Math.PI) * arc.lift;
          const v = slerp(arc.a, arc.b, f);
          const q = rotate([v[0] * lift, v[1] * lift, v[2] * lift]);
          const w = arc.codes[0] === magCode ? 1 - f : arc.codes[1] === magCode ? f : 0;
          const [x, y] = lens(sx(q), sy(q), w * w);
          pts.push({ ...q, x, y });
        }
        ctx.lineWidth = (touches ? 1.8 : 1.1) * (arc.main ? 1 : 0.8);
        ctx.shadowBlur = touches ? 6 : 0;
        ctx.strokeStyle = touches
          ? `rgba(${GLOW},${arc.main ? 1 : 0.7})`
          : `rgba(${LINE},${(active ? 0.15 : 0.55) * (arc.main ? 1 : 0.6)})`;
        ctx.setLineDash(arc.main ? [] : [3, 4]);
        ctx.beginPath();
        let pen = false;
        for (const q of pts) {
          if (hidden(q)) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(q.x, q.y);
          else ctx.moveTo(q.x, q.y);
          pen = true;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        if (!arc.main) continue; // las secundarias no llevan pulsos

        // pulsos que viajan en ambos sentidos
        const speed = touches ? 2.2 : 1;
        for (const [dir, off] of [
          [1, 0],
          [-1, 0.5],
        ] as const) {
          let f = (t * speed + arc.offset + off) % 1;
          if (dir < 0) f = 1 - f;
          const q = pts[Math.min(STEPS, Math.floor(f * STEPS))];
          if (hidden(q)) continue;
          ctx.fillStyle = `rgba(${GLOW},${active && !touches ? 0.3 : 1})`;
          ctx.beginPath();
          ctx.arc(q.x, q.y, touches ? 3.2 : 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // ciudades con etiqueta
      const pulse = (now * 0.0003) % 1; // una onda cada ~3,3 s (antes 1,7 s: se movía demasiado)
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      // un save/restore anterior pudo devolver otra fuente: se vuelve a asignar la primera vez
      lastFont = "";
      for (const c of CITIES) {
        const q = rotate(c.v);
        if (q.z <= 0.05) continue;
        const [x, y] = lens(sx(q), sy(q), c.code === magCode ? 1 : 0);
        const vis = Math.min(1, q.z * 3);
        const isActive = active === c.code;
        const hq = c.hq;
        // la sede emite dos ondas desfasadas y más amplias
        for (const ph of hq ? [pulse, (pulse + 0.5) % 1] : [pulse]) {
          const ringR = isActive || hq ? 6 + ph * (hq ? 22 : 18) : 3 + ph * 10;
          ctx.strokeStyle = `rgba(${GLOW},${(1 - ph) * vis})`;
          ctx.lineWidth = isActive || hq ? 1.5 : 1;
          ctx.beginPath();
          ctx.arc(x, y, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }
        const mark = isActive || hq ? `rgba(${GLOW},${vis})` : `rgba(${LINE},${vis})`;
        const mr = hq ? 7 : isActive ? 6 : 5;
        if (hq) {
          // anillo exterior fijo que distingue a la sede
          ctx.strokeStyle = `rgba(${GLOW},${0.6 * vis})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, mr + 10.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = hq ? `rgba(${LINE},${vis})` : "#ffffff";
        ctx.strokeStyle = mark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, mr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = hq ? `rgba(255,255,255,${vis})` : mark;
        ctx.beginPath();
        ctx.moveTo(x - mr + 1.5, y);
        ctx.lineTo(x + mr - 1.5, y);
        ctx.moveTo(x, y - mr + 1.5);
        ctx.lineTo(x, y + mr - 1.5);
        ctx.stroke();
        const gap = hq ? 13 : 8;
        ctx.strokeStyle = `rgba(${LINE},${0.35 * vis})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - gap, y);
        ctx.lineTo(x - gap - 20, y);
        ctx.stroke();
        const lx = x - gap - 26;
        setFont(isActive || hq ? FONT_CITY_STRONG : FONT_CITY);
        ctx.fillStyle = isActive || hq ? `rgba(${GLOW},${vis})` : `rgba(${LINE},${0.9 * vis})`;
        ctx.fillText(c.label, lx, hq ? y - 6 : y);
        if (hq) {
          setFont(FONT_HQ);
          ctx.fillStyle = `rgba(${LINE},${0.6 * vis})`;
          ctx.fillText("SEDE PRINCIPAL", lx, y + 7);
        }
      }

      orbits(true);
      ctx.globalAlpha = 1;
      drewAt = now;
      raf = requestAnimationFrame(draw);
    };

    // Solo dibujar mientras el globo se ve: fuera de pantalla el loop se detiene por completo
    // (rAF ya se pausa solo con la pestaña oculta).
    const start = () => {
      if (raf) return;
      last = performance.now();
      drewAt = 0; // el tiempo detenido no es costo de dibujo
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // Se observa el contenedor del globo (la caja visible), no el canvas: el canvas es 28 % más
    // grande y se sale por abajo, así que con Cadena de valor ya en pantalla (y el globo tapado)
    // seguía "visible" y dibujaba a 30 fps sin que se viera.
    // Con menos de la mitad del globo a la vista (ya se está saliendo del inicio) se detiene todo:
    // giro, pulsos y arcos. Antes seguía hasta que quedaba solo el borde (15 %).
    // data-paused congela también las animaciones CSS del contenedor (punto que late en la tarjeta
    // del país, línea de escaneo de la carga): ver globals.css
    const unwatch = watchVisible(
      hit,
      (v) => {
        hit.toggleAttribute("data-paused", !v);
        if (v) start();
        else stop();
      },
      0.5,
    );

    return () => {
      stop();
      unwatch();
      ro.disconnect();
      hit.removeEventListener("pointerdown", onDown);
      hit.removeEventListener("pointermove", onMove);
      hit.removeEventListener("pointerup", onUp);
      hit.removeEventListener("pointercancel", onUp);
      hit.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={`pointer-events-none select-none ${className}`} aria-hidden="true" />;
}
