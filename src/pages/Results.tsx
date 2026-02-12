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
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedChannel, setSelectedChannel] = useState<ChannelFilter>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // Toggle campaign selection
  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const selectAllCampaigns = () => {
    setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
  };

  const clearCampaignSelection = () => {
    setSelectedCampaigns(new Set());
  };

  // Filter results
  const filteredResults = campaignResults.filter(r => {
    const channelMatch = selectedChannel === 'all' || r.channel_type === selectedChannel;
    const campaignMatch = selectedCampaigns.size === 0 || (r.campaign_id && selectedCampaigns.has(r.campaign_id));
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

      // Update local state
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      setCampaignResults((prev) => prev.filter((r) => r.campaign_id !== campaignToDelete.id));

      if (selectedCampaigns.has(campaignToDelete.id)) {
        setSelectedCampaigns(prev => {
          const newSet = new Set(prev);
          newSet.delete(campaignToDelete.id);
          return newSet;
        });
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
                  {selectedCampaigns.size > 0 && ` • ${selectedCampaigns.size} campanha${selectedCampaigns.size !== 1 ? 's' : ''} selecionada${selectedCampaigns.size !== 1 ? 's' : ''}`}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[220px] justify-between">
                      <span className="truncate">
                        {selectedCampaigns.size === 0 
                          ? "Todas as campanhas" 
                          : selectedCampaigns.size === 1
                            ? campaigns.find(c => c.id === Array.from(selectedCampaigns)[0])?.name || "1 campanha"
                            : `${selectedCampaigns.size} campanhas`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <div className="p-2 border-b flex items-center justify-between gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={selectAllCampaigns}
                        className="text-xs h-7"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Selecionar tudo
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearCampaignSelection}
                        className="text-xs h-7"
                      >
                        Limpar
                      </Button>
                    </div>
                    <ScrollArea className="h-[280px]">
                      <div className="p-2 space-y-1">
                        {campaigns.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma campanha encontrada
                          </p>
                        ) : (
                          campaigns.map((campaign) => (
                            <div 
                              key={campaign.id}
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                              onClick={() => toggleCampaignSelection(campaign.id)}
                            >
                              <Checkbox 
                                checked={selectedCampaigns.has(campaign.id)}
                                onCheckedChange={() => toggleCampaignSelection(campaign.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{campaign.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(campaign.created_at), "dd/MM/yy", { locale: ptBR })} • {campaign.contacts_count} contatos
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => openDeleteDialog(campaign, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
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
                    {(() => {
                      // Normalize Brazilian phone: strip non-digits, ensure 55+DDD+9+8digits
                      const normalizePhone = (phone: string): string => {
                        let d = phone.replace(/\D/g, '');
                        if (!d.startsWith('55')) d = '55' + d;
                        // If 12 digits (missing 9th digit), add it: 55 + DD + 9 + 8digits
                        if (d.length === 12) {
                          d = d.slice(0, 4) + '9' + d.slice(4);
                        }
                        return d;
                      };

                      // Group results by normalized phone + campaign_id
                      const grouped = new Map<string, CampaignResult[]>();
                      filteredResults.forEach((result) => {
                        const key = `${normalizePhone(result.contact_phone)}::${result.campaign_id || 'none'}`;
                        if (!grouped.has(key)) grouped.set(key, []);
                        grouped.get(key)!.push(result);
                      });

                      return Array.from(grouped.entries()).map(([groupKey, results]) => {
                        // Sort: newest first
                        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                        const latest = results[0];
                        const channel = channelConfig[latest.channel_type];
                        const ChannelIcon = channel?.icon || MessageSquare;
                        // Best status: received > read > delivered > sent > others
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
                                <span className="text-sm text-muted-foreground">
                                  {latest.campaign_name || '-'}
                                </span>
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
                                <TableCell colSpan={6} className="p-4">
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

        {/* Campaigns Summary */}
        {campaigns.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumo das Campanhas ({campaigns.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-center">Contatos</TableHead>
                      <TableHead className="text-center">Enviados</TableHead>
                      <TableHead className="text-center">Falhas</TableHead>
                      <TableHead className="text-right">Data</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow 
                        key={campaign.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedCampaigns(new Set([campaign.id]));
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => openDeleteDialog(campaign, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
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

export default Results;
