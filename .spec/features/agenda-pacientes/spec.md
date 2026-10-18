# Spec: Agenda de Atendimentos e Gestão de Clientes (Sprint FE-2)

> feature: agenda-pacientes
> status: pronta

---

## Contexto

A experiência central do CliniAssist no celular e no desktop é a visualização rápida e fluida da grade de horários, a criação de agendamentos em menos de 10 segundos, o manejo de encaixes, a remarcação de consultas e a consulta rápida à carteira de clientes com indicadores de retorno.

---

## Histórias

### US-034 — Visualização da Grade da Agenda e Status Semânticos

Como profissional de saúde ou estética, quero visualizar minha grade de atendimentos por dia, semana e mês em slots de 30 minutos com status visualmente claros, para ter clareza imediata do fluxo do meu dia.

#### AC-057 — Renderização da Grade Diária com Slots de 30min e Alternância Dia/Semana/Mês
- **Dado** a agenda configurada com expediente de trabalho (ex: 08:00 às 18:00) e intervalo de almoço (ex: 12:00 às 13:00)
- **Quando** o profissional abre a tela principal da agenda
- **Então** a grade deve exibir os horários em slots de 30 minutos com destaque para o intervalo de almoço, permitindo alternar de forma reativa entre a visão de Dia (padrão), Semana e Mês e navegar entre datas.

#### AC-058 — Identidade Visual e Badges Semânticos dos Cards de Consulta
- **Dado** agendamentos com diferentes status no banco local (`PENDING`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `MESSAGE_RECEIVED`, `COMPLETED`, `NO_SHOW`)
- **Quando** a grade da agenda exibe os cartões de atendimento
- **Então** cada cartão deve apresentar a cor semântica e badge correspondente com acessibilidade visual e contraste legível.

---

### US-035 — Criação Rápida de Agendamento e Encaixe de Horários

Como profissional em atendimento corrido, quero agendar uma consulta em menos de 10 segundos com cadastro de paciente na hora e suporte a encaixes, para não interromper meu fluxo de trabalho.

#### AC-059 — Gaveta de Criação Rápida ao Tocar em Slot Vago com Cadastro On-the-Fly
- **Dado** um slot livre na grade da agenda (ex: 14:00)
- **Quando** o profissional clica ou toca no slot
- **Então** a gaveta de agendamento deve abrir com o horário das 14:00 pré-preenchido, permitindo buscar paciente existente ou cadastrar um novo paciente (Nome + WhatsApp) e novo procedimento inline sem fechar a gaveta.

#### AC-060 — Aviso de Sobreposição (Encaixe) e Proteção Contra Duplo Clique
- **Dado** uma tentativa de agendamento em horário com sobreposição ou fora do expediente regular
- **Quando** o profissional clica em salvar
- **Então** a aplicação deve exibir aviso informativo de "Encaixe" permitindo salvar normalmente com a marcação visual de encaixe, e o botão de salvar deve ser desabilitado durante o envio para prevenir duplicatas por duplo clique.

---

### US-036 — Gestão de Status da Consulta e Remarcação com Calendário

Como profissional, quero alterar rapidamente o status de um atendimento (como marcar falta em 1 toque) ou remarcar para outro dia através de um calendário, para manter minha agenda sempre fidedigna.

#### AC-061 — Ação de 1 Toque para Marcar Falta (NO_SHOW) e Atualização de Status
- **Dado** um agendamento existente na grade
- **Quando** o profissional toca na ação rápida "Paciente Faltou" ou altera seu status
- **Então** o registro no Dexie.js deve ser atualizado imediatamente para `NO_SHOW` (ou o novo status) e a alteração deve ser enfileirada na outbox de sincronização.

#### AC-062 — Modal de Remarcação de Consulta com Calendário e Novos Horários
- **Dado** um agendamento previamente marcado
- **Quando** o profissional clica em remarcar a consulta
- **Então** deve abrir um modal com calendário para escolher a nova data e horários vagos disponíveis, atualizando a data e hora do agendamento localmente.

---

### US-037 — Gestão da Carteira de Clientes e Procedimentos Padrão

Como profissional, quero consultar meus clientes com indicadores claros sobre consultas futuras, faltas e cancelamentos, além de contar com procedimentos padrão e múltiplos serviços por agendamento.

#### AC-063 — Lista de Clientes com Indicadores de Histórico e Consultas Futuras
- **Dado** a lista de clientes cadastrados no aplicativo
- **Quando** o profissional pesquisa ou visualiza a listagem de clientes
- **Então** o sistema deve indicar claramente pacientes que nunca se consultaram ("Novo / Sem consultas anteriores"), exibir com destaque a próxima consulta futura quando houver, e sinalizar consultas canceladas que não foram reagendadas.

#### AC-064 — Procedimentos Padrão Genéricos e Múltiplos Procedimentos por Atendimento
- **Dado** os procedimentos cadastrados na clínica
- **Quando** o profissional seleciona múltiplos procedimentos para uma mesma consulta (ex: Avaliação 30m + Procedimento 30m)
- **Então** os procedimentos genéricos padrão devem estar disponíveis e o sistema deve calcular e exibir automaticamente a duração combinada e a soma do valor sugerido.

---

## Fora de escopo

- Checkout financeiro com parcelamento e rateio de descontos (Sprint FE-3).
- Gráficos analíticos de no-show e DRE gerencial (Sprint FE-4).
- Conexão de QR Code com WhatsApp via Evolution API (Sprint FE-4 / FE-5).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-019 | Os horários de trabalho padrão da clínica iniciam às 08:00 e terminam às 18:00, com almoço das 12:00 às 13:00, configuráveis localmente. | confirmada | Permite gerar slots de 30m com visualização limpa mesmo offline. |
| ASM-020 | A criação on-the-fly de paciente e procedimento persiste imediatamente no IndexedDB local antes de vincular ao agendamento. | confirmada | Garante integridade referencial nas chaves do Dexie.js. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-019 | Qual a duração padrão dos slots da agenda e quais visões temporais devem estar disponíveis? | respondida | Duração de 30 minutos por padrão. Visualização padrão no Dia, com opções de alternar para Semana e Mês. |
| Q-020 | Como deve funcionar a remarcação de consulta e a sinalização de sobreposição de horários (encaixe)? | respondida | Sobreposição e fora do expediente exibem aviso não bloqueante de "Encaixe". Remarcação abre modal com calendário para nova data e horários livres. |
