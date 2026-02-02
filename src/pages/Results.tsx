import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  MessageSquare, 
  Phone, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Send,
  Mail,
  MessageCircle,
  Eye,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: string;
  name: string;
  template_name: string | null;
  contacts_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface CampaignResult {
  id: string;
  campaign_id: string | null;
  campaign_name: string | null;
  channel_type: 'whatsapp' | 'call' | 'sms' | 'email';
  contact_phone: string;
  contact_name: string | null;
  message_content: string | null;
  dtmf_response: string | null;
  dtmf_path: Array<{ key: string; label: string }> | null;
  call_duration: number | null;
  call_status: string | null;
  status: string;
  created_at: string;
}

type ChannelFilter = 'all' | 'whatsapp' | 'call' | 'sms' | 'email';

const channelConfig = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  call: { label: 'Ligação', icon: Phone, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  email: { label: 'E-mail', icon: Mail, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  sent: { label: 'Enviado', color: 'bg-blue-500/10 text-blue-600', icon: Send },
  delivered: { label: 'Entregue', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  read: { label: 'Lido', color: 'bg-emerald-500/10 text-emerald-600', icon: Eye },
  failed: { label: 'Falhou', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  completed: { label: 'Completado', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
};

const Results = () => {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignResults, setCampaignResults] = useState<CampaignResult[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<ChannelFilter>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtime();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [campaignsResponse, resultsResponse] = await Promise.all([
        supabaseWiki
          .from('whatsapp_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabaseWiki
          .from('campaign_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);
      
      if (campaignsResponse.error) throw campaignsResponse.error;
      setCampaigns(campaignsResponse.data || []);
      
      if (resultsResponse.error) {
        console.error('Error fetching campaign results:', resultsResponse.error);
      } else {
        setCampaignResults(resultsResponse.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabaseWiki
      .channel('results-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'wiki',
          table: 'whatsapp_campaigns',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setCampaigns(prev => [payload.new as Campaign, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'wiki',
          table: 'campaign_results',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const result = payload.new as CampaignResult;
          setCampaignResults(prev => [result, ...prev]);
          toast({
            title: `Nova resposta!`,
            description: `${result.contact_name || result.contact_phone} via ${channelConfig[result.channel_type]?.label}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabaseWiki.removeChannel(channel);
    };
  };

  // Filter results
  const filteredResults = campaignResults.filter(r => {
    const channelMatch = selectedChannel === 'all' || r.channel_type === selectedChannel;
    const campaignMatch = selectedCampaign === 'all' || r.campaign_id === selectedCampaign;
    const searchMatch = !searchTerm || 
      r.contact_phone.includes(searchTerm) ||
      r.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return channelMatch && campaignMatch && searchMatch;
  });

  // Stats
  const stats = {
    total: filteredResults.length,
    delivered: filteredResults.filter(r => r.status === 'delivered' || r.status === 'read').length,
    read: filteredResults.filter(r => r.status === 'read').length,
    failed: filteredResults.filter(r => r.status === 'failed').length,
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Faça login para continuar</h2>
              <p className="text-muted-foreground mb-4">
                Você precisa estar logado para ver os resultados das campanhas.
              </p>
              <Button onClick={() => window.location.href = '/login'}>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Resultados</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho das suas campanhas</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lidos</p>
                  <p className="text-2xl font-bold">{stats.read}</p>
                </div>
                <Eye className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Results Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Respostas das Campanhas</CardTitle>
                <CardDescription>
                  {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''}
                  {selectedCampaign !== 'all' && ` • ${campaigns.find(c => c.id === selectedCampaign)?.name}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Campanha" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Todas as campanhas</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as ChannelFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Todos os canais</SelectItem>
                    {Object.entries(channelConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm text-muted-foreground">
                  {campaigns.length === 0 
                    ? "Envie sua primeira campanha para ver os resultados" 
                    : "Tente ajustar os filtros de busca"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => {
                      const channel = channelConfig[result.channel_type];
                      const ChannelIcon = channel?.icon || MessageSquare;
                      const status = statusConfig[result.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      const isExpanded = expandedRows.has(result.id);
                      const hasDetails = result.message_content || result.dtmf_response || result.dtmf_path;
                      
                      return (
                        <>
                          <TableRow 
                            key={result.id}
                            className={`cursor-pointer hover:bg-muted/50 ${isExpanded ? 'bg-muted/30' : ''}`}
                            onClick={() => hasDetails && toggleRowExpand(result.id)}
                          >
                            <TableCell className="text-center">
                              {hasDetails && (
                                isExpanded 
                                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{result.contact_name || result.contact_phone}</p>
                                {result.contact_name && (
                                  <p className="text-xs text-muted-foreground">{result.contact_phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`gap-1 ${channel?.color}`}>
                                <ChannelIcon className="h-3 w-3" />
                                {channel?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {result.campaign_name || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`gap-1 ${status.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {format(new Date(result.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                          {isExpanded && hasDetails && (
                            <TableRow key={`${result.id}-details`} className="bg-muted/20">
                              <TableCell colSpan={6} className="p-4">
                                <div className="space-y-2">
                                  {result.channel_type === 'call' ? (
                                    <>
                                      {result.dtmf_response && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">Resposta DTMF:</span>
                                          <Badge variant="outline" className="font-mono">
                                            {result.dtmf_response}
                                          </Badge>
                                          {result.call_duration && (
                                            <span className="text-sm text-muted-foreground ml-4">
                                              Duração: {Math.floor(result.call_duration / 60)}:{(result.call_duration % 60).toString().padStart(2, '0')}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {result.dtmf_path && result.dtmf_path.length > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm text-muted-foreground">Caminho:</span>
                                          {result.dtmf_path.map((step, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {step.key}: {step.label}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    result.message_content && (
                                      <div>
                                        <span className="text-sm text-muted-foreground">Mensagem:</span>
                                        <p className="mt-1 text-sm p-3 bg-background rounded-lg border">
                                          {result.message_content}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Campaigns Summary */}
        {campaigns.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumo das Campanhas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Contatos</TableHead>
                    <TableHead className="text-center">Enviados</TableHead>
                    <TableHead className="text-center">Falhas</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.slice(0, 5).map((campaign) => (
                    <TableRow 
                      key={campaign.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedCampaign(campaign.id);
                        setShowFilters(true);
                      }}
                    >
                      <TableCell>
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.template_name && (
                          <p className="text-xs text-muted-foreground">{campaign.template_name}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.contacts_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {campaign.sent_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.failed_count > 0 ? (
                          <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-600">
                            <XCircle className="h-3 w-3" />
                            {campaign.failed_count}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Results;
