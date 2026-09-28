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

/** Data de hoje no formato aceito pelo banco (aaaa-mm-dd), no fuso local. */
export function hojeISO(): string {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Soma (ou subtrai) dias de uma data no formato aaaa-mm-dd. */
export function somarDias(dataISO: string, dias: number): string {
  const d = new Date(`${dataISO}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Primeiro dia do mês de uma data aaaa-mm-dd. */
export function inicioDoMes(dataISO: string): string {
  return `${dataISO.slice(0, 7)}-01`;
}

/** Último dia do mês de uma data aaaa-mm-dd. */
export function fimDoMes(dataISO: string): string {
  const d = new Date(`${dataISO.slice(0, 7)}-01T12:00:00`);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana da data informada. */
export function inicioDaSemana(dataISO: string): string {
  const d = new Date(`${dataISO}T12:00:00`);
  const diaSemana = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - diaSemana);
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
 * Retorna "Hoje", "Ontem" ou a data formatada DD/MM/AAAA.
 * Compara apenas dia/mês/ano no fuso America/Cuiaba.
 */
export function formatarDataRelativa(dataISO: string): string {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Cuiaba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const hojeStr = fmt.format(new Date());
  const dataFormatada = formatarData(dataISO);
  if (dataFormatada === hojeStr) return "Hoje";

  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = fmt.format(ontem);
  if (dataFormatada === ontemStr) return "Ontem";

  return dataFormatada;
}
