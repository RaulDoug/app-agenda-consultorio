# Tarefas: Checkout Financeiro, Rateio de Descontos e Retorno Inteligente (Sprint FE-3)

> feature: checkout-financeiro

## T-045 — Componente de Checkout com Edição de Itens e Rateio Proporcional de Desconto [concluida]
- Refs: US-038, AC-065, AC-066
- Arquivos: frontend/src/features/checkout/components/CheckoutDrawer.tsx, frontend/src/features/checkout/components/ItemPriceEditor.tsx, frontend/src/features/checkout/utils/discount-splitter.ts
- Notas: Revisão de itens da consulta, remoção de itens, edição individual e aplicação de desconto total em R$ ou % com rateio proporcional sem dízimas perdidas.

## T-046 — Parcelamento Flexível com Entrada e Geração Automática de Parcelas [concluida]
- Refs: US-038, US-039, AC-066, AC-067
- Arquivos: frontend/src/features/checkout/components/InstallmentsForm.tsx, frontend/src/db/repositories/financial-local-repository.ts
- Notas: Definição de entrada, validação visual de entrada > total, quantidade de parcelas sem limite rígido, datas sucessivas mensais e gravação no Dexie com outbox.

## T-047 — Gaveta de Retorno Inteligente (15d, 30d, 6m) e Sugestão de Horários Livres [concluida]
- Refs: US-040, AC-068
- Arquivos: frontend/src/features/checkout/components/SmartReturnDrawer.tsx, frontend/src/features/checkout/utils/smart-return.ts
- Notas: Sugestão de retornos rápidos com 1 toque, verificação de disponibilidade, domingo/ocupado e sugestão das 3 alternativas mais próximas.

## T-048 — Modal de Lançamento Rápido de Despesa (<10s) com Categorias [pendente]
- Refs: US-041, AC-069
- Arquivos: frontend/src/features/checkout/components/QuickExpenseModal.tsx
- Notas: Registro de saídas em menos de 10s, seleção de categoria (materiais, aluguel, laboratório, outros), gravação no Dexie e enfileiramento na outbox.

## T-049 — Suíte de Testes Automatizados TDD do Checkout Financeiro e Retorno [pendente]
- Refs: US-038, US-039, US-040, US-041, AC-065, AC-066, AC-067, AC-068, AC-069
- Arquivos: frontend/src/features/checkout/__tests__/checkout-ui.spec.tsx
- Notas: Suíte completa com React Testing Library e fake-indexeddb com anotações @spec:AC-065 a @spec:AC-069 para prova mecânica.
