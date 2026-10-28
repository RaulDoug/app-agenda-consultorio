# Diretrizes e Regras Globais do Frontend — OdontoFlow

> **Status:** Documento Vivo de Referência Obrigatória  
> **Localização:** `docs/frontend/funcionalidades/regras_globais.md`  
> **Público-alvo:** Agentes de IA e Desenvolvedores Frontend  
> **Objetivo:** Estabelecer as fundações inegociáveis de arquitetura Local-First, ergonomia mobile (One-Thumb), persistência no Dexie.js, sincronização e estratégia de testes no frontend da aplicação.

---

## 1. Paradigma Local-First e Persistência no Dexie.js (IndexedDB)

### 1.1 Princípio Fundamental (Offline por Padrão)
O frontend do **OdontoFlow** opera em arquitetura **Local-First**. Todas as leituras e mutações do usuário são realizadas prioritariamente no banco de dados local do navegador/dispositivo (`IndexedDB` gerenciado via `Dexie.js`), garantindo:
- Tempos de resposta instantâneos (**< 5 milissegundos**) para consultas e atualizações de tela;
- Operação ininterrupta em consultórios com oscilação ou ausência completa de sinal de internet;
- Interface imune a atrasos de rede ou travamentos com spinners bloqueantes.

### 1.2 Regras de Persistência Local nos Repositórios
1. **Transações Atômicas Obrigatórias:**
   - Toda gravação no banco local que represente criação, edição ou exclusão lógica DEVE ocorrer dentro de uma transação atômica do Dexie envolvendo a tabela alvo e a tabela `sync_outbox`.
   ```typescript
   await this.db.transaction('rw', [this.db.patients, this.db.sync_outbox], async () => {
     await this.db.patients.put(patient);
     await enqueueMutation(this.db, {
       entity: 'patients',
       recordId: patient.id,
       operation: 'UPDATE',
       payload: patient,
     });
   });
   ```
2. **Soft-Delete Local:**
   - Entidades de negócio (pacientes, agendamentos, transações) mantêm `is_active: false` e marcação de `updated_at` no banco local, refletindo a exclusão para o backend via mutação `UPDATE` ou `DELETE` lógico na outbox.
3. **Reatividade Instantânea com `useLiveQuery`:**
   - As telas e listas devem observar o banco local via `useLiveQuery(...)` do `dexie-react-hooks`. Quando uma mutação ocorre, a interface é recalculada automaticamente sem necessidade de refetch manual.

---

## 2. Fila de Sincronização (`sync_outbox`) e Consistência

### 2.1 Papel da Outbox Local
- A tabela `sync_outbox` armazena as mutações pendentes em formato FIFO com:
  - `id`: Chave primária autoincremento;
  - `entity`: Nome da entidade (`patients`, `appointments`, `financial_transactions`, etc.);
  - `recordId`: UUID do registro;
  - `operation`: Tipo de operação (`INSERT`, `UPDATE`, `DELETE`);
  - `payload`: Dados serializados em JSON;
  - `timestamp`: Momento em que a ação ocorreu localmente;
  - `synced`: Flag booleano (0 = pendente, 1 = sincronizado).

### 2.2 Resolução de Conflitos (Server-Wins Concorrente)
- Ao receber atualizações delta do backend (ex: confirmações de WhatsApp recebidas via webhook), o motor de sincronização atualiza o Dexie local. Em caso de conflito de timestamp concorrente, prevalece a regra de autoridade do servidor para evitar duplicidade de horários ou transações financeiras.

---

## 3. Arquitetura Rígida em 4 Camadas no Frontend

Todo código desenvolvido no frontend deve respeitar rigorosamente a separação em quatro camadas:

```
┌──────────────────────────────────────────────┐
│ 1. Camada de Apresentação (UI / Components)   │  JSX, Tailwind CSS, Eventos
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│ 2. Camada de Orquestração (Hooks / State)    │  useLiveQuery, Forms, Modais
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│ 3. Camada de Repositório Local (Dexie Repos) │  Transações, Outbox, Soft-Delete
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│ 4. Camada de Sync & API (Sync Engine / HTTP) │  Batch Sync, Polling, WebSocket
└──────────────────────────────────────────────┘
```

### 3.1 Responsabilidades e Proibições por Camada
1. **Camada de Apresentação (`src/components/`, `src/features/<feat>/components/`):**
   - **Faz:** Renderiza HTML/JSX semântico, estiliza com Tailwind CSS, captura eventos do usuário e consome estados providos por hooks ou props.
   - **PROIBIDO:** Não executa chamadas diretas ao Dexie (`db.patients.add(...)`), não faz `fetch(...)` avulso de APIs e não concentra lógica de validação complexa de negócio no JSX.
2. **Camada de Orquestração (`src/features/<feat>/hooks/`, `src/hooks/`):**
   - **Faz:** Reúne queries reativas (`useLiveQuery`), valida dados de formulários, controla ciclo de vida de gavetas/modais e delega mutações aos repositórios locais.
   - **PROIBIDO:** Não acopla estilos visuais e não manipula o DOM diretamente.
3. **Camada de Repositório Local (`src/db/repositories/`):**
   - **Faz:** Encapsula operações de banco IndexedDB, executa transações atômicas com `sync_outbox`, calcula campos derivados e trata integridade referencial local.
   - **PROIBIDO:** É desacoplado do React (não usa hooks nem JSX). Pode ser testado de forma puramente funcional com `fake-indexeddb`.
4. **Camada de Sync & API (`src/sync/`, `src/services/`):**
   - **Faz:** Gerencia conexão com a API REST (`/api/sync/batch`), controla retries com backoff exponencial, envia mutações da outbox e atualiza dados locais.
   - **PROIBIDO:** Não acessa componentes da interface diretamente; comunica mudanças persistindo dados no Dexie ou disparando eventos globais.

---

## 4. Princípios de UX Mobile e One-Thumb Ergonomics

O OdontoFlow foi concebido para o **"Dentista-Operador"** que utiliza o sistema predominantemente no smartphone entre um atendimento e outro.

1. **Operação com uma só mão (One-Thumb Ergonomics):**
   - Componentes acionáveis prioritários devem se concentrar no **terço inferior da tela**;
   - Modais complexos devem ser substituídos por **Gavetas Inferiores (Bottom Sheets/Drawers)** fáceis de fechar puxando para baixo ou tocando no backdrop;
   - Zonas de toque mínimas de 44x44px (`min-h-[44px]`, `min-w-[44px]`).
2. **Velocidade de Cadastro (< 10 Segundos):**
   - Uso de botões em formato de pílula (*chips*) para seleção rápida de procedimentos e durações;
   - Cadastro instantâneo de novos pacientes em linha (*inline / on-the-fly*) sem desviar da gaveta de agendamento.
3. **Estados de Conectividade Visíveis:**
   - Topo da aplicação sempre exibe o indicador claro de status:
     - 🟢 **Online (Sincronizado)**;
     - 🟡 **Offline (X pendentes de envio)**;
     - 📱 **Status do WhatsApp** (Verde = Conectado, Amarelo/Vermelho = Ação necessária).
4. **Prevenção de Duplo Clique (Double-Tap Protection):**
   - Todo botão de submissão ou conclusão deve desabilitar imediatamente e exibir feedback visual enquanto a operação de persistência é concluída.
5. **Contenção Rígida de Largura e Prevenção de Rolagem Lateral (No Horizontal Scroll):**
   - O viewport mobile nunca deve permitir arrasto ou rolagem lateral indesejada (`overflow-x-hidden` no contêiner principal);
   - Em layouts Flexbox (`flex-row`), contêineres filhos com textos ou cartões truncados (`truncate`) DEVEM OBRIGATORIAMENTE possuir a classe `min-w-0` (e `flex-1`), prevenindo que o cálculo de largura intrínseca (`min-content`) estufe o card além da largura da tela (ex: cards de apoio de atendimento contínuo na grade de horários).

---

## 5. Estratégia de Testes do Frontend (TDD com Vitest)

1. **Repositórios Locais (`*.repository.spec.ts`):**
   - Validar persistência atômica no Dexie e enfileiramento na `sync_outbox` usando `fake-indexeddb`.
2. **Hooks de Domínio (`*.hook.spec.ts`):**
   - Validar retorno de dados reativos, filtros e tratamento de estados.
3. **Componentes e Gavetas (`*.spec.tsx`):**
   - Utilizar `@testing-library/react` e `@testing-library/user-event`;
   - Testar o comportamento a partir da perspectiva do usuário (textos, botões, acessibilidade);
   - Cobrir os estados fundamentais: **Carregando, Vazio, Sucesso e Erro**.
4. **Vínculo com Especificações (@spec:AC-xxx):**
   - Todo teste de critério de aceite DEVE conter a marcação `@spec:AC-xxx` no título para auditoria mecânica.
5. **Escopo de Queries em Testes Integrados (`within` e `queryAllByText`):**
   - Como o `App.tsx` mantém as abas ativas/inativas montadas no DOM (alternadas via classe CSS `hidden`), consultas globais por texto (`getByText`) podem encontrar duplicatas entre a tela oculta e um modal/drawer aberto.
   - Em testes integrados de modais e gavetas, restrinja o escopo utilizando `within(screen.getByRole('dialog'))`.
   - Para asserções de remoção reativa de elementos da tela sob concorrência, prefira `expect(screen.queryAllByText('...')).toHaveLength(0)` com timeout explícito no `waitFor` para evitar falso-positivo de múltiplos elementos.

---

## 6. Padronização de Estilização e Dependências

1. **Exclusividade do Tailwind CSS:**
   - Todos os estilos devem utilizar classes utilitárias do Tailwind CSS e classes semânticas definidas em `tailwind.config.js`.
   - É proibido instalar frameworks CSS conflitantes (ex: Bootstrap, Material UI, Styled Components).
2. **Ícones:**
   - Utilizar a biblioteca **Lucide React** (`lucide-react`) para manter consistência visual e ícones limpos em padrão vetorial SVG.
3. **Contratos Compartilhados:**
   - Todo tipo, interface e enum de domínio deve ser consumido de `@cliniassist/shared`.

---

## 7. Autenticação e Gestão de Sessão Local-First

1. **Porta de Entrada e Bloqueio de Acesso:**
   - O aplicativo abre estritamente na tela de login (`LoginScreen`) quando não houver sessão ativa válida gravada no Dexie (`auth_session`).
   - O componente `AuthGate` atua como barreira inegociável: nenhuma tela de funcionalidade do consultório pode ser renderizada sem o status `authenticated`.
2. **Persistência da Sessão no Dexie (`auth_session`):**
   - A sessão (token JWT, dados do usuário e perfil do consultório) é salva localmente com a chave fixa `active_session`.
   - O repositório `AuthSessionLocalRepository` encapsula todas as operações de leitura, gravação e limpeza de sessão.
3. **Isolamento Multi-Tenant Estrito no Login:**
   - Ao autenticar um novo consultório cujo `tenant.id` difere do consultório logado anteriormente, o repositório DEVE invocar a limpeza completa de dados locais (`clearAllData()`) antes de salvar a nova sessão, prevenindo contaminação entre consultórios.
4. **Comunicação Segura com Bearer Token:**
   - Todas as requisições autenticadas para a API (inclusive sincronização via `SyncManager` e requisições do WhatsApp) DEVEM injetar o cabeçalho HTTP `Authorization: Bearer <token>`.
   - O uso do cabeçalho legado `x-tenant-id` está expressamente descontinuado no frontend.
5. **Tratamento de 401 e Logout Seguro:**
   - Respostas HTTP com status 401 disparam a limpeza da sessão e o retorno imediato à tela de login. O `SyncManager` invoca `onUnauthorized` para deslogar imediatamente.
   - Ao executar logout pelo usuário, se houver mutações pendentes na `sync_outbox`, o sistema DEVE apresentar a gaveta de confirmação (`LogoutConfirmDrawer`) informando a quantidade de alterações pendentes antes da purga do banco local.
6. **Suporte PWA Offline, Bootstrap Idempotente e Service Worker (AC-196, AC-207, AC-208):**
   - O arquivo `main.tsx` atua exclusivamente como ponto de entrada imperativo (bootstrap), sendo expressamente proibido declarar componentes React nele (o `AuthenticatedApp` reside em `App.tsx`) para preservar o funcionamento do *React Fast Refresh*.
   - A montagem da árvore React via `mountApp` deve ser estritamente idempotente (reaproveitando a referência existente de `ReactDOM.Root` no container `#root`), prevenindo advertências de `createRoot` duplicado e vazamentos de memória sob HMR ou recargas.
   - O arquivo `public/sw.js` adota a estratégia **Network-First com Fallback Offline** tanto para navegação quanto para ativos estáticos/módulos, garantindo código sempre atualizado e compatível com o HMR do Vite quando online, e servindo o cache imediatamente quando desconectado (F5 offline).
   - O Service Worker deve aplicar trava de segurança aceitando estritamente requisições `GET` (`request.method !== 'GET'`) e bypass inegociável de rotas `/api` (`url.pathname.startsWith('/api')`), assegurando que dados clínicos e tokens de autenticação multi-tenant permaneçam confinados ao `IndexedDB` (Dexie).

---

## 8. Agendamento Inteligente e Integridade Cadastral de Pacientes

1. **Pré-seleção Inteligente de Horário e Data:**
   - Ao acionar a criação de agendamento sem clicar em um slot específico da grade (ex: botão "+ Novo Agendamento" ou atalhos rápidos), o sistema calcula automaticamente o próximo horário válido do dia (arredondado para múltiplos de 30 minutos).
   - Se o horário atual for igual ou posterior ao fechamento do expediente (ex: `>= 18:00`), a data pré-selecionada avança automaticamente para o dia seguinte (`tomorrow`) com o horário de abertura do consultório (`08:00`).
2. **Exibição Estrita de Encaixe sob Demanda:**
   - Em horários normais livres, a opção ou checkbox de encaixe NÃO deve ser renderizada, reduzindo atrito e ruído visual.
   - O aviso destacado e a opção de autorizar encaixe extraordinário são exibidos estritamente sob conflito de sobreposição ou horário fora do expediente/almoço.
3. **Expansão Dinâmica da Grade Diária para Encaixes (AC-198):**
   - Na visualização diária da agenda (`ScheduleGrid`), a grade expande dinamicamente para acomodar consultas de encaixe que ocorram antes da abertura ou após o encerramento do expediente, renderizando slots adicionais com o badge distintivo `Extra`.
4. **Validações Estritas na Remarcação de Consulta (`RescheduleModal` — AC-199):**
   - A remarcação direta via modal avalia choque com agendamentos ativos, intervalo de almoço, horários fora de expediente e domingos, exigindo autorização explícita via checkbox antes de habilitar a confirmação.
5. **Bloqueio de Duplicidade de WhatsApp de Pacientes e Equivalência DDI 55 (AC-201):**
   - O repositório local `PatientLocalRepository` valida a unicidade dos dígitos numéricos do WhatsApp antes de inserir ou atualizar pacientes ativos no mesmo consultório (`tenant_id`), tratando números com ou sem o prefixo internacional `55` como a mesma linha telefônica.
   - Tentativas com número duplicado disparam erro descritivo contendo o nome do paciente já cadastrado, exibindo alerta vermelho no formulário sem fechar a tela nem enfileirar mutações duplicadas.

---

## 9. Checkout Financeiro e Preservação de Preços de Tabela

1. **Imutabilidade do Valor Base do Procedimento:**
   - Na conclusão da consulta via `CheckoutDrawer`, os valores cadastrais dos procedimentos (`basePriceCents`) permanecem intocados e visíveis no card do item, preservando o valor de tabela original.
2. **Centralização da Edição no Total Final Cobrado:**
   - O ajuste de valor cobrado é realizado unicamente no campo `Total Final Cobrado`, eliminando erros operacionais e divergências em itens individuais.
3. **Sinalização Numérica e Percentual da Variação:**
   - Diferenças a maior em relação ao subtotal são exibidas como **Acréscimo** com sinal positivo explícito (`+ R$ X,XX (+Y.Y%)`) em verde.
   - Diferenças a menor são exibidas como **Desconto** com sinal negativo explícito (`- R$ X,XX (-Y.Y%)`) em âmbar.
4. **Rateio Proporcional Ponderado:**
   - Tanto acréscimos quanto descontos são distribuídos proporcionalmente aos pesos de cada item no subtotal, calculando o `effectivePriceCents` sem sobrescrever `basePriceCents`.
5. **Bloqueio Estrito de Entrada no Parcelamento (AC-202):**
   - Na modalidade parcelada (`InstallmentsForm`), o valor da entrada não pode ser igual nem superior ao total cobrado (`entryCents >= totalCents`), orientando o usuário a utilizar a opção à vista se desejar liquidar a totalidade da cobrança.

---

## 10. Projeção Trimestral de Recebíveis DRE (AC-203)

- A projeção de recebíveis futuros em 30, 60 e 90 dias (`calculateReceivablesProjection`) utiliza janelas de calendário completas (31, 62 e 93 dias no fuso local normalizado), assegurando que três parcelas mensais contratadas sejam integralmente computadas dentro do trimestre de 90 dias, mesmo em meses com 31 dias de duração.

---

## 11. Formatação Contextual de Período e Resumo de Atendimentos (AC-204, AC-205)

1. **Formatação Dinâmica de Período (Abordagem Direta e Limpa):**
   - O cabeçalho de navegação na agenda (`ViewModeSelector`) ajusta o formato da data conforme o modo:
     - **Dia:** Formato limpo com primeira letra maiúscula e preposições minúsculas (ex: `Ter., 27 de out. de 2026`), sem aplicar CSS `capitalize` que quebra preposições;
     - **Semana:** Intervalo de segunda a domingo, tratando mesma semana no mês (`19 – 25 de out. de 2026`), virada de mês (`26 de out. – 01 de nov. de 2026`) e virada de ano (`28 de dez. de 2026 – 03 de jan. de 2027`);
     - **Mês:** Mês por extenso capitalizado e ano (ex: `Outubro de 2026`).
2. **Contador Reativo de Atendimentos:**
   - Exibição de subtítulo informativo abaixo da data indicando a contagem de agendamentos não cancelados no intervalo visível (`Nenhum atendimento`, `1 atendimento`, `X atendimentos`).
3. **Limpeza de Duplicidade em Ações:**
   - O botão superior de novo agendamento exibe o texto limpo `Novo Agendamento` acompanhado de seu ícone, sem duplicidade de sinal `+`.

---

## 12. Alternância de Confirmação Manual para Reagendamento na Fila WhatsApp (AC-220, AC-221)

1. **Substituição Contextual do Botão de Resolução:**
   - Na Central de Fila de WhatsApp (`WhatsappQueueView`), mensagens recebidas com intenção de novo agendamento ou reagendamento (`RESCHEDULE_REQUESTED` ou termos semânticos no balão do paciente) substituem o botão padrão `Confirmar Manualmente` pelo botão de ação destacada `Reagendar Consulta` com ícone de calendário.
2. **Abertura do Modal de Remarcação Integrado:**
   - O acionamento do botão abre o `RescheduleModal` repassando os dados do agendamento, permitindo a seleção da nova data/horário e disparando a sincronização imediata (`runSync`) ao concluir a remarcação.

---

## 13. Resolução de Reagendamento e Estado de Resposta ao Paciente na Fila WhatsApp (AC-224, AC-225, AC-226)

1. **Ocultação Imediata Pós-Remarcação (AC-224):**
   - Ao concluir a remarcação de uma consulta no modal, o status transita para `CONFIRMED` e a opção 'Reagendar Consulta' é imediatamente ocultada do card.
2. **Ações de Comunicação Disponíveis enquanto Não Respondido (AC-225):**
   - Enquanto `is_replied = false`, o card disponibiliza botões para enviar aviso da nova data/horário em 1 clique (`btn-send-reschedule-notice`), abrir o WhatsApp Web (`link-wa-chat`) e marcar manualmente como respondido (`btn-mark-replied`).
3. **Transição Visual para Estado Respondido (AC-226):**
   - Ao registrar uma resposta (envio de aviso, detecção de outbound posterior ou marcação manual), todos os botões de resposta são ocultados e o card passa a exibir o badge permanente `✓ Respondido`.

---

## 14. Gabarito de Variáveis e Auxiliares de Spintax em Templates de WhatsApp (AC-227, AC-228, AC-229)

1. **Gabarito Visual de Variáveis (AC-227):**
   - Na gaveta de configuração de mensagens padrão (`WhatsappTemplatesDrawer`), exibir painel informativo de destaque explicando o uso de `{nome}`, `{data}`, `{horario}` e a sintaxe de Spintax `{opção1|opção2}` para prevenção de bloqueio por spam.
2. **Atalhos de Inserção com 1 Clique (AC-228):**
   - Cada área de texto deve dispor de chips clicáveis de inserção de tags para reduzir erros de sintaxe manual.
3. **Prévia Simulada em Tempo Real (AC-229):**
   - Apresentar balão com prévia imediata da mensagem interpolada com dados simulados para validação do usuário antes de salvar.

---

## 15. Cards Expansíveis (Accordion) e Salvamento Individual de Templates de WhatsApp (AC-230, AC-231, AC-232)

1. **Estrutura em Accordion com Cards Expansíveis (AC-230):**
   - Na gaveta de templates (`WhatsappTemplatesDrawer`), os modelos de mensagem são estruturados como cards individuais com cabeçalho clicável, ícone expansivo (`ChevronDown`/`ChevronUp`) e snippet resumido de texto quando recolhidos, permitindo alternar o foco visual em uma mensagem por vez.
2. **Prévia Contextual dentro do Card Aberto (AC-231):**
   - Cada card expandido renderiza sua própria simulação visual de balão do WhatsApp com resolução de variáveis simuladas (`Carlos`, `28/10`, `14:30`) e primeiro termo do Spintax.
3. **Persistência Individual com Feedback Imediato (AC-232):**
   - O botão `Salvar Mensagem` fica situado no rodapé de cada card expandido, disparando `onSave({ [template_field]: value })` apenas para a mensagem alterada, mantendo a gaveta aberta e exibindo badge verde de confirmação `✓ Salvo` por 3 segundos.

---

## 16. Seletor de Escopo de Resposta Automática no Card de Conexão WhatsApp (AC-233)

1. **Audiência Configurável (One-Thumb Ergonomics):**
   - O card de pareamento e conexão (`WhatsAppPairingView.tsx`) exibe no terço inferior um seletor visual em 3 segmentos: "Apenas Cadastrados" (`REGISTERED_ONLY`), "Todos os Contatos" (`ALL`) e "Desativado" (`DISABLED`).
2. **Reatividade e Persistência Direta via API:**
   - A troca de opção dispara `PUT /api/whatsapp/settings`, exibindo indicador de salvamento e confirmação visual sem exigir botões adicionais de formulário.

---

## 17. Gestão de Procedimentos e Catálogo de Serviços Clínicos (AC-238 a AC-245)

1. **Acesso Centralizado e Navegação Híbrida (AC-238):**
   - O catálogo de serviços é acessível tanto pelo hub mobile **"Mais"** (`MoreMenuHub`) quanto pelo menu lateral desktop (`DesktopSidebar`) através da aba `'procedimentos'`.
2. **Visualização Detalhada com Margem Bruta Estimada (AC-239):**
   - Os cards de procedimento (`ProcedureCard`) exibem nome, duração em minutos, preço de tabela, custo operacional de insumos/laboratório (`cost_cents`) e margem bruta estimada calculada em tempo real (`preço - custo`).
   - A listagem é filtrável de forma reativa pelo nome com busca instantânea.
3. **Validações Estritas de Criação e Edição (AC-240):**
   - Duração padrão deve ser estritamente positiva (`> 0`);
   - Preço cobrado e custo de insumos devem ser não-negativos (`>= 0`), permitindo R$ 0,00 para procedimentos cortesia / avaliação.
4. **Soft-Delete Seguro Inegociável (AC-241, AC-243):**
   - A exclusão de um procedimento marca `is_active: false` e `deleted_at: now`, gerando mutação `DELETE` na `sync_outbox`;
   - O modal de confirmação alerta expressamente que o histórico e agendamentos anteriores permanecem 100% preservados em `appointment_items`.
5. **Custo Operacional no Cadastro Rápido da Agenda (AC-242):**
   - O formulário inline de procedimentos na gaveta de novo agendamento rápido (`InlineProcedureForm`) disponibiliza o campo de custo (R$), persistindo `cost_cents` no banco local e na outbox logo no momento da criação on-the-fly.
6. **Filtro de Inativos e Reativação em 1 Clique (AC-244):**
   - A tela de catálogo disponibiliza filtros segmentados ("Ativos", "Inativos" e "Todos") com contadores dinâmicos;
   - Procedimentos inativados recebem badge visual "Inativo", estilização atenuada com texto tachado e ação de reativação imediata (`reactivateProcedure`), restaurando `is_active: true`, limpando `deleted_at: null` e despachando mutação `UPDATE` para a `sync_outbox`.
7. **Auto-Seed e Consistência Multi-Dispositivo (AC-245):**
   - Os procedimentos padrões da clínica possuem sementes consistentes no cliente e no servidor PostgreSQL;
   - O repositório backend auto-semeia os 4 procedimentos padrões (`Consulta Inicial / Avaliação`, `Atendimento Padrão`, `Retorno / Revisão` e `Procedimento Especializado`) caso o tenant esteja vazio, entregando-os no lote `/api/sync/batch` para acesso instantâneo em múltiplos dispositivos.
