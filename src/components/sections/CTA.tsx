import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-hero">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Descubra o porquê a{" "}
            <span className="text-accent">Wiki Marketing é a ferramenta certa</span>{" "}
            para o seu negócio!
          </h2>

          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Fale conosco e tire todas as suas dúvidas. Nossa equipe está pronta para ajudar você a crescer.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="xl"
              className="bg-accent text-accent-foreground hover:brightness-110 shadow-lg hover:shadow-xl transition-all group"
            >
              Começar agora mesmo!
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outlineLight"
              className="group"
            >
              <MessageCircle className="w-5 h-5" />
              Fale conosco
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
