# Spec: Banco Local IndexedDB (Dexie.js) e Sincronização Offline-First — CliniAssist (Sprint FE-1)

> feature: banco-local-sync
> status: pronta

## Contexto

Implementação da camada de persistência local no dispositivo do usuário utilizando IndexedDB (via Dexie.js), garantindo operação 100% Offline-First. Qualquer ação do profissional (criação de pacientes, agendamentos, procedimentos e transações) grava imediatamente no banco local com escrita otimista e enfileira uma mutação na tabela `sync_outbox`. Um gerenciador de sincronização (`SyncManager`) envia as mutações em lote para o servidor quando houver conexão (`POST /api/sync/batch`), consome deltas de alterações ocorridas no servidor (`GET /api/sync/pull`), preserva a leveza do dispositivo através de poda de registros antigos (> 90 dias) e fornece estado de rede reativo para a interface.

## Histórias

### US-030 — Schema Local IndexedDB e Tabelas do Dispositivo

Como profissional de saúde ou de serviços, quero que o aplicativo armazene com segurança meus dados clínicos e de agenda diretamente no navegador/celular, para que eu possa carregar minhas informações instantaneamente mesmo em áreas sem sinal.

#### AC-053 — Inicialização do schema Dexie.js e tabelas locais
- **Dado** o banco de dados Dexie.js inicializado no navegador (ou ambiente de teste via fake-indexeddb)
- **Quando** o banco de dados for aberto pela aplicação
- **Então** o schema deve conter as tabelas locais indexadas: `patients`, `procedures`, `appointments`, `appointment_items`, `financial_transactions`, `business_hours`, `schedule_blocks` e `sync_outbox`, prontas para leitura e escrita síncrona.

---

### US-031 — Escrita Otimista e Fila de Mutações (`sync_outbox`)

Como usuário em trânsito ou com sinal instável, quero agendar consultas e cadastrar pacientes sem esperar confirmação de rede, com resposta visual imediata (< 10ms).

#### AC-054 — Escrita otimista no banco local e enfileiramento na outbox
- **Dado** o aplicativo em modo online ou offline
- **Quando** o usuário criar ou atualizar um agendamento ou paciente via repositório local
- **Então** o registro deve ser salvo imediatamente na tabela local do Dexie.js e simultaneamente inserido como um item com status `PENDING` na tabela `sync_outbox`, contendo entidade, id, operação (`INSERT`/`UPDATE`/`DELETE`), timestamp UTC e payload da mutação.

---

### US-032 — Sincronizador Bidirecional e Resiliência de Rede

Como usuário, quero que minhas alterações pendentes sejam sincronizadas automaticamente com a nuvem assim que a internet voltar, sem perder dados caso a conexão oscile durante o envio.

#### AC-055 — Sincronização bidirecional (Push e Pull Delta) com resiliência a falhas
- **Dado** mutações pendentes na `sync_outbox` e conexão com o servidor estabelecida
- **Quando** o processo de sincronização for disparado
- **Então** o `SyncManager` deve enviar as mutações para `POST /api/sync/batch`, marcar os itens como sincronizados/removê-los da outbox após resposta de sucesso (200 OK) e consumir o delta de mutações do servidor via `GET /api/sync/pull?since=...`; se a requisição falhar por erro de rede ou 500, os itens devem permanecer intactos na `sync_outbox` para reenvio automático.

---

### US-033 — Poda de Histórico e Monitor de Conexão

Como usuário com armazenamento limitado no smartphone, quero que consultas muito antigas sejam arquivadas do celular para manter o aplicativo leve e rápido, e quero saber claramente quando estou offline.

#### AC-056 — Poda automática de histórico antigo e hook de conexão reativo
- **Dado** agendamentos concluídos há mais de 90 dias presentes no banco local
- **Quando** a rotina de poda (pruning) for executada
- **Então** os agendamentos com mais de 90 dias concluídos devem ser limpos da tabela local de appointments mantendo dados no servidor, e o hook `useConnectionStatus` deve reportar fielmente os estados `ONLINE`, `OFFLINE` e `SYNCING`.

---

## Fora de escopo

- Resolução manual de conflitos por tela de merge (adota-se a política Last-Write-Wins definida pelo PO).
- Telas de agendamento e drag-and-drop da timeline (Sprint FE-2).
- Telas de cobrança e checkout (Sprint FE-3).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-018 | O Dexie.js opera com transações ACID no IndexedDB garantindo atomicidade entre a gravação do registro e a inserção na `sync_outbox`. | confirmada | Previne registros órfãos que nunca seriam sincronizados com o backend. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-018 | A limpeza de 90 dias (poda) deve apagar dados não sincronizados caso existam? | respondida | Jamais. Apenas registros já com `sync_outbox` zerada e com status finalizado são candidatos a poda. Alinhado com o PO. |
