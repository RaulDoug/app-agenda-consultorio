# Spec: Sincronização de Movimentações Financeiras Offline-First

> feature: sincronizacao-financeiro-offline
> status: rascunho

## Contexto

Garantir a persistência e reconciliação bidirecional completa de transações financeiras (`financial_transactions`) entre o banco local IndexedDB e o servidor PostgreSQL via `/api/sync/batch` e `/api/sync/pull`, eliminando a perda de movimentações financeiras após logout e novo login.

---

## Histórias

### US-112 — Persistência e Reconciliação de Transações Financeiras no Backend

Como operador do consultório, quero que todas as transações financeiras registradas offline ou no checkout local sejam salvas de forma atômica e resiliente no banco PostgreSQL pelo endpoint de sincronização em lote, para que nenhum lançamento financeiro seja perdido ao sincronizar com o servidor.

#### AC-193 — Ingestão e persistência de transações financeiras em lote no backend via POST /api/sync/batch
- **Dado** que o frontend despacha um lote de sincronização para `POST /api/sync/batch` contendo mutações com `entity: 'financial_transactions'`
- **Quando** o servidor processa o lote autenticado com o token do consultório (`tenant_id`)
- **Então** as transações financeiras são inseridas ou atualizadas no PostgreSQL respeitando estritamente o `tenant_id`, preservando os campos de valor em centavos (`amount_cents`), status (`status`), método de pagamento (`payment_method`), vencimento (`due_date`) e vínculo de agendamento (`appointment_id`), retornando contagem de mutações aplicadas no payload de resposta.

#### AC-194 — Resolução de conflitos Last-Write-Wins e exclusão lógica de transações financeiras no sync/batch
- **Dado** que uma transação financeira existente recebe uma mutação de atualização (`UPDATE`) ou exclusão (`DELETE`) via `POST /api/sync/batch`
- **Quando** a data de atualização enviada (`updated_at`) for comparada com o registro existente no PostgreSQL
- **Então** se o timestamp de entrada for mais recente que o do servidor, a alteração é aplicada (ou marcado `is_active: false` e `deleted_at` preenchido em caso de DELETE); se for mais antigo, a mutação é ignorada de acordo com a regra Last-Write-Wins (LWW) preservando a integridade histórica.

---

### US-113 — Restauração Íntegra do Livro Caixa após Logout e Novo Login

Como profissional ou gestor do consultório, quero que, ao efetuar logout e realizar um novo login em qualquer dispositivo, todo o histórico de receitas, despesas e parcelamentos seja restaurado perfeitamente na visualização de Extrato e Fluxo de Caixa.

#### AC-195 — Restauração íntegra de transações financeiras no GET /api/sync/pull após novo login
- **Dado** que um consultório possui transações financeiras sincronizadas no PostgreSQL e o banco local do dispositivo foi resetado após logout
- **Quando** o usuário faz login e o cliente executa o `pull` inicial (`GET /api/sync/pull?since=1970-01-01T00:00:00.000Z`)
- **Então** o servidor retorna o array completo de `financial_transactions` do consultório, e o cliente grava os registros no IndexedDB, restaurando imediatamente os totais de faturamento e as linhas do Extrato (Livro Caixa).

---

## Fora de escopo

- Sincronização direta com adquirentes de cartão ou bancos externos (Open Finance).
- Emissão e transmissão de NFS-e ou SPED fiscal.

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-062 | As mutações financeiras geradas localmente possuem IDs em formato UUID v4 compatíveis com a coluna `id UUID PRIMARY KEY` da tabela `financial_transactions` do PostgreSQL. | confirmada | Confirmado pela tipagem de `LocalFinancialTransaction` no Dexie e schema SQL. |
| ASM-063 | O endpoint `/api/sync/batch` deve aplicar transações de `financial_transactions` atribuindo obrigatoriamente o `tenant_id` seguro do token JWT (`req.tenantId`), rejeitando qualquer tentativa de injeção externa de outro tenant. | confirmada | Regra mandatória de isolamento multi-tenant (Tenant Scoping) do projeto. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-053 | Devemos aproveitar a inclusão de `financial_transactions` no `/api/sync/batch` para suportar também a entidade `procedures` caso o usuário cadastre procedimentos offline? | respondida | Sim, incluir também o suporte a `procedures` no `/api/sync/batch` para evitar que procedimentos novos criados offline sejam descartados da mesma forma. |
