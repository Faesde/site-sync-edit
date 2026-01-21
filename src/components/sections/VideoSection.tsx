import { motion } from "framer-motion";
import { Play, PlayCircle } from "lucide-react";
import { useState } from "react";

export const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Quando você tiver o vídeo, substitua esta URL
  const videoUrl = ""; // Ex: "https://www.youtube.com/embed/SEU_VIDEO_ID"

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Veja como <span className="text-accent">funciona</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Assista ao vídeo e descubra como nossa plataforma pode transformar a comunicação do seu negócio
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
            {videoUrl && isPlaying ? (
              <iframe
                src={videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div 
                className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => videoUrl && setIsPlaying(true)}
              >
                {/* Placeholder Visual */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary opacity-90" />
                
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                  }} />
                </div>

                {/* Play Button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-xl flex items-center justify-center group-hover:shadow-2xl transition-shadow"
                >
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" fill="currentColor" />
                </motion.div>

                {/* Text */}
                <p className="relative z-10 mt-6 text-white/90 font-medium text-lg">
                  {videoUrl ? "Clique para assistir" : "Vídeo em breve"}
                </p>
                <p className="relative z-10 mt-2 text-white/60 text-sm">
                  {videoUrl ? "Duração: 3 minutos" : "Estamos preparando um vídeo explicativo"}
                </p>

                {/* Decorative Elements */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-10 right-10 w-32 h-32 rounded-full bg-accent/20 blur-2xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"
                />
              </div>
            )}
          </div>

          {/* Video Features */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <PlayCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Tour Completo</p>
              <p className="text-xs text-muted-foreground">Conheça a plataforma</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <PlayCircle className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground">Passo a Passo</p>
              <p className="text-xs text-muted-foreground">Aprenda a usar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <PlayCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Casos de Uso</p>
              <p className="text-xs text-muted-foreground">Exemplos reais</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
