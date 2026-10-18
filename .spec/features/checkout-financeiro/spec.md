# Spec: Checkout Financeiro, Rateio de Descontos e Retorno Inteligente (Sprint FE-3)

> feature: checkout-financeiro
> status: pronta

---

## Contexto

Ao término da consulta, o profissional precisa concluir o atendimento no celular em poucos segundos ("Caixa de Bolso"), ajustando valores ou aplicando descontos com rateio proporcional, definindo pagamentos à vista ou parcelados, agendando retorno inteligente com 1 toque e lançando despesas rápidas de consultório.

---

## Histórias

### US-038 — Conclusão de Atendimento e Rateio Visual de Desconto (Caixa de Bolso)

Como profissional, quero revisar os procedimentos realizados, ajustar preços ou conceder descontos globais (em R$ ou %) com rateio proporcional automático e remover itens desnecessários, para emitir uma cobrança exata e transparente.

#### AC-065 — Edição Individual de Procedimentos e Rateio Automático de Desconto Geral (R$ e %)
- **Dado** o checkout aberto para uma consulta com múltiplos procedimentos (ex: R$ 200,00 + R$ 250,00 = R$ 450,00)
- **Quando** o profissional altera o valor individual de qualquer item OU aplica desconto geral em reais ou percentual no total (ex: R$ 400,00)
- **Então** o sistema deve recalcular e ratear o desconto proporcionalmente entre os itens sem dízimas perdidas, permitindo também remover itens antes de concluir.

#### AC-066 — Validação Visual de Entrada e Formatação Monetária Fluida
- **Dado** o formulário de pagamento com entrada e parcelamento
- **Quando** o profissional insere uma entrada com valor maior do que o total da consulta
- **Então** a interface deve exibir mensagem de erro clara de validação bloqueando a confirmação até a correção, formatando os valores monetários em formato legível (R$) e armazenando em centavos inteiros.

---

### US-039 — Parcelamento Flexível com Entrada e Vencimentos Automáticos

Como profissional, quero parcelar o pagamento com ou sem entrada, gerando automaticamente as datas de vencimento mensais sem limite rígido de parcelas, para facilitar o fechamento de tratamentos de maior valor.

#### AC-067 — Configuração de Parcelamento com Entrada e Calendário de Vencimentos
- **Dado** uma cobrança configurada como parcelada
- **Quando** o profissional define uma entrada (ex: R$ 100,00 hoje) e a quantidade de parcelas (ex: 3x com 1º vencimento em 17/11/2026)
- **Então** o sistema deve exibir a prévia das parcelas com vencimentos sucessivos (17/11, 17/12, 17/01) e valores exatos, gravando as transações no banco local vinculadas ao agendamento e enfileirando na outbox.

---

### US-040 — Gaveta de Retorno Inteligente ao Finalizar Atendimento

Como profissional, quero agendar o retorno do paciente em prazos recomendados (15 dias, 30 dias ou 6 meses) com 1 toque e resolução inteligente de conflitos, para garantir a fidelização sem perder tempo navegando na agenda.

#### AC-068 — Sugestão de Retorno Rápido (15 dias, 30 dias, 6 meses) com Resolução de Conflitos
- **Dado** a conclusão de um atendimento no checkout
- **Quando** o profissional aciona o retorno inteligente escolhendo um prazo (15 dias, 30 dias ou 6 meses)
- **Então** o sistema deve verificar a disponibilidade da agenda na data sugerida; se o horário estiver livre, confirma com 1 toque; se for domingo ou estiver ocupado, sugere as 3 alternativas mais próximas para seleção rápida.

---

### US-041 — Lançamento Rápido de Despesas de Consultório

Como profissional autônomo, quero registrar despesas do dia a dia (materiais, aluguel, laboratório) em menos de 10 segundos, para manter meu fluxo de caixa sempre atualizado.

#### AC-069 — Modal de Lançamento Rápido de Despesa (< 10 segundos)
- **Dado** o usuário com necessidade de registrar uma saída financeira
- **Quando** abre o modal "+ Despesa" e preenche valor, categoria e data de pagamento
- **Então** a despesa deve ser registrada como transação `EXPENSE` no IndexedDB local e enviada para a outbox de sincronização.

---

## Fora de escopo

- Emissão de notas fiscais eletrônicas (NFS-e).
- Gateway de pagamento por cartão de crédito integrado via maquininha.
- Gráficos analíticos consolidados de faturamento e no-show (Sprint FE-4).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-021 | As transações do checkout geram movimentações `INCOME` vinculadas a `appointment_id`, diferenciando entrada (paga) de parcelas futuras (pendentes). | confirmada | Mantém coerência com o modelo do backend e motor financeiro de BE-4. |
| ASM-022 | O cálculo de retorno inteligente prioriza o mesmo dia da semana e horário da consulta de origem. | confirmada | Reduz atrito cognitivo para o paciente e profissional. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-021 | O checkout financeiro precisa limitar um número máximo de parcelas? | respondida | Não precisa definir um número máximo de parcelas; mantém o fluxo financeiro simples e flexível. |
| Q-022 | Como deve funcionar o rateio de desconto e a remoção de itens antes de concluir? | respondida | Suporta desconto tanto em reais como em % com rateio proporcional sem dízimas perdidas, permitindo remover itens antes de concluir. |
