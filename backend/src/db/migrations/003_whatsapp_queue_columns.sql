-- Migração 003: Colunas para Controle da Central de Fila de WhatsApp
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS whatsapp_queue_excluded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_custom_message TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whatsapp_queue_order INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_appointments_whatsapp_queue
ON appointments (tenant_id, whatsapp_queue_excluded, whatsapp_queue_order, start_time);
