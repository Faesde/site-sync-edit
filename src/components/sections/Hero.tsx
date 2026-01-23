import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Zap, 
  MessageCircle, 
  Phone, 
  Mail, 
  BarChart3,
  Users,
  Shield,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const floatingIcons = [
  { icon: MessageCircle, delay: 0, x: -120, y: -80 },
  { icon: Phone, delay: 0.2, x: 150, y: -60 },
  { icon: Mail, delay: 0.4, x: -180, y: 40 },
  { icon: BarChart3, delay: 0.6, x: 180, y: 80 },
  { icon: Users, delay: 0.8, x: -100, y: 120 },
];

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background - Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" 
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-white">
                Potencialize suas vendas com IA
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              Conecte-se com seus clientes.{" "}
              <span className="relative">
                <span className="text-accent">Automatize.</span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="absolute bottom-2 left-0 h-3 bg-accent/30 -z-10 rounded"
                />
              </span>{" "}
              Venda mais.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-white/80 max-w-xl mb-8"
            >
              WhatsApp, SMS, E-mail e Ligações em uma única plataforma. 
              Automatize campanhas, crie chatbots inteligentes e acompanhe métricas em tempo real.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
            >
              <Link to="/register">
                <Button size="xl" className="bg-accent text-white hover:brightness-110 shadow-accent group">
                  Começar agora
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="https://wa.me/5511995833281" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outlineLight" className="group">
                  <Zap className="w-5 h-5" />
                  Fale com um especialista
                </Button>
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-sm text-white/70">Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <span className="text-sm text-white/70">+5.000 empresas</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                <span className="text-sm text-white/70">Setup em 5 minutos</span>
              </div>
            </motion.div>
          </div>

          {/* Right Visual - Interactive Dashboard Preview */}
          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              {/* Main Dashboard Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-foreground">Dashboard</h3>
                      <p className="text-sm text-muted-foreground">Última atualização: agora</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-sm text-accent font-medium">Online</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-primary-light rounded-xl p-4">
                      <p className="text-sm text-muted-foreground mb-1">Mensagens Enviadas</p>
                      <p className="text-2xl font-bold text-primary">12.847</p>
                      <p className="text-xs text-accent">+23% esta semana</p>
                    </div>
                    <div className="bg-accent-light rounded-xl p-4">
                      <p className="text-sm text-muted-foreground mb-1">Taxa de Abertura</p>
                      <p className="text-2xl font-bold text-accent">94.2%</p>
                      <p className="text-xs text-primary">Acima da média</p>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="h-24 flex items-end justify-between gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: 0.8 + i * 0.05 }}
                        className={`flex-1 rounded-t ${i % 2 === 0 ? 'bg-primary' : 'bg-accent'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Icons */}
              {floatingIcons.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    opacity: { duration: 0.5, delay: item.delay },
                    scale: { duration: 0.5, delay: item.delay },
                    y: { duration: 3, repeat: Infinity, delay: item.delay }
                  }}
                  style={{ left: `calc(50% + ${item.x}px)`, top: `calc(50% + ${item.y}px)` }}
                  className="absolute w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                </motion.div>
              ))}

              {/* Notification Popup */}
              <motion.div
                initial={{ opacity: 0, x: 50, y: -20 }}
                animate={{ opacity: 1, x: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute -right-4 top-20 bg-white rounded-2xl p-4 shadow-xl border border-border max-w-[200px]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Nova conversão!</p>
                    <p className="text-xs text-muted-foreground">Cliente confirmou pedido via WhatsApp</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};
