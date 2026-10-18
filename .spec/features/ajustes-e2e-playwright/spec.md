# Spec: Ajustes do Consultório, Integração do Shell e Suíte E2E Playwright

> feature: ajustes-e2e-playwright
> status: pronta

## Contexto

Conectar todas as visões do CliniAssist no shell principal (Agenda, Clientes, Caixa e Ajustes), implementar a tela de ajustes de expediente semanal e bloqueios pontuais de agenda com suporte offline-first (Dexie + sync_outbox), e validar a experiência de uso de ponta a ponta com testes mobile no Playwright.

## Histórias

### US-045 — Configuração de Expediente e Bloqueios de Agenda

Como profissional de saúde ou consultório,
quero configurar meu expediente semanal e criar bloqueios de agenda na tela de ajustes,
para que a grade de horários reflita minha disponibilidade e impeça agendamentos em horários indisponíveis.

#### AC-074 — Configuração de horário de expediente e intervalo de almoço

- **Dado** que o profissional acessa a aba de Ajustes do Consultório
- **Quando** ele define os horários de início (ex: 08:00), término (ex: 18:00) e intervalo de almoço (ex: 12:00 às 13:00) para os dias úteis e salva
- **Então** os horários devem ser atualizados na tabela local `business_hours` do Dexie.js e gerar mutações `UPDATE`/`INSERT` na `sync_outbox`.

#### AC-075 — Criação e remoção de bloqueios pontuais de agenda

- **Dado** que o profissional precisa bloquear um período (ex: "Feriado", "Reunião de Equipe", "Manutenção")
- **Quando** ele adiciona um novo bloqueio informando título, data/hora de início e término
- **Então** o registro deve ser inserido na tabela local `schedule_blocks`, constar na lista de bloqueios ativos com opção de remoção, e enfileirar a mutação na `sync_outbox`.

---

### US-046 — Navegação e Integração Central no AppShell

Como profissional usando o CliniAssist no celular ou desktop,
quero alternar fluidamente entre as abas da Agenda, Clientes, Caixa e Ajustes,
para ter uma experiência integrada com feedback de conectividade e status do WhatsApp.

#### AC-076 — Alternância fluida entre as abas principais com dados reativos

- **Dado** que o usuário está no shell principal da aplicação (`AppShell`)
- **Quando** ele clica nas abas `Agenda`, `Clientes`, `Caixa` ou `Ajustes`
- **Então** a respectiva visão deve ser renderizada (`ScheduleGrid`, `PatientList`, `CashFlowDashboard` e `SettingsView`) mantendo os dados locais sincronizados e exibindo o status de conexão no topo.

---

### US-047 — Suíte End-to-End Mobile e Resiliência Offline

Como profissional autônomo em trânsito com conexão instável,
quero ter certeza de que o aplicativo executa as jornadas críticas e funciona perfeitamente sem internet,
para que eu nunca perca dados de consultas ou pagamentos.

#### AC-077 — Jornada completa de atendimento mobile no Playwright

- **Dado** que o aplicativo é carregado no viewport mobile (390x844)
- **Quando** o usuário agenda uma consulta rápida, conclui o atendimento no checkout financeiro com parcelamento e agenda um retorno inteligente
- **Então** todas as operações devem ser registradas no banco local e visíveis na interface do usuário sem erros.

#### AC-078 — Resiliência offline em modo avião e sincronização ao reconectar

- **Dado** que o dispositivo perde o sinal de internet (`context.setOffline(true)`)
- **Quando** o usuário realiza um agendamento ou lançamento financeiro offline e recarrega a página
- **Então** a aplicação deve abrir normalmente, os registros devem permanecer salvos no IndexedDB, e ao reativar a rede as mutações pendentes devem ser processadas pela fila de sincronização.

## Fora de escopo

- Configuração multi-filiais ou multi-profissionais concorrentes (mantido mono-usuário conforme decisão do produto).
- Gateway de pagamento online com cartão de crédito via maquininha física externa.

## Suposições

Nenhuma.

## Perguntas em aberto

Nenhuma.
