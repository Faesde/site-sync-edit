import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Clock,
  MessageCircle,
  ArrowRight,
  Pause
} from "lucide-react";

interface CampaignProgressModalProps {
  isOpen: boolean;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  currentContact?: string;
  isComplete: boolean;
  isPaused?: boolean;
  pauseReason?: string | null;
  onContinueInBackground: () => void;
  onNewCampaign: () => void;
  onShowResults?: () => void;
  onCancel?: () => void;
  campaignName: string;
}

export const CampaignProgressModal = ({
  isOpen,
  totalContacts,
  sentCount,
  failedCount,
  currentContact,
  isComplete,
  isPaused = false,
  pauseReason,
  onContinueInBackground,
  onNewCampaign,
  onShowResults,
  onCancel,
  campaignName,
}: CampaignProgressModalProps) => {
  const [showComplete, setShowComplete] = useState(false);
  
  const processedCount = sentCount + failedCount;
  const progressPercent = totalContacts > 0 ? Math.round((processedCount / totalContacts) * 100) : 0;

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setShowComplete(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isComplete 
              ? failedCount === 0 
                ? 'bg-green-500/20' 
                : 'bg-yellow-500/20'
              : 'bg-primary/20'
          }`}>
            {isComplete ? (
              failedCount === 0 ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-yellow-500" />
              )
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Send className="w-8 h-8 text-primary" />
              </motion.div>
            )}
          </div>
          
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            {isComplete ? 'Campanha Finalizada!' : 'Enviando Campanha'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {campaignName}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-mono font-bold text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalContacts}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{sentCount}</div>
            <div className="text-xs text-green-400">Enviadas</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{failedCount}</div>
            <div className="text-xs text-red-400">Falhas</div>
          </div>
        </div>

        {/* Current Contact / Pause Alert */}
        {!isComplete && isPaused && pauseReason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6"
          >
            <Pause className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-500">Campanha Pausada</p>
              <p className="text-xs text-muted-foreground">{pauseReason}</p>
            </div>
          </motion.div>
        )}
        {!isComplete && !isPaused && currentContact && (
          <motion.div
            key={currentContact}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 mb-6"
          >
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Enviando para:</p>
              <p className="text-sm font-medium text-foreground truncate">{currentContact}</p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isComplete ? (
            <>
              <Button variant="hero" onClick={onNewCampaign} className="w-full">
                <ArrowRight className="w-4 h-4 mr-2" />
                Fazer Nova Campanha
              </Button>
              {onShowResults && (
                <Button variant="outline" onClick={onShowResults} className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mostrar Resultados
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={onContinueInBackground}
                className="w-full"
              >
                <Clock className="w-4 h-4 mr-2" />
                Continuar em Background
              </Button>
              {onCancel && (
                <Button 
                  variant="destructive" 
                  onClick={onCancel}
                  className="w-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Campanha
                </Button>
              )}
              <p className="text-xs text-center text-muted-foreground">
                O envio continuará mesmo se você sair desta tela
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignProgressModal;
