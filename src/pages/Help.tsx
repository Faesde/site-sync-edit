import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { 
  Search, 
  MessageCircle, 
  Book, 
  Video, 
  FileText,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = [
  { icon: Book, title: "Primeiros Passos", description: "Guias para começar a usar a plataforma", count: 12 },
  { icon: MessageCircle, title: "WhatsApp", description: "Configuração e uso do WhatsApp", count: 18 },
  { icon: Video, title: "Tutoriais em Vídeo", description: "Aprenda assistindo", count: 8 },
  { icon: FileText, title: "Integrações", description: "Como conectar suas ferramentas", count: 15 },
  { icon: HelpCircle, title: "FAQ", description: "Perguntas frequentes", count: 25 },
];

const popularArticles = [
  "Como configurar a API do WhatsApp",
  "Criando sua primeira automação",
  "Importando contatos por CSV",
  "Configurando recuperação de carrinho",
  "Integrando com Shopify",
];

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            >
              Central de <span className="text-accent">Ajuda</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/80 mb-8"
            >
              Encontre respostas, tutoriais e guias para aproveitar ao máximo nossa plataforma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-xl mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar artigos, tutoriais..." 
                className="pl-12 h-14 text-lg bg-white border-0"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">Categorias</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <category.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-2">{category.description}</p>
                <span className="text-xs text-muted-foreground">{category.count} artigos</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">Artigos Populares</h2>
          <div className="max-w-2xl">
            {popularArticles.map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border mb-3 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-foreground group-hover:text-primary transition-colors flex-grow">{article}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Não encontrou o que procura?
          </h2>
          <p className="text-white/80 mb-8">
            Nossa equipe está pronta para ajudar!
          </p>
          <Link to="/contact">
            <Button size="xl" className="bg-accent text-white hover:brightness-110 shadow-accent">
              Fale Conosco
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
