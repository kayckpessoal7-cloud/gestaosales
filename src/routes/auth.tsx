/**
 * Tela de acesso do proprietário (e-mail e senha).
 * Nenhuma informação financeira aparece antes do login.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { semearDadosIniciais } from "@/lib/dados";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | D'Sales Barbearia" },
      {
        name: "description",
        content: "Acesso do proprietário ao controle financeiro da D'Sales Barbearia.",
      },
      { property: "og:title", content: "Entrar | D'Sales Barbearia" },
      {
        property: "og:description",
        content: "Acesso do proprietário ao controle financeiro da D'Sales Barbearia.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Se já estiver logado, vai direto para o painel
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navegar({ to: "/painel", replace: true });
    });
  }, [navegar]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!email.trim() || !senha) {
      toast.error("Preencha e-mail e senha.");
      return;
    }

    setCarregando(true);
    try {
      // Somente o proprietário entra — novos cadastros estão bloqueados no sistema
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) throw error;


      // Na primeira entrada cria as categorias padrão e os dados de exemplo
      await semearDadosIniciais();
      toast.success("Bem-vindo à D'Sales!");
      navegar({ to: "/painel", replace: true });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "";
      toast.error(
        mensagem.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : mensagem.includes("already registered")
            ? "Esse e-mail já tem conta. Use a opção Entrar."
            : "Não foi possível continuar. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 borda-dourada">
        <div className="flex flex-col items-center gap-3 pb-6 text-center">
          <Logo className="h-auto w-56" />
          <h1 className="sr-only">D'Sales Barbearia</h1>
          <p className="text-sm text-muted-foreground">Controle financeiro do proprietário</p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••"
              className="h-12"
            />
          </div>

          <Button type="submit" className="h-12 w-full text-base" disabled={carregando}>
            {carregando ? "Aguarde..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Área privada — acesso apenas do proprietário.
        </p>
      </div>
    </div>
  );
}
