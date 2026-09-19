/**
 * Página inicial: leva o proprietário para o painel (se estiver logado)
 * ou para a tela de acesso.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "D'Sales Barbearia | Controle financeiro" },
      {
        name: "description",
        content:
          "Sistema de caixa e contabilidade da D'Sales Barbearia: entradas, saídas, faturamento e relatórios.",
      },
      { property: "og:title", content: "D'Sales Barbearia | Controle financeiro" },
      {
        property: "og:description",
        content:
          "Sistema de caixa e contabilidade da D'Sales Barbearia: entradas, saídas, faturamento e relatórios.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/painel" : "/auth" });
  },
  component: () => null,
});
