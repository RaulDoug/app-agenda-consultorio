# Roadmap de Desenvolvimento TDD — Backend
## OdontoFlow — API Express.js, Persistência SQL Puro (`pg`), Filas BullMQ e Webhooks

---

### 1. Diretriz Metodológica do Backend (Spec-Driven & TDD)

O desenvolvimento do `backend/` segue estritamente o ciclo **Red-Green-Refactor** ancorado pela skill `onp-spec-driven`:

1. **Todo critério de aceite nasce como um teste que falha (`@spec:AC-xxx`).**
2. **Testes Padrão (Happy Path) + Testes de Borda (Edge Cases) são criados antes da implementação.**
3. **Execução rápida:** Testes unitários e de integração em memória (`Vitest` + `pg-mem` + `Supertest` + `ioredis-mock`) devem rodar em menos de 3 segundos.

---

### 2. Sprints do Backend & Especificação de Testes

---

#### SPRINT BE-1: Domínio Core, Regras de Horário e Validações de Servidor
> **Objetivo:** Implementar as funções puras de domínio e regras de negócio no servidor antes do banco de dados.

##### 1.1 Testes Padrão (Happy Path) — `backend/src/domain/__tests__/schedule-domain.spec.ts`
* [x] **Soma de Duração de Múltiplos Procedimentos:** Validar cálculo exato de `end_time` a partir de `start_time` + lista de durações (ex: 30m + 45m = 75m).
* [x] **Normalização de WhatsApp Brasileiro:** Converter entradas como `(11) 99999-8888`, `+55 11 99999-8888`, `11999998888` para o formato canônico `5511999998888`.
* [x] **Validação de Expediente Flexível (`business_hours`):** Permitir horários estendidos customizados (ex: 08:00 às 21:00) e dias com ou sem intervalo de almoço (`break_start_time = null`).
* [x] **Algoritmo de Retorno Inteligente (Sugestão de 3 Horários Vagos):** Dado um horário ocupado, domingo ou feriado (`schedule_blocks`) daqui a 15/30/180 dias, retornar exatamente os **3 slots vagos mais próximos** dentro do expediente.
* [x] **Máquina de Estados do Agendamento:** Validar transições permitidas (`PENDING ➔ CONFIRMED`, `CONFIRMED ➔ RESCHEDULE_REQUESTED`, `CONFIRMED ➔ COMPLETED`, `PENDING ➔ NO_SHOW`).

##### 1.2 Testes de Edge Cases (Casos de Borda)
* [x] **Edge Case BE-1.1 (Encaixe / Horário Extraordinário):** Agendamento após o fim do expediente (ex: 19:30 quando fecha às 18:00) ou no almoço:
  * Sem flag `confirm_overtime`: deve retornar alerta `outside_business_hours: true` sem gravar.
  * Com flag `confirm_overtime: true`: deve permitir e marcar `is_overtime = true`.
* [x] **Edge Case BE-1.2 (Imutabilidade de Consulta Concluída):** Impedir qualquer transição de status caso o agendamento já esteja `COMPLETED` ou `CANCELLED`.
* [x] **Edge Case BE-1.3 (Procedimento Inválido):** Rejeitar procedimentos com duração `<= 0` ou preço negativo (`< 0`).
* [x] **Edge Case BE-1.4 (Fuso Horário UTC-3):** Garantir que agendamentos às 22:00 (`America/Sao_Paulo`) não mudem de data civil ao converter de/para UTC.

---

#### SPRINT BE-2: Repositórios SQL Puro (`pg`), Isolamento Multi-Tenant e Rotas Express
> **Objetivo:** Construir a camada de persistência em SQL puro e endpoints REST blindados contra vazamento entre clínicas.

##### 2.1 Testes Padrão (Happy Path) — `backend/src/routes/__tests__/api.spec.ts`
* [x] **Middleware JWT & Tenant Context:** Extrair `tenant_id` do token JWT e rejeitar requisições sem token com `401 Unauthorized`.
* [x] **Isolamento Multi-Tenant Estrito:**
  * Inserir pacientes, procedimentos e agendamentos no `Tenant A`.
  * Consultar todos os endpoints autenticado como `Tenant B` e confirmar retorno vazio `[]`.
* [x] **CRUD de Pacientes e Procedimentos (On-the-Fly):** Criar e buscar pacientes/procedimentos com queries parametrizadas (`$1, $2`).
* [x] **Criação Atômica de Agendamento (`BEGIN ... COMMIT`):** Inserir registro em `appointments` e múltiplos itens em `appointment_items` na mesma transação SQL.
* [x] **Endpoint de Sincronização Offline (`POST /api/sync/batch`):** Receber lote de operações criadas offline pelo PWA e aplicar com estratégia *Last-Write-Wins* por `updated_at`.

##### 2.2 Testes de Edge Cases
* [x] **Edge Case BE-2.1 (Double Booking / Concorrência):** Duas requisições tentando agendar no mesmo horário para o mesmo consultório (sem flag de encaixe) devem resultar em `409 Conflict` na segunda requisição.
* [x] **Edge Case BE-2.2 (Rollback em Falha Parcial):** Se a inserção de um item em `appointment_items` falhar, a transação deve executar `ROLLBACK` e nenhum registro órfão pode restar em `appointments`.
* [x] **Edge Case BE-2.3 (Soft Delete de Paciente):** Ao excluir um paciente (`DELETE /api/patients/:id`), o registro deve receber `is_active = false`, preservando intactos os agendamentos passados e transações financeiras.
* [x] **Edge Case BE-2.4 (Proteção contra SQL Injection):** Enviar `' OR '1'='1; DROP TABLE patients; --` no parâmetro de busca por nome e comprovar que a parametrização do `pg` trata como texto literal inofensivo.
* [x] **Edge Case BE-2.5 (Idempotência de Sincronização):** Enviar duas vezes o mesmo lote de sincronização offline com os mesmos UUIDs não deve duplicar agendamentos nem transações.

---

#### SPRINT BE-3: Motor WhatsApp Anti-Ban, Filas BullMQ e Webhook Evolution API
> **Objetivo:** Implementar o disparo cadenciado de confirmações e o processamento automático de respostas dos pacientes.

##### 3.1 Testes Padrão (Happy Path) — `backend/src/whatsapp/__tests__/whatsapp.spec.ts`
* [ ] **Parser Inteligente de Respostas do Paciente:**
  * Classificar como `CONFIRMED`: `"1"`, `"1."`, `"Sim"`, `"sim"`, `"confirmado"`, `"👍"`, `"ok"`.
  * Classificar como `RESCHEDULE_REQUESTED`: `"2"`, `"não posso"`, `"remarcar"`, `"cancelar"`, `"preciso trocar"`.
  * Classificar como `MESSAGE_RECEIVED`: textos livres, dúvidas (`"posso chegar 10 min depois?"`) ou metadados de áudio.
* [ ] **Gerador Spintax Anti-Ban:** Gerar variações dinâmicas de saudação e estrutura de frase garantindo que disparos consecutivos não tenham o mesmo texto exato.
* [ ] **Enfileiramento com Jitter Humanizado (BullMQ):** Ao disparar a rotina diária para 10 agendamentos de amanhã, verificar se cada job recebe um delay incremental randômico entre **20 e 50 segundos**.
* [ ] **Webhook de Resposta (`POST /api/webhooks/whatsapp`):** Receber payload da Evolution API, localizar o agendamento `PENDING` daquele telefone, atualizar o status no PostgreSQL e disparar evento de notificação para o dentista.

##### 3.2 Testes de Edge Cases
* [ ] **Edge Case BE-3.1 (Queda de Sessão do WhatsApp `CONNECTION_LOST`):** Ao receber webhook de desconexão da Evolution API, atualizar `tenants.whatsapp_connected = false` e **pausar imediatamente a fila BullMQ** para não perder mensagens.
* [ ] **Edge Case BE-3.2 (Mensagem de Número Desconhecido):** Se um número não cadastrado mandar mensagem no WhatsApp do dentista, o webhook deve retornar `200 OK` silenciosamente sem gerar erro.
* [ ] **Edge Case BE-3.3 (Paciente Muda de Ideia):** Paciente responde `"1"` de manhã (status vira `CONFIRMED`) e à tarde responde `"2"` (deve permitir atualizar para `RESCHEDULE_REQUESTED` e notificar o dentista).
* [ ] **Edge Case BE-3.4 (Retry Automático com Backoff):** Se a Evolution API retornar erro `502/503` no momento do envio, o Worker do BullMQ deve agendar nova tentativa sem duplicar envios que já tiveram sucesso.

---

#### SPRINT BE-4: Motor Financeiro, Rateio de Descontos e Parcelamento
> **Objetivo:** Garantir precisão contábil absoluta em centavos inteiros para o caixa, descontos e contas a receber.

##### 4.1 Testes Padrão (Happy Path) — `backend/src/financial/__tests__/financial.spec.ts`
* [ ] **Conclusão de Consulta com Edição Individual e Desconto Global:**
  * Permitir edição direta do valor de cada procedimento realizado.
  * Quando informado um desconto no valor total, ratear proporcionalmente entre os itens em centavos inteiros.
* [ ] **Geração de Parcelas com Entrada Diferenciada:**
  * Exemplo: Total R$ 1.500 (`150000` centavos) com Entrada de R$ 300 hoje (`PAID`) + 3x de R$ 400 (`PENDING`).
  * Validar criação das 4 linhas em `financial_transactions` vinculadas ao `appointment_id`.
* [ ] **Data Customizável da 1ª Parcela e Projeção Mensal:**
  * Dada uma data-base escolhida pelo dentista para a 1ª parcela (ex: `15/11/2026`), calcular automaticamente as parcelas seguintes (`15/12/2026`, `15/01/2027`).
* [ ] **Registro de Despesas Rápidas:** Inserir saídas (`EXPENSE`) com valor, categoria e data.

##### 4.2 Testes de Edge Cases
* [ ] **Edge Case BE-4.1 (O Teste do Centavo / Dízima Periódica):**
  * 3 procedimentos de R$ 100 (`10000` centavos cada = `30000` total) com desconto para R$ 200 (`20000` total).
  * O rateio deve gerar `6667`, `6667` e `6666` centavos, garantindo que a soma feche **exatamente em `20000` centavos** sem perder nem criar 1 centavo.
* [ ] **Edge Case BE-4.2 (Virada de Mês em Dias 29, 30 e 31):** Se a 1ª parcela for em `31/01/2027`, a 2ª parcela deve ser ajustada automaticamente para o último dia válido de fevereiro (`28/02/2027`), sem gerar data inválida.
* [ ] **Edge Case BE-4.3 (Quitação Antecipada de Múltiplas Parcelas):** Endpoint para dar baixa em 2 ou mais parcelas pendentes simultaneamente com atualização de `payment_date`.
* [ ] **Edge Case BE-4.4 (Entrada Maior que o Total):** Rejeitar com `400 Bad Request` caso o valor de entrada seja maior ou igual ao total em uma cobrança marcada como parcelada.

---

#### SPRINT BE-5: Queries Analíticas e Relatórios Gerenciais em SQL
> **Objetivo:** Fornecer os indicadores de negócio com queries SQL otimizadas.

##### 5.1 Testes Padrão (Happy Path) — `backend/src/analytics/__tests__/analytics.spec.ts`
* [ ] **Taxa de No-Show:** Calcular percentual exato de agendamentos `NO_SHOW` sobre o total de agendamentos do período e soma do valor estimado perdido.
* [ ] **DRE Simplificado e Projeção de Caixa:** Retornar `total_income_paid_cents`, `total_expense_paid_cents`, `net_profit_cents` e `pending_receivables_cents` (próximos 30/60/90 dias).
* [ ] **Ranking de Lucratividade por Procedimento:** Query `GROUP BY procedure_id` somando `effective_price_cents` apenas de consultas `COMPLETED`.
* [ ] **Lista de Pacientes Inativos (> 6 meses):** Query retornando pacientes ativos cujo `MAX(start_time)` de consulta concluída seja anterior a 180 dias e que não possuam agendamento futuro.

##### 5.2 Testes de Edge Cases
* [ ] **Edge Case BE-5.1 (Divisão por Zero em Clínica Nova):** Quando o consultório possui 0 agendamentos ou 0 transações no período, todas as métricas devem retornar `0` de forma limpa, sem `NaN`, `null` inesperado ou erro SQL de divisão por zero.
