-- Inicialização das tabelas, estrutura e políticas RLS para o SGFM
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'flavio@trendconsultoria.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'flavio@trendconsultoria.com.br',
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Flávio Moura"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.deals (
  id TEXT PRIMARY KEY,
  title TEXT,
  "clientName" TEXT,
  value NUMERIC,
  stage TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  description TEXT,
  amount NUMERIC,
  type TEXT,
  date TEXT,
  "entryDate" TEXT,
  classification TEXT,
  category TEXT,
  status TEXT,
  company TEXT,
  bank TEXT,
  service TEXT,
  "paymentMethod" TEXT,
  performer TEXT,
  client TEXT,
  supplier TEXT,
  "paymentLink" TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  "recurringGroupId" TEXT,
  recurrence JSONB,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.mentees (
  id TEXT PRIMARY KEY,
  name TEXT,
  company TEXT,
  "contractValue" NUMERIC,
  "totalSessions" INTEGER,
  status TEXT,
  phone TEXT,
  email TEXT,
  sessions JSONB DEFAULT '[]'::jsonb,
  "emailLogs" JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.proposals (
  id TEXT PRIMARY KEY,
  title TEXT,
  "leadId" TEXT,
  value NUMERIC,
  "expirationDate" TEXT,
  description TEXT,
  status TEXT,
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS public."timeSlots" (
  id TEXT PRIMARY KEY,
  date TEXT,
  time TEXT,
  description TEXT,
  "isBooked" BOOLEAN DEFAULT false,
  "menteeName" TEXT,
  "menteeEmail" TEXT,
  "menteePhone" TEXT,
  "menteeCompany" TEXT,
  service TEXT,
  professional TEXT,
  cliente_email TEXT,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  status TEXT,
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  "clientId" TEXT,
  date TEXT,
  notes TEXT,
  type TEXT,
  duration NUMERIC,
  discussion TEXT,
  tasks TEXT,
  status TEXT,
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS public.servicos (
  id TEXT PRIMARY KEY,
  nome TEXT,
  duracao_minutos NUMERIC,
  preco NUMERIC,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS public.profissionais (
  id TEXT PRIMARY KEY,
  nome TEXT,
  especialidade TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS public.agendamentos (
  id TEXT PRIMARY KEY,
  profissional_id TEXT,
  servico_id TEXT,
  data_horario TEXT,
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  status TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS public.settings_store (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.forecasts_store (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public."timeSlots" ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE public."timeSlots" ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public."timeSlots" ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE public."timeSlots" ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."timeSlots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts_store ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['deals', 'transactions', 'mentees', 'proposals', 'timeSlots', 'clients', 'sessions', 'servicos', 'profissionais', 'agendamentos', 'settings_store', 'forecasts_store'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all authenticated users" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Allow all authenticated users" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Allow anon read timeSlots" ON public."timeSlots";
CREATE POLICY "Allow anon read timeSlots" ON public."timeSlots" FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon update timeSlots" ON public."timeSlots";
CREATE POLICY "Allow anon update timeSlots" ON public."timeSlots" FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert agendamentos" ON public.agendamentos;
CREATE POLICY "Allow anon insert agendamentos" ON public.agendamentos FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read servicos" ON public.servicos;
CREATE POLICY "Allow anon read servicos" ON public.servicos FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon read profissionais" ON public.profissionais;
CREATE POLICY "Allow anon read profissionais" ON public.profissionais FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read settings_store" ON public.settings_store;
CREATE POLICY "Allow anon read settings_store" ON public.settings_store FOR SELECT TO anon USING (true);

INSERT INTO public.settings_store (id, data) VALUES (
  'main',
  '{"companyName": "Grupo Flávio Moura", "services": [], "sessionTypes": ["Reunião de Diagnóstico", "Acompanhamento de Metas", "Sessão Técnica"], "companies": ["Todas"], "defaultDuration": 60}'::jsonb
) ON CONFLICT (id) DO NOTHING;
