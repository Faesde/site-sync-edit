import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  ChevronDown,
  ChevronUp,
  Trash2,
  BarChart3
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
  poll_options: string[] | null;
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
  raw_payload: { provider?: string; instance?: string; message_id?: string } | null;
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
  confirmed: { label: 'Confirmado', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  answered: { label: 'Atendido', color: 'bg-green-500/10 text-green-600', icon: Phone },
  'in-progress': { label: 'Em andamento', color: 'bg-blue-500/10 text-blue-600', icon: Clock },
  ringing: { label: 'Chamando', color: 'bg-yellow-500/10 text-yellow-600', icon: Phone },
  busy: { label: 'Ocupado', color: 'bg-orange-500/10 text-orange-600', icon: Phone },
  'no-answer': { label: 'Sem resposta', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  received: { label: 'Respondido', color: 'bg-teal-500/10 text-teal-600', icon: MessageCircle },
};

const Results = () => {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignResults, setCampaignResults] = useState<CampaignResult[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelFilter>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPollChart, setShowPollChart] = useState(false);

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

  // Active campaign object
  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || null;

  // Filter results for active campaign
  const filteredResults = campaignResults.filter(r => {
    if (!activeCampaignId) return false;
    const campaignMatch = r.campaign_id === activeCampaignId;
    const channelMatch = selectedChannel === 'all' || r.channel_type === selectedChannel;
    const searchMatch = !searchTerm || 
      r.contact_phone.includes(searchTerm) ||
      r.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return campaignMatch && channelMatch && searchMatch;
  });

  // Stats for active campaign
  const stats = {
    total: filteredResults.length,
    delivered: filteredResults.filter(r => r.status === 'delivered' || r.status === 'read').length,
    read: filteredResults.filter(r => r.status === 'read').length,
    failed: filteredResults.filter(r => r.status === 'failed').length,
    received: filteredResults.filter(r => r.status === 'received').length,
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

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete || !user) return;

    setDeleting(true);
    try {
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const session = sessionRes.session;
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const { data, error } = await supabase.functions.invoke("delete-campaign", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          campaign_id: campaignToDelete.id,
        },
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error || "Não foi possível excluir a campanha");
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      setCampaignResults((prev) => prev.filter((r) => r.campaign_id !== campaignToDelete.id));

      if (activeCampaignId === campaignToDelete.id) {
        setActiveCampaignId(null);
      }

      toast({
        title: "Campanha excluída",
        description: `A campanha "${campaignToDelete.name}" foi excluída com sucesso.`,
      });
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const openDeleteDialog = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Resultados</h1>
            <p className="text-muted-foreground">Acompanhe o desempenho das suas campanhas</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !activeCampaignId ? (
          /* ========== CAMPAIGN LIST (no campaign selected) ========== */
          <>
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground font-medium">Nenhuma campanha encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Envie sua primeira campanha para ver os resultados aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Selecione uma campanha para ver os resultados ({campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''})
                </p>
                {campaigns.map((campaign) => {
                  const campaignResultsCount = campaignResults.filter(r => r.campaign_id === campaign.id).length;
                  const receivedCount = campaignResults.filter(r => r.campaign_id === campaign.id && r.status === 'received').length;
                  return (
                    <Card 
                      key={campaign.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setActiveCampaignId(campaign.id);
                        setExpandedRows(new Set());
                        setSearchTerm('');
                        setSelectedChannel('all');
                        setShowPollChart(false);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{campaign.name}</p>
                              {campaign.poll_options && campaign.poll_options.length > 0 && (
                                <Badge variant="secondary" className="gap-1 shrink-0">
                                  <BarChart3 className="h-3 w-3" />
                                  Enquete
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(campaign.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </span>
                              {campaign.template_name && (
                                <span className="text-xs text-muted-foreground">• {campaign.template_name}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                {campaign.contacts_count}
                              </Badge>
                              <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                {campaign.sent_count}
                              </Badge>
                              {receivedCount > 0 && (
                                <Badge variant="secondary" className="gap-1 bg-teal-500/10 text-teal-600">
                                  <MessageCircle className="h-3 w-3" />
                                  {receivedCount}
                                </Badge>
                              )}
                              {campaign.failed_count > 0 && (
                                <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-600">
                                  <XCircle className="h-3 w-3" />
                                  {campaign.failed_count}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => openDeleteDialog(campaign, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ========== CAMPAIGN DETAIL VIEW (campaign selected) ========== */
          <>
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 gap-2"
              onClick={() => {
                setActiveCampaignId(null);
                setShowPollChart(false);
              }}
            >
              <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
              Voltar às campanhas
            </Button>

            {/* Campaign header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold">{activeCampaign?.name}</h2>
              {activeCampaign?.template_name && (
                <p className="text-sm text-muted-foreground">Template: {activeCampaign.template_name}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {activeCampaign && format(new Date(activeCampaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {/* Stats for this campaign */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Lidos</p>
                  <p className="text-2xl font-bold">{stats.read}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-teal-500">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Respondidos</p>
                  <p className="text-2xl font-bold">{stats.received}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </CardContent>
              </Card>
            </div>

            {/* Poll chart section */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Gráfico de Respostas da Enquete
                  </CardTitle>
                  {activeCampaign?.poll_options && activeCampaign.poll_options.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPollChart(!showPollChart)}
                    >
                      {showPollChart ? 'Ocultar' : 'Ver Gráfico'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              {activeCampaign?.poll_options && activeCampaign.poll_options.length > 0 ? (
                showPollChart && (
                  <CardContent>
                    <InlinePollChart
                      pollOptions={activeCampaign.poll_options}
                      responses={campaignResults
                        .filter(r => r.campaign_id === activeCampaignId)
                        .map(r => ({ message_content: r.message_content, status: r.status, contact_phone: r.contact_phone, created_at: r.created_at }))}
                    />
                  </CardContent>
                )
              ) : (
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">Enquete não configurada</p>
                    <p className="text-xs mt-1">
                      Para visualizar gráficos, configure as opções de enquete no template antes de enviar a campanha.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Respostas</CardTitle>
                    <CardDescription>
                      {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        className="pl-9 w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as ChannelFilter)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Canal" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">Todos</SelectItem>
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
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-sm">Nenhum resultado encontrado</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Canal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const normalizePhone = (phone: string): string => {
                            let d = phone.replace(/\D/g, '');
                            if (!d.startsWith('55')) d = '55' + d;
                            if (d.length === 12) {
                              d = d.slice(0, 4) + '9' + d.slice(4);
                            }
                            return d;
                          };

                          const grouped = new Map<string, CampaignResult[]>();
                          filteredResults.forEach((result) => {
                            const key = normalizePhone(result.contact_phone);
                            if (!grouped.has(key)) grouped.set(key, []);
                            grouped.get(key)!.push(result);
                          });

                          return Array.from(grouped.entries()).map(([groupKey, results]) => {
                            results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                            const latest = results[0];
                            const channel = channelConfig[latest.channel_type];
                            const ChannelIcon = channel?.icon || MessageSquare;
                            const statusPriority: Record<string, number> = { received: 5, read: 4, delivered: 3, sent: 2 };
                            const bestStatus = results.reduce((best, r) => 
                              (statusPriority[r.status] || 0) > (statusPriority[best] || 0) ? r.status : best
                            , results[0].status);
                            const status = statusConfig[bestStatus] || statusConfig.pending;
                            const StatusIcon = status.icon;
                            const isExpanded = expandedRows.has(groupKey);
                            const hasMultiple = results.length > 1;
                            const hasDetails = results.some(r => r.message_content || r.dtmf_response || r.dtmf_path);

                            return (
                              <React.Fragment key={groupKey}>
                                <TableRow
                                  className={`cursor-pointer hover:bg-muted/50 ${isExpanded ? 'bg-muted/30' : ''}`}
                                  onClick={() => (hasDetails || hasMultiple) && toggleRowExpand(groupKey)}
                                >
                                  <TableCell className="text-center">
                                    {(hasDetails || hasMultiple) && (
                                      isExpanded
                                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{latest.contact_name || latest.contact_phone}</p>
                                      {latest.contact_name && (
                                        <p className="text-xs text-muted-foreground">{latest.contact_phone}</p>
                                      )}
                                      {hasMultiple && (
                                        <p className="text-xs text-muted-foreground">{results.length} mensagens</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {latest.channel_type === 'whatsapp' ? (
                                      <div className="space-y-0.5">
                                        <Badge variant="secondary" className={`gap-1 ${channel?.color}`}>
                                          <ChannelIcon className="h-3 w-3" />
                                          {latest.raw_payload?.provider === 'evolution' ? 'Evolution' : 'Meta API'}
                                        </Badge>
                                        {latest.raw_payload?.provider === 'evolution' && latest.raw_payload?.instance && (
                                          <p className="text-xs text-muted-foreground">{latest.raw_payload.instance}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <Badge variant="secondary" className={`gap-1 ${channel?.color}`}>
                                        <ChannelIcon className="h-3 w-3" />
                                        {channel?.label}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className={`gap-1 ${status.color}`}>
                                      <StatusIcon className="h-3 w-3" />
                                      {status.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-muted-foreground">
                                    {format(new Date(latest.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <TableRow key={`${groupKey}-details`} className="bg-muted/20">
                                    <TableCell colSpan={5} className="p-4">
                                      <div className="space-y-3">
                                        {results.map((r) => {
                                          const rStatus = statusConfig[r.status] || statusConfig.pending;
                                          const RStatusIcon = rStatus.icon;
                                          return (
                                            <div key={r.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                                              <div className="flex-1 min-w-0">
                                                {r.channel_type === 'call' ? (
                                                  <>
                                                    {r.dtmf_response && (
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">DTMF:</span>
                                                        <Badge variant="outline" className="font-mono">{r.dtmf_response}</Badge>
                                                        {r.call_duration && (
                                                          <span className="text-sm text-muted-foreground ml-2">
                                                            {Math.floor(r.call_duration / 60)}:{(r.call_duration % 60).toString().padStart(2, '0')}
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                    {r.dtmf_path && r.dtmf_path.length > 0 && (
                                                      <div className="flex items-center gap-2 flex-wrap mt-1">
                                                        <span className="text-sm text-muted-foreground">Caminho:</span>
                                                        {r.dtmf_path.map((step, idx) => (
                                                          <Badge key={idx} variant="outline" className="text-xs">
                                                            {step.key}: {step.label}
                                                          </Badge>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </>
                                                ) : (
                                                  r.message_content && (
                                                    <p className="text-sm">{r.message_content}</p>
                                                  )
                                                )}
                                                {!r.message_content && r.channel_type !== 'call' && (
                                                  <p className="text-sm text-muted-foreground italic">Sem conteúdo</p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="secondary" className={`gap-1 text-xs ${rStatus.color}`}>
                                                  <RStatusIcon className="h-3 w-3" />
                                                  {rStatus.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                  {format(new Date(r.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir campanha</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a campanha "{campaignToDelete?.name}"?
                <br />
                <span className="text-destructive font-medium">
                  Todos os resultados associados também serão excluídos.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteCampaign}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  );
};

/* Inline poll chart component */
const InlinePollChart: React.FC<{
  pollOptions: string[];
  responses: Array<{ message_content: string | null; status: string; contact_phone: string; created_at: string }>;
}> = ({ pollOptions, responses }) => {
  const receivedResponses = responses.filter(r => r.status === "received" && r.message_content);
  
  // Group by contact, then pick the first message that matches a valid option
  const validOptions = new Set(pollOptions.map((_, i) => String(i + 1)));
  
  const contactGroups = new Map<string, typeof receivedResponses>();
  receivedResponses.forEach(r => {
    const phone = r.contact_phone.replace(/\D/g, '');
    if (!contactGroups.has(phone)) contactGroups.set(phone, []);
    contactGroups.get(phone)!.push(r);
  });

  const counts: Record<string, number> = {};
  pollOptions.forEach((_, i) => { counts[String(i + 1)] = 0; });
  let otherCount = 0;
  let votedContacts = 0;

  contactGroups.forEach((messages) => {
    // Sort by date ascending (oldest first) to find the first valid answer
    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const validMsg = messages.find(m => validOptions.has(m.message_content?.trim() || ""));
    if (validMsg) {
      counts[validMsg.message_content!.trim()]++;
      votedContacts++;
    } else {
      // None of the messages matched a valid option
      otherCount++;
    }
  });

  const data = pollOptions.map((label, i) => ({
    option: `${i + 1}. ${label}`,
    count: counts[String(i + 1)],
  }));
  if (otherCount > 0) {
    data.push({ option: "Outras", count: otherCount });
  }

  const totalResponses = contactGroups.size;

  if (totalResponses === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="font-medium">Nenhuma resposta recebida ainda</p>
        <p className="text-sm">As respostas aparecerão aqui conforme os contatos responderem.</p>
      </div>
    );
  }

  const chartConfig = { count: { label: "Respostas", color: "hsl(var(--primary))" } };

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="option" width={140} tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Respostas" />
        </BarChart>
      </ChartContainer>
      <div className="space-y-1.5">
        {data.map((item, i) => {
          const pct = totalResponses > 0 ? Math.round((item.count / totalResponses) * 100) : 0;
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate flex-1">{item.option}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary">{item.count}</Badge>
                <span className="text-muted-foreground w-10 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Results;
