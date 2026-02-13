import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { 
  Zap, 
  GitBranch, 
  Clock, 
  Filter,
  ArrowRight,
  Check,
  Target,
  Users,
  MessageCircle,
  Mail
} from "lucide-react";

const features = [
  { icon: GitBranch, title: "Fluxos Visuais", description: "Crie automações com drag-and-drop intuitivo" },
  { icon: Filter, title: "Segmentação Avançada", description: "Filtre contatos por comportamento e tags" },
  { icon: Clock, title: "Agendamento", description: "Dispare campanhas no momento certo" },
  { icon: Target, title: "Triggers Inteligentes", description: "Ações automáticas baseadas em eventos" },
  { icon: Users, title: "Listas Dinâmicas", description: "Segmentos que se atualizam automaticamente" },
  { icon: MessageCircle, title: "Multichannel", description: "WhatsApp, Email, SMS e Voz integrados" },
];

const useCases = [
  "Recuperação de carrinho abandonado",
  "Sequência de boas-vindas",
  "Reativação de clientes inativos",
  "Notificações de pedido e entrega",
  "Campanhas de aniversário",
  "Follow-up pós-venda",
];

export default function Automation() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl" 
          />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6"
            >
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-white">Automação & Campanhas</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              Automatize suas campanhas e{" "}
              <span className="text-accent">venda no piloto automático</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/80 mb-8"
            >
              Crie fluxos inteligentes que disparam mensagens no momento certo, segmente sua base e acompanhe resultados em tempo real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register">
                <Button size="xl" className="bg-accent text-white hover:brightness-110 shadow-accent group">
                  Começar agora
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="https://wa.me/5511995833281" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outlineLight">
                  Fale com um especialista
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recursos de <span className="text-accent">Automação</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Casos de Uso
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {useCases.map((useCase, index) => (
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
                <span className="text-foreground">{useCase}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para automatizar?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Comece gratuitamente e veja resultados em poucos dias.
            </p>
            <Link to="/register">
              <Button size="xl" className="bg-accent text-white hover:brightness-110 shadow-accent">
                Começar agora mesmo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
