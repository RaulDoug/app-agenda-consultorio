# Funcionalidade: Agenda & Timeline Diária (Mobile-First)

> **Localização:** `docs/frontend/funcionalidades/agenda_timeline.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:** `src/features/agenda/components/`, `src/features/agenda/hooks/`, `src/db/repositories/appointment-local-repository.ts`

---

## 1. Visão Geral
Interface principal do aplicativo onde o profissional de saúde gerencia a agenda do dia, semana ou mês. Oferece visualização em linha do tempo com slots de 30 minutos, indicação visual por cores dos status de agendamento (incluindo status sincronizados do WhatsApp) e acionamento instantâneo de criação rápida de consulta.

---

## 2. Componentes Principais
- `ScheduleGrid.tsx`: Renderização da grade horária diária com slots e cards de agendamento dimensionados dinamicamente pela duração dos procedimentos.
- `ViewModeSelector.tsx`: Alternância entre as visões Dia, Semana e Mês.
- `QuickAppointmentDrawer.tsx`: Gaveta inferior (*bottom sheet*) acionada ao tocar em um slot vazio, permitindo selecionar ou criar paciente em linha, selecionar procedimentos via chips e agendar em < 10 segundos.
- `AppointmentDetailsDrawer.tsx`: Gaveta de detalhes da consulta com ações de conclusão (checkout), cancelamento, remarcação e abertura direta de conversa no WhatsApp.
- `RescheduleModal.tsx`: Modal para reagendamento seguro com validação de choques de horário e opção explícita de autorização de encaixe.

---

## 3. Regras de Interação e Negócio
1. **Identificação por Cores:**
   - 🟢 Verde: Confirmado pelo paciente (via WhatsApp);
   - 🟡 Amarelo: Aguardando resposta de confirmação;
   - 🟠 Laranja: Paciente solicitou reagendamento ou cancelamento;
   - 🔵 Azul: Dúvida/resposta de texto que requer intervenção humana;
   - ⚪ Cinza: Atendimento finalizado e baixado;
   - 🔴 Vermelho: Falta registrada (*No-Show*).
2. **Controle de Encaixe Estritamente sob Demanda:**
   - Em horários livres e dentro do expediente de atendimento, nenhuma opção de encaixe é exibida ao usuário, mantendo a interface limpa e intuitiva.
   - Ao tentar agendar em horário ocupado por outra consulta ou fora do expediente/almoço, o sistema exibe alerta destacado no centro do formulário e exige a autorização explícita do encaixe extraordinário.
3. **Pré-seleção Inteligente de Data e Horário:**
   - Ao clicar no botão "+ Novo Agendamento" ou atalhos rápidos sem seleção prévia de slot, o sistema calcula dinamicamente o próximo horário vago do dia (arredondado para múltiplos de 30min).
   - Se o horário atual for igual ou posterior ao fechamento do expediente (ex: `>= 18:00`), a data pré-selecionada avança automaticamente para o dia seguinte com o horário de abertura (08:00).
4. **Cálculo Dinâmico de Duração:**
   - A soma do tempo estimado dos procedimentos vinculados calcula o horário final previsto da consulta.
5. **Persistência Local-First:**
   - As criações e alterações são salvas via `AppointmentLocalRepository`, gravando no Dexie e enfileirando mutações na `sync_outbox`.
