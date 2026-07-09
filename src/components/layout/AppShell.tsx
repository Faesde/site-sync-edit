import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Bot,
  HelpCircle,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

type AppShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: "standard" | "wide";
};

const primaryNav = [
  { label: "Campanhas", href: "/contacts", icon: MessageSquare },
  { label: "Contatos", href: "/contacts", icon: Users },
  { label: "Automações", href: "/features/automation", icon: Zap },
  { label: "Resultados", href: "/results", icon: BarChart3 },
  { label: "Configurações", href: "/settings", icon: Settings },
];

const secondaryNav = [
  { label: "Treinamentos", href: "/treinamentos", icon: BookOpen },
  { label: "Ajuda", href: "/help", icon: HelpCircle },
];

export function AppShell({
  title,
  description,
  eyebrow = "Workspace",
  children,
  actions,
  maxWidth = "wide",
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const isAdmin = role === "admin";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const renderNavItem = (item: (typeof primaryNav)[number]) => {
    const isActive =
      location.pathname === item.href &&
      (location.pathname !== "/contacts" || item.label === "Campanhas");
    const Icon = item.icon;

    return (
      <Link
        key={`${item.label}-${item.href}`}
        to={item.href}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-950">
        <Link to="/contacts" className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0047ff] text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0047ff]">Wiki</p>
            <p className="text-lg font-bold leading-none">Marketing</p>
          </div>
        </Link>

        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bot className="h-4 w-4 text-[#0047ff]" />
            Active Intelligence
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Próximas ações, segmentos e campanhas ficam concentrados aqui.
          </p>
        </div>

        <nav className="space-y-1">{primaryNav.map(renderNavItem)}</nav>

        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Aprendizado
          </p>
          <nav className="space-y-1">{secondaryNav.map(renderNavItem)}</nav>
        </div>

        {isAdmin && (
          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <Link
              to="/admin"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname.startsWith("/admin")
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              }`}
            >
              <Shield className="h-4 w-4" />
              Administração
            </Link>
          </div>
        )}

        <div className="mt-auto rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <p className="truncate text-sm font-semibold">{profile?.full_name || user?.email}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Badge variant="secondary" className="rounded-md">
              {isAdmin ? "Admin" : "Usuário"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0047ff]">
                <span>{eyebrow}</span>
                <span className="hidden rounded-full bg-[#e8efff] px-2 py-0.5 text-[10px] text-[#0047ff] sm:inline dark:bg-[#08245f]">
                  Marketing OS
                </span>
              </div>
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {title}
              </h1>
            </div>

            <div className="hidden min-w-0 flex-1 justify-center xl:flex">
              <div className="flex w-full max-w-md items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <Search className="h-4 w-4" />
                <span>Buscar contatos, campanhas ou automações</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
          {description && (
            <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-6 lg:px-8 dark:border-slate-900 dark:text-slate-400">
              {description}
            </div>
          )}
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden dark:border-slate-900">
            {primaryNav.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href &&
                (location.pathname !== "/contacts" || item.label === "Campanhas");

              return (
                <Link
                  key={`mobile-${item.label}`}
                  to={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className={`mx-auto px-4 py-6 sm:px-6 lg:px-8 ${maxWidth === "wide" ? "max-w-[1500px]" : "max-w-6xl"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
