ALTER TABLE public.movimentacoes
ADD COLUMN IF NOT EXISTS hora_informada boolean NOT NULL DEFAULT true;

UPDATE public.movimentacoes
SET hora_informada = false
WHERE hora_informada = true;

COMMENT ON COLUMN public.movimentacoes.hora_informada IS 'Indica se criado_em representa um horario real informado para a movimentacao; registros anteriores exibem somente a data.';