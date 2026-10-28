# Funcionalidade: Gestão do Catálogo de Procedimentos e Serviços (F-06)

> **Status:** Concluído e Auditado via `onp-spec-driven`  
> **Localização:** `frontend/src/features/procedures/`  
> **Camadas:** Apresentação (4 Camadas), Repositório Local (Dexie.js), Fila de Sincronização (`sync_outbox`), Tipagem Compartilhada.

---

## 1. Visão Geral

A funcionalidade de **Gestão do Catálogo de Procedimentos e Serviços** permite ao consultório odontológico manter sua tabela de serviços prestados atualizada, controlando:
- **Duração estimada de atendimento em minutos:** (`default_duration_minutes > 0`);
- **Preço de tabela cobrado ao paciente:** (`default_price_cents >= 0`, permitindo R$ 0,00 para procedimentos cortesia ou avaliações preventivas);
- **Custo operacional de insumos / laboratório:** (`cost_cents >= 0`, default 0 para procedimentos sem custos extras de materiais);
- **Margem de lucro bruta calculada:** Exibida na listagem e na prévia de cadastro (`preço - custo`);
- **Filtro de Inativados e Reativação:** Abas de filtro "Ativos", "Inativos" e "Todos" com contadores dinâmicos, estilização atenuada para itens desativados e ação de restauração em 1 clique ("Reativar");
- **Sincronização Multi-Dispositivo com Auto-Seed no PostgreSQL:** Procedimentos padrões criados localmente enfileiram mutações na `sync_outbox` e o backend PostgreSQL realiza auto-seed sob demanda no `/api/sync/batch` ou `/api/procedures`, garantindo acesso imediato a partir de novos computadores ou navegadores.

A tela é acessível a partir do hub mobile **"Mais"** (`MoreMenuHub.tsx`) e pela barra lateral de navegação no **Desktop** (`DesktopSidebar.tsx`), sob a rota/tab `'procedimentos'`.

Além da tela de catálogo, o dentista pode cadastrar novos procedimentos inline com preenchimento imediato de custo operacional diretamente na gaveta de agendamento rápido da agenda (`QuickAppointmentDrawer` / `InlineProcedureForm.tsx`).

---

## 2. Arquitetura em 4 Camadas no Frontend

### Camada 1: Apresentação (UI / Components)
- `frontend/src/features/procedures/components/ProcedureList.tsx`:
  - Visão principal com cabeçalho, barra de busca textual reativa por nome, botões de filtro segmentado ("Ativos (X)", "Inativos (Y)", "Todos (Z)"), contador contextual e botão "+ Novo Procedimento";
  - Grade responsiva com cartões `ProcedureCard` e empty states contextuais por filtro.
- `frontend/src/features/procedures/components/ProcedureCard.tsx`:
  - Cartão modular com padrão mobile One-Thumb;
  - Badges informativos de Duração (`Clock`), Preço de Tabela (`Tag`), Custo de Insumos (`Coins`) e Margem Bruta (`TrendingUp`);
  - Quando inativo: título riscado, badge de destaque "Inativo" e botão "Reativar" (`RotateCcw`);
  - Quando ativo: botões de ação rápida: Editar (`Pencil`) e Excluir (`Trash2`).
- `frontend/src/features/procedures/components/ProcedureFormModal.tsx`:
  - Modal / Bottom Sheet para criação e edição de procedimentos;
  - Presets de duração (15m, 30m, 45m, 60m), campos de preço e custo em reais (R$);
  - Pré-visualização reativa da margem bruta calculada;
  - Validações em tempo real: Nome obrigatório, Duração > 0, Preço >= 0 e Custo >= 0.
- `frontend/src/features/procedures/components/ConfirmDeleteProcedureModal.tsx`:
  - Modal de confirmação segura de soft-delete alertando que agendamentos anteriores e o histórico clínico permanecerão 100% preservados para relatórios e conformidade.

### Camada 2: Orquestração e Integração no App
- `frontend/src/components/layout/BottomNav.tsx`:
  - Adição de `'procedimentos'` em `NavTabId` e atualização de `isMaisActive` para manter o menu Mais contextualizado;
  - Adição do item no `DESKTOP_NAV_ITEMS`.
- `frontend/src/components/layout/MoreMenuHub.tsx`:
  - Card "Procedimentos & Serviços" com contador de procedimentos ativos e badge "Catálogo".
- `frontend/src/App.tsx`:
  - Query reativa `useLiveQuery(() => db.procedures.toArray())` fornecendo procedimentos ao `ProcedureList`;
  - Renderização da aba `data-testid="procedimentos-tab-content"`;
  - Orquestração dos modais de criação, edição, exclusão lógica e reativação (`handleReactivateProcedure`).
- `frontend/src/features/agenda/components/InlineProcedureForm.tsx`:
  - Campo de custo de insumos (R$) no formulário inline com validações defensivas e persistência de `cost_cents`.

### Camada 3: Repositório Local (Dexie.js / Local-First)
- `frontend/src/db/repositories/procedure-local-repository.ts`:
  - `createProcedure(input)`: Persiste no Dexie (`procedures`) e enfileira mutação `INSERT` na `sync_outbox` em transação atômica;
  - `updateProcedure(id, updates)`: Valida limites e persiste no Dexie com mutação `UPDATE` na outbox;
  - `deleteProcedure(id)`: Executa soft-delete (`is_active = false`, `deleted_at = now`) com mutação `DELETE` na outbox;
  - `reactivateProcedure(id)`: Restaura `is_active = true` e limpa `deleted_at = null`, gerando mutação `UPDATE` na outbox;
  - `listProcedures(tenantId, options)`: Filtra conforme `includeInactive` e popula seeds padrão (com UUIDs válidos) e mutações outbox caso o banco esteja vazio.

### Camada 4: Sincronização e Backend
- As mutações geradas na `sync_outbox` são enviadas via lote no endpoint `POST /api/sync/batch`;
- O backend (`backend/src/routes/sync.ts` e `backend/src/repositories/procedure-repository.ts`) realiza o auto-seed dos procedimentos padrões caso o banco PostgreSQL do tenant esteja vazio, persistindo `cost_cents`, `is_active` e `deleted_at` com Last-Write-Wins.

---

## 3. Regras de Negócio e Salvaguardas

1. **Soft-Delete Inegociável e Reativação:**
   - Procedimentos nunca sofrem hard-delete;
   - Desativar um procedimento remove-o da lista de seleção para novos agendamentos, mas as consultas passadas ou futuras já salvas preservam o histórico em `appointment_items`;
   - Um procedimento desativado pode ser reativado a qualquer momento em 1 clique na aba de "Inativos".
2. **Duração Maior que Zero:**
   - Qualquer tentativa de criar ou atualizar um procedimento com duração <= 0 minutos é bloqueada no frontend e rejeitada pelo repositório.
3. **Preço e Custo Não-Negativos:**
   - Preço de tabela e custo operacional devem ser `>= 0`. Procedimentos de cortesia ou avaliação preventiva têm preço R$ 0,00.
4. **Auto-Seed e Consistência Multi-Dispositivo:**
   - Seeds locais utilizam UUIDs válidos compatíveis com o PostgreSQL e enfileiram mutação `INSERT` na outbox;
   - O backend garante a presença dos procedimentos no `/api/sync/batch` para dispositivos recém-conectados.

---

## 4. Testes Automatizados (@spec)

- `frontend/src/db/repositories/__tests__/procedure-local-repository.spec.ts`:
  - `@spec:AC-243`: Métodos de update, soft-delete e reativação com outbox no repositório local.
- `frontend/src/features/agenda/__tests__/inline-procedure-cost.spec.tsx`:
  - `@spec:AC-242`: Preenchimento de custo no cadastro rápido direto pela tela de agendamento.
- `frontend/src/features/procedures/__tests__/gestao-procedimentos-ui.spec.tsx`:
  - `@spec:AC-238`: Acesso à tela de procedimentos pela seção Mais e navegação consistente;
  - `@spec:AC-239`: Visualização, contadores e busca reativa por nome de procedimentos;
  - `@spec:AC-240`: Cadastro e edição de procedimentos com validação de regras de negócio;
  - `@spec:AC-241`: Exclusão com soft-delete e modal de confirmação de segurança;
  - `@spec:AC-244`: Filtro de procedimentos inativos e reativação em um clique.
- `backend/src/repositories/__tests__/procedure-repository.spec.ts`:
  - `@spec:AC-245`: Auto-seed de procedimentos padrões no PostgreSQL e suporte a listagem com inativos.

