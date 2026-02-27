import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ArrowLeft, Database, Key, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ConsultaTipo = "cpf_cnpj" | "nome_completo" | "numero_telefone" | "email";

const tipoPlaceholders: Record<ConsultaTipo, string> = {
  cpf_cnpj: "000.000.000-00 ou 00.000.000/0001-00",
  nome_completo: "Digite o nome completo",
  numero_telefone: "(00) 00000-0000",
  email: "email@exemplo.com",
};

const STORAGE_KEY = "dados4u_api_key";

const Dados4UConsulta = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tipo, setTipo] = useState<ConsultaTipo>("cpf_cnpj");
  const [valor, setValor] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

  const handleSaveApiKey = (value: string) => {
    setApiKey(value);
    if (value.trim()) {
      localStorage.setItem(STORAGE_KEY, value.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  const handleConsulta = async () => {
    if (!valor.trim()) {
      toast.error("Preencha o campo de busca");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Configure sua API Key do Dados4U primeiro");
      return;
    }

    setIsSearching(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke("dados4u-consultar-index-ts", {
        body: { tipo, valor: valor.trim(), api_key: apiKey.trim() },
      });

      if (error) throw error;

      if (data?.success) {
        setResultado(data.data);
        toast.success("Consulta realizada com sucesso!");
      } else {
        toast.error(data?.error || "Erro na consulta");
      }
    } catch (error: any) {
      console.error("Erro na consulta:", error);
      toast.error(error.message || "Erro ao realizar consulta");
    } finally {
      setIsSearching(false);
    }
  };

  const renderResultado = () => {
    if (!resultado) return null;
    const items = Array.isArray(resultado) ? resultado : [resultado];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 mt-8"
      >
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Resultados ({items.length})
        </h3>
        {items.map((item: any, index: number) => (
          <Card key={index} className="border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(item).map(([key, value]) => {
                  if (value === null || value === undefined || value === "") return null;
                  if (typeof value === "object") {
                    return (
                      <div key={key} className="col-span-full">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          {key.replace(/_/g, " ")}
                        </span>
                        <pre className="mt-1 text-sm text-foreground bg-muted p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      </div>
                    );
                  }
                  return (
                    <div key={key}>
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {key.replace(/_/g, " ")}
                      </span>
                      <p className="mt-1 text-foreground font-medium">{String(value)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Consulta Dados4U</h1>
                <p className="text-muted-foreground">Consulte dados por CPF, CNPJ, nome, telefone ou e-mail</p>
              </div>
            </div>
          </motion.div>

          {/* API Key Config */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="w-5 h-5" />
                API Key do Dados4U
              </CardTitle>
              <CardDescription>
                Gere sua chave em{" "}
                <a href="https://dados4u.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  dados4u.com.br
                </a>{" "}
                e cole abaixo. A chave fica salva apenas no seu navegador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="Cole sua API Key aqui"
                    value={apiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Nova Consulta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as ConsultaTipo)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf_cnpj">CPF / CNPJ</SelectItem>
                      <SelectItem value="nome_completo">Nome Completo</SelectItem>
                      <SelectItem value="numero_telefone">Telefone</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Valor</Label>
                  <Input
                    placeholder={tipoPlaceholders[tipo]}
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConsulta()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleConsulta} disabled={isSearching || !apiKey.trim()} className="w-full md:w-auto">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Consultar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {renderResultado()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dados4UConsulta;
