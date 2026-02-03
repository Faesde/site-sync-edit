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
  const twilioWebhookUrl = `https://svxcmirrhbgfkpetfafk.supabase.co/functions/v1/twilio-webhook`;

  const steps = [
    {
      number: 1,
      title: "Acesse o Console do Twilio",
      icon: <ExternalLink className="w-4 h-4" />,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Entre no seu painel do Twilio e navegue até <strong>Messaging &gt; WhatsApp Senders</strong>.
          </p>
          <a 
            href="https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            Abrir Console Twilio
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )
    },
    {
      number: 2,
      title: "Configure os Webhooks",
      icon: <LinkIcon className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Na seção <strong>"Messaging Endpoint Configuration"</strong>, configure:
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-background rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Webhook URL for incoming messages:
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Status callback URL (para ligações):
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={() => onCopy(twilioWebhookUrl, 'twilio')}
                >
                  {copiedField === 'twilio' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                {twilioWebhookUrl}
              </code>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Certifique-se de selecionar <strong>HTTP Post</strong> como método.
          </p>
        </div>
      )
    },
    {
      number: 3,
      title: "Obtenha suas Credenciais",
      icon: <Key className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No Twilio Console, encontre as credenciais em dois lugares:
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-xs font-semibold text-primary mb-2">📱 Em "WhatsApp Senders":</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">1</Badge>
                  <span><strong>WhatsApp Business Account ID</strong> → Use como "Business Account ID"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">2</Badge>
                  <span><strong>Número WhatsApp</strong> (ex: +554723980057) → Use como "Phone Number ID"</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-background rounded-lg border">
              <p className="text-xs font-semibold text-primary mb-2">🔑 Em "Account &gt; API keys & tokens":</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">3</Badge>
                  <span><strong>Auth Token</strong> → Use como "Access Token"</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 4,
      title: "Preencha os Campos Acima",
      icon: <Settings className="w-4 h-4" />,
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Com as credenciais em mãos, preencha os campos acima:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• <strong>Phone Number ID:</strong> O SID do número WhatsApp</li>
            <li>• <strong>Business Account ID:</strong> Seu Account SID</li>
            <li>• <strong>Access Token:</strong> Seu Auth Token do Twilio</li>
          </ul>
        </div>
      )
    },
    {
      number: 5,
      title: "Salve e Teste",
      icon: <MessageCircle className="w-4 h-4" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Clique em <strong>"Salvar Configuração"</strong> e depois em <strong>"Testar Conexão"</strong> 
          para verificar se tudo está funcionando. Se a conexão for bem-sucedida, você verá o número 
          conectado! 🎉
        </p>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold">Configurando Twilio/Meta Cloud API</h3>
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

      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          💡 <strong>Dica:</strong> Se você está usando o Meta Cloud API diretamente (sem Twilio), 
          as credenciais são encontradas no{" "}
          <a 
            href="https://developers.facebook.com/apps" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline"
          >
            Meta for Developers
          </a>.
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
