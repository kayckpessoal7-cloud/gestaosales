import { cn } from "@/lib/utils";

interface Props {
  /** Texto formatado do valor, ex.: "R$ 1.200,00" */
  children: React.ReactNode;
  oculto: boolean;
  /** Máscara exibida quando oculto. Padrão: "R$ ••••••" */
  mascara?: string;
  className?: string;
}

export function ValorOcultavel({ children, oculto, mascara = "R$\u00A0••••••", className }: Props) {
  return (
    <span
      className={cn(
        "inline-block transition-opacity duration-200",
        oculto && "select-none",
        className,
      )}
    >
      {oculto ? mascara : children}
    </span>
  );
}
