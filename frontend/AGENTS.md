# Diretrizes e Regras Estritas do Frontend — OdontoFlow

> **Escopo:** Todo o código dentro de `frontend/` e seus subdiretórios.  
> **Status:** Regra Mandatória Inegociável para Agentes de IA e Desenvolvedores.

---

## 1. Regra Mandatória de Consulta e Atualização de Documentação

### 1.1 Consulta Obrigatória Prévia
Antes de iniciar qualquer análise, planejamento, refatoração ou implementação de código no frontend:
- A IA **DEVE OBRIGATORIAMENTE** consultar a pasta [`docs/frontend/funcionalidades`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/docs/frontend/funcionalidades).
- A leitura do arquivo [`regras_globais.md`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/docs/frontend/funcionalidades/regras_globais.md) é mandatória para garantir conformidade com os padrões transversais de UX, persistência local e sincronização.

### 1.2 Atualização Mandatória a Cada Tarefa Finalizada (Gate de Conclusão)
Nenhuma tarefa no frontend é considerada concluída sem que a documentação técnica seja atualizada:
1. **Documentação da Funcionalidade:** Gerar ou atualizar o arquivo específico em `docs/frontend/funcionalidades/<nome_da_funcionalidade>.md` detalhando com clareza e concisão:
   - O que a funcionalidade faz na interface e suas regras de interação/negócio.
   - Componentes envolvidos, hooks de suporte e repositórios locais acessados.
   - Padrões visuais adotados, estados de tela (loading, vazio, erro, sucesso) e comportamento offline.
2. **Atualização das Regras Globais:** Sempre que uma nova diretriz de UI/UX, padrão de hook, convenção de persistência no Dexie.js ou fluxo de sincronização for criado ou ajustado, o arquivo [`regras_globais.md`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/docs/frontend/funcionalidades/regras_globais.md) **DEVE ser imediatamente atualizado**.

---

## 2. Arquitetura Rígida em 4 Camadas no Frontend

Todo o código de frontend deve respeitar rigorosamente a separação em quatro camadas isoladas:

```
UI / Components ──► Feature Hooks / State ──► Local Repositories (Dexie.js) ──► Sync Engine / API Client
```

1. **`frontend/src/components/` e `frontend/src/features/<feature>/components/` (Camada Visual / UI):**
   - **Responsabilidade exclusiva:** Renderização de JSX, apresentação de dados recebidos via props, emissão de eventos de usuário (toques, cliques, inputs) e estilização Tailwind CSS.
   - **Proibição:** Não deve conter lógica pesada de persistência, não deve chamar métodos do Dexie.js diretamente, e não deve realizar chamadas `fetch` ou `axios` soltas em handlers de botão ou efeitos.

2. **`frontend/src/features/<feature>/hooks/` e `frontend/src/hooks/` (Camada de Orquestração / Estado):**
   - **Responsabilidade exclusiva:** Encapsular a reatividade local via `useLiveQuery`, gerenciar estados de formulários, orquestrar chamadas aos repositórios locais e controlar visibilidade de modais/drawers.
   - **Proibição:** Não manipula o DOM diretamente e não acopla estilos visuais.

3. **`frontend/src/db/repositories/` (Acesso a Dados Local / Dexie.js Repositories):**
   - **Responsabilidade exclusiva:** Executar operações transacionais no banco local IndexedDB via Dexie.js e registrar de forma atômica a mutação correspondente na tabela `sync_outbox`.
   - **Proibição:** Não lida com ciclo de vida de componentes React, não possui dependências de JSX ou hooks, sendo classes ou funções TypeScript puras altamente testáveis.

4. **`frontend/src/sync/` e `frontend/src/services/` (Sincronização & Comunicação com API Backend):**
   - **Responsabilidade exclusiva:** Consumir a fila `sync_outbox`, despachar batches para a API REST do backend, processar conflitos (Server-Wins para conflitos concorrentes) e receber atualizações em delta para atualizar o banco local.
   - **Proibição:** Não acessa componentes nem controla interfaces diretamente; notifica o sistema via eventos ou mutação reativa de tabelas Dexie.

---

## 3. Estratégia Estrita de Testes no Frontend (TDD com Vitest)

Cada funcionalidade desenvolvida ou refatorada deve conter testes focados por camada:

1. **Repositórios Locais (`*.repository.spec.ts`):**
   - Testar transações atômicas de CRUD no Dexie e enfileiramento na tabela `sync_outbox` utilizando `fake-indexeddb`.
2. **Hooks de Domínio (`*.hook.spec.ts`):**
   - Testar fluxo reativo, filtros, ordenação e chamadas aos repositórios locais utilizando `renderHook` do React Testing Library.
3. **Componentes e Gavetas (`*.spec.tsx`):**
   - Testar interações do usuário, validações de formulário, abertura/fechamento de gavetas e renderização dos estados (vazio, preenchido, erro), simulando eventos com `userEvent` ou `fireEvent`.
4. **Marcação de Especificação:**
   - Todos os testes de critérios de aceite DEVEM conter a tag `@spec:AC-xxx` no título do teste para validação mecânica pelo motor `onp-spec`.

---

## 4. Diretrizes de UX Mobile, One-Thumb Ergonomics e PWA

1. **One-Thumb Ergonomics (Operação com Polegar):**
   - Ações críticas e formulários rápidos devem utilizar gavetas inferiores (*Bottom Drawers / Sheets*) e botões no terço inferior da tela.
   - Respeitar áreas de respiro e zonas de toque seguras (`p-4`, min-height 44px para alvos de toque).
2. **Local-First & Feedback Instantâneo:**
   - Toda ação de escrita deve refletir imediatamente na UI (< 16ms), salvando no Dexie.js e na fila offline.
   - O aplicativo nunca deve travar a tela com spinners bloqueantes em operações que possam ser salvas localmente.
3. **Padrão Estrito de Estilização:**
   - Utilizar exclusivamente **Tailwind CSS** com a paleta e tokens pré-definidos no projeto.
   - É proibido instalar ou misturar outras bibliotecas pesadas de CSS ou CSS-in-JS.
4. **Contratos Compartilhados:**
   - Modelos de dados e enums de domínio devem ser estritamente importados de `@cliniassist/shared`.
