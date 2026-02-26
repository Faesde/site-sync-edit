import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Search, Edit, Trash2, Loader2, GraduationCap, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Training {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string | null;
  duration_hours: number | null;
  difficulty_level: string;
  pdf_url: string | null;
  cover_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const emptyTraining: Partial<Training> = {
  title: "", description: "", video_url: "", duration_hours: null, difficulty_level: "beginner", pdf_url: "", cover_image_url: "", status: "draft",
};

const difficultyLabels: Record<string, string> = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" };

const AdminTreinamentos = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Partial<Training>>(emptyTraining);
  const [isEditing, setIsEditing] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ["admin-trainings"],
    queryFn: async () => {
      const { data, error } = await supabaseWiki.from("trainings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Training[];
    },
    enabled: !!user && role === "admin",
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<Training>) => {
      setUploading(true);
      let coverUrl = item.cover_image_url || null;
      let pdfUrl = item.pdf_url || null;

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `covers/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("training-files").upload(path, coverFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      if (pdfFile) {
        const path = `pdfs/${Date.now()}-${pdfFile.name}`;
        const { error: upErr } = await supabase.storage.from("training-files").upload(path, pdfFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(path);
        pdfUrl = urlData.publicUrl;
      }

      const payload = {
        title: item.title,
        description: item.description,
        video_url: item.video_url || null,
        duration_hours: item.duration_hours || null,
        difficulty_level: item.difficulty_level || "beginner",
        pdf_url: pdfUrl,
        cover_image_url: coverUrl,
        status: item.status || "draft",
        user_id: user!.id,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && item.id) {
        const { error } = await supabaseWiki.from("trainings").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseWiki.from("trainings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trainings"] });
      toast.success(isEditing ? "Treinamento atualizado!" : "Treinamento criado!");
      setDialogOpen(false);
      setCoverFile(null);
      setPdfFile(null);
      setUploading(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar");
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseWiki.from("trainings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trainings"] });
      toast.success("Treinamento excluído!");
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir"),
  });

  const openCreate = () => {
    setEditItem({ ...emptyTraining });
    setIsEditing(false);
    setCoverFile(null);
    setPdfFile(null);
    setDialogOpen(true);
  };

  const openEdit = (t: Training) => {
    setEditItem({ ...t });
    setIsEditing(true);
    setCoverFile(null);
    setPdfFile(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editItem.title?.trim()) { toast.error("Título é obrigatório"); return; }
    saveMutation.mutate(editItem);
  };

  const filtered = trainings.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || role !== "admin") { navigate("/"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="h-5 w-5" /></Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Treinamentos</h1>
              <p className="text-muted-foreground text-sm">Crie e gerencie treinamentos e cursos</p>
            </div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Treinamento</Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por título..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground"><GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Nenhum treinamento encontrado</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                        <TableCell><Badge variant="outline">{difficultyLabels[t.difficulty_level] || t.difficulty_level}</Badge></TableCell>
                        <TableCell>{t.duration_hours ? `${t.duration_hours}h` : "—"}</TableCell>
                        <TableCell><Badge variant={t.status === "published" ? "default" : "secondary"}>{t.status === "published" ? "Publicado" : "Rascunho"}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {t.status === "published" && <Button variant="ghost" size="icon" onClick={() => window.open("/treinamentos", "_blank")}><Eye className="h-4 w-4" /></Button>}
                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isEditing ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={editItem.title || ""} onChange={e => setEditItem(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={editItem.description || ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>URL do Vídeo</Label><Input value={editItem.video_url || ""} onChange={e => setEditItem(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/..." /></div>
              <div><Label>Duração (horas)</Label><Input type="number" step="0.5" value={editItem.duration_hours ?? ""} onChange={e => setEditItem(p => ({ ...p, duration_hours: e.target.value ? parseFloat(e.target.value) : null }))} /></div>
            </div>
            <div><Label>Nível de Dificuldade</Label>
              <Select value={editItem.difficulty_level || "beginner"} onValueChange={v => setEditItem(p => ({ ...p, difficulty_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Imagem de Capa</Label>
              {editItem.cover_image_url && <img src={editItem.cover_image_url} alt="cover" className="h-24 object-cover rounded-md mb-2" />}
              <Input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
            </div>
            <div><Label>Arquivo PDF</Label>
              {editItem.pdf_url && <a href={editItem.pdf_url} target="_blank" rel="noopener" className="text-sm text-primary underline block mb-1">PDF atual ↗</a>}
              <Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
            </div>
            <div><Label>Status</Label>
              <Select value={editItem.status || "draft"} onValueChange={v => setEditItem(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending || uploading}>
              {(saveMutation.isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treinamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTreinamentos;
