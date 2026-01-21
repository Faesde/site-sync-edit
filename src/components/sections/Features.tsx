import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard,
  Bot,
  MessageSquare,
  Workflow,
  Mail,
  MessageCircle,
  Smartphone,
  Phone,
  Puzzle,
  Shield,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Nosso dashboard intuitivo centraliza todas as métricas do seu negócio, oferecendo insights em tempo real, gráficos personalizados e relatórios automatizados para decisões estratégicas.",
    color: "primary",
  },
  {
    id: "chatbot",
    icon: Bot,
    title: "Chatbot",
    description: "Junte o poder da IA com nosso poderoso construtor de chatbot. Automatize atendimentos, responda dúvidas frequentes e qualifique leads 24 horas por dia.",
    color: "accent",
  },
  {
    id: "chat",
    icon: MessageSquare,
    title: "Chat de Mensagens",
    description: "Gerencie todas as conversas em um só lugar. Multi-atendimento com vários atendentes compartilhando o mesmo número de WhatsApp.",
    color: "primary",
  },
  {
    id: "automation",
    icon: Workflow,
    title: "Automação e Campanhas",
    description: "Crie automações poderosas e intuitivas. Utilize WhatsApp, E-mail, SMS e Ligações telefônicas de forma integrada.",
    color: "accent",
  },
  {
    id: "email",
    icon: Mail,
    title: "E-mail Marketing",
    description: "Envie campanhas de e-mail personalizadas com editor visual e IA. Segmente sua lista e acompanhe métricas de abertura e cliques.",
    color: "primary",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    title: "WhatsApp Marketing",
    description: "Integração com a API Oficial do WhatsApp. Conecte múltiplos números, envie mensagens em massa e crie chatbots avançados.",
    color: "accent",
  },
  {
    id: "sms",
    icon: Smartphone,
    title: "SMS Marketing",
    description: "Envie SMS em massa com alta taxa de entrega. SMS Flash disruptivo e shortcode para máximo impacto.",
    color: "primary",
  },
  {
    id: "voice",
    icon: Phone,
    title: "Voz/Ligação Marketing",
    description: "Ligações automáticas com URA personalizada. Pesquisas por voz, confirmações e campanhas de telemarketing automatizadas.",
    color: "accent",
  },
  {
    id: "plugins",
    icon: Puzzle,
    title: "Plugins",
    description: "Rastreamento de pedidos, botão para WhatsApp e muito mais. Plugins prontos para e-commerce e negócios locais.",
    color: "primary",
  },
  {
    id: "higienizacao",
    icon: Shield,
    title: "Higienização de Dados",
    description: "Limpe e valide sua base de contatos automaticamente. Remova números inválidos, duplicados e melhore a qualidade dos seus leads.",
    color: "accent",
  },
];

export const Features = () => {
  const [activeFeature, setActiveFeature] = useState(features[0]);

  return (
    <section id="ferramentas" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Todas <span className="text-accent">ferramentas</span> que você precisa!
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Somos a plataforma perfeita para você crescer o seu negócio. Tenha mais de 10 ferramentas em um único lugar!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Feature Tabs */}
          <div className="lg:col-span-4">
            <div className="flex flex-wrap lg:flex-col gap-2">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-left w-full
                    ${activeFeature.id === feature.id 
                      ? "bg-primary text-primary-foreground shadow-primary" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }
                  `}
                >
                  <feature.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{feature.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden"
              >
                <div className="p-8 lg:p-12">
                  <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full mb-6 ${
                    activeFeature.color === "primary" 
                      ? "bg-primary-light text-primary" 
                      : "bg-accent-light text-accent"
                  }`}>
                    <activeFeature.icon className="w-5 h-5" />
                    <span className="font-semibold">{activeFeature.title}</span>
                  </div>

                  <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {activeFeature.title}
                  </h3>

                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    {activeFeature.description}
                  </p>

                  <Button variant="hero" size="lg" className="group">
                    Começar agora mesmo
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>

                {/* Visual Placeholder */}
                <div className={`h-64 ${
                  activeFeature.color === "primary" 
                    ? "bg-primary-light" 
                    : "bg-accent-light"
                }`}>
                  <div className="h-full flex items-center justify-center">
                    <activeFeature.icon className={`w-32 h-32 ${
                      activeFeature.color === "primary" 
                        ? "text-primary/30" 
                        : "text-accent/30"
                    }`} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
