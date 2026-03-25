-- Create extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema Definition - Table servicos
CREATE TABLE servicos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  descricao text,
  duracao integer NOT NULL,
  preco numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Schema Definition - Table profissionais
CREATE TABLE profissionais (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  cargo text,
  foto_url text,
  created_at timestamptz DEFAULT now()
);

-- Schema Definition - Table agendamentos
CREATE TABLE agendamentos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_nome text NOT NULL,
  cliente_telefone text NOT NULL,
  servico_id uuid NOT NULL REFERENCES servicos(id),
  profissional_id uuid NOT NULL REFERENCES profissionais(id),
  data date NOT NULL,
  hora time NOT NULL,
  status text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Policy to allow public SELECT on servicos and profissionais
CREATE POLICY "Public SELECT servicos" ON servicos FOR SELECT USING (true);
CREATE POLICY "Public SELECT profissionais" ON profissionais FOR SELECT USING (true);

-- Policy to allow public INSERT on agendamentos
CREATE POLICY "Public INSERT agendamentos" ON agendamentos FOR INSERT WITH CHECK (true);

-- Policy to allow authenticated users (admin) to SELECT, UPDATE, and DELETE on all tables
CREATE POLICY "Auth ALL servicos" ON servicos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth ALL profissionais" ON profissionais FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth ALL agendamentos" ON agendamentos FOR ALL USING (auth.role() = 'authenticated');
