import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { BentoGrid } from "@/components/sections/BentoGrid";
import { VideoSection } from "@/components/sections/VideoSection";
import { Pricing } from "@/components/sections/Pricing";
import { Solutions } from "@/components/sections/Solutions";
import { Stats } from "@/components/sections/Stats";
import { Integrations } from "@/components/sections/Integrations";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <BentoGrid />
        <VideoSection />
        <Pricing />
        <Solutions />
        <Stats />
        <Integrations />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
