import Navbar from "@/components/layout/Navbar";
import AboutSection from "@/components/sections/about/AboutSection";
import HeroSection from "@/components/sections/hero/HeroSection";
import ServicesSection from "@/components/sections/services/ServicesSection";
import SponsorsSection from "@/components/sections/sponsors/SponsorsSection";
import ValueChainSection from "@/components/sections/value-chain/ValueChainSection";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-x-clip bg-background text-[#21255c]">
      <Navbar />

      <HeroSection />

      <ValueChainSection />

      <ServicesSection />

      <SponsorsSection />

      <AboutSection />
    </main>
  );
}
