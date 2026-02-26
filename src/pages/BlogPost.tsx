import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabaseWiki
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link to="/blog">
            <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Blog</Button>
          </Link>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : !post ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-foreground mb-2">Post não encontrado</h2>
              <p className="text-muted-foreground">O artigo que você procura não existe ou não está publicado.</p>
            </div>
          ) : (
            <article>
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.title} className="w-full h-64 md:h-96 object-cover rounded-xl mb-8" />
              )}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {post.category && <Badge>{post.category}</Badge>}
                {(post.tags || []).map((tag: string) => <Badge key={tag} variant="outline">{tag}</Badge>)}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                {post.author && <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(post.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <div
                className="prose prose-lg dark:prose-invert max-w-none text-foreground [&>p]:mb-4 [&>p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content.includes('<p>') ? post.content : post.content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('') }}
              />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
