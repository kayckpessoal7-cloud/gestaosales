-- Tipos base do sistema financeiro da barbearia
CREATE TYPE public.tipo_movimentacao AS ENUM ('entrada', 'saida');
CREATE TYPE public.tipo_despesa AS ENUM ('fixa', 'variavel');

-- Categorias (entradas e saídas), personalizáveis pelo usuário
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  tipo public.tipo_movimentacao NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias proprias" ON public.categorias FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Barbeiros, com percentual de comissão
CREATE TABLE public.barbeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  comissao NUMERIC(5,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.barbeiros TO authenticated;
GRANT ALL ON public.barbeiros TO service_role;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "barbeiros proprios" ON public.barbeiros FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Movimentações de caixa (entradas e saídas)
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  tipo public.tipo_movimentacao NOT NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL,
  categoria TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  descricao TEXT,
  barbeiro_id UUID REFERENCES public.barbeiros(id) ON DELETE SET NULL,
  despesa_tipo public.tipo_despesa,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  dia_vencimento SMALLINT CHECK (dia_vencimento BETWEEN 1 AND 31),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX movimentacoes_user_data_idx ON public.movimentacoes (user_id, data DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes TO authenticated;
GRANT ALL ON public.movimentacoes TO service_role;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movimentacoes proprias" ON public.movimentacoes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Configurações do negócio (meta mensal de faturamento)
CREATE TABLE public.configuracoes (
  user_id UUID PRIMARY KEY DEFAULT auth.uid(),
  meta_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "configuracoes proprias" ON public.configuracoes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cria categorias padrão, barbeiros e dados de exemplo na primeira entrada do usuário
CREATE OR REPLACE FUNCTION public.semear_dados_iniciais()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  b_ids UUID[];
  dia DATE;
  i INT;
  cats_entrada TEXT[] := ARRAY['Corte','Barba','Corte + Barba','Sobrancelha','Pigmentação','Química','Venda de produtos','Outros'];
  cats_saida TEXT[] := ARRAY['Aluguel','Energia','Água','Internet','Produtos e insumos','Manutenção de equipamentos','Salários/comissões','Marketing','Impostos','Outros'];
  formas TEXT[] := ARRAY['Dinheiro','Pix','Cartão de débito','Cartão de crédito'];
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.categorias WHERE user_id = uid) THEN RETURN; END IF;

  INSERT INTO public.categorias (user_id, nome, tipo)
  SELECT uid, unnest(cats_entrada), 'entrada';
  INSERT INTO public.categorias (user_id, nome, tipo)
  SELECT uid, unnest(cats_saida), 'saida';

  INSERT INTO public.barbeiros (user_id, nome, comissao)
  VALUES (uid, 'Diego', 50), (uid, 'Rafael', 40), (uid, 'Lucas', 40)
  RETURNING id INTO b_ids;

  SELECT array_agg(id) INTO b_ids FROM public.barbeiros WHERE user_id = uid;

  INSERT INTO public.configuracoes (user_id, meta_mensal) VALUES (uid, 12000)
  ON CONFLICT (user_id) DO NOTHING;

  -- Entradas de exemplo dos últimos 60 dias
  FOR dia IN SELECT generate_series(CURRENT_DATE - 59, CURRENT_DATE, '1 day')::date LOOP
    FOR i IN 1..(3 + floor(random() * 5)::int) LOOP
      INSERT INTO public.movimentacoes (user_id, tipo, valor, data, categoria, forma_pagamento, descricao, barbeiro_id)
      VALUES (
        uid, 'entrada',
        (25 + floor(random() * 70))::numeric,
        dia,
        cats_entrada[1 + floor(random() * 7)::int],
        formas[1 + floor(random() * 4)::int],
        'Atendimento de exemplo',
        b_ids[1 + floor(random() * array_length(b_ids, 1))::int]
      );
    END LOOP;
  END LOOP;

  -- Despesas fixas dos últimos 2 meses
  FOR i IN 0..1 LOOP
    INSERT INTO public.movimentacoes (user_id, tipo, valor, data, categoria, forma_pagamento, descricao, despesa_tipo, recorrente, dia_vencimento)
    VALUES
      (uid, 'saida', 1800, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '4 day')::date, 'Aluguel', 'Pix', 'Aluguel da loja', 'fixa', true, 5),
      (uid, 'saida', 320, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '9 day')::date, 'Energia', 'Pix', 'Conta de luz', 'fixa', true, 10),
      (uid, 'saida', 120, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '11 day')::date, 'Internet', 'Cartão de crédito', 'Internet fibra', 'fixa', true, 12),
      (uid, 'saida', 95, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '14 day')::date, 'Água', 'Pix', 'Conta de água', 'fixa', true, 15);
  END LOOP;

  -- Despesas variáveis de exemplo
  FOR i IN 1..18 LOOP
    INSERT INTO public.movimentacoes (user_id, tipo, valor, data, categoria, forma_pagamento, descricao, despesa_tipo)
    VALUES (
      uid, 'saida',
      (40 + floor(random() * 300))::numeric,
      CURRENT_DATE - floor(random() * 59)::int,
      cats_saida[5 + floor(random() * 6)::int],
      formas[1 + floor(random() * 4)::int],
      'Despesa de exemplo',
      'variavel'
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.semear_dados_iniciais() TO authenticated;