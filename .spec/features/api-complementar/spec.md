# Spec: Api complementar

> feature: api-complementar
> status: pronta

## Contexto

Implementação dos alicerces de backend exigidos pela aplicação frontend CliniAssist (PWA Local-First): autenticação e emissão de JWT multi-tenant, sincronização delta (Pull Sync) para atualização de dados ocorridos no servidor, endpoints de gerenciamento da sessão WhatsApp (status e QR Code), rotas REST para expediente semanal e bloqueios de agenda, listagem de transações financeiras e disponibilização das funções puras de domínio no pacote `@cliniassist/shared` para execução offline no navegador.

## Histórias

### US-021 — Autenticação e Sessão Multi-Tenant

Como profissional do consultório, quero me autenticar com credenciais para acessar a aplicação e vincular todas as minhas ações ao meu consultório (tenant) de forma segura.

#### AC-041 — Login com sucesso gerando token JWT e dados do tenant
- **Dado** um tenant ativo cadastrado com e-mail/usuário e senha válida (ou hash seguro)
- **Quando** a requisição `POST /api/auth/login` for submetida com as credenciais corretas
- **Então** a API deve retornar status `200 OK`, token JWT contendo `tenant_id` no payload e o objeto `tenant` com dados cadastrais e status do WhatsApp.

#### AC-042 — Rejeição de login com credenciais incorretas ou tenant inativo
- **Dado** credenciais com senha inválida, usuário inexistente ou tenant desativado (`is_active = false`)
- **Quando** a requisição `POST /api/auth/login` for processada
- **Então** a API deve responder `401 Unauthorized` com mensagem de erro amigável, sem detalhar qual campo falhou.

---

### US-022 — Sincronização Delta (Pull Sync) para Dispositivos Offline-First

Como aplicativo móvel operando no consultório, quero requisitar apenas os dados criados ou atualizados no servidor desde o meu último sincronismo (`since`), para manter o banco local Dexie.js atualizado com o menor consumo de rede possível.

#### AC-043 — Retorno delta incremental de mutações do servidor
- **Dado** um timestamp ISO de referência (`since`) e mutações ocorridas no servidor após esse instante (ex: agendamento com status alterado por confirmação de WhatsApp)
- **Quando** a rota `GET /api/sync/pull?since=<timestamp>` for chamada com o header de autenticação
- **Então** a API deve retornar as listas incrementais de registros (`appointments`, `patients`, `procedures`, `financial_transactions`, `schedule_blocks`) cuja coluna `updated_at` (ou `created_at`) seja estritamente superior a `since`, respeitando o isolamento do tenant.

---

### US-023 — Gerenciamento da Sessão e Status do WhatsApp

Como profissional, quero visualizar no aplicativo o status de conexão da minha instância do WhatsApp e gerar um novo QR Code caso a conexão caia, para restabelecer os disparos automáticos de lembrete.

#### AC-044 — Consulta de status da sessão WhatsApp e obtenção de QR Code
- **Dado** um tenant configurado com nome de instância WhatsApp
- **Quando** a rota `GET /api/whatsapp/session` for consultada
- **Então** a API deve retornar se a instância está conectada (`connected: true/false`), dados de pareamento e a string/base64 do QR Code quando pendente de conexão.

---

### US-024 — Gestão de Expediente e Bloqueios de Agenda

Como profissional, quero configurar meus dias e horários de atendimento regulares e registrar bloqueios de agenda (almoço, folgas, férias), para orientar a grade visual e as regras de encaixe no aplicativo.

#### AC-045 — Consulta e atualização do expediente semanal de trabalho
- **Dado** os horários de funcionamento do consultório configurados por dia da semana (0 a 6)
- **Quando** as rotas `GET /api/business-hours` e `PUT /api/business-hours` forem executadas
- **Então** o sistema deve persistir e retornar a grade horária configurada, validando que o horário de término seja posterior ao horário de início e que o intervalo de almoço esteja contido na jornada.

#### AC-046 — Cadastro, listagem e remoção de bloqueios de agenda
- **Dado** um período em que a clínica não atenderá (ex: feriado ou consulta médica pessoal)
- **Quando** as rotas de bloqueio forem acionadas (`POST`, `GET`, `DELETE /api/schedule-blocks`)
- **Então** os bloqueios devem ser registrados e listados com motivo e intervalo de datas, permitindo cancelamento/exclusão.

---

### US-025 — Listagem e Filtro de Transações Financeiras

Como profissional, quero consultar o extrato detalhado de transações financeiras com filtros de data e status, para alimentar a tela de caixa e parcelas a vencer no celular.

#### AC-047 — Listagem filtrada de movimentações de receitas e despesas
- **Dado** transações financeiras registradas no tenant
- **Quando** a rota `GET /api/financial/transactions` for consultada com filtros (`startDate`, `endDate`, `status`, `type`)
- **Então** a API deve retornar os registros contábeis ativos ordenados por data de vencimento/pagamento, excluindo transações estornadas com soft delete.

---

### US-026 — Domínio Compartilhado em `@cliniassist/shared` para Execução Offline

Como aplicação móvel PWA, quero executar as regras de rateio de desconto, cálculo de parcelas e busca de horários livres de retorno diretamente no dispositivo sem precisar de conexão com o servidor.

#### AC-048 — Disponibilização e validação das regras de negócio em `@cliniassist/shared`
- **Dado** o pacote de biblioteca `@cliniassist/shared`
- **Quando** os algoritmos puros de cálculo financeiro (`calculateDiscountDistribution`, `generateInstallmentSchedule`, `validateInstallmentPlan`) e cálculo de agenda (`validateBusinessHours`, `findSmartReturnSlots`) forem importados
- **Então** eles devem executar de forma determinística no frontend ou backend, com tipagem TypeScript estrita e suíte de testes garantida.

---

## Fora de escopo

- Gestão de múltiplos usuários com níveis granulares de permissão RBAC (o consultório opera com credencial única nesta fase, conforme alinhado com o PO).
- Envio de SMS ou e-mail de recuperação de senha (redefinição manual ou fluxo simplificado).
- Emissão de notas fiscais eletrônicas de serviço (NFS-e).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-014 | A autenticação utiliza JWT assinado com chave secreta configurável e expiração razoável (ex: 7 a 30 dias com persistência segura no cliente). | confirmada | Permite uso fluido em PWA mobile com suporte offline. |
| ASM-015 | A rota de Pull Sync (`GET /api/sync/pull`) utiliza timestamps ISO 8601 em UTC para comparação de deltas de alteração. | confirmada | Evita descompassos de fuso horário entre servidor e dispositivo. |
| ASM-016 | As funções puras movidas para `@cliniassist/shared` mantêm 100% de retrocompatibilidade com os testes já provados nas Sprints BE-1 a BE-5. | confirmada | Zero quebra de contratos existentes. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-015 | O modelo de autenticação deve prever múltiplos usuários por clínica ou credencial única por consultório? | respondida | Por enquanto apenas um único usuário por consultório/clínica. Alinhado com o PO. |
| Q-016 | As regras puras de cálculo de agenda e financeiro devem ser movidas para `@cliniassist/shared` para operar offline? | respondida | Sim, execução compartilhada para viabilizar operação 100% Local-First no PWA. Alinhado com o PO. |
