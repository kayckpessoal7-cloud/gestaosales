/**
 * Painel inicial: visão geral do caixa da barbearia.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { ContentType } from "recharts/types/component/Tooltip";
import { AlertCircle, Eye, EyeOff, Minus, Plus } from "lucide-react";

import { MetaFaturamento } from "@/components/MetaFaturamento";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOcultarValores } from "@/hooks/use-ocultar-valores";
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
  formatarDataRelativa,
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

const VALOR_OCULTO = "R$\u00A0••••••";
const VALOR_OCULTO_CURTO = "R$\u00A0••••";

function CardValor({
  titulo,
  valor,
  cor,
  oculto,
  formatar,
}: {
  titulo: string;
  valor: number;
  cor?: "entrada" | "saida" | "saldo";
  oculto: boolean;
  formatar: (v: number, curto?: boolean) => string;
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
        <p
          className={cn(
            "text-xl font-bold sm:text-2xl transition-opacity duration-200",
            classe,
            oculto && "select-none",
          )}
        >
          {formatar(valor)}
        </p>
      </CardContent>
    </Card>
  );
}

function Painel() {
  const { data: movimentacoes = [], isLoading } = useMovimentacoes();
  const [dialogo, setDialogo] = useState<TipoMovimentacao | null>(null);
  const isMobile = useIsMobile();
  const { oculto, alternar } = useOcultarValores();

  const formatar = useCallback(
    (valor: number, curto = false) => (oculto ? (curto ? VALOR_OCULTO_CURTO : VALOR_OCULTO) : formatarMoeda(valor)),
    [oculto],
  );

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
    const DIAS_SEMANA_NOMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const dias: { dia: string; dataCompleta: string; dataCompletaLonga: string; Entradas: number; Saídas: number; Saldo: number; isHoje: boolean }[] = [];
    let temMovimentacao = false;
    let totalEntradas30 = 0;
    let totalSaidas30 = 0;
    let melhorDiaValor = 0;
    let melhorDiaLabel = "";
    for (let i = 0; i < 30; i++) {
      const data = somarDias(inicio, i);
      const isHoje = data === hoje;
      const ent = somar(entradas.filter((m) => m.data === data));
      const sai = somar(saidas.filter((m) => m.data === data));
      if (ent > 0 || sai > 0) temMovimentacao = true;
      totalEntradas30 += ent;
      totalSaidas30 += sai;
      const saldo = ent - sai;
      if (saldo > melhorDiaValor) {
        melhorDiaValor = saldo;
        melhorDiaLabel = rotuloCurto(data);
      }

      const dObj = new Date(`${data}T12:00:00`);
      const diaSemana = DIAS_SEMANA_NOMES[dObj.getDay()] ?? "";

      dias.push({
        dia: rotuloCurto(data),
        dataCompleta: formatarData(data),
        dataCompletaLonga: `${diaSemana}, ${formatarData(data)}`,
        Entradas: ent,
        Saídas: sai,
        Saldo: saldo,
        isHoje,
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
      temMovimentacao,
      totalEntradas30,
      totalSaidas30,
      melhorDiaValor,
      melhorDiaLabel,
      despesas,
      lembretes,
      ultimas: movimentacoes.slice(0, 10),
    };
  }, [movimentacoes, hoje]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex items-center gap-4">
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
      <MetaFaturamento faturamento={resumo.doMes} oculto={oculto} />

      {resumo.lembretes.length > 0 && (
        <Card className="border-primary/40 bg-primary/5 py-4">
          <CardContent className="flex gap-3 px-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-primary">Despesas fixas deste mês</p>
              <p className={cn("text-muted-foreground transition-opacity duration-200", oculto && "select-none")}>
                {oculto
                  ? "••••••"
                  : resumo.lembretes
                      .map((m) => `${m.categoria} (vence dia ${m.dia_vencimento})`)
                      .join(" · ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <CardValor titulo="Faturamento hoje" valor={resumo.doDia} cor="entrada" oculto={oculto} formatar={formatar} />
        <CardValor titulo="Faturamento semana" valor={resumo.daSemana} cor="entrada" oculto={oculto} formatar={formatar} />
        <CardValor titulo="Faturamento mês" valor={resumo.doMes} cor="entrada" oculto={oculto} formatar={formatar} />
        <CardValor titulo="Total recebido (mês)" valor={resumo.doMes} cor="entrada" oculto={oculto} formatar={formatar} />
        <CardValor titulo="Total gasto (mês)" valor={resumo.gastoMes} cor="saida" oculto={oculto} formatar={formatar} />
        <CardValor titulo="Saldo do mês" valor={resumo.saldoMes} cor="saldo" oculto={oculto} formatar={formatar} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Entradas x Saídas (últimos 30 dias)</CardTitle>
            {resumo.temMovimentacao && !oculto && (
              <p className="text-xs text-muted-foreground">
                Total do período: {formatarMoeda(resumo.totalEntradas30 - resumo.totalSaidas30)}
                {resumo.melhorDiaLabel ? ` · Melhor dia: ${resumo.melhorDiaLabel} (${formatarMoeda(resumo.melhorDiaValor)})` : ""}
              </p>
            )}
          </div>
          {resumo.temMovimentacao && !oculto && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                Saídas
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-2" style={{ height: 320 }}>
          {oculto ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 transition-opacity duration-200">
              <EyeOff className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Valores ocultos</p>
            </div>
          ) : resumo.temMovimentacao ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={resumo.dias}
                margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
                barCategoryGap="20%"
                barGap={3}
              >
                <defs>
                  <linearGradient id="gradEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                  <linearGradient id="gradSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="6 4"
                  vertical={false}
                  stroke="oklch(0.5 0 0)"
                  strokeOpacity={0.08}
                />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: "oklch(0.6 0.01 90)" }}
                  interval={isMobile ? 4 : 2}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.6 0.01 90)" }}
                  tickFormatter={(v: number) => {
                    const parts = formatarMoeda(v).split(",");
                    return parts[0] ?? "";
                  }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (max: number) => Math.ceil(max * 1.15)]}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.85 0.02 85)", opacity: 0.08 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const d = payload[0]?.payload as (typeof resumo.dias)[number] | undefined;
                      if (!d) return null;
                      return (
                        <div
                          className="rounded-xl border bg-[#1c1a14] p-3 text-sm shadow-2xl"
                          style={{ borderColor: "#d4a63c" }}
                        >
                          <p className="mb-2 font-semibold text-white">
                            {d.dataCompletaLonga}
                            {d.isHoje ? " (Hoje)" : ""}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-6">
                              <span style={{ color: "#22c55e" }}>Entradas</span>
                              <span className="font-medium" style={{ color: "#22c55e" }}>
                                {formatarMoeda(d.Entradas)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                              <span style={{ color: "#ef4444" }}>Saídas</span>
                              <span className="font-medium" style={{ color: "#ef4444" }}>
                                {formatarMoeda(d.Saídas)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-6 border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                              <span className="font-semibold text-white">Saldo</span>
                              <span
                                className="font-bold"
                                style={{ color: d.Saldo >= 0 ? "#22c55e" : "#ef4444" }}
                              >
                                {formatarMoeda(d.Saldo)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="Entradas"
                  fill="url(#gradEntrada)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                >
                  {resumo.dias.map((entry, idx) => (
                    <Cell
                      key={`ent-${idx}`}
                      fill="url(#gradEntrada)"
                      stroke={entry.isHoje ? "#d4a63c" : undefined}
                      strokeWidth={entry.isHoje ? 1.5 : 0}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="Saídas"
                  fill="url(#gradSaida)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                >
                  {resumo.dias.map((entry, idx) => (
                    <Cell
                      key={`sai-${idx}`}
                      fill="url(#gradSaida)"
                      stroke={entry.isHoje ? "#d4a63c" : undefined}
                      strokeWidth={entry.isHoje ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Sem movimentações nos últimos 30 dias</p>
            </div>
          )}
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
            ) : oculto ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 transition-opacity duration-200">
                <EyeOff className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Valores ocultos</p>
              </div>
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
                  <p className={cn("truncate text-sm font-medium transition-opacity duration-200", oculto && "select-none")}>
                    {oculto ? "••••••" : m.categoria}
                  </p>
                  <p className={cn("truncate text-xs text-muted-foreground transition-opacity duration-200", oculto && "select-none")}>
                    {oculto ? "•••• · ••••" : `${formatarDataRelativa(m.data)} · ${m.forma_pagamento}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold transition-opacity duration-200",
                    oculto ? "text-muted-foreground select-none" : m.tipo === "entrada" ? "text-entrada" : "text-saida",
                  )}
                >
                  {oculto
                    ? VALOR_OCULTO_CURTO
                    : `${m.tipo === "entrada" ? "+" : "−"} ${formatarMoeda(m.valor)}`}
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
