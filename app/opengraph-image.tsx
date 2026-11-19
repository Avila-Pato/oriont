import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { HERO_COPY } from "@/data/hero";

/*
 * Imagen al compartir el sitio (WhatsApp, LinkedIn, X, Slack…): fondo marino de la marca, logo y
 * el lema del hero. Se genera una vez al compilar (no depende de la petición).
 * El logo va en PNG (assets/og): el generador de imágenes no lee .webp.
 * SEO: Next la detecta por el nombre y agrega solo las etiquetas og:image y twitter:image; debe
 * quedarse en app/ y llamarse así. Para verla: localhost:3000/opengraph-image
 */

export const alt = "Oriont: conectamos al sponsor con el cliente final";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logo = `data:image/png;base64,${await readFile(join(process.cwd(), "assets/og/oriont-logo.png"), "base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #21255c 0%, #1a1d4a 60%, #1d4f73 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* logo sobre una pastilla blanca (el logo es marino) */}
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", background: "white", borderRadius: 24, padding: "22px 30px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse no usa next/image */}
            <img src={logo} height={84} width={207} alt="" />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: "#7fd0e6" }}>
            Bancaseguros y telecomunicaciones
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 20, fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>
            {HERO_COPY.title}&nbsp;<span style={{ color: "#7fd0e6" }}>{HERO_COPY.highlight}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
