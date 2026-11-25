import type { Metadata } from "next";
import Link from "next/link";
import OriontLogo from "@/components/ui/OriontLogo";
import { PRIVACY } from "@/data/privacy";
import { SITE } from "@/data/site";

const title = "Política de privacidad";
const description = `Cómo ${PRIVACY.company} trata los datos personales que recibe a través de este sitio.`;
// imagen para compartir: la misma del inicio (app/opengraph-image.tsx)
const ogImage = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE.ogAlt };

// canónica y og:url propias: si no, hereda las del inicio ("/") desde el layout.
// openGraph y twitter van completos: Next REEMPLAZA (no mezcla) el objeto del layout, y con solo
// la url la página quedaba sin imagen, título ni nombre del sitio al compartirla
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacidad" },
  openGraph: {
    type: "website",
    url: "/privacidad",
    siteName: SITE.name,
    locale: SITE.locale,
    title: `${title} | ${SITE.name}`,
    description,
    images: [ogImage],
  },
  twitter: { card: "summary_large_image", title: `${title} | ${SITE.name}`, description, images: [ogImage] },
};

export default function PrivacyPage() {
  return (
    <main className="container-page flex min-h-dvh flex-col py-6 text-navy md:py-8">
      <Link href="/" aria-label="Oriont, ir al inicio" className="self-start">
        <OriontLogo className="h-8 w-auto md:h-9" eager />
      </Link>

      <article className="max-w-[720px] py-16 lg:py-24">
        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-accent-ink xl:text-[12px]">
          <span className="h-px w-6 bg-accent xl:w-8" />
          Legal
        </p>
        <h1 className="mt-5 font-display text-[30px] font-semibold leading-[1.08] tracking-tight sm:text-[38px] xl:text-[44px]">
          Política de <span className="text-accent">privacidad</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-navy/70 xl:text-[17px]">{PRIVACY.intro}</p>

        {PRIVACY.sections.map((s) => (
          <section key={s.title} className="mt-10">
            <h2 className="font-display text-[20px] font-semibold tracking-tight xl:text-[22px]">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-3 text-[15px] leading-relaxed text-navy/75 xl:text-[16px]">
                {p}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-12 font-mono text-[12px] text-navy/70">Última actualización: {PRIVACY.updated}</p>

        <Link
          href="/"
          className="group mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-accent-ink hover:text-[#2c3175]"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          Volver al inicio
        </Link>
      </article>
    </main>
  );
}
