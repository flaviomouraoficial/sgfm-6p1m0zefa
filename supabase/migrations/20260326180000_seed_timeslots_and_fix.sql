DO $$
BEGIN
  -- Insert dummy professionals if missing
  IF NOT EXISTS (SELECT 1 FROM public.profissionais) THEN
     INSERT INTO public.profissionais (id, nome, especialidade) 
     VALUES (gen_random_uuid()::text, 'Equipe de Atendimento', 'Consultoria');
  END IF;

  -- Insert dummy services if missing
  IF NOT EXISTS (SELECT 1 FROM public.servicos) THEN
     INSERT INTO public.servicos (id, nome, duracao_minutos, preco) 
     VALUES (gen_random_uuid()::text, 'Mentoria Estratégica', 60, 0);
  END IF;

  -- Insert some dummy timeslots to ensure available dates show up on the public scheduling page
  INSERT INTO public."timeSlots" (id, date, time, description, "isBooked") 
  VALUES 
    (gen_random_uuid()::text, to_char(NOW() + INTERVAL '1 day', 'YYYY-MM-DD'), '10:00', 'Mentoria Estratégica', false),
    (gen_random_uuid()::text, to_char(NOW() + INTERVAL '1 day', 'YYYY-MM-DD'), '14:00', 'Mentoria Estratégica', false),
    (gen_random_uuid()::text, to_char(NOW() + INTERVAL '2 days', 'YYYY-MM-DD'), '09:00', 'Acompanhamento', false),
    (gen_random_uuid()::text, to_char(NOW() + INTERVAL '3 days', 'YYYY-MM-DD'), '15:00', 'Reunião de Alinhamento', false)
  ON CONFLICT DO NOTHING;
END $$;
