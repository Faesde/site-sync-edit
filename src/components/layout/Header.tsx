import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Settings, LayoutDashboard, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const funcionalidadesLinks = [
  { label: "Para E-commerce", href: "/industries/ecommerce" },
  { label: "Para Infoprodutos", href: "/industries/affiliates" },
  { label: "Para Negócios Locais", href: "/industries/local-business" },
  { label: "Automação, Campanha e Listas", href: "/features/automation" },
  { label: "WhatsApp Marketing", href: "/features/whatsapp-marketing" },
  { label: "E-mail Marketing", href: "/features/email-marketing" },
  { label: "SMS Marketing", href: "/features/sms-marketing" },
  { label: "Voz/Ligação Marketing", href: "/features/voice-marketing" },
  { label: "Todas", href: "/#ferramentas" },
];

const integracoesLinks = [
  { label: "Shopify", href: "/integrations/shopify" },
  { label: "WooCommerce", href: "/integrations/woocommerce" },
  { label: "Yampi", href: "/integrations/yampi" },
  { label: "Kiwify", href: "/integrations/kiwify" },
  { label: "Cartpanda", href: "/integrations/cartpanda" },
  { label: "Todas", href: "/integrations" },
];

const ajudaLinks = [
  { label: "Central de Ajuda", href: "/help" },
  { label: "Fale Conosco", href: "/contact" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-secondary text-white">
      {/* Top Banner */}
      <div className="bg-primary text-center py-2 px-4">
        <p className="text-sm">
          Revolucione a forma de se comunicar com o seu cliente.{" "}
          <Link to="/register" className="font-semibold underline hover:no-underline">
            Comece agora mesmo!
          </Link>
        </p>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display font-bold text-2xl text-white">
              Wiki<span className="text-accent">Marketing</span>
            </span>
          </Link>

          {/* Desktop Navigation - Each dropdown has its own NavigationMenu */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/" className="text-white/80 hover:text-white transition-colors font-medium px-3 py-2">
              Início
            </Link>

            {/* Funcionalidades Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10">
                    Funcionalidades
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[280px] gap-1 p-2 bg-secondary border border-white/10">
                      {funcionalidadesLinks.map((link) => (
                        <li key={link.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={link.href}
                              className={cn(
                                "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors",
                                "text-white/80 hover:bg-white/10 hover:text-accent focus:bg-white/10"
                              )}
                            >
                              {link.label}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link to="/#planos" className="text-white/80 hover:text-white transition-colors font-medium px-3 py-2">
              Planos
            </Link>

            {/* Integrações Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10">
                    Integrações
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-1 p-2 bg-secondary border border-white/10">
                      {integracoesLinks.map((link) => (
                        <li key={link.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={link.href}
                              className={cn(
                                "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors",
                                "text-white/80 hover:bg-white/10 hover:text-accent focus:bg-white/10"
                              )}
                            >
                              {link.label}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Ajuda Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white/80 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10">
                    Ajuda
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-1 p-2 bg-secondary border border-white/10">
                      {ajudaLinks.map((link) => (
                        <li key={link.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={link.href}
                              className={cn(
                                "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors",
                                "text-white/80 hover:bg-white/10 hover:text-accent focus:bg-white/10"
                              )}
                            >
                              {link.label}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 text-white hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-white text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/contacts" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/results" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      Resultados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="hero" size="default">
                    Começar agora
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outlineLight" size="default">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-secondary border-t border-white/10 max-h-[80vh] overflow-y-auto"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-2">
              <Link
                to="/"
                className="text-white hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              
              {/* Mobile Funcionalidades */}
              <div className="border-t border-white/10 pt-2">
                <span className="text-accent font-semibold text-sm uppercase tracking-wide">Funcionalidades</span>
                {funcionalidadesLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block text-white/80 hover:text-white transition-colors py-2 pl-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <Link
                to="/#planos"
                className="text-white hover:text-accent transition-colors font-medium py-2 border-t border-white/10 pt-4"
                onClick={() => setIsMenuOpen(false)}
              >
                Planos
              </Link>

              {/* Mobile Integrações */}
              <div className="border-t border-white/10 pt-2">
                <span className="text-accent font-semibold text-sm uppercase tracking-wide">Integrações</span>
                {integracoesLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block text-white/80 hover:text-white transition-colors py-2 pl-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Mobile Ajuda */}
              <div className="border-t border-white/10 pt-2">
                <span className="text-accent font-semibold text-sm uppercase tracking-wide">Ajuda</span>
                {ajudaLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block text-white/80 hover:text-white transition-colors py-2 pl-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/10 pt-4">
                <span className="text-white/80 font-medium">Tema</span>
                <ThemeToggle />
              </div>
              
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-accent text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{displayName}</p>
                        <p className="text-xs text-white/60 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/contacts" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outlineLight" className="w-full justify-start gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/results" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outlineLight" className="w-full justify-start gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Resultados
                      </Button>
                    </Link>
                    <Link to="/settings" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outlineLight" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Configurações
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="hero" className="w-full">
                        Começar agora
                      </Button>
                    </Link>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outlineLight" className="w-full">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
