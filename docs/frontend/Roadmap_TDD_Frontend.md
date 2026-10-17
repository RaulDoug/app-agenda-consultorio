# Roadmap de Desenvolvimento TDD — Frontend
## OdontoFlow — React PWA, Banco Local Dexie.js (`fake-indexeddb`), UI Mobile e Playwright E2E

---

### 1. Diretriz Metodológica do Frontend (Spec-Driven & TDD)

O desenvolvimento do `frontend/` segue estritamente o ciclo **Red-Green-Refactor** ancorado pela skill `onp-spec-driven`:

1. **Todo critério de aceite visual ou local-first nasce como um teste anotado (`@spec:AC-xxx`).**
2. **Testes da camada de dados local (`Dexie.js` via `fake-indexeddb`) vêm antes dos componentes React.**
3. **Testes de Componentes (`React Testing Library` + `@testing-library/user-event`) validam o comportamento sob a ótica do dentista.**

---

### 2. Sprints do Frontend & Especificação de Testes

---

#### SPRINT FE-1: Banco Local IndexedDB (`Dexie.js`) e Fila de Sincronização Offline
> **Objetivo:** Garantir que toda a leitura, escrita otimista e fila offline funcionem localmente antes de construir telas.

##### 1.1 Testes Padrão (Happy Path) — `frontend/src/db/__tests__/local-db.spec.ts`
* [ ] **Inicialização do Schema Dexie.js:** Validar criação das tabelas locais (`patients`, `procedures`, `appointments`, `appointment_items`, `financial_transactions`, `business_hours`, `schedule_blocks`, `sync_outbox`).
* [ ] **Escrita Otimista + Enfileiramento Automático (`sync_outbox`):** Ao criar um paciente ou agendamento no Dexie.js, o registro deve aparecer imediatamente na tabela local E gerar um item `PENDING` na tabela `sync_outbox`.
* [ ] **Reatividade Instantânea (`useLiveQuery`):** Ao inserir ou alterar o status de um agendamento no banco local, a query reativa do dia deve emitir a lista atualizada em menos de 10ms.
* [ ] **Worker de Sincronização (`SyncManager` via MSW):** Quando `navigator.onLine` for `true`, despachar os itens da `sync_outbox` para `POST /api/sync/batch` e remover da fila local após receber `200 OK`.
* [ ] **Janela Ativa de Cache (Pruning):** Limpar do armazenamento local agendamentos concluídos há mais de 90 dias (mantendo-os seguros apenas no servidor) para preservar a leveza no celular.

##### 1.2 Testes de Edge Cases
* [ ] **Edge Case FE-1.1 (Queda de Rede no Meio da Sincronização):** Se a requisição para `/api/sync/batch` falhar (`Network Error` ou `500`), os itens devem permanecer intactos na `sync_outbox` para nova tentativa automática quando a rede estabilizar.
* [ ] **Edge Case FE-1.2 (Edições Múltiplas Offline do Mesmo Registro):** Se o dentista criar um agendamento offline e editá-lo 2 vezes seguidas ainda offline, a `sync_outbox` deve consolidar/enviar na ordem cronológica correta sem perder a última alteração (*Last-Write-Wins*).
* [ ] **Edge Case FE-1.3 (Indicador de Status de Conexão):** O hook `useConnectionStatus` deve alternar imediatamente entre `ONLINE`, `OFFLINE_WITH_PENDING (N)` e `SYNCING` conforme eventos `online`/`offline` da janela.

---

#### SPRINT FE-2: Timeline da Agenda Diária e Criação Rápida (< 10 Segundos)
> **Objetivo:** Construir e testar a experiência principal de visualização da grade e lançamento rápido de consultas.

##### 2.1 Testes Padrão (Happy Path) — `frontend/src/features/agenda/__tests__/agenda-ui.spec.ts`
* [ ] **Renderização da Grade Diária (15 em 15 min):** Exibir horários abertos conforme `business_hours` do dia e destacar visualmente o bloco de intervalo de almoço.
* [ ] **Cores e Badges de Status nos Cards:** Renderizar o card do agendamento com a cor semântica correta (`PENDING` = Amarelo, `CONFIRMED` = Verde, `RESCHEDULE_REQUESTED` = Laranja, `MESSAGE_RECEIVED` = Azul, `COMPLETED` = Cinza, `NO_SHOW` = Vermelho).
* [ ] **Gaveta de Criação Rápida (Toque em Horário Vago):** Tocar no slot das `15:00` abre o modal já com `15:00` preenchido.
* [ ] **Cadastro On-the-Fly de Paciente e Procedimento Inline:**
  * Digitar nome de paciente inexistente exibe botão `+ Cadastrar "[Nome]"` com campo de WhatsApp inline, salvando e selecionando sem fechar a gaveta de agendamento.
  * Digitar procedimento inexistente permite criar com Nome, Duração e Valor padrão inline.
* [ ] **Seleção de Múltiplos Procedimentos:** Selecionar `Limpeza (45m)` + `Restauração (60m)` atualiza instantaneamente na tela o resumo: `Duração: 1h45 | Término previsto: 16:45` e soma o valor sugerido.
* [ ] **Ação de 1 Toque "Paciente Faltou" (`NO_SHOW`):** Tocar em "Paciente Faltou" muda imediatamente o status do card para `NO_SHOW` no banco local.

##### 2.2 Testes de Edge Cases
* [ ] **Edge Case FE-2.1 (Modal de Confirmação de Encaixe / Soft Warning):** Tentar salvar agendamento às `19:00` (fora do expediente das `18:00`) não deve bloquear; deve exibir o alerta *"Fora do expediente regular. Confirmar como encaixe?"*. Ao clicar em confirmar, salva com o selo `⚡ Encaixe`.
* [ ] **Edge Case FE-2.2 (Prevenção de Duplo Clique no Botão Salvar):** Tocar rapidamente 2 vezes em "Salvar Agendamento" deve desabilitar o botão durante a gravação local e criar apenas 1 agendamento.

---

#### SPRINT FE-3: Modal de Retorno Inteligente e Checkout Financeiro ("Caixa de Bolso")
> **Objetivo:** Garantir usabilidade sem atrito na conclusão da consulta, rateio visual de descontos, parcelas e agendamento de retorno.

##### 3.1 Testes Padrão (Happy Path) — `frontend/src/features/checkout/__tests__/checkout-ui.spec.ts`
* [ ] **Edição Individual e Total com Rateio em Tempo Real:**
  * Abrir checkout com 2 procedimentos (`R$ 200` + `R$ 250` = `R$ 450`).
  * Permitir editar o valor individual de qualquer item OU digitar `R$ 400` no Total Final e exibir o aviso de desconto rateado proporcionalmente.
* [ ] **Fluxo de Parcelamento com Entrada e Data da 1ª Parcela:**
  * Selecionar `Parcelado`, informar `Entrada: R$ 100`, `3x` e `Vencimento da 1ª Parcela: 17/11/2026`.
  * Verificar se a prévia visual na tela lista imediatamente a Entrada (Hoje) + as 3 parcelas com datas `17/11/2026`, `17/12/2026` e `17/01/2027`.
* [ ] **Gaveta de Retorno Inteligente (`Em 15 dias`, `Em 30 dias`, `Em 6 meses`):**
  * Cenário Livre: exibe slot disponível e confirma com 1 toque.
  * Cenário Ocupado/Domingo: exibe alerta e apresenta os **3 botões de horários vagos mais próximos** para escolha com 1 toque.
* [ ] **Lançamento Rápido de Despesa:** Modal `+ Despesa` permitindo lançar saída (Valor, Categoria, Data) em menos de 10 segundos.

##### 3.2 Testes de Edge Cases
* [ ] **Edge Case FE-3.1 (Validação Visual de Entrada Inválida):** Se o dentista digitar uma Entrada maior que o Valor Total Cobrado, exibir mensagem clara de validação e desabilitar o botão de confirmação até o ajuste.
* [ ] **Edge Case FE-3.2 (Formatação de Moeda Brasileira `R$`):** Garantir que inputs monetários aceitem digitação fluida no teclado numérico do celular e convertam internamente para centavos inteiros sem erros de máscara.

---

#### SPRINT FE-4: Telas de Caixa, Relatórios, Pareamento WhatsApp e Testes E2E (Playwright)
> **Objetivo:** Validar as visões gerenciais, tela de QR Code do WhatsApp e executar os testes de ponta a ponta em navegador mobile real.

##### 4.1 Testes de Componentes Gerenciais — `frontend/src/features/analytics/__tests__/analytics-ui.spec.ts`
* [ ] **Tela de Caixa & Contas a Receber:** Exibir cards de `Entrou no Caixa`, `A Receber no Mês (Parcelas)`, `Despesas Pagas` e `Lucro Líquido Real`, além do botão de dar baixa (quitar) em parcelas pendentes.
* [ ] **Tela de Pareamento WhatsApp (QR Code):** Renderizar QR Code vindo da API, exibir status `Conectado (Verde)` e exibir banner de alerta vermelho no topo do app quando `whatsapp_connected = false`.
* [ ] **Lista de Reativação de Pacientes Inativos (> 6 meses):** Renderizar lista com botão de atalho direto (`wa.me/55...`) que abre conversa no WhatsApp com mensagem amigável pré-preenchida.

##### 4.2 Suíte End-to-End Mobile (`frontend/e2e/odontoflow-mobile.spec.ts` via Playwright)
* [ ] **E2E-1 (Jornada Completa Mobile):** Em viewport mobile (`390x844` — iPhone 14), criar paciente e procedimento *on-the-fly*, agendar consulta com 2 procedimentos, concluir atendimento com entrada + 3 parcelas e agendar retorno para 15 dias resolvendo conflito de horário.
* [ ] **E2E-2 (Resiliência Modo Avião / Offline-First):** Ativar `context.setOffline(true)` no Playwright, criar 2 agendamentos e concluir 1 atendimento no caixa, recarregar a página ainda offline (comprovando que o PWA abre e mantém os dados), ativar `context.setOffline(false)` e comprovar que a fila sincroniza `100%` com o backend.
