/**
 * Histórico completo com filtros, busca e exportação (CSV e PDF).
 */
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ListaMovimentacoes } from "@/components/ListaMovimentacoes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FORMAS_PAGAMENTO,
  somar,
  useBarbeiros,
  useCategorias,
  useMovimentacoes,
} from "@/lib/dados";
import { formatarData, formatarMoeda, hojeISO, somarDias } from "@/lib/formato";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico | D'Sales Barbearia" },
      {
        name: "description",
        content: "Todas as movimentações da barbearia com filtros, busca e exportação.",
      },
      { property: "og:title", content: "Histórico | D'Sales Barbearia" },
      {
        property: "og:description",
        content: "Todas as movimentações da barbearia com filtros, busca e exportação.",
      },
    ],
  }),
  component: Historico,
});

const TODOS = "todos";

function Historico() {
  const { data: movimentacoes = [] } = useMovimentacoes();
  const { data: categorias = [] } = useCategorias();
  const { data: barbeiros = [] } = useBarbeiros();

  const hoje = hojeISO();
  const [tipo, setTipo] = useState(TODOS);
  const [categoria, setCategoria] = useState(TODOS);
  const [forma, setForma] = useState(TODOS);
  const [barbeiro, setBarbeiro] = useState(TODOS);
  const [de, setDe] = useState(somarDias(hoje, -30));
  const [ate, setAte] = useState(hoje);
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return movimentacoes.filter((m) => {
      if (m.data < de || m.data > ate) return false;
      if (tipo !== TODOS && m.tipo !== tipo) return false;
      if (categoria !== TODOS && m.categoria !== categoria) return false;
      if (forma !== TODOS && m.forma_pagamento !== forma) return false;
      if (barbeiro !== TODOS && m.barbeiro_id !== barbeiro) return false;
      if (texto && !(m.descricao ?? "").toLowerCase().includes(texto)) return false;
      return true;
    });
  }, [movimentacoes, de, ate, tipo, categoria, forma, barbeiro, busca]);

  const totalEntradas = somar(filtradas.filter((m) => m.tipo === "entrada"));
  const totalSaidas = somar(filtradas.filter((m) => m.tipo === "saida"));

  const nomeBarbeiro = (id: string | null) => barbeiros.find((b) => b.id === id)?.nome ?? "";

  /** Exporta as movimentações filtradas em CSV (abre no Excel). */
  function exportarCSV() {
    const cabecalho = [
      "Data",
      "Tipo",
      "Categoria",
      "Forma de pagamento",
      "Barbeiro",
      "Descrição",
      "Valor",
    ];
    const linhas = filtradas.map((m) => [
      formatarData(m.data),
      m.tipo === "entrada" ? "Entrada" : "Saída",
      m.categoria,
      m.forma_pagamento,
      nomeBarbeiro(m.barbeiro_id),
      (m.descricao ?? "").replace(/;/g, ","),
      m.valor.toFixed(2).replace(".", ","),
    ]);
    const csv = [cabecalho, ...linhas].map((l) => l.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dsales-historico-${de}-a-${ate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Gera uma versão para impressão/PDF do histórico filtrado. */
  function exportarPDF() {
    const linhas = filtradas
      .map(
        (m) => `<tr>
          <td>${formatarData(m.data)}</td>
          <td>${m.tipo === "entrada" ? "Entrada" : "Saída"}</td>
          <td>${m.categoria}</td>
          <td>${m.forma_pagamento}</td>
          <td>${nomeBarbeiro(m.barbeiro_id)}</td>
          <td>${(m.descricao ?? "").replace(/</g, "")}</td>
          <td style="text-align:right;color:${m.tipo === "entrada" ? "#15803d" : "#b91c1c"}">${formatarMoeda(m.valor)}</td>
        </tr>`,
      )
      .join("");

    const janela = window.open("", "_blank");
    if (!janela) return;
    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>Histórico D'Sales Barbearia</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin:0 0 4px}
        p{margin:0 0 16px;font-size:12px;color:#555}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}
        th{background:#f3f3f3}
      </style></head><body>
      <h1>D'Sales Barbearia — Histórico de movimentações</h1>
      <p>Período: ${formatarData(de)} a ${formatarData(ate)} · Entradas: ${formatarMoeda(totalEntradas)} · Saídas: ${formatarMoeda(totalSaidas)} · Saldo: ${formatarMoeda(totalEntradas - totalSaidas)}</p>
      <table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Pagamento</th><th>Barbeiro</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${linhas}</tbody></table>
      </body></html>`);
    janela.document.close();
    janela.focus();
    janela.print();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-xl font-bold sm:text-2xl">Histórico</h1>

      <Card>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label>De</Label>
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1">
              <Label>Até</Label>
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Forma de pagamento</Label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Barbeiro</Label>
              <Select value={barbeiro} onValueChange={setBarbeiro}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  {barbeiros.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar na descrição"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-11" onClick={exportarCSV}>
              <Download className="mr-1 h-4 w-4" /> Exportar CSV
            </Button>
            <Button variant="outline" className="h-11" onClick={exportarPDF}>
              <FileText className="mr-1 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="py-3">
          <CardContent className="px-3">
            <p className="text-[11px] uppercase text-muted-foreground">Entradas</p>
            <p className="text-base font-bold text-entrada sm:text-lg">
              {formatarMoeda(totalEntradas)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-3">
            <p className="text-[11px] uppercase text-muted-foreground">Saídas</p>
            <p className="text-base font-bold text-saida sm:text-lg">{formatarMoeda(totalSaidas)}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-3">
            <p className="text-[11px] uppercase text-muted-foreground">Saldo</p>
            <p
              className={`text-base font-bold sm:text-lg ${totalEntradas - totalSaidas >= 0 ? "text-entrada" : "text-saida"}`}
            >
              {formatarMoeda(totalEntradas - totalSaidas)}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">{filtradas.length} movimentação(ões)</p>
      <ListaMovimentacoes itens={filtradas} />
    </div>
  );
}
