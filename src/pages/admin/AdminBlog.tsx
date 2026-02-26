import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Search, Edit, Trash2, Loader2, FileText, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  author: string | null;
  cover_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const emptyPost: Partial<BlogPost> = {
  title: "", slug: "", content: "", summary: "", category: "", tags: [], author: "", cover_image_url: "", status: "draft",
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const AdminBlog = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<Partial<BlogPost>>(emptyPost);
  const [isEditing, setIsEditing] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabaseWiki.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!user && role === "admin",
  });

  const saveMutation = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      setUploading(true);
      let coverUrl = post.cover_image_url || null;

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `covers/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("blog-images").upload(path, coverFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      const payload = {
        title: post.title,
        slug: post.slug || slugify(post.title || ""),
        content: post.content,
        summary: post.summary || null,
        category: post.category || null,
        tags: post.tags || [],
        author: post.author || null,
        cover_image_url: coverUrl,
        status: post.status || "draft",
        user_id: user!.id,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && post.id) {
        const { error } = await supabaseWiki.from("blog_posts").update(payload).eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseWiki.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(isEditing ? "Post atualizado!" : "Post criado!");
      setDialogOpen(false);
      setCoverFile(null);
      setUploading(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar");
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseWiki.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post excluído!");
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir"),
  });

  const openCreate = () => {
    setEditPost({ ...emptyPost });
    setTagsInput("");
    setIsEditing(false);
    setCoverFile(null);
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditPost({ ...post });
    setTagsInput((post.tags || []).join(", "));
    setIsEditing(true);
    setCoverFile(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editPost.title?.trim()) { toast.error("Título é obrigatório"); return; }
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    saveMutation.mutate({ ...editPost, tags });
  };

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.author || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
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
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Blog</h1>
              <p className="text-muted-foreground text-sm">Crie e gerencie posts do blog</p>
            </div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Post</Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por título ou autor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Nenhum post encontrado</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.map(post => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                        <TableCell>{post.category || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={post.status === "published" ? "default" : "secondary"}>
                            {post.status === "published" ? "Publicado" : "Rascunho"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(post.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {post.status === "published" && (
                              <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${post.slug}`, "_blank")}><Eye className="h-4 w-4" /></Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => openEdit(post)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(post.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Post" : "Novo Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={editPost.title || ""} onChange={e => setEditPost(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))} /></div>
            <div><Label>Slug</Label><Input value={editPost.slug || ""} onChange={e => setEditPost(p => ({ ...p, slug: e.target.value }))} className="text-muted-foreground" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoria</Label><Input value={editPost.category || ""} onChange={e => setEditPost(p => ({ ...p, category: e.target.value }))} placeholder="Ex: Marketing" /></div>
              <div><Label>Autor</Label><Input value={editPost.author || ""} onChange={e => setEditPost(p => ({ ...p, author: e.target.value }))} /></div>
            </div>
            <div><Label>Tags (separadas por vírgula)</Label><Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="tag1, tag2, tag3" /></div>
            <div><Label>Resumo</Label><Textarea value={editPost.summary || ""} onChange={e => setEditPost(p => ({ ...p, summary: e.target.value }))} rows={2} /></div>
            <div><Label>Conteúdo (HTML/Markdown)</Label><Textarea value={editPost.content || ""} onChange={e => setEditPost(p => ({ ...p, content: e.target.value }))} rows={10} className="font-mono text-sm" /></div>
            <div><Label>Imagem de Capa</Label>
              {editPost.cover_image_url && <img src={editPost.cover_image_url} alt="cover" className="h-24 object-cover rounded-md mb-2" />}
              <Input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
            </div>
            <div><Label>Status</Label>
              <Select value={editPost.status || "draft"} onValueChange={v => setEditPost(p => ({ ...p, status: v }))}>
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
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

export default AdminBlog;
