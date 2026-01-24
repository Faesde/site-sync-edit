import { motion } from "framer-motion";
import { 
  Bot, 
  Smartphone, 
  Puzzle, 
  ShoppingCart,
  Workflow,
  Radio,
  LayoutDashboard,
  Package
} from "lucide-react";

const gridItems = [
  {
    icon: Bot,
    title: "Chatbot + ChatGPT",
    description: "Junte o poder da IA com nosso poderoso construtor de chatbot.",
    className: "md:col-span-1 md:row-span-2",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: Smartphone,
    title: "Utilize Múltiplos Números",
    description: "Conecte múltiplos números de WhatsApp à sua conta, distribuindo suas automações e atendentes por cada número, e escalando sua operação de maneira eficiente.",
    className: "md:col-span-1 md:row-span-2",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Puzzle,
    title: "Plugins",
    description: "Use nosso Rastreamento de Pedidos e Botão para WhatsApp.",
    className: "md:col-span-1 md:row-span-1",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: ShoppingCart,
    title: "Pedidos, Carrinhos Abandonados e Números de Rastreio",
    description: "Simplifique seu negócio on-line com soluções integradas para gerenciamento de pedidos, recuperar carrinhos abandonados e rastreamento de encomendas.",
    className: "md:col-span-1 md:row-span-1",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Workflow,
    title: "Construtor de Automação Avançado",
    description: "Crie automações poderosas e intuitivas com nossa plataforma, utilize o WhatsApp, E-mail, SMS e Ligações telefônicas de forma integrada.",
    className: "md:col-span-1 md:row-span-1",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: Radio,
    title: "Comunicação Omnichannel",
    description: "Esteja presente onde seu cliente está, realize mais vendas diariamente.",
    className: "md:col-span-1 md:row-span-1",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Inteligente",
    description: "Nosso dashboard intuitivo centraliza todas as métricas do seu negócio, oferecendo insights em tempo real, gráficos personalizados e relatórios automatizados para decisões estratégicas e gestão otimizada.",
    className: "md:col-span-2 md:row-span-1",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
];

export const BentoGrid = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {gridItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`
                bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 
                hover:border-accent/30 group
                ${item.className}
              `}
            >
              <div className={`
                w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center mb-4
                group-hover:scale-110 transition-transform duration-300
              `}>
                <item.icon className={`w-7 h-7 ${item.iconColor}`} />
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {item.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              {/* Visual decorations for larger cards */}
              {item.className.includes("row-span-2") && (
                <div className="mt-6 rounded-xl bg-muted/50 p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                    <div className="h-2 bg-muted rounded w-2/3" />
                  </div>
                </div>
              )}

              {/* Phone numbers visual for multiple numbers card */}
              {item.title.includes("Múltiplos Números") && (
                <div className="mt-4 space-y-2">
                  {["+55 (24) 9XXXX-XXXX", "+55 (19) 9XXXX-XXXX", "+55 (47) 9XXXX-XXXX"].map((num, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <Smartphone className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-muted-foreground">{num}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
