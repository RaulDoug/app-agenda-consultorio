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
6. **Agendamento Rápido com Paciente Pré-Selecionado (`initialPatient`):**
   - Ao acionar o atalho "+ Agendar" a partir do card de um cliente (ou da lista de inativos), a gaveta `QuickAppointmentDrawer` abre imediatamente com o paciente selecionado e suas observações clínicas visíveis, permitindo troca via botão "Trocar".
   - Ao fechar a gaveta ou abrir um agendamento avulso (via grade ou botão "+"), o estado é resetado, abrindo o formulário limpo para busca.
7. **Formatação Dinâmica de Período, Contador e Disposição em Coluna do Cabeçalho:**
   - O `ViewModeSelector` adota uma disposição em coluna vertical de 3 níveis:
     - **Nível 1 (Topo):** Botões de navegação `<` `>` com botão de retorno contextual centralizado (`Hoje` no modo Dia, `Esta semana` no modo Semana e `Este mês` no modo Mês);
     - **Nível 2 (Meio):** Título do período em destaque (`Ter., 27 de out. de 2026`, `26 de out. – 01 de nov. de 2026`, `Outubro de 2026`) com subtítulo do contador de atendimentos ativos (`Nenhum atendimento`, `1 atendimento`, `X atendimentos`), ambos centralizados com total aproveitamento da largura horizontal;
     - **Nível 3 (Abaixo):** Pílula seletora de abas `[ Dia ] [ Semana ] [ Mês ]` centralizada na base.
   - O botão de ação rápida no topo da agenda exibe o rótulo limpo `Novo Agendamento` acompanhado do ícone `+`, sem duplicações textuais.

8. **Contenção e Responsividade dos Cards de Apoio (Atendimento Contínuo):**
   - Agendamentos com duração superior a 30 minutos geram cards de apoio nos slots subsequentes (`Em atendimento: [Nome do Paciente] até [HH:mm]`).
   - Esses cards de apoio utilizam estritamente contenção de largura via `min-w-0`, `w-full` e `truncate` no texto do paciente, além de `overflow-x-hidden` no layout da aplicação, assegurando que nomes longos nunca ultrapassem o limite do card em dispositivos móveis nem provoquem rolagem ou arrasto horizontal indesejado.
   - **Sincronização de Estado Concluído (`COMPLETED`):** Quando a consulta é concluída, o card de apoio reflete o encerramento do atendimento: substitui o prefixo "Em atendimento:" por "Concluído:", o ponto indicador torna-se cinza (`bg-slate-400`), e a estilização visual transiciona de verde/teal para o padrão cinza suave neutro (`border-slate-200 bg-slate-50 text-slate-700`), harmonizando com o card principal.
   - **Sincronização de Estado Concluído (`COMPLETED`):** Quando a consulta é concluída, o card de apoio reflete o encerramento do atendimento: substitui o prefixo "Em atendimento:" por "Concluído:", o ponto indicador torna-se cinza (`bg-slate-400`), e a estilização visual transiciona de verde/teal para o padrão cinza suave neutro (`border-slate-200 bg-slate-50 text-slate-700`), harmonizando com o card principal.

