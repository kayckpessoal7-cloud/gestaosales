/**
 * Relatórios: faturamento por período, comparativo com período anterior,
 * resumo por forma de pagamento, comissões por barbeiro e meta mensal.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { MetaFaturamento } from "@/components/MetaFaturamento";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FORMAS_PAGAMENTO,
  noPeriodo,
  somar,
  useBarbeiros,
  useMovimentacoes,
} from "@/lib/dados";
import {
  formatarMoeda,
  hojeISO,
  inicioDoMes,
  somarDias,
} from "@/lib/formato";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | D'Sales Barbearia" },
      {
        name: "description",
        content:
          "Faturamento por período, comparativo, formas de pagamento, comissões e meta mensal.",
      },
      { property: "og:title", content: "Relatórios | D'Sales Barbearia" },
      {
        property: "og:description",
        content:
          "Faturamento por período, comparativo, formas de pagamento, comissões e meta mensal.",
      },
    ],
  }),
  component: Relatorios,
});

function Relatorios() {
  const { data: movimentacoes = [] } = useMovimentacoes();
  const { data: barbeiros = [] } = useBarbeiros();

  const hoje = hojeISO();
  const [de, setDe] = useState(inicioDoMes(hoje));
  const [ate, setAte] = useState(hoje);

  const dados = useMemo(() => {
    const movs = movimentacoes || [];
    const entradas = movs.filter((m) => m?.tipo === "entrada");
    const saidas = movs.filter((m) => m?.tipo === "saida");

    const dataDeSegura = de || hoje;
    const dataAteSegura = ate || hoje;

    const noIntervalo = noPeriodo(entradas, dataDeSegura, dataAteSegura) || [];
    const saidasIntervalo = noPeriodo(saidas, dataDeSegura, dataAteSegura) || [];

    let dias = 1;
    const msAte = new Date(dataAteSegura + "T00:00:00").getTime();
    const msDe = new Date(dataDeSegura + "T00:00:00").getTime();
    if (!Number.isNaN(msAte) && !Number.isNaN(msDe)) {
      dias = Math.max(1, Math.round((msAte - msDe) / 86400000) + 1);
    }

    let anteriorAte = hoje;
    let anteriorDe = hoje;
    try {
      anteriorAte = somarDias(dataDeSegura, -1);
      anteriorDe = somarDias(anteriorAte, -(dias - 1));
    } catch (erro) {
      // Falha de data ignorada
    }
    
    const entradasAnterior = somar(noPeriodo(entradas, anteriorDe, anteriorAte) || []);

    const recebido = somar(noIntervalo);
    const gasto = somar(saidasIntervalo);

    const porForma = (FORMAS_PAGAMENTO || []).map((forma) => ({
      forma,
      entradas: somar(noIntervalo.filter((m) => m?.forma_pagamento === forma)),
      saidas: somar(saidasIntervalo.filter((m) => m?.forma_pagamento === forma)),
    }));

    const comissoes = (barbeiros || []).map((b) => {
      const total = somar(noIntervalo.filter((m) => m?.barbeiro_id === b?.id));
      return { 
        nome: b?.nome || "Desconhecido", 
        total, 
        comissao: (total * (b?.comissao || 0)) / 100, 
        percentual: b?.comissao || 0 
      };
    });

    const faturamentoMes = somar(noPeriodo(entradas, inicioDoMes(hoje), hoje) || []);

    let variacao = 0;
    if (entradasAnterior > 0) {
      variacao = ((recebido - entradasAnterior) / entradasAnterior) * 100;
    } else if (recebido > 0) {
      variacao = 100;
    }

    return {
      recebido,
      gasto,
      saldo: recebido - gasto,
      variacao,
      entradasAnterior,
      anteriorDe,
      anteriorAte,
      porForma,
      comissoes,
      faturamentoMes,
    };
  }, [movimentacoes, barbeiros, de, ate, hoje]);


  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-xl font-bold sm:text-2xl">Relatórios</h1>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>De</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label>Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-11" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase text-muted-foreground">Total recebido</p>
            <p className="text-xl font-bold text-entrada">{formatarMoeda(dados.recebido)}</p>
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs",
                dados.variacao >= 0 ? "text-entrada" : "text-saida",
              )}
            >
              {dados.variacao >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {dados.variacao > 0 ? "+" : ""}{dados.variacao.toFixed(1).replace(".", ",")}% vs. período anterior
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase text-muted-foreground">Total gasto</p>
            <p className="text-xl font-bold text-saida">{formatarMoeda(dados.gasto)}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase text-muted-foreground">Saldo</p>
            <p
              className={cn(
                "text-xl font-bold",
                dados.saldo >= 0 ? "text-entrada" : "text-saida",
              )}
            >
              {formatarMoeda(dados.saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      <MetaFaturamento faturamento={dados.faturamentoMes} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dados.porForma.map((f) => (
            <div
              key={f.forma}
              className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">{f.forma}</span>
              <span className="shrink-0">
                <span className="font-semibold text-entrada">{formatarMoeda(f.entradas)}</span>
                <span className="mx-2 text-muted-foreground">/</span>
                <span className="font-semibold text-saida">{formatarMoeda(f.saidas)}</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comissões por barbeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dados.comissoes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum barbeiro cadastrado.</p>
          )}
          {dados.comissoes.map((c) => (
            <div
              key={c.nome}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Produziu {formatarMoeda(c.total)} · {c.percentual}%
                </p>
              </div>
              <span className="shrink-0 font-semibold text-primary">
                {formatarMoeda(c.comissao)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
