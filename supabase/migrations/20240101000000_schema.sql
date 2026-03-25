-- Drop existing tables if they exist to ensure a "clean" installation
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS profissionais CASCADE;

-- Create extension for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profissionais
CREATE TABLE profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  especialidade text,
  bio text,
  avatar_url text,
  criado_em timestamptz DEFAULT now()
);

-- Table: servicos
CREATE TABLE servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  duracao integer NOT NULL,
  preco numeric NOT NULL,
  criado_em timestamptz DEFAULT now()
);

-- Table: agendamentos
CREATE TABLE agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid REFERENCES profissionais(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES servicos(id) ON DELETE CASCADE,
  data_agendamento date NOT NULL,
  horario time NOT NULL,
  cliente_nome text NOT NULL,
  cliente_email text NOT NULL,
  cliente_telefone text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluído')),
  criado_em timestamptz DEFAULT now()
);

-- Clean/Reset section
-- Uncomment the following line to clear all existing data while keeping the structure intact
-- TRUNCATE TABLE agendamentos, servicos, profissionais RESTART IDENTITY CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Policy to allow public SELECT on profissionais and servicos
CREATE POLICY "Public SELECT profissionais" ON profissionais FOR SELECT USING (true);
CREATE POLICY "Public SELECT servicos" ON servicos FOR SELECT USING (true);

-- Policy to allow public INSERT on agendamentos
CREATE POLICY "Public INSERT agendamentos" ON agendamentos FOR INSERT WITH CHECK (true);

-- Policy to allow authenticated users (admin) to SELECT, UPDATE, and DELETE on all tables
CREATE POLICY "Auth ALL profissionais" ON profissionais FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth ALL servicos" ON servicos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth ALL agendamentos" ON agendamentos FOR ALL USING (auth.role() = 'authenticated');
