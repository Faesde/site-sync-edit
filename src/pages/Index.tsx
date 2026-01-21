import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Highlights } from "@/components/sections/Highlights";
import { Solutions } from "@/components/sections/Solutions";
import { Stats } from "@/components/sections/Stats";
import { Integrations } from "@/components/sections/Integrations";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Highlights />
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
