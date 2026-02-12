import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface PollResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  pollOptions: string[];
  responses: Array<{
    message_content: string | null;
    status: string;
  }>;
}

export const PollResultsModal: React.FC<PollResultsModalProps> = ({
  open,
  onOpenChange,
  campaignName,
  pollOptions,
  responses,
}) => {
  const chartData = useMemo(() => {
    // Only consider "received" responses
    const receivedResponses = responses.filter(r => r.status === "received" && r.message_content);
    
    // Count responses matching each option number
    const counts: Record<string, number> = {};
    pollOptions.forEach((_, i) => {
      counts[String(i + 1)] = 0;
    });
    let otherCount = 0;

    receivedResponses.forEach(r => {
      const content = r.message_content?.trim() || "";
      // Match if response is just the number
      if (counts[content] !== undefined) {
        counts[content]++;
      } else {
        otherCount++;
      }
    });

    const data = pollOptions.map((label, i) => ({
      option: `${i + 1}. ${label}`,
      shortLabel: `${i + 1}`,
      count: counts[String(i + 1)],
      label,
    }));

    if (otherCount > 0) {
      data.push({
        option: "Outras",
        shortLabel: "?",
        count: otherCount,
        label: "Respostas não reconhecidas",
      });
    }

    return { data, totalResponses: receivedResponses.length };
  }, [pollOptions, responses]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    config.count = { label: "Respostas", color: "hsl(var(--primary))" };
    return config;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gráfico de Respostas</DialogTitle>
          <DialogDescription>
            {campaignName} • {chartData.totalResponses} resposta{chartData.totalResponses !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {chartData.totalResponses === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-medium">Nenhuma resposta recebida ainda</p>
              <p className="text-sm">As respostas aparecerão aqui conforme os contatos responderem.</p>
            </div>
          ) : (
            <>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData.data} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="option"
                    width={140}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    name="Respostas"
                  />
                </BarChart>
              </ChartContainer>

              {/* Percentage breakdown */}
              <div className="space-y-2">
                {chartData.data.map((item, i) => {
                  const pct = chartData.totalResponses > 0
                    ? Math.round((item.count / chartData.totalResponses) * 100)
                    : 0;
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
