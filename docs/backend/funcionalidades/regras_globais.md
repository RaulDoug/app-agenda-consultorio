# Diretrizes e Regras Globais do Backend — OdontoFlow

> **Status:** Documento Vivo de Referência Obrigatória  
> **Localização:** `docs/backend/funcionalidades/regras_globais.md`  
> **Público-alvo:** Agentes de IA e Desenvolvedores Backend  
> **Objetivo:** Estabelecer as fundações inegociáveis de persistência, segurança, integridade, arquitetura em camadas e estratégia de testes no backend da aplicação.

---

## 1. Soft-Delete Mandatório e Integridade Histórica

### 1.1 Princípio Fundamental
Nenhum registro de entidades de negócio (pacientes, procedimentos, agendamentos, transações financeiras, bloqueios de agenda, etc.) deve ser excluído fisicamente do banco de dados via comando SQL `DELETE FROM`.

A exclusão é estritamente **lógica (Soft Delete)**.

### 1.2 Justificativa de Negócio e Técnica
- **Rastreabilidade e Auditoria:** Preservação do prontuário, histórico clínico e registros de atendimentos realizados.
- **Integridade Contábil e Financeira:** Transações financeiras passadas e relatórios de faturamento não podem sofrer distorções ou quebras de chave estrangeira decorrentes da exclusão de um paciente ou procedimento.
- **Recuperabilidade:** Facilidade de restauração de dados em caso de exclusão acidental pelo usuário.

### 1.3 Estrutura Padrão nas Tabelas
As tabelas que suportam soft-delete contêm os seguintes campos de controle:
- `is_active BOOLEAN DEFAULT TRUE`: Flag de status operacional.
- `deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL`: Marcação temporal do momento da exclusão lógica.
- `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`: Registro de última alteração.

### 1.4 Regras de Implementação nos Repositórios
1. **Operação de Exclusão:**
   ```sql
   UPDATE <tabela>
   SET is_active = false,
       deleted_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
   WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL;
   ```
2. **Consultas Operacionais do Dia a Dia (`findAll`, `findById`, buscas):**
   - Devem conter obrigatoriamente a cláusula `AND deleted_at IS NULL`.
   - Filtros adicionais de registros ativos (`AND is_active = true`) aplicam-se conforme o escopo da listagem (ex.: formulários de seleção de procedimentos ativos).
3. **Consultas Analíticas e Auditoria:**
   - Módulos de relatórios históricos e métricas passadas podem incluir registros onde `deleted_at IS NOT NULL`, desde que façam parte do consolidado histórico do período correspondente.
4. **Proibição Estrita:**
   - É terminantemente proibido o uso de `DELETE FROM <table>` no código de produção para entidades de negócio. Exceções aplicam-se apenas a tabelas de cache temporário ou sessões efêmeras sem valor histórico.

---

## 2. Isolamento Estrito Multi-Tenant (Tenant Scoping)

### 2.1 Princípio Fundamental
O sistema adota a arquitetura de **Banco Compartilhado com Esquema Compartilhado (Shared Database, Shared Schema)**. Portanto, o isolamento entre consultórios/clínicas (`tenants`) é o pilar de segurança número 1. 

Nenhuma informação de um consultório pode, sob qualquer circunstância, ser consultada, modificada ou vazada para outro consultório (*Cross-Tenant Data Leakage*).

### 2.2 Camada de Autenticação e Contexto de Requisição
1. **Origem da Identidade:**
   - O identificador do consultório (`tenantId`) é extraído com segurança via `authMiddleware` através de JWT assinado (`req.tenantId`) ou token de integração validado.
   - NUNCA confie no `tenant_id` enviado no corpo da requisição (`req.body`) ou em parâmetros de rota sem confrontar com `req.tenantId`.
2. **Atribuição em Criação (`INSERT`):**
   - Ao persistir novos registros, o campo `tenant_id` deve ser preenchido explicitamente com o valor oriundo do token autenticado (`req.tenantId`).

### 2.3 Camada de Repositório e Consultas SQL
1. **Cláusula Composta Obrigatória:**
   - Todas as consultas por ID específico (`findById`, `update`, `softDelete`) DEVEM combinar o `id` da entidade com o `tenant_id`:
     ```sql
     -- CORRETO:
     SELECT * FROM patients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL;

     -- INCORRETO (Vulnerabilidade de IDOR / Vazamento):
     SELECT * FROM patients WHERE id = $1;
     ```
2. **Listagens Gerais (`findAll`):**
   - A primeira condição do filtro deve ser sempre `WHERE tenant_id = $1`.
3. **Validação de Chaves Estrangeiras Cruzadas:**
   - Ao criar ou atualizar registros relacionados (ex.: vincular um `patient_id` ou `procedure_id` a um novo agendamento), o sistema deve validar se esses registros referenciados também pertencem ao mesmo `tenant_id`.

---

## 3. Arquitetura em Camadas (Routes ➔ Controllers ➔ Services ➔ Repositories)

Para garantir desacoplamento, organização, manutenibilidade e alta testabilidade, o backend adota rigorosamente a divisão em 4 camadas bem delimitadas:

```mermaid
flowchart LR
    Routes["1. Routes\n(Ponto de Acesso / Middlewares)"] --> Controllers["2. Controllers\n(HTTP req/res / Status Codes)"]
    Controllers --> Services["3. Services\n(Regras de Negócio / Validações)"]
    Services --> Repositories["4. Repositories\n(Operações SQL / Banco de Dados)"]
```

### 3.1 Responsabilidades por Camada

| Camada | Pasta | Responsabilidade Principal | O que NÃO deve fazer |
| :--- | :--- | :--- | :--- |
| **Routes** | `backend/src/routes/` | Ponto de entrada da API HTTP. Define os endpoints, verbos HTTP (GET, POST, PUT, DELETE) e anexa middlewares (ex.: `authMiddleware`). | **Não** contém lógica de negócio, **não** trata requisições diretamente e **não** chama repositórios. |
| **Controllers** | `backend/src/controllers/` | Recebe a requisição HTTP (`req`), extrai e valida parâmetros de entrada (`params`, `query`, `body`, `tenantId`), repassa para o Service correspondente e envia a resposta HTTP (`res.status(...).json(...)`). | **Não** executa queries SQL no banco e **não** implementa regras de negócio pesadas. |
| **Services** | `backend/src/services/` | Coração das **Regras de Negócio**. Valida fluxos de domínio, conflitos de horário, regras de faturamento, orquestra múltiplos repositórios ou serviços externos (ex.: BullMQ, Evolution API). | **Não** acessa objetos Express (`req`, `res`), **não** manipula status codes HTTP diretamente e **não** escreve queries SQL diretas. |
| **Repositories** | `backend/src/repositories/` | Camada de **Persistência de Dados**. Executa exclusivamente queries SQL no PostgreSQL (`pg`), aplicando filtros obrigatórios de `tenant_id`, `deleted_at IS NULL`, paginação e ordenação. | **Não** toma decisões de regras de negócio de alto nível e **não** conhece o contexto HTTP. |

---

## 4. Estratégia de Testes Unitários e Isolados por Camada

Cada camada deve possuir seus testes unitários focados, permitindo identificar com precisão a origem de qualquer regressão ou falha:

### 4.1 Testes Unitários de Repositório (`*.repository.spec.ts`)
- **Foco:** Validar se os comandos SQL funcionam corretamente e se as garantias de persistência são cumpridas.
- **O que testar:**
  - Isolamento multi-tenant: registros de um `tenant_id` não são retornados para outro.
  - Soft-delete: registros marcados com `deleted_at` não aparecem em buscas padrão.
  - Filtros de busca, paginação e ordenação SQL.
  - Banco em memória (`pg-mem`) ou banco de teste real para validar sintaxe SQL pura.

### 4.2 Testes Unitários de Service (`*.service.spec.ts`)
- **Foco:** Validar as regras de negócio de forma 100% isolada e rápida.
- **O que testar:**
  - Validações de domínio (ex.: impedir agendamento em horário já ocupado, bloqueio de valores negativos).
  - Lançamento de exceções de negócio (erros específicos com mensagens claras).
  - Orquestração: verificar se os métodos do repositório foram chamados com os parâmetros corretos.
  - **Mocks:** Os repositórios e serviços externos devem ser mockados (ex.: via `vi.fn()` ou instâncias mockadas), sem dependência de banco de dados.

### 4.3 Testes Unitários de Controller (`*.controller.spec.ts`)
- **Foco:** Validar o contrato HTTP e a correta intermediação com o Service.
- **O que testar:**
  - Extração correta de dados de `req.body`, `req.params`, `req.query` e `req.tenantId`.
  - Códigos de status HTTP retornados (ex.: 200 para sucesso, 201 para criação, 400 para entrada inválida, 404 para não encontrado).
  - Resposta a exceções: verificar se os erros lançados pelo Service são convertidos nas respostas HTTP esperadas.
  - **Mocks:** O Service deve ser mockado.

### 4.4 Testes de Rotas e Integração (`*.routes.spec.ts`)
- **Foco:** Validar a integração da API via chamadas HTTP completas utilizando `supertest`.
- **O que testar:**
  - Proteção por middleware: rejeição de chamadas sem token (401).
  - Respostas ponta a ponta dos endpoints.

---

## 5. Padrões de Execução SQL e Concorrência

1. **Parametrização Estrita:**
   - Toda consulta via driver `pg` deve usar exclusivamente parâmetros posicionais (`$1, $2, ...`). É vedada a concatenação de strings ou *template literals* em cláusulas SQL para evitar *SQL Injection*.
2. **Datas e Fusos Horários:**
   - O armazenamento no PostgreSQL é padronizado em UTC (`TIMESTAMP WITH TIME ZONE`).
   - Relatórios e agrupamentos diários devem converter o fuso explicitamente para a timezone local da clínica (ex.: `AT TIME ZONE 'America/Sao_Paulo'`).

---

---

## 7. Autenticação, Gestão de Usuários e Segurança de Identidade

### 7.1 Criação de Contas Exclusiva por Linha de Comando (CLI)
- **Zero Cadastro Aberto:** Não existem e é terminantemente proibido criar endpoints públicos de registro (`/api/auth/register`, `/api/auth/signup`).
- O provisionamento de novos consultórios e seus titulares é feito **exclusivamente pelo desenvolvedor** através do CLI:
  ```bash
  npm run user:create -- --name "Nome do Consultório" --email "contato@clinica.com" [--password "opcional"]
  ```
- Caso nenhuma senha seja informada, o sistema gera automaticamente uma senha temporária aleatória segura de 16 caracteres e marca a flag `must_change_password = true`.

### 7.2 Hashing e Política de Senhas com Bcrypt
- **Algoritmo Obrigatório:** Todas as senhas são armazenadas como hash seguro via `bcrypt` com fator de custo (salt rounds) padronizado em **10**.
- **Proibição de Texto Puro:** Nunca armazene ou compare senhas em texto puro no banco de dados.
- **Proteção contra Comparação de Hash:** A camada de verificação (`PasswordService.verifyPassword`) rejeita senhas cujo texto puro seja idêntico ao hash armazenado (prevenção contra vazamento de hash em trânsito).
- **Política Mínima de Senhas:**
  - Mínimo de 8 caracteres;
  - Ao menos 1 letra;
  - Ao menos 1 número;
  - Obrigação de ser diferente da senha atual na troca.

### 7.3 Recuperação e Reset de Senha pelo Desenvolvedor
- O cliente não possui fluxo de recuperação pública autônoma (ex.: "esqueci minha senha" público).
- A recuperação é conduzida pelo desenvolvedor via CLI administrativo:
  ```bash
  npm run user:reset-password -- --email "contato@clinica.com"
  ```
- O comando gera uma senha temporária aleatória de 16 caracteres, atualiza o hash no PostgreSQL, ativa `must_change_password = true`, incrementa o `token_version` e imprime a credencial temporária uma única vez no console.

### 7.4 Troca Autenticada de Senha pelo Cliente e Invalidação de Sessão
- O cliente logado pode alterar sua senha a qualquer momento através do endpoint `POST /api/auth/change-password`.
- **Invalidação Instantânea de Sessões Anteriores:** Toda troca de senha ou reset administrativo incrementa atomicamente a coluna `token_version` do consultório. Qualquer token JWT emitido com `tv` inferior torna-se imediatamente inválido em todas as rotas protegidas (HTTP 401).

### 7.5 Bloqueio Estrito sob Flag `must_change_password` (HTTP 403)
- Usuários com `must_change_password = true` são restritos pelo `authMiddleware`:
  - **Acesso Permitido:** Apenas rotas de consulta de perfil (`GET /api/auth/me`) e troca de senha (`POST /api/auth/change-password`).
  - **Bloqueio em Rotas de Negócio:** Qualquer tentativa de acessar pacientes, agendamentos, financeiro ou relatórios retorna imediatamente `HTTP 403 Forbidden` com código de erro `PASSWORD_CHANGE_REQUIRED`.

### 7.6 Proibição de Bypass por Cabeçalho (`x-tenant-id`)
- É vedada a autenticação ou determinação de tenant baseada em cabeçalhos não assinados como `x-tenant-id`.
- Todas as requisições autenticadas DEVEM conter o cabeçalho `Authorization: Bearer <token_jwt>`.

### 7.7 Proteção contra Força Bruta no Login (Rate Limiting)
- O endpoint `POST /api/auth/login` é protegido por rate limiter:
  - Limite de **5 tentativas incorretas** por combinação de IP e e-mail em uma janela deslizante de **15 minutos**.
  - Após 5 falhas, requisições subsequentes são bloqueadas com `HTTP 429 Too Many Requests`.
  - Respostas de credenciais inválidas utilizam mensagem genérica padronizada: `"Credenciais inválidas ou acesso não autorizado."`.

---

## 8. Checklist para Novas Implementações e Refatorações

Antes de considerar qualquer nova funcionalidade ou rota concluída, verifique:
- [ ] A rota está registrada em `routes/` apenas mapeando o endpoint, middlewares e o método do Controller?
- [ ] O Controller apenas processa `req`/`res` e delega a lógica para o Service?
- [ ] O Service concentra todas as regras de negócio e validações, sem depender de `req` ou `res`?
- [ ] O Repository é o único que contém queries SQL, filtrando estritamente `tenant_id = $x` e `deleted_at IS NULL`?
- [ ] A exclusão é feita via Soft-Delete (`UPDATE ... SET deleted_at = CURRENT_TIMESTAMP`)?
- [ ] Toda rota protegida exige `Authorization: Bearer <token>` (sem bypass de `x-tenant-id`)?
- [ ] Existem testes unitários para o Repository cobrindo persistência, soft-delete e isolamento multi-tenant?
- [ ] Existem testes unitários para o Service com mocks do Repository cobrindo as regras de negócio?
- [ ] Existem testes unitários para o Controller cobrindo os status codes e tratamento de requisições?
- [ ] Existem testes de rota via Supertest validando a autenticação e integração?

---

## 9. Regras de Negócio Consolidadas dos Módulos Principais

### 9.1 Procedimentos e Custos (`cost_cents`)
- Todo procedimento armazena obrigatoriamente `default_price_cents` (preço cobrado ao paciente) e `cost_cents` (custo operacional de insumos e terceiros).
- Itens de agendamento em `appointment_items` gravam `cost_cents` no momento da criação da consulta para permitir apuração histórica da margem de contribuição.

### 9.2 Horários de Atendimento e Bloqueios de Agenda
- A tabela `business_hours` possui 7 registros por tenant (um por dia da semana). Dias fechados recebem `is_open = false`, sem exclusão física ou lógica.
- Bloqueios de agenda em `schedule_blocks` possuem `title`, `start_time`, `end_time` e operam com soft-delete (`deleted_at`).

### 9.3 Validação Tripla de Agendamentos e Estorno Contábil Automático (D-09)
- Todo agendamento criado sem a flag `confirm_overtime: true` é submetido a verificação tripla de conflitos:
  1. Bloqueios de Agenda (`SCHEDULE_BLOCK` com `block_title`);
  2. Fora do Expediente ou Intervalo de Almoço (`OUTSIDE_HOURS` ou `BREAK_TIME`);
  3. Sobreposição de Paciente (`DOUBLE_BOOKING`).
- Se houver conflito, o servidor responde com `HTTP 409 Conflict` estruturado.
- Se `confirm_overtime: true` for informado, o agendamento é aceito como encaixe extraordinário (`is_overtime = true`).
- **D-09: Estorno Automático no Cancelamento/Exclusão:** Quando um agendamento com status `COMPLETED` for cancelado (`status = 'CANCELLED'`) ou excluído (soft-delete), todas as transações financeiras vinculadas em `financial_transactions` sofrem soft-delete automático (`is_active = false, deleted_at = CURRENT_TIMESTAMP`), impedindo saldo de caixa fantasma.

### 9.4 Gestão Financeira, Parcelamento e Regime de Caixa
- **Edição de Parcelas com Escopo ALL (D-03):** Atualiza apenas parcelas subsequentes com status `PENDING` no mesmo `group_id`, resguardando a integridade contábil das parcelas já pagas (`PAID`).
- **Despesas Recorrentes e Parceladas (D-04):** A primeira parcela recebe o status informado pelo usuário (`PAID` ou `PENDING`); todas as parcelas subsequentes nascem obrigatoriamente como `PENDING`.
- **Categorias Customizadas por Consultório (D-05):** `financial_categories` armazena categorias por tenant com auto-seed sob demanda.
- **Proteção de Receitas Concluídas (D-06):** É proibido excluir transação de receita vinculada a um agendamento ativo e concluído (HTTP 400 com código `LINKED_COMPLETED_APPOINTMENT`).
- **Métricas em Regime de Caixa (D-07):** Transações pagas são contabilizadas na data de pagamento (`payment_date`), e valores pendentes na data de vencimento (`due_date`).

### 9.5 Relatórios Gerenciais, Inteligência e Períodos
- **Filtro Padronizado de Períodos:** Todos os relatórios temporais suportam `period: 'today' | 'this_month' | 'last_30_days' | 'all'`, além de `startDate` e `endDate` customizados em formato `YYYY-MM-DD`.
- **Relatório de No-Show (Faltas):** Retorna `total_appointments`, `no_show_count`, taxa percentual `no_show_rate`, resumo `"X de Y consultas"` e `lost_estimated_cents` (somando o preço dos procedimentos registrados nas consultas faltosas).
- **DRE Gerencial:** Totaliza receitas pagas, despesas pagas, lucro líquido (`net_profit_cents`) e margem de lucro percentual com 2 casas decimais.
- **Recebíveis Futuros:** Apura projeções para os próximos 30, 60 e 90 dias com breakdown discriminado por janela temporal.
- **Procedimentos Mais Rentáveis:** Classifica de 3 a 5 procedimentos ordenados pelo lucro real (`total_profit_cents = receita - custo operacional dos procedimentos`).
- **Pacientes Inativos:** Filtra pacientes sem retorno nos últimos 3 ou 6 meses, excluindo aqueles que possuem agendamentos futuros marcados (`PENDING` ou `CONFIRMED`) e destacando `never_consulted: true`.
- **Histórico por Paciente:** Linha do tempo das consultas de um paciente contendo procedimentos, valores, status de atendimento e status financeiro vinculado (`PAID`, `PENDING` ou `NONE`).

### 9.6 Mensageria WhatsApp, Anti-Ban e Automação (Evolution API)
- **Varredura Diária Automática e Antecedência D+1:** Disparos de confirmação ocorrem automaticamente às 09:00 (America/Sao_Paulo) para consultas do dia seguinte (`PENDING`), sendo proibido o disparo automático no mesmo dia da consulta.
- **Idempotência Inteligente (12 horas):** Disparos manuais sob demanda (`POST /api/whatsapp/batch-confirmations/trigger`) ignoram agendamentos que já receberam mensagem outbound nas últimas 12 horas, salvo sob flag `force: true`.
- **Salvaguardas Anti-Ban Estritas:** Uso obrigatório de jitter humanizado randômico (20s a 50s entre disparos consecutivos), Spintax estocástico (`{Olá|Oi}`) e janela comercial rígida (08:00 às 20:00).
- **Acolhimento Humanizado para Dúvidas e Mídias:** Mensagens livres e áudios transitam a consulta para `MESSAGE_RECEIVED` e disparam automaticamente réplica de acolhimento personalizada informando que a equipe humana responderá em breve.
- **Rastreabilidade e Log Auditável:** Todas as mensagens transacionais trocadas com pacientes cadastrados são registradas na tabela `whatsapp_messages` com direção (`OUTBOUND` ou `INBOUND`), status e ID da Evolution API. Números desconhecidos são ignorados silenciosamente sem gerar erros (AC-025).
- **Arquitetura em 4 Camadas:** É terminantemente proibido executar queries SQL em rotas de WhatsApp ou Webhooks. Toda a persistência é isolada em `WhatsappRepository`, a regra de negócio em `WhatsappService`, `WhatsappSchedulerService` e `WebhookService`, e o contrato HTTP em `WhatsappController` e `WebhookController`.

### 9.7 Sincronização em Lote (Batch Sync), Idempotência e Last-Write-Wins
- **Suporte Nativo a Mutações:** O endpoint `POST /api/sync/batch` processa nativamente payloads estruturados `{ mutations: [{ entity, operation, payload }] }`, além do formato legado com arrays diretos (`appointments`, `patients`).
- **Idempotência por Chave Primária UUID:** Cada agendamento utiliza o UUID v4 gerado no cliente como Chave Primária (`id`) no PostgreSQL. Reenvios subsequentes do mesmo lote (mesmo UUID) são idempotentes e nunca geram registros duplicados.
- **Resolução de Conflito Last-Write-Wins (LWW):** Em concorrência ou edições offline, a versão com `updated_at` mais recente sobrepõe a versão existente no PostgreSQL. Requisições defasadas são contabilizadas como `ignoredCount` sem sobrescrever dados novos.
- **Gravação Atômica de Itens (`appointment_items`):** A criação ou atualização de agendamentos com múltiplos procedimentos vinculados persiste as entidades de forma atômica na mesma transação.

### 9.8 Unicidade Cadastral de Pacientes por Consultório
- **Bloqueio de Duplicidade de WhatsApp:** É estritamente proibido cadastrar ou atualizar dois pacientes ativos (`is_active = true AND deleted_at IS NULL`) com o mesmo número de WhatsApp (comparação por dígitos numéricos `replace(/\D/g, '')`) dentro do mesmo `tenant_id`. Tentativas de duplicação devem ser rejeitadas com erro `HTTP 409 Conflict` informando o nome do cliente já existente.
- **Validação de Choque de Horários e Encaixes:** Agendamentos sobrepostos no mesmo consultório são validados contra consultas ativas existentes, sendo aceitos como encaixe extraordinário apenas quando a flag `is_overtime: true` ou `is_extra_fit: true` estiver presente.
