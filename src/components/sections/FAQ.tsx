import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é a Wiki Marketing?",
    answer: "A Wiki Marketing é uma plataforma de marketing para E-commerces, Infoprodutos e Negócios Locais. Nossa ferramenta permite a comunicação com os seus clientes de modo prático e ágil, além de ferramentas que irão alavancar o seu negócio nos canais digitais, aumentando as suas vendas e conversões."
  },
  {
    question: "Possui suporte?",
    answer: "Sim, oferecemos suporte total da nossa ferramenta para clientes e interessados. Horário de Atendimento: Segunda a Sexta: 9h-12h e 14h-17h, Sábado: 9h-12h. O acesso ao suporte fica disponível dentro da nossa plataforma."
  },
  {
    question: "A Wiki Marketing envia mensagens automáticas de WhatsApp?",
    answer: "Sim! Temos dois métodos de envio: Automações e Campanhas Avançadas (envio automático, sem necessidade de ação humana, basta configurar uma vez e deixar funcionando) e através de disparos manuais para campanhas específicas."
  },
  {
    question: "O envio de mensagens de WhatsApp é ilimitado?",
    answer: "Cada um de nossos planos possui uma quantidade fixa de envio de mensagens por mês. Caso utilize todo saldo de envio, você pode adquirir pacotes de créditos adicionais."
  },
  {
    question: "Tenho que pagar mais alguma coisa além da assinatura?",
    answer: "Não, exceto se desejar adquirir mais créditos de E-mail, SMS ou Ligação telefônica além dos disponibilizados mensalmente."
  },
  {
    question: "Quais são as formas de pagamento?",
    answer: "Para realizar a assinatura de um de nossos planos é necessário cartão de crédito ou PIX. Também aceitamos boleto bancário para planos anuais."
  },
  {
    question: "Como funciona a Higienização de Dados?",
    answer: "Nossa ferramenta de higienização analisa automaticamente sua base de contatos, identificando e removendo números inválidos, duplicados e inativos. Isso melhora suas taxas de entrega e reduz custos com envios desnecessários."
  },
];

export const FAQ = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Perguntas <span className="text-accent">frequentes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas de como funciona a Wiki Marketing!
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-md transition-all"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
