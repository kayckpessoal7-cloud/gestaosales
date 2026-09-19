/**
 * Configurações: categorias, barbeiros (comissão), meta mensal e sair da conta.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  useBarbeiros,
  useCategorias,
  useConfiguracoes,
  useExcluirBarbeiro,
  useExcluirCategoria,
  useSalvarBarbeiro,
  useSalvarCategoria,
  useSalvarMeta,
  type TipoMovimentacao,
} from "@/lib/dados";
import { formatarMoeda, valorParaNumero } from "@/lib/formato";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | D'Sales Barbearia" },
      {
        name: "description",
        content: "Categorias, barbeiros, comissões e meta mensal da D'Sales Barbearia.",
      },
      { property: "og:title", content: "Configurações | D'Sales Barbearia" },
      {
        property: "og:description",
        content: "Categorias, barbeiros, comissões e meta mensal da D'Sales Barbearia.",
      },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categorias = [] } = useCategorias();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: config } = useConfiguracoes();

  const salvarCategoria = useSalvarCategoria();
  const excluirCategoria = useExcluirCategoria();
  const salvarBarbeiro = useSalvarBarbeiro();
  const excluirBarbeiro = useExcluirBarbeiro();
  const salvarMeta = useSalvarMeta();

  const [novaCategoria, setNovaCategoria] = useState("");
  const [precoCategoria, setPrecoCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState<TipoMovimentacao>("entrada");
  const [novoBarbeiro, setNovoBarbeiro] = useState("");
  const [comissao, setComissao] = useState("40");
  const [meta, setMeta] = useState("");

  useEffect(() => {
    if (config?.meta_mensal != null) setMeta(String(config.meta_mensal).replace(".", ","));
  }, [config?.meta_mensal]);

  async function adicionarCategoria() {
    const nome = novaCategoria.trim();
    if (!nome) {
      toast.error("Digite o nome da categoria.");
      return;
    }
    const preco =
      tipoCategoria === "entrada" && precoCategoria.trim()
        ? valorParaNumero(precoCategoria)
        : null;
    if (tipoCategoria === "entrada" && (preco == null || preco <= 0)) {
      toast.error("Informe o preço do serviço.");
      return;
    }
    try {
      await salvarCategoria.mutateAsync({ nome, tipo: tipoCategoria, preco });
      setNovaCategoria("");
      setPrecoCategoria("");
      toast.success("Categoria criada.");
    } catch {
      toast.error("Não foi possível criar a categoria.");
    }
  }

  async function adicionarBarbeiro() {
    const nome = novoBarbeiro.trim();
    if (!nome) {
      toast.error("Digite o nome do barbeiro.");
      return;
    }
    const percentual = valorParaNumero(comissao);
    if (percentual < 0 || percentual > 100) {
      toast.error("Comissão entre 0 e 100.");
      return;
    }
    try {
      await salvarBarbeiro.mutateAsync({ nome, comissao: percentual });
      setNovoBarbeiro("");
      toast.success("Barbeiro cadastrado.");
    } catch {
      toast.error("Não foi possível cadastrar.");
    }
  }

  async function guardarMeta() {
    const valor = valorParaNumero(meta);
    if (valor < 0) {
      toast.error("Meta inválida.");
      return;
    }
    try {
      await salvarMeta.mutateAsync(valor);
      toast.success("Meta salva.");
    } catch {
      toast.error("Não foi possível salvar a meta.");
    }
  }

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-xl font-bold sm:text-2xl">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta mensal de faturamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1 space-y-1">
            <Label>Valor (R$)</Label>
            <Input
              inputMode="decimal"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="12000,00"
              className="h-12 text-lg"
            />
          </div>
          <Button className="h-12" onClick={guardarMeta}>
            Salvar meta
          </Button>
          {config?.meta_mensal ? (
            <p className="w-full text-xs text-muted-foreground">
              Meta atual: {formatarMoeda(config.meta_mensal)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-40 flex-1 space-y-1">
              <Label>Nova categoria</Label>
              <Input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Ex.: Pezinho"
                className="h-12"
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={tipoCategoria}
                onValueChange={(v) => setTipoCategoria(v as TipoMovimentacao)}
              >
                <SelectTrigger className="h-12 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="h-12" onClick={adicionarCategoria}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </div>

          {(["entrada", "saida"] as TipoMovimentacao[]).map((tipo) => (
            <div key={tipo} className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {tipo === "entrada" ? "Entradas" : "Saídas"}
              </p>
              <div className="flex flex-wrap gap-2">
                {categorias
                  .filter((c) => c.tipo === tipo)
                  .map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm"
                    >
                      {c.nome}
                      <button
                        type="button"
                        aria-label={`Excluir ${c.nome}`}
                        onClick={async () => {
                          try {
                            await excluirCategoria.mutateAsync(c.id);
                            toast.success("Categoria excluída.");
                          } catch {
                            toast.error("Não foi possível excluir.");
                          }
                        }}
                        className="text-muted-foreground hover:text-saida"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Barbeiros e comissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-40 flex-1 space-y-1">
              <Label>Nome</Label>
              <Input
                value={novoBarbeiro}
                onChange={(e) => setNovoBarbeiro(e.target.value)}
                placeholder="Ex.: Diego"
                className="h-12"
              />
            </div>
            <div className="space-y-1">
              <Label>Comissão (%)</Label>
              <Input
                inputMode="decimal"
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
                className="h-12 w-28"
              />
            </div>
            <Button className="h-12" onClick={adicionarBarbeiro}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {barbeiros.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm">
                  {b.nome} — {b.comissao}%
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Excluir ${b.nome}`}
                  onClick={async () => {
                    try {
                      await excluirBarbeiro.mutateAsync(b.id);
                      toast.success("Barbeiro excluído.");
                    } catch {
                      toast.error("Não foi possível excluir.");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-saida" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="h-12 w-full" onClick={sair}>
        <LogOut className="mr-2 h-4 w-4" /> Sair da conta
      </Button>
    </div>
  );
}
