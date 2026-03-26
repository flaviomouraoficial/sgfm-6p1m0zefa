DO $$
BEGIN
  -- Seed default service if none exists
  IF NOT EXISTS (SELECT 1 FROM public.servicos) THEN
     INSERT INTO public.servicos (id, nome, duracao_minutos, preco) 
     VALUES (gen_random_uuid()::text, 'Mentoria Estratégica', 60, 0);
  END IF;

  -- Seed default professional if none exists
  IF NOT EXISTS (SELECT 1 FROM public.profissionais) THEN
     INSERT INTO public.profissionais (id, nome, especialidade) 
     VALUES (gen_random_uuid()::text, 'Equipe de Atendimento', 'Consultoria');
  END IF;
END $$;
