# Spec: Central fila whatsapp

> feature: central-fila-whatsapp
> status: rascunho

## Contexto

Gerenciamento e controle operacional visual da fila de disparos e confirmações de mensagens de WhatsApp via Evolution API para dentistas e recepcionistas.

## Histórias

### US-120 — Visualização Unificada da Fila e Status de Confirmação

Como dentista ou recepcionista, quero visualizar em uma tela dedicada todos os pacientes e consultas elegíveis para envio de mensagens, identificando com clareza o estado de cada um (na fila, aguardando resposta, confirmado, reagendamento ou atenção humana), para ter total controle do fluxo de confirmações da clínica.

#### AC-209 — Listagem da fila com categorização semântica e isolamento multi-tenant

- **Dado** que existem agendamentos para o período consultado pertencentes ao consultório logado
- **Quando** a rota ou tela da fila de WhatsApp for consultada
- **Então** o sistema deve listar os pacientes com data/horário e categorizá-los corretamente entre PENDING_QUEUE, AWAITING_REPLY, CONFIRMED, RESCHEDULE_REQUESTED e HUMAN_ATTENTION, sem vazar registros de outros consultórios.

#### AC-210 — Exibição de resposta do paciente com atalho para conversa direta no WhatsApp

- **Dado** que um paciente enviou uma resposta de dúvida ou solicitou reagendamento
- **Quando** o card da consulta for renderizado na tela da fila
- **Então** o sistema deve exibir a última mensagem recebida do paciente e disponibilizar ações para abrir a conversa direta no WhatsApp via wa.me ou confirmar/resolver manualmente.

### US-121 — Gestão da Fila: Exclusão, Edição de Mensagem e Reordenação

Como recepcionista, quero poder retirar um paciente da fila sem desmarcar a consulta, personalizar o texto que será enviado para um paciente específico e reordenar a sequência de envios por arrastar e soltar (Drag & Drop), para adaptar os envios à rotina do consultório.

#### AC-211 — Exclusão lógica da fila de envio automático sem cancelar agendamento

- **Dado** um agendamento presente na fila de envio automático
- **Quando** o usuário solicitar a exclusão deste item da fila
- **Então** o agendamento deve ser marcado com whatsapp_queue_excluded = true, ter eventuais jobs pendentes no BullMQ cancelados e permanecer ativo na agenda de consultas.

#### AC-212 — Edição manual da mensagem individual da consulta

- **Dado** um agendamento na fila com mensagem padrão
- **Quando** o usuário editar o texto da mensagem para este paciente específico
- **Então** o sistema deve persistir a mensagem personalizada em whatsapp_custom_message e utilizar esse texto no disparo em vez do template genérico.

#### AC-213 — Reordenação da fila com persistência de ordem

- **Dado** múltiplos itens ordenados na fila
- **Quando** o usuário alterar a ordem dos itens via arrastar e soltar (Drag & Drop)
- **Então** a nova sequência deve ser gravada no campo whatsapp_queue_order e os atrasos de envio no BullMQ devem ser recalculados.

### US-122 — Envio Manual Instantâneo com Saída da Fila Automática

Como usuário do consultório, quero disparar a mensagem de confirmação para um paciente imediatamente através de um botão, inclusive para consultas marcadas para hoje, garantindo que o paciente saia da fila automática e que suas respostas continuem sendo processadas normalmente.

#### AC-214 — Disparo imediato sob demanda com cancelamento da fila automática

- **Dado** um agendamento na fila (inclusive para a data de hoje)
- **Quando** o usuário clicar no botão de envio manual instantâneo
- **Então** a mensagem deve ser enviada imediatamente pela Evolution API, o agendamento deve ser removido de agendamentos futuros na fila BullMQ e deve ser registrado log OUTBOUND em whatsapp_messages.

#### AC-215 — Recepção e processamento de confirmação após envio manual

- **Dado** que uma mensagem foi enviada pelo botão manual instantâneo
- **Quando** o paciente responder com 1 (Sim) ou 2 (Remarcar) via WhatsApp
- **Então** o webhook da Evolution API deve reconhecer o agendamento correspondente, atualizar o status da consulta e disparar a réplica adequada.

### US-123 — Controles Globais da Fila e Edição de Templates

Como administrador da clínica, quero poder iniciar o disparo de toda a fila agora, pausar ou retomar a fila global e configurar os modelos de mensagem padrão, para manter a comunicação alinhada com as necessidades da clínica.

#### AC-216 — Disparo em lote imediato, pausa/retomada e configuração de templates

- **Dado** a central de fila de WhatsApp
- **Quando** o usuário acionar disparo em lote, pausar/retomar fila ou atualizar os 4 templates padrão
- **Então** a fila deve responder ao comando de pausa/retomada e as mensagens padrão devem ser atualizadas e aplicadas nos novos disparos.

### US-124 — Acesso e Navegação através da Aba Mais e Desktop

Como usuário em dispositivo móvel ou desktop, quero acessar a central de envios através de um card no menu Mais e pela barra de navegação, para acessar a fila com rapidez e ergonomia.

#### AC-217 — Navegação para a tela da Fila WhatsApp a partir do menu Mais

- **Dado** a aba Mais (MoreMenuHub) ou menu desktop
- **Quando** o usuário clicar no card de Fila de Envios WhatsApp
- **Então** a aplicação deve abrir a tela dedicada da Central de Fila com filtros de data e controles táteis acessíveis.

## Fora de escopo

- Criação de novos gateways de mensageria além da Evolution API.
- Envio de mensagens em massa não relacionadas a agendamentos (marketing ativo / disparos frios).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-069 | Ao excluir um item da fila de envio, a consulta permanece normalmente na Agenda e não sofre cancelamento. | confirmada | Confirmado pelo usuário. |
| ASM-070 | O filtro padrão ao abrir a Central de Envios apresenta consultas de Hoje e Amanhã com abas rápidas. | confirmada | Confirmado pelo usuário. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-059 | A execução das tarefas deve rodar em paralelo ou sequencial? | respondida | O usuário autorizou a execução em paralelo com agentes em background. |
