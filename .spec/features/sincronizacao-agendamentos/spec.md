# Spec: Sincronização e Ciclo de Vida de Agendamentos

> feature: sincronizacao-agendamentos
> status: pronta

## Contexto

Garantir a sincronização bidirecional robusta, atômica e idempotente dos agendamentos e seus procedimentos vinculados entre o cliente Local-First (IndexedDB / outbox) e o servidor (PostgreSQL), prevenindo perda de dados no logout, duplicações de registros e inconsistências de horário.

## Histórias

### US-095 — Sincronização e Persistência de Agendamentos e Itens

Como usuário do consultório, quero que meus agendamentos e procedimentos criados no aplicativo sejam salvos confiavelmente no servidor, para que minhas consultas não se percam e fiquem disponíveis na nuvem.

#### AC-166 — Backend aceita mutações de agendamentos e itens via POST /api/sync/batch
- **Dado** que o frontend despachou um lote com mutações `{ mutations: [...] }` contendo agendamentos e seus procedimentos vinculados
- **Quando** o endpoint `POST /api/sync/batch` processa a requisição com token de autenticação válido
- **Então** o servidor reconhece o formato de mutações, aplica as operações no PostgreSQL e responde com `HTTP 200 { success: true, applied: N }` indicando a quantidade de registros gravados.

#### AC-167 — Persistência atômica de agendamento e múltiplos procedimentos vinculados
- **Dado** uma mutação de criação de agendamento com 2 ou mais procedimentos em `items`
- **Quando** o lote é gravado no banco de dados do servidor
- **Então** o registro em `appointments` e os itens correspondentes em `appointment_items` são gravados atomicamente na mesma transação SQL.

#### AC-168 — Confirmação e limpeza segura da fila sync_outbox no frontend
- **Dado** um agendamento recém-criado na `sync_outbox` com status `PENDING`
- **Quando** o `SyncManager.push()` envia o lote e o servidor confirma a aplicação com sucesso (`applied > 0`)
- **Então** o item é removido da `sync_outbox` local; se o servidor retornar erro ou rede falhar, o item permanece na fila com retry incrementado.

---

### US-096 — Idempotência, Last-Write-Wins e Validação de Conflitos

Como administrador do consultório, quero que reenvios de conexão instável não gerem agendamentos duplicados e que remarcações respeitem a versão mais recente e as regras de encaixe.

#### AC-169 — Idempotência em reenvios de lote com mesmo UUID
- **Dado** um agendamento já persistido no PostgreSQL com um determinado UUID
- **Quando** o mesmo agendamento é reenviado em um lote posterior (mesmo UUID e mesmos dados)
- **Então** o servidor não gera um registro duplicado, mantendo exatamente um registro no banco de dados e retornando sucesso.

#### AC-170 — Resolução de conflito Last-Write-Wins por updated_at
- **Dado** um agendamento existente no servidor com status `CONFIRMED` e `updated_at` de 10:00
- **Quando** chega uma mutação offline com o mesmo UUID, status `CANCELLED` e `updated_at` de 10:30
- **Então** os dados mais recentes prevalecem no servidor, atualizando o status para `CANCELLED`; requisições com timestamp mais antigo são ignoradas.

#### AC-171 — Validação de choque de horários e liberação para encaixes
- **Dado** que já existe uma consulta agendada para o Dr. Silva das 14:00 às 14:30
- **Quando** uma nova consulta no mesmo intervalo for sincronizada com `is_extra_fit = true`
- **Então** o servidor aceita a inserção como encaixe extraordinário; se `is_extra_fit = false`, o servidor registra aviso de conflito ou rejeita a sobreposição.

---

### US-097 — Proteção no Logout e Restauração Pós-Login

Como operador de recepção, quero que o sistema envie automaticamente todas as alterações pendentes antes de deslogar e restaure todo o histórico da nuvem ao logar novamente.

#### AC-172 — Flush automático da fila outbox antes de efetuar logout
- **Dado** que existem agendamentos na `sync_outbox` aguardando envio
- **Quando** o usuário aciona a confirmação de logout
- **Então** o sistema executa um push forçado da outbox para a nuvem antes de limpar as tabelas locais do navegador.

#### AC-173 — Alerta com contagem de pendências se o flush falhar por falta de rede
- **Dado** que o dispositivo está offline e há 1 ou mais alterações não sincronizadas na outbox
- **Quando** o usuário abre a gaveta de logout
- **Então** o drawer exibe a contagem exata de alterações em risco e adverte o usuário com confirmação explícita antes de apagar os dados locais.

#### AC-174 — Restauração completa de agendamentos e procedimentos pós-login
- **Dado** que um usuário fez logout (com banco local limpo) e logou novamente em seguida
- **Quando** a aplicação é carregada e o ciclo `pull()` é executado
- **Então** todos os agendamentos e seus respectivos procedimentos salvos no servidor são baixados e populados nas tabelas locais `appointments` e `appointment_items`, ficando visíveis na grade da agenda.

## Fora de escopo

- Sincronização em tempo real via WebSockets (mantido o polling delta e outbox da arquitetura Local-First).
- Resolução de conflitos de três vias (3-way merge) a nível de campo para agendamentos.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-052 | O UUID v4 gerado no cliente atua como chave primária determinística tanto no IndexedDB quanto no PostgreSQL sem necessidade de mapeamento de IDs. | confirmada | Confirmado em /grill-me e pelo schema SQL com id UUID PRIMARY KEY. |
| ASM-053 | O backend processa o lote de mutações em transação atômica (BEGIN ... COMMIT) por requisição. | confirmada | Garante consistência relacional entre appointments e appointment_items. |
| ASM-054 | O sync_metadata armazena o cursor last_server_sync_timestamp que é zerado no logout para garantir que um novo login puxe todo o histórico da nuvem. | confirmada | Padrão arquitetural Local-First implementado em localDb.clearAll(). |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-047 | Como alinhar o contrato de sincronização batch entre Frontend e Backend? | respondida | Suporte nativo a mutations no backend com retrocompatibilidade para arrays diretos de appointments e patients. |
| Q-048 | Como lidar com duplicidade e choques de horário na sincronização? | respondida | Idempotência por UUID + Last-Write-Wins por updated_at + suporte a encaixe com flag is_extra_fit. |
| Q-049 | Como proteger os dados locais durante o Logout? | respondida | Tentativa de flush automático antes de limpar tabelas locais e alerta com contagem no LogoutConfirmDrawer se houver pendências offline. |
| Q-050 | Qual o escopo da validação de agendamentos? | respondida | Escopo completo de sincronização e ciclo de vida (criação, itens, remarcação, status, flush no logout e restauração pós-login). |
