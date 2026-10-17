# Spec: Dominio agenda

> feature: dominio-agenda
> status: auditada

## Contexto

Implementação das regras de negócio e funções puras de domínio para agendamento de consultas, cálculo dinâmico de duração, normalização de telefone para WhatsApp, validação de expediente com suporte a encaixes extraordinários, algoritmo de retorno inteligente (sugestão dos 3 horários vagos mais próximos) e máquina de estados imutável para consultas concluídas no OdontoFlow.

## Histórias

### US-001 — Cálculo Dinâmico de Duração por Procedimentos

Como cirurgião-dentista, quero que a duração da consulta seja calculada pela soma dos tempos de cada procedimento selecionado, para que minha grade reflita a duração real do atendimento sem sobreposições.

#### AC-001 — Soma de durações determina o horário final

- **Dado** um agendamento iniciando às "2026-10-20T09:00:00" e uma lista de durações [30, 45] minutos
- **Quando** a duração total e o término do agendamento forem calculados
- **Então** o término deve ser exatamente "2026-10-20T10:15:00" e a duração total deve ser 75 minutos.

#### AC-002 — Rejeição de procedimentos com duração inválida

- **Dado** um procedimento informado com duração menor ou igual a zero (ex: 0 ou -15 minutos)
- **Quando** o cálculo de agendamento ou validação de procedimento for executado
- **Então** o sistema deve rejeitar o cálculo com erro explícito de duração inválida.

### US-002 — Normalização Canônica de Telefones WhatsApp

Como dentista-operador, quero que qualquer telefone de paciente digitado no Brasil seja padronizado no formato canônico com DDI 55, DDD e 9 dígitos, para que os disparos automáticos via WhatsApp funcionem sem falhas de discagem.

#### AC-003 — Sanitização e formatação canônica de celular brasileiro

- **Dado** números de telefone em formatos variados como "(11) 99999-8888", "+55 11 99999-8888" ou "11999998888"
- **Quando** o número for normalizado pela função de domínio
- **Então** o resultado deve ser o número canônico limpo "5511999998888".

#### AC-004 — Rejeição de telefones inválidos

- **Dado** uma entrada de telefone com DDD inválido ou quantidade insuficiente/excessiva de dígitos (ex: "12345" ou "00999998888")
- **Quando** a validação for acionada
- **Então** o sistema deve indicar que o telefone é inválido sem lançar exceções inesperadas.

### US-003 — Validação de Expediente e Encaixe com Soft-Warning

Como cirurgião-dentista, quero ter flexibilidade para agendar consultas fora do expediente ou durante o almoço mediante confirmação expressa (encaixe extraordinário), sem que o sistema bloqueie arbitrariamente minha decisão clínica.

#### AC-005 — Alerta de agendamento fora do expediente regular

- **Dado** um expediente das 08:00 às 18:00 com almoço das 12:00 às 13:00 e uma tentativa de agendamento às 12:30 ou 18:30 sem autorização de encaixe
- **Quando** a validação de horário for executada
- **Então** o sistema deve retornar aviso de horário fora de expediente (outside_business_hours: true) impedindo o agendamento regular.

#### AC-006 — Confirmação de encaixe extraordinário marca flag no agendamento

- **Dado** um agendamento em horário fora de expediente regular com a opção de encaixe confirmada (confirm_overtime: true)
- **Quando** o agendamento for validado
- **Então** o sistema deve aprovar a validação e marcar o agendamento com a flag is_overtime: true.

### US-004 — Sugestão Inteligente de 3 Horários Vagos no Retorno

Como cirurgião-dentista, ao finalizar uma consulta e solicitar retorno para daqui a 15, 30 ou 180 dias em data indisponível (horário ocupado, domingo fechado ou feriado), quero receber imediatamente as 3 opções vagas mais próximas dentro do expediente, para remarcar o paciente com apenas 1 toque.

#### AC-007 — Sugestão de 3 slots vagos mais próximos em caso de conflito

- **Dado** um pedido de retorno para uma data/horário que colide com consulta existente, bloqueio de agenda ou dia fechado
- **Quando** o algoritmo de retorno inteligente for acionado
- **Então** deve retornar exatamente os 3 horários vagos válidos mais próximos do horário desejado dentro do expediente de funcionamento.

### US-005 — Máquina de Estados e Imutabilidade de Agendamento

Como responsável pela clínica, quero que as transições de status do agendamento sigam um fluxo controlado e que consultas já concluídas ou canceladas sejam absolutamente imutáveis, para preservar a integridade do histórico do consultório.

#### AC-008 — Validação de transições de status permitidas

- **Dado** um agendamento em status inicial PENDING
- **Quando** ocorrer transição para CONFIRMED, RESCHEDULE_REQUESTED, COMPLETED ou NO_SHOW
- **Então** o sistema deve permitir a transição conforme o ciclo de vida válido da consulta.

#### AC-009 — Imutabilidade de consultas concluídas ou canceladas

- **Dado** um agendamento que já atingiu o status COMPLETED ou CANCELLED
- **Quando** houver tentativa de alterar seu status para qualquer outro valor
- **Então** o sistema deve rejeitar categoricamente a alteração preservando o status final.

### US-006 — Consistência de Fuso Horário UTC-3

Como dentista em território brasileiro, quero que agendamentos em horários noturnos no fuso America/Sao_Paulo (UTC-3) mantenham rigorosamente a data civil correspondente, evitando que consultas marcadas às 22h pulem para o dia seguinte no banco ou na interface.

#### AC-010 — Preservação da data civil no fuso America/Sao_Paulo

- **Dado** um agendamento às 22:00 no fuso de São Paulo (UTC-3)
- **Quando** a data for convertida para representação ISO/UTC e restaurada para exibição local
- **Então** a data civil (dia/mês/ano) e o horário local devem permanecer idênticos ao informado originalmente.

## Fora de escopo

- Persistência em banco de dados PostgreSQL e migrations (escopo da Sprint BE-2).
- Integração com API do WhatsApp e webhooks BullMQ (escopo da Sprint BE-3).
- Interface visual React / PWA e IndexedDB (escopo do Frontend).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-001 | Dias da semana seguem convenção padrão de 0 (Domingo) a 6 (Sábado). | confirmada | Alinhado com JavaScript Date.getDay() e SQL EXTRACT(DOW). |
| ASM-002 | Encaixes extraordinários podem ser agendados mesmo em cima de outros encaixes se o profissional confirmar. | confirmada | Decisão PO: o dentista-operador tem liberdade total na cadeira. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-001 | Nenhuma. | respondida | Todas as regras de negócio de agendamento foram alinhadas na sessão de PO e PRD. |
