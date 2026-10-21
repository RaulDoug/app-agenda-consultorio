# Funcionalidade: Sincronização Bidirecional Offline-First (Batch Sync & Pull)

> **Localização:** `docs/backend/funcionalidades/sincronizacao_agendamentos.md`  
> **Status:** Ativo / Implementado  
> **Critérios de Aceite:** `AC-166` a `AC-174`, `AC-193`, `AC-194`, `AC-195`  
> **Camadas Envolvidas:**
> - Roteamento: `backend/src/routes/sync.ts`
> - Modelo / Banco de Dados: Tabelas `appointments`, `appointment_items`, `patients`, `financial_transactions`, `procedures` (PostgreSQL)
> - Cliente Local-First: `frontend/src/sync/sync-manager.ts`, `localDb.sync_outbox`

---

## 1. Visão Geral e Contexto de Negócio

O sistema opera sob o paradigma **Local-First (Offline-First)**: agendamentos, movimentações financeiras de checkout/despesas e novos procedimentos são criados instantaneamente no banco de dados local do navegador (IndexedDB / Dexie) e inseridos na fila `sync_outbox`. O worker em segundo plano (`SyncManager`) envia periodicamente lotes de mutações para o endpoint `POST /api/sync/batch`.

Esta funcionalidade garante:
1. **Compatibilidade Universal de Pacotes:** Suporte ao formato estruturado `{ mutations: [{ entity, operation, payload }] }` e retrocompatibilidade com arrays diretos (`appointments`, `patients`, `financial_transactions`, `procedures`).
2. **Idempotência por Chave Primária UUID:** O UUID v4 gerado no cliente atua como identificador canônico no PostgreSQL, evitando duplicações por reenvio ou instabilidade de rede.
3. **Resolução de Conflitos Last-Write-Wins (LWW):** Em concorrência ou edições offline, a versão com timestamp `updated_at` mais recente sobrepõe a anterior.
4. **Respeito a Encaixes (`is_extra_fit`):** Validação de choque de horários (Double Booking) no consultório, permitindo sobreposições apenas quando a flag `is_extra_fit = true` estiver explícita.
5. **Gravação Atômica de Itens:** Inserção e atualização dos procedimentos associados à consulta (`appointment_items`) sincronizados na mesma operação.
6. **Persistência e Restauração Financeira Pós-Logout (AC-193, AC-194, AC-195):** Toda transação de receita ou despesa gerada offline é persistida atomicamente com tenant scoping no PostgreSQL. No logout, o IndexedDB é limpo por segurança multi-tenant, e no login seguinte, `GET /api/sync/pull` restaura integralmente o Livro Caixa e Extrato.
7. **Soft-Delete Seguro em Sincronização:** Operações `DELETE` ou registros com `is_active = false` sofrem soft delete (`deleted_at = incomingUpdatedAt`), mantendo integridade para auditoria.

---

## 2. Contrato de API

### POST `/api/sync/batch`

#### Headers Obrigatórios
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

#### Formato do Payload com Mutations (Padrão Frontend)
```json
{
  "mutations": [
    {
      "client_mutation_id": "88888888-4444-4444-8888-123456789abc",
      "entity": "appointments",
      "record_id": "22222222-0000-0000-0000-000000000001",
      "operation": "INSERT",
      "payload": {
        "id": "22222222-0000-0000-0000-000000000001",
        "patient_id": "11111111-0000-0000-0000-000000000001",
        "start_time": "2026-10-25T14:00:00.000Z",
        "end_time": "2026-10-25T14:30:00.000Z",
        "status": "CONFIRMED",
        "is_extra_fit": false,
        "notes": "Consulta de rotina",
        "items": [
          {
            "id": "33333333-0000-0000-0000-000000000001",
            "procedure_id": "00000000-0000-0000-0000-000000000001",
            "effective_price_cents": 15000,
            "duration_minutes": 30
          }
        ],
        "updated_at": "2026-10-20T10:00:00.000Z"
      },
      "timestamp": "2026-10-20T10:00:00.000Z"
    },
    {
      "client_mutation_id": "99999999-5555-5555-9999-987654321def",
      "entity": "financial_transactions",
      "record_id": "44444444-0000-0000-0000-000000000001",
      "operation": "INSERT",
      "payload": {
        "id": "44444444-0000-0000-0000-000000000001",
        "type": "INCOME",
        "category": "ATENDIMENTO",
        "description": "Consulta Dr. Silva",
        "amount_cents": 15000,
        "payment_method": "PIX",
        "status": "PAID",
        "due_date": "2026-10-20",
        "payment_date": "2026-10-20T10:00:00.000Z",
        "installment_number": 1,
        "total_installments": 1,
        "is_active": true,
        "updated_at": "2026-10-20T10:00:00.000Z"
      },
      "timestamp": "2026-10-20T10:00:00.000Z"
    }
  ]
}
```

#### Resposta de Sucesso (`HTTP 200 OK`)
```json
{
  "success": true,
  "processed": 2,
  "applied": 2,
  "ignored": 0,
  "conflicts": []
}
```

---

## 3. Regras Inegociáveis de Sincronização

1. **Nunca descartar Outbox sem confirmação:** O frontend só exclui a mutação da `sync_outbox` se o backend responder `HTTP 200` com `success: true`. Em caso de erro 4xx, 5xx ou queda de rede, a mutação permanece intacta para retry exponencial.
2. **Flush no Logout:** Ao acionar logout no cliente, a rotina dispara uma tentativa forçada de `push()` antes de limpar o banco local (`localDb.clearAll()`). Se houver itens que não subiram por falta de conexão, o usuário é alertado no `LogoutConfirmDrawer`.
3. **Pull Total pós-login:** Ao logar em um dispositivo com banco local zerado, o cursor `last_server_sync_timestamp` inicia em `1970-01-01T00:00:00.000Z`, baixando o histórico integral do consultório (agendamentos, pacientes, procedimentos e movimentações financeiras).
