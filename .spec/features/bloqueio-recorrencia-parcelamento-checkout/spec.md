# Spec: Bloqueio de Cobrança Duplicada, Parcelamento Nativo e Estorno de Pagamento

> feature: bloqueio-recorrencia-parcelamento-checkout
> status: pronta

## Contexto

Após a integração do encerramento de consultas com o fluxo de checkout (TM-AGE-04), foram identificadas oportunidades críticas de melhoria na operação da recepção e consultório:
1. Agendamentos já faturados e concluídos (`COMPLETED`) permitiam ao usuário reabrir os detalhes, alterar o status de volta para confirmado e clicar novamente em "Concluir Atendimento", gerando lançamentos financeiros duplicados no caixa.
2. Ao selecionar a forma de pagamento "Parcelado" no `CheckoutDrawer`, os campos de entrada, número de parcelas e prévia do calendário de vencimentos não eram renderizados nativamente.
3. Não havia mecanismo operacional para estornar um pagamento concluído por engano humano, deduzindo o valor do fluxo de caixa e reabrindo a consulta para correção.

Esta especificação implementa a blindagem de agendamentos concluídos com proteção idempotente no banco local, a integração nativa do formulário de parcelamento no checkout e o fluxo seguro de estorno financeiro com reabertura de atendimento.

## Histórias

### US-060 — Proteção contra Duplicidade de Cobrança e Bloqueio de Edição em Atendimentos Concluídos

Como recepcionista ou gestor do consultório,
quero que agendamentos com faturamento concluído tenham suas ações de status e edição bloqueadas e protegidas contra duplo faturamento,
para que o caixa não seja inflado indevidamente por lançamentos repetidos da mesma consulta.

#### AC-100 — Bloqueio visual de ações rápidas de status e edição em consultas concluídas

- **Dado** que o operador abre os detalhes de um agendamento com status `COMPLETED` (`AppointmentDetailsDrawer`)
- **Quando** o operador visualiza os procedimentos e as ações rápidas da consulta
- **Então** o botão de editar procedimentos deve estar oculto, os botões comuns de transição de status devem estar ocultos, e deve ser exibido um card informativo com a mensagem de que o atendimento foi concluído e faturado.

#### AC-101 — Proteção idempotente no repositório financeiro contra checkout duplicado

- **Dado** que um agendamento já possui transações financeiras ativas registradas em `financial_transactions`
- **Quando** o método `recordCheckout` for invocado novamente para o mesmo `appointmentId`
- **Então** o repositório deve lançar um erro informando que o agendamento já possui faturamento registrado, impedindo inserções duplicadas no banco local e outbox.

### US-061 — Parcelamento Nativo com Entrada e Prévia de Vencimentos no Checkout

Como recepcionista ou profissional de saúde,
quero definir entrada, quantidade de parcelas (1x a 12x) e data de vencimento diretamente na gaveta de checkout ao selecionar a opção "Parcelado",
para que o plano de pagamento acordado com o paciente seja registrado e visualizado com clareza antes da finalização.

#### AC-102 — Integração nativa do formulário de parcelamento com entrada e vencimentos no checkout

- **Dado** que a gaveta `CheckoutDrawer` está aberta para faturamento de uma consulta
- **Quando** o operador seleciona a forma de pagamento "Parcelado"
- **Então** o formulário de parcelamento (`InstallmentsForm`) deve ser exibido imediatamente contendo campo de entrada em R$, seletor de parcelas (1x a 12x), data de vencimento e a tabela prévia com datas e valores de cada parcela; a submissão do checkout deve gravar a entrada como paga (`PAID`) na data de hoje e as parcelas restantes como pendentes (`PENDING`).

### US-062 — Estorno de Pagamento e Reabertura de Atendimento por Erro Humano

Como recepcionista ou gestor do consultório,
quero estornar o faturamento de um atendimento concluído incorretamente,
para que as transações sejam deduzidas do caixa e o agendamento seja reaberto em status Confirmado para devidos ajustes.

#### AC-103 — Estorno financeiro com desativação de transações e reabertura do agendamento para CONFIRMED

- **Dado** que um atendimento foi concluído e faturado no caixa (`COMPLETED`)
- **Quando** o operador clica em "Estornar Pagamento e Reabrir Consulta" na gaveta de detalhes e confirma a operação
- **Então** todas as transações financeiras vinculadas a este agendamento devem receber soft-delete (`is_active: false`, `deleted_at` preenchido), o fluxo de caixa deve abater a receita imediatamente, e o agendamento deve ter seu status revertido para `CONFIRMED` com as ações e edição liberadas novamente.

## Fora de escopo

- Integração bancária direta para devolução de PIX via chave ou API bancária (estorno contábil/local).
- Impressão física de comprovante de estorno em impressora térmica.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-032 | As transações financeiras possuem campos `is_active` e `deleted_at`, que o `CashFlowDashboard` e `filterTransactionsByPeriod` já utilizam para filtrar transações ativas no cálculo das métricas de caixa. | confirmada | Verificado na arquitetura de `financial_transactions` e `cash-calculator.ts`. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-032 | Ao estornar um agendamento parcelado, tanto a entrada paga quanto as parcelas pendentes devem ser desativadas? | respondida | Sim. Todas as transações financeiras vinculadas ao `appointment_id` são soft-deleted, zerando o impacto financeiro dessa consulta no caixa e a receber. |
