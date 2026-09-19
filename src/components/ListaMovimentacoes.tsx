/**
 * Lista de movimentações com ações de editar e excluir (com confirmação).
 */
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { useBarbeiros, useExcluirMovimentacao, type Movimentacao } from "@/lib/dados";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

export function ListaMovimentacoes({ itens }: { itens: Movimentacao[] }) {
  const { data: barbeiros = [] } = useBarbeiros();
  const excluir = useExcluirMovimentacao();
  const [editando, setEditando] = useState<Movimentacao | null>(null);
  const [excluindo, setExcluindo] = useState<Movimentacao | null>(null);

  const nomeBarbeiro = (id: string | null) => barbeiros.find((b) => b.id === id)?.nome;

  async function confirmarExclusao() {
    if (!excluindo) return;
    try {
      await excluir.mutateAsync(excluindo.id);
      toast.success("Movimentação excluída.");
    } catch {
      toast.error("Não foi possível excluir.");
    } finally {
      setExcluindo(null);
    }
  }

  if (itens.length === 0) {
    return (
      <p className="rounded-lg bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhuma movimentação encontrada.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {itens.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card px-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{m.categoria}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatarData(m.data)} · {m.forma_pagamento}
                {nomeBarbeiro(m.barbeiro_id) ? ` · ${nomeBarbeiro(m.barbeiro_id)}` : ""}
                {m.despesa_tipo ? ` · ${m.despesa_tipo === "fixa" ? "Fixa" : "Variável"}` : ""}
              </p>
              {m.descricao && (
                <p className="truncate text-xs text-muted-foreground/80">{m.descricao}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span
                className={cn(
                  "mr-1 text-sm font-bold",
                  m.tipo === "entrada" ? "text-entrada" : "text-saida",
                )}
              >
                {m.tipo === "entrada" ? "+" : "−"} {formatarMoeda(m.valor)}
              </span>
              <Button size="icon" variant="ghost" onClick={() => setEditando(m)} aria-label="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setExcluindo(m)}
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4 text-saida" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <MovimentacaoDialog
        aberto={editando !== null}
        tipo={editando?.tipo ?? "entrada"}
        movimentacao={editando}
        aoFechar={() => setEditando(null)}
      />

      <AlertDialog open={excluindo !== null} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              {excluindo &&
                `${excluindo.categoria} — ${formatarMoeda(excluindo.valor)} em ${formatarData(excluindo.data)}. Essa ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
