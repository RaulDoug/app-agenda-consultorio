# Módulo: Correções de QA dos Testes Manuais (Backend)

> **Documento:** Especificação Técnica de Ajustes de QA  
> **Localização:** `docs/backend/funcionalidades/correcoes_qa_testes_manuais.md`  
> **Feature Spec-Driven:** `correcoes-qa-testes-manuais`  
> **Status:** Implementado e Auditado (Código 0)  

---

## 1. Soft-Delete de Pacientes no Endpoint de Sincronização (`POST /api/sync/batch`)

### 1.1 Contexto
Anteriormente, o processamento de lotes na rota `backend/src/routes/sync.ts` tratava `isDeleteOp` para as entidades `financial_transactions` e `procedures`, mas na seção de `patients` a verificação de exclusão lógica havia sido omitida. Quando o frontend gerava uma mutação `DELETE` para paciente, o PostgreSQL mantinha o registro ativo (`is_active = true, deleted_at = NULL`).

### 1.2 Implementação
No processador de mutações de `patients`:
```typescript
const isDeleteOp = mutation?.operation === 'DELETE' || patientData.is_active === false;

if (isDeleteOp) {
  await client.query(
    `UPDATE patients 
     SET is_active = false, deleted_at = $1, updated_at = $2
     WHERE id = $3 AND tenant_id = $4`,
    [incomingUpdatedAt, incomingUpdatedAt, patientId, tenantId]
  );
} else {
  // Upsert com ON CONFLICT (id) DO UPDATE ...
}
```

---

## 2. Script de Teste Interativo de Confirmação WhatsApp (`test-confirmation-flow.ts`)

### 2.1 Contexto
O script `backend/scripts/test-confirmation-flow.ts` continha um `tenantId` fixo (*hardcoded*) que falhava em bases recém-migradas. Adicionalmente, quando o usuário executava o script passando o número com DDI 55 (ex: `553798231077`), o script buscava no banco por igualdade estrita e cadastrava um novo paciente duplicado, visto que no frontend o número era cadastrado no formato nacional `3798231077`.

### 2.2 Implementação
1. **Resolução Dinâmica de Consultório (Tenant):**
   - Caso o quarto argumento não seja informado na CLI, o script consulta o primeiro consultório ativo no PostgreSQL (`SELECT id, name, whatsapp_instance_name FROM tenants WHERE is_active = true ORDER BY created_at ASC LIMIT 1`).
2. **Higienização e Normalização Telefônica:**
   - Decomposição em `nationalPhone` (sem 55) e `internationalPhone` (com 55).
   - Consulta `patients` filtrando `(whatsapp = $nationalPhone OR whatsapp = $internationalPhone)`.
   - Se já existir, reutiliza o registro existente sem criar duplicatas.
   - Envia a mensagem na Evolution API usando `internationalPhone` e salva no banco usando `nationalPhone` (padrão da UI).

