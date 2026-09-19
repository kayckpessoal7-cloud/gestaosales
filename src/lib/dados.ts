/**
 * Camada de dados: tipos, constantes e consultas ao banco (Lovable Cloud).
 * Todas as consultas rodam no navegador com o usuário autenticado,
 * protegidas por políticas de acesso (cada conta vê apenas seus dados).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoMovimentacao = "entrada" | "saida";
export type TipoDespesa = "fixa" | "variavel";

export interface Movimentacao {
  id: string;
  tipo: TipoMovimentacao;
  valor: number;
  data: string; // aaaa-mm-dd
  categoria: string;
  forma_pagamento: string;
  descricao: string | null;
  barbeiro_id: string | null;
  despesa_tipo: TipoDespesa | null;
  recorrente: boolean;
  dia_vencimento: number | null;
}

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoMovimentacao;
  /** Preço do serviço (apenas categorias de entrada). */
  preco: number | null;
}

export interface Barbeiro {
  id: string;
  nome: string;
  comissao: number;
  ativo: boolean;
}

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Pix",
  "Cartão de débito",
  "Cartão de crédito",
] as const;

/* ---------------------------------- Movimentações --------------------------------- */

export function useMovimentacoes() {
  return useQuery({
    queryKey: ["movimentacoes"],
    queryFn: async (): Promise<Movimentacao[]> => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select(
          "id, tipo, valor, data, categoria, forma_pagamento, descricao, barbeiro_id, despesa_tipo, recorrente, dia_vencimento",
        )
        .order("data", { ascending: false })
        .order("criado_em", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []).map((m) => ({ ...m, valor: Number(m.valor) })) as Movimentacao[];
    },
  });
}

export type NovaMovimentacao = Omit<Movimentacao, "id">;

export function useSalvarMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: NovaMovimentacao }) => {
      if (id) {
        const { error } = await supabase.from("movimentacoes").update(dados).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("movimentacoes").insert(dados);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movimentacoes"] }),
  });
}

export function useExcluirMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("movimentacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movimentacoes"] }),
  });
}

/* ------------------------------------ Categorias ----------------------------------- */

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome, tipo, preco")
        .order("nome");
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        preco: c.preco == null ? null : Number(c.preco),
      })) as Categoria[];
    },
  });
}

export function useSalvarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      nome,
      tipo,
      preco,
    }: {
      id?: string;
      nome: string;
      tipo: TipoMovimentacao;
      preco?: number | null;
    }) => {
      const precoFinal: number | null = preco ?? null;
      if (id) {
        const { error } = await supabase
          .from("categorias")
          .update({ nome, preco: precoFinal })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categorias")
          .insert({ nome, tipo, preco: precoFinal });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}

export function useExcluirCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categorias"] }),
  });
}

/* ------------------------------------ Barbeiros ------------------------------------ */

export function useBarbeiros() {
  return useQuery({
    queryKey: ["barbeiros"],
    queryFn: async (): Promise<Barbeiro[]> => {
      const { data, error } = await supabase
        .from("barbeiros")
        .select("id, nome, comissao, ativo")
        .order("nome");
      if (error) throw error;
      return (data ?? []).map((b) => ({ ...b, comissao: Number(b.comissao) })) as Barbeiro[];
    },
  });
}

export function useSalvarBarbeiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      nome,
      comissao,
    }: {
      id?: string;
      nome: string;
      comissao: number;
    }) => {
      if (id) {
        const { error } = await supabase.from("barbeiros").update({ nome, comissao }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("barbeiros").insert({ nome, comissao });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barbeiros"] }),
  });
}

export function useExcluirBarbeiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbeiros").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barbeiros"] }),
  });
}

/* ---------------------------------- Configurações ---------------------------------- */

export function useConfiguracoes() {
  return useQuery({
    queryKey: ["configuracoes"],
    queryFn: async (): Promise<{ meta_mensal: number }> => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("meta_mensal")
        .maybeSingle();
      if (error) throw error;
      return { meta_mensal: Number(data?.meta_mensal ?? 0) };
    },
  });
}

export function useSalvarMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meta: number) => {
      const { data: sessao } = await supabase.auth.getUser();
      const userId = sessao.user?.id;
      if (!userId) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("configuracoes")
        .upsert({ user_id: userId, meta_mensal: meta, atualizado_em: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["configuracoes"] }),
  });
}

/* ------------------------------------- Auxiliares ---------------------------------- */

/** Cria categorias padrão e dados de exemplo na primeira entrada do proprietário. */
export async function semearDadosIniciais() {
  await supabase.rpc("semear_dados_iniciais");
}

/** Soma o valor de uma lista de movimentações. */
export function somar(lista: Movimentacao[]): number {
  return lista.reduce((total, m) => total + m.valor, 0);
}

/** Filtra movimentações por intervalo de datas (inclusive). */
export function noPeriodo(lista: Movimentacao[], de: string, ate: string): Movimentacao[] {
  return lista.filter((m) => m.data >= de && m.data <= ate);
}
