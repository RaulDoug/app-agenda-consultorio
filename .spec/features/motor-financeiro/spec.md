# Spec: Motor financeiro

> feature: motor-financeiro
> status: auditada

## Contexto

Implementação do motor financeiro contábil da clínica odontológica com precisão em centavos inteiros (`amount_cents INT`): conclusão de consultas com alteração individual de preços de procedimentos, rateio proporcional de descontos globais com resolução da dízima periódica (O Teste do Centavo), geração de parcelamentos com entrada imediata e projeção mensal resiliente à virada de mês (dias 29, 30 e 31), quitação em lote de parcelas pendentes, lançamento de despesas rápidas de consultório e garantia de Soft Delete contábil.

## Histórias

### US-015 — Conclusão de Consulta, Rateio de Descontos e O Teste do Centavo

Como dentista ou secretária, quero concluir atendimentos com flexibilidade de edição nos procedimentos realizados e concessão de descontos totais rateados proporcionalmente, para que o fechamento financeiro reflita com exatidão matemática o valor cobrado sem perder nenhum centavo.

#### AC-027 — Rateio proporcional de desconto global e edição individual de itens
- **Dado** uma consulta com procedimentos cujos valores individuais podem ser editados ou itens não realizados removidos
- **Quando** o profissional aplicar um desconto no valor total (em valor fixo de centavos ou em percentual %)
- **Então** o sistema deve ratear o desconto proporcionalmente entre os itens confirmados em centavos inteiros, salvando em `appointment_items` os valores efetivos (`effective_price_cents`) cuja soma é idêntica ao total com desconto.

#### AC-028 — Resolução da dízima periódica (O Teste do Centavo) sem perdas ou sobras
- **Dado** 3 procedimentos de R$ 100 (10.000 centavos cada, totalizando 30.000 centavos) com desconto total negociado para R$ 200 (20.000 centavos)
- **Quando** o algoritmo contábil distribuir o valor total final entre os 3 itens
- **Então** o sistema deve alocar exatamente 6.667 centavos para o 1º item, 6.667 centavos para o 2º item e 6.666 centavos para o 3º item, fechando a soma em exatamente 20.000 centavos sem perda ou criação de centavos residuais.

---

### US-016 — Parcelamento Inteligente, Entrada e Projeção Mensal

Como dentista, quero gerar planos de pagamento com entrada imediata e parcelamento do saldo restante com data de vencimento ajustada, para que o fluxo de caixa do consultório e o contas a receber fiquem perfeitamente projetados.

#### AC-029 — Geração de parcelas com entrada diferenciada e status contábil
- **Dado** um plano de pagamento com valor total de R$ 1.500 (150.000 centavos), com entrada imediata de R$ 300 (30.000 centavos) e o saldo dividido em 3 parcelas de R$ 400 (40.000 centavos)
- **Quando** o plano for confirmado no fechamento da consulta
- **Então** o sistema deve criar 4 registros em `financial_transactions`: a entrada com status `PAID`, `installment_number = 1`, `total_installments = 4` e data de pagamento atual; e 3 parcelas com status `PENDING`, `installment_number = 2, 3, 4`, `total_installments = 4` com seus respectivos vencimentos futuros.

#### AC-030 — Projeção mensal de parcelas com ajuste automático para virada de mês (dias 29, 30 e 31)
- **Dado** uma primeira parcela com data de vencimento fixada em 31 de janeiro ou 31 de dezembro (ex: 31/12/2026)
- **Quando** o motor financeiro calcular os vencimentos das parcelas subsequentes
- **Então** o vencimento deve transicionar com segurança entre anos civis, ajustando fevereiro para o último dia válido do mês (28/02 em ano comum ou 29/02 em ano bissexto) e abril para 30/04, restaurando o dia base 31 nos meses que possuem 31 dias, sem gerar datas inválidas ou transbordar para o mês seguinte.

#### AC-031 — Rejeição de entrada maior ou igual ao valor total em cobrança parcelada
- **Dado** uma requisição de parcelamento com mais de 1 parcela
- **Quando** o valor informado para a entrada for maior ou igual ao valor total da cobrança
- **Então** a requisição deve ser rejeitada com código HTTP `400 Bad Request` e mensagem explicativa clara.

---

### US-017 — Baixa de Parcelas e Gestão de Despesas Rápidas

Como operador financeiro do consultório, quero dar baixa em parcelas pagas no balcão e registrar despesas operacionais rápidas com Soft Delete, para manter o caixa e o contas a pagar rigorosamente em dia.

#### AC-032 — Quitação antecipada e em lote de múltiplas parcelas pendentes
- **Dado** duas ou mais parcelas pendentes (`PENDING`) de um paciente ou agendamento
- **Quando** o operador registrar a quitação em lote informando método de pagamento e data
- **Então** o sistema deve atualizar atômica e simultaneamente todas as parcelas selecionadas para status `PAID`, registrando `payment_method` e `payment_date`.

#### AC-033 — Registro e categorização de despesas rápidas de consultório
- **Dado** um pagamento de despesa operacional (já quitada à vista ou a vencer no futuro para controle de contas a pagar)
- **Quando** o operador registrar a saída no sistema com status `PAID` ou `PENDING`
- **Então** deve ser inserida uma transação com `type = 'EXPENSE'`, valor em centavos inteiros (`amount_cents > 0`), categoria informada, status correspondente e data de vencimento/pagamento.

#### AC-034 — Soft Delete e integridade contábil em cancelamento de transações
- **Dado** uma transação financeira ativa vinculada ou não a um agendamento
- **Quando** for solicitada sua exclusão ou estorno
- **Então** o registro não deve ser deletado fisicamente do banco de dados (`DELETE FROM`), mas sim marcado com `is_active = false` e `deleted_at = CURRENT_TIMESTAMP`, preservando a rastreabilidade contábil.

---

## Fora de escopo

- Emissão automática de Nota Fiscal de Serviço Eletrônica (NFS-e) via prefeitura.
- Conciliação bancária via arquivo OFX/CNAB de bancos tradicionais.
- Gateway de pagamento com split automático de cartão de crédito (escopo de integração externa futura).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-008 | Todos os valores monetários no sistema são manipulados e armazenados estritamente como números inteiros de centavos (`INT` no Postgres), impedindo imprecisão de ponto flutuante IEEE 754. | confirmada | Padrão arquitetural obrigatório do OdontoFlow (R$ 150,00 = 15000 centavos). |
| ASM-009 | Ao quitar parcelas em lote, o operador pode utilizar o mesmo método de pagamento para o lote selecionado ou o método previamente acordado. | confirmada | Simplifica o fluxo de caixa rápido no balcão do consultório. |
| ASM-010 | A virada de mês para parcelas fixadas nos dias 29, 30 ou 31 deve manter o dia nominal original para os meses subsequentes que possuem essa quantidade de dias. | confirmada | Ex: dia 31 em janeiro vai para 28 em fevereiro, mas retorna para 31 em março. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-007 | Como proceder caso o desconto concedido pelo profissional seja superior ao valor total somado dos procedimentos? | respondida | O desconto deve ser limitado ao valor total da consulta (desconto máximo = 100%, totalizando 0 centavos a pagar). Valores negativos devem ser rejeitados com HTTP 400. |
| Q-008 | Em caso de cancelamento de uma consulta que já possuía transações pagas (ex: entrada já recebida), o que ocorre com o financeiro? | respondida | A entrada permanece registrada no caixa com Soft Delete ou flag de estorno contábil auditável; as parcelas futuras pendentes são canceladas automaticamente para não inflar o contas a receber. |
| Q-009 | As despesas rápidas devem ser registradas apenas como já quitadas ou podem ser agendadas para o futuro? | respondida | Opção B: Permite lançamento tanto com status PAID (já paga com data) quanto com PENDING (a pagar com vencimento futuro). |
| Q-010 | É permitido remover procedimentos durante o checkout caso não tenham sido executados? | respondida | Sim. O checkout permite editar preços e remover itens não executados, calculando o financeiro apenas sobre os itens confirmados. |
| Q-011 | Quais formatos de desconto são aceitos na conclusão de atendimento? | respondida | Ambos: valor fixo em centavos (discountCents) ou percentual (discountPercent), com conversão exata sem centavos órfãos. |
