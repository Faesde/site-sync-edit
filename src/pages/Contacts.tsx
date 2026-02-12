import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  Upload,
  FileSpreadsheet,
  Trash2,
  MessageCircle,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  X,
  Download,
  Users,
  LogOut,
  Mic,
  Music,
  Settings,
  MessageSquare,
  ChevronDown,
  Play,
  Pause,
  Timer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { parseContactsFile } from "@/lib/contactsImport";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { supabaseWiki } from "@/lib/supabaseWiki";
import { CampaignNameModal } from "@/components/CampaignNameModal";
import { IVRConfigEditor, type IVRMenuItem } from "@/components/IVRConfigEditor";
import { toast } from "@/hooks/use-toast";
import { CampaignProgressModal } from "@/components/CampaignProgressModal";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  selected: boolean;
}

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const availableActions: Action[] = [
  {
    id: "whatsapp",
    label: "Enviar WhatsApp",
    icon: <MessageCircle className="w-4 h-4" />,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    id: "email",
    label: "Enviar E-mail",
    icon: <Mail className="w-4 h-4" />,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    id: "call",
    label: "Ligar",
    icon: <Phone className="w-4 h-4" />,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "sms",
    label: "Enviar SMS",
    icon: <Send className="w-4 h-4" />,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
];

const Contacts = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, profile, role, isSubscribed } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio upload states
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [uploadedAudioPath, setUploadedAudioPath] = useState<string | null>(null);

  // IVR configuration for calls
  const [ivrMenuStructure, setIvrMenuStructure] = useState<Array<{ key: string; label: string; submenus?: Array<{ key: string; label: string }> }>>([]);
  
  // Call mode: 'audio' (with uploaded audio) or 'tts' (IVR with Text-to-Speech)
  const [callMode, setCallMode] = useState<'audio' | 'tts'>('audio');

  // IVR intro message for TTS mode
  const [ivrIntroMessage, setIvrIntroMessage] = useState<string>('');

  // IVR variable mappings (reusing VariableMapping type from WhatsApp)
  const [ivrVariableMappings, setIvrVariableMappings] = useState<VariableMapping[]>([]);

  // Audio preview playback
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingTTSPreview, setIsPlayingTTSPreview] = useState(false);
  const ttsPreviewRef = useRef<SpeechSynthesisUtterance | null>(null);

  // WhatsApp template selection
  interface WhatsAppTemplate {
    id: string;
    name: string;
    body_text: string;
    status: string;
  }
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [whatsappProvider, setWhatsappProvider] = useState<string | null>(null);
  
  // Evolution API state
  interface EvolutionInstance {
    id: string;
    instance_name: string;
    display_name: string | null;
    phone_number: string | null;
    status: string;
  }
  interface EvolutionTemplate {
    id: string;
    name: string;
    content: string;
    poll_options?: string[] | null;
  }
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [evolutionTemplates, setEvolutionTemplates] = useState<EvolutionTemplate[]>([]);
  const [selectedEvolutionInstanceId, setSelectedEvolutionInstanceId] = useState<string | null>(null);
  const [selectedEvolutionTemplateId, setSelectedEvolutionTemplateId] = useState<string | null>(null);
  const [evolutionCustomMessage, setEvolutionCustomMessage] = useState('');
  const [evolutionMessageMode, setEvolutionMessageMode] = useState<'template' | 'custom'>('template');
  
  // Variable mapping for templates
  type VariableSource = 'name' | 'phone' | 'email' | 'custom';
  interface VariableMapping {
    variable: string;
    source: VariableSource;
    customValue?: string;
  }
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [evolutionVariableMappings, setEvolutionVariableMappings] = useState<VariableMapping[]>([]);

  // Campaign name modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  
  // Send interval configuration (min/max for random delay)
  const [sendIntervalMin, setSendIntervalMin] = useState<number>(25);
  const [sendIntervalMax, setSendIntervalMax] = useState<number>(60);
  const [sendIntervalUnit, setSendIntervalUnit] = useState<'seconds' | 'minutes'>('seconds');
  
  // Night pause configuration
  const [nightPauseEnabled, setNightPauseEnabled] = useState(true);
  const [nightPauseStart, setNightPauseStart] = useState(21); // 21 = 9pm
  const [nightPauseEnd, setNightPauseEnd] = useState(7); // 7 = 7am
  
  // Progressive warmup configuration
  const [warmupEnabled, setWarmupEnabled] = useState(true);
  const [warmupMessages, setWarmupMessages] = useState(200);
  const [warmupMaxDelay, setWarmupMaxDelay] = useState(120); // seconds
  
  // Campaign progress tracking
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({
    totalContacts: 0,
    sentCount: 0,
    failedCount: 0,
    currentContact: '',
    isComplete: false,
    campaignName: '',
  });
  const [isRunningInBackground, setIsRunningInBackground] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [pauseReason, setPauseReason] = useState<string | null>(null);
  const cancelCampaignRef = useRef(false);
  
  const extractTemplateVariables = (body: string): string[] => {
    const matches = body.match(/\{\{\d+\}\}/g) || [];
    return [...new Set(matches)].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numA - numB;
    });
  };

  // Update variable mappings when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = whatsappTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        const variables = extractTemplateVariables(template.body_text);
        const newMappings: VariableMapping[] = variables.map((v, index) => ({
          variable: v,
          source: index === 0 ? 'name' : 'custom', // Default first variable to name
          customValue: '',
        }));
        setVariableMappings(newMappings);
      }
    } else {
      setVariableMappings([]);
    }
  }, [selectedTemplateId, whatsappTemplates]);

  // Update IVR variable mappings when intro message changes
  useEffect(() => {
    const variables = extractTemplateVariables(ivrIntroMessage);
    if (variables.length > 0) {
      // Preserve existing mappings if they exist
      const newMappings: VariableMapping[] = variables.map((v, index) => {
        const existing = ivrVariableMappings.find(m => m.variable === v);
        if (existing) return existing;
        return {
          variable: v,
          source: index === 0 ? 'name' : 'custom',
          customValue: '',
        };
      });
      setIvrVariableMappings(newMappings);
    } else {
      setIvrVariableMappings([]);
    }
  }, [ivrIntroMessage]);

  // Update Evolution variable mappings when template or custom message changes
  useEffect(() => {
    let content = '';
    if (evolutionMessageMode === 'template' && selectedEvolutionTemplateId) {
      const tpl = evolutionTemplates.find(t => t.id === selectedEvolutionTemplateId);
      content = tpl?.content || '';
    } else if (evolutionMessageMode === 'custom') {
      content = evolutionCustomMessage;
    }
    const variables = extractTemplateVariables(content);
    if (variables.length > 0) {
      const newMappings: VariableMapping[] = variables.map((v, index) => {
        const existing = evolutionVariableMappings.find(m => m.variable === v);
        if (existing) return existing;
        return { variable: v, source: index === 0 ? 'name' : 'custom' as VariableSource, customValue: '' };
      });
      setEvolutionVariableMappings(newMappings);
    } else {
      setEvolutionVariableMappings([]);
    }
  }, [selectedEvolutionTemplateId, evolutionTemplates, evolutionMessageMode, evolutionCustomMessage]);

  const isLoadingAccess = loading || (user && role === null);
  const isAdmin = role === 'admin';
  const hasAccess = isSubscribed || isAdmin;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    // Redirect to plans APENAS após verificar role (não redireciona enquanto role é null)
    if (!loading && user && role !== null && !hasAccess) {
      navigate("/plans");
    }
  }, [user, loading, role, hasAccess, navigate]);

  // Load WhatsApp config and templates
  useEffect(() => {
    const loadWhatsAppData = async () => {
      if (!user) return;

      try {
        // Load provider config
        const { data: configData } = await supabaseWiki
          .from('whatsapp_config')
          .select('provider')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (configData) {
          setWhatsappProvider(configData.provider);
          
          // If Evolution provider, load instances and templates
          if (configData.provider === 'evolution') {
            // Load Evolution instances
            const { data: instancesResponse } = await supabase.functions.invoke('evolution-get-instances-index-ts');
            if (instancesResponse?.success && instancesResponse?.instances) {
              const connectedInstances = instancesResponse.instances.filter(
                (inst: EvolutionInstance) => inst.status === 'connected'
              );
              setEvolutionInstances(connectedInstances);
              // Auto-select first connected instance
              if (connectedInstances.length > 0 && !selectedEvolutionInstanceId) {
                setSelectedEvolutionInstanceId(connectedInstances[0].id);
              }
            }
            
            // Load Evolution templates
            const { data: evoTemplatesData } = await supabaseWiki
              .from('evolution_templates')
              .select('id, name, content, poll_options')
              .eq('user_id', user.id)
              .order('name');
            
            if (evoTemplatesData) {
              setEvolutionTemplates(evoTemplatesData);
            }
          }
        }

        // Load approved Meta templates (for Cloud API)
        const { data: templatesData } = await supabaseWiki
          .from('whatsapp_templates')
          .select('id, name, body_text, status')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .order('name');
        
        if (templatesData) {
          setWhatsappTemplates(templatesData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do WhatsApp:', error);
      }
    };

    loadWhatsAppData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Mostra loading enquanto carrega auth OU enquanto carrega role
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
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadedFileName(file.name);
    setFileError(null);
    setIsParsingFile(true);

    try {
      const imported = await parseContactsFile(file);

      const parsedContacts: Contact[] = imported.map((row, index) => ({
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${index}`,
        name: row.name,
        phone: row.phone,
        email: row.email,
        selected: false,
      }));

      setContacts(parsedContacts);
    } catch (err) {
      console.error("Erro ao importar contatos:", err);
      setContacts([]);
      setFileError(
        err instanceof Error ? err.message : "Não foi possível ler o arquivo."
      );
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const toggleContact = (id: string) => {
    setContacts(
      contacts.map((c) =>
        c.id === id ? { ...c, selected: !c.selected } : c
      )
    );
  };

  const toggleAllContacts = () => {
    const allSelected = contacts.every((c) => c.selected);
    setContacts(contacts.map((c) => ({ ...c, selected: !allSelected })));
  };

  const toggleAction = (actionId: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionId)
        ? prev.filter((a) => a !== actionId)
        : [...prev, actionId]
    );
    // Se deselecionar "call", limpar o áudio e IVR
    if (actionId === 'call' && selectedActions.includes('call')) {
      setAudioFile(null);
      setAudioFileName(null);
      setAudioError(null);
      setUploadedAudioPath(null);
      setIvrMenuStructure([]);
    }
  };

  const deleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const selectedContactsCount = contacts.filter((c) => c.selected).length;

  // Validar duração do áudio (max 1 minuto)
  const validateAudioDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        if (audio.duration > 60) {
          setAudioError('O áudio deve ter no máximo 1 minuto de duração.');
          resolve(false);
        } else {
          resolve(true);
        }
      };
      audio.onerror = () => {
        setAudioError('Erro ao processar o arquivo de áudio.');
        resolve(false);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAudioError(null);
    setAudioFileName(file.name);
    
    // Validar duração
    const isValid = await validateAudioDuration(file);
    if (!isValid) {
      setAudioFileName(null);
      return;
    }

    setAudioFile(file);
    setIsUploadingAudio(true);

    try {
      // Upload para storage: pasta = user_id
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('call-audios')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Erro ao fazer upload:', error);
        setAudioError('Erro ao fazer upload do áudio. Tente novamente.');
        setAudioFile(null);
        setAudioFileName(null);
      } else {
        console.log('Áudio enviado com sucesso:', data.path);
        setUploadedAudioPath(data.path);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setAudioError('Erro ao fazer upload do áudio. Tente novamente.');
      setAudioFile(null);
      setAudioFileName(null);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const removeAudio = () => {
    // Stop playback if playing
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlayingAudio(false);
    setAudioFile(null);
    setAudioFileName(null);
    setAudioError(null);
    setUploadedAudioPath(null);
  };

  // Toggle audio preview playback
  const toggleAudioPreview = async () => {
    if (!uploadedAudioPath) return;

    if (isPlayingAudio && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      // Get signed URL for playback
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('call-audios')
        .createSignedUrl(uploadedAudioPath, 300); // 5 minutes

      if (signedUrlError || !signedUrlData?.signedUrl) {
        toast({
          title: "Erro ao reproduzir áudio",
          description: "Não foi possível carregar o áudio.",
          variant: "destructive"
        });
        return;
      }

      // Create audio element and play
      const audio = new Audio(signedUrlData.signedUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
        toast({
          title: "Erro ao reproduzir",
          description: "Formato de áudio não suportado.",
          variant: "destructive"
        });
      };

      await audio.play();
      setIsPlayingAudio(true);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Generate TTS preview text
  const getTTSPreviewText = () => {
    const intro = ivrIntroMessage.trim();
    const options = ivrMenuStructure
      .filter((m) => m.key && m.label)
      .map((m) => `Digite ${m.key} para ${m.label}`)
      .join('. ');
    
    if (intro && options) {
      return `${intro}. ${options}`;
    }
    return intro || options || '';
  };

  // Toggle TTS preview using Web Speech API
  const toggleTTSPreview = () => {
    if (isPlayingTTSPreview) {
      window.speechSynthesis.cancel();
      setIsPlayingTTSPreview(false);
      return;
    }

    const text = getTTSPreviewText();
    if (!text) {
      toast({
        title: "Nada para reproduzir",
        description: "Configure a mensagem de introdução ou as opções do menu.",
        variant: "destructive"
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      setIsPlayingTTSPreview(false);
      ttsPreviewRef.current = null;
    };

    utterance.onerror = () => {
      setIsPlayingTTSPreview(false);
      ttsPreviewRef.current = null;
    };

    ttsPreviewRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlayingTTSPreview(true);
  };

  // Open campaign modal instead of executing directly
  const handleExecuteClick = () => {
    const selectedContacts = contacts.filter((c) => c.selected);
    
    // Validate call configuration
    if (selectedActions.includes('call')) {
      if (callMode === 'audio' && !uploadedAudioPath) {
        setAudioError('Por favor, envie um áudio para a ligação antes de executar.');
        return;
      }
      if (callMode === 'tts' && ivrMenuStructure.length === 0) {
        setAudioError('Por favor, configure o menu IVR antes de executar.');
        return;
      }
    }
    
    if (selectedActions.length > 0 && selectedContacts.length > 0) {
      setShowCampaignModal(true);
    }
  };

  const handleExecuteActions = async (campaignName: string) => {
    setShowCampaignModal(false);
    const selectedContacts = contacts.filter((c) => c.selected);
    console.log("Executando ações:", selectedActions, "para contatos:", selectedContacts);

    // Envia para o webhook n8n com todas as ações selecionadas
    if (selectedActions.length > 0 && selectedContacts.length > 0) {
      try {
        // Gerar URL assinada do áudio (válida por 1 hora)
        let callAudioUrl: string | null = null;
        if (uploadedAudioPath && selectedActions.includes('call')) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('call-audios')
            .createSignedUrl(uploadedAudioPath, 3600); // 3600 segundos = 1 hora
          
          if (signedUrlError) {
            console.error('Erro ao gerar URL assinada:', signedUrlError);
            setAudioError('Erro ao processar áudio. Tente novamente.');
            return;
          }
          callAudioUrl = signedUrlData.signedUrl;
        }

        // Gerar ID de campanha único para WhatsApp
        const campaignId = selectedActions.includes('whatsapp') 
          ? `campaign_${user?.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          : null;

        // Encontrar template selecionado
        const selectedTemplate = selectedTemplateId 
          ? whatsappTemplates.find(t => t.id === selectedTemplateId)
          : null;

        // Generate a unified campaign ID for all actions
        const unifiedCampaignId = `campaign_${user?.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create campaign record in database for ALL campaign types
        if (user) {
          const { error: campaignError } = await supabaseWiki
            .from('whatsapp_campaigns')
            .insert({
              id: unifiedCampaignId,
              user_id: user.id,
              name: campaignName,
              template_id: selectedActions.includes('whatsapp') ? (selectedTemplateId || null) : null,
              template_name: selectedActions.includes('whatsapp') ? (selectedTemplate?.name || null) : (selectedActions.includes('call') ? 'Ligação' : null),
              contacts_count: selectedContacts.length,
              poll_options: (() => {
                if (whatsappProvider === 'evolution' && evolutionMessageMode === 'template' && selectedEvolutionTemplateId) {
                  const evoTpl = evolutionTemplates.find(t => t.id === selectedEvolutionTemplateId);
                  return evoTpl?.poll_options || null;
                }
                return null;
              })(),
            });
          
          if (campaignError) {
            console.error('Erro ao criar campanha:', campaignError);
            toast({
              title: "Erro ao criar campanha",
              description: campaignError.message,
              variant: "destructive"
            });
            return;
          }
        }

        // Use the unified campaign ID for calls
        const callCampaignId = unifiedCampaignId;

        // Save IVR config if call is selected and has menu structure
        if (selectedActions.includes('call') && ivrMenuStructure.length > 0 && callCampaignId && user) {
          const { error: ivrError } = await supabaseWiki
            .from('call_ivr_config')
            .upsert({
              user_id: user.id,
              campaign_id: callCampaignId,
              menu_structure: ivrMenuStructure,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'campaign_id' });

          if (ivrError) {
            console.error('Erro ao salvar config IVR:', ivrError);
          } else {
            console.log('Config IVR salva para campanha:', callCampaignId);
          }
        }

        const payload = {
          user_id: user?.id, // ID da conta do usuário logado
          user_email: user?.email, // Email do usuário logado
          actions: selectedActions, // Array com todas as ações: ["whatsapp", "email", "call", "sms"]
          id_campanha: unifiedCampaignId, // ID único da campanha
          campaign_name: campaignName, // Nome da campanha
          whatsapp_provider: whatsappProvider, // 'evolution' ou 'cloudapi'
          whatsapp_template_id: selectedTemplateId, // ID do template (se Cloud API)
          whatsapp_template_name: selectedTemplate?.name || null, // Nome do template
          whatsapp_template_body: selectedTemplate?.body_text || null, // Corpo do template
          call_mode: callMode, // 'audio' ou 'tts'
          call_intro_message: callMode === 'tts' ? ivrIntroMessage : null, // Mensagem de introdução para TTS
          call_ivr_variable_mappings: callMode === 'tts' && ivrVariableMappings.length > 0 
            ? ivrVariableMappings.map(m => ({ variable: m.variable, source: m.source, customValue: m.customValue }))
            : null, // Mapeamento de variáveis para TTS
          call_audio_url: callMode === 'audio' ? callAudioUrl : null, // URL assinada do áudio (válida por 1 hora)
          call_audio_path: callMode === 'audio' ? uploadedAudioPath : null, // Caminho original no storage (backup)
          call_ivr_menu: ivrMenuStructure.length > 0 ? ivrMenuStructure : null, // Menu IVR
          call_campaign_id: callCampaignId, // ID da campanha para callback
          contacts: selectedContacts.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
          })),
          timestamp: new Date().toISOString(),
        };

        // Se WhatsApp está selecionado e é Cloud API, envia diretamente pela Edge Function
        if (selectedActions.includes('whatsapp') && whatsappProvider === 'cloudapi') {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.error('Sessão expirada');
              return;
            }

            const whatsappContacts = selectedContacts.map(c => ({
              name: c.name,
              phone: c.phone,
              email: c.email,
            }));

            // Build variable mappings for the API
            const variableMappingsPayload = variableMappings.map(m => ({
              variable: m.variable,
              source: m.source,
              customValue: m.customValue || '',
            }));

            const response = await supabase.functions.invoke('send-whatsapp-messages', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              body: {
                campaign_id: unifiedCampaignId,
                contacts: whatsappContacts,
                template_name: selectedTemplate?.name || null,
                template_body: selectedTemplate?.body_text || 'Olá!',
                variable_mappings: variableMappingsPayload,
              },
            });

            if (response.error) {
              console.error('Erro ao enviar WhatsApp:', response.error);
              toast({
                title: "Erro no envio",
                description: response.error.message,
                variant: "destructive"
              });
            } else {
              console.log('Campanha WhatsApp enviada!', response.data);
              console.log(`Enviadas: ${response.data.sent}, Falhas: ${response.data.failed}`);
              
              // Update campaign stats
              if (campaignId && user) {
                await supabaseWiki
                  .from('whatsapp_campaigns')
                  .update({
                    sent_count: response.data.sent || 0,
                    failed_count: response.data.failed || 0,
                  })
                  .eq('id', campaignId);
              }
              
              toast({
                title: "Campanha enviada!",
                description: `${response.data.sent} mensagens enviadas com sucesso.`,
              });
            }
          } catch (error) {
            console.error('Erro ao enviar WhatsApp via Edge Function:', error);
          }
        } else if (selectedActions.includes('whatsapp') && whatsappProvider === 'evolution') {
          // Send via Evolution API — SERVER-SIDE processing
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              toast({ title: "Erro", description: "Sessão expirada. Faça login novamente.", variant: "destructive" });
              return;
            }

            let messageBody = '';
            if (evolutionMessageMode === 'template' && selectedEvolutionTemplateId) {
              const selectedEvTemplate = evolutionTemplates.find(t => t.id === selectedEvolutionTemplateId);
              messageBody = selectedEvTemplate?.content || '';
            } else if (evolutionMessageMode === 'custom') {
              messageBody = evolutionCustomMessage;
            }

            if (!messageBody) {
              toast({ title: "Erro", description: "Nenhuma mensagem definida.", variant: "destructive" });
              return;
            }
            if (!selectedEvolutionInstanceId) {
              toast({ title: "Erro", description: "Selecione uma instância do WhatsApp.", variant: "destructive" });
              return;
            }

            const multiplier = sendIntervalUnit === 'minutes' ? 60 * 1000 : 1000;

            // Initialize progress modal
            setCampaignProgress({
              totalContacts: selectedContacts.length,
              sentCount: 0,
              failedCount: 0,
              currentContact: 'Iniciando envio no servidor...',
              isComplete: false,
              campaignName: campaignName,
            });
            setShowProgressModal(true);
            setIsRunningInBackground(false);
            setIsPaused(false);
            setPauseReason(null);
            cancelCampaignRef.current = false;

            // Start server-side job
            const startResp = await supabase.functions.invoke('evolution-send-campaign', {
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: {
                action: 'start',
                campaign_id: unifiedCampaignId,
                campaign_name: campaignName,
                instance_id: selectedEvolutionInstanceId,
                contacts: selectedContacts.map(c => ({ name: c.name, phone: c.phone, email: c.email })),
                message_body: messageBody,
                template_id: selectedEvolutionTemplateId,
                variable_mappings: evolutionVariableMappings.map(m => ({
                  variable: m.variable, source: m.source, customValue: m.customValue,
                })),
                delay_min_ms: sendIntervalMin * multiplier,
                delay_max_ms: sendIntervalMax * multiplier,
                warmup_enabled: warmupEnabled,
                warmup_messages: warmupMessages,
                warmup_max_delay_ms: warmupMaxDelay * 1000,
                night_pause_enabled: nightPauseEnabled,
                night_pause_start: nightPauseStart,
                night_pause_end: nightPauseEnd,
              },
            });

            if (startResp.error || !startResp.data?.success) {
              throw new Error(startResp.data?.error || 'Erro ao iniciar campanha');
            }

            const jobId = startResp.data.job_id;

            // Poll for progress from DB
            const pollInterval = setInterval(async () => {
              try {
                const { data: job } = await supabaseWiki
                  .from('campaign_jobs')
                  .select('*')
                  .eq('id', jobId)
                  .single();

                if (!job) return;

                setCampaignProgress(prev => ({
                  ...prev,
                  sentCount: job.sent_count || 0,
                  failedCount: job.failed_count || 0,
                  currentContact: job.current_contact || '',
                  isComplete: job.status === 'completed' || job.status === 'cancelled' || job.status === 'failed',
                }));

                setIsPaused(job.status === 'paused');
                setPauseReason(job.status === 'paused' ? (job.current_contact || 'Pausado') : null);

                if (job.status === 'completed' || job.status === 'cancelled' || job.status === 'failed') {
                  clearInterval(pollInterval);
                  const desc = job.status === 'cancelled'
                    ? `Cancelada. ${job.sent_count} enviadas, ${job.failed_count} falhas.`
                    : job.status === 'failed'
                    ? `Falhou. ${job.sent_count} enviadas até o momento.`
                    : `${job.sent_count} enviadas, ${job.failed_count} falhas.`;
                  toast({
                    title: job.status === 'completed' ? "Campanha finalizada!" : job.status === 'cancelled' ? "Campanha cancelada" : "Campanha falhou",
                    description: desc,
                    variant: job.status === 'completed' ? undefined : 'destructive',
                  });
                }
              } catch (err) {
                console.error('Polling error:', err);
              }
            }, 3000);

            // Store jobId and pollInterval for cancel action
            cancelCampaignRef.current = false;
            // Override cancel to call edge function
            (window as any).__currentCampaignJobId = jobId;
            (window as any).__currentCampaignPollInterval = pollInterval;

          } catch (error) {
            console.error('Erro ao enviar WhatsApp via Evolution:', error);
            toast({ title: "Erro", description: "Erro ao iniciar campanha. Tente novamente.", variant: "destructive" });
            setCampaignProgress(prev => ({ ...prev, isComplete: true }));
          }
          return;
        }

        // Se há outras ações além de WhatsApp, envia para o webhook padrão
        const otherActions = selectedActions.filter(a => a !== 'whatsapp');
        if (otherActions.length > 0) {
          const defaultWebhook = "https://n8neditor.faesde.com.br/webhook/send-rabbit";
          const otherPayload = { ...payload, actions: otherActions };
          const response = await fetch(defaultWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(otherPayload),
          });

          if (!response.ok) {
            console.error("Erro ao enviar para webhook:", response.statusText);
          } else {
            console.log("Outras ações enviadas com sucesso!");
          }
        }
      } catch (error) {
        console.error("Erro ao enviar para webhook:", error);
      }
    }

    // Only show old processing modal if not Evolution
    if (whatsappProvider !== 'evolution') {
      setIsProcessing(true);
    }
  };


  // Processing Modal
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center max-w-lg mx-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Send className="w-10 h-10 text-primary" />
            </motion.div>
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            SUA SOLICITAÇÃO ESTÁ SENDO PROCESSADA
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            ENVIAREMOS O RELATÓRIO POR EMAIL
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIsProcessing(false);
              setContacts([]);
              setSelectedActions([]);
              setUploadedFileName(null);
              setFileError(null);
              setIsParsingFile(false);
              // Limpar estado do áudio
              setAudioFile(null);
              setAudioFileName(null);
              setAudioError(null);
              setUploadedAudioPath(null);
            }}
          >
            Fazer Nova Solicitação
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-display font-bold">
                <span className="text-primary">Wiki</span>
                <span className="text-foreground"> Marketing</span>
              </span>
            </a>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Gerenciador de Contatos</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {/* Atalho visível para Resultados (evita depender do dropdown) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/results")}
              aria-label="Ver resultados"
              className="sm:hidden"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/results")}
              className="hidden sm:inline-flex"
            >
              <MessageSquare className="w-4 h-4" />
              Resultados
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {profile?.full_name || user?.email}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {role === 'admin' ? 'Administrador' : 'Usuário'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/results')} className="cursor-pointer">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Resultados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Upload Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Upload de Contatos
            </h1>
            <p className="text-muted-foreground mb-6">
              Faça upload da sua lista de contatos em formato CSV ou Excel
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragging 
                  ? "border-primary bg-primary/10" 
                  : "border-border/50 hover:border-primary/50 hover:bg-card/50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium mb-1">
                    Arraste e solte seu arquivo aqui
                  </p>
                  <p className="text-muted-foreground text-sm">
                    ou clique para selecionar (CSV, Excel)
                  </p>
                </div>
                {uploadedFileName && (
                  <div className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="text-sm font-medium">{uploadedFileName}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                {isParsingFile && (
                  <p className="text-sm text-muted-foreground">
                    Importando contatos do arquivo...
                  </p>
                )}

                {fileError && (
                  <p className="text-sm text-destructive">{fileError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <AnimatePresence>
            {contacts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Selecione as Ações
                </h2>
                <div className="flex flex-wrap gap-3">
                  {availableActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => toggleAction(action.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200
                        ${selectedActions.includes(action.id)
                          ? action.color
                          : "border-border/50 text-muted-foreground hover:border-primary/50"
                        }
                      `}
                    >
                      {action.icon}
                      <span className="text-sm font-medium">{action.label}</span>
                      {selectedActions.includes(action.id) && (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Template Selection for WhatsApp (Cloud API) */}
                <AnimatePresence>
                  {selectedActions.includes('whatsapp') && whatsappProvider === 'cloudapi' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-5 h-5 text-green-400" />
                          <h3 className="text-sm font-semibold text-green-300">
                            Template de Mensagem
                          </h3>
                        </div>

                        {whatsappTemplates.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            <p>Nenhum template aprovado disponível.</p>
                            <Button 
                              variant="link" 
                              className="text-green-400 p-0 h-auto"
                              onClick={() => navigate('/settings')}
                            >
                              Criar templates nas Configurações
                            </Button>
                          </div>
                        ) : (
                          <Select 
                            value={selectedTemplateId || ''} 
                            onValueChange={setSelectedTemplateId}
                          >
                            <SelectTrigger className="bg-green-500/10 border-green-500/30 text-green-300">
                              <SelectValue placeholder="Selecione um template" />
                            </SelectTrigger>
                            <SelectContent>
                              {whatsappTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {selectedTemplateId && (
                          <div className="mt-3 space-y-3">
                            <div className="p-3 bg-card/50 rounded-lg border border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Prévia:</p>
                              <p className="text-sm text-foreground">
                                {whatsappTemplates.find(t => t.id === selectedTemplateId)?.body_text}
                              </p>
                            </div>

                            {/* Variable Mapping */}
                            {variableMappings.length > 0 && (
                              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                                <p className="text-xs text-yellow-400 font-medium mb-3">
                                  ⚠️ Este template possui variáveis. Mapeie cada uma:
                                </p>
                                <div className="space-y-2">
                                  {variableMappings.map((mapping, index) => (
                                    <div key={mapping.variable} className="flex items-center gap-2">
                                      <span className="text-sm font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-300 min-w-[50px] text-center">
                                        {mapping.variable}
                                      </span>
                                      <span className="text-muted-foreground text-sm">=</span>
                                      <Select
                                        value={mapping.source}
                                        onValueChange={(value: VariableSource) => {
                                          const newMappings = [...variableMappings];
                                          newMappings[index] = { ...mapping, source: value };
                                          setVariableMappings(newMappings);
                                        }}
                                      >
                                        <SelectTrigger className="w-[140px] bg-card/50 border-yellow-500/30">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="name">Nome</SelectItem>
                                          <SelectItem value="phone">Telefone</SelectItem>
                                          <SelectItem value="email">E-mail</SelectItem>
                                          <SelectItem value="custom">Texto fixo</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {mapping.source === 'custom' && (
                                        <Input
                                          placeholder="Valor fixo"
                                          className="flex-1 bg-card/50 border-yellow-500/30"
                                          value={mapping.customValue || ''}
                                          onChange={(e) => {
                                            const newMappings = [...variableMappings];
                                            newMappings[index] = { ...mapping, customValue: e.target.value };
                                            setVariableMappings(newMappings);
                                          }}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Evolution API WhatsApp Options */}
                <AnimatePresence>
                  {selectedActions.includes('whatsapp') && whatsappProvider === 'evolution' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-5 h-5 text-green-400" />
                          <h3 className="text-sm font-semibold text-green-300">
                            Mensagem via Evolution API
                          </h3>
                        </div>

                        {evolutionInstances.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            <p>Nenhuma instância conectada disponível.</p>
                            <Button 
                              variant="link" 
                              className="text-green-400 p-0 h-auto"
                              onClick={() => navigate('/settings')}
                            >
                              Conectar WhatsApp nas Configurações
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Instance Selection */}
                            <div>
                              <Label className="text-xs text-green-300 mb-2 block">Enviar de:</Label>
                              <Select 
                                value={selectedEvolutionInstanceId || ''} 
                                onValueChange={setSelectedEvolutionInstanceId}
                              >
                                <SelectTrigger className="bg-green-500/10 border-green-500/30 text-green-300">
                                  <SelectValue placeholder="Selecione uma instância" />
                                </SelectTrigger>
                                <SelectContent>
                                  {evolutionInstances.map((instance) => (
                                    <SelectItem key={instance.id} value={instance.id}>
                                      {instance.display_name || instance.instance_name}
                                      {instance.phone_number && ` (${instance.phone_number})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Message Mode Toggle */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEvolutionMessageMode('template')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                                  evolutionMessageMode === 'template'
                                    ? 'bg-green-500/30 border-green-500/60 text-green-200'
                                    : 'bg-card/30 border-border/50 text-muted-foreground hover:border-green-500/40'
                                }`}
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span className="text-sm">Usar Template</span>
                              </button>
                              <button
                                onClick={() => setEvolutionMessageMode('custom')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                                  evolutionMessageMode === 'custom'
                                    ? 'bg-green-500/30 border-green-500/60 text-green-200'
                                    : 'bg-card/30 border-border/50 text-muted-foreground hover:border-green-500/40'
                                }`}
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm">Mensagem Livre</span>
                              </button>
                            </div>

                            {/* Template Selection */}
                            {evolutionMessageMode === 'template' && (
                              <div>
                                {evolutionTemplates.length === 0 ? (
                                  <div className="text-sm text-muted-foreground p-3 bg-card/30 rounded-lg">
                                    <p>Nenhum template local criado.</p>
                                    <Button 
                                      variant="link" 
                                      className="text-green-400 p-0 h-auto"
                                      onClick={() => navigate('/settings')}
                                    >
                                      Criar templates nas Configurações
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Select 
                                      value={selectedEvolutionTemplateId || ''} 
                                      onValueChange={setSelectedEvolutionTemplateId}
                                    >
                                      <SelectTrigger className="bg-green-500/10 border-green-500/30 text-green-300">
                                        <SelectValue placeholder="Selecione um template" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {evolutionTemplates.map((template) => (
                                          <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    
                                    {selectedEvolutionTemplateId && (
                                      <div className="mt-3 p-3 bg-card/50 rounded-lg border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Prévia:</p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                          {evolutionTemplates.find(t => t.id === selectedEvolutionTemplateId)?.content}
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {/* Custom Message */}
                            {evolutionMessageMode === 'custom' && (
                              <div>
                                <Label className="text-xs text-green-300 mb-2 block">
                                  Mensagem (use {'{{1}}'} para Nome, {'{{2}}'} para Telefone):
                                </Label>
                                <textarea
                                  value={evolutionCustomMessage}
                                  onChange={(e) => setEvolutionCustomMessage(e.target.value)}
                                  placeholder="Olá {{1}}, tudo bem? Estamos entrando em contato..."
                                  className="w-full min-h-[100px] p-3 rounded-lg bg-card/50 border border-green-500/30 text-foreground placeholder:text-muted-foreground resize-y"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Use {'{{1}}'}, {'{{2}}'}, etc. para variáveis dinâmicas.
                                </p>
                              </div>
                            )}

                            {/* Evolution Variable Mappings */}
                            {evolutionVariableMappings.length > 0 && (
                              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                                <p className="text-xs text-yellow-400 font-medium mb-3">
                                  ⚠️ Esta mensagem possui variáveis. Mapeie cada uma:
                                </p>
                                <div className="space-y-2">
                                  {evolutionVariableMappings.map((mapping, index) => (
                                    <div key={mapping.variable} className="flex items-center gap-2">
                                      <span className="text-sm font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-300 min-w-[50px] text-center">
                                        {mapping.variable}
                                      </span>
                                      <span className="text-muted-foreground text-sm">=</span>
                                      <Select
                                        value={mapping.source}
                                        onValueChange={(value: VariableSource) => {
                                          const newMappings = [...evolutionVariableMappings];
                                          newMappings[index] = { ...mapping, source: value };
                                          setEvolutionVariableMappings(newMappings);
                                        }}
                                      >
                                        <SelectTrigger className="w-[140px] bg-card/50 border-yellow-500/30">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="name">Nome</SelectItem>
                                          <SelectItem value="phone">Telefone</SelectItem>
                                          <SelectItem value="email">E-mail</SelectItem>
                                          <SelectItem value="custom">Texto fixo</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {mapping.source === 'custom' && (
                                        <Input
                                          placeholder="Valor fixo"
                                          className="flex-1 bg-card/50 border-yellow-500/30"
                                          value={mapping.customValue || ''}
                                          onChange={(e) => {
                                            const newMappings = [...evolutionVariableMappings];
                                            newMappings[index] = { ...mapping, customValue: e.target.value };
                                            setEvolutionVariableMappings(newMappings);
                                          }}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Send Interval Configuration */}
                <AnimatePresence>
                  {selectedActions.includes('whatsapp') && whatsappProvider === 'evolution' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Timer className="w-5 h-5 text-accent-foreground" />
                          <h3 className="text-sm font-semibold text-accent-foreground">
                            Intervalo entre Envios (Anti-Ban)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1 block">Mínimo</Label>
                            <Input
                              type="number"
                              min={1}
                              max={sendIntervalUnit === 'minutes' ? 60 : 300}
                              value={sendIntervalMin}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setSendIntervalMin(val);
                                if (val > sendIntervalMax) setSendIntervalMax(val);
                              }}
                              className="bg-card/50 border-accent/30"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1 block">Máximo</Label>
                            <Input
                              type="number"
                              min={sendIntervalMin}
                              max={sendIntervalUnit === 'minutes' ? 60 : 300}
                              value={sendIntervalMax}
                              onChange={(e) => setSendIntervalMax(Math.max(sendIntervalMin, parseInt(e.target.value) || sendIntervalMin))}
                              className="bg-card/50 border-accent/30"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1 block">Unidade</Label>
                            <Select
                              value={sendIntervalUnit}
                              onValueChange={(v: 'seconds' | 'minutes') => setSendIntervalUnit(v)}
                            >
                              <SelectTrigger className="bg-card/50 border-accent/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="seconds">Segundos</SelectItem>
                                <SelectItem value="minutes">Minutos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          🛡️ Delay aleatório entre {sendIntervalMin} e {sendIntervalMax} {sendIntervalUnit === 'minutes' ? 'minuto(s)' : 'segundo(s)'} para evitar detecção
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ⚡ Verificação automática de conexão a cada 10 mensagens — pausa e retoma automaticamente
                        </p>

                        {/* Night Pause Config */}
                        <div className="mt-4 pt-3 border-t border-accent/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🌙</span>
                              <Label className="text-xs font-medium text-accent-foreground">Pausa Noturna</Label>
                            </div>
                            <Checkbox
                              checked={nightPauseEnabled}
                              onCheckedChange={(checked) => setNightPauseEnabled(!!checked)}
                            />
                          </div>
                          {nightPauseEnabled && (
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Pausa às</Label>
                                <Select
                                  value={String(nightPauseStart)}
                                  onValueChange={(v) => setNightPauseStart(parseInt(v))}
                                >
                                  <SelectTrigger className="bg-card/50 border-accent/30 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => (
                                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Retoma às</Label>
                                <Select
                                  value={String(nightPauseEnd)}
                                  onValueChange={(v) => setNightPauseEnd(parseInt(v))}
                                >
                                  <SelectTrigger className="bg-card/50 border-accent/30 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => (
                                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {nightPauseEnabled
                              ? `Envios pausam das ${String(nightPauseStart).padStart(2, '0')}h às ${String(nightPauseEnd).padStart(2, '0')}h para simular comportamento humano`
                              : 'Desativada — envios rodarão 24h sem parar'}
                          </p>
                        </div>

                        {/* Progressive Warmup Config */}
                        <div className="mt-3 pt-3 border-t border-accent/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🔥</span>
                              <Label className="text-xs font-medium text-accent-foreground">Aquecimento Progressivo</Label>
                            </div>
                            <Checkbox
                              checked={warmupEnabled}
                              onCheckedChange={(checked) => setWarmupEnabled(!!checked)}
                            />
                          </div>
                          {warmupEnabled && (
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Primeiras msgs</Label>
                                <Input
                                  type="number"
                                  min={10}
                                  max={1000}
                                  value={warmupMessages}
                                  onChange={(e) => setWarmupMessages(Math.max(10, parseInt(e.target.value) || 200))}
                                  className="bg-card/50 border-accent/30 h-8 text-xs"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Delay máx. (seg)</Label>
                                <Input
                                  type="number"
                                  min={30}
                                  max={300}
                                  value={warmupMaxDelay}
                                  onChange={(e) => setWarmupMaxDelay(Math.max(30, parseInt(e.target.value) || 120))}
                                  className="bg-card/50 border-accent/30 h-8 text-xs"
                                />
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {warmupEnabled
                              ? `Nas primeiras ${warmupMessages} mensagens, delay máximo será ${warmupMaxDelay}s para aquecer o chip`
                              : 'Desativado — delay normal desde a primeira mensagem'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedActions.includes('whatsapp') && !whatsappProvider && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="w-5 h-5 text-yellow-400" />
                          <h3 className="text-sm font-semibold text-yellow-300">
                            Configuração Necessária
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Você precisa configurar um provedor de WhatsApp antes de enviar mensagens.
                        </p>
                        <Button 
                          variant="outline" 
                          className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                          onClick={() => navigate('/settings')}
                        >
                          Ir para Configurações
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedActions.includes('call') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Phone className="w-5 h-5 text-purple-400" />
                          <h3 className="text-sm font-semibold text-purple-300">
                            Configuração da Ligação
                          </h3>
                        </div>

                        {/* Mode Selection */}
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setCallMode('audio')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                              callMode === 'audio'
                                ? 'bg-purple-500/30 border-purple-500/60 text-purple-200'
                                : 'bg-card/30 border-border/50 text-muted-foreground hover:border-purple-500/40'
                            }`}
                          >
                            <Music className="w-4 h-4" />
                            <span className="text-sm">Com Áudio</span>
                          </button>
                          <button
                            onClick={() => setCallMode('tts')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                              callMode === 'tts'
                                ? 'bg-purple-500/30 border-purple-500/60 text-purple-200'
                                : 'bg-card/30 border-border/50 text-muted-foreground hover:border-purple-500/40'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">Só Menu IVR (TTS)</span>
                          </button>
                        </div>

                        {/* Audio Upload Section - Only for 'audio' mode */}
                        {callMode === 'audio' && (
                          <div className="mb-4 p-3 bg-card/30 rounded-lg border border-border/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Mic className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-medium text-purple-300">Áudio (máx. 1 minuto)</span>
                            </div>

                            <input
                              ref={audioInputRef}
                              type="file"
                              accept="audio/*"
                              onChange={handleAudioUpload}
                              className="hidden"
                            />

                            {!audioFileName ? (
                              <button
                                onClick={() => audioInputRef.current?.click()}
                                disabled={isUploadingAudio}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg transition-all duration-200 text-purple-300"
                              >
                                <Music className="w-4 h-4" />
                                <span className="text-sm">Enviar Áudio</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg">
                                  <Music className="w-4 h-4" />
                                  <span className="text-sm font-medium truncate max-w-[200px]">
                                    {audioFileName}
                                  </span>
                                  {isUploadingAudio ? (
                                    <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                                  ) : uploadedAudioPath ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                  ) : null}
                                </div>
                                
                                {/* Play/Pause Button */}
                                {uploadedAudioPath && !isUploadingAudio && (
                                  <button
                                    onClick={toggleAudioPreview}
                                    className={`p-2 rounded-lg transition-colors ${
                                      isPlayingAudio 
                                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                                        : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300'
                                    }`}
                                    title={isPlayingAudio ? 'Pausar áudio' : 'Ouvir áudio'}
                                  >
                                    {isPlayingAudio ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </button>
                                )}

                                <button
                                  onClick={removeAudio}
                                  className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              💡 O áudio deve conter as opções faladas. O menu IVR abaixo serve para mapear as respostas.
                            </p>
                          </div>
                        )}

                        {/* TTS Mode - Intro Message */}
                        {callMode === 'tts' && (
                          <div className="mb-4 p-3 bg-card/30 rounded-lg border border-border/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium text-primary">Mensagem de Introdução</span>
                              </div>
                              {/* Quick insert buttons */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground mr-1">Inserir:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVar = extractTemplateVariables(ivrIntroMessage).length + 1;
                                    setIvrIntroMessage(prev => prev + `{{${nextVar}}}`);
                                  }}
                                  className="px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                                  title="Adicionar variável"
                                >
                                  + Variável
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={ivrIntroMessage}
                              onChange={(e) => setIvrIntroMessage(e.target.value)}
                              placeholder="Ex: Olá {{1}}, tudo bem? Estamos fazendo uma pesquisa eleitoral..."
                              className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 Use {"{{1}}"}, {"{{2}}"}, etc. para inserir dados do contato. Ex: "Olá {"{{1}}"}" será substituído pelo nome.
                            </p>

                            {/* IVR Variable Mapping */}
                            {ivrVariableMappings.length > 0 && (
                              <div className="mt-3 p-3 bg-accent/30 rounded-lg border border-accent/50">
                                <p className="text-xs text-accent-foreground font-medium mb-3 flex items-center gap-2">
                                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                                  Mapeie cada variável:
                                </p>
                                <div className="space-y-2">
                                  {ivrVariableMappings.map((mapping, index) => (
                                    <div key={mapping.variable} className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-mono bg-primary/20 px-2 py-1 rounded text-primary min-w-[50px] text-center">
                                        {mapping.variable}
                                      </span>
                                      <span className="text-muted-foreground text-sm">=</span>
                                      <Select
                                        value={mapping.source}
                                        onValueChange={(value: VariableSource) => {
                                          const newMappings = [...ivrVariableMappings];
                                          newMappings[index] = { ...mapping, source: value };
                                          setIvrVariableMappings(newMappings);
                                        }}
                                      >
                                        <SelectTrigger className="w-[140px] bg-card/50 border-primary/30">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="name">Nome</SelectItem>
                                          <SelectItem value="phone">Telefone</SelectItem>
                                          <SelectItem value="email">E-mail</SelectItem>
                                          <SelectItem value="custom">Texto fixo</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {mapping.source === 'custom' && (
                                        <Input
                                          placeholder="Valor fixo"
                                          className="flex-1 min-w-[120px] bg-card/50 border-primary/30"
                                          value={mapping.customValue || ''}
                                          onChange={(e) => {
                                            const newMappings = [...ivrVariableMappings];
                                            newMappings[index] = { ...mapping, customValue: e.target.value };
                                            setIvrVariableMappings(newMappings);
                                          }}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {audioError && (
                          <p className="text-sm text-destructive mb-3">{audioError}</p>
                        )}

                        {/* IVR Configuration - Always visible */}
                        <div className="mt-2">
                          <IVRConfigEditor
                            menuStructure={ivrMenuStructure}
                            onChange={setIvrMenuStructure}
                            disabled={isUploadingAudio}
                          />
                          {callMode === 'audio' && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Configure as opções para mapear as respostas DTMF nos resultados.
                            </p>
                          )}
                        </div>

                        {/* TTS Preview Section */}
                        {callMode === 'tts' && (ivrIntroMessage.trim() || ivrMenuStructure.some(m => m.key && m.label)) && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">Prévia do áudio TTS:</p>
                              <button
                                onClick={toggleTTSPreview}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                  isPlayingTTSPreview 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'bg-primary/10 hover:bg-primary/20 text-primary'
                                }`}
                              >
                                {isPlayingTTSPreview ? (
                                  <>
                                    <Pause className="w-4 h-4" />
                                    Parar
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    Ouvir Prévia
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-muted-foreground italic">
                              "{getTTSPreviewText() || 'Configure a introdução e as opções acima'}"
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contacts Table */}
          <AnimatePresence>
            {contacts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden"
              >
                {/* Table Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-5 h-5" />
                      <span>{contacts.length} contatos</span>
                    </div>
                    {selectedContactsCount > 0 && (
                      <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                        {selectedContactsCount} selecionados
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContacts([]);
                        setUploadedFileName(null);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                    <Button
                      variant="hero"
                      size="sm"
                      disabled={selectedContactsCount === 0 || selectedActions.length === 0}
                      onClick={handleExecuteClick}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Executar Ações
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={contacts.every((c) => c.selected)}
                          onCheckedChange={toggleAllContacts}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact, index) => (
                      <motion.tr
                        key={contact.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          border-b border-border/30 transition-colors
                          ${contact.selected ? "bg-primary/5" : "hover:bg-card/80"}
                        `}
                      >
                        <TableCell>
                          <Checkbox
                            checked={contact.selected}
                            onCheckedChange={() => toggleContact(contact.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {contact.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.phone}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.email}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contato carregado ainda.</p>
              <p className="text-sm">Faça upload de um arquivo para começar.</p>
            </div>
          )}
        </motion.div>

        {/* Campaign Name Modal */}
        <CampaignNameModal
          isOpen={showCampaignModal}
          onClose={() => setShowCampaignModal(false)}
          onConfirm={handleExecuteActions}
          contactsCount={contacts.filter(c => c.selected).length}
        />

        {/* Campaign Progress Modal */}
        <CampaignProgressModal
          isOpen={showProgressModal}
          totalContacts={campaignProgress.totalContacts}
          sentCount={campaignProgress.sentCount}
          failedCount={campaignProgress.failedCount}
          currentContact={campaignProgress.currentContact}
          isComplete={campaignProgress.isComplete}
          isPaused={isPaused}
          pauseReason={pauseReason}
          campaignName={campaignProgress.campaignName}
          onContinueInBackground={() => {
            setIsRunningInBackground(true);
            setShowProgressModal(false);
            toast({
              title: "Enviando em background",
              description: "O envio continua mesmo que você navegue para outra página.",
            });
          }}
          onNewCampaign={() => {
            setShowProgressModal(false);
            setContacts([]);
            setSelectedActions([]);
            setUploadedFileName(null);
            setCampaignProgress({
              totalContacts: 0,
              sentCount: 0,
              failedCount: 0,
              currentContact: '',
              isComplete: false,
              campaignName: '',
            });
          }}
          onShowResults={() => {
            setShowProgressModal(false);
            navigate('/results');
          }}
          onCancel={async () => {
            const jobId = (window as any).__currentCampaignJobId;
            if (jobId) {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                await supabase.functions.invoke('evolution-send-campaign', {
                  headers: { Authorization: `Bearer ${session?.access_token}` },
                  body: { action: 'cancel', job_id: jobId },
                });
                const pollInterval = (window as any).__currentCampaignPollInterval;
                if (pollInterval) clearInterval(pollInterval);
              } catch (err) {
                console.error('Cancel error:', err);
              }
            }
            cancelCampaignRef.current = true;
          }}
        />
      </main>
    </div>
  );
};

export default Contacts;
