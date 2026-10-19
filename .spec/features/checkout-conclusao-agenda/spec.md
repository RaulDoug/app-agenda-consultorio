# Spec: Integração da Conclusão de Atendimento com Checkout Financeiro

> feature: checkout-conclusao-agenda
> status: pronta

## Contexto

No fluxo operacional da clínica odontológica, a conclusão de um atendimento médico/odontológico deve desencadear diretamente o acerto financeiro do paciente (checkout). Anteriormente (teste TM-AGE-04), ao clicar no botão "Concluir Atendimento" nos detalhes do agendamento, o sistema apenas alternava o status do agendamento para `COMPLETED`, sem abrir a gaveta de checkout, sem permitir a conferência/edição dos valores dos procedimentos realizados, sem possibilitar a escolha da forma de pagamento (PIX, Dinheiro, Cartão ou Parcelado) e sem registrar a receita nas transações financeiras do fluxo de caixa. Esta especificação integra a ação de conclusão com a gaveta de checkout (`CheckoutDrawer`), garantindo a baixa financeira automática e a transição consistente do agendamento para concluído.

## Histórias

### US-059 — Conclusão de Consulta Integrada ao Checkout e Fluxo de Caixa

Como profissional de saúde ou recepcionista do consultório,
quero que ao clicar em "Concluir Atendimento" nos detalhes do agendamento seja aberta a gaveta de checkout para conferência/edição de valores e seleção da forma de pagamento,
para que o agendamento seja finalizado com as respectivas receitas lançadas no fluxo de caixa financeiro.

#### AC-098 — Abertura da gaveta de checkout e baixa financeira com atualização de status ao concluir atendimento

- **Dado** que um agendamento confirmado está selecionado na gaveta de detalhes da consulta (`AppointmentDetailsDrawer`)
- **Quando** o usuário clica no botão "Concluir Atendimento"
- **Então** a gaveta de detalhes deve ser fechada e a gaveta de Checkout (`CheckoutDrawer`) deve ser aberta com os dados e procedimentos da consulta; ao submeter o fechamento ("Concluir Atendimento & Receber"), as transações financeiras devem ser persistidas em `financial_transactions` com status `PAID` e o agendamento deve ser atualizado para status `COMPLETED`.

#### AC-099 — Edição de valores de procedimentos e seleção de forma de pagamento no fluxo de encerramento da consulta

- **Dado** que a gaveta de checkout foi acionada a partir da conclusão de um agendamento
- **Quando** o usuário visualiza os itens da consulta
- **Então** ele pode editar o preço de qualquer procedimento (via editor de preço), aplicar descontos (em R$ ou %) e selecionar o meio de pagamento (PIX, Dinheiro, Cartão de Débito, Cartão de Crédito ou Parcelado), refletindo o valor ajustado final no total cobrado e lançado no caixa.

## Fora de escopo

- Emissão automática de nota fiscal eletrônica (NFS-e).
- Conexão direta com maquininha física de cartão via TEF.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-031 | O componente `CheckoutDrawer` já possui suporte para rateio proporcional de descontos, edição de preços de procedimentos e múltiplos métodos de pagamento, necessitando apenas da conexão com o acionador de conclusão e da transição para COMPLETED. | confirmada | Validado na implementação de `CheckoutDrawer.tsx` e `checkout-ui.spec.tsx`. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-031 | Se o usuário fechar a gaveta de checkout sem confirmar o pagamento, o agendamento deve ser marcado como COMPLETED? | respondida | Não. Se o checkout for cancelado, o agendamento permanece no seu status original (ex: CONFIRMED), garantindo que consultas pendentes de pagamento não sejam dadas como encerradas. |
