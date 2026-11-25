import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import { SITE, SITE_URL } from "@/data/site";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

/*
 * SEO → metatags: Next arma los <meta> del <head> con este objeto (no se escriben a mano).
 * title/description = lo que muestra Google; canonical = URL oficial; openGraph/twitter = vista
 * previa al compartir; robots = permite indexar. Los textos salen de data/site.ts.
 */
export const metadata: Metadata = {
  // base de las URL absolutas (canónica, og:url, og:image) metatags
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  // la imagen para compartir la pone app/opengraph-image.tsx
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};



export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning (solo los atributos de <html>, no sus hijos): Lenis le agrega la
    // clase "lenis" y algunas extensiones también tocan su class; en dev eso salía como error de
    // hidratación aunque la página está bien
    <html
      suppressHydrationWarning
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: extensiones (ej. ColorZilla) agregan atributos al body */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SmoothScroll>{children}</SmoothScroll>      </body>
    </html>
  );
}
