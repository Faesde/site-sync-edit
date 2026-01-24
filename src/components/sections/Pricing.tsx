import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "WikiBasic",
    subtitle: "Ideal para quem precisa do básico",
    price: "159",
    popular: false,
    features: [
      "Dashboard",
      "Automação de E-mails (5.000 envios)",
      "Automação de WhatsApp\n(1 número conectado, sem chatbot)",
      "Multi-atendimento para WhatsApp\n(atendentes compartilhando o mesmo número)",
      "Editor de E-mails com IA",
      "∞ Leads Ilimitados",
      "∞ Pedidos Ilimitados",
      "∞ Atendentes Ilimitados",
      "Plugin de Rastreamento",
      "Plugin de WhatsApp",
    ],
  },
  {
    name: "WikiEssentials",
    subtitle: "Ideal para quem deseja agregar valor",
    price: "189",
    popular: false,
    features: [
      "Tudo do plano Basic, mais:",
      "Automação de E-mails (12.000 envios)",
      "Automação de WhatsApp\n(1 número conectado, sem chatbot)",
      "Automação de E-mail e WhatsApp para Atualização de Rastreamento",
      "Campanha de E-mails",
      "Importação de Leads por Formulário HTML e Planilha",
    ],
  },
  {
    name: "WikiPro",
    subtitle: "Ideal para quem está escalando",
    price: "289",
    popular: true,
    features: [
      "Tudo do plano Essentials, mais:",
      "Automação de E-mails (30.000 envios)",
      "Automação de WhatsApp\n(2 números conectados, com chatbot)",
      "Integração com API Oficial do WhatsApp",
      "Criação de Chatbots para WhatsApp",
      "Campanhas Avançadas\n(E-mail, WhatsApp, SMS e Ligação Telefônica)",
      "Automação de SMS",
      "Automação de Ligação Telefônica",
      "Automação de Webhook",
      "Acesso à API (Documentação)",
    ],
  },
  {
    name: "WikiBusiness",
    subtitle: "Ideal para quem deseja atingir o topo",
    price: "489",
    popular: false,
    features: [
      "Tudo do plano Pro, mais:",
      "Automação de E-mails (50.000 envios)",
      "Automação de WhatsApp\n(4 números conectados, com chatbot)",
      "Integração com API Oficial do WhatsApp",
      "Integração com ChatGPT",
      'Bloco "Enviar Webhook" para automações e campanhas avançadas',
      'Bloco "Executar JavaScript" para automações e campanhas avançadas',
      'Bloco "Adicionar à lista" para automações e campanhas avançadas',
      'Bloco "Remover da lista" para automações e campanhas avançadas',
    ],
  },
];

export const Pricing = () => {
  return (
    <section id="planos" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Escolha o plano <span className="text-accent">ideal</span> para você
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Planos flexíveis para cada etapa do seu crescimento. Comece hoje mesmo!
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative bg-card rounded-2xl p-6 border transition-all duration-300 flex flex-col
                ${plan.popular 
                  ? "border-accent shadow-lg shadow-accent/20 scale-[1.02]" 
                  : "border-border hover:border-accent/30 hover:shadow-md"
                }
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" fill="currentColor" />
                    Mais escolhido
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6 pt-2">
                <h3 className="font-display text-2xl font-bold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.subtitle}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">por mês</p>
              </div>

              {/* Features */}
              <div className="mb-8 flex-1">
                <p className="text-sm font-semibold text-foreground mb-4">
                  O que está incluído?
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground whitespace-pre-line">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <Link to="/register" className="mt-auto">
                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  Começar agora
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
