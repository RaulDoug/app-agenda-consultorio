# Funcionalidade: Relatórios Gerenciais e Inteligência Clínica

## 1. Visão Geral e Contexto
O módulo de relatórios fornece indicadores consolidados operacionais e financeiros da clínica/consultório, permitindo avaliar produtividade, rentabilidade por procedimento, perdas por ausência de pacientes (no-show), contas a receber futuras e retenção de pacientes.

Todos os relatórios operam sob isolamento multi-tenant obrigatório (`tenant_id = req.tenantId`) e respeitam exclusões lógicas (`deleted_at IS NULL`).

---

## 2. Filtro de Períodos Padronizado

Os relatórios que envolvem datas aceitam o query param `period` com as seguintes resoluções temporais:
- `today`: Início de hoje (`00:00:00`) até o fim de hoje (`23:59:59`);
- `this_month`: Primeiro dia do mês corrente até o último dia do mês corrente;
- `last_30_days`: Hoje menos 30 dias até o fim do dia de hoje;
- `all`: Todo o histórico do tenant (sem restrição de datas).

Também é possível especificar datas personalizadas via `startDate` e `endDate` no formato `YYYY-MM-DD`.

---

## 3. Relatórios Disponíveis

### 3.1 Relatório de No-Show (Faltas)
- **Endpoint:** `GET /api/reports/no-show`
- **Métricas Retornadas:**
  - `total_appointments`: Total de agendamentos no período;
  - `no_show_count`: Consultas marcadas como falta (`status = 'NO_SHOW'`);
  - `no_show_rate`: Percentual de faltas (`(no_show_count / total_appointments) * 100`, com proteção contra divisão por zero);
  - `summary`: Texto amigável (Ex: `"4 de 14 consultas"`);
  - `lost_estimated_cents`: Soma do preço cobrado dos procedimentos vinculados às consultas faltosas (`appointment_items.effective_price_cents`);
  - `lost_estimated_reais`: Valor monetário formatado em BRL (Ex: `"R$ 350,00"`).

### 3.2 Resultado Líquido — DRE Simplificado
- **Endpoint:** `GET /api/reports/dre`
- **Regime:** Regime de Caixa (`payment_date` em transações pagas).
- **Métricas Retornadas:**
  - `total_income_paid_cents`: Total de receitas efetivamente pagas (`INCOME` + `PAID`);
  - `total_expense_paid_cents`: Total de despesas pagas (`EXPENSE` + `PAID`);
  - `net_profit_cents`: Lucro líquido (`receitas - despesas`);
  - `margin_percentage`: Margem líquida em % (`(net_profit_cents / total_income_paid_cents) * 100`).

### 3.3 Recebíveis Futuros (Parcelas)
- **Endpoint:** `GET /api/reports/receivables?referenceDate=YYYY-MM-DD`
- **Métricas Retornadas:**
  - `pending_next_30_cents`: Receitas pendentes nos próximos 30 dias;
  - `pending_next_60_cents`: Receitas pendentes nos próximos 60 dias (acumulado);
  - `pending_next_90_cents`: Receitas pendentes nos próximos 90 dias (acumulado);
  - `breakdown`: Visão discriminada por janelas (`window_0_30_cents`, `window_31_60_cents`, `window_61_90_cents`).

### 3.4 Procedimentos Realizados Mais Rentáveis
- **Endpoint:** `GET /api/reports/procedures-profitability?limit=5&period=this_month`
- **Regra de Cálculo:**
  - Faturamento: Soma de `effective_price_cents` das consultas `COMPLETED`;
  - Custo Operacional: Soma de `COALESCE(ai.cost_cents, p.cost_cents, 0)`;
  - Lucro Líquido do Procedimento: `total_revenue_cents - total_cost_cents`;
  - Margem do Procedimento: `(total_profit_cents / total_revenue_cents) * 100`;
  - Retorna de 3 a 5 itens ordenados decrescentemente por `total_profit_cents`.

### 3.5 Pacientes Inativos
- **Endpoint:** `GET /api/reports/inactive-patients?months=6&referenceDate=YYYY-MM-DD`
- **Parâmetro `months`:** `3` (90 dias) ou `6` (180 dias, padrão).
- **Regras de Seleção:**
  - Pacientes cuja última consulta concluída foi anterior à data de corte;
  - Pacientes que nunca consultaram (`never_consulted: true`) cadastrados há mais tempo que a data de corte;
  - **Exclusão:** Pacientes com agendamento futuro marcado (`PENDING` ou `CONFIRMED`) após a data de referência **não** são considerados inativos.

### 3.6 Histórico de Consultas por Paciente
- **Endpoint:** `GET /api/reports/patient-history/:patientId` (ou `GET /api/patients/:id/appointments-history`)
- **Métricas Retornadas:**
  - `summary`: Total de consultas, concluídas, canceladas, faltas e valor total gasto (`total_spent_cents`);
  - `appointments`: Lista cronológica decrescente com detalhes do agendamento, procedimentos realizados, valores e status financeiro (`PAID`, `PENDING` ou `NONE`).

---

## 4. Arquitetura em 4 Camadas

- **Rotas:** [`src/routes/reports.ts`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/backend/src/routes/reports.ts)
- **Controller:** [`src/controllers/reports-controller.ts`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/backend/src/controllers/reports-controller.ts)
- **Service:** [`src/services/reports-service.ts`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/backend/src/services/reports-service.ts)
- **Repository:** [`src/repositories/reports-repository.ts`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/backend/src/repositories/reports-repository.ts)
- **Contratos TypeScript:** `@cliniassist/shared` em [`shared/src/types/report.ts`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/shared/src/types/report.ts)
