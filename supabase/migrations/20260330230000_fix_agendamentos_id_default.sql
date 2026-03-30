-- Garante que a coluna id receba um UUID automaticamente caso não seja enviado no insert
ALTER TABLE public.agendamentos ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
