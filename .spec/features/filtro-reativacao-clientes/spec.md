# Spec: Filtro e Reativação de Clientes Inativos

> feature: filtro-reativacao-clientes
> status: pronta

## Contexto

Permite aos profissionais do consultório odontológico visualizar e filtrar clientes com cadastro inativo na tela de clientes (semelhante à funcionalidade já existente no catálogo de procedimentos), com controle por pílulas de status ("Ativos", "Inativos", "Todos"), contadores reativos, identificação visual clara de status inativo e reativação em 1 clique no frontend Local-First, com persistência atômica no Dexie.js, enfileiramento na `sync_outbox`, salvaguardas contra números de WhatsApp duplicados e suporte a restauração no PostgreSQL. Além disso, detecta proativamente tentativas de cadastro de clientes com WhatsApp já existente no banco de dados (seja ativo ou inativo) nas telas de clientes e no cadastro rápido de agendamento, alertando e oferecendo reativação imediata quando o cadastro for inativo. Para completar a usabilidade da agenda, aprimora a seleção de pacientes no agendamento rápido substituindo o limite rígido de 5 itens por um card com lista completa ordenada alfabeticamente e carregamento dinâmico à medida que o usuário rola a lista (infinite scroll).

## Histórias

### US-137 — Filtro de Visualização de Clientes Inativos e Reativação na Interface

Como dentista ou secretária da clínica, quero poder filtrar clientes inativos na listagem e ter a opção de reativá-los com 1 toque, para restabelecer o cadastro de pacientes que voltaram a frequentar o consultório sem a necessidade de recadastrá-los do zero.

#### AC-246 — Filtro de status na tela de clientes com contadores e busca contextual

- **Dado** que a clínica possui clientes cadastrados (ativos e inativos) no banco local
- **Quando** o usuário acessa a aba "Clientes" e alterna entre os filtros "Ativos", "Inativos" e "Todos"
- **Então** o sistema filtra a listagem reativamente exibindo a quantidade correta em cada pílula de status, e aplicando a busca de texto apenas aos clientes correspondentes ao filtro ativo, com estados vazios (empty state) específicos para cada situação.

#### AC-247 — Identificação visual de clientes inativos e reativação direta em 1 toque

- **Dado** que a listagem de clientes exibe um cliente com cadastro inativo (`is_active: false` ou `deleted_at` preenchido)
- **Quando** o usuário visualiza o card desse cliente
- **Então** o card apresenta borda diferenciada/esmaecida, badge visual "Inativo", oculta botões operacionais de agendamento e exclusão, e exibe o botão de ação "Reativar" que, ao ser acionado, restaura imediatamente o cliente para o estado ativo no Dexie e enfileira mutação `UPDATE` na `sync_outbox`.

### US-138 — Métodos de Reativação e Consulta de Inativos no Repositório Local

Como desenvolvedor da plataforma, quero que o repositório local de pacientes implemente `reactivatePatient`, `findPatientByPhone` com transações atômicas e outbox, além de validação contra números duplicados, para garantir a integridade Local-First e sincronização com o backend.

#### AC-248 — Método reactivatePatient e salvaguarda contra telefone duplicado

- **Dado** uma instância de `PatientLocalRepository` no frontend e um cliente previamente inativado
- **Quando** o método `reactivatePatient(id)` for executado
- **Então** o registro no Dexie é atualizado atomicamente para `is_active: true`, `deleted_at: null` e a mutação `UPDATE` é gravada na `sync_outbox` (e caso já exista outro cliente ativo com o mesmo WhatsApp no mesmo tenant, o método rejeita a reativação com erro amigável).

### US-139 — Suporte à Reativação e Consulta de Inativos no Backend PostgreSQL

Como desenvolvedor da API, quero que o repositório e serviços de pacientes no backend suportem a recuperação e atualização de registros previamente soft-deleted, para que as sincronizações e chamadas de API reflitam a reativação no banco online.

#### AC-249 — Consulta de inativos e restauração de clientes soft-deleted na API

- **Dado** um cliente previamente inativado (`is_active: false`, `deleted_at: CURRENT_TIMESTAMP`) no banco PostgreSQL
- **Quando** a API executa `findAll` com `includeInactive: true` ou `update` com `is_active: true`
- **Então** o cliente inativo é retornado na listagem ou atualizado com sucesso limpando `deleted_at = NULL` e restaurando `is_active = true`.

### US-140 — Detecção de WhatsApp e Reativação nos Formulários de Novo Cliente

Como usuário cadastrando um cliente na tela de clientes ou na gaveta de agendamento rápido, quero que o sistema me avise caso o número informado pertença a um cliente inativo e me ofereça a reativação imediata com 1 clique, para evitar cadastros duplicados e recuperar o histórico do paciente.

#### AC-250 — Validação de WhatsApp com proposta de reativação de cliente inativo

- **Dado** que existe um cliente previamente inativado no consultório
- **Quando** o usuário preenche o número de WhatsApp desse cliente no modal de novo paciente ou no cadastro rápido da agenda e tenta submeter ou valida o campo
- **Então** o sistema identifica que o número pertence a um cliente inativo, exibe um alerta claro com o nome do cliente inativo e um botão para "Reativar Cadastro"
- **E** ao confirmar a reativação, o cliente é reativado no banco local e selecionado diretamente para o agendamento em curso (no agendamento rápido) ou salvo/exibido (na tela de clientes), enquanto números pertencentes a clientes já ativos mantêm o aviso padrão de duplicidade impedindo a criação.

### US-141 — Busca e Listagem Dinâmica com Rolagem Infinita de Pacientes na Agenda

Como dentista selecionando um paciente para agendamento, quero visualizar a lista completa de pacientes ordenada alfabeticamente em um card com rolagem dinâmica (sem limite rígido de 5 itens), para encontrar rapidamente qualquer paciente mesmo sem lembrar o nome exato.

#### AC-251 — Listagem alfabética com paginação dinâmica por scroll no formulário de agendamento

- **Dado** que a clínica possui múltiplos pacientes ativos cadastrados no banco local
- **Quando** o usuário abre a gaveta de agendamento rápido e visualiza a lista de pacientes no campo de busca
- **Então** o sistema exibe os pacientes ativos ordenados alfabeticamente por nome em um card com rolagem vertical, carregando dinamicamente novos pacientes conforme o usuário rola a lista (sem limitação fixa de apenas 5 itens)
- **E** ao digitar no campo de busca, a lista é filtrada dinamicamente mantendo a ordenação alfabética e o carregamento por rolagem.

## Fora de escopo

- Exclusão física (Hard-delete) permanente no banco de dados relacional ou no IndexedDB.
- Reativação em lote com seleção múltipla (seleção unitária em 1 clique é suficiente para o perfil One-Thumb).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-082 | O filtro de status na tela de clientes adotará o mesmo padrão visual de pílulas ("Ativos", "Inativos", "Todos") presente na tela de procedimentos. | confirmada | Confirmado pelo usuário na solicitação ("semelhante a tela de cadastro de procedimentos"). |
| ASM-083 | Ao reativar um cliente, deve-se impedir que dois clientes ativos possuam o mesmo WhatsApp normalizado no mesmo consultório. | confirmada | Garante a integridade operacional e evita duplicidade em automações do WhatsApp. |
| ASM-084 | Ao reativar um cliente pelo cadastro rápido da agenda, o cliente reativado deve ser selecionado automaticamente no formulário de agendamento. | confirmada | Agiliza o fluxo de marcação de consulta do dentista sem exigir buscas manuais adicionais. |
| ASM-085 | A rolagem dinâmica de pacientes carregará blocos iniciais (ex: 15 a 20 registros) e novos blocos sob demanda ao atingir o fim do scroll, garantindo alta performance mesmo com centenas de clientes. | confirmada | Prática padrão para One-Thumb e Local-First no mobile. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-070 | Clientes inativos devem aparecer nas opções de busca para novo agendamento rápido na agenda? | respondida | Não, no agendamento rápido apenas clientes ativos devem estar disponíveis para seleção. |
| Q-071 | Caso o usuário altere o nome durante o cadastro de um telefone de cliente inativo e clique em reativar, o nome existente deve ser preservado ou atualizado? | respondida | O sistema preserva o histórico ou atualiza com o novo nome informado se preenchido, garantindo flexibilidade. |
| Q-072 | O card de rolagem dinâmica deve exibir o contador de pacientes carregados/totais? | respondida | Sim, exibir de forma sutil no topo ou rodapé do card para dar transparência ao usuário. |
