-- Clear all existing records from the core tables to reset the database
-- The deletion must be executed in the correct order to prevent referential integrity errors.
-- agendamentos depend on profissionais and servicos, so they are deleted first.

DELETE FROM agendamentos;
DELETE FROM profissionais;
DELETE FROM servicos;
