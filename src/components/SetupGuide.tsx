import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  Cloud,
  Smartphone,
  Key,
  Link as LinkIcon,
  Settings,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SetupGuideProps {
  provider: 'evolution' | 'cloudapi';
  webhookUrl?: string;
}

export const SetupGuide = ({ provider, webhookUrl }: SetupGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const defaultWebhookUrl = webhookUrl || `https://svxcmirrhbgfkpetfafk.supabase.co/functions/v1/whatsapp-webhook`;

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader 
        className="cursor-pointer select-none" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                📚 Guia de Configuração
              </CardTitle>
              <CardDescription>
                {provider === 'cloudapi' 
                  ? 'Como configurar o Twilio/Meta Cloud API' 
                  : 'Como conectar via Evolution API'}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-6 pt-0">
              {provider === 'cloudapi' ? (
                <CloudAPIGuide 
                  webhookUrl={defaultWebhookUrl} 
                  onCopy={handleCopy} 
                  copiedField={copiedField} 
                />
              ) : (
                <EvolutionGuide />
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

interface GuideProps {
  webhookUrl: string;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}

const CloudAPIGuide = ({ webhookUrl, onCopy, copiedField }: GuideProps) => {
  const steps = [
    {
      number: 1,
      title: "Acesse o Meta for Developers",
      icon: <ExternalLink className="w-4 h-4" />,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Entre no painel do Meta e navegue até <strong>Meus apps &gt; Seu App &gt; Configuração da API</strong>.
          </p>
          <a 
            href="https://developers.facebook.com/apps" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            Abrir Meta for Developers
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )
    },
    {
      number: 2,
      title: "Gere o Token de Acesso",
      icon: <Key className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Na seção <strong>"Token de acesso"</strong>, clique em <strong>"Gerar token de acesso"</strong>.
          </p>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ <strong>Importante:</strong> O token temporário expira em 24h. Para produção, 
              você precisará gerar um token permanente nas configurações do app.
            </p>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: "Obtenha suas Credenciais",
      icon: <Smartphone className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Na seção <strong>"Enviar e receber mensagens"</strong>, selecione seu número e encontre:
          </p>
          
          <div className="p-3 bg-background rounded-lg border space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">1</Badge>
              <div>
                <span className="text-sm"><strong>Identificação do número de telefone</strong></span>
                <p className="text-xs text-muted-foreground">Ex: 925622177310208 → Use como "Phone Number ID"</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">2</Badge>
              <div>
                <span className="text-sm"><strong>Identificação da conta do WhatsApp Business</strong></span>
                <p className="text-xs text-muted-foreground">Ex: 158233462953816 → Use como "Business Account ID"</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">3</Badge>
              <div>
                <span className="text-sm"><strong>Token de acesso</strong></span>
                <p className="text-xs text-muted-foreground">O token que você gerou → Use como "Access Token"</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 4,
      title: "Configure o Webhook",
      icon: <LinkIcon className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clique em <strong>"Configurar webhooks"</strong> e adicione a URL abaixo:
          </p>
          
          <div className="p-3 bg-background rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                URL de callback:
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={() => onCopy(webhookUrl, 'webhook')}
              >
                {copiedField === 'webhook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {webhookUrl}
            </code>
          </div>

          <div className="p-3 bg-background rounded-lg border space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Campos para assinar:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="secondary" className="text-xs">messages</Badge>
              <Badge variant="secondary" className="text-xs">message_status</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 5,
      title: "Preencha e Salve",
      icon: <Settings className="w-4 h-4" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Preencha os campos acima com as credenciais obtidas, clique em <strong>"Salvar Configuração"</strong> 
          e depois em <strong>"Testar Conexão"</strong> para verificar! 🎉
        </p>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold">Configurando Meta Cloud API</h3>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-full bg-primary/20 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-2">
                {step.icon}
                <h4 className="font-medium">{step.title}</h4>
              </div>
              {step.content}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          💡 <strong>Dica:</strong> Certifique-se de que seu app está em modo "Ao vivo" no Meta 
          para enviar mensagens para números não-verificados.
        </p>
      </div>
    </div>
  );
};

const EvolutionGuide = () => {
  const steps = [
    {
      number: 1,
      title: "Crie uma Nova Instância",
      icon: <Smartphone className="w-4 h-4" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Clique em <strong>"Nova Instância"</strong> acima e escolha um nome para identificar 
          essa conexão (ex: "WhatsApp Principal").
        </p>
      )
    },
    {
      number: 2,
      title: "Escaneie o QR Code",
      icon: <QrCode className="w-4 h-4" />,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Após criar a instância, clique no ícone de <strong>QR Code</strong> ao lado dela.
          </p>
          <p className="text-sm text-muted-foreground">
            Abra o WhatsApp no seu celular → <strong>Configurações</strong> → 
            <strong>Aparelhos conectados</strong> → <strong>Conectar um aparelho</strong> 
            e escaneie o código.
          </p>
        </div>
      )
    },
    {
      number: 3,
      title: "Verifique a Conexão",
      icon: <Check className="w-4 h-4" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Após escanear, o status mudará para <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            Conectado
          </Badge>. Seu WhatsApp está pronto para enviar mensagens!
        </p>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="w-5 h-5 text-green-400" />
        <h3 className="font-semibold">Configurando Evolution API</h3>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-full bg-primary/20 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-2">
                {step.icon}
                <h4 className="font-medium">{step.title}</h4>
              </div>
              {step.content}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <p className="text-sm text-green-600 dark:text-green-400">
          ✅ <strong>Vantagem:</strong> Com Evolution API, você pode enviar mensagens livres 
          sem precisar de aprovação de templates. Ideal para testes e comunicação flexível!
        </p>
      </div>
    </div>
  );
};
