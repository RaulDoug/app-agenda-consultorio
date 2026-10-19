# Spec: Relatórios & Métricas, Botão Central '+' (FAB) e Cadastro Direto de Pacientes

> feature: relatorios-fab-cadastro-paciente
> status: pronta

## Contexto

Na operação diária do consultório odontológico, o gestor e os profissionais necessitam de:
1. Uma tela dedicada para acompanhamento de relatórios e métricas gerenciais chave (taxa de faltas No-Show e montante financeiro perdido, DRE simplificado com receitas pagas e despesas, fluxo de recebíveis futuros em 30/60/90 dias, ranking de procedimentos mais rentáveis e pacientes inativos para reativação).
2. Um botão central flutuante de adição rápida ('+') na barra inferior mobile para agendamento ágil em 1 toque a partir de qualquer contexto da aplicação.
3. Organização ergonômica da barra inferior (Agenda, Caixa, [+], Relatórios, Mais) provendo acesso aos módulos de Clientes e Ajustes através do Hub 'Mais' no mobile e menu completo no desktop.
4. Possibilidade de cadastrar novos pacientes diretamente pela tela de Clientes, sem depender exclusivamente do fluxo durante o agendamento.

## Histórias

### US-063 — Navegação Móvel com Botão Central '+' e Hub 'Mais'

Como profissional de saúde ou recepcionista em dispositivo móvel,
quero ter um botão de ação rápida '+' elevado no centro da barra inferior e acesso consolidado às seções do app,
para abrir a gaveta de agendamento em 1 toque e navegar fluidamente entre a clínica.

#### AC-104 — Botão central '+' flutuante na barra inferior para acionamento direto do agendamento rápido

- **Dado** que a aplicação está sendo utilizada em dispositivo móvel com a barra inferior visível
- **Quando** o usuário clica no botão central flutuante circular '+' (`[data-testid="bottom-nav-fab"]`)
- **Então** a gaveta de criação rápida de agendamento (`QuickAppointmentDrawer`) deve se abrir imediatamente permitindo realizar um novo agendamento.

#### AC-105 — Distribuição de navegação mobile (Agenda, Caixa, [+], Relatórios, Mais) com acesso a Clientes e Ajustes

- **Dado** que a barra inferior está renderizada
- **Quando** o usuário visualiza as opções de navegação
- **Então** a barra deve conter 5 posições (Agenda, Caixa, botão FAB central, Relatórios e Mais); ao tocar na aba 'Mais', o usuário acessa o Hub com atalhos diretos para as telas de Clientes e Ajustes.

### US-064 — Tela de Relatórios Gerenciais e Indicadores de Saúde do Consultório

Como gestor do consultório,
quero uma tela dedicada de relatórios com indicadores de No-Show, DRE simplificado, projeção futura e procedimentos mais lucrativos,
para entender a performance operacional e financeira da clínica em tempo real mesmo offline.

#### AC-106 — Tela de Relatórios com indicadores de No-Show, DRE simplificado, projeção futura e ranking de procedimentos

- **Dado** que a aba 'Relatórios' está selecionada na navegação
- **Quando** o painel de relatórios é renderizado
- **Então** devem ser exibidos os cards de: Taxa de No-Show (com percentual e perda em R$), DRE Simplificado (Receitas, Despesas e Lucro Líquido), Projeção de Recebíveis (30, 60 e 90 dias) e Ranking de Procedimentos ordenado por faturamento total e quantidade, calculados a partir dos dados do banco local com seletor de período temporal.

### US-065 — Cadastro Direto de Pacientes na Tela de Clientes

Como recepcionista do consultório,
quero cadastrar novos pacientes diretamente pela tela de Clientes através de um botão '+ Novo Paciente',
para registrar clientes que compareceram ao consultório ou ligaram antes de definir um horário de consulta.

#### AC-107 — Cadastro direto de novo paciente com validação de dados a partir da tela de Clientes

- **Dado** que a aba 'Clientes' está aberta
- **Quando** o usuário clica no botão '+ Novo Paciente' (`[data-testid="btn-new-patient"]`) e preenche o modal com nome e WhatsApp válidos
- **Então** o paciente deve ser salvo com sucesso no banco local (`patients`), enfileirado para sincronização no outbox e aparecer imediatamente na listagem de clientes.

## Fora de escopo

- Exportação de relatórios em formato PDF com timbre do consultório.
- Integração contábil via arquivo SPED fiscal.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-033 | Os dados necessários para os cálculos de No-Show, DRE, projeção de recebíveis e ranking de procedimentos já estão disponíveis localmente no Dexie (tabelas `appointments`, `appointment_items`, `procedures`, `financial_transactions`). | confirmada | Confirmado pela arquitetura do banco local e repositórios existentes. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-033 | O botão central '+' deve acionar diretamente o agendamento rápido ou abrir um menu de escolhas? | respondida | O usuário confirmou que o botão '+' deve abrir diretamente o agendamento rápido, mantendo o lançamento de despesas e novos pacientes em suas respectivas telas. |
