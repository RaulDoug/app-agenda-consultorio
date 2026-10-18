# Spec: Queries analiticas

> feature: queries-analiticas
> status: pronta

## Contexto

Implementação de queries SQL analíticas de alto desempenho e endpoints REST de relatórios gerenciais para o consultório: cálculo da taxa de não comparecimento (No-Show) e receita estimada perdida com proteção contra divisão por zero, DRE simplificado e projeção de fluxo de caixa em janelas de 30, 60 e 90 dias, ranking de procedimentos mais rentáveis e identificação de pacientes inativos há mais de 180 dias sem agendamento futuro para reengajamento.

## Histórias

### US-018 — Indicadores Operacionais e Taxa de Faltas (No-Show)

Como gestor da clínica, quero monitorar a taxa de ausência dos pacientes e o impacto financeiro das faltas, para tomar ações preventivas na confirmação de consultas e preenchimento de horários ociosos.

#### AC-035 — Cálculo exato da taxa de no-show e montante financeiro perdido
- **Dado** um período com agendamentos no consultório (ex: 10 agendamentos no total, sendo 2 marcados como `NO_SHOW` totalizando R$ 300 em procedimentos planejados)
- **Quando** o relatório de indicadores operacionais for consultado
- **Então** o sistema deve retornar `total_appointments = 10`, `no_show_count = 2`, `no_show_rate = 20.0` e `lost_estimated_cents = 30000`.

#### AC-036 — Resiliência a clínica nova (zero agendamentos sem divisão por zero)
- **Dado** uma clínica nova sem agendamentos ou um intervalo de datas sem nenhuma consulta cadastrada
- **Quando** o cálculo da taxa de no-show for executado
- **Então** o sistema deve retornar de forma limpa `total_appointments = 0`, `no_show_count = 0`, `no_show_rate = 0` e `lost_estimated_cents = 0`, sem emitir erro de divisão por zero ou retornar `NaN`/`null`.

---

### US-019 — DRE Simplificado e Projeção de Fluxo de Caixa

Como proprietário do consultório, quero visualizar o Demonstrativo de Resultado simplificado e a projeção de recebíveis futuros, para planejar despesas e manter o equilíbrio financeiro da empresa.

#### AC-037 — Totalizador de receitas pagas, despesas e lucro líquido no período
- **Dado** transações financeiras ativas no período (receitas pagas `INCOME`/`PAID` e despesas pagas `EXPENSE`/`PAID`)
- **Quando** a consulta de DRE simplificado for solicitada para o período
- **Então** o sistema deve calcular `total_income_paid_cents`, `total_expense_paid_cents` e `net_profit_cents` (receitas menos despesas) com precisão exata em centavos inteiros.

#### AC-038 — Projeção de contas a receber pendentes em janelas de 30, 60 e 90 dias
- **Dado** parcelas a receber pendentes (`INCOME`/`PENDING`) com vencimentos futuros cadastrados no contas a receber
- **Quando** a projeção de fluxo de caixa for consultada
- **Então** o sistema deve agregar e retornar os totais previstos para os próximos 30 dias (`pending_next_30_cents`), próximos 60 dias (`pending_next_60_cents`) e próximos 90 dias (`pending_next_90_cents`).

---

### US-020 — Inteligência Comercial e Retenção de Pacientes

Como profissional de saúde, quero saber quais procedimentos geram maior retorno e quais pacientes estão afastados sem retorno agendado, para otimizar meu portfólio de serviços e realizar contato de prevenção dental.

#### AC-039 — Ranking de procedimentos mais rentáveis por receita efetiva
- **Dado** consultas concluídas (`COMPLETED`) com itens registrados em `appointment_items`
- **Quando** o ranking de lucratividade de procedimentos for gerado
- **Então** o sistema deve retornar a lista de procedimentos ordenada decrescentemente pela receita total efetivamente realizada (`total_effective_price_cents`), desconsiderando consultas canceladas ou faltas.

#### AC-040 — Identificação de pacientes inativos há mais de 180 dias sem agendamento futuro
- **Dado** pacientes ativos do consultório com histórico de atendimentos
- **Quando** a busca de pacientes inativos para reengajamento for executada
- **Então** o sistema deve retornar apenas os pacientes cuja última consulta concluída (`MAX(start_time)`) ocorreu há mais de 180 dias e que **não possuam** agendamentos futuros marcados (`start_time > CURRENT_TIMESTAMP`).

---

## Fora de escopo

- Exportação de planilhas contábeis em formato SPED Fiscal ou balanço patrimonial completo.
- Dashboards com gráficos em SVG renderizados pelo servidor (escopo de renderização visual do Frontend).
- Queries de folha de pagamento de comissão por dentista parceiro (escopo futuro).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-011 | Todas as queries analíticas respeitam estritamente o isolamento multi-tenant (`WHERE tenant_id = $1`) e filtram registros com Soft Delete (`deleted_at IS NULL` e `is_active = true`). | confirmada | Princípio fundamental P-001 e P-003 da arquitetura do OdontoFlow. |
| ASM-012 | O montante financeiro perdido em faltas (`lost_estimated_cents`) é calculado pela soma dos preços dos procedimentos associados à consulta em `appointment_items` ou `procedures`. | confirmada | Permite estimar com exatidão o prejuízo de ociosidade da cadeira. |
| ASM-013 | A projeção de 30/60/90 dias calcula janelas cumulativas a partir da data de referência UTC atual. | confirmada | Padrão contábil e de tesouraria para previsão de capital de giro. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-012 | As consultas remarcadas (`RESCHEDULE_REQUESTED`) entram no cálculo de taxa de No-Show? | respondida | Não. Apenas agendamentos com status final `NO_SHOW` representam ausência sem aviso. Consultas reagendadas ou canceladas com antecedência não são faltas. |
| Q-013 | No DRE simplificado, transações deletadas (Soft Delete) devem ser incluídas no cálculo? | respondida | Não. Transações canceladas ou estornadas (`deleted_at IS NOT NULL` ou `is_active = false`) são desconsideradas nos totalizadores de receita e despesa do DRE. |
