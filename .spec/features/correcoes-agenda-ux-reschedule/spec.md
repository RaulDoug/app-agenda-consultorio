# Spec: Controle de Encaixe, UX de Modais e Resiliência na Remarcação

> feature: correcoes-agenda-ux-reschedule
> status: pronta

## Contexto

Ajustes ergonômicos e de integridade na agenda (TM-AGE-03 e fluxos de consulta):
1. Prevenção de conflito de horário com checkbox obrigatório para autorização de encaixe em horários sobrepostos.
2. Bloqueio de rolagem (scroll lock) do plano de fundo e fechamento por toque/clique no backdrop nas gavetas e modais.
3. Resiliência e ciclo de vida do modal de remarcação, impedindo travamento do botão "Remarcando..." e inicializando a data correta da consulta.

## Histórias

### US-055 — Controle Explícito de Encaixe e Prevenção de Conflito de Horário

Como recepcionista ou profissional utilizando a agenda,
quero que o sistema aponte conflitos de horário e exija a confirmação intencional via checkbox para marcar como encaixe,
para que eu não crie sobreposições acidentais na grade sem autorização prévia.

#### AC-093 — Checkbox explícito de autorização de encaixe em caso de sobreposição

- **Dado** que um profissional tenta criar um agendamento em horário com sobreposição a uma consulta existente
- **Quando** o alerta de conflito for exibido no formulário de agendamento rápido
- **Então** o sistema deve exibir um checkbox explícito de "Permitir Encaixe / Horário Extra", impedindo o salvamento se o checkbox estiver desmarcado e persistindo a consulta como `is_extra_fit: true` somente quando o checkbox for ativado intencionalmente.

### US-056 — Bloqueio de Scroll de Fundo e Fechamento por Clique no Backdrop

Como usuário navegando no celular ou desktop,
quero que abrir gavetas ou modais congele a rolagem da página inferior e que clicar no fundo escuro feche a visualização,
para proporcionar uma experiência mobile/desktop polida e sem vazamento de scroll.

#### AC-094 — Scroll lock no body e fechamento ao clicar fora do card

- **Dado** que uma gaveta (`QuickAppointmentDrawer`, `AppointmentDetailsDrawer`) ou modal (`RescheduleModal`) está aberto
- **Quando** o usuário tenta rolar a página ou clica na área externa (backdrop escuro)
- **Então** o scroll do elemento body deve estar bloqueado (`overflow: hidden`), e o clique no backdrop deve acionar o fechamento (`onClose`) sem fechar ao clicar no interior do modal.

### US-057 — Ciclo de Vida e Resiliência do Modal de Remarcação

Como profissional remarcando um atendimento existente,
quero que o modal inicialize com os dados da consulta, destrave o botão após qualquer tentativa e confirme a remarcação,
para que o fluxo de remarcação ocorra de forma fluida sem travar em "Remarcando...".

#### AC-095 — Destravamento garantido e persistência de remarcação sem bloqueio de botão

- **Dado** um agendamento existente selecionado para remarcação
- **Quando** o modal de remarcação for aberto e o profissional confirmar a nova data e horário
- **Então** a consulta deve ser persistida com as novas datas no banco local, o estado de envio deve ser devidamente liberado (`isSubmitting: false` com reset ao abrir) e o modal deve fechar suavemente.

## Fora de escopo

- Cobrança de taxa por cancelamento ou remarcação.
- Notificação push para aplicativos externos além da integração WhatsApp já existente.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-029 | O gerenciamento de `document.body.style.overflow` no ciclo de vida de componentes React (`useEffect`) bloqueia o scroll eficientemente em navegadores desktop e móveis. | confirmada | Padrão padrão em SPAs e PWAs React. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-029 | O checkbox de encaixe deve impedir o envio se não estiver marcado em caso de sobreposição? | respondida | Sim, em caso de conflito o botão de salvar não permite envio sem o checkbox marcado, avisando o usuário. |
