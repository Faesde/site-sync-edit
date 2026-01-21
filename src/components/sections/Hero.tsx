import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Hero = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden bg-gradient-hero">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-10 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="text-sm font-medium text-accent uppercase tracking-wider">
              A ferramenta com a <span className="font-bold text-white">maior conversão do mercado</span>
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6"
          >
            Maximize suas métricas.{" "}
            <span className="block">Todas as funcionalidades que seu negócio precisa em apenas um só lugar!</span>
          </motion.h1>

          {/* Email Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto mb-6"
          >
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 pr-4 rounded-xl bg-white text-foreground border-0 placeholder:text-muted-foreground"
                />
              </div>
              <Button variant="hero" size="lg" className="w-full rounded-xl h-14">
                Começar agora mesmo!
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-white/80 text-base"
          >
            Tenha <span className="font-bold text-accent">+10 ferramentas</span> em um único lugar.{" "}
            <span className="italic text-white/70">Não perca tempo, cadastre-se agora.</span>
          </motion.p>
        </div>
      </div>

      {/* Decorative Stripes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden"
      >
        <div className="flex items-end justify-center gap-2 h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-8 bg-accent/80 rounded-t-sm"
              style={{
                height: `${30 + Math.random() * 70}%`,
                opacity: 0.4 + Math.random() * 0.6,
              }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
};
