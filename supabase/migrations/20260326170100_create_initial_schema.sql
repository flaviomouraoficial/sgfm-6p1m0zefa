DO $$
BEGIN

-- Deals
CREATE TABLE IF NOT EXISTS public.deals (
    id TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "value" NUMERIC NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "entryDate" TEXT,
    "classification" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL,
    "company" TEXT,
    "bank" TEXT,
    "service" TEXT,
    "paymentMethod" TEXT,
    "performer" TEXT,
    "client" TEXT,
    "supplier" TEXT,
    "paymentLink" TEXT,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "recurringGroupId" TEXT,
    "recurrence" JSONB,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Mentees
CREATE TABLE IF NOT EXISTS public.mentees (
    id TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "contractValue" NUMERIC DEFAULT 0,
    "totalSessions" INTEGER DEFAULT 0,
    "status" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "sessions" JSONB DEFAULT '[]'::jsonb,
    "emailLogs" JSONB DEFAULT '[]'::jsonb,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals
CREATE TABLE IF NOT EXISTS public.proposals (
    id TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "leadId" TEXT,
    "value" NUMERIC DEFAULT 0,
    "expirationDate" TEXT,
    "description" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Servicos
CREATE TABLE IF NOT EXISTS public.servicos (
    id TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "duracao_minutos" INTEGER DEFAULT 60,
    "preco" NUMERIC DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
    id TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id TEXT PRIMARY KEY,
    "profissional_id" TEXT,
    "servico_id" TEXT,
    "data_horario" TIMESTAMPTZ,
    "cliente_nome" TEXT NOT NULL,
    "cliente_email" TEXT,
    "cliente_telefone" TEXT,
    "status" TEXT DEFAULT 'pendente',
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- TimeSlots
CREATE TABLE IF NOT EXISTS public."timeSlots" (
    id TEXT PRIMARY KEY,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "description" TEXT,
    "isBooked" BOOLEAN DEFAULT false,
    "menteeName" TEXT,
    "menteeEmail" TEXT,
    "menteePhone" TEXT,
    "menteeCompany" TEXT,
    "service" TEXT,
    "professional" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    "clientId" TEXT,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "type" TEXT,
    "duration" INTEGER DEFAULT 60,
    "discussion" TEXT,
    "tasks" TEXT,
    "status" TEXT DEFAULT 'Pendente',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Store
CREATE TABLE IF NOT EXISTS public.settings_store (
    id TEXT PRIMARY KEY,
    data JSONB DEFAULT '{}'::jsonb
);

-- Forecasts Store
CREATE TABLE IF NOT EXISTS public.forecasts_store (
    id TEXT PRIMARY KEY,
    data JSONB DEFAULT '[]'::jsonb
);

END $$;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."timeSlots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts_store ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['deals', 'transactions', 'mentees', 'proposals', 'servicos', 'profissionais', 'agendamentos', 'timeSlots', 'clients', 'sessions', 'settings_store', 'forecasts_store'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_authenticated" ON public.%I', t);
        EXECUTE format('CREATE POLICY "allow_all_authenticated" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
        
        EXECUTE format('DROP POLICY IF EXISTS "allow_anon_select" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_anon_insert" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "allow_anon_update" ON public.%I', t);
    END LOOP;
END $$;

CREATE POLICY "allow_anon_select" ON public.servicos FOR SELECT TO anon USING (true);
CREATE POLICY "allow_anon_select" ON public.profissionais FOR SELECT TO anon USING (true);
CREATE POLICY "allow_anon_select" ON public."timeSlots" FOR SELECT TO anon USING (true);
CREATE POLICY "allow_anon_update" ON public."timeSlots" FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_anon_insert" ON public.agendamentos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_anon_select" ON public.settings_store FOR SELECT TO anon USING (true);
