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
import { Link } from "react-router-dom";

const features = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    title: "Dashboard",
    description: "Nosso dashboard intuitivo centraliza todas as métricas do seu negócio, oferecendo insights em tempo real, gráficos personalizados e relatórios automatizados para decisões estratégicas.",
    mockupBg: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
    iconColor: "text-primary",
  },
  {
    id: "chatbot",
    icon: Bot,
    label: "Chatbot",
    title: "Chatbot",
    description: "Junte o poder da IA com nosso poderoso construtor de chatbot. Automatize atendimentos, responda dúvidas frequentes e qualifique leads 24 horas por dia.",
    mockupBg: "from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20",
    iconColor: "text-accent",
  },
  {
    id: "chat",
    icon: MessageSquare,
    label: "Chat de Mensagens",
    title: "Chat de Mensagens",
    description: "Gerencie todas as conversas em um só lugar. Multi-atendimento com vários atendentes compartilhando o mesmo número de WhatsApp.",
    mockupBg: "from-cyan-50 to-teal-100 dark:from-cyan-950/30 dark:to-teal-900/20",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "automation",
    icon: Workflow,
    label: "Automação e Campanhas",
    title: "Automação e Campanhas",
    description: "Crie automações poderosas e intuitivas. Utilize WhatsApp, E-mail, SMS e Ligações telefônicas de forma integrada.",
    mockupBg: "from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "email",
    icon: Mail,
    label: "E-mail Marketing",
    title: "E-mail Marketing",
    description: "Envie campanhas de e-mail personalizadas com editor visual e IA. Segmente sua lista e acompanhe métricas de abertura e cliques.",
    mockupBg: "from-indigo-50 to-blue-100 dark:from-indigo-950/30 dark:to-blue-900/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp Marketing",
    title: "WhatsApp Marketing",
    description: "Integração com a API Oficial do WhatsApp. Conecte múltiplos números, envie mensagens em massa e crie chatbots avançados.",
    mockupBg: "from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    id: "sms",
    icon: Smartphone,
    label: "SMS Marketing",
    title: "SMS Marketing",
    description: "Envie SMS em massa com alta taxa de entrega. SMS Flash disruptivo e shortcode para máximo impacto.",
    mockupBg: "from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "voice",
    icon: Phone,
    label: "Voz/Ligação Marketing",
    title: "Voz/Ligação Marketing",
    description: "Ligações automáticas com URA personalizada. Pesquisas por voz, confirmações e campanhas de telemarketing automatizadas.",
    mockupBg: "from-rose-50 to-pink-100 dark:from-rose-950/30 dark:to-pink-900/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "plugins",
    icon: Puzzle,
    label: "Plugins",
    title: "Plugins",
    description: "Rastreamento de pedidos, botão para WhatsApp e muito mais. Plugins prontos para e-commerce e negócios locais.",
    mockupBg: "from-slate-50 to-gray-100 dark:from-slate-950/30 dark:to-gray-900/20",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  {
    id: "higienizacao",
    icon: Shield,
    label: "Higienização de Dados",
    title: "Higienização de Dados",
    description: "Limpe e valide sua base de contatos automaticamente. Remova números inválidos, duplicados e melhore a qualidade dos seus leads.",
    mockupBg: "from-emerald-900 to-green-950",
    iconColor: "text-accent",
    isDark: true,
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
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Todas <span className="text-accent">ferramentas</span> que você precisa!
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Somos a plataforma perfeita para você crescer o seu negócio. Tenha mais de 10 ferramentas em um único lugar!
          </p>
        </motion.div>

        {/* Horizontal Tab Bar - Reportana Style */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-4">
          <div className="flex items-end gap-2 md:gap-4">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature)}
                className="flex flex-col items-center gap-2 min-w-[80px] md:min-w-[100px] group"
              >
                <div
                  className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-300
                    ${activeFeature.id === feature.id 
                      ? "bg-accent text-white shadow-lg shadow-accent/30 scale-110" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80 group-hover:text-foreground"
                    }
                  `}
                >
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span 
                  className={`
                    text-xs md:text-sm font-medium text-center transition-colors leading-tight
                    ${activeFeature.id === feature.id 
                      ? "text-foreground" 
                      : "text-muted-foreground group-hover:text-foreground"
                    }
                  `}
                >
                  {feature.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Content - Reportana Style */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`
              rounded-3xl overflow-hidden shadow-xl
              ${activeFeature.isDark 
                ? "bg-gradient-to-br " + activeFeature.mockupBg 
                : "bg-gradient-to-br " + activeFeature.mockupBg
              }
            `}
          >
            <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12 items-center">
              {/* Left - Content */}
              <div>
                <div className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6
                  ${activeFeature.isDark 
                    ? "bg-accent/20 text-accent" 
                    : "bg-accent text-white"
                  }
                `}>
                  <activeFeature.icon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{activeFeature.label}</span>
                </div>

                <h3 className={`
                  font-display text-3xl md:text-4xl font-bold mb-4
                  ${activeFeature.isDark ? "text-white" : "text-foreground"}
                `}>
                  {activeFeature.title}
                </h3>

                <p className={`
                  text-lg mb-8 leading-relaxed
                  ${activeFeature.isDark ? "text-white/80" : "text-muted-foreground"}
                `}>
                  {activeFeature.description}
                </p>

                <Link to="/login">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="group bg-accent hover:bg-accent/90 text-white"
                  >
                    Começar agora mesmo
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              {/* Right - Mockup Visual */}
              <div className="relative">
                <div className={`
                  aspect-[4/3] rounded-2xl flex items-center justify-center
                  ${activeFeature.isDark 
                    ? "bg-emerald-800/30" 
                    : "bg-white/60 dark:bg-white/10 backdrop-blur-sm shadow-lg border border-white/40"
                  }
                `}>
                  {/* Dashboard Mockup */}
                  {activeFeature.id === "dashboard" && (
                    <div className="w-full h-full p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">Dashboard</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-xs text-accent font-medium">Online</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Receita</p>
                          <p className="font-bold text-primary">R$ 57.456</p>
                        </div>
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Custo</p>
                          <p className="font-bold text-yellow-600">R$ 19.152</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Lucro</p>
                          <p className="font-bold text-accent">R$ 12.448</p>
                        </div>
                      </div>
                      <div className="h-20 bg-white dark:bg-card rounded-lg p-2 flex items-end gap-1">
                        {[40, 60, 35, 80, 55, 70, 45].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}>
                            <div className="w-full bg-primary rounded-t" style={{ height: `${h * 0.7}%` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Icon Display for Other Features */}
                  {activeFeature.id !== "dashboard" && (
                    <activeFeature.icon 
                      className={`
                        w-24 h-24 md:w-32 md:h-32
                        ${activeFeature.isDark 
                          ? "text-accent/40" 
                          : activeFeature.iconColor + " opacity-30"
                        }
                      `} 
                    />
                  )}
                </div>

                {/* Floating Phone Mockup for Mobile Features */}
                {(activeFeature.id === "whatsapp" || activeFeature.id === "sms" || activeFeature.id === "email") && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -right-4 -bottom-4 w-32 md:w-40 bg-white dark:bg-card rounded-2xl shadow-xl p-2 border border-border"
                  >
                    <div className="bg-accent rounded-xl p-2 mb-2">
                      <p className="text-white text-[10px] font-semibold">Seu negócio</p>
                      <p className="text-white/80 text-[8px]">Nova mensagem!</p>
                    </div>
                    <div className="space-y-1">
                      <div className="bg-muted rounded p-1.5">
                        <p className="text-[8px] text-muted-foreground">Lucro líquido</p>
                        <p className="text-[10px] font-bold text-accent">R$ 8.654,46</p>
                      </div>
                      <div className="bg-muted rounded p-1.5">
                        <p className="text-[8px] text-muted-foreground">Receita</p>
                        <p className="text-[10px] font-bold text-primary">R$ 35.177,60</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >
          <Link to="/login">
            <Button 
              size="xl" 
              className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/30"
            >
              Começar agora mesmo
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
