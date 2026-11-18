import Navbar from "@/components/layout/Navbar";
import ContactDrawer from "@/components/contact/ContactDrawer";
import AboutSection from "@/components/sections/about/AboutSection";
import HeroSection from "@/components/sections/hero/HeroSection";
import ServicesSection from "@/components/sections/services/ServicesSection";
import IndustriesSection from "@/components/sections/industries/IndustriesSection";
import SolutionsSection from "@/components/sections/solutions/SolutionsSection";
import { SITE, SITE_URL } from "@/data/site";

// datos estructurados (schema.org) para buscadores y asistentes: la empresa y el sitio
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE.name,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: SITE.description,
      email: SITE.email,
      address: { "@type": "PostalAddress", ...SITE.address },
      areaServed: "CL",
      contactPoint: { "@type": "ContactPoint", contactType: "sales", email: SITE.email, availableLanguage: "es" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE.name,
      inLanguage: "es-CL",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <main className="relative flex-1 overflow-x-clip bg-background text-[#21255c]">
      <script
        type="application/ld+json"
        // "<" escapado: evita que un texto cierre la etiqueta script (recomendación de Next)
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar />

      <HeroSection />

      <SolutionsSection />

      <ServicesSection />

      <IndustriesSection />

      <AboutSection />

      {/* panel de contacto que abre "Contáctanos" (encima de la página, sin scroll) */}
      <ContactDrawer />
    </main>
  );
}
