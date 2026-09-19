/**
 * Cartão "Meta de faturamento" do mês: mostra quanto já foi faturado, a meta
 * definida em Configurações e uma barra de progresso.
 */
import { Link } from "@tanstack/react-router";
import { Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useConfiguracoes } from "@/lib/dados";
import { formatarMoeda, hojeISO } from "@/lib/formato";

export function MetaFaturamento({ faturamento }: { faturamento: number }) {
  const { data: config } = useConfiguracoes();
  const meta = config?.meta_mensal ?? 0;

  // Nome do mês atual em português (ex.: "setembro")
  const mes = new Date(`${hojeISO()}T12:00:00`).toLocaleDateString("pt-BR", { month: "long" });

  const percentual = meta > 0 ? (faturamento / meta) * 100 : 0;
  const barra = Math.min(100, Math.max(0, percentual));
  const percentualTexto = percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <Card className="gap-3 border-amber-500/30 py-4">
      <div className="flex items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Target className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="truncate text-sm font-semibold">Meta de faturamento — {mes}</p>
        </div>
        {meta > 0 && (
          <p className="shrink-0 text-sm font-bold">
            {formatarMoeda(faturamento)} / {formatarMoeda(meta)}
          </p>
        )}
      </div>

      {meta > 0 ? (
        <div className="space-y-1.5 px-4">
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(barra)}
          >
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${barra}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {percentual >= 100
              ? `Meta batida! ${percentualTexto}% do objetivo 🎉`
              : `${percentualTexto}% da meta atingida`}
          </p>
        </div>
      ) : (
        <p className="px-4 text-sm text-muted-foreground">
          Defina a meta do mês em{" "}
          <Link to="/configuracoes" className="text-primary underline underline-offset-2">
            Configurações
          </Link>
          .
        </p>
      )}
    </Card>
  );
}
