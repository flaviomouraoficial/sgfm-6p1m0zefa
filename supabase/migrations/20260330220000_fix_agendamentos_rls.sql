-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "allow_anon_insert" ON public.agendamentos;
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.agendamentos;

-- Criar políticas permissivas para acesso público (anon + authenticated)
-- O SELECT é necessário para que a cláusula RETURNING (usada pelo .select() no JS) funcione após o INSERT
DROP POLICY IF EXISTS "allow_public_insert" ON public.agendamentos;
CREATE POLICY "allow_public_insert" ON public.agendamentos FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_select" ON public.agendamentos;
CREATE POLICY "allow_public_select" ON public.agendamentos FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_public_update" ON public.agendamentos;
CREATE POLICY "allow_public_update" ON public.agendamentos FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Garantir que timeSlots também tenha políticas públicas para o fluxo de agendamento funcionar sem bloqueios
DROP POLICY IF EXISTS "allow_anon_select" ON public."timeSlots";
DROP POLICY IF EXISTS "allow_anon_update" ON public."timeSlots";

DROP POLICY IF EXISTS "allow_public_select_timeslots" ON public."timeSlots";
CREATE POLICY "allow_public_select_timeslots" ON public."timeSlots" FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_public_update_timeslots" ON public."timeSlots";
CREATE POLICY "allow_public_update_timeslots" ON public."timeSlots" FOR UPDATE TO public USING (true) WITH CHECK (true);
