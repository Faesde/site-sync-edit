import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check, Zap, MessageCircle, BarChart3, Package } from "lucide-react";

const integrationData: Record<string, { name: string; logo: string; description: string; features: string[] }> = {
  shopify: {
    name: "Shopify",
    logo: "https://logo.clearbit.com/shopify.com",
    description: "Integre sua loja Shopify e automatize toda a comunicação com seus clientes.",
    features: [
      "Sincronização automática de pedidos",
      "Recuperação de carrinho abandonado",
      "Notificações de status do pedido",
      "Campanhas segmentadas por comportamento de compra",
      "Rastreamento de entrega via WhatsApp",
    ],
  },
  woocommerce: {
    name: "WooCommerce",
    logo: "https://logo.clearbit.com/woocommerce.com",
    description: "Conecte seu WooCommerce e potencialize suas vendas com automação.",
    features: [
      "Plugin de integração nativa",
      "Recuperação de boleto e PIX não pagos",
      "Notificações automáticas de pedido",
      "Segmentação por produtos comprados",
      "Campanhas de recompra automáticas",
    ],
  },
  yampi: {
    name: "Yampi",
    logo: "https://logo.clearbit.com/yampi.com.br",
    description: "Integração completa com Yampi para checkout e gestão de pedidos.",
    features: [
      "Webhooks em tempo real",
      "Recuperação de abandonos",
      "Notificações de status",
      "Campanhas segmentadas",
    ],
  },
  kiwify: {
    name: "Kiwify",
    logo: "https://logo.clearbit.com/kiwify.com.br",
    description: "Conecte sua Kiwify e automatize o relacionamento com seus compradores.",
    features: [
      "Sincronização de vendas",
      "Automação pós-compra",
      "Sequências de onboarding",
      "Campanhas de upsell",
    ],
  },
  cartpanda: {
    name: "Cartpanda",
    logo: "https://logo.clearbit.com/cartpanda.com",
    description: "Integração nativa com Cartpanda para e-commerce.",
    features: [
      "Sincronização de pedidos",
      "Recuperação de carrinhos",
      "Notificações automáticas",
      "Campanhas de marketing",
    ],
  },
};

const defaultFeatures = [
  { icon: Zap, title: "Sincronização em Tempo Real", description: "Dados atualizados instantaneamente" },
  { icon: MessageCircle, title: "Automações Prontas", description: "Templates de automação pré-configurados" },
  { icon: BarChart3, title: "Relatórios Integrados", description: "Métricas unificadas no dashboard" },
  { icon: Package, title: "Setup Rápido", description: "Configure em menos de 5 minutos" },
];

export default function IntegrationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const integration = integrationData[slug || ""] || {
    name: slug?.charAt(0).toUpperCase() + (slug?.slice(1) || ""),
    logo: `https://ui-avatars.com/api/?name=${slug}&background=random&size=80`,
    description: "Integração completa para automatizar seu negócio.",
    features: ["Sincronização automática", "Automações prontas", "Relatórios integrados"],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white p-3 shadow-lg"
            >
              <img
                src={integration.logo}
                alt={integration.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${integration.name}&background=random&size=80`;
                }}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            >
              Integração com <span className="text-accent">{integration.name}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/80 mb-8"
            >
              {integration.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register">
                <Button size="xl" className="bg-accent text-white hover:brightness-110 shadow-accent group">
                  Começar agora
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8 text-center">
            O que você pode fazer
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {integration.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-accent" />
                </div>
                <span className="text-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Pronto para integrar?
          </h2>
          <Link to="/register">
            <Button size="xl" className="bg-accent text-white hover:brightness-110 shadow-accent">
              Começar agora mesmo
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
