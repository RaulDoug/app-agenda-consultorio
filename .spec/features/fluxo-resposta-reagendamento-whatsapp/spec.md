# Spec: Fluxo resposta reagendamento whatsapp

> feature: fluxo-resposta-reagendamento-whatsapp
> status: pronta

## Contexto

Quando um paciente solicita remarcação de consulta pelo WhatsApp, o atendente executa o reagendamento diretamente na Central de Envios. Após remarcar a consulta para uma nova data/horário, a opção de reagendar deve sumir (pois a remarcação já foi atendida), mantendo acessível a opção de responder ao paciente (com disparo do novo horário em 1 clique ou link direto). Assim que a resposta for enviada ou confirmada, os botões de mensagem somem e o card passa a exibir o estado de "Respondido".

## Histórias

### US-127 — Resolução de Reagendamento e Controle de Resposta ao Paciente na Central de WhatsApp

Como atendente ou secretária do consultório, quero que ao reagendar uma consulta na Central de WhatsApp a opção de remarcação seja concluída, mantendo visível a pendência de resposta até que o paciente seja notificado, para que a comunicação do consultório fique 100% organizada e sem ações redundantes na tela.

#### AC-224 — Ocultação do botão de reagendamento após conclusão da remarcação

- **Dado** que um agendamento na Central de WhatsApp possui solicitação de remarcação e status `RESCHEDULE_REQUESTED`
- **Quando** o atendente conclui a remarcação pelo modal de reagendamento definindo nova data/horário e status `CONFIRMED`
- **Então** o botão "Reagendar Consulta" deve sumir imediatamente do card da consulta, e o card deve refletir a nova data e horário agendados.

#### AC-225 — Exibição de opções de resposta enquanto o paciente aguarda retorno

- **Dado** que um paciente enviou uma mensagem de entrada no WhatsApp e ainda não foi respondido (`is_replied = false`)
- **Quando** o atendente visualiza o card do agendamento na Central de WhatsApp
- **Então** o sistema deve exibir os botões de ação para responder (link externo para WhatsApp, botão para marcar manualmente como respondido e/ou botão de disparo do aviso de novo horário caso já remarcado).

#### AC-226 — Transição para estado de respondido e ocultação dos botões de resposta

- **Dado** que um agendamento na Central de WhatsApp possui mensagem de paciente pendente de resposta
- **Quando** o atendente clica em marcar como respondido, ou envia mensagem de resposta pelo sistema, ou quando o consultório registra uma mensagem de saída posterior à do paciente (`last_outbound_at >= last_inbound_at`)
- **Então** os botões de responder devem ser ocultados e o card deve exibir o indicador/badge de "Respondido".

## Fora de escopo

- Implementação de um chat completo em tempo real (estilo WhatsApp Web embutido).
- Envio de mídias pesadas (áudios, PDFs ou imagens anexas) no disparo de aviso de novo horário.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-074 | A marcação como respondido pode ser feita tanto manualmente pelo atendente quanto inferida automaticamente quando uma mensagem OUTBOUND possuir timestamp posterior à mensagem INBOUND. | confirmada | Confirmado pelo usuário na escolha da opção completa. |
| ASM-075 | Quando o status da consulta é atualizado para CONFIRMED após um reagendamento, a intenção de reagendamento daquela rodada é considerada sanada. | confirmada | Confirmado na definição de fluxo da funcionalidade. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-062 | O disparo de confirmação de novo horário deve ser automático ou com confirmação do atendente? | respondida | O atendente pode tanto acionar com 1 clique direto no card pós-remarcação quanto responder no WhatsApp Web ou marcar como respondido. |
