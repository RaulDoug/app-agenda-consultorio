# Spec: Persistencia api

> feature: persistencia-api
> status: auditada

## Contexto

Construção da camada de persistência em PostgreSQL puro parametrizado (`pg`) e rotas REST Express.js com isolamento rigoroso multi-tenant por JWT, criação atômica de agendamentos transacionais (`BEGIN ... COMMIT`), prevenção de concorrência e double booking (`409 Conflict`), garantia de Soft Delete (Princípio P-003) e endpoint de sincronização offline em lote (`/api/sync/batch`).

## Histórias

### US-007 — Isolamento Multi-Tenant e Autenticação JWT

Como dentista-operador autenticado no sistema, quero que minhas consultas e pacientes sejam estritamente isolados da base de outros consultórios, para que nenhum dado clínico ou financeiro seja exposto a terceiros.

#### AC-011 — Rejeição de requisições sem token de autenticação

- **Dado** uma requisição aos endpoints protegidos da API sem cabeçalho Authorization ou com token JWT inválido
- **Quando** o middleware de autenticação processar a requisição
- **Então** o sistema deve retornar código HTTP 401 Unauthorized impedindo o acesso.

#### AC-012 — Isolamento estrito entre diferentes consultórios

- **Dado** pacientes e procedimentos cadastrados no Consultório A (tenant A)
- **Quando** o Consultório B (tenant B) consultar a listagem de pacientes ou procedimentos com seu próprio token autenticado
- **Então** o retorno deve conter apenas registros pertencentes ao tenant B, retornando lista vazia quando não houver dados.

### US-008 — Gestão Rápida de Pacientes e Procedimentos

Como dentista, quero cadastrar e consultar pacientes e procedimentos de forma ágil e segura, com proteção contra injeção SQL e com desativação lógica por Soft Delete.

#### AC-013 — Proteção contra injeção SQL em buscas

- **Dado** uma tentativa de injeção SQL no parâmetro de busca por nome (ex: "' OR '1'='1; --")
- **Quando** a busca por pacientes for executada
- **Então** o sistema deve tratar o texto de forma estritamente literal via consultas parametrizadas sem vazar registros ou quebrar a consulta.

#### AC-014 — Soft Delete em remoção de pacientes

- **Dado** um paciente cadastrado com histórico de consultas e movimentações
- **Quando** for solicitada a remoção do paciente (DELETE /api/patients/:id)
- **Então** o registro deve receber is_active: false e timestamp em deleted_at, mantendo os agendamentos anteriores intactos e sem executar DELETE FROM físico.

### US-009 — Criação Atômica de Agendamento com Múltiplos Procedimentos

Como dentista, quero agendar consultas contendo múltiplos procedimentos de forma atômica, evitando criação de registros órfãos em caso de erro e impedindo agendamentos duplicados no mesmo horário.

#### AC-015 — Inserção transacional com rollback automático

- **Dado** um agendamento com múltiplos procedimentos onde a inserção de um dos procedimentos falhe
- **Quando** a transação de criação for executada
- **Então** o sistema deve executar ROLLBACK e nenhum registro órfão deve permanecer na tabela de agendamentos.

#### AC-016 — Prevenção de conflito de horário (Double Booking)

- **Dado** um agendamento já existente no consultório para determinado horário
- **Quando** uma segunda requisição tentar agendar uma consulta sobreposta no mesmo horário sem flag de encaixe extraordinário
- **Então** a API deve recusar a operação retornando código HTTP 409 Conflict.

### US-010 — Sincronização em Lote Offline-First

Como dentista atendendo em áreas com conexão oscilante, quero que os agendamentos criados no celular offline sejam sincronizados em lote com o servidor com garantia de idempotência.

#### AC-017 — Processamento idempotente de lote de sincronização

- **Dado** um lote de agendamentos criados offline enviado para POST /api/sync/batch
- **Quando** o mesmo lote com os mesmos identificadores for submetido repetidamente
- **Então** o servidor deve processar a requisição sem duplicar registros nem gerar erros de chave única.

#### AC-018 — Resolução de conflito Last-Write-Wins

- **Dado** um agendamento com versão offline cujo timestamp updated_at seja mais recente que o servidor
- **Quando** o lote de sincronização for processado
- **Então** os dados mais recentes devem prevalecer atualizando o registro no servidor.

## Fora de escopo

- Envio de mensagens e filas BullMQ com WhatsApp (escopo da Sprint BE-3).
- Interface de usuário React PWA (escopo do Frontend).
- Relatórios DRE e cálculos contábeis complexos (escopo das Sprints BE-4 e BE-5).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-003 | Testes de integração de repositórios SQL em CI utilizam pg-mem ou instância Postgres isolada. | confirmada | Permite execução de testes ultrarrápida (< 3s) e determinística. |
| ASM-004 | O token JWT assinado contém o payload com { tenant_id, user_id }. | confirmada | Padrão arquitetural multi-tenant do projeto. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-002 | Nenhuma. | respondida | Requisitos e edge cases alinhados no Roadmap TDD BE-2. |
