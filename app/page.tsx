import Navbar from "@/components/layout/Navbar";
import ContactDrawer from "@/components/contact/ContactDrawer";
import AboutSection from "@/components/sections/about/AboutSection";
import HeroSection from "@/components/sections/hero/HeroSection";
import ServicesSection from "@/components/sections/services/ServicesSection";
import IndustriesSection from "@/components/sections/industries/IndustriesSection";
import SolutionsSection from "@/components/sections/solutions/SolutionsSection";
// datos estructurados (schema.org): empresa, servicios, empresas del grupo y sitio
import { jsonLd } from "@/data/structuredData";

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
