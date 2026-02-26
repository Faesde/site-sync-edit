import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Play, FileText, GraduationCap } from "lucide-react";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Training {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  duration_hours: number | null;
  difficulty_level: string;
  pdf_url: string | null;
  cover_image_url: string | null;
  created_at: string;
}

const difficultyLabels: Record<string, string> = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" };
const difficultyColors: Record<string, string> = { beginner: "bg-green-500/10 text-green-700 dark:text-green-400", intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", advanced: "bg-red-500/10 text-red-700 dark:text-red-400" };

const Treinamentos = () => {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ["public-trainings"],
    queryFn: async () => {
      const { data, error } = await supabaseWiki
        .from("trainings")
        .select("id, title, description, video_url, duration_hours, difficulty_level, pdf_url, cover_image_url, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Training[];
    },
  });

  const filtered = trainings.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !levelFilter || t.difficulty_level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-accent/10 via-background to-primary/10 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Treinamentos
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Aprenda a dominar o marketing digital com nossos cursos e materiais
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar treinamentos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12">
          {/* Level filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge variant={!levelFilter ? "default" : "outline"} className="cursor-pointer" onClick={() => setLevelFilter(null)}>Todos</Badge>
            {["beginner", "intermediate", "advanced"].map(level => (
              <Badge key={level} variant={levelFilter === level ? "default" : "outline"} className="cursor-pointer" onClick={() => setLevelFilter(level)}>
                {difficultyLabels[level]}
              </Badge>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-5 space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Nenhum treinamento encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t, idx) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    {t.cover_image_url ? (
                      <img src={t.cover_image_url} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><GraduationCap className="h-12 w-12" /></div>
                    )}
                    {t.video_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-primary rounded-full p-3"><Play className="h-6 w-6 text-primary-foreground" /></div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[t.difficulty_level] || ""}`}>
                        {difficultyLabels[t.difficulty_level] || t.difficulty_level}
                      </span>
                      {t.duration_hours && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{t.duration_hours}h</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{t.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{t.description}</p>
                    <div className="flex items-center gap-2">
                      {t.video_url && (
                        <Button size="sm" asChild>
                          <a href={t.video_url} target="_blank" rel="noopener"><Play className="h-4 w-4 mr-1" />Assistir</a>
                        </Button>
                      )}
                      {t.pdf_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={t.pdf_url} target="_blank" rel="noopener"><FileText className="h-4 w-4 mr-1" />PDF</a>
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Treinamentos;
