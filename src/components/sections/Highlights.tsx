import { motion } from "framer-motion";
import { 
  Bot, 
  Smartphone, 
  Puzzle, 
  ShoppingCart,
  Workflow,
  Radio,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: Bot,
    title: "Chatbot + ChatGPT",
    description: "Junte o poder da IA com nosso poderoso construtor de chatbot.",
    size: "large",
  },
  {
    icon: Smartphone,
    title: "Utilize Múltiplos Números",
    description: "Conecte múltiplos números de WhatsApp à sua conta, distribuindo suas automações e atendentes por cada número.",
    size: "medium",
  },
  {
    icon: Puzzle,
    title: "Plugins",
    description: "Use nosso Rastreamento de Pedidos e Botão para WhatsApp.",
    size: "small",
  },
  {
    icon: ShoppingCart,
    title: "Pedidos e Carrinhos Abandonados",
    description: "Simplifique seu negócio on-line com soluções integradas para gerenciamento de pedidos, recuperar carrinhos abandonados e rastreamento de encomendas.",
    size: "medium",
  },
  {
    icon: Workflow,
    title: "Construtor de Automação Avançado",
    description: "Crie automações poderosas e intuitivas com nossa plataforma, utilize o WhatsApp, E-mail, SMS e Ligações telefônicas de forma integrada.",
    size: "large",
  },
  {
    icon: Radio,
    title: "Comunicação Omnichannel",
    description: "Esteja presente onde seu cliente está, realize mais vendas diariamente.",
    size: "small",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Inteligente",
    description: "Nosso dashboard intuitivo centraliza todas as métricas do seu negócio, oferecendo insights em tempo real e relatórios automatizados.",
    size: "medium",
  },
];

export const Highlights = () => {
  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`
                bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300
                ${highlight.size === "large" ? "md:col-span-2 lg:col-span-1" : ""}
              `}
            >
              <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                <highlight.icon className="w-7 h-7 text-primary" />
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {highlight.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {highlight.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button variant="hero" size="lg">
            Começar agora mesmo
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
