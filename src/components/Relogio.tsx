import { useEffect, useState } from "react";

export function Relogio() {
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Cuiaba",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(agora);

  const data = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Cuiaba",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(agora);

  return (
    <div className="flex flex-col items-start min-w-0">
      <span className="text-sm font-semibold tracking-wider text-dourado-suave sm:text-base">
        {hora}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest sm:text-xs">
        {data}
      </span>
    </div>
  );
}
