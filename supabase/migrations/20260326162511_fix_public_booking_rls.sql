DO $$ 
BEGIN

  -- 1. Fix public access for agendamentos (needed because of .select() after insert)
  DROP POLICY IF EXISTS "Public SELECT agendamentos" ON public.agendamentos;
  CREATE POLICY "Public SELECT agendamentos" ON public.agendamentos FOR SELECT USING (true);

  -- 2. Create timeSlots table
  CREATE TABLE IF NOT EXISTS public."timeSlots" (
    id text PRIMARY KEY,
    date text NOT NULL,
    time text NOT NULL,
    description text,
    "isBooked" boolean DEFAULT false,
    "menteeName" text,
    "menteeEmail" text,
    "menteePhone" text,
    "menteeCompany" text,
    service text,
    professional text,
    "servico_id" text,
    "profissional_id" text,
    status text,
    "cliente_nome" text,
    "cliente_email" text,
    "cliente_telefone" text,
    "createdAt" text
  );

  ALTER TABLE public."timeSlots" ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public SELECT timeSlots" ON public."timeSlots";
  CREATE POLICY "Public SELECT timeSlots" ON public."timeSlots" FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Public UPDATE timeSlots" ON public."timeSlots";
  CREATE POLICY "Public UPDATE timeSlots" ON public."timeSlots" FOR UPDATE USING (true);

  DROP POLICY IF EXISTS "Auth ALL timeSlots" ON public."timeSlots";
  CREATE POLICY "Auth ALL timeSlots" ON public."timeSlots" FOR ALL USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Auth INSERT timeSlots" ON public."timeSlots";
  CREATE POLICY "Auth INSERT timeSlots" ON public."timeSlots" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Auth DELETE timeSlots" ON public."timeSlots";
  CREATE POLICY "Auth DELETE timeSlots" ON public."timeSlots" FOR DELETE USING (auth.role() = 'authenticated');

  -- 3. Create settings_store table
  CREATE TABLE IF NOT EXISTS public.settings_store (
    id text PRIMARY KEY,
    data jsonb NOT NULL DEFAULT '{}'::jsonb
  );
  ALTER TABLE public.settings_store ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public SELECT settings_store" ON public.settings_store;
  CREATE POLICY "Public SELECT settings_store" ON public.settings_store FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Auth ALL settings_store" ON public.settings_store;
  CREATE POLICY "Auth ALL settings_store" ON public.settings_store FOR ALL USING (auth.role() = 'authenticated');

  -- 4. Create core application tables
  CREATE TABLE IF NOT EXISTS public.transactions (
    id text PRIMARY KEY,
    description text NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    date text NOT NULL,
    "entryDate" text,
    classification text,
    category text,
    status text NOT NULL,
    company text,
    bank text,
    service text,
    "paymentMethod" text,
    performer text,
    client text,
    supplier text,
    "paymentLink" text,
    attachments jsonb,
    "recurringGroupId" text,
    recurrence jsonb,
    "updatedAt" text,
    "createdAt" text
  );
  ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Auth ALL transactions" ON public.transactions;
  CREATE POLICY "Auth ALL transactions" ON public.transactions FOR ALL USING (auth.role() = 'authenticated');

  CREATE TABLE IF NOT EXISTS public.deals (
    id text PRIMARY KEY,
    title text NOT NULL,
    "clientName" text NOT NULL,
    value numeric NOT NULL,
    stage text NOT NULL,
    phone text,
    email text,
    notes text,
    "createdAt" text
  );
  ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Auth ALL deals" ON public.deals;
  CREATE POLICY "Auth ALL deals" ON public.deals FOR ALL USING (auth.role() = 'authenticated');

  CREATE TABLE IF NOT EXISTS public.mentees (
    id text PRIMARY KEY,
    name text NOT NULL,
    company text NOT NULL,
    "contractValue" numeric NOT NULL,
    "totalSessions" integer NOT NULL,
    status text NOT NULL,
    phone text,
    email text,
    sessions jsonb,
    "emailLogs" jsonb,
    attachments jsonb,
    "createdAt" text
  );
  ALTER TABLE public.mentees ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Auth ALL mentees" ON public.mentees;
  CREATE POLICY "Auth ALL mentees" ON public.mentees FOR ALL USING (auth.role() = 'authenticated');

  CREATE TABLE IF NOT EXISTS public.proposals (
    id text PRIMARY KEY,
    title text NOT NULL,
    "leadId" text NOT NULL,
    value numeric NOT NULL,
    "expirationDate" text NOT NULL,
    description text,
    status text NOT NULL,
    "createdAt" text
  );
  ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Auth ALL proposals" ON public.proposals;
  CREATE POLICY "Auth ALL proposals" ON public.proposals FOR ALL USING (auth.role() = 'authenticated');

  CREATE TABLE IF NOT EXISTS public.clients (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    status text NOT NULL,
    "createdAt" text
  );
  ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Auth ALL clients" ON public.clients;
  CREATE POLICY "Auth ALL clients" ON public.clients FOR ALL USING (auth.role() = 'authenticated');

  CREATE TABLE IF NOT EXISTS public.sessions (
    id text PRIMARY KEY,
    "clientId" text,
    date text NOT NULL,
    notes text,
    type text,
    duration integer,
    discussion text,
    tasks text,
    status text,
    "createdAt" text
  );
  ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Auth ALL sessions" ON public.sessions;
  CREATE POLICY "Auth ALL sessions" ON public.sessions FOR ALL USING (auth.role() = 'authenticated');

  CREATE TABLE IF NOT EXISTS public.forecasts_store (
    id text PRIMARY KEY,
    data jsonb NOT NULL DEFAULT '[]'::jsonb
  );
  ALTER TABLE public.forecasts_store ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Auth ALL forecasts_store" ON public.forecasts_store;
  CREATE POLICY "Auth ALL forecasts_store" ON public.forecasts_store FOR ALL USING (auth.role() = 'authenticated');

END $$;
