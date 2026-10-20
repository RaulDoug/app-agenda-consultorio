# Spec: CRUDs do Backend — Pacientes, Procedimentos, Horários, Bloqueios, Agendamentos e Financeiro

> feature: cruds-backend
> status: pronta

## Contexto

Implementação da camada completa de regras de negócio e operações de CRUD no backend do OdontoFlow estruturada estritamente em 4 camadas (Routes -> Controllers -> Services -> Repositories), abrangendo a gestão de pacientes, catálogo de procedimentos com custos e preços, configuração de expediente semanal e bloqueios de agenda, criação atômica de agendamentos com verificação tripla de conflitos e estorno contábil automático (D-09), e controle financeiro de caixa com despesas recorrentes/parceladas, edição em lote e métricas em Regime de Caixa.

## Histórias

### US-077 — Gestão de Clientes e Catálogo de Procedimentos com Custo Operacional

Como consultório odontológico, quero cadastrar e gerenciar meus pacientes e a tabela de procedimentos com duração, preço cobrado e custo de insumos, para manter a base de dados organizada e viabilizar a análise futura de lucratividade.

#### AC-128 — Cadastro e atualização de procedimentos com duração, preço e custo operacional @spec:AC-128
- **Dado** os dados de um procedimento com nome, duração em minutos, preço cobrado (`default_price_cents`) e custo operacional (`cost_cents`)
- **Quando** o procedimento for criado ou atualizado via API
- **Então** o registro é persistido no banco com todos os campos e isolamento por tenant, impedindo preços negativos ou nomes vazios.

#### AC-129 — Gestão de pacientes com isolamento multi-tenant e soft-delete @spec:AC-129
- **Dado** um paciente ativo cadastrado no consultório
- **Quando** for solicitada a consulta, edição ou desativação do paciente
- **Então** a operação é restrita ao tenant autenticado e a exclusão preserva o histórico através de Soft-Delete (`is_active = false, deleted_at = CURRENT_TIMESTAMP`).

### US-078 — Horários de Atendimento Semanal e Bloqueios de Agenda

Como titular da clínica, quero configurar o expediente regular de atendimento (incluindo intervalo de almoço) e agendar bloqueios de horário para feriados ou ausências, para que a agenda reflita com fidelidade os horários disponíveis.

#### AC-130 — Consulta e atualização de horários de atendimento sem exclusão de dias @spec:AC-130
- **Dado** a grade de 7 dias da semana do consultório
- **Quando** o expediente for consultado ou atualizado via PUT `/api/business-hours`
- **Então** os dias fechados são marcados com `is_open = false` sem exclusão de registros do banco, garantindo integridade e auto-seed inicial.

#### AC-131 — Cadastro e remoção de bloqueios de agenda com soft-delete @spec:AC-131
- **Dado** um período de bloqueio com título, data/hora de início e término
- **Quando** for enviado para `POST /api/schedule-blocks` ou desativado via DELETE
- **Então** o bloqueio é validado temporalmente (`end_time > start_time`) e o cancelamento é gravado como soft-delete.

### US-079 — Agendamento com Verificação Tripla de Conflitos e Estorno Contábil Automático

Como recepcionista ou dentista, quero agendar consultas com múltiplos procedimentos somando o tempo total e checando bloqueios e sobreposições, além de garantir que consultas canceladas estornem automaticamente receitas do fluxo de caixa.

#### AC-132 — Verificação tripla de conflitos com aviso estruturado em HTTP 409 e encaixe @spec:AC-132
- **Dado** uma solicitação de agendamento em horário conflitante com bloqueio de agenda, fora de expediente ou com outro paciente agendado
- **Quando** enviada sem a flag `confirm_overtime: true`
- **Então** a API recusa com `HTTP 409 Conflict` contendo código (`SCHEDULE_BLOCK`, `OUTSIDE_HOURS`, `BREAK_TIME` ou `DOUBLE_BOOKING`) e detalhes, permitindo forçar o agendamento como encaixe (`is_overtime = true`) caso `confirm_overtime: true` seja enviado.

#### AC-133 — Estorno contábil automático de transações vinculadas ao cancelar ou excluir agendamento concluído @spec:AC-133
- **Dado** um agendamento com status `COMPLETED` que gerou transações financeiras no caixa
- **Quando** este agendamento for cancelado (`status = 'CANCELLED'`) ou excluído via soft-delete
- **Então** o sistema desativa automaticamente (`is_active = false, deleted_at = CURRENT_TIMESTAMP`) todas as transações financeiras vinculadas em `financial_transactions`, impedindo receitas fantasmas.

### US-080 — Gestão Financeira, Despesas Parceladas e Métricas em Regime de Caixa

Como gestor da clínica, quero registrar despesas avulsas, recorrentes e parceladas, editar parcelas em lote com segurança contábil e consultar o faturamento realizado e a receber em Regime de Caixa.

#### AC-134 — Despesas recorrentes e parceladas com agrupamento group_id e status pendente subsequente @spec:AC-134
- **Dado** uma despesa configurada para N meses recorrentes ou parceladas em N vezes
- **Quando** for enviada para `POST /api/financial/expenses`
- **Então** o sistema gera N transações vinculadas pelo mesmo `group_id`, onde a 1ª parcela assume o status escolhido pelo usuário (`PAID` ou `PENDING`) e todas as parcelas subsequentes nascem com status `PENDING`.

#### AC-135 — Edição de parcelas com escopo ALL preservando parcelas pagas e bloqueio de exclusão D-06 @spec:AC-135
- **Dado** uma parcela de um grupo que é editada com `scope: 'ALL'`
- **Quando** a atualização for executada
- **Então** apenas as parcelas subsequentes com status `PENDING` são atualizadas, resguardando o histórico das já pagas (`PAID`), e a exclusão manual de receitas de agendamentos concluídos é barrada com HTTP 400 (`LINKED_COMPLETED_APPOINTMENT`).

#### AC-136 — Relatórios analíticos e consolidação de indicadores financeiros em Regime de Caixa @spec:AC-136
- **Dado** o período selecionado (`today`, `this_month`, `last_30_days`, `all` ou datas customizadas)
- **Quando** o endpoint `GET /api/financial/metrics` for consultado
- **Então** os valores de faturamento e despesas pagas são filtrados por `payment_date` e valores pendentes por `due_date`, calculando o lucro líquido real apurado.

## Fora de escopo

- Emissão de notas fiscais eletrônicas de serviço (NFS-e).
- Integração direta com gateway bancário ou maquininhas físicas TEF/POS.
- Visualização de prontuário clínico e odontograma (previstos em sprints futuras de prontuário).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-041 | A verificação de expediente e bloqueios utiliza UTC para garantir portabilidade em qualquer servidor ou máquina local. | confirmada | Implementado e validado em UTC. |
| ASM-042 | O cancelamento ou exclusão de consulta concluída deve estornar integralmente as receitas vinculadas para preservar a saúde do caixa. | confirmada | Implementado conforme decisão D-09. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-041 | Como lidar com a edição de parcelas de despesas em lote sem ferir a conciliação bancária? | respondida | O escopo `ALL` atualiza apenas parcelas subsequentes com status `PENDING`, preservando as já quitadas (`PAID`). |
