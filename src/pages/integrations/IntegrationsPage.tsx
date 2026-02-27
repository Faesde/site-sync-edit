import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";

const integrations = [
  { name: "Shopify", logo: "https://logo.clearbit.com/shopify.com", href: "/integrations/shopify", category: "E-commerce" },
  { name: "WooCommerce", logo: "https://logo.clearbit.com/woocommerce.com", href: "/integrations/woocommerce", category: "E-commerce" },
  { name: "Yampi", logo: "https://logo.clearbit.com/yampi.com.br", href: "/integrations/yampi", category: "E-commerce" },
  { name: "Nuvemshop", logo: "https://logo.clearbit.com/nuvemshop.com.br", href: "#", category: "E-commerce" },
  { name: "Tray", logo: "https://logo.clearbit.com/tray.com.br", href: "#", category: "E-commerce" },
  { name: "Hotmart", logo: "https://logo.clearbit.com/hotmart.com", href: "#", category: "Infoprodutos" },
  { name: "Kiwify", logo: "https://logo.clearbit.com/kiwify.com.br", href: "/integrations/kiwify", category: "Infoprodutos" },
  { name: "Eduzz", logo: "https://logo.clearbit.com/eduzz.com", href: "#", category: "Infoprodutos" },
  { name: "Monetizze", logo: "https://logo.clearbit.com/monetizze.com.br", href: "#", category: "Infoprodutos" },
  { name: "Cartpanda", logo: "https://logo.clearbit.com/cartpanda.com", href: "/integrations/cartpanda", category: "E-commerce" },
  { name: "ActiveCampaign", logo: "https://logo.clearbit.com/activecampaign.com", href: "#", category: "CRM" },
  { name: "RD Station", logo: "https://logo.clearbit.com/rdstation.com", href: "#", category: "CRM" },
  { name: "HubSpot", logo: "https://logo.clearbit.com/hubspot.com", href: "#", category: "CRM" },
  { name: "Zapier", logo: "https://logo.clearbit.com/zapier.com", href: "#", category: "Automação" },
  { name: "Make", logo: "https://logo.clearbit.com/make.com", href: "#", category: "Automação" },
  { name: "n8n", logo: "https://logo.clearbit.com/n8n.io", href: "#", category: "Automação" },
  { name: "Google Sheets", logo: "https://logo.clearbit.com/google.com", href: "#", category: "Produtividade" },
  { name: "Mailchimp", logo: "https://logo.clearbit.com/mailchimp.com", href: "#", category: "Email" },
  { name: "Dados4U", logo: "https://dados4u.com.br/favicon.ico", href: "/integrations/dados4u", category: "Dados" },
];

const categories = ["E-commerce", "Infoprodutos", "CRM", "Automa\u00e7\u00e3o", "Email", "Produtividade", "Dados"];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              +20 <span className="text-accent">Integrações</span> disponíveis
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/80 mb-8"
            >
              Conecte suas ferramentas favoritas e automatize seu negócio.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          {categories.map((category) => {
            const categoryIntegrations = integrations.filter((i) => i.category === category);
            if (categoryIntegrations.length === 0) return null;
            
            return (
              <div key={category} className="mb-12">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">{category}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryIntegrations.map((integration, index) => (
                    <motion.div
                      key={integration.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={integration.href}
                        className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                      >
                        <img
                          src={integration.logo}
                          alt={integration.name}
                          className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${integration.name}&background=random&size=40`;
                          }}
                        />
                        <span className="font-medium text-foreground flex-grow">{integration.name}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Não encontrou sua integração?
          </h2>
          <p className="text-white/80 mb-8">
            Entre em contato e desenvolvemos para você!
          </p>
          <a href="https://wa.me/5511995833281" target="_blank" rel="noopener noreferrer">
            <Button size="xl" className="bg-accent text-white hover:brightness-110">
              Fale conosco
              <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
