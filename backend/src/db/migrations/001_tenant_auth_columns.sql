-- Migration 001: Colunas de Controle de Autenticação e Sessão de Tenants (Idempotente)

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
