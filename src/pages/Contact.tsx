import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  MessageCircle, 
  Mail, 
  MapPin,
  Clock,
  Send
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const contactMethods = [
  { 
    icon: MessageCircle, 
    title: "WhatsApp", 
    description: "Atendimento rápido pelo WhatsApp",
    action: "Iniciar conversa",
    href: "https://wa.me/5511995833281"
  },
  { 
    icon: Mail, 
    title: "Email", 
    description: "contato@wikimarketing.com.br",
    action: "Enviar email",
    href: "mailto:contato@wikimarketing.com.br"
  },
  { 
    icon: Clock, 
    title: "Horário", 
    description: "Seg-Sex: 9h às 18h",
    action: null,
    href: null
  },
];

export default function Contact() {
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
              Fale <span className="text-accent">Conosco</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/80"
            >
              Estamos aqui para ajudar. Entre em contato por qualquer canal.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Methods */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-8">Canais de Atendimento</h2>
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <method.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-foreground">{method.title}</h3>
                      <p className="text-muted-foreground text-sm">{method.description}</p>
                    </div>
                    {method.action && method.href && (
                      <a href={method.href} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          {method.action}
                        </Button>
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-8 p-6 bg-accent/10 rounded-2xl border border-accent/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-foreground text-lg">Atendimento Imediato</h3>
                    <p className="text-muted-foreground">Fale agora com um especialista pelo WhatsApp</p>
                  </div>
                  <a href="https://wa.me/5511995833281" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-accent text-white hover:brightness-110">
                      Chamar no WhatsApp
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl border border-border p-8"
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">Envie uma mensagem</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" placeholder="Seu nome" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input id="subject" placeholder="Como podemos ajudar?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea id="message" placeholder="Descreva sua dúvida ou solicitação..." rows={5} />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:brightness-110">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar mensagem
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
