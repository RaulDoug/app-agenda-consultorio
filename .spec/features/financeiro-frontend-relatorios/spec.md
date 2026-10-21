# Spec: Financeiro e Relatórios Gerenciais no Frontend

> feature: financeiro-frontend-relatorios
> status: pronta

## Contexto

Completa o ciclo financeiro e analítico no frontend com experiência estritamente **Mobile-First e Local-First**: introduz extrato financeiro detalhado (livro caixa em lista de cards touch-friendly com filtros em pílulas e busca), quitação e baixa em lote de parcelas com barra de ação inferior (One-Thumb Ergonomics) e Bottom Sheet modal, categorias financeiras dinâmicas no fluxo de despesas, sincronização híbrida dos relatórios gerenciais com os endpoints de inteligência do backend e prontuário financeiro completo no perfil do paciente via Bottom Drawer.

## Histórias

### US-101 — Extrato Financeiro Detalhado Mobile-First (Livro Caixa com Filtros e Exportação)

Como gestor ou dentista do consultório, quero visualizar todas as movimentações financeiras em um extrato detalhado em lista vertical responsiva com filtros touch por tipo, status e categoria, para conciliar receitas e despesas com ergonomia em smartphones.

#### AC-178 — Extrato de transações em lista vertical responsiva com filtragem e exportação

- **Dado** que o usuário está na aba "Caixa" e acessa a seção de extrato/livro caixa em um dispositivo móvel;
- **Quando** o usuário interage com a interface;
- **Então** os registros devem ser renderizados como cards verticais touch-friendly (sem tabelas com rolagem horizontal que quebram o layout mobile), contendo data, descrição, badge de status, categoria e valor em tipografia mono;
- **E** os filtros de tipo (`Todas`, `Receitas`, `Despesas`, `Pendentes`) devem operar como pílulas horizontais com scroll touch fluido e busca textual instantânea;
- **E** deve permitir exportar os registros filtrados para um arquivo CSV simples formatado em reais.

---

### US-102 — Quitação e Baixa em Lote com Ergonomia One-Thumb

Como recepcionista ou administrador da clínica usando o celular com uma mão, quero selecionar várias parcelas pendentes e acionar a baixa em lote por uma barra de ação inferior com Bottom Sheet, para fechar o caixa rapidamente sem exigir alcance no topo da tela.

#### AC-179 — Seleção múltipla com barra de ação inferior e baixa em lote via Bottom Sheet

- **Dado** que existem parcelas com status `PENDING` na lista de contas a receber;
- **Quando** o usuário seleciona uma ou mais parcelas através de checkboxes com área de toque mínima de 44x44px;
- **Então** uma barra de ação flutuante ou fixa deve surgir na zona inferior do polegar (One-Thumb Zone) exibindo a quantidade selecionada e o valor total acumulado em Reais (`Dar Baixa em N Selecionadas — R$ X,XX`);
- **E** ao acionar a baixa, o diálogo de confirmação deve abrir como um Bottom Sheet ancorado na base da tela (deslizando de baixo para cima), permitindo definir o meio de pagamento e a data com botões de toque largo;
- **E** ao confirmar, todas as parcelas selecionadas devem ser atualizadas localmente no IndexedDB para status `PAID`, enfileiradas na `sync_outbox` e sincronizadas com a API backend via `POST /api/financial/settle-batch`.

---

### US-103 — Gestão e Utilização Dinâmica de Categorias Financeiras

Como gestor do consultório, quero que o lançamento de despesas pelo celular utilize as categorias cadastradas no sistema, para que os lançamentos financeiros reflitam o plano de contas da clínica.

#### AC-180 — Seleção dinâmica de categorias de despesa com fallback offline

- **Dado** que o usuário abre o modal/gaveta de lançamento de despesa rápida;
- **Quando** o formulário é carregado;
- **Então** o campo de seleção de categorias deve exibir as categorias ativas sincronizadas do backend ou o conjunto padrão armazenado localmente;
- **E** ao registrar a despesa, a categoria selecionada deve ser persistida na transação e refletida nos cálculos de fluxo de caixa e relatórios.

---

### US-104 — Relatórios Gerenciais Híbridos em Cards Verticais Mobile-First

Como gestor do consultório, quero visualizar os relatórios e indicadores da clínica organizados em cards verticais legíveis em qualquer tamanho de tela, calculados instantaneamente com dados locais e com revalidação assíncrona opcional com o servidor backend.

#### AC-181 — Visualização instantânea de métricas em cards verticais com revalidação do servidor

- **Dado** que o usuário acessa a aba "Relatórios" no smartphone;
- **Quando** a tela é aberta;
- **Então** as métricas analíticas (No-Show com valor perdido, DRE simplificado, Recebíveis futuros 30/60/90d, Ranking de Procedimentos e Pacientes Inativos) devem ser renderizadas imediatamente em coluna única vertical a partir dos dados do Dexie;
- **E** quando o dispositivo estiver online e autenticado, deve exibir badge discreto de status de sincronização e permitir revalidar com as rotas `/api/reports/*` sem travar a interface mobile.

---

### US-105 — Prontuário Financeiro no Detalhe do Paciente via Bottom Drawer

Como dentista ou recepcionista, quero abrir o prontuário financeiro do paciente através de um botão no card do cliente, abrindo uma gaveta inferior deslizante com o histórico de gastos, consultas e baixas pontuais.

#### AC-182 — Visualização de prontuário financeiro via Bottom Drawer com quitação pontual

- **Dado** que o usuário está na tela de Clientes e clica no botão de finanças (`$`) no card de um paciente (com touch target >= 44px);
- **Quando** a ação é disparada;
- **Então** uma gaveta inferior (Bottom Drawer) deve deslizar suavemente a partir da base da tela, ocupando a área mobile com rolagem interna independente;
- **E** deve exibir o resumo acumulado de gastos, histórico cronológico de atendimentos e o status de pagamento de cada consulta;
- **E** deve permitir dar baixa imediata caso existam parcelas ou consultas com pagamento pendente daquele paciente diretamente da gaveta.

## Fora de escopo

- Emissão de notas fiscais eletrônicas (NFS-e) e integração bancária Open Finance automática via boleto registrado.
- Edição de plano de contas com hierarquia multinível complexa além de categorias primárias.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-057 | A baixa em lote de parcelas no frontend atualiza localmente cada transação no Dexie com `status: 'PAID'` e enfileira as mutações na `sync_outbox`, além de invocar `POST /api/financial/settle-batch` quando online. | confirmada | Garante integridade imediata offline e reconciliação com o backend. |
| ASM-058 | O extrato financeiro (livro caixa) exibe transações ordenadas cronologicamente de forma decrescente por data de vencimento/pagamento. | confirmada | Padrão ergonômico de extrato financeiro em apps bancários e de gestão. |
| ASM-059 | O prontuário financeiro do paciente pode ser gerado offline a partir dos registros locais de `appointments`, `appointment_items`, `procedures` e `financial_transactions`, complementando o endpoint `/api/reports/patient-history/:patientId`. | confirmada | Garante funcionamento ininterrupto mesmo sem internet. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-051 | A tela de extrato deve ser uma aba interna na seção Caixa ou substituir a lista simplificada de recebíveis? | respondida | Alternância em pílulas [Resumo / Contas] e [Extrato Detalhado], mantendo ergonomia de polegar e carregamento instantâneo. |
