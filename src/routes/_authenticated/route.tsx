/**
 * Área protegida: só entra quem está autenticado.
 * Também monta o layout do sistema (menu lateral no computador
 * e menu inferior no celular).
 */
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import {
  BarChart3,
  Eye,
  EyeOff,
  LayoutDashboard,
  ListOrdered,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { RelogioCuiaba } from "@/components/RelogioCuiaba";
import { useOcultarValores } from "@/hooks/use-ocultar-valores";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

const MENU = [
  { titulo: "Painel", url: "/painel", icone: LayoutDashboard },
  { titulo: "Entradas", url: "/entradas", icone: TrendingUp },
  { titulo: "Saídas", url: "/saidas", icone: TrendingDown },
  { titulo: "Histórico", url: "/historico", icone: ListOrdered },
  { titulo: "Relatórios", url: "/relatorios", icone: BarChart3 },
  { titulo: "Configurações", url: "/configuracoes", icone: Settings },
] as const;

function Layout() {
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const { oculto, alternar } = useOcultarValores();

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Menu lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="flex flex-col gap-1 px-1 pb-6">
          <Logo className="h-auto w-40" />
          <p className="truncate text-xs text-muted-foreground">Controle financeiro</p>
          <RelogioCuiaba className="mt-2 text-left" />
        </div>
        <nav className="flex flex-col gap-1">
          {MENU.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                caminho === item.url
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icone className="h-5 w-5 shrink-0" />
              {item.titulo}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <button
            type="button"
            onClick={alternar}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {oculto ? <EyeOff className="h-5 w-5 shrink-0" /> : <Eye className="h-5 w-5 shrink-0" />}
            {oculto ? "Mostrar valores" : "Esconder valores"}
          </button>
        </div>
      </aside>

      {/* Cabeçalho (celular) */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <Logo className="h-9 w-auto max-w-[8.75rem]" />
        <RelogioCuiaba className="ml-auto" />
        <button
          type="button"
          onClick={alternar}
          title={oculto ? "Mostrar valores" : "Esconder valores"}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d4a63c]/40 bg-[#1c1a14] text-[#d4a63c] transition-colors duration-200 hover:bg-[#d4a63c]/10 hover:border-[#d4a63c]"
        >
          {oculto ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </header>

      <main className="px-4 pb-28 pt-4 lg:ml-60 lg:px-8 lg:pb-12 lg:pt-8">
        <Outlet />
      </main>

      {/* Menu inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-border bg-sidebar lg:hidden">
        {MENU.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
              caminho === item.url ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icone className="h-5 w-5" />
            <span className="truncate px-0.5">{item.titulo}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
