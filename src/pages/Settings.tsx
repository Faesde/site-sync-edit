import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Settings as SettingsIcon,
  MessageCircle,
  Plus,
  LogOut,
  ArrowLeft,
  Smartphone,
  Cloud,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  RefreshCw,
  QrCode,
  Wifi,
  WifiOff,
  Phone,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { toast } from "sonner";
import { SetupGuide } from "@/components/SetupGuide";

type WhatsAppProvider = 'evolution' | 'cloudapi';
type TemplateStatus = 'pending' | 'approved' | 'rejected';
type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
type HeaderType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null;

interface WhatsAppConfig {
  id: string;
  user_id: string;
  provider: string;
  evolution_instance_name: string | null;
  cloudapi_phone_number_id: string | null;
  cloudapi_business_account_id: string | null;
  has_access_token?: boolean;
}

interface WhatsAppTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string;
  language: string;
  header_type: string | null;
  header_content: string | null;
  body_text: string;
  footer_text: string | null;
  buttons: unknown;
  status: string;
  rejection_reason: string | null;
  meta_template_id: string | null;
  created_at: string;
}

interface EvolutionInstance {
  id: string;
  user_id: string;
  instance_name: string;
  display_name: string | null;
  phone_number: string | null;
  status: string;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

interface EvolutionTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  poll_options: string[] | null;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, profile, role, isSubscribed } = useAuth();

  // WhatsApp config state
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [provider, setProvider] = useState<WhatsAppProvider>('evolution');
  const [cloudapiPhoneId, setCloudapiPhoneId] = useState('');
  const [cloudapiBusinessId, setCloudapiBusinessId] = useState('');
  const [cloudapiAccessToken, setCloudapiAccessToken] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [connectedPhoneInfo, setConnectedPhoneInfo] = useState<{ phoneNumber: string; verifiedName?: string } | null>(null);

  // Evolution instances state
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceDisplayName, setNewInstanceDisplayName] = useState('');
  const [isInstanceDialogOpen, setIsInstanceDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<EvolutionInstance | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [deleteInstanceId, setDeleteInstanceId] = useState<string | null>(null);

  // Meta templates state (for Cloud API)
  const [metaTemplates, setMetaTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoadingMetaTemplates, setIsLoadingMetaTemplates] = useState(true);
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);
  const [isMetaTemplateDialogOpen, setIsMetaTemplateDialogOpen] = useState(false);
  const [editingMetaTemplate, setEditingMetaTemplate] = useState<WhatsAppTemplate | null>(null);

  // Evolution templates state (local templates)
  const [evolutionTemplates, setEvolutionTemplates] = useState<EvolutionTemplate[]>([]);
  const [isLoadingEvolutionTemplates, setIsLoadingEvolutionTemplates] = useState(true);
  const [isEvolutionTemplateDialogOpen, setIsEvolutionTemplateDialogOpen] = useState(false);
  const [editingEvolutionTemplate, setEditingEvolutionTemplate] = useState<EvolutionTemplate | null>(null);
  const [evolutionTemplateName, setEvolutionTemplateName] = useState('');
  const [evolutionTemplateContent, setEvolutionTemplateContent] = useState('');
  const [evolutionPollOptions, setEvolutionPollOptions] = useState<string[]>([]);
  const [isSavingEvolutionTemplate, setIsSavingEvolutionTemplate] = useState(false);

  // Meta template form state
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('MARKETING');
  const [templateLanguage, setTemplateLanguage] = useState('pt_BR');
  const [templateHeaderType, setTemplateHeaderType] = useState<HeaderType>(null);
  const [templateHeaderContent, setTemplateHeaderContent] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateFooter, setTemplateFooter] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Access control
  const isLoadingAccess = loading || (user && role === null);
  const isAdmin = role === 'admin';
  const hasAccess = isSubscribed || isAdmin;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (!loading && user && role !== null && !hasAccess) {
      navigate("/plans");
    }
  }, [user, loading, role, hasAccess, navigate]);

  // Validate Cloud API connection
  const validateConnection = async (silent: boolean = true) => {
    setConnectionStatus('loading');
    if (!silent) {
      setIsTestingConnection(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('test-whatsapp-connection');
      
      if (error) {
        const errorMessage = data?.error || error.message || 'Erro ao validar conexão';
        setConnectionStatus('error');
        setConnectionMessage(errorMessage);
        setConnectedPhoneInfo(null);
        if (!silent) toast.error(errorMessage);
        return;
      }

      if (data?.success) {
        setConnectionStatus('success');
        setConnectionMessage(`Conectado! Número: ${data.phoneNumber}${data.verifiedName ? ` (${data.verifiedName})` : ''}`);
        setConnectedPhoneInfo({ phoneNumber: data.phoneNumber, verifiedName: data.verifiedName });
        if (!silent) toast.success('Conexão estabelecida com sucesso!');
      } else {
        setConnectionStatus('error');
        const errorMessage = data?.error || 'Erro desconhecido';
        setConnectionMessage(errorMessage);
        setConnectedPhoneInfo(null);
        if (!silent) toast.error(errorMessage);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('Erro ao validar conexão');
      setConnectedPhoneInfo(null);
      if (!silent) toast.error('Erro ao validar conexão');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Load WhatsApp config
  useEffect(() => {
    const loadConfig = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('get-whatsapp-config');
        
        if (error) throw error;

        if (data?.success && data?.config) {
          const configData = data.config;
          setConfig(configData);
          setProvider(configData.provider as WhatsAppProvider);
          setCloudapiPhoneId(configData.cloudapi_phone_number_id || '');
          setCloudapiBusinessId(configData.cloudapi_business_account_id || '');
          setCloudapiAccessToken('');
          
          if (configData.provider === 'cloudapi' && configData.has_access_token && configData.cloudapi_phone_number_id) {
            validateConnection(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        toast.error('Erro ao carregar configuração');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, [user]);

  // Load Evolution instances
  const loadEvolutionInstances = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingInstances(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-get-instances-index-ts');
      
      if (error) throw error;
      
      if (data?.success) {
        setEvolutionInstances(data.instances || []);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setIsLoadingInstances(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && provider === 'evolution') {
      loadEvolutionInstances();
    }
  }, [user, provider, loadEvolutionInstances]);

  // Load Meta templates
  useEffect(() => {
    const loadMetaTemplates = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabaseWiki
          .from('whatsapp_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMetaTemplates(data || []);
      } catch (error) {
        console.error('Erro ao carregar templates Meta:', error);
      } finally {
        setIsLoadingMetaTemplates(false);
      }
    };

    loadMetaTemplates();
  }, [user]);

  // Load Evolution templates
  useEffect(() => {
    const loadEvolutionTemplates = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabaseWiki
          .from('evolution_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEvolutionTemplates(data || []);
      } catch (error) {
        console.error('Erro ao carregar templates Evolution:', error);
      } finally {
        setIsLoadingEvolutionTemplates(false);
      }
    };

    loadEvolutionTemplates();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSaveConfig = async () => {
    if (!user) return;

    setIsSavingConfig(true);
    try {
      // Preserve existing values for both providers - only update the selected provider's fields
      const configData = {
        provider,
        evolution_instance_name: null, // No longer used, we have multiple instances
        // Always send Cloud API values (preserve existing if not editing)
        cloudapi_phone_number_id: cloudapiPhoneId || config?.cloudapi_phone_number_id || null,
        cloudapi_business_account_id: cloudapiBusinessId || config?.cloudapi_business_account_id || null,
        // Only send access token if user entered a new one (for Cloud API)
        cloudapi_access_token: provider === 'cloudapi' && cloudapiAccessToken ? cloudapiAccessToken : undefined,
      };

      const { data, error } = await supabase.functions.invoke('save-whatsapp-config', {
        body: configData
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao salvar configuração');
      }

      toast.success('Configuração salva com sucesso!');
      
      if (data.config) {
        setConfig(data.config);
        setCloudapiAccessToken('');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) {
      toast.error('Salve a configuração antes de testar a conexão');
      return;
    }
    await validateConnection(false);
  };

  // Evolution instance handlers
  const handleCreateInstance = async () => {
    if (!user || !newInstanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    setIsCreatingInstance(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-create-instance-index-ts', {
        body: {
          instance_name: newInstanceName.trim(),
          display_name: newInstanceDisplayName.trim() || newInstanceName.trim()
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar instância');
      }

      toast.success('Instância criada com sucesso!');
      setIsInstanceDialogOpen(false);
      setNewInstanceName('');
      setNewInstanceDisplayName('');
      
      // Show QR code if available
      if (data.qrcode) {
        setSelectedInstance(data.instance);
        setCurrentQrCode(data.qrcode);
        setIsQrDialogOpen(true);
      }
      
      loadEvolutionInstances();
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast.error(error.message || 'Erro ao criar instância');
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleGetQrCode = async (instance: EvolutionInstance) => {
    setSelectedInstance(instance);
    setIsQrDialogOpen(true);
    setIsLoadingQr(true);
    setCurrentQrCode(null);

    try {
      const { data, error } = await supabase.functions.invoke('evolution-get-qrcode-index-ts', {
        body: { instance_id: instance.id }
      });

      if (error) throw error;

      if (data?.status === 'connected') {
        toast.success('WhatsApp já está conectado!');
        setIsQrDialogOpen(false);
        loadEvolutionInstances();
        return;
      }

      if (data?.qrcode) {
        setCurrentQrCode(data.qrcode);
      } else {
        toast.error('Não foi possível obter o QR Code');
        setIsQrDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Erro ao obter QR Code:', error);
      toast.error(error.message || 'Erro ao obter QR Code');
      setIsQrDialogOpen(false);
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleCheckStatus = async (instance: EvolutionInstance) => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-check-status-index-ts', {
        body: { instance_id: instance.id }
      });

      if (error) throw error;

      if (data?.status === 'connected') {
        toast.success(`Conectado! Número: ${data.phone_number || 'Desconhecido'}`);
      } else {
        toast.info(`Status: ${data?.status || 'Desconhecido'}`);
      }
      
      loadEvolutionInstances();
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      toast.error('Erro ao verificar status');
    }
  };

  const handleDeleteInstance = async () => {
    if (!deleteInstanceId) return;

    try {
      const { data, error } = await supabase.functions.invoke('evolution-delete-instance-index-ts', {
        body: { instance_id: deleteInstanceId }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao excluir instância');
      }

      toast.success('Instância excluída');
      setDeleteInstanceId(null);
      loadEvolutionInstances();
    } catch (error: any) {
      console.error('Erro ao excluir instância:', error);
      toast.error(error.message || 'Erro ao excluir instância');
    }
  };

  // Evolution template handlers
  const resetEvolutionTemplateForm = () => {
    setEvolutionTemplateName('');
    setEvolutionTemplateContent('');
    setEvolutionPollOptions([]);
    setEditingEvolutionTemplate(null);
  };

  const handleOpenEvolutionTemplateDialog = (template?: EvolutionTemplate) => {
    if (template) {
      setEditingEvolutionTemplate(template);
      setEvolutionTemplateName(template.name);
      setEvolutionTemplateContent(template.content);
      setEvolutionPollOptions(template.poll_options || []);
    } else {
      resetEvolutionTemplateForm();
    }
    setIsEvolutionTemplateDialogOpen(true);
  };

  const handleSaveEvolutionTemplate = async () => {
    if (!user || !evolutionTemplateName.trim() || !evolutionTemplateContent.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsSavingEvolutionTemplate(true);
    try {
      const cleanedOptions = evolutionPollOptions.map(o => o.trim()).filter(o => o.length > 0);
      const templateData = {
        user_id: user.id,
        name: evolutionTemplateName.trim(),
        content: evolutionTemplateContent.trim(),
        poll_options: cleanedOptions.length > 0 ? cleanedOptions : null,
      };

      if (editingEvolutionTemplate) {
        const { error } = await supabaseWiki
          .from('evolution_templates')
          .update(templateData)
          .eq('id', editingEvolutionTemplate.id);
        if (error) throw error;
        toast.success('Template atualizado!');
      } else {
        const { error } = await supabaseWiki
          .from('evolution_templates')
          .insert(templateData);
        if (error) throw error;
        toast.success('Template criado!');
      }

      // Reload templates
      const { data } = await supabaseWiki
        .from('evolution_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setEvolutionTemplates(data);

      setIsEvolutionTemplateDialogOpen(false);
      resetEvolutionTemplateForm();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setIsSavingEvolutionTemplate(false);
    }
  };

  const handleDeleteEvolutionTemplate = async (templateId: string) => {
    try {
      const { error } = await supabaseWiki
        .from('evolution_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setEvolutionTemplates(evolutionTemplates.filter(t => t.id !== templateId));
      toast.success('Template excluído');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  // Meta template handlers (kept from original)
  const resetMetaTemplateForm = () => {
    setTemplateName('');
    setTemplateCategory('MARKETING');
    setTemplateLanguage('pt_BR');
    setTemplateHeaderType(null);
    setTemplateHeaderContent('');
    setTemplateBody('');
    setTemplateFooter('');
    setEditingMetaTemplate(null);
  };

  const handleOpenMetaTemplateDialog = (template?: WhatsAppTemplate) => {
    if (template) {
      setEditingMetaTemplate(template);
      setTemplateName(template.name);
      setTemplateCategory(template.category as TemplateCategory);
      setTemplateLanguage(template.language);
      setTemplateHeaderType(template.header_type as HeaderType);
      setTemplateHeaderContent(template.header_content || '');
      setTemplateBody(template.body_text);
      setTemplateFooter(template.footer_text || '');
    } else {
      resetMetaTemplateForm();
    }
    setIsMetaTemplateDialogOpen(true);
  };

  const handleSaveMetaTemplate = async () => {
    if (!user || !templateName || !templateBody) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const templateData = {
        user_id: user.id,
        name: templateName,
        category: templateCategory,
        language: templateLanguage,
        header_type: templateHeaderType,
        header_content: templateHeaderType ? templateHeaderContent : null,
        body_text: templateBody,
        footer_text: templateFooter || null,
        status: 'pending' as TemplateStatus,
      };

      let savedTemplateId: string | null = null;

      if (editingMetaTemplate) {
        const { error } = await supabaseWiki
          .from('whatsapp_templates')
          .update(templateData)
          .eq('id', editingMetaTemplate.id);
        if (error) throw error;
        savedTemplateId = editingMetaTemplate.id;
      } else {
        const { data: insertedData, error } = await supabaseWiki
          .from('whatsapp_templates')
          .insert(templateData)
          .select('id')
          .single();
        if (error) throw error;
        savedTemplateId = insertedData?.id || null;
      }

      // If connected to Cloud API, submit to Meta
      if (connectionStatus === 'success' && savedTemplateId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          toast.info('Enviando template para aprovação do Meta...');
          
          const response = await supabase.functions.invoke('submit-whatsapp-template', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: {
              name: templateName,
              category: templateCategory,
              language: templateLanguage,
              header_type: templateHeaderType,
              header_content: templateHeaderType ? templateHeaderContent : null,
              body_text: templateBody,
              footer_text: templateFooter || null,
              local_template_id: savedTemplateId,
            },
          });

          if (response.error || response.data?.error) {
            const errorMsg = response.data?.details || response.error?.message || 'Erro desconhecido';
            toast.error(`Erro ao enviar para Meta: ${errorMsg}`);
          } else {
            toast.success('Template enviado para aprovação do Meta!');
          }
        }
      } else {
        toast.success(editingMetaTemplate ? 'Template atualizado!' : 'Template criado!');
      }

      // Reload templates
      const { data } = await supabaseWiki
        .from('whatsapp_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setMetaTemplates(data);

      setIsMetaTemplateDialogOpen(false);
      resetMetaTemplateForm();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteMetaTemplate = async (templateId: string) => {
    try {
      const { error } = await supabaseWiki
        .from('whatsapp_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setMetaTemplates(metaTemplates.filter(t => t.id !== templateId));
      toast.success('Template excluído');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleSyncTemplates = async () => {
    if (!user) return;
    
    setIsSyncingTemplates(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada');
        return;
      }

      const response = await supabase.functions.invoke('sync-whatsapp-templates', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.error) {
        toast.error(result.details || result.error);
        return;
      }

      const { data } = await supabaseWiki
        .from('whatsapp_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setMetaTemplates(data);
      
      toast.success(`Sincronização concluída: ${result.synced} novos, ${result.updated} atualizados`);
    } catch (error) {
      console.error('Erro ao sincronizar templates:', error);
      toast.error('Erro ao sincronizar templates do Meta');
    } finally {
      setIsSyncingTemplates(false);
    }
  };

  const getStatusBadge = (status: TemplateStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Rejeitado</Badge>;
    }
  };

  const getInstanceStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Conectando</Badge>;
      default:
        return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30"><WifiOff className="w-3 h-3 mr-1" /> Desconectado</Badge>;
    }
  };

  if (isLoadingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Configurações
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">
            Configurações
          </h1>

          <Tabs defaultValue="whatsapp" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates
              </TabsTrigger>
            </TabsList>

            {/* WhatsApp Config Tab */}
            <TabsContent value="whatsapp" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Provedor de WhatsApp</CardTitle>
                  <CardDescription>
                    Escolha como deseja enviar mensagens pelo WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingConfig ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      <RadioGroup value={provider} onValueChange={(v) => setProvider(v as WhatsAppProvider)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Label
                            htmlFor="evolution"
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              provider === 'evolution'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="evolution" id="evolution" className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Smartphone className="w-5 h-5 text-green-400" />
                                <span className="font-semibold">Evolution API</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Conecte seu WhatsApp via QR Code. Mais flexível, sem necessidade de aprovação de templates.
                              </p>
                            </div>
                          </Label>

                          <Label
                            htmlFor="cloudapi"
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              provider === 'cloudapi'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="cloudapi" id="cloudapi" className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Cloud className="w-5 h-5 text-blue-400" />
                                <span className="font-semibold">Cloud API (Meta)</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                API oficial da Meta. Requer templates aprovados, maior confiabilidade.
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Evolution Config - Instance Management */}
                      {provider === 'evolution' && (
                        <div className="space-y-4 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">Instâncias WhatsApp</h3>
                              <p className="text-sm text-muted-foreground">
                                Gerencie suas conexões do WhatsApp
                              </p>
                            </div>
                            <Dialog open={isInstanceDialogOpen} onOpenChange={setIsInstanceDialogOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Nova Instância
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Criar Nova Instância</DialogTitle>
                                  <DialogDescription>
                                    Crie uma nova conexão do WhatsApp para enviar mensagens
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="instance-name">Nome da Instância *</Label>
                                    <Input
                                      id="instance-name"
                                      placeholder="Ex: atendimento"
                                      value={newInstanceName}
                                      onChange={(e) => setNewInstanceName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Use apenas letras minúsculas, números e hífens
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="display-name">Nome de Exibição</Label>
                                    <Input
                                      id="display-name"
                                      placeholder="Ex: Atendimento Principal"
                                      value={newInstanceDisplayName}
                                      onChange={(e) => setNewInstanceDisplayName(e.target.value)}
                                    />
                                  </div>
                                  <Button 
                                    onClick={handleCreateInstance} 
                                    disabled={isCreatingInstance || !newInstanceName.trim()}
                                    className="w-full"
                                  >
                                    {isCreatingInstance ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Criando...
                                      </>
                                    ) : (
                                      'Criar Instância'
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          {isLoadingInstances ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : evolutionInstances.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>Nenhuma instância criada</p>
                              <p className="text-sm">Clique em "Nova Instância" para começar</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {evolutionInstances.map((instance) => (
                                <div
                                  key={instance.id}
                                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Phone className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {instance.display_name || instance.instance_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {instance.phone_number || 'Número não conectado'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getInstanceStatusBadge(instance.status)}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCheckStatus(instance)}
                                      title="Verificar status"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    {instance.status !== 'connected' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGetQrCode(instance)}
                                        title="Conectar via QR Code"
                                      >
                                        <QrCode className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteInstanceId(instance.id)}
                                      className="text-destructive hover:text-destructive"
                                      title="Excluir instância"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cloud API Config */}
                      {provider === 'cloudapi' && (
                        <div className="space-y-4 pt-4 border-t border-border">
                          <div className="space-y-2">
                            <Label htmlFor="phone-number-id">Phone Number ID</Label>
                            <Input
                              id="phone-number-id"
                              placeholder="Ex: 123456789012345"
                              value={cloudapiPhoneId}
                              onChange={(e) => setCloudapiPhoneId(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="business-id">Business Account ID</Label>
                            <Input
                              id="business-id"
                              placeholder="Ex: 123456789012345"
                              value={cloudapiBusinessId}
                              onChange={(e) => setCloudapiBusinessId(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="access-token">
                              Access Token
                              {config?.has_access_token && !cloudapiAccessToken && (
                                <Badge variant="outline" className="ml-2 text-green-500 border-green-500/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Configurado
                                </Badge>
                              )}
                            </Label>
                            <Input
                              id="access-token"
                              type="password"
                              placeholder={config?.has_access_token ? "••••••••••••••••••••" : "Seu token de acesso do Meta"}
                              value={cloudapiAccessToken}
                              onChange={(e) => setCloudapiAccessToken(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              {config?.has_access_token 
                                ? "Token já configurado. Deixe em branco para manter o atual ou insira um novo para atualizar."
                                : "Token permanente gerado no Meta Business Suite. Mantenha em segredo!"}
                            </p>
                          </div>
                          
                          {connectionStatus !== 'idle' && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg ${
                              connectionStatus === 'success' 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : connectionStatus === 'loading'
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {connectionStatus === 'success' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : connectionStatus === 'loading' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                              <span className="text-sm">
                                {connectionStatus === 'loading' 
                                  ? 'Verificando conexão...' 
                                  : connectionMessage}
                              </span>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                              {isSavingConfig ? 'Salvando...' : 'Salvar Configuração'}
                            </Button>
                            
                            {config && (
                              <Button 
                                variant="outline" 
                                onClick={handleTestConnection} 
                                disabled={isTestingConnection}
                              >
                                {isTestingConnection ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Testando...
                                  </>
                                ) : (
                                  'Testar Conexão'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {provider === 'evolution' && (
                        <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                          {isSavingConfig ? 'Salvando...' : 'Salvar Configuração'}
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Setup Guide */}
              <SetupGuide provider={provider} />
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {provider === 'evolution' ? 'Mensagens Prontas' : 'Templates de Mensagem'}
                      </CardTitle>
                      <CardDescription>
                        {provider === 'cloudapi' 
                          ? 'Crie templates para usar com a Cloud API. Eles serão analisados antes de serem aprovados.'
                          : 'Crie mensagens prontas para usar com a Evolution API. Não requer aprovação.'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider === 'cloudapi' && connectionStatus === 'success' && (
                        <Button 
                          variant="outline" 
                          onClick={handleSyncTemplates}
                          disabled={isSyncingTemplates}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingTemplates ? 'animate-spin' : ''}`} />
                          {isSyncingTemplates ? 'Sincronizando...' : 'Sincronizar do Meta'}
                        </Button>
                      )}
                      
                      {provider === 'evolution' ? (
                        <Dialog open={isEvolutionTemplateDialogOpen} onOpenChange={setIsEvolutionTemplateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => handleOpenEvolutionTemplateDialog()}>
                              <Plus className="w-4 h-4 mr-2" />
                              Nova Mensagem
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {editingEvolutionTemplate ? 'Editar Mensagem' : 'Nova Mensagem Pronta'}
                              </DialogTitle>
                              <DialogDescription>
                                Crie uma mensagem para usar rapidamente em seus envios
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="evo-template-name">Nome *</Label>
                                <Input
                                  id="evo-template-name"
                                  placeholder="Ex: Boas vindas"
                                  value={evolutionTemplateName}
                                  onChange={(e) => setEvolutionTemplateName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="evo-template-content">Mensagem *</Label>
                                <Textarea
                                  id="evo-template-content"
                                  placeholder="Digite sua mensagem aqui... Use {{1}}, {{2}} para variáveis"
                                  value={evolutionTemplateContent}
                                  onChange={(e) => setEvolutionTemplateContent(e.target.value)}
                                  rows={6}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Dica: Use {"{{1}}"}, {"{{2}}"}, etc. para inserir variáveis como nome do contato
                                </p>
                              </div>
                              {/* Poll Options */}
                              <div className="space-y-2">
                                <Label>Opções de Enquete (opcional)</Label>
                                <p className="text-xs text-muted-foreground">
                                  Adicione opções numeradas para pesquisas. As respostas serão analisadas em gráficos na página de Resultados.
                                </p>
                                {evolutionPollOptions.map((option, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                                    <Input
                                      placeholder={`Opção ${index + 1}`}
                                      value={option}
                                      onChange={(e) => {
                                        const updated = [...evolutionPollOptions];
                                        updated[index] = e.target.value;
                                        setEvolutionPollOptions(updated);
                                      }}
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => setEvolutionPollOptions(evolutionPollOptions.filter((_, i) => i !== index))}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEvolutionPollOptions([...evolutionPollOptions, ''])}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Adicionar Opção
                                </Button>
                              </div>
                              <Button 
                                onClick={handleSaveEvolutionTemplate} 
                                disabled={isSavingEvolutionTemplate}
                                className="w-full"
                              >
                                {isSavingEvolutionTemplate ? 'Salvando...' : 'Salvar Mensagem'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Dialog open={isMetaTemplateDialogOpen} onOpenChange={setIsMetaTemplateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => handleOpenMetaTemplateDialog()}>
                              <Plus className="w-4 h-4 mr-2" />
                              Novo Template
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {editingMetaTemplate ? 'Editar Template' : 'Criar Novo Template'}
                              </DialogTitle>
                              <DialogDescription>
                                O template será enviado para análise após a criação.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="template-name">Nome do Template *</Label>
                                <Input
                                  id="template-name"
                                  placeholder="Ex: promocao_janeiro"
                                  value={templateName}
                                  onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Use apenas letras minúsculas, números e underline
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Categoria</Label>
                                  <Select value={templateCategory} onValueChange={(v) => setTemplateCategory(v as TemplateCategory)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="MARKETING">Marketing</SelectItem>
                                      <SelectItem value="UTILITY">Utilitário</SelectItem>
                                      <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Idioma</Label>
                                  <Select value={templateLanguage} onValueChange={setTemplateLanguage}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pt_BR">Português (BR)</SelectItem>
                                      <SelectItem value="en_US">English (US)</SelectItem>
                                      <SelectItem value="es">Español</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Cabeçalho (opcional)</Label>
                                <Select 
                                  value={templateHeaderType || 'none'} 
                                  onValueChange={(v) => setTemplateHeaderType(v === 'none' ? null : v as HeaderType)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sem cabeçalho" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sem cabeçalho</SelectItem>
                                    <SelectItem value="TEXT">Texto</SelectItem>
                                    <SelectItem value="IMAGE">Imagem</SelectItem>
                                    <SelectItem value="VIDEO">Vídeo</SelectItem>
                                    <SelectItem value="DOCUMENT">Documento</SelectItem>
                                  </SelectContent>
                                </Select>
                                {templateHeaderType === 'TEXT' && (
                                  <Input
                                    placeholder="Texto do cabeçalho"
                                    value={templateHeaderContent}
                                    onChange={(e) => setTemplateHeaderContent(e.target.value)}
                                  />
                                )}
                                {templateHeaderType && templateHeaderType !== 'TEXT' && (
                                  <Input
                                    placeholder="URL do arquivo de mídia"
                                    value={templateHeaderContent}
                                    onChange={(e) => setTemplateHeaderContent(e.target.value)}
                                  />
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="template-body">Corpo da Mensagem *</Label>
                                <Textarea
                                  id="template-body"
                                  placeholder="Digite o conteúdo principal... Use {{1}}, {{2}} para variáveis"
                                  value={templateBody}
                                  onChange={(e) => setTemplateBody(e.target.value)}
                                  rows={4}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="template-footer">Rodapé (opcional)</Label>
                                <Input
                                  id="template-footer"
                                  placeholder="Ex: Responda SAIR para cancelar"
                                  value={templateFooter}
                                  onChange={(e) => setTemplateFooter(e.target.value)}
                                />
                              </div>

                              <Button 
                                onClick={handleSaveMetaTemplate} 
                                disabled={isSavingTemplate}
                                className="w-full"
                              >
                                {isSavingTemplate ? 'Salvando...' : 'Salvar Template'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Evolution Templates List */}
                  {provider === 'evolution' && (
                    isLoadingEvolutionTemplates ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : evolutionTemplates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma mensagem criada</p>
                        <p className="text-sm">Clique em "Nova Mensagem" para começar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {evolutionTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="flex items-start justify-between p-4 rounded-lg border border-border bg-card"
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <p className="font-medium truncate">{template.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {template.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEvolutionTemplateDialog(template)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvolutionTemplate(template.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Meta Templates List */}
                  {provider === 'cloudapi' && (
                    isLoadingMetaTemplates ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : metaTemplates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum template criado</p>
                        <p className="text-sm">Clique em "Novo Template" para começar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {metaTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="flex items-start justify-between p-4 rounded-lg border border-border bg-card"
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">{template.name}</p>
                                {getStatusBadge(template.status as TemplateStatus)}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.body_text}
                              </p>
                              {template.rejection_reason && (
                                <p className="text-xs text-red-400 mt-1">
                                  Motivo: {template.rejection_reason}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenMetaTemplateDialog(template)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMetaTemplate(template.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {isLoadingQr ? (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : currentQrCode ? (
              <div className="p-4 bg-white rounded-lg">
                <img 
                  src={currentQrCode.startsWith('data:') ? currentQrCode : `data:image/png;base64,${currentQrCode}`}
                  alt="QR Code"
                  className="w-56 h-56"
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground text-sm">QR Code não disponível</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Abra o WhatsApp no seu celular<br />
              Vá em Configurações → Aparelhos conectados → Conectar
            </p>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => selectedInstance && handleGetQrCode(selectedInstance)}
                disabled={isLoadingQr}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingQr ? 'animate-spin' : ''}`} />
                Atualizar QR
              </Button>
              <Button 
                onClick={() => {
                  if (selectedInstance) {
                    handleCheckStatus(selectedInstance);
                    setIsQrDialogOpen(false);
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar Conexão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Instance Confirmation */}
      <AlertDialog open={!!deleteInstanceId} onOpenChange={() => setDeleteInstanceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Instância</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita e a conexão do WhatsApp será perdida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInstance} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
