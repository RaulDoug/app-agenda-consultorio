-- Migration 002: Atualizações de Schema para CRUDs do Backend
-- OdontoFlow - PostgreSQL 16 / Docker / pg-mem

-- 1. Adição de custo aos procedimentos e itens de agendamento
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS cost_cents INT NOT NULL DEFAULT 0;
ALTER TABLE appointment_items ADD COLUMN IF NOT EXISTS cost_cents INT NOT NULL DEFAULT 0;

-- 2. Tabela de Categorias Financeiras de Despesas
CREATE TABLE IF NOT EXISTS financial_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'EXPENSE',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_financial_categories_tenant ON financial_categories(tenant_id);

-- 3. Adição de group_id para agrupamento de parcelas e recorrências em financial_transactions
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS group_id UUID;
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_group ON financial_transactions(tenant_id, group_id);
