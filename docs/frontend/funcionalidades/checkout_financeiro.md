# Funcionalidade: Checkout Financeiro e Baixa de Atendimentos

> **Localização:** `docs/frontend/funcionalidades/checkout_financeiro.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:** `src/features/checkout/components/`, `src/features/checkout/hooks/`, `src/db/repositories/financial-local-repository.ts`

---

## 1. Visão Geral
Fluxo de conclusão de consulta e baixa financeira realizado diretamente na cadeira de atendimento. Permite revisar procedimentos executados, ajustar valores em centavos, aplicar descontos com rateio proporcional, escolher formas de pagamento (dinheiro, pix, cartão, parcelamento) e programar retorno inteligente.

---

## 2. Componentes Principais
- `CheckoutDrawer.tsx`: Gaveta de fechamento contendo resumo da consulta, lista de procedimentos editáveis, campo de desconto global e seleção do meio de liquidação.
- `InstallmentsForm.tsx`: Sub-formulário para planos de parcelamento com entrada opcional e geração de vencimentos automáticos.
- `QuickExpenseModal.tsx`: Modal rápido para lançamento de saídas/despesas operacionais do consultório em menos de 10 segundos.
- `SmartReturnDrawer.tsx`: Gaveta de agendamento de retorno preventivo (15 dias, 30 dias, 6 meses).

---

## 3. Regras de Interação e Negócio
1. **Rateio Automático de Descontos:**
   - Descontos aplicados (em R$ ou %) são distribuídos proporcionalmente entre os itens de procedimento da consulta para manter o custo individualizado.
2. **Registro Financeiro Vinculado:**
   - A finalização do checkout gera registros na tabela local `financial_transactions` com status pago e atualiza o status do agendamento para `COMPLETED`.
3. **Persistência Atômica:**
   - As alterações de status da consulta e a criação da receita/parcelas ocorrem em transação única no Dexie com gravação em lote na `sync_outbox`.
