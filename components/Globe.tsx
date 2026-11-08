"use client";

import { useEffect, useRef } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import countriesTopo from "world-atlas/countries-110m.json";
import { COUNTRIES, type CountryCode } from "./countries";

type Vec = [number, number, number];
type Dot = { v: Vec; c: CountryCode | null };

const DEG = Math.PI / 180;
const INK = "33,37,92"; // azul marino del logo
const ACCENT = "36,140,170"; // celeste petróleo

// colores únicos para identificar cada país destacado al rasterizar
const PAINT: Record<string, string> = { "152": "#ff000a", "604": "#ff0064", "170": "#ff00c8" };

function toVec(lat: number, lon: number): Vec {
  const c = Math.cos(lat * DEG);
  return [c * Math.sin(lon * DEG), Math.sin(lat * DEG), c * Math.cos(lon * DEG)];
}

/** Rasteriza el mapa y devuelve puntos en grilla sobre tierra, marcando los países destacados. */
function buildLandDots(step: number): Dot[] {
  const W = 1440;
  const H = 720;
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const c = off.getContext("2d", { willReadFrequently: true });
  if (!c) return [];
  const topo = countriesTopo as unknown as Topology<{ countries: GeometryCollection }>;
  const all = feature(topo, topo.objects.countries);
  const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
  const path = geoPath(proj, c);
  for (const f of all.features) {
    c.fillStyle = PAINT[String(f.id)] ?? "#ffffff";
    c.beginPath();
    path(f);
    c.fill();
  }
  const data = c.getImageData(0, 0, W, H).data;

  const pts: Dot[] = [];
  for (let lat = -84; lat <= 84; lat += step) {
    const n = Math.max(1, Math.round((360 * Math.cos(lat * DEG)) / step));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (i / n) * 360;
      const px = Math.floor(((lon + 180) / 360) * W);
      const py = Math.floor(((90 - lat) / 180) * H);
      const k = (py * W + px) * 4;
      if (data[k] <= 128) continue;
      let code: CountryCode | null = null;
      if (data[k + 1] < 128) {
        const b = data[k + 2];
        code = b < 55 ? "CL" : b < 150 ? "PE" : "CO";
      }
      pts.push({ v: toVec(lat, lon), c: code });
    }
  }
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

const CITIES = COUNTRIES.map((c) => ({ code: c.code, name: c.city, v: toVec(c.lat, c.lon) }));
const ROUTES: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 2],
];

type Props = {
  className?: string;
  /** país resaltado (hover o seleccionado) */
  active?: CountryCode | null;
  /** país seleccionado: el globo gira hacia él */
  focus?: CountryCode | null;
  onHover?: (code: CountryCode | null) => void;
  onSelect?: (code: CountryCode | null) => void;
};

export default function Globe({ className = "", active = null, focus = null, onHover, onSelect }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ active, focus, onHover, onSelect });

  useEffect(() => {
    live.current = { active, focus, onHover, onSelect };
  }, [active, focus, onHover, onSelect]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const points = buildLandDots(0.8);
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
    const monoFont = `${mono ? mono + ", " : ""}ui-monospace, monospace`;

    const arcs = ROUTES.map(([i, j], k) => {
      const a = CITIES[i].v;
      const b = CITIES[j].v;
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const dist = Math.acos(Math.min(1, Math.max(-1, dot)));
      return { a, b, codes: [CITIES[i].code, CITIES[j].code], lift: 0.04 + dist * 0.35, offset: k / ROUTES.length };
    });

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
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
    let hover = 0;
    let zoom = 0;
    let hovered: CountryCode | null = null;
    let raf = 0;
    let last = performance.now();
    let cosT = Math.cos(tilt);
    let sinT = Math.sin(tilt);
    const AUTO = 0.00006;

    const setHovered = (c: CountryCode | null) => {
      if (c === hovered) return;
      hovered = c;
      live.current.onHover?.(c);
    };

    const localPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      velRot = 0;
      velTilt = 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      mouse = localPos(e);
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
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    const onLeave = () => {
      if (!dragging) {
        mouse = null;
        setHovered(null);
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);

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

    const draw = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const { active, focus } = live.current;
      const focused = focus ? COUNTRIES.find((c) => c.code === focus) : undefined;

      if (!dragging || !moved) {
        if (focused) {
          // girar suavemente hacia el país seleccionado (por el camino más corto)
          const targetRot = focused.view[1] * DEG;
          let d = (targetRot - rot) % (Math.PI * 2);
          if (d > Math.PI) d -= Math.PI * 2;
          if (d < -Math.PI) d += Math.PI * 2;
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
      const baseR = Math.min(w, h) * 0.42;
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
      zoom += ((focused ? 1 : 0) - zoom) * 0.06;
      const R = baseR * (1 + hover * 0.02 + zoom * 0.07);
      const cx = w / 2 + ox;
      const cy = h / 2 + oy;
      const sx = (q: { nx: number }) => cx + q.nx * R;
      const sy = (q: { ny: number }) => cy - q.ny * R;

      // sombra en el piso
      ctx.save();
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
        ctx.lineWidth = 0.7;
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-0.9 + i * 0.5 + rot * 0.08);
          ctx.strokeStyle = `rgba(${INK},${0.14 - i * 0.025})`;
          ctx.beginPath();
          const rx = R * (1.07 + i * 0.05);
          const ry = R * (0.2 + i * 0.14);
          if (front) ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
          else ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      };
      orbits(false);

      // esfera
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
      body.addColorStop(0, "#ffffff");
      body.addColorStop(0.6, "#f6f1e6");
      body.addColorStop(0.9, "#e6dcc7");
      body.addColorStop(1, "#d3c6aa");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // puntos (agrupados por brillo) + detección de hover por país
      const LENS = 80;
      const BUCKETS = 10;
      const ink: number[][] = Array.from({ length: BUCKETS }, () => []);
      const byCountry: Record<CountryCode, number[]> = { CL: [], PE: [], CO: [] };
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      let nearest: CountryCode | null = null;
      let nearestD = 12;
      for (const p of points) {
        const v = p.v;
        const x0 = v[0] * cr - v[2] * sr;
        const z0 = v[0] * sr + v[2] * cr;
        const ny = v[1] * cosT - z0 * sinT;
        const z = v[1] * sinT + z0 * cosT;
        if (z < 0.01) continue;
        let x = cx + x0 * R;
        let y = cy - ny * R;
        let a = 0.5 + 0.5 * z;
        if (mouse) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (p.c && !moved && d < nearestD) {
            nearestD = d;
            nearest = p.c;
          }
          if (d < LENS && !p.c) {
            const k = (1 - d / LENS) * hover;
            x += (dx / (d || 1)) * k * 6;
            y += (dy / (d || 1)) * k * 6;
            a += k * 0.3;
          }
        }
        if (p.c) byCountry[p.c].push(x, y);
        else ink[Math.min(BUCKETS - 1, Math.floor(Math.min(1, a) * BUCKETS))].push(x, y);
      }
      // las ciudades también cuentan para el hover
      if (mouse && !moved) {
        for (const c of CITIES) {
          const q = rotate(c.v);
          if (q.z > 0 && Math.hypot(sx(q) - mouse.x, sy(q) - mouse.y) < 16) nearest = c.code;
        }
      }
      if (!moved) setHovered(nearest);
      canvas.style.cursor = moved ? "grabbing" : nearest ? "pointer" : "grab";

      const ds = Math.max(1.4, R / 210);
      for (let b = 0; b < BUCKETS; b++) {
        const arr = ink[b];
        if (!arr.length) continue;
        ctx.fillStyle = `rgba(${INK},${0.3 + ((b + 1) / BUCKETS) * 0.6})`;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 2) ctx.rect(arr[i] - ds / 2, arr[i + 1] - ds / 2, ds, ds);
        ctx.fill();
      }
      for (const code of ["CL", "PE", "CO"] as CountryCode[]) {
        const arr = byCountry[code];
        if (!arr.length) continue;
        const isActive = active === code;
        const dim = active && !isActive;
        const s = ds * (isActive ? 1.75 : 1.35);
        ctx.fillStyle = `rgba(${ACCENT},${isActive ? 1 : dim ? 0.45 : 0.85})`;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 2) ctx.rect(arr[i] - s / 2, arr[i + 1] - s / 2, s, s);
        ctx.fill();
      }

      // volumen: luz a la derecha, sombra a la izquierda
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      const shade = ctx.createRadialGradient(cx + R * 0.25, cy - R * 0.15, R * 0.75, cx + R * 0.25, cy - R * 0.15, R * 1.3);
      shade.addColorStop(0, "rgba(33,37,92,0)");
      shade.addColorStop(1, "rgba(33,37,92,0.22)");
      ctx.fillStyle = shade;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      const rim = ctx.createRadialGradient(cx - R * 0.12, cy, R * 0.92, cx - R * 0.12, cy, R * 1.12);
      rim.addColorStop(0, "rgba(255,255,255,0)");
      rim.addColorStop(1, "rgba(255,255,255,0.9)");
      ctx.fillStyle = rim;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
      ctx.strokeStyle = `rgba(${INK},0.25)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // rutas entre países
      const t = now * 0.00016;
      const STEPS = 64;
      for (const arc of arcs) {
        const touches = active ? arc.codes.includes(active) : false;
        const pts = [];
        for (let i = 0; i <= STEPS; i++) {
          const f = i / STEPS;
          const lift = 1 + Math.sin(f * Math.PI) * arc.lift;
          const v = slerp(arc.a, arc.b, f);
          pts.push(rotate([v[0] * lift, v[1] * lift, v[2] * lift]));
        }
        ctx.lineWidth = touches ? 2 : 1.2;
        ctx.strokeStyle = `rgba(${ACCENT},${touches ? 0.95 : active ? 0.18 : 0.5})`;
        ctx.beginPath();
        let pen = false;
        for (const q of pts) {
          if (hidden(q)) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(sx(q), sy(q));
          else ctx.moveTo(sx(q), sy(q));
          pen = true;
        }
        ctx.stroke();

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
          ctx.fillStyle = `rgba(${ACCENT},${active && !touches ? 0.3 : 1})`;
          ctx.beginPath();
          ctx.arc(sx(q), sy(q), touches ? 3 : 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ciudades con etiqueta
      const pulse = (now * 0.0006) % 1;
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      for (const c of CITIES) {
        const q = rotate(c.v);
        if (q.z <= 0.05) continue;
        const x = sx(q);
        const y = sy(q);
        const vis = Math.min(1, q.z * 3);
        const isActive = active === c.code;
        const ringR = isActive ? 5 + pulse * 18 : 3 + pulse * 10;
        ctx.strokeStyle = `rgba(${ACCENT},${(1 - pulse) * vis})`;
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.beginPath();
        ctx.arc(x, y, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = isActive ? `rgba(${ACCENT},${vis})` : `rgba(${INK},${vis})`;
        ctx.beginPath();
        ctx.arc(x, y, isActive ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${INK},${0.35 * vis})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 7, y);
        ctx.lineTo(x - 28, y);
        ctx.stroke();
        ctx.font = `${isActive ? 700 : 500} ${isActive ? 12 : 11}px ${monoFont}`;
        ctx.fillStyle = isActive ? `rgba(${ACCENT},${vis})` : `rgba(${INK},${0.9 * vis})`;
        ctx.fillText(c.name.toUpperCase(), x - 34, y);
      }

      orbits(true);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={`touch-pan-y select-none ${className}`} aria-hidden="true" />;
}
