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
1. **Preservação do Preço Base de Tabela dos Procedimentos:**
   - O preço base dos procedimentos (`basePriceCents`) permanece fixo e inalterado na interface, representando fielmente o valor de tabela cadastrado.
2. **Ajuste Direto pelo Total Final Cobrado:**
   - A alteração do valor da consulta é realizada centralizadamente no campo **Total Final Cobrado**, evitando divergências ou modificações manuais conflitantes nos itens individuais.
3. **Indicador de Variação Assinada (Desconto ou Acréscimo):**
   - Se o valor final for superior ao subtotal: exibe indicador de **Acréscimo** com porcentagem positiva (ex: `+ R$ 50,00 (+14.3%)`) e destaque visual em verde.
   - Se o valor final for inferior ao subtotal: exibe indicador de **Desconto** com porcentagem negativa (ex: `- R$ 50,00 (-14.3%)`) e destaque visual em âmbar.
4. **Rateio Proporcional Ponderado (`effectivePriceCents`):**
   - Tanto descontos quanto acréscimos são distribuídos proporcionalmente aos pesos de cada procedimento no subtotal, calculando o `effectivePriceCents` de cada item e mantendo `basePriceCents` intacto.
5. **Formas de Pagamento e Parcelamento:**
   - O método `CARTAO_CREDITO` é liquidado à vista em parcela única (sem opção de parcelamento direto no checkout).
   - O parcelamento com múltiplos vencimentos é exclusivo da opção `PARCELADO` (carnê / promissória / parcelamento próprio).
6. **Registro Financeiro Vinculado e Persistência Atômica:**
   - A finalização do checkout gera registros na tabela local `financial_transactions` com status pago (ou pendente para parcelas futuras) e atualiza o agendamento para `COMPLETED` com gravação na `sync_outbox`.
