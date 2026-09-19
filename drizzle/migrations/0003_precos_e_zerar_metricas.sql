ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS preco numeric(10,2);

DELETE FROM public.movimentacoes;

DELETE FROM public.categorias WHERE tipo = 'entrada';

INSERT INTO public.categorias (user_id, nome, tipo, preco)
SELECT u.id, s.nome, 'entrada'::tipo_movimentacao, s.preco
FROM auth.users u
CROSS JOIN (VALUES
  ('Corte', 30.00),
  ('Corte e sobrancelha', 35.00),
  ('Corte e barba', 50.00),
  ('Corte e cavanhaque', 40.00),
  ('Pigmentação', 50.00)
) AS s(nome, preco)
ON CONFLICT (user_id, nome, tipo) DO UPDATE SET preco = EXCLUDED.preco;

CREATE OR REPLACE FUNCTION public.semear_dados_iniciais()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.categorias (user_id, nome, tipo, preco)
  SELECT uid, s.nome, 'entrada'::tipo_movimentacao, s.preco
  FROM (VALUES
    ('Corte', 30.00),
    ('Corte e sobrancelha', 35.00),
    ('Corte e barba', 50.00),
    ('Corte e cavanhaque', 40.00),
    ('Pigmentação', 50.00)
  ) AS s(nome, preco)
  ON CONFLICT (user_id, nome, tipo) DO NOTHING;

  INSERT INTO public.categorias (user_id, nome, tipo)
  SELECT uid, s.nome, 'saida'::tipo_movimentacao
  FROM (VALUES
    ('Aluguel'), ('Energia'), ('Água'), ('Internet'), ('Produtos'),
    ('Manutenção'), ('Marketing'), ('Impostos'), ('Comissões'), ('Outros')
  ) AS s(nome)
  ON CONFLICT (user_id, nome, tipo) DO NOTHING;

  INSERT INTO public.configuracoes (user_id, meta_mensal)
  VALUES (uid, 12000)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.semear_dados_iniciais() TO authenticated;