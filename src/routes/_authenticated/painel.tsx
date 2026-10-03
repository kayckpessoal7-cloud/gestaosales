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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  "#d97706",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
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
        <CardHeader>
          <CardTitle className="text-base font-medium tracking-wide uppercase text-muted-foreground">
            Entradas x Saídas — últimos 30 dias
          </CardTitle>
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
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                barCategoryGap="25%"
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="oklch(0.5 0 0)"
                  strokeOpacity={0.15}
                />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: "oklch(0.6 0.01 90)" }}
                  interval={4}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.6 0.01 90)" }}
                  tickFormatter={(v: number) => {
                    if (v === 0) return "R$ 0";
                    if (v >= 1000) return `R$ ${v / 1000}k`;
                    return `R$ ${v}`;
                  }}
                  tickLine={false}
                  axisLine={false}
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
                          style={{ borderColor: "rgba(255,255,255,0.1)" }}
                        >
                          <p className="mb-2 font-semibold text-white">
                            {d.dataCompletaLonga}
                            {d.isHoje ? " (Hoje)" : ""}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-6">
                              <span style={{ color: "#10b981" }}>Entradas</span>
                              <span className="font-medium" style={{ color: "#10b981" }}>
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
                                style={{ color: d.Saldo >= 0 ? "#10b981" : "#ef4444" }}
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
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="square"
                  wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                />
                <Bar
                  name="Entradas"
                  dataKey="Entradas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={10}
                  animationDuration={800}
                />
                <Bar
                  name="Saídas"
                  dataKey="Saídas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={10}
                  animationDuration={800}
                />
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
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pb-6">
            {resumo.despesas.length === 0 ? (
              <div className="flex h-full min-h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhuma despesa registrada no mês.</p>
              </div>
            ) : (
              <>
                {oculto ? (
                  <div className="relative mb-6 flex h-48 w-full flex-col items-center justify-center gap-2 transition-opacity duration-200">
                    <EyeOff className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Valores ocultos</p>
                  </div>
                ) : (
                  <div className="relative mb-6 h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={resumo.despesas}
                          dataKey="valor"
                          nameKey="nome"
                          innerRadius="65%"
                          outerRadius="90%"
                          paddingAngle={3}
                          stroke="none"
                          cornerRadius={6}
                          animationDuration={800}
                        >
                          {resumo.despesas.map((_, i) => (
                            <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length > 0) {
                              const d = payload[0]?.payload as (typeof resumo.despesas)[number] | undefined;
                              if (!d) return null;
                              const percent = resumo.gastoMes > 0 ? ((d.valor / resumo.gastoMes) * 100).toFixed(1).replace(".", ",") : "0,0";
                              return (
                                <div
                                  className="rounded-xl border bg-[#1c1a14] p-3 text-sm shadow-2xl"
                                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                                >
                                  <p className="mb-2 font-semibold text-white">{d.nome}</p>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-6">
                                      <span className="text-muted-foreground">Valor</span>
                                      <span className="font-medium text-white">
                                        {formatarMoeda(d.valor)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6">
                                      <span className="text-muted-foreground">Fatia</span>
                                      <span className="font-medium text-white">
                                        {percent}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-muted-foreground">Total despesas</span>
                      <span className="text-xl font-bold text-white">{formatarMoeda(resumo.gastoMes)}</span>
                    </div>
                  </div>
                )}

                <ScrollArea className="h-[140px] w-full pr-3">
                  <ul className="space-y-2.5">
                    {resumo.despesas.map((d, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: oculto ? "#3f3f46" : CORES_PIZZA[i % CORES_PIZZA.length] }}
                          />
                          <span className={cn("truncate transition-opacity duration-200", oculto && "select-none")}>
                            {oculto ? "••••••" : d.nome}
                          </span>
                        </span>
                        <span className={cn("shrink-0 font-medium transition-opacity duration-200", oculto && "text-muted-foreground select-none")}>
                          {oculto ? "R$\u00A0••••" : formatarMoeda(d.valor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </>
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
                  <div className={cn("flex items-center gap-1 text-xs text-muted-foreground transition-opacity duration-200", oculto && "select-none")}>
                    {oculto ? <span>•••• · ••••</span> : (
                      <>
                        <span className="shrink-0">{formatarDataRelativa(m.data, m.criado_em)}</span>
                        <span className="truncate">· {m.forma_pagamento}</span>
                      </>
                    )}
                  </div>
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
