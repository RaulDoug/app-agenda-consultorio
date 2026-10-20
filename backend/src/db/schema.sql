-- OdontoFlow Schema DDL (PostgreSQL 16)
-- Compatível com Postgres nativo, Docker e pg-mem

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Consultórios / Clínicas)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    must_change_password BOOLEAN DEFAULT FALSE,
    token_version INT DEFAULT 0,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    whatsapp_instance_name VARCHAR(100),
    whatsapp_connected BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pacientes (com Soft Delete is_active e deleted_at)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_patients_tenant_whatsapp ON patients(tenant_id, whatsapp);
CREATE INDEX IF NOT EXISTS idx_patients_tenant_active ON patients(tenant_id, is_active);

-- 3. Procedimentos (com Soft Delete is_active e deleted_at)
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    default_duration_minutes INT NOT NULL DEFAULT 30 CHECK (default_duration_minutes > 0),
    default_price_cents INT NOT NULL DEFAULT 0 CHECK (default_price_cents >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_procedures_tenant ON procedures(tenant_id);

-- 4. Status de Agendamento e Tabela de Agendamentos
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'PENDING', 
        'CONFIRMED', 
        'RESCHEDULE_REQUESTED', 
        'MESSAGE_RECEIVED', 
        'COMPLETED', 
        'NO_SHOW', 
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    is_overtime BOOLEAN DEFAULT FALSE,
    total_charged_cents INT,
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_dates ON appointments(tenant_id, start_time, end_time);

-- 5. Itens do Agendamento (Múltiplos Procedimentos por consulta)
CREATE TABLE IF NOT EXISTS appointment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES procedures(id),
    effective_price_cents INT NOT NULL CHECK (effective_price_cents >= 0),
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0)
);

-- 6. Transações Financeiras (com Soft Delete para auditoria contábil)
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
    CREATE TYPE transaction_status AS ENUM ('PAID', 'PENDING');
    CREATE TYPE payment_method AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BOLETO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    payment_method VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PAID',
    due_date DATE NOT NULL,
    payment_date DATE,
    installment_number INT DEFAULT 1,
    total_installments INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_dates ON financial_transactions(tenant_id, due_date, status);

-- 7. Horário de Funcionamento Regular do Consultório
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_open BOOLEAN DEFAULT TRUE,
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    break_start_time TIME DEFAULT '12:00',
    break_end_time TIME DEFAULT '13:30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_day UNIQUE (tenant_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_business_hours_tenant ON business_hours(tenant_id);

-- 8. Bloqueios de Agenda
CREATE TABLE IF NOT EXISTS schedule_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_blocks_tenant_dates ON schedule_blocks(tenant_id, start_time, end_time);
