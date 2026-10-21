# Tasks: Melhorias financeiro agenda gestao

> feature: melhorias-financeiro-agenda-gestao

## T-001 — Navegação Temporal Coerente e Interação no Grid da Agenda [concluida]

- Refs: US-106, AC-183
- Arquivos: frontend/src/features/agenda/components/ScheduleGrid.tsx, frontend/src/App.tsx
- Notas: Conexão do manipulador `onSelectDate` para chavear para visualização 'day' ao clicar no dia nas visões semanal e mensal. Ajuste das setas em App.tsx para navegar ±7 dias na semana e ±1 mês no mês.

## T-002 — Blindagem de Sincronização Pull Contra Sobrescrita de Status Recentes [concluida]

- Refs: US-106, AC-184
- Arquivos: frontend/src/sync/sync-manager.ts
- Notas: Verificação de mutações pendentes na `sync_outbox` e checagem de timestamps `updated_at` antes de aplicar deltas do servidor no Dexie, eliminando o glitch onde o status NO_SHOW voltava para pendente.

## T-003 — Parcelamento no Cartão, Vencimentos Individuais e Edição Livre de Valores no Checkout [concluida]

- Refs: US-107, AC-185, AC-186
- Arquivos: frontend/src/features/checkout/components/CheckoutDrawer.tsx, frontend/src/features/checkout/components/InstallmentsForm.tsx, frontend/src/features/checkout/components/ItemPriceEditor.tsx
- Notas: Habilitar opções de parcelas no CARTAO_CREDITO (1x a 12x), input de data individual para cada parcela e digitação fluida de preços manuais incluindo cortesia (R$ 0,00).

## T-004 — Filtros Temporais Avançados, Busca Textual Normalizada e Exportação CSV Enriquecida [concluida]

- Refs: US-108, AC-187, AC-188
- Arquivos: frontend/src/features/analytics/components/FinancialLedger.tsx
- Notas: Inclusão de filtro por mês/ano e seletor de data específica no Livro Caixa. Normalização de acentos na busca textual com indexação de nomes de pacientes. Exportação CSV com colunas de cliente e telefone preenchidas para receitas.

## T-005 — Modal de Detalhes, Edição, Estorno e Soft-Delete de Transações Financeiras [concluida]

- Refs: US-108, AC-189
- Arquivos: frontend/src/features/analytics/components/TransactionDetailModal.tsx, frontend/src/features/analytics/components/FinancialLedger.tsx, frontend/src/db/repositories/financial-local-repository.ts
- Notas: Criação do modal/drawer de detalhes da transação acessível por clique no card do extrato. Métodos de repositório para edição, baixa pontual com seleção de meio de pagamento, estorno (revertPayment -> PENDING) e soft-delete com outbox.

## T-006 — Gestão Avançada de Despesas: Reset de Formulário, Status Pendente, Parcelamento e Recorrência [concluida]

- Refs: US-109, AC-190
- Arquivos: frontend/src/features/checkout/components/QuickExpenseModal.tsx, frontend/src/db/repositories/financial-local-repository.ts
- Notas: Reset de campos ao abrir o modal, toggle para despesa paga vs pendente (com data de vencimento) e geração de despesas parceladas (2x a 12x) ou recorrentes mensais.

## T-007 — Alerta de Inadimplência, Isolamento Estrito de Dados, Persistência de Shell e Token em Relatórios [concluida]

- Refs: US-110, US-111, AC-191, AC-192
- Arquivos: frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientFinancialDrawer.tsx, frontend/src/App.tsx, frontend/src/features/analytics/components/ReportsView.tsx, frontend/src/services/reports-api.ts
- Notas: Badge de débito pendente no card do paciente. Correção do filtro do prontuário financeiro do paciente para vincular estritamente por ID de agendamento (resolvendo TM-FIN-12). Preservação do estado das telas em App.tsx e propagação do token JWT para ReportsView eliminando erro 401.

## T-008 — Suíte de Testes Automatizados TDD Integrada e Prova Mecânica [concluida]

- Refs: US-106, US-107, US-108, US-109, US-110, US-111, AC-183, AC-184, AC-185, AC-186, AC-187, AC-188, AC-189, AC-190, AC-191, AC-192
- Arquivos: frontend/src/features/analytics/__tests__/melhorias-financeiro-agenda-gestao.spec.tsx
- Notas: Cobertura automatizada de ponta a ponta com anotações @spec:AC-183 a @spec:AC-192 garantindo prova mecânica via onp-spec verify e audit.
