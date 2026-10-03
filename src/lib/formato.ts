/**
 * Funções de formatação brasileira (moeda em R$ e datas dd/mm/aaaa).
 */

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(valor) ? valor : 0);
}

/** Recebe "2026-09-19" (data do banco) e devolve "19/09/2026". */
export function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

export const FUSO_CUIABA = "America/Cuiaba";

function partesEmCuiaba(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_CUIABA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const obter = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "00";
  return {
    ano: obter("year"),
    mes: obter("month"),
    dia: obter("day"),
    hora: obter("hour"),
    minuto: obter("minute"),
    segundo: obter("second"),
  };
}

/** Data de hoje no formato aceito pelo banco (aaaa-mm-dd), no fuso de Cuiabá. */
export function hojeISO(): string {
  const p = partesEmCuiaba(new Date());
  return `${p.ano}-${p.mes}-${p.dia}`;
}

/** Soma (ou subtrai) dias de uma data no formato aaaa-mm-dd. */
export function somarDias(dataISO: string, dias: number): string {
  const d = new Date(`${dataISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Primeiro dia do mês de uma data aaaa-mm-dd. */
export function inicioDoMes(dataISO: string): string {
  return `${dataISO.slice(0, 7)}-01`;
}

/** Último dia do mês de uma data aaaa-mm-dd. */
export function fimDoMes(dataISO: string): string {
  const d = new Date(`${dataISO.slice(0, 7)}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana da data informada. */
export function inicioDaSemana(dataISO: string): string {
  const d = new Date(`${dataISO}T12:00:00Z`);
  const diaSemana = (d.getUTCDay() + 6) % 7; // 0 = segunda
  d.setUTCDate(d.getUTCDate() - diaSemana);
  return d.toISOString().slice(0, 10);
}

/** Converte o texto digitado no campo de valor em número (aceita vírgula). */
export function valorParaNumero(texto: string): number {
  const limpo = texto.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : NaN;
}

/** Variação percentual entre dois períodos. */
export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return ((atual - anterior) / anterior) * 100;
}

export function formatarPercentual(valor: number): string {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Rótulo curto de data para gráficos (dd/mm). */
export function rotuloCurto(dataISO: string): string {
  return dataISO.slice(8, 10) + "/" + dataISO.slice(5, 7);
}

/**
 * Retorna "Hoje", "Ontem", nome do dia da semana (2–3 dias atrás)
 * ou a data formatada DD/MM/AAAA (4+ dias atrás).
 * Compara apenas dia/mês/ano no fuso America/Cuiaba.
 */
export function formatarDataRelativa(dataISO: string): string {
  const cuiabaStr = hojeISO();
  const dataFormatada = formatarData(dataISO);

  const dHoje = new Date(`${cuiabaStr}T00:00:00Z`);
  const dData = new Date(`${dataISO}T00:00:00Z`);
  const diffDias = Math.round((dHoje.getTime() - dData.getTime()) / 86400000);

  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "Ontem";
  if (diffDias >= 2 && diffDias <= 3) {
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return diasSemana[dData.getUTCDay()] ?? dataFormatada;
  }

  return dataFormatada;
}

/** Hora HH:mm de um timestamp UTC, convertida para Cuiabá. */
export function formatarHoraCuiaba(timestamp: string): string {
  const data = new Date(timestamp);
  if (Number.isNaN(data.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_CUIABA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(data);
}

export function formatarMovimentacaoDataHora(
  dataISO: string,
  criadoEm: string,
  horaInformada: boolean,
  relativa = false,
): string {
  const data = relativa ? formatarDataRelativa(dataISO) : formatarData(dataISO);
  if (!horaInformada) return data;
  const hora = formatarHoraCuiaba(criadoEm);
  return hora ? `${data} às ${hora}` : data;
}

/** Data e hora atuais nos campos do formulário, sempre em Cuiabá. */
export function agoraCuiaba(): { data: string; hora: string } {
  const p = partesEmCuiaba(new Date());
  return { data: `${p.ano}-${p.mes}-${p.dia}`, hora: `${p.hora}:${p.minuto}` };
}

/** Converte uma data/hora civil de Cuiabá para o timestamp UTC armazenado no banco. */
export function dataHoraCuiabaParaUTC(dataISO: string, hora: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const [horas, minutos] = hora.split(":").map(Number);
  let instante = Date.UTC(ano, mes - 1, dia, horas, minutos);

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    const p = partesEmCuiaba(new Date(instante));
    const exibidoComoUTC = Date.UTC(
      Number(p.ano), Number(p.mes) - 1, Number(p.dia),
      Number(p.hora), Number(p.minuto), Number(p.segundo),
    );
    instante += Date.UTC(ano, mes - 1, dia, horas, minutos) - exibidoComoUTC;
  }

  return new Date(instante).toISOString();
}

export function formatarDataHoraAtualCuiaba(data: Date): { hora: string; data: string } {
  const hora = data.toLocaleTimeString("pt-BR", {
    timeZone: FUSO_CUIABA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const dataFormatada = data.toLocaleDateString("pt-BR", {
    timeZone: FUSO_CUIABA,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace("-feira", "");
  return { hora, data: dataFormatada };
}
