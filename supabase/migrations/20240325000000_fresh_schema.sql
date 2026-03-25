-- Clean existing tables to ensure a fresh environment
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS profissionais CASCADE;

-- Create extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profissionais
CREATE TABLE profissionais (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  especialidade text,
  created_at timestamptz DEFAULT now()
);

-- Table: servicos
CREATE TABLE servicos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  preco numeric,
  duracao_minutos integer,
  created_at timestamptz DEFAULT now()
);

-- Table: agendamentos
CREATE TABLE agendamentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profissional_id uuid REFERENCES profissionais(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES servicos(id) ON DELETE CASCADE,
  data_horario timestamptz NOT NULL,
  cliente_nome text NOT NULL,
  cliente_telefone text,
  cliente_email text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluído')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Policies for public access (Read for professionals/services, Insert for bookings)
CREATE POLICY "Public SELECT profissionais" ON profissionais FOR SELECT USING (true);
CREATE POLICY "Public SELECT servicos" ON servicos FOR SELECT USING (true);
CREATE POLICY "Public INSERT agendamentos" ON agendamentos FOR INSERT WITH CHECK (true);

-- Policies for authenticated admin access
CREATE POLICY "Auth ALL profissionais" ON profissionais FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth ALL servicos" ON servicos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth ALL agendamentos" ON agendamentos FOR ALL USING (auth.role() = 'authenticated');

-- Insert Initial Data (To populate the database automatically)
INSERT INTO profissionais (nome, especialidade) VALUES
('Flávio Moura', 'Mentoria Executiva'),
('Especialista em Performance', 'Consultoria Financeira');

INSERT INTO servicos (nome, preco, duracao_minutos) VALUES
('Reunião de Diagnóstico', 0, 30),
('Acompanhamento de Metas', 500, 60),
('Sessão Técnica (Avulsa)', 300, 45);
