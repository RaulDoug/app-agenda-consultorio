# Gestão de Clientes e Pacientes — Frontend (OdontoFlow)

> **Documento:** `docs/frontend/funcionalidades/cadastro_clientes.md`  
> **Status:** Ativo / Implementado  
> **Camada:** Frontend (Apresentação, Repositório Local Dexie, Orquestração e Validação)

---

## 1. Visão Geral

A tela de Clientes e Pacientes centraliza o gerenciamento da base de contatos do consultório odontológico. Ela implementa o paradigma Local-First com reatividade instantânea via `useLiveQuery`, suporte a filtragem por status operacional (Ativos, Inativos, Todos), reativação em 1 clique com salvaguarda de integridade de WhatsApp, validação proativa contra duplicidades no cadastro e rolagem dinâmica no agendamento rápido.

---

## 2. Pílulas de Filtro de Status e Listagem de Clientes (`PatientList`)

- **Filtros de Status:**
  - `Ativos ({count})`: exibe apenas pacientes ativos (`is_active: true` e `deleted_at: null`).
  - `Inativos ({count})`: exibe pacientes que foram inativados logicamente (`is_active: false` ou `deleted_at != null`).
  - `Todos ({count})`: exibe a base consolidada de clientes cadastrados.
- **Busca Contextual:** O campo de pesquisa filtra reativamente por nome ou WhatsApp mantendo o escopo do filtro de status selecionado.
- **Contador Dinâmico:** Exibe a quantidade de clientes correspondentes ao filtro ativo (`X cliente(s)`).
- **Empty States:** Mensagens contextualizadas para buscas vazias, ausência de clientes inativos ou ausência de clientes ativos.

---

## 3. Card do Cliente e Ação de Reativação (`PatientCard`)

- **Estilização para Inativos:**
  - Borda tracejada e fundo suave: `bg-slate-50/80 border-dashed border-slate-300 opacity-90`.
  - Nome com estilo atenuado e badge visual "Inativo" em vermelho claro.
  - Ocultação dos botões "+ Agendar" e "Excluir" (já inativo).
  - Exibição de botão de ação direta **"Reativar"** com ícone `RotateCcw` e estilo teal no rodapé e nos detalhes expandidos.
- **Ação de Reativação:**
  - Invoca `patientRepo.reactivatePatient(id)`.
  - Verifica se já existe outro paciente ativo com o mesmo número normalizado.
  - Atualiza atomicamente no Dexie (`is_active: true`, `deleted_at: null`, `updated_at: now`) e enfileira mutação `UPDATE` na `sync_outbox`.

---

## 4. Reativação Assistida nos Cadastros (`CreatePatientModal` e `InlinePatientForm`)

Ao preencher o WhatsApp em formulários de novo cliente:
1. **Cliente Ativo Já Existente:** Bloqueia a submissão e exibe o alerta padrão de duplicidade:  
   `Já existe um paciente cadastrado com este WhatsApp: "[Nome]".`
2. **Cliente Inativo Já Existente:** Detecta o cadastro desativado e exibe um card com proposta amigável:  
   `Existe um cadastro inativo para este WhatsApp pertencente a [Nome]. Deseja reativar este cliente?`
   - No modal de clientes: botão "Reativar Cadastro" reativa o cliente e fecha o modal.
   - Na gaveta de agendamento rápido: botão "Reativar e Selecionar" reativa o cliente e o seleciona imediatamente para a consulta em curso.

---

## 5. Card de Busca com Rolagem Dinâmica na Agenda (`InlinePatientForm`)

- Substitui o antigo limite fixo de 5 itens.
- Carrega a lista completa de pacientes ativos ordenada alfabeticamente por nome.
- **Rolagem Incremental (Infinite Scroll):** Exibe inicialmente 15 pacientes e incrementa dinamicamente blocos de 15 registros conforme o usuário rola o card.
- **Indicador:** Exibe a contagem atual ("Exibindo X de Y pacientes").

