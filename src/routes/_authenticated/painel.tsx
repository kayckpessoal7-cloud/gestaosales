/**
 * Painel inicial: visão geral do caixa da barbearia.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, Minus, Plus } from "lucide-react";

import { MetaFaturamento } from "@/components/MetaFaturamento";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  noPeriodo,
  somar,
  useMovimentacoes,
  type Movimentacao,
  type TipoMovimentacao,
} from "@/lib/dados";
import {
  formatarData,
  formatarMoeda,
  hojeISO,
  inicioDaSemana,
  inicioDoMes,
  rotuloCurto,
  somarDias,
} from "@/lib/formato";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel | D'Sales Barbearia" },
      {
        name: "description",
        content: "Faturamento do dia, da semana e do mês, gastos e saldo da D'Sales Barbearia.",
      },
      { property: "og:title", content: "Painel | D'Sales Barbearia" },
      {
        property: "og:description",
        content: "Faturamento do dia, da semana e do mês, gastos e saldo da D'Sales Barbearia.",
      },
    ],
  }),
  component: Painel,
});

const CORES_PIZZA = [
  "oklch(0.78 0.13 85)",
  "oklch(0.65 0.2 25)",
  "oklch(0.72 0.17 152)",
  "oklch(0.65 0.13 240)",
  "oklch(0.7 0.14 300)",
  "oklch(0.8 0.1 60)",
];

function CardValor({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor?: "entrada" | "saida" | "saldo";
}) {
  const classe =
    cor === "entrada"
      ? "text-entrada"
      : cor === "saida"
        ? "text-saida"
        : cor === "saldo"
          ? valor >= 0
            ? "text-entrada"
            : "text-saida"
          : "text-foreground";
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className={cn("text-xl font-bold sm:text-2xl", classe)}>{formatarMoeda(valor)}</p>
      </CardContent>
    </Card>
  );
}

function Painel() {
  const { data: movimentacoes = [], isLoading } = useMovimentacoes();
  const [dialogo, setDialogo] = useState<TipoMovimentacao | null>(null);

  const hoje = hojeISO();
  const resumo = useMemo(() => {
    const entradas = movimentacoes.filter((m) => m.tipo === "entrada");
    const saidas = movimentacoes.filter((m) => m.tipo === "saida");

    const doDia = somar(noPeriodo(entradas, hoje, hoje));
    const daSemana = somar(noPeriodo(entradas, inicioDaSemana(hoje), hoje));
    const doMes = somar(noPeriodo(entradas, inicioDoMes(hoje), hoje));
    const gastoMes = somar(noPeriodo(saidas, inicioDoMes(hoje), hoje));

    // Gráfico dos últimos 30 dias
    const inicio = somarDias(hoje, -29);
    const dias: { dia: string; Entradas: number; Saídas: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const data = somarDias(inicio, i);
      dias.push({
        dia: rotuloCurto(data),
        Entradas: somar(entradas.filter((m) => m.data === data)),
        Saídas: somar(saidas.filter((m) => m.data === data)),
      });
    }

    // Despesas por categoria (mês atual)
    const saidasMes = noPeriodo(saidas, inicioDoMes(hoje), hoje);
    const porCategoria = new Map<string, number>();
    saidasMes.forEach((m) => porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + m.valor));
    const despesas = [...porCategoria.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);

    // Lembretes de despesas fixas recorrentes do mês
    const jaPagasNoMes = new Set(
      noPeriodo(saidas, inicioDoMes(hoje), hoje)
        .filter((m) => m.recorrente)
        .map((m) => m.categoria),
    );
    const recorrentes = new Map<string, Movimentacao>();
    saidas
      .filter((m) => m.recorrente && m.dia_vencimento)
      .forEach((m) => {
        if (!recorrentes.has(m.categoria)) recorrentes.set(m.categoria, m);
      });
    const lembretes = [...recorrentes.values()].filter((m) => !jaPagasNoMes.has(m.categoria));

    return {
      doDia,
      daSemana,
      doMes,
      gastoMes,
      saldoMes: doMes - gastoMes,
      dias,
      despesas,
      lembretes,
      ultimas: movimentacoes.slice(0, 10),
    };
  }, [movimentacoes, hoje]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">Painel</h1>
          <p className="truncate text-sm text-muted-foreground">Hoje é {formatarData(hoje)}</p>
        </div>
      </header>

      {/* Botões de acesso rápido */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setDialogo("entrada")}
          className="h-16 bg-entrada text-base font-semibold text-background hover:bg-entrada/90"
        >
          <Plus className="mr-1 h-5 w-5" /> Nova entrada
        </Button>
        <Button
          onClick={() => setDialogo("saida")}
          className="h-16 bg-saida text-base font-semibold text-background hover:bg-saida/90"
        >
          <Minus className="mr-1 h-5 w-5" /> Nova saída
        </Button>
      </div>

      {/* Meta de faturamento do mês */}
      <MetaFaturamento faturamento={resumo.doMes} />

      {resumo.lembretes.length > 0 && (
        <Card className="border-primary/40 bg-primary/5 py-4">
          <CardContent className="flex gap-3 px-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-primary">Despesas fixas deste mês</p>
              <p className="text-muted-foreground">
                {resumo.lembretes
                  .map((m) => `${m.categoria} (vence dia ${m.dia_vencimento})`)
                  .join(" · ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <CardValor titulo="Faturamento hoje" valor={resumo.doDia} cor="entrada" />
        <CardValor titulo="Faturamento semana" valor={resumo.daSemana} cor="entrada" />
        <CardValor titulo="Faturamento mês" valor={resumo.doMes} cor="entrada" />
        <CardValor titulo="Total recebido (mês)" valor={resumo.doMes} cor="entrada" />
        <CardValor titulo="Total gasto (mês)" valor={resumo.gastoMes} cor="saida" />
        <CardValor titulo="Saldo do mês" valor={resumo.saldoMes} cor="saldo" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entradas x Saídas (últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-64 px-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resumo.dias}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.015 88)" />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} width={45} />
              <Tooltip
                formatter={(v: number) => formatarMoeda(v)}
                contentStyle={{
                  background: "oklch(0.22 0.01 90)",
                  border: "1px solid oklch(0.32 0.015 88)",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Entradas" fill="oklch(0.72 0.17 152)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Saídas" fill="oklch(0.65 0.2 25)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por categoria (mês)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {resumo.despesas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma despesa registrada no mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resumo.despesas}
                    dataKey="valor"
                    nameKey="nome"
                    outerRadius="78%"
                    label={false}
                  >
                    {resumo.despesas.map((_, i) => (
                      <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatarMoeda(v)}
                    contentStyle={{
                      background: "oklch(0.22 0.01 90)",
                      border: "1px solid oklch(0.32 0.015 88)",
                      borderRadius: 8,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas movimentações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && resumo.ultimas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
            )}
            {resumo.ultimas.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.categoria}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatarData(m.data)} · {m.forma_pagamento}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    m.tipo === "entrada" ? "text-entrada" : "text-saida",
                  )}
                >
                  {m.tipo === "entrada" ? "+" : "−"} {formatarMoeda(m.valor)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <MovimentacaoDialog
        aberto={dialogo !== null}
        tipo={dialogo ?? "entrada"}
        aoFechar={() => setDialogo(null)}
      />
    </div>
  );
}
