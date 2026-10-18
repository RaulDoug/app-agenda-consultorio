# Tasks: Motor financeiro

> feature: motor-financeiro

## T-018 — Algoritmo Puro de Cálculo Financeiro: Rateio de Desconto e O Teste do Centavo [concluida]
- Refs: US-015, AC-027, AC-028
- Arquivos: backend/src/financial/calculator.ts
- Notas: Função de rateio de descontos em itens de procedimentos e distribuição exata de centavos residuais (O Teste do Centavo / dízima periódica) sem sobras nem perdas.

## T-019 — Gerador de Parcelas com Regra de Virada de Mês e Validação de Entrada [concluida]
- Refs: US-016, AC-029, AC-030, AC-031
- Arquivos: backend/src/financial/installments.ts
- Notas: Geração de parcelas com entrada imediata (`PAID`), cálculo de vencimentos subsequentes resiliente a meses com menos de 31 dias (ajuste para último dia válido do mês) e rejeição de entrada >= total.

## T-020 — Repositório Financeiro e Transações Contábeis no PostgreSQL [concluida]
- Refs: US-015, US-016, US-017, AC-027, AC-029, AC-034
- Arquivos: backend/src/repositories/financial-repository.ts
- Notas: Operações atômicas de criação de transações financeiras (INCOME e EXPENSE), atualização de valores efetivos em `appointment_items` e Soft Delete de transações para auditoria contábil.

## T-021 — Rotas REST de Conclusão Financeira, Quitação em Lote e Despesas Rápidas [pendente]
- Refs: US-015, US-016, US-017, AC-027, AC-029, AC-031, AC-032, AC-033
- Arquivos: backend/src/routes/financial.ts, backend/src/app.ts
- Notas: Endpoints POST `/api/financial/checkout` (conclusão de consulta), POST `/api/financial/settle-batch` (baixa em lote de parcelas) e POST `/api/financial/expenses` (despesas rápidas).

## T-022 — Suíte Integrada de Testes Automatizados TDD do Motor Financeiro [pendente]
- Refs: US-015, US-016, US-017, AC-027, AC-028, AC-029, AC-030, AC-031, AC-032, AC-033, AC-034
- Arquivos: backend/src/financial/__tests__/financial.spec.ts
- Notas: Testes de unidade e integração cobrindo todos os critérios AC-027 a AC-034 com pg-mem e supertest.
