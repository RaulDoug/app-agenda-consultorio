# Spec: Gestão do Catálogo de Procedimentos e Serviços

> feature: gestao-catalogo-procedimentos
> status: pronta

## Contexto

Permite aos profissionais do consultório odontológico gerenciar o catálogo completo de procedimentos e serviços (F-06), acessível através da seção "Mais" no app e pelo menu lateral desktop, com suporte a visualização com margens, criação, edição, filtro de inativados, reativação em 1 clique e exclusão segura (soft-delete), além de preenchimento do custo no cadastro rápido da agenda e auto-seed persistente dos procedimentos padrões no banco online PostgreSQL para operação multi-dispositivo consistente.

## Histórias

### US-132 — Gestão do Catálogo de Procedimentos no Frontend e Navegação "Mais"

Como dentista ou gestor da clínica, quero gerenciar os procedimentos cadastrados na clínica a partir da seção "Mais" (e pelo menu desktop), para manter a tabela de preços, durações e custos de insumos sempre atualizados.

#### AC-238 — Acesso à tela de procedimentos pela seção Mais e navegação consistente

- **Dado** que o usuário está autenticado na aplicação
- **Quando** ele acessa a aba "Mais" no menu inferior e toca no card "Procedimentos & Serviços" (ou seleciona o item na barra lateral desktop)
- **Então** o sistema navega para a tela de Procedimentos, exibindo o catálogo ativo e destacando a seção no menu.

#### AC-239 — Visualização, contadores e busca reativa por nome de procedimentos

- **Dado** que a clínica possui procedimentos ativos cadastrados no banco local
- **Quando** o usuário visualiza a lista ou digita um texto no campo de busca
- **Então** a lista é filtrada reativamente em tempo real pelo nome, exibindo para cada item o nome, a duração estimada em minutos, o preço de tabela em R$, o custo de insumos em R$ e a margem calculada.

#### AC-240 — Cadastro e edição de procedimentos com validação de regras de negócio

- **Dado** que o usuário aciona o botão "+ Novo Procedimento" ou o botão "Editar" de um procedimento existente
- **Quando** preenche os dados com nome não-vazio, duração estritamente positiva (> 0), preço não-negativo (>= 0) e custo não-negativo (>= 0) e salva
- **Então** o procedimento é salvo com sucesso no banco local com mutação na outbox e refletido imediatamente na tela (e caso informe duração <= 0, preço < 0 ou custo < 0, o sistema impede o salvamento exibindo mensagem de erro clara).

#### AC-241 — Exclusão com soft-delete e modal de confirmação de segurança

- **Dado** que o usuário clica no botão de excluir em um procedimento cadastrado
- **Quando** é exibido o modal de confirmação alertando sobre a preservação de atendimentos e históricos passados e o usuário confirma a exclusão
- **Então** o sistema executa o soft-delete do procedimento (`is_active = false`, `deleted_at` preenchido), removendo-o da listagem ativa e preservando os registros históricos de consultas.

### US-133 — Cadastro Rápido de Procedimento com Custo na Gaveta de Agendamento

Como dentista agendando um atendimento rápido, quero informar o custo do novo procedimento criado inline na hora do agendamento, para que o controle de margem e lucratividade já fique registrado desde a criação.

#### AC-242 — Preenchimento de custo no cadastro rápido direto pela tela de agendamento

- **Dado** que o usuário está na gaveta de novo agendamento rápido (`QuickAppointmentDrawer`) e aciona a criação de um novo procedimento no formulário inline
- **Quando** ele informa nome, duração, preço sugerido e o custo operacional em reais e submete
- **Então** o procedimento é criado com `cost_cents` persistido no Dexie e enfileirado na outbox, sendo automaticamente selecionado para o agendamento em curso.

### US-134 — Métodos de Atualização e Soft-Delete Atômicos no Repositório Local

Como desenvolvedor da plataforma, quero que o repositório local de procedimentos implemente `updateProcedure` e `deleteProcedure` com transações atômicas e outbox, para garantir a integridade Local-First e sincronização com o backend.

#### AC-243 — Métodos de update e soft-delete com outbox no repositório de procedimentos

- **Dado** uma instância de `ProcedureLocalRepository` no frontend
- **Quando** o método `updateProcedure` ou `deleteProcedure` for executado
- **Então** o registro no Dexie é atualizado atomicamente e a respectiva mutação (`UPDATE` ou `DELETE`) é gravada na tabela `sync_outbox`.

### US-135 — Filtro de Visualização de Procedimentos Inativos e Reativação

Como dentista gerenciando o consultório, quero filtrar procedimentos inativos na listagem e ter a opção de reativá-los com 1 toque, para poder restabelecer serviços que foram temporariamente desativados sem precisar recadastrá-los.

#### AC-244 — Filtro de status na tela de catálogo e reativação em 1 clique

- **Dado** que o dentista está na tela do catálogo de procedimentos
- **Quando** ele alterna a visualização entre os filtros "Ativos", "Inativos" e "Todos"
- **Então** o sistema filtra a listagem adequadamente, exibindo nos procedimentos inativados um badge visual "Inativo" e o botão de ação "Reativar" que, ao ser acionado, restaura o procedimento para o catálogo ativo (`is_active: true`, `deleted_at: null`) com persistência no Dexie e mutação `UPDATE` na outbox.

### US-136 — Auto-Seed e Sincronização dos Procedimentos Padrões no Banco Online (PostgreSQL)

Como dentista acessando a plataforma por múltiplos dispositivos, quero que os procedimentos padrões da clínica fiquem salvos no banco online (PostgreSQL), para que ao fazer login em qualquer novo celular ou computador eles estejam prontamente disponíveis.

#### AC-245 — Auto-seed e persistência dos procedimentos padrões no backend PostgreSQL e sincronização de seeds da outbox

- **Dado** um consultório acessando o sistema pela primeira vez ou a partir de um novo dispositivo
- **Quando** o backend executa consultas de catálogo ou sincronização em lote (`/api/sync/batch`), ou o frontend inicializa sementes locais
- **Então** os procedimentos padrões são persistidos no PostgreSQL pelo backend (`ensureDefaultProcedures`), enfileirados como mutações na `sync_outbox` no frontend e sincronizados entre todos os dispositivos do consultório.

## Fora de escopo

- Alteração da precificação de consultas retroativas ou renegociação de valores já faturados no checkout.
- Rota de exclusão física permanente (Hard-delete) no banco de dados.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-080 | A listagem de procedimentos no frontend é ordenada alfabeticamente por nome e filtra apenas registros ativos (`is_active: true` e `deleted_at: null`). | confirmada | Alinhado com as regras globais e repositório de pacientes. |
| ASM-081 | A reativação de um procedimento inativado restaura o status ativo (`is_active: true`, `deleted_at: null`) mantendo o mesmo ID e histórico. | confirmada | Permite restabelecer serviços sem perder vínculos. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-068 | Nenhuma. Todos os requisitos estão especificados em F-06 e validados com o usuário. | respondida | Conforme F-06 do `docs/features.md`. |
| Q-069 | O catálogo de sementes padrão no PostgreSQL deve espelhar as sementes locais? | respondida | Sim, os 4 procedimentos padrões são idênticos no backend e no frontend. |
