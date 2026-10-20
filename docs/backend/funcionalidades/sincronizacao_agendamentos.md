# Funcionalidade: Sincronização e Ciclo de Vida de Agendamentos (Batch Sync)

> **Localização:** `docs/backend/funcionalidades/sincronizacao_agendamentos.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:**
> - Roteamento: `backend/src/routes/sync.ts`
> - Modelo / Banco de Dados: Tabelas `appointments`, `appointment_items`, `patients` (PostgreSQL)
> - Cliente Local-First: `frontend/src/sync/sync-manager.ts`, `localDb.sync_outbox`

---

## 1. Visão Geral e Contexto de Negócio

O sistema opera sob o paradigma **Local-First (Offline-First)**: os agendamentos são criados instantaneamente no banco de dados local do navegador (IndexedDB) e inseridos na fila `sync_outbox`. O worker em segundo plano (`SyncManager`) envia periodicamente lotes de mutações para o endpoint `POST /api/sync/batch`.

Esta funcionalidade garante:
1. **Compatibilidade Universal de Pacotes:** Suporte ao formato estruturado `{ mutations: [{ entity, operation, payload }] }` e retrocompatibilidade com arrays diretos `{ appointments, patients }`.
2. **Idempotência por Chave Primária UUID:** O UUID v4 gerado no cliente atua como identificador canônico no PostgreSQL, evitando duplicações por reenvio ou instabilidade de rede.
3. **Resolução de Conflitos Last-Write-Wins (LWW):** Em concorrência ou edições offline, a versão com timestamp `updated_at` mais recente sobrepõe a anterior.
4. **Respeito a Encaixes (`is_extra_fit`):** Validação de choque de horários (Double Booking) no consultório, permitindo sobreposições apenas quando a flag `is_extra_fit = true` estiver explícita.
5. **Gravação Atômica de Itens:** Inserção e atualização dos procedimentos associados à consulta (`appointment_items`) sincronizados na mesma operação.

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
    }
  ]
}
```

#### Resposta de Sucesso (`HTTP 200 OK`)
```json
{
  "success": true,
  "processed": 1,
  "applied": 1,
  "ignored": 0,
  "conflicts": []
}
```

---

## 3. Regras Inegociáveis de Sincronização

1. **Nunca descartar Outbox sem confirmação:** O frontend só exclui a mutação da `sync_outbox` se o backend responder `HTTP 200` com `success: true`. Em caso de erro 4xx, 5xx ou queda de rede, a mutação permanece intacta para retry exponencial.
2. **Flush no Logout:** Ao acionar logout no cliente, a rotina dispara uma tentativa forçada de `push()` antes de limpar o banco local (`localDb.clearAll()`). Se houver itens que não subiram por falta de conexão, o usuário é alertado no `LogoutConfirmDrawer`.
3. **Pull Total pós-login:** Ao logar em um dispositivo com banco local zerado, o cursor `last_server_sync_timestamp` inicia em `1970-01-01T00:00:00.000Z`, baixando o histórico integral do consultório.
