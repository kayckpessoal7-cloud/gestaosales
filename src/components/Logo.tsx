import logo from "@/assets/logo-dsales.png";
import { cn } from "@/lib/utils";

/** Logo da D'Sales Barbearia (versão dourada, feita para o fundo escuro). */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="D'Sales Barbearia"
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
