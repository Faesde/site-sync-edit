import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  BookOpen, 
  Store,
  ChevronRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

const industries = [
  {
    id: "ecommerce",
    icon: ShoppingCart,
    title: "E-commerce",
    description: "A plataforma mais completa que sua loja precisa, vai melhorar a experiência de compra dos seus clientes. Aumente suas conversões com nossas ferramentas de marketing, otimize sua loja instalando nossos plugins e tenha o total controle das métricas do seu negócio.",
    features: [
      "Recuperação de carrinho abandonado",
      "Rastreamento de pedidos automático",
      "Integração com principais plataformas",
      "Dashboard de métricas em tempo real"
    ],
    color: "primary",
  },
  {
    id: "infoprodutos",
    icon: BookOpen,
    title: "Infoprodutos",
    description: "Aumente a praticidade das suas vendas: envie seus produtos de forma automática e mantenha listas de leads para o envio de e-mails segmentados ao interesse de seus contatos. Maximize seu faturamento com a ferramenta mais completa do mercado.",
    features: [
      "Entrega automática de produtos digitais",
      "Segmentação avançada de leads",
      "Funis de vendas automatizados",
      "Integração com Hotmart, Kiwify e mais"
    ],
    color: "accent",
  },
  {
    id: "locais",
    icon: Store,
    title: "Negócios Locais",
    description: "Saia na frente da concorrência oferecendo um atendimento prático e humano aos seus clientes. Acompanhe os gastos e lucros do seu negócio em tempo real. Use nossas ferramentas de marketing para potencializar o seu empreendimento.",
    features: [
      "Agendamento automático",
      "Chatbot para atendimento 24/7",
      "Campanhas de fidelização",
      "Relatórios financeiros completos"
    ],
    color: "primary",
  },
];

export const Solutions = () => {
  return (
    <section id="solucoes" className="py-24 bg-muted/30 relative">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Para quem a <span className="text-primary">WikiHub</span> é indicada?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Soluções específicas para cada tipo de negócio
          </p>
        </motion.div>

        {/* Industries Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                {/* Header */}
                <div className="mb-6">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    WikiHub para
                  </span>
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      industry.color === "primary" 
                        ? "bg-primary-light" 
                        : "bg-accent-light"
                    }`}>
                      <industry.icon className={`w-6 h-6 ${
                        industry.color === "primary" 
                          ? "text-primary" 
                          : "text-accent"
                      }`} />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground">
                      {industry.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                  {industry.description}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {industry.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        industry.color === "primary" 
                          ? "text-primary" 
                          : "text-accent"
                      }`} />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="w-full group/btn">
                    Saiba mais
                    <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                  <Button variant="hero" size="sm" className="w-full">
                    Começar agora mesmo!
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
