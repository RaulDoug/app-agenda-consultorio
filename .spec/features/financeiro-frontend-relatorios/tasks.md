# Tasks: Financeiro e Relatórios Gerenciais no Frontend (Mobile-First)

> feature: financeiro-frontend-relatorios

## T-001 — Extrato Financeiro Detalhado Mobile-First e Filtros Avançados (Ledger) [concluida]

- Refs: US-101, AC-178
- Arquivos: frontend/src/features/analytics/components/FinancialLedger.tsx, frontend/src/features/analytics/components/CashFlowDashboard.tsx
- Notas: Componente de extrato (livro caixa) em cards verticais touch-friendly, com abas horizontais deslizantes (Todas, Receitas, Despesas, Pendentes), busca por texto, filtro de categorias e exportação CSV.

## T-002 — Baixa em Lote com Ergonomia One-Thumb e Bottom Sheet de Confirmação [concluida]

- Refs: US-102, AC-179
- Arquivos: frontend/src/db/repositories/financial-local-repository.ts, frontend/src/features/analytics/components/ReceivablesList.tsx, frontend/src/features/analytics/components/BatchSettleModal.tsx
- Notas: Checkboxes com touch targets >= 44px, barra de ação inferior flutuante na zona do polegar com totalizador R$, Bottom Sheet modal de confirmação e método `settleBatch` atômico no repositório local com sync outbox.

## T-003 — Gestão Dinâmica e Seleção de Categorias Financeiras [concluida]

- Refs: US-103, AC-180
- Arquivos: frontend/src/features/checkout/components/QuickExpenseModal.tsx, frontend/src/db/repositories/financial-local-repository.ts
- Notas: Carregamento reativo de categorias ativas de despesas com fallback seguro para categorias padrão locais e botões touch-friendly.

## T-004 — Conector Híbrido de Relatórios e Revalidação Server-Side [concluida]

- Refs: US-104, AC-181
- Arquivos: frontend/src/services/reports-api.ts, frontend/src/features/analytics/components/ReportsView.tsx
- Notas: Visualização instantânea local via Dexie em cards verticais mobile, com revalidação assíncrona opcional contra os endpoints `/api/reports/*` e badge discreto de status de sincronização.

## T-005 — Prontuário Financeiro no Detalhe do Paciente via Bottom Drawer [concluida]

- Refs: US-105, AC-182
- Arquivos: frontend/src/features/patients/components/PatientFinancialDrawer.tsx, frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientCard.tsx
- Notas: Botão de finanças ($) no card do paciente abrindo Bottom Drawer deslizante com histórico de gastos, consultas, procedimentos e baixa pontual.

## T-006 — Suíte de Testes Automatizados TDD e Prova Mecânica [concluida]

- Refs: US-101, US-102, US-103, US-104, US-105, AC-178, AC-179, AC-180, AC-181, AC-182
- Arquivos: frontend/src/features/analytics/__tests__/financeiro-relatorios.spec.tsx
- Notas: Testes unitários cobrindo todos os critérios com tags @spec:AC-178 a @spec:AC-182 usando fake-indexeddb.
