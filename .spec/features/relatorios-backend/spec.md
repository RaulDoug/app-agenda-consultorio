# Spec: Relatorios backend

> feature: relatorios-backend
> status: pronto

## Contexto

O módulo de Relatórios Gerenciais e Inteligência do Backend fornece dados consolidados de desempenho clínico e financeiro aos consultórios, suportando filtros padronizados de períodos (`today`, `this_month`, `last_30_days`, `all`), métricas em regime de caixa, rentabilidade de procedimentos e acompanhamento da retenção de pacientes.

## Histórias

### US-081 — Relatório de Faltas (No-Show) e Prejuízo Estimado

Como gestor do consultório, quero visualizar as estatísticas de no-show com percentual de faltas, total de agendamentos e valor financeiro perdido, para entender o impacto das faltas na clínica.

#### AC-137 — Consulta de métricas de No-Show com resumo amigável e perda estimada

- **Dado** que existem agendamentos no período com status `COMPLETED`, `CONFIRMED` e `NO_SHOW` vinculados a procedimentos com valores definidos
- **Quando** o usuário solicita o relatório de faltas via `GET /api/reports/no-show` com um período filtrado
- **Então** o sistema retorna `200 OK` com `total_appointments`, `no_show_count`, `no_show_rate`, `summary` (ex: "4 de 14 consultas") e `lost_estimated_cents` calculado pela soma dos procedimentos das consultas faltosas

---

### US-082 — Demonstração do Resultado do Exercício (DRE Simplificado)

Como gestor do consultório, quero visualizar o lucro líquido e a margem de lucro em percentual para avaliar a saúde financeira do consultório.

#### AC-138 — Cálculo de receitas, despesas, lucro líquido e margem de lucro no período

- **Dado** que existem transações financeiras pagas de receita e despesa cadastradas no período
- **Quando** o usuário solicita o DRE via `GET /api/reports/dre`
- **Então** o sistema retorna `200 OK` com `total_income_paid_cents`, `total_expense_paid_cents`, `net_profit_cents` e `margin_percentage` calculada com precisão de 2 casas decimais

---

### US-083 — Projeção de Recebíveis Futuros (Parcelas)

Como gestor do consultório, quero prever a entrada de receitas futuras nos próximos 30, 60 e 90 dias, para planejar o fluxo de caixa.

#### AC-139 — Projeção de contas a receber pendentes em 30, 60 e 90 dias

- **Dado** que existem transações financeiras de receita pendentes (`status = 'PENDING'`) com datas de vencimento futuras
- **Quando** o usuário solicita a projeção de recebíveis via `GET /api/reports/receivables`
- **Então** o sistema retorna `200 OK` com os valores acumulados em `pending_next_30_cents`, `pending_next_60_cents` e `pending_next_90_cents`, além do breakdown por intervalo

---

### US-084 — Procedimentos Realizados Mais Rentáveis

Como gestor do consultório, quero identificar o ranking de procedimentos mais rentáveis ordenados do maior para o menor lucro, levando em conta o custo operacional de cada procedimento.

#### AC-140 — Ranking de rentabilidade de procedimentos baseado em receita menos custo operacional

- **Dado** que existem consultas concluídas contendo procedimentos com preço cobrado e custo de insumos registrados
- **Quando** o usuário solicita o ranking de rentabilidade via `GET /api/reports/procedures-profitability` informando limit entre 3 e 5
- **Então** o sistema retorna `200 OK` com a lista ordenada de 3 a 5 procedimentos contendo `procedure_id`, `procedure_name`, `completed_count`, `total_revenue_cents`, `total_cost_cents`, `total_profit_cents` e `margin_percentage`

---

### US-085 — Identificação de Pacientes Inativos

Como gestor do consultório, quero filtrar pacientes sem consultas nos últimos 3 ou 6 meses que não possuem agendamento futuro marcado, para criar campanhas de reconquista.

#### AC-141 — Listagem de pacientes inativos com corte temporal de 3 meses e 6 meses

- **Dado** que existem pacientes cadastrados com consultas concluídas no passado ou sem histórico de consultas
- **Quando** o usuário solicita a lista de inativos via `GET /api/reports/inactive-patients` com o filtro de `months` (3 ou 6)
- **Então** o sistema retorna `200 OK` com os pacientes inativos, diferenciando os que nunca consultaram e excluindo aqueles com consultas futuras agendadas

---

### US-086 — Histórico Completo de Consultas por Paciente

Como profissional de saúde, quero consultar a linha do tempo de consultas de um paciente específico com procedimentos realizados e status financeiro, para obter seu prontuário resumido.

#### AC-142 — Histórico cronológico detalhado de consultas de um paciente

- **Dado** um paciente cadastrado pertencente ao tenant autenticado
- **Quando** o usuário requisita `GET /api/reports/patient-history/:patientId`
- **Então** o sistema retorna `200 OK` com a lista ordenada decrescente das consultas contendo procedimentos, valores, status de atendimento e status financeiro, além de métricas consolidadas de comparecimento e valor total investido

---

### US-087 — Filtro Padronizado de Períodos nos Relatórios

Como usuário do sistema, quero selecionar rapidamente entre hoje, este mês, últimos 30 dias ou todos os períodos nos relatórios analíticos.

#### AC-143 — Resolução determinística dos períodos hoje, este mês, últimos 30 dias e todos

- **Dado** o parâmetro `period` enviado como `today`, `this_month`, `last_30_days` ou `all`
- **Quando** qualquer endpoint analítico com suporte a períodos é requisitado
- **Então** o sistema calcula as fronteiras de data inicial e final determinísticas em UTC sem misturar fusos ou dados fora do período

## Fora de escopo

- Emissão de notas fiscais (NFS-e) automáticas a partir do relatório de DRE.
- Disparo automatizado de mensagens de marketing em massa no WhatsApp a partir da lista de pacientes inativos (apenas listagem e identificação analítica).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-001 | Consultas com status `CANCELLED` não entram no cômputo de faltas (`NO_SHOW`) nem na receita efetiva. | confirmada | Confirmado conforme regras do sistema. |
| ASM-002 | Procedimentos sem custo explicitado assumem custo zero para cálculo de rentabilidade. | confirmada | Confirmado via `COALESCE(cost_cents, 0)`. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-001 | Pacientes que nunca se consultaram devem ser listados como inativos se o cadastro for mais antigo que o corte? | respondida | Sim, são incluídos com a flag `never_consulted: true`. |
