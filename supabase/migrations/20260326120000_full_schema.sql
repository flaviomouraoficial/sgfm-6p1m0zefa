DO $ 
BEGIN
  -- We use double quotes to preserve camelCase keys matching the frontend's JSON models perfectly
  CREATE TABLE IF NOT EXISTS "deals" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "value" NUMERIC DEFAULT 0,
    "stage" TEXT DEFAULT 'lead',
    "createdAt" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT
  );

  CREATE TABLE IF NOT EXISTS "mentees" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "contractValue" NUMERIC,
    "totalSessions" INTEGER,
    "status" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "sessions" JSONB DEFAULT '[]'::jsonb,
    "emailLogs" JSONB DEFAULT '[]'::jsonb,
    "attachments" JSONB DEFAULT '[]'::jsonb
  );

  CREATE TABLE IF NOT EXISTS "timeSlots" (
    "id" TEXT PRIMARY KEY,
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
    "status" TEXT,
    "cliente_nome" TEXT,
    "cliente_email" TEXT,
    "cliente_telefone" TEXT,
    "servico_id" TEXT,
    "profissional_id" TEXT
  );

  CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" NUMERIC DEFAULT 0,
    "type" TEXT,
    "date" TEXT,
    "entryDate" TEXT,
    "classification" TEXT,
    "category" TEXT,
    "status" TEXT,
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
    "updatedAt" TEXT
  );

  CREATE TABLE IF NOT EXISTS "proposals" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "leadId" TEXT,
    "value" NUMERIC DEFAULT 0,
    "expirationDate" TEXT,
    "description" TEXT,
    "status" TEXT,
    "createdAt" TEXT
  );

  CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "createdAt" TEXT
  );

  CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT PRIMARY KEY,
    "clientId" TEXT,
    "date" TEXT,
    "notes" TEXT,
    "createdAt" TEXT,
    "type" TEXT,
    "duration" INTEGER,
    "discussion" TEXT,
    "tasks" TEXT,
    "status" TEXT
  );

  CREATE TABLE IF NOT EXISTS "settings_store" (
    "id" TEXT PRIMARY KEY DEFAULT 'main',
    "data" JSONB NOT NULL DEFAULT '{}'::jsonb
  );

  CREATE TABLE IF NOT EXISTS "forecasts_store" (
    "id" TEXT PRIMARY KEY DEFAULT 'main',
    "data" JSONB NOT NULL DEFAULT '[]'::jsonb
  );

END $;

DO $ 
DECLARE
  t TEXT;
BEGIN
  -- Enable RLS for all new tables
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('deals', 'mentees', 'timeSlots', 'transactions', 'proposals', 'clients', 'sessions', 'settings_store', 'forecasts_store') LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    
    -- Authenticated users can do everything
    EXECUTE format('DROP POLICY IF EXISTS "Auth ALL %I" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "Auth ALL %I" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t, t);
  END LOOP;

  -- Allow public access to timeSlots (for booking on the public URL)
  DROP POLICY IF EXISTS "Public SELECT timeSlots" ON "timeSlots";
  CREATE POLICY "Public SELECT timeSlots" ON "timeSlots" FOR SELECT TO anon USING (true);
  
  DROP POLICY IF EXISTS "Public UPDATE timeSlots" ON "timeSlots";
  CREATE POLICY "Public UPDATE timeSlots" ON "timeSlots" FOR UPDATE TO anon USING (true) WITH CHECK (true);
END $;

-- Fix agendamentos table policy to explicitly allow update from unauthenticated users during booking if required
DO $
BEGIN
  DROP POLICY IF EXISTS "Public UPDATE agendamentos" ON agendamentos;
  CREATE POLICY "Public UPDATE agendamentos" ON agendamentos FOR UPDATE TO anon USING (true) WITH CHECK (true);
END $;

-- Seed generic admin user and specific user for the customer
DO $
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
      crypt('securepassword123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Flávio Moura"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@grupoflaviomoura.com.br') THEN
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
      'admin@grupoflaviomoura.com.br',
      crypt('securepassword123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Administrador"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $;

