import { useEffect, useState } from "react";

import { formatarDataHoraAtualCuiaba } from "@/lib/formato";
import { cn } from "@/lib/utils";

export function RelogioCuiaba({ className }: { className?: string }) {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    const atualizar = () => setAgora(new Date());
    atualizar();
    const intervalo = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(intervalo);
  }, []);

  const exibicao = agora ? formatarDataHoraAtualCuiaba(agora) : { hora: "--:--:--", data: "---, --/--/----" };

  return (
    <div className={cn("min-w-[5.75rem] text-right tabular-nums", className)} aria-label="Horário atual em Cuiabá">
      <p className="text-sm font-semibold leading-tight text-primary">{exibicao.hora}</p>
      <p className="whitespace-nowrap text-[10px] leading-tight text-muted-foreground">{exibicao.data}</p>
    </div>
  );
}