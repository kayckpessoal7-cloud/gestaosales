/**
 * Formulário rápido de entrada ou saída.
 * Pensado para cadastrar uma movimentação em poucos segundos,
 * com teclado numérico no celular e validação simples.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FORMAS_PAGAMENTO,
  useBarbeiros,
  useCategorias,
  useSalvarMovimentacao,
  type Movimentacao,
  type TipoDespesa,
  type TipoMovimentacao,
} from "@/lib/dados";
import { formatarMoeda, hojeISO, valorParaNumero, formatarData } from "@/lib/formato";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  tipo: TipoMovimentacao;
  /** Movimentação existente quando estiver editando. */
  movimentacao?: Movimentacao | null;
}

const SEM_BARBEIRO = "nenhum";

export function MovimentacaoDialog({ aberto, aoFechar, tipo, movimentacao }: Props) {
  const { data: categorias = [] } = useCategorias();
  const { data: barbeiros = [] } = useBarbeiros();
  const salvar = useSalvarMovimentacao();

  const [valor, setValor] = useState("");
  const [data, setData] = useState(hojeISO());
  const [categoria, setCategoria] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>(FORMAS_PAGAMENTO[0]);
  const [descricao, setDescricao] = useState("");
  const [barbeiroId, setBarbeiroId] = useState<string>(SEM_BARBEIRO);
  const [despesaTipo, setDespesaTipo] = useState<TipoDespesa>("variavel");
  const [recorrente, setRecorrente] = useState(false);
  const [diaVencimento, setDiaVencimento] = useState("5");

  const tipoAtual = movimentacao?.tipo ?? tipo;
  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipoAtual);
  const categoriaSelecionada = categoriasDoTipo.find((c) => c.nome === categoria);
  /** Em entradas, o valor vem da tabela de preços da categoria escolhida. */
  const precoTabela =
    tipoAtual === "entrada" && categoriaSelecionada?.preco != null
      ? Number(categoriaSelecionada.preco)
      : null;
  const usaTabela = tipoAtual === "entrada" && (categoria === "" || precoTabela != null);

  // Preenche o formulário ao abrir (novo cadastro ou edição)
  useEffect(() => {
    if (!aberto) return;
    if (movimentacao) {
      setValor(String(movimentacao.valor).replace(".", ","));
      setData(movimentacao.data);
      setCategoria(movimentacao.categoria);
      setFormaPagamento(movimentacao.forma_pagamento);
      setDescricao(movimentacao.descricao ?? "");
      setBarbeiroId(movimentacao.barbeiro_id ?? SEM_BARBEIRO);
      setDespesaTipo(movimentacao.despesa_tipo ?? "variavel");
      setRecorrente(movimentacao.recorrente);
      setDiaVencimento(String(movimentacao.dia_vencimento ?? 5));
    } else {
      setValor("");
      setData(hojeISO());
      setCategoria("");
      setFormaPagamento(FORMAS_PAGAMENTO[0]);
      setDescricao("");
      setBarbeiroId(SEM_BARBEIRO);
      setDespesaTipo("variavel");
      setRecorrente(false);
      setDiaVencimento("5");
    }
  }, [aberto, movimentacao]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();

    if (!categoria) {
      toast.error(tipoAtual === "entrada" ? "Escolha o serviço." : "Escolha uma categoria.");
      return;
    }
    const numero = precoTabela != null ? precoTabela : valorParaNumero(valor);
    if (Number.isNaN(numero) || numero <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      toast.error("Informe uma data válida.");
      return;
    }

    try {
      await salvar.mutateAsync({
        ...(movimentacao ? { id: movimentacao.id } : {}),
        dados: {
          tipo: tipoAtual,
          valor: Number(numero.toFixed(2)),
          data,
          categoria,
          forma_pagamento: formaPagamento,
          descricao: descricao.trim() || null,
          barbeiro_id: tipoAtual === "entrada" && barbeiroId !== SEM_BARBEIRO ? barbeiroId : null,
          despesa_tipo: tipoAtual === "saida" ? despesaTipo : null,
          recorrente: tipoAtual === "saida" ? recorrente : false,
          dia_vencimento:
            tipoAtual === "saida" && recorrente ? Number(diaVencimento) || null : null,
        },
      });
      toast.success(
        movimentacao
          ? "Movimentação atualizada com sucesso!"
          : tipoAtual === "entrada"
            ? "Entrada registrada com sucesso!"
            : "Saída registrada com sucesso!",
      );
      aoFechar();
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={tipoAtual === "entrada" ? "text-entrada" : "text-saida"}>
            {movimentacao ? "Editar" : tipoAtual === "entrada" ? "Nova entrada" : "Nova saída"}
          </DialogTitle>
          <DialogDescription>
            {tipoAtual === "entrada"
              ? "Registre um recebimento da barbearia."
              : "Registre uma despesa da barbearia."}
            {movimentacao?.criado_em && (
              <span className="block mt-2 font-medium text-foreground/70">
                Registrado em: {formatarData(movimentacao.data, movimentacao.criado_em)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label>{tipoAtual === "entrada" ? "Serviço" : "Categoria"}</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue
                  placeholder={
                    tipoAtual === "entrada" ? "Escolha o serviço" : "Escolha a categoria"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categoriasDoTipo.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                    {c.preco != null ? ` — ${formatarMoeda(Number(c.preco))}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {usaTabela ? (
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs uppercase text-muted-foreground">Valor do serviço</p>
              <p className="text-2xl font-bold text-entrada">
                {precoTabela != null ? formatarMoeda(precoTabela) : "—"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-14 text-2xl font-semibold"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          {tipoAtual === "entrada" && (
            <div className="space-y-2">
              <Label>Barbeiro (opcional)</Label>
              <Select value={barbeiroId} onValueChange={setBarbeiroId}>
                <SelectTrigger className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_BARBEIRO}>Não informar</SelectItem>
                  {barbeiros.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipoAtual === "saida" && (
            <>
              <div className="space-y-2">
                <Label>Tipo de despesa</Label>
                <Select
                  value={despesaTipo}
                  onValueChange={(v) => setDespesaTipo(v as TipoDespesa)}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variavel">Variável</SelectItem>
                    <SelectItem value="fixa">Fixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Despesa recorrente</p>
                  <p className="text-xs text-muted-foreground">
                    Recebe lembrete de vencimento no painel
                  </p>
                </div>
                <Switch checked={recorrente} onCheckedChange={setRecorrente} />
              </div>

              {recorrente && (
                <div className="space-y-2">
                  <Label htmlFor="venc">Dia do vencimento</Label>
                  <Input
                    id="venc"
                    inputMode="numeric"
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    className="h-12"
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value.slice(0, 300))}
              placeholder="Ex.: cliente do plano mensal"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="h-12 flex-1" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" className="h-12 flex-1" disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
