import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ArrowLeft, Database, AlertCircle, Phone, Mail, MapPin, Users, Building2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
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
  const [isSearching, setIsSearching] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

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
      toast.error("Configure sua API Key nas Configurações primeiro");
      return;
    }

    setIsSearching(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke("dados4u-consultar", {
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

  const renderPhones = (label: string, phones: any[], icon: React.ReactNode) => {
    if (!phones || phones.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          {icon} {label}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {phones.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">{p.numero || p.telefone || JSON.stringify(p)}</p>
              {p.situacao && <p className="text-xs text-muted-foreground mt-1">{p.situacao}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmails = (emails: any[]) => {
    if (!emails || emails.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Mail className="w-4 h-4" /> E-mails
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {emails.map((e: any, i: number) => (
            <div key={i} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">{e.email || JSON.stringify(e)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnderecos = (enderecos: any[]) => {
    if (!enderecos || enderecos.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Endereços
        </h4>
        {enderecos.map((e: any, i: number) => (
          <div key={i} className="p-3 bg-muted rounded-lg">
            {typeof e === "object" ? (
              <p className="text-foreground">
                {[e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.estado, e.cep].filter(Boolean).join(", ")}
              </p>
            ) : (
              <p className="text-foreground">{String(e)}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSociedade = (sociedade: any[]) => {
    if (!sociedade || sociedade.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Sociedade
        </h4>
        {sociedade.map((s: any, i: number) => (
          <div key={i} className="p-3 bg-muted rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
            {s.razao_social && (
              <div><span className="text-xs text-muted-foreground">Razão Social</span><p className="font-medium text-foreground">{s.razao_social}</p></div>
            )}
            {s.cnpj && (
              <div><span className="text-xs text-muted-foreground">CNPJ</span><p className="font-medium text-foreground">{s.cnpj}</p></div>
            )}
            {s.participacao && (
              <div><span className="text-xs text-muted-foreground">Participação</span><p className="font-medium text-foreground">{s.participacao}</p></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderParentes = (parentes: any[]) => {
    if (!parentes || parentes.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4" /> Parentes
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {parentes.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">{p.nome || JSON.stringify(p)}</p>
              {p.parentesco && <p className="text-xs text-muted-foreground">{p.parentesco}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Separate known array/object fields from scalar fields
  const arrayFields = ["telefones_celulares", "telefones_fixos", "emails", "enderecos", "parentes", "sociedade"];

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
        {items.map((item: any, index: number) => {
          const scalarEntries = Object.entries(item).filter(
            ([key, value]) => !arrayFields.includes(key) && typeof value !== "object"
          );

          return (
            <Card key={index} className="border-primary/20">
              <CardContent className="pt-6 space-y-6">
                {/* Scalar fields in a grid */}
                {scalarEntries.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {scalarEntries.map(([key, value]) => {
                      if (value === null || value === undefined || value === "") return null;
                      return (
                        <div key={key}>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {key.replace(/_/g, " ")}
                          </span>
                          <p className="mt-0.5 text-foreground font-medium text-sm">{String(value)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Structured fields */}
                {renderPhones("Telefones Celulares", item.telefones_celulares, <Phone className="w-4 h-4" />)}
                {renderPhones("Telefones Fixos", item.telefones_fixos, <Phone className="w-4 h-4" />)}
                {renderEmails(item.emails)}
                {renderEnderecos(item.enderecos)}
                {renderParentes(item.parentes)}
                {renderSociedade(item.sociedade)}
              </CardContent>
            </Card>
          );
        })}
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

          {/* No API Key Warning */}
          {!apiKey && (
            <Card className="mt-8 border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">API Key não configurada</p>
                    <p className="text-sm text-muted-foreground">
                      Configure sua API Key em{" "}
                      <Link to="/settings" className="text-primary underline font-medium">
                        Configurações &gt; Dados4U
                      </Link>{" "}
                      para realizar consultas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
