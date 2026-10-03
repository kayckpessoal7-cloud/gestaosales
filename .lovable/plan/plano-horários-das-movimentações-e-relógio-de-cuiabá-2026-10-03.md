# Plano: horários das movimentações e relógio de Cuiabá

## O que será alterado
- Usar `criado_em` como o instante completo da movimentação, preservado em UTC.
- Marcar registros antigos sem horário confiável para continuarem exibindo somente a data.
- Exibir data relativa e hora (`Hoje às 14:35`) em todas as listas de movimentações, mantendo a forma de pagamento como o único trecho truncável no celular.
- Adicionar no formulário de edição campos de data e hora; novos registros começarão com a hora atual de Cuiabá e edições poderão ajustar ambas.
- Mostrar no cabeçalho móvel um relógio de Cuiabá com segundos e a data abreviada abaixo, atualizado a cada segundo.
- Centralizar os cálculos e formatos de data no fuso `America/Cuiaba`, incluindo hoje/ontem, filtros, gráficos e períodos.
- Incluir horário nas exportações CSV e PDF do histórico.

## Compatibilidade dos dados antigos
- A atualização do banco adicionará um indicador de horário conhecido.
- Registros existentes serão considerados sem horário conhecido, evitando inventar horários.
- Novos registros e registros cuja hora seja ajustada no formulário terão horário conhecido.

## Detalhes técnicos
- Banco: adicionar `hora_informada boolean not null default true`, atualizar as linhas existentes para `false` e manter `criado_em` como `timestamptz` em UTC.
- Interface: incluir `criado_em` e `hora_informada` no modelo e nas consultas; combinar data/hora escolhidas em Cuiabá e converter para ISO UTC ao salvar.
- Datas: substituir dependências do fuso do aparelho por utilitários explícitos de Cuiabá e usar aritmética UTC para datas civis.
- Validação: testar criação, edição, listas, relógio e layout móvel; confirmar que não há erros de compilação ou execução.
