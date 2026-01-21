import { motion } from "framer-motion";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const integrations = [
  "Hotmart", "Kiwify", "Eduzz", "Monetizze", 
  "Shopify", "WooCommerce", "Nuvemshop", "Tray",
  "ActiveCampaign", "RD Station", "Mailchimp", "HubSpot",
  "Zapier", "Make", "n8n", "Webhooks",
  "Mercado Livre", "Amazon", "Magazine Luiza", "Google Sheets"
];

export const Integrations = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
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
              <Button variant="hero" size="lg" className="group">
                Começar agora
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 text-center"
            >
              <span className="font-medium text-foreground">{integration}</span>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Button variant="outline" size="lg" className="group">
            São +20 integrações para você utilizar. Confira!
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
