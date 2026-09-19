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
  VALUES (uid, 'Diego', 50), (uid, 'Rafael', 40), (uid, 'Lucas', 40);

  SELECT array_agg(id) INTO b_ids FROM public.barbeiros WHERE user_id = uid;

  INSERT INTO public.configuracoes (user_id, meta_mensal) VALUES (uid, 12000)
  ON CONFLICT (user_id) DO NOTHING;

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

  FOR i IN 0..1 LOOP
    INSERT INTO public.movimentacoes (user_id, tipo, valor, data, categoria, forma_pagamento, descricao, despesa_tipo, recorrente, dia_vencimento)
    VALUES
      (uid, 'saida', 1800, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '4 day')::date, 'Aluguel', 'Pix', 'Aluguel da loja', 'fixa', true, 5),
      (uid, 'saida', 320, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '9 day')::date, 'Energia', 'Pix', 'Conta de luz', 'fixa', true, 10),
      (uid, 'saida', 120, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '11 day')::date, 'Internet', 'Cartão de crédito', 'Internet fibra', 'fixa', true, 12),
      (uid, 'saida', 95, (date_trunc('month', CURRENT_DATE) - (i || ' month')::interval + interval '14 day')::date, 'Água', 'Pix', 'Conta de água', 'fixa', true, 15);
  END LOOP;

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