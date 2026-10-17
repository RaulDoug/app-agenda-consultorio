# Histórico de Alinhamento e Discovery de Produto (PO Chat Log)
## Projeto: OdontoFlow — Monorepo

> **Documento de Memória de Contexto:** Este arquivo registra todas as discussões, decisões de negócio, requisitos levantados e justificativas técnicas da sessão de Discovery e Concepção realizada entre os Product Owners. Qualquer modelo de IA que iniciar uma nova conversa neste repositório pode ler este documento para obter 100% do contexto histórico sem perda de informação.

---

### 1. Resumo Executivo da Demanda Inicial
* **Objetivo:** Sistema de controle de agenda de clientes para consultório odontológico particular, com arquitetura preparada para virar SaaS (múltiplas clínicas) no futuro.
* **Operador Principal:** O próprio **cirurgião-dentista solo** (sem recepcionista dedicada).
* **Foco do MVP:**
  1. Agendamento ágil de consultas e controle visual da grade.
  2. Motor de confirmações automáticas humanizadas via WhatsApp (sem custo por mensagem e anti-bloqueio).
  3. Gestão financeira simplificada ("Caixa de Bolso") com suporte a parcelamentos e contas a receber.
  4. Métricas e relatórios gerenciais (Taxa de No-Show, DRE simples, lucratividade por procedimento e pacientes inativos).
  5. Modo **Offline-First (PWA)** para resiliência em salas sem Wi-Fi/4G.
* **Fora de Escopo do MVP:** Prontuário odontológico complexo, odontograma 3D, emissão de NFS-e e link público de autoagendamento.

---

### 2. Principais Decisões de Produto & Justificativas de Negócio

| Decisão Tomada | Opção Escolhida | Justificativa / Trade-off |
| :--- | :--- | :--- |
| **Link Público de Agendamento** | **Rejeitado no MVP** | Em serviços de saúde particulares com ticket mais alto, o atendimento humanizado e personalizado no WhatsApp converte mais; autoagendamento gera fricção e desistência. |
| **Duração das Consultas** | **Dinâmica por Procedimento** | Cada procedimento tem sua duração (ex: Limpeza 45m, Canal 90m). Múltiplos procedimentos no mesmo horário somam a duração automaticamente. |
| **Cadastro On-The-Fly** | **Aprovado (< 10 segundos)** | Pacientes e procedimentos podem ser criados inline direto dentro da gaveta de agendamento sem interromper o fluxo. |
| **Rateio de Descontos** | **Proporcional em Centavos** | O dentista pode alterar o valor de cada item ou dar desconto no total; o sistema rateia o desconto proporcionalmente entre os itens sem quebrar a métrica de lucratividade individual. |
| **Parcelamento & Entrada** | **Entrada + Projeção Mensal** | Permite entrada com valor diferente das parcelas (ex: R$ 300 hoje + 3x de R$ 400). A data da 1ª parcela é customizável e projeta as demais para +30 e +60 dias. |
| **Horários e Encaixes** | **Expediente Livre + Soft Warning** | Horário de funcionamento flexível (ex: 08h às 21h). Se o dentista marcar fora do expediente, o app não trava: exibe aviso de *"⚡ Encaixe Extraordinário"* e salva após confirmação. |
| **Retorno Inteligente** | **Atalhos + Sugestão de 3 Vagos** | Atalhos ("Em 15 dias", "Em 30 dias"). Se o horário exato estiver ocupado ou fora do expediente, sugere instantaneamente as 3 alternativas vagas mais próximas. |
| **Motor WhatsApp** | **Evolution API (QR Code)** | Utiliza o próprio número do dentista sem taxas da Meta. Fila no BullMQ/Redis com intervalo randômico de 20s a 50s (*jitter*) e Spintax para evitar bloqueios. |
| **Armazenamento Offline** | **IndexedDB (Dexie.js) Local-First** | Leitura/escrita instantânea (< 5ms) no celular com fila de sincronização em segundo plano (`sync_outbox`). Volume de dados anual levíssimo (~2,5 MB). |
| **Segurança & Soft Delete** | **Soft Delete Obrigatório (`is_active` + `deleted_at`)** | Entidades críticas (`patients`, `procedures`, `appointments`, `financial_transactions`, `schedule_blocks`) nunca sofrem hard delete (`DELETE FROM`). Preserva integridade referencial, rastreabilidade clínica e conformidade contábil. |

---

### 3. Stack Técnica & Arquitetura Definida

* **Estrutura de Código:** **Monorepo TypeScript** com NPM Workspaces:
  * `shared/` (`@odontoflow/shared`): Interfaces, contratos e tipos compartilhados.
  * `backend/`: Node.js (v20+), Express.js, PostgreSQL (`pg` com SQL puro parametrizado), Redis 7 e BullMQ.
  * `frontend/`: React 18+, TypeScript, Vite, Tailwind CSS, PWA e Dexie.js (IndexedDB).
* **Hospedagem & Infraestrutura:** VPS Hostinger KVM 1 (Ubuntu 24.04, 4 GB RAM) rodando Docker Compose (Postgres, Redis, API, Worker, Evolution API) com **Nginx** servindo o PWA e o Site Vitrine do consultório por Virtual Hosts gastando apenas ~1.06 GB de RAM.
* **Metodologia de Desenvolvimento:** **TDD & Spec-Driven** obrigatório, regido pela skill nativa **`onp-spec-driven`** (localizada em `.agents/skills/onp-spec-driven/`).

---

### 4. Estrutura de Documentação do Repositório

Toda a documentação gerada e validada nesta sessão está disponível em:
* `docs/README.md` — Índice geral.
* `docs/01_PRD_Geral_OdontoFlow.md` — PRD completo de negócio e diagrama ER.
* `docs/backend/Arquitetura_Backend.md` — Arquitetura de servidor e SQL DDL das 8 tabelas.
* `docs/backend/Roadmap_TDD_Backend.md` — Sprints BE-1 a BE-5 e suítes de teste TDD do Backend.
* `docs/frontend/Arquitetura_e_UX_Frontend.md` — Arquitetura Local-First e 5 Wireframes Mobile.
* `docs/frontend/Roadmap_TDD_Frontend.md` — Sprints FE-1 a FE-4 e suítes de teste TDD do Frontend.

---

### 5. Alinhamentos Contínuos de Sprint (PO Refinamento)

#### Sprint BE-3 — Motor WhatsApp, Filas BullMQ e Webhooks
* **Janela Permitida para Disparos Automáticos:** Restrita estritamente ao horário comercial (**08:00 às 20:00**, fuso de São Paulo).
* **Salvaguarda Temporal de Antecedência:** Confirmações automáticas **NUNCA** devem ser disparadas no próprio dia da consulta (apenas 24h a 48h antes).
* **Mensagens de Áudio ou Mídia do Paciente:** Classificadas como `MESSAGE_RECEIVED` (notifica no painel para escuta manual da equipe), arquitetadas com hook extensível (`registerMediaResponseHook`) para permitir resposta automática no futuro sem refatoração.
* **Comportamento em Queda de Conexão WhatsApp (`CONNECTION_LOST`):**
  * Ao cair a conexão, a fila BullMQ é pausada imediatamente.
  * Ao reconectar (`CONNECTION_ESTABLISHED`), a fila despausa e retoma **automaticamente apenas se** os disparos pendentes ainda estiverem dentro da janela permitida (08:00 - 20:00) e antes do dia da consulta.
  * Se a queda ultrapassar a janela comercial ou virar o dia da consulta, os jobs defasados são abortados e um aviso de atenção é emitido para o dentista.
* **Pacientes Sem Resposta à Confirmação:** O status permanece `PENDING` e a consulta recebe um indicador visual de alerta *"Não respondeu"* no painel da clínica para acompanhamento ativo.

#### Refinamentos Aprovados de Sprints Anteriores (BE-1 e BE-2)
* **Sugestão de Retorno Inteligente (BE-1):** Quando a data de retorno cair em domingo ou feriado fechado, o algoritmo deve pesquisar e sugerir opções vagas tanto do **último dia útil anterior** quanto do **próximo dia útil posterior**, dando mais flexibilidade de escolha ao profissional.
* **Soft Delete de Paciente com Consultas Futuras (BE-2):** Se um paciente com consultas futuras agendadas for excluído, o sistema deve **alertar o operador** com aviso visual no modal/endpoint, oferecendo a opção de cancelar as consultas futuras para liberar a vaga na grade ou manter ambos os registros intactos.

