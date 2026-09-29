/**
 * Tela de saídas (despesas), com ranking das categorias que mais pesam.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Minus } from "lucide-react";
import { useMemo, useState } from "react";

import { ListaMovimentacoes } from "@/components/ListaMovimentacoes";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { noPeriodo, somar, useMovimentacoes } from "@/lib/dados";
import { formatarMoeda, hojeISO, inicioDoMes } from "@/lib/formato";
import { useOcultarValores } from "@/hooks/use-ocultar-valores";

export const Route = createFileRoute("/_authenticated/saidas")({
  head: () => ({
    meta: [
      { title: "Saídas | D'Sales Barbearia" },
      {
        name: "description",
        content: "Controle de despesas fixas e variáveis da barbearia por categoria.",
      },
      { property: "og:title", content: "Saídas | D'Sales Barbearia" },
      {
        property: "og:description",
        content: "Controle de despesas fixas e variáveis da barbearia por categoria.",
      },
    ],
  }),
  component: Saidas,
});

function Saidas() {
  const { data: movimentacoes = [] } = useMovimentacoes();
  const [aberto, setAberto] = useState(false);
  const { oculto } = useOcultarValores();
  const hoje = hojeISO();

  const saidas = useMemo(() => movimentacoes.filter((m) => m.tipo === "saida"), [movimentacoes]);
  const saidasMes = noPeriodo(saidas, inicioDoMes(hoje), hoje);
  const totalMes = somar(saidasMes);
  const fixasMes = somar(saidasMes.filter((m) => m.despesa_tipo === "fixa"));

  const ranking = useMemo(() => {
    const mapa = new Map<string, number>();
    saidasMes.forEach((m) => mapa.set(m.categoria, (mapa.get(m.categoria) ?? 0) + m.valor));
    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [saidasMes]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-xl font-bold sm:text-2xl">Saídas</h1>
        <Button
          onClick={() => setAberto(true)}
          className="h-12 shrink-0 bg-saida text-background hover:bg-saida/90"
        >
          <Minus className="mr-1 h-5 w-5" /> Nova saída
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase text-muted-foreground">Gasto no mês</p>
            <p className="text-xl font-bold text-saida transition-opacity duration-200">
              {oculto ? "R$\u00A0••••••" : formatarMoeda(totalMes)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase text-muted-foreground">Despesas fixas</p>
            <p className="text-xl font-bold text-saida transition-opacity duration-200">
              {oculto ? "R$\u00A0••••••" : formatarMoeda(fixasMes)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">O que mais pesa nos gastos (mês)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranking.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma despesa no mês.</p>
          )}
          {ranking.map((c) => (
            <div key={c.nome} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate transition-opacity duration-200">{oculto ? "••••••" : c.nome}</span>
                <span className="shrink-0 font-semibold text-saida transition-opacity duration-200">
                  {oculto ? "R$\u00A0••••••" : formatarMoeda(c.valor)}
                </span>
              </div>
              <Progress value={oculto ? 0 : (totalMes > 0 ? (c.valor / totalMes) * 100 : 0)} className="h-2 transition-all duration-200" />
            </div>
          ))}
        </CardContent>
      </Card>

      <ListaMovimentacoes itens={saidas.slice(0, 100)} />

      <MovimentacaoDialog aberto={aberto} tipo="saida" aoFechar={() => setAberto(false)} />
    </div>
  );
}
