import { motion } from "framer-motion";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const integrations = [
  { name: "Hotmart", logo: "https://logo.clearbit.com/hotmart.com", description: "Plataforma de produtos digitais" },
  { name: "Kiwify", logo: "https://logo.clearbit.com/kiwify.com.br", description: "Checkout para infoprodutos" },
  { name: "Eduzz", logo: "https://logo.clearbit.com/eduzz.com", description: "Plataforma de cursos online" },
  { name: "Monetizze", logo: "https://logo.clearbit.com/monetizze.com.br", description: "Afiliados e produtos digitais" },
  { name: "Shopify", logo: "https://logo.clearbit.com/shopify.com", description: "E-commerce completo" },
  { name: "WooCommerce", logo: "https://logo.clearbit.com/woocommerce.com", description: "Plugin WordPress para lojas" },
  { name: "Nuvemshop", logo: "https://logo.clearbit.com/nuvemshop.com.br", description: "Plataforma de e-commerce" },
  { name: "Tray", logo: "https://logo.clearbit.com/tray.com.br", description: "E-commerce brasileiro" },
  { name: "ActiveCampaign", logo: "https://logo.clearbit.com/activecampaign.com", description: "Automação de marketing" },
  { name: "RD Station", logo: "https://logo.clearbit.com/rdstation.com", description: "Marketing e vendas" },
  { name: "Mailchimp", logo: "https://logo.clearbit.com/mailchimp.com", description: "Email marketing" },
  { name: "HubSpot", logo: "https://logo.clearbit.com/hubspot.com", description: "CRM e automação" },
  { name: "Zapier", logo: "https://logo.clearbit.com/zapier.com", description: "Conecte +5000 apps" },
  { name: "Make", logo: "https://logo.clearbit.com/make.com", description: "Automação visual" },
  { name: "n8n", logo: "https://logo.clearbit.com/n8n.io", description: "Workflows automatizados" },
  { name: "Webhooks", logo: "https://logo.clearbit.com/webhook.site", description: "Integrações personalizadas" },
  { name: "Mercado Livre", logo: "https://logo.clearbit.com/mercadolivre.com.br", description: "Marketplace brasileiro" },
  { name: "Amazon", logo: "https://logo.clearbit.com/amazon.com", description: "Marketplace global" },
  { name: "Magazine Luiza", logo: "https://logo.clearbit.com/magazineluiza.com.br", description: "Varejo brasileiro" },
  { name: "Google Sheets", logo: "https://logo.clearbit.com/google.com", description: "Planilhas na nuvem" },
  { name: "Dados4U", logo: "https://dados4u.com.br/favicon.ico", description: "Consulta de dados por CPF, CNPJ, telefone e e-mail" },
];

// Duplicate for infinite scroll effect
const duplicatedIntegrations = [...integrations, ...integrations];

export const Integrations = () => {
  return (
    <section id="integracoes" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Todas as <span className="text-accent">integrações</span> que você precisa!
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Conecte todas as ferramentas necessárias para alavancar suas vendas e melhorar a experiência do cliente.
          </p>
        </motion.div>

        {/* WhatsApp API Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-accent/10 rounded-3xl p-8 lg:p-12 mb-12 border border-accent/20"
        >
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="flex-grow text-center lg:text-left">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Integração com a <span className="text-accent">API Oficial do WhatsApp</span>
              </h3>
              <p className="text-muted-foreground">
                Somos parceiros oficiais da Meta. Envie mensagens sem risco de bloqueio com a API oficial.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link to="/register">
                <Button variant="hero" size="lg" className="group">
                  Começar agora
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Infinite Marquee */}
        <div className="relative overflow-hidden py-8">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          
          {/* First row - scrolling left */}
          <div className="flex animate-marquee mb-6">
            {duplicatedIntegrations.map((integration, index) => (
              <Tooltip key={`row1-${index}`}>
                <TooltipTrigger asChild>
                  <div className="flex-shrink-0 mx-4 bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group min-w-[140px]">
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={integration.logo}
                        alt={integration.name}
                        className="w-10 h-10 object-contain rounded-lg bg-white p-1 group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${integration.name}&background=random&size=40`;
                        }}
                      />
                      <span className="font-medium text-foreground text-sm text-center">{integration.name}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{integration.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Second row - scrolling right */}
          <div className="flex animate-marquee-reverse">
            {duplicatedIntegrations.reverse().map((integration, index) => (
              <Tooltip key={`row2-${index}`}>
                <TooltipTrigger asChild>
                  <div className="flex-shrink-0 mx-4 bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group min-w-[140px]">
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={integration.logo}
                        alt={integration.name}
                        className="w-10 h-10 object-contain rounded-lg bg-white p-1 group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${integration.name}&background=random&size=40`;
                        }}
                      />
                      <span className="font-medium text-foreground text-sm text-center">{integration.name}</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{integration.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link to="/integrations">
            <Button variant="outline" size="lg" className="group">
              São +20 integrações para você utilizar. Confira!
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
