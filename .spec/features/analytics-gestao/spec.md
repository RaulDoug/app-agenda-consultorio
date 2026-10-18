# Spec: Gestão Financeira de Caixa, Conexão WhatsApp e Reativação de Clientes (Sprint FE-4)

> feature: analytics-gestao
> status: pronta

---

## Contexto

O profissional autônomo precisa controlar a saúde do consultório diretamente pelo celular: acompanhar o caixa (o que entrou, o que tem a receber e o que gastou), quitar parcelas pendentes com 1 toque, monitorar a conexão do WhatsApp para garantir o envio das mensagens e reativar clientes sumidos há mais de 6 meses.

---

## Histórias

### US-042 — Visão Consolidada de Caixa, DRE Rápido e Quitação de Parcelas

Como profissional, quero visualizar os números essenciais do meu caixa e dar baixa rápida em parcelas recebidas, para manter minhas contas organizadas sem burocracia de planilhas.

#### AC-070 — Dashboard de Indicadores Financeiros (Entrou no Caixa, A Receber, Despesas e Lucro)
- **Dado** transações financeiras registradas no banco local (receitas pagas, despesas e parcelas pendentes)
- **Quando** o profissional abre a tela de Caixa / Financeiro
- **Então** o sistema deve exibir cards resumidos com o total de "Entrou no Caixa" (receitas pagas), "A Receber no Mês" (parcelas pendentes), "Despesas Pagas" e "Lucro Líquido Real" com base no período filtrado.

#### AC-071 — Baixa Rápida de Parcelas Pendentes com Atualização Local e Outbox
- **Dado** uma parcela de cobrança com status `PENDING` listada nas contas a receber
- **Quando** o profissional toca no botão "Dar Baixa / Quitar"
- **Então** o status da parcela deve ser atualizado imediatamente para `PAID` com data de pagamento no Dexie.js e a mutação `UPDATE` deve ser enfileirada na `sync_outbox`.

---

### US-043 — Pareamento e Monitoramento de Conexão do WhatsApp

Como profissional, quero saber imediatamente se o meu WhatsApp está conectado e poder escanear o QR Code no app, para ter certeza de que os lembretes automáticos estão sendo enviados.

#### AC-072 — Tela de QR Code e Banner de Alerta de Desconexão
- **Dado** o serviço de integração com a Evolution API
- **Quando** o profissional consulta o status de conexão da sessão
- **Então** se a sessão estiver desconectada, a interface deve exibir um banner de alerta no topo e tela para escanear QR Code; quando a sessão estiver conectada, deve exibir status visual verde "WhatsApp Conectado".

---

### US-044 — Reativação Ativa de Clientes Inativos

Como profissional, quero identificar pacientes que não consultam há mais de 6 meses e chamá-los com 1 toque no WhatsApp, para preencher horários vagos e aumentar a retenção.

#### AC-073 — Lista de Pacientes Inativos (>180 dias) com Atalho Direto de WhatsApp
- **Dado** pacientes cadastrados cuja última consulta realizada foi há mais de 180 dias e que não possuem nenhum agendamento futuro
- **Quando** o profissional visualiza a lista de pacientes inativos
- **Então** o sistema deve listar os pacientes com botão de atalho direto para o WhatsApp (`wa.me/55...`) contendo mensagem amigável sugerindo retorno.

---

## Fora de escopo

- Emissão de relatórios contábeis em PDF ou Excel.
- Disparo massivo não autorizado de spam no WhatsApp.
- Execução de testes E2E com navegador real Playwright (Sprint FE-5).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-023 | A inatividade considera 180 dias da data da última consulta concluída sem nenhum agendamento futuro ativo. | confirmada | Alinhado com a query analítica validada em BE-5. |
| ASM-024 | O QR Code pode ser obtido via API REST ou polling do status de sessão e renderizado diretamente na UI. | confirmada | Consistente com os contratos de API de BE-6. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-023 | O filtro de período no caixa deve ser cumulativo ou fixo? | respondida | Cumulativo, o usuário seleciona o período e o sistema totaliza os valores de entrada, saída e saldo. |
| Q-024 | Como alertar o profissional caso o WhatsApp seja desconectado? | respondida | Exibe banner de alerta no topo do app com link direto para escanear o QR Code. |
