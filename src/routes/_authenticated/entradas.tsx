/**
 * Tela de entradas (recebimentos).
 */
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { ListaMovimentacoes } from "@/components/ListaMovimentacoes";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { noPeriodo, somar, useMovimentacoes } from "@/lib/dados";
import { formatarMoeda, hojeISO, inicioDoMes } from "@/lib/formato";
import { useOcultarValores } from "@/hooks/use-ocultar-valores";

export const Route = createFileRoute("/_authenticated/entradas")({
  head: () => ({
    meta: [
      { title: "Entradas | D'Sales Barbearia" },
      {
        name: "description",
        content: "Registro de recebimentos por serviço, forma de pagamento e barbeiro.",
      },
      { property: "og:title", content: "Entradas | D'Sales Barbearia" },
      {
        property: "og:description",
        content: "Registro de recebimentos por serviço, forma de pagamento e barbeiro.",
      },
    ],
  }),
  component: Entradas,
});

function Entradas() {
  const { data: movimentacoes = [] } = useMovimentacoes();
  const [aberto, setAberto] = useState(false);
  const { oculto } = useOcultarValores();
  const hoje = hojeISO();

  const entradas = useMemo(
    () => movimentacoes.filter((m) => m.tipo === "entrada"),
    [movimentacoes],
  );
  const totalHoje = somar(noPeriodo(entradas, hoje, hoje));
  const totalMes = somar(noPeriodo(entradas, inicioDoMes(hoje), hoje));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-xl font-bold sm:text-2xl">Entradas</h1>
        <Button
          onClick={() => setAberto(true)}
          className="h-12 shrink-0 bg-entrada text-background hover:bg-entrada/90"
        >
          <Plus className="mr-1 h-5 w-5" /> Nova entrada
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase text-muted-foreground">Recebido hoje</p>
            <p className="text-xl font-bold text-entrada transition-opacity duration-200">
              {oculto ? "R$\u00A0••••••" : formatarMoeda(totalHoje)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase text-muted-foreground">Recebido no mês</p>
            <p className="text-xl font-bold text-entrada transition-opacity duration-200">
              {oculto ? "R$\u00A0••••••" : formatarMoeda(totalMes)}
            </p>
          </CardContent>
        </Card>
      </div>

      <ListaMovimentacoes itens={entradas.slice(0, 100)} />

      <MovimentacaoDialog aberto={aberto} tipo="entrada" aoFechar={() => setAberto(false)} />
    </div>
  );
}
