# OdontoFlow / CliniAssist — Catálogo Canônico de Funcionalidades e Regras de Negócio

> **Documento:** `docs/features.md`  
> **Status:** Canônico / Ativo  
> **Versão:** 1.0.0  
> **Público-alvo:** Desenvolvedores, Engenheiros de QA, Arquitetos de Software e Agentes Autônomos de IA.  
> **Finalidade:** Servir como especificação de referência exaustiva para cada funcionalidade do sistema, descrevendo seu propósito, funcionamento arquitetural e comportamental, casos de uso reais e cobertura completa de edge cases.

---

## 1. Visão Geral da Solução e Arquitetura Base

O **OdontoFlow (CliniAssist)** é um sistema de gestão clínica e financeira desenhado especificamente para **consultórios odontológicos particulares solo**, onde o próprio cirurgião-dentista gerencia agendamentos, atendimento e finanças em pausas curtas de 3 a 5 minutos pelo smartphone.

### 1.1 Pilares Arquiteturais Inegociáveis
1. **Paradigma Local-First & PWA Offline por Padrão:** O aplicativo client-side opera sobre o IndexedDB via Dexie.js (`localDb`). Toda leitura e escrita em tempo de execução é instantânea (< 100ms), sem bloquear a interface do usuário dependendo de requisições de rede. O Service Worker (`frontend/public/sw.js`) garante que a aplicação carregue e recarregue mesmo sem nenhuma conectividade de internet.
2. **Sincronização Assíncrona Bidirecional (`sync_outbox`):** Operações realizadas offline são enfileiradas e persistidas atomicamente em lotes (`POST /api/sync/batch`), com resolução de concorrência por *Last-Write-Wins* (LWW) baseada em timestamps UTC e identificadores canônicos UUID v4.
3. **Backend em 4 Camadas com SQL Puro:** A API Node.js/Express estrutura-se estritamente em **Rotas ➔ Controllers ➔ Services ➔ Repositories**. Não utiliza ORMs pesados; todas as consultas utilizam PostgreSQL com a biblioteca `pg`, queries parametrizadas e isolamento obrigatório por `tenant_id`.
4. **Soft-Delete Global:** Nenhuma entidade de negócio (pacientes, procedimentos, agendamentos, transações financeiras, bloqueios) é excluída fisicamente do banco de dados (`DELETE FROM`). A desativação é estritamente lógica via `is_active = false, deleted_at = CURRENT_TIMESTAMP`.
5. **Automação WhatsApp Anti-Ban:** Integração com Evolution API (Baileys) via fila assíncrona BullMQ/Redis. Conta com janelas comerciais (08:00 às 20:00), jitter randômico (20s a 50s), Spintax estocástico, limite diário de réplicas e webhooks para recepção inteligente de respostas.
6. **Métricas Financeiras em Regime de Caixa:** Todas as receitas e despesas são computadas a partir da data de efetiva liquidação (`payment_date`), com controle de contas a receber e a pagar por data de vencimento (`due_date`), e valores representados como inteiros em centavos (`cents`) para eliminar imprecisões de ponto flutuante.

---

## Módulo 1: Fundação, Segurança e Acesso Multi-Tenant

---

### F-01: Autenticação, Identidade e Sessões Multi-Tenant

#### 1. O que faz
Gerencia o acesso ao sistema através de credenciais criptografadas (e-mail e senha), emissão de tokens JWT assinados, controle de versões de token (`token_version`) e ciclo de vida de senhas temporárias com obrigatoriedade de troca.

#### 2. Como deve funcionar
- **Criação de Contas:** Centralizada via CLI administrativa (`npm run create-user`), evitando auto-cadastro público descontrolado.
- **Criptografia:** Senhas são salgadas e codificadas via Bcrypt com fator de custo (*salt rounds*) fixado em 10.
- **Primeiro Acesso:** Usuários criados com senha temporária recebem a flag `must_change_password = true`. Enquanto esta flag for verdadeira, qualquer requisição para endpoints operacionais do sistema é bloqueada com `HTTP 403 Forbidden` (`PASSWORD_CHANGE_REQUIRED`), permitindo acesso exclusivo ao endpoint `POST /api/auth/change-password`.
- **Invalidação Instantânea de Sessões:** Ao trocar a senha, o campo `token_version` do consultório é incrementado no banco. O middleware de autenticação (`authMiddleware`) compara a versão gravada no payload do JWT com o estado atual da tabela `tenants`. Qualquer token emitido anteriormente é rejeitado com `HTTP 401 Unauthorized`.
- **Sessão Local e Limpeza:** O token JWT e o perfil do consultório são armazenados no `localStorage`. Ao acionar o logout, o frontend executa a limpeza completa do `localStorage` e limpa as tabelas locais do Dexie.js para evitar que dados sensíveis permaneçam acessíveis no dispositivo.

#### 3. Casos de Uso Principais
- **UC01-1 (Primeiro Acesso):** O dentista recebe as credenciais temporárias criadas pelo suporte, acessa a tela de login, insere o e-mail e senha temporária e é redirecionado compulsoriamente para a tela de definição de nova senha pessoal.
- **UC01-2 (Login Diário):** O profissional acessa a URL do aplicativo, informa suas credenciais salvas e entra diretamente na tela da Agenda com seu perfil autenticado.
- **UC01-3 (Troca Voluntária de Senha):** O dentista acessa as Configurações do App, clica em "Alterar Senha", informa a senha atual e define uma nova senha que atenda às políticas de complexidade (mínimo de 8 caracteres, contendo maiúsculas, minúsculas, números e caracteres especiais).

#### 4. Edge Cases e Salvaguardas
- **Tentativa de contorno de troca de senha:** Caso um usuário tente disparar requisições diretamente para rotas como `/api/appointments` antes de alterar a senha temporária, o backend intercepta e aborta a requisição com status 403.
- **Token expirado durante uso offline:** Quando o aplicativo volta a ficar online e a fila de sincronização dispara um push recebendo `HTTP 401`, o `SyncManager` aciona o callback `onUnauthorized`, limpando as credenciais locais e conduzindo o usuário suavemente à tela de login sem perda das alterações pendentes no IndexedDB.
- **Concorrência entre múltiplos dispositivos:** Se a senha for alterada no computador do consultório, a sessão ativa no smartphone do dentista é automaticamente invalidada na próxima sincronização devido à divergência de `token_version`.

---

### F-02: Soft-Delete Inegociável e Integridade Histórica

#### 1. O que faz
Garante que nenhum registro operacional ou clínico seja expurgado fisicamente do banco de dados relacional, mantendo a integridade contábil, prontuários clínicos e rastreabilidade jurídica.

#### 2. Como deve funcionar
- **Campos de Controle:** Todas as tabelas de negócio (`tenants`, `patients`, `procedures`, `appointments`, `appointment_items`, `financial_transactions`, `schedule_blocks`) possuem as colunas:
  - `is_active BOOLEAN DEFAULT TRUE`
  - `deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL`
  - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
- **Operação de Exclusão:** Em vez de `DELETE FROM <table>`, os repositórios executam:
  ```sql
  UPDATE <table> 
  SET is_active = false, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
  WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL;
  ```
- **Consultas Normais:** Todas as queries de busca, listagem e verificação incluem a cláusula `AND deleted_at IS NULL`.
- **Preservação de Vínculos:** Pacientes ou procedimentos inativados continuam vinculados aos seus atendimentos e transações financeiras passadas. Relatórios históricos de faturamento e produtividade continuam íntegros.

#### 3. Casos de Uso Principais
- **UC02-1 (Inativação de Paciente):** Um paciente solicita cancelamento do cadastro ou muda de cidade. O dentista clica em "Excluir" no card do paciente; o sistema desativa o registro, mas mantém intactos seus atendimentos passados de anos anteriores no Extrato e no DRE.
- **UC02-2 (Descontinuação de Procedimento):** O consultório deixa de realizar um tratamento específico (ex: "Clareamento a Laser Antigo"). O procedimento é desativado do catálogo, sumindo das opções para novas consultas, sem afetar o histórico das consultas já realizadas.

#### 4. Edge Cases e Salvaguardas
- **Tentativa de exclusão de receita com atendimento ativo (Regra D-06):** O sistema impede que uma transação de receita atrelada a uma consulta concluída (`COMPLETED`) seja excluída individualmente via extrato. O endpoint recusa com `HTTP 400` (`LINKED_COMPLETED_APPOINTMENT`). Para estornar a receita, a consulta inteira deve ser cancelada.
- **Reativação ou recadastro com mesmo identificador:** Se um paciente desativado anteriormente tentar ser inserido novamente com o mesmo UUID, o sistema lida com o conflito mantendo a integridade ou permitindo restauração sem colisão de chaves.

---

### F-03: Arquitetura Local-First e Shell Offline via Service Worker

#### 1. O que faz
Permite que o profissional de saúde execute 100% das rotinas operacionais (consultar agenda, criar pacientes, agendar consultas, lançar despesas e finalizar atendimentos) mesmo quando não houver qualquer sinal de internet.

#### 2. Como deve funcionar
- **Banco de Dados no Cliente:** Utiliza Dexie.js como camada de abstração do IndexedDB (`localDb`), contendo tabelas espelho de pacientes, agendamentos, procedimentos, configurações e transações financeiras.
- **Service Worker (`public/sw.js`):** Intercepta todas as requisições de navegação do browser (`request.mode === 'navigate'`). Caso a conexão caia ou falhe, o Service Worker devolve a casca da aplicação (`/index.html`) armazenada em cache, permitindo recarregar a tela (F5) no modo avião.
- **Reatividade da Interface:** Telas e componentes consomem dados locais através do hook `useLiveQuery` do Dexie. Qualquer mutação no banco local reflete na interface em tempo real (< 16ms), sem estados de carregamento lentos.
- **Isolamento de Segurança no Logout:** Ao efetuar logout, o banco local IndexedDB é completamente truncado (`localDb.patients.clear()`, etc.) para garantir que um novo usuário no mesmo dispositivo não tenha acesso a dados em cache do consultório anterior.

#### 3. Casos de Uso Principais
- **UC03-1 (Atendimento em Sala Sem Sinal):** O consultório fica localizado no subsolo ou em sala isolada acusticamente onde o 4G/Wi-Fi oscila. O dentista atende o paciente, consulta a ficha, realiza o checkout e agenda o retorno sem notar qualquer atraso.
- **UC03-2 (Recarregamento Offline):** O dentista sem internet fecha a aba do navegador por engano no smartphone e reabre o PWA; a aplicação carrega instantaneamente exibindo a agenda do dia sem mostrar tela de erro do Chrome/Safari.

#### 4. Edge Cases e Salvaguardas
- **Cota de Armazenamento Excedida:** O IndexedDB é configurado para manter os dados essenciais (últimos 90 dias e consultas futuras), evitando atingir os limites de armazenamento do navegador.
- **Navegador sem Suporte a Service Worker:** Caso o ambiente seja legado ou execute em modo anônimo restritivo, o sistema continua operando em memória sem quebrar a execução dos fluxos.

---

### F-04: Sincronização Bidirecional (`sync_outbox`, Batch Push e Pull)

#### 1. O que faz
Transmite de forma assíncrona todas as alterações realizadas localmente para o servidor central e reconcilia dados criados remotamente (como confirmações automáticas do WhatsApp) para o banco local do dispositivo.

#### 2. Como deve funcionar
- **Fila `sync_outbox`:** Toda operação de criação, edição ou exclusão lógica insere um registro na tabela local `sync_outbox` contendo:
  - `client_mutation_id`: UUID único da operação.
  - `entity`: Nome da tabela (`appointments`, `patients`, `financial_transactions`, `procedures`).
  - `record_id`: UUID do registro afetado.
  - `operation`: `'INSERT' | 'UPDATE' | 'DELETE'`.
  - `payload`: Dados serializados em JSON.
  - `created_at`: Timestamp local.
- **Rotina de Push (`POST /api/sync/batch`):** O `SyncManager` monitora o status online do dispositivo e o evento `navigator.onLine`. Quando online, envia o lote de mutações pendentes. O backend processa em transação atômica do PostgreSQL. Ao receber confirmação de sucesso, o cliente remove as mutações enviadas da fila `sync_outbox`.
- **Rotina de Pull (`GET /api/sync/pull`):** Periodicamente e logo após o login, o cliente requisita dados atualizados desde o último timestamp registrado (`last_pulled_at`), atualizando o banco local.
- **Resolução de Conflitos Last-Write-Wins (LWW):** Se um registro for modificado no cliente e no servidor, o registro que possuir o timestamp `updated_at` mais recente prevalece.

#### 3. Casos de Uso Principais
- **UC04-1 (Sincronização em Massa pós-Retomada de Rede):** O dentista marcou 4 consultas e lançou 2 despesas enquanto estava sem rede. Ao se conectar ao Wi-Fi, a barra superior exibe brevemente o ícone de sincronização e todos os dados são gravados no banco PostgreSQL em menos de 2 segundos.
- **UC04-2 (Restauração Completa de Dados pós-Login):** O dentista troca de smartphone e faz login no novo aparelho; a rotina de pull é disparada automaticamente, restaurando todo o catálogo de pacientes, agenda e Livro Caixa.

#### 4. Edge Cases e Salvaguardas
- **Falha de Rede no Meio do Batch:** Se a rede cair durante o envio do lote, a transação no backend é abortada e a fila local mantém as mutações intactas para tentar novamente no próximo ciclo com backoff exponencial.
- **Idempotência por UUID v4:** Se o servidor receber uma mutação com o mesmo UUID v4 duas vezes (por reenvio de rede), o `ON CONFLICT (id) DO UPDATE` garante que não ocorram duplicações de registros.

---

## Módulo 2: Cadastros Base e Configurações da Clínica

---

### F-05: Gestão de Clientes e Pacientes

#### 1. O que faz
Centraliza os dados cadastrais dos pacientes atendidos pelo consultório, permitindo cadastros rápidos, busca instantânea por nome ou telefone, registro de observações/alergias e higienização automática do número de WhatsApp.

#### 2. Como deve funcionar
- **Campos do Paciente:** `id` (UUID), `name` (string obrigatória), `whatsapp` (string higienizada), `notes` (texto livre opcional para prontuário/anamnese), `is_active` e `deleted_at`.
- **Normalização Telefônica:** O sistema remove automaticamente caracteres especiais, parênteses e traços. No frontend, exibe no formato visual legível `(DD) 9XXXX-XXXX`. No backend, armazena apenas dígitos.
- **Unicidade de WhatsApp por Consultório:** O sistema valida a unicidade do telefone entre pacientes ativos (`deleted_at IS NULL`) do mesmo `tenant_id`. Se o usuário tentar cadastrar ou atualizar um paciente com telefone já utilizado, o sistema rejeita com `HTTP 409 Conflict`, retornando o nome do paciente já vinculado àquele número.
- **Busca Textual Reativa:** A busca por pacientes no frontend filtra instantaneamente via `useLiveQuery` por nome ou número de telefone à medida que o usuário digita (`ILIKE %search%` no backend).

#### 3. Casos de Uso Principais
- **UC05-1 (Cadastro Tradicional):** O dentista clica na aba "Clientes", toca no botão "+ Novo Paciente", preenche Nome, WhatsApp e Observações de alergia ("Alérgico a Dipirona") e salva.
- **UC05-2 (Busca Rápida de Histórico):** O dentista precisa ligar para uma paciente chamada "Beatriz"; digita "Bea" na barra de busca e a lista filtra imediatamente, exibindo o cartão com link direto para WhatsApp e histórico de consultas.

#### 4. Edge Cases e Salvaguardas
- **Diferenciação DDI 55 vs Nacional:** Pacientes cadastrados no Brasil com ou sem o código do país `55` são normalizados internamente para evitar que o mesmo número apareça duplicado.
- **Exclusão Segura com Alerta de Histórico:** A exclusão de um paciente aciona o `ConfirmDeletePatientModal`, alertando expressamente que o paciente será removido da lista ativa, mas seu histórico clínico e transações financeiras passadas permanecerão intactos para auditoria e relatórios.

---

### F-06: Catálogo de Procedimentos e Serviços

#### 1. O que faz
Mantém a tabela de serviços prestados pelo consultório odontológico, associando duração média estimada em minutos, valor de tabela cobrado do paciente e custo de insumos operacionais.

#### 2. Como deve funcionar
- **Campos do Procedimento:** `id` (UUID), `name` (string não vazia), `default_duration_minutes` (inteiro > 0), `default_price_cents` (inteiro >= 0), `cost_cents` (inteiro >= 0, default 0), `is_active` e `deleted_at`.
- **Preço de Tabela vs. Custo Operacional:**
  - `default_price_cents`: Valor padrão sugerido na hora do agendamento e checkout. Permite o valor `0` para procedimentos de cortesia, avaliação gratuita ou revisão preventiva.
  - `cost_cents`: Custo estimado com materiais (resinas, anestésicos, brocas, moldeiras) ou honorários de laboratório de prótese, alimentando a análise de lucratividade e margem clínica.
- **Soft-Delete Seguro:** A desativação de um procedimento não apaga os registros da tabela `appointment_items` de consultas antigas, preservando o valor e o nome do procedimento histórico.

#### 3. Casos de Uso Principais
- **UC06-1 (Configuração da Tabela de Preços):** O dentista cadastra procedimentos comuns do dia a dia: "Restauração em Resina" (Duração: 45 min, Preço: R$ 180,00, Custo: R$ 35,00) e "Profilaxia e Limpeza" (Duração: 30 min, Preço: R$ 150,00, Custo: R$ 20,00).
- **UC06-2 (Procedimento de Avaliação Gratuita):** Cadastra "Consulta Inicial / Avaliação" com duração de 30 minutos e preço de R$ 0,00.

#### 4. Edge Cases e Salvaguardas
- **Tentativa de cadastrar duração zerada ou negativa:** O backend valida estritamente e devolve `HTTP 400 Bad Request` caso a duração seja menor ou igual a zero.
- **Procedimento excluído presente em consulta futura:** Caso um procedimento seja inativado, ele não aparece mais na lista de novos agendamentos, mas as consultas futuras já criadas com ele permanecem agendadas normalmente com a duração e valores calculados no momento da criação.

---

### F-07: Horários de Atendimento (Expediente Comercial)

#### 1. O que faz
Configura o expediente semanal do consultório para cada um dos 7 dias da semana (de Domingo = 0 a Sábado = 6), estabelecendo os horários de início e término de atendimento, intervalo de almoço e indicação de dia aberto ou fechado.

#### 2. Como deve funcionar
- **Estrutura da Tabela `business_hours`:**
  - `day_of_week`: Inteiro de 0 a 6.
  - `is_open`: Booleano indicando se o consultório funciona no dia.
  - `start_time` e `end_time`: Strings no formato `HH:mm`.
  - `break_start_time` e `break_end_time`: Strings no formato `HH:mm` para o intervalo de almoço.
- **Sem Rota de Exclusão (Regra Mandatória):** A tabela `business_hours` **NÃO possui rota de exclusão** (nem física nem lógica). O consultório apenas atualiza os registros via `PUT /api/business-hours`. Se o consultório não atende em determinado dia (ex: Domingo), o campo `is_open` é marcado como `false`.
- **Validações Temporais:**
  - `end_time` deve ser estritamente posterior a `start_time`.
  - Se houver intervalo de almoço, `break_end_time` deve ser posterior a `break_start_time`, e o intervalo deve estar contido entre o início e o término do expediente.
- **Fallback Padrão de Fábrica:** Se o consultório for recém-criado e não tiver horários cadastrados, o sistema aplica o padrão: Segunda a Sexta das 08:00 às 18:00 com almoço das 12:00 às 13:30; Sábados e Domingos fechados.

#### 3. Casos de Uso Principais
- **UC07-1 (Expediente Contínuo sem Almoço):** O dentista prefere atender direto das 07:30 às 16:00 sem parar para almoço. Ele configura os dias da semana desativando os campos de pausa de almoço.
- **UC07-2 (Abertura aos Sábados):** O consultório passa a atender nas manhãs de sábado; o dentista marca o sábado como `is_open = true`, das 08:00 às 12:00.

#### 4. Edge Cases e Salvaguardas
- **Configuração com Horário Inválido:** Tentativas de salvar término anterior ao início (ex: Início 18:00 e Término 08:00) retornam erro de validação `HTTP 400`.
- **Almoço ultrapassando o término do expediente:** O backend valida rigorosamente as fronteiras de horário e impede salvar horários incoerentes.

---

### F-08: Bloqueios Temporais de Agenda (`schedule_blocks`)

#### 1. O que faz
Permite interditar intervalos de tempo específicos na grade horária do consultório para cobrir compromissos pessoais, congressos científicos, reformas na clínica, férias ou feriados, impedindo agendamentos convencionais.

#### 2. Como deve funcionar
- **Campos do Bloqueio:** `id` (UUID), `title` (string descritiva), `start_time` e `end_time` (timestamps ISO 8601 em UTC), `is_active` e `deleted_at`.
- **Verificação de Sobreposição:** O método `checkBlockConflict` avalia se existe qualquer bloqueio ativo que intercepte o intervalo pretendido da consulta:
  ```sql
  WHERE (block.start_time < slot_end AND block.end_time > slot_start)
  ```
- **Alerta Estruturado:** Se houver sobreposição e a consulta não for um encaixe explicitamente autorizado, o backend retorna `HTTP 409 Conflict` informando o código `SCHEDULE_BLOCK` e o campo `block_title` com a descrição do bloqueio.
- **Soft-Delete:** Bloqueios excluídos sofrem soft-delete (`deleted_at = CURRENT_TIMESTAMP`), liberando o slot imediatamente para novas consultas.

#### 3. Casos de Uso Principais
- **UC08-1 (Congresso Odontológico):** O dentista viaja na quinta e sexta-feira para o Congresso de Odontologia; cria um bloqueio de 2 dias com o título "CIOSP - São Paulo".
- **UC08-2 (Manutenção do Compressor):** O técnico de manutenção fará revisão no consultório na terça-feira das 14:00 às 16:00; o dentista bloqueia a faixa com o título "Manutenção do Compressor de Ar".

#### 4. Edge Cases e Salvaguardas
- **Agendamento com Encaixe em Horário Bloqueado:** Se o profissional realmente precisar atender uma emergência crítica dentro de um horário bloqueado, ele pode autorizar o agendamento ativando `confirm_overtime: true`, que salva a consulta com a flag `is_overtime = true`.
- **Bloqueio com término anterior ao início:** Rejeitado imediatamente no controller com validação `HTTP 400 Bad Request`.

---

## Módulo 3: Agenda Clínica e Gestão Operacional de Consultas

---

### F-09: Grade Temporal Diária, Semanal e Mensal

#### 1. O que faz
Interface visual central da aplicação onde o dentista consulta sua jornada de atendimentos em blocos temporais de 30 minutos, navega entre períodos e acompanha o status de cada paciente através de códigos de cores semânticos.

#### 2. Como deve funcionar
- **Resolução da Grade:** Exibe slots contínuos no horário de atendimento cadastrado, permitindo visualizar com clareza horários livres, ocupados e intervalos de almoço.
- **Cabeçalho de Navegação Móvel (3 Níveis):**
  - **Nível 1 (Topo):** Botões de navegação rápida `<` e `>` ladeando o botão centralizador contextual (`Hoje` no modo Dia, `Esta semana` no modo Semana e `Este mês` no modo Mês).
  - **Nível 2 (Meio):** Título textual em destaque (ex: `"Ter., 27 de out. de 2026"`) acompanhado do contador de atendimentos ativos (ex: `"5 atendimentos"` ou `"Nenhum atendimento"`).
  - **Nível 3 (Abaixo):** Pílula de seleção de visão: `[ Dia ] [ Semana ] [ Mês ]`.
- **Identificação Visual por Cores:**
  - 🟢 **Verde:** `CONFIRMED` — Confirmado pelo paciente via WhatsApp.
  - 🟡 **Amarelo:** `PENDING` — Aguardando resposta ou envio de lembrete.
  - 🟠 **Laranja:** `RESCHEDULE_REQUESTED` — Paciente solicitou remarcação ou informou que não pode ir.
  - 🔵 **Azul:** `MESSAGE_RECEIVED` — Paciente enviou dúvida, áudio ou texto que requer intervenção humana.
  - ⚪ **Cinza:** `COMPLETED` — Atendimento finalizado e baixado.
  - 🔴 **Vermelho:** `NO_SHOW` — Paciente faltou à consulta.

#### 3. Casos de Uso Principais
- **UC09-1 (Conferência Matinal da Agenda):** Ao acordar, o dentista abre o PWA no celular e verifica visualmente que todos os 6 cards de atendimento do dia estão verdes (confirmados), sabendo que o dia está com 100% de ocupação confirmada.
- **UC09-2 (Visão Semanal de Ocupação):** O dentista toca na aba "Semana" para identificar quais tardes possuem horários livres para concentrar cirurgias longas.

#### 4. Edge Cases e Salvaguardas
- **Dias com Múltiplos Encaixes Extraordinários:** Se houver consultas sobrepostas ou fora do expediente regular, a grade expande verticalmente os slots necessários e renderiza os cards lado a lado com tags semânticas `Extra` sem quebrar o layout da tela.
- **Nenhum Atendimento Agendado:** Exibe uma ilustração agradável e orienta o dentista a tocar no botão "+ Novo Agendamento".

---

### F-10: Agendamento Rápido On-The-Fly (< 10 segundos)

#### 1. O que faz
Permite criar um agendamento completo em menos de 10 segundos diretamente pelo celular, com suporte à criação imediata de novos pacientes e procedimentos sem interromper o fluxo da tela.

#### 2. Como deve funcionar
- **Abertura da Gaveta (*QuickAppointmentDrawer*):** Acionada ao tocar em qualquer slot livre da grade ou no botão flutuante "+ Novo Agendamento".
- **Sugestão Inteligente de Horário Livre:** Se aberto pelo botão geral sem clique em slot, o sistema calcula dinamicamente o próximo horário vago do dia. Se a hora atual for posterior ao fim do expediente (ex: após as 18:00), avança a data automaticamente para o próximo dia útil às 08:00.
- **Criação de Paciente On-The-Fly:** Ao digitar o nome do paciente, se ele não existir no cadastro local, o sistema apresenta o botão "+ Criar paciente", abre o formulário inline solicitando apenas o WhatsApp e vincula o paciente na hora.
- **Múltiplos Procedimentos e Duração Agregada:** O dentista pode selecionar múltiplos procedimentos via chips interativos. O sistema soma a duração de cada um e define o horário de término previsto da consulta.

#### 3. Casos de Uso Principais
- **UC10-1 (Agendamento no Intervalo Clínico):** Em um intervalo de 2 minutos enquanto lava as mãos, o dentista abre o app, digita "Lucas", seleciona "Lucas Silva", clica no chip "Limpeza (30 min)", confirma o horário das 14:00 e salva. O agendamento surge instantaneamente na grade.
- **UC10-2 (Agendamento de Paciente Novo e Múltiplos Serviços):** Paciente liga pedindo avaliação e clareamento. O dentista digita "Fernanda Costa", clica em criar novo paciente, digita o WhatsApp, marca "Avaliação" (30 min) e "Clareamento" (60 min). O agendamento é reservado com duração total calculada de 90 minutos (1h30).

#### 4. Edge Cases e Salvaguardas
- **Fechamento Acidental do Modal:** Caso o usuário toque fora ou feche a gaveta antes de salvar, os dados são descartados de forma limpa, prevenindo agendamentos com estado inconsistente.
- **Duração Total Ultrapassando a Meia-Noite:** O sistema valida a data/hora de encerramento calculada e bloqueia consultas com datas de término inconsistentes.

---

### F-11: Atalho "+ Agendar" a partir do Paciente (`initialPatient`)

#### 1. O que faz
Permite iniciar o fluxo de criação de consulta a partir do card de detalhes do paciente ou da listagem de reativação de inativos, com pré-preenchimento automático de dados e notas clínicas.

#### 2. Como deve funcionar
- **Propagação de Estado:** Ao clicar no botão "+ Agendar" presente no card expandido de um paciente na aba "Clientes", a aplicação direciona para a Agenda e abre a gaveta `QuickAppointmentDrawer` com a propriedade `initialPatient` populada.
- **Exibição de Informações Críticas:** O nome, telefone e observações médicas (ex: "Hipertenso", "Prefere atendimento matutino") aparecem fixados no topo do formulário.
- **Botão "Trocar":** Um botão discreto ao lado do nome do paciente permite alternar ou desvincular o paciente caso o operador deseje agendar para outra pessoa.
- **Reset do Estado:** Ao fechar a gaveta ou ao criar consultas avulsas normais, a variável de estado `initialPatient` é reiniciada para `null`.

#### 3. Casos de Uso Principais
- **UC11-1 (Agendamento pós-Consulta ao Prontuário):** O dentista estava lendo as anotações clínicas da paciente "Juliana"; no próprio card dela, toca em "+ Agendar", escolhe o dia da semana seguinte e confirma em dois toques.
- **UC11-2 (Agendamento a partir da Lista de Inativos):** A secretária filtra os pacientes sumidos há mais de 6 meses no relatório, liga para o paciente e, ao conseguir marcar, toca no botão "+ Agendar" ao lado do nome para lançar a consulta sem precisar pesquisar o nome novamente.

#### 4. Edge Cases e Salvaguardas
- **Paciente Excluído no Momento do Atalho:** Se o paciente sofrer exclusão lógica em outra aba ou dispositivo antes de confirmar a consulta, o sistema valida a integridade referencial e alerta sobre a inativação do registro.

---

### F-12: Validação Tripla de Conflitos e Encaixes Extraordinários

#### 1. O que faz
Protege a grade horária contra agendamentos simultâneos acidentais e violações de horários de funcionamento, ao mesmo tempo em que oferece ao dentista a prerrogativa médica de realizar encaixes extraordinários conscientes.

#### 2. Como deve funcionar
- **Validação Tripla de Conflitos:** Ao tentar salvar um agendamento com `confirm_overtime: false`, o sistema valida:
  1. *Bloqueio de Agenda:* Conflito com feriados, congressos ou pausas (`SCHEDULE_BLOCK`).
  2. *Fora do Expediente:* Conflito com horários anteriores à abertura ou posteriores ao fechamento (`OUTSIDE_HOURS`).
  3. *Intervalo de Almoço:* Conflito com o período de pausa alimentar configurado (`BREAK_TIME`).
  4. *Double Booking:* Conflito de sobreposição com outro agendamento ativo (`DOUBLE_BOOKING`).
- **Resposta Estruturada HTTP 409:** O backend retorna um JSON detalhado com o código do conflito, mensagem amigável e dados contextuais (ex: título do bloqueio).
- **Mecanismo de Encaixe Extraordinário:** No frontend, o sistema não impede o agendamento; exibe um alerta destacado explicando o choque de horários e disponibiliza o checkbox de autorização: *"⚠️ Horário fora do expediente ou ocupado. Deseja confirmar como encaixe extraordinário?"*.
- **Persistência com Flag:** Ao marcar a autorização, a requisição é reenviada com `confirm_overtime: true` (ou `is_extra_fit: true`). O agendamento é salvo com `is_overtime = true` e exibe o badge "⚡ Encaixe" na grade.

#### 3. Casos de Uso Principais
- **UC12-1 (Bloqueio de Choque Acidental):** A secretária tenta marcar um paciente às 10:00, horário em que já existe uma cirurgia marcada. O modal bloqueia o envio imediato e aponta claramente: *"Já existe uma consulta agendada neste horário"*.
- **UC12-2 (Encaixe Consciente de Emergência):** Um paciente quebrou a prótese e precisa de reparo imediato. O dentista aceita atendê-lo às 12:30 (durante seu almoço), marca o checkbox de encaixe extraordinário e salva a consulta na grade com destaque de alerta.

#### 4. Edge Cases e Salvaguardas
- **Encaixes em Dias sem Expediente (Domingos):** Caso o dentista decida atender em um domingo extraordinariamente, o sistema permite o encaixe com o aviso de dia sem expediente regular.
- **Múltiplos Encaixes no Mesmo Slot:** Dois ou mais encaixes extraordinários no mesmo horário são aceitos e organizados visualmente lado a lado na interface sem colapso de componentes.

---

### F-13: Remarcação Segura de Consultas (`RescheduleModal`)

#### 1. O que faz
Permite alterar a data e o horário de atendimentos já agendados com verificação estrita de disponibilidade da nova data pretendida e tratamento de encaixes.

#### 2. Como deve funcionar
- **Acionamento:** Disponível na gaveta de detalhes da consulta (`AppointmentDetailsDrawer`) ou na Central de Fila de WhatsApp ao receber pedido de remarcação do paciente.
- **Checagens Preventivas:** O modal recalcula a disponibilidade do novo slot selecionado considerando:
  - Dia da semana (domingo ou dia fechado);
  - Horário fora do expediente comercial;
  - Intervalo de almoço;
  - Sobreposição com outras consultas ativas.
- **Autorização Explícita:** Se a nova data/hora colidir com qualquer uma das restrições, o botão de confirmação fica desabilitado até que o usuário marque explicitamente o checkbox de autorização de encaixe (`reschedule-allow-extra-fit-checkbox`).
- **Atualização da Fila:** Se o agendamento remarcado possuir lembrete pendente na fila do WhatsApp, a mensagem e o horário de disparo são automaticamente recalculados com base na nova data.

#### 3. Casos de Uso Principais
- **UC13-1 (Paciente Pede Nova Data):** O paciente liga avisando que teve um imprevisto e pede para mudar a consulta da terça-feira para a quinta-feira às 15:00. O dentista abre os detalhes da consulta, clica em "Remarcar", seleciona a nova data/hora e confirma.
- **UC13-2 (Remarcação a partir do WhatsApp):** O paciente respondeu "2" (Remarcar) no WhatsApp. Na Fila de Envios, o dentista clica no botão "Reagendar Consulta", o modal de remarcação abre pré-preenchido e a alteração é feita em segundos.

#### 4. Edge Cases e Salvaguardas
- **Tentativa de Remarcar Consulta Já Concluída:** Se uma consulta já estiver com status `COMPLETED`, o sistema bloqueia a ação de remarcação para manter a consistência do prontuário e histórico financeiro.
- **Remarcação para o Passado:** O seletor de data impede a seleção de horários no passado.

---

### F-14: Gestão de No-Show e Estorno Contábil Automático (Regra D-09)

#### 1. O que faz
Registra o não comparecimento de pacientes à consulta (falta / *No-Show*) com um único toque, alimentando os relatórios analíticos de absenteísmo, e garante o estorno contábil automático de lançamentos financeiros em caso de cancelamento de atendimentos baixados.

#### 2. Como deve funcionar
- **Botão de Falta:** Nos detalhes da consulta, um botão vermelho destacado *"Paciente Faltou"* altera imediatamente o status para `NO_SHOW`, desocupa o horário da cadeira clínica e registra o evento para as métricas.
- **Estorno Contábil Automático (Regra D-09):** Se uma consulta que havia sido finalizada com sucesso (`status = 'COMPLETED'`) for posteriormente cancelada (`CANCELLED`) ou excluída logicamente (`deleted_at` preenchido):
  - O sistema localiza todas as transações financeiras vinculadas a ela na tabela `financial_transactions` (`WHERE appointment_id = $id AND deleted_at IS NULL`);
  - Executa soft-delete automático nessas transações (`is_active = false, deleted_at = CURRENT_TIMESTAMP`);
  - Garante que os números do Livro Caixa, DRE e Contas a Receber não fiquem inflados indevidamente com procedimentos que não foram de fato realizados.

#### 3. Casos de Uso Principais
- **UC14-1 (Registro de No-Show):** O paciente tinha horário às 16:00 e não apareceu nem atendeu as ligações. Às 16:20, o dentista toca no card e clica em "Paciente Faltou". A grade atualiza com status vermelho e o indicador de no-show é incrementado.
- **UC14-2 (Estorno de Consulta Concluída por Engano):** A recepcionista baixou a consulta do paciente errado por engano, gerando um lançamento de R$ 400 no caixa. Ao perceber, o dentista abre a consulta e a cancela; o lançamento de R$ 400 é estornado do extrato instantaneamente.

#### 4. Edge Cases e Salvaguardas
- **Transações Já Baixadas com Pagamento Confirmado:** Mesmo que a transação estivesse com status `PAID`, o estorno contábil D-09 a inativa logicamente, registrando no histórico de auditoria o motivo do estorno sem quebrar a conciliação bancária.
- **Reversão do Cancelamento:** Se o cancelamento for revertido, novas transações de checkout devem ser geradas conscientemente pelo operador.

---

## Módulo 4: Checkout Clínico e Gestão Financeira ("Caixa de Bolso")

---

### F-15: Checkout de Atendimento na Cadeira (`CheckoutDrawer`)

#### 1. O que faz
Permite a conclusão clínica e liquidação financeira do atendimento diretamente na cadeira odontológica, revisando procedimentos executados, ajustando o valor cobrado e selecionando as condições de pagamento em menos de 15 segundos.

#### 2. Como deve funcionar
- **Abertura da Gaveta (*CheckoutDrawer*):** Disparada ao clicar em "Concluir Atendimento" nos detalhes da consulta.
- **Resumo do Atendimento:** Carrega automaticamente a lista dos procedimentos vinculados ao agendamento, exibindo o preço de tabela original fixado (`basePriceCents`).
- **Edição Centralizada pelo Total Cobrado:** A edição de valor é realizada no campo **Total Final Cobrado**, evitando discrepâncias ou edições manuais desconexas em cada item individual.
- **Indicador Visual de Variação Assinada:**
  - *Desconto:* Se o valor final for menor que a soma de tabela, exibe destaque visual âmbar com valor negativo e percentual (ex: `- R$ 50,00 (-14.3%)`).
  - *Acréscimo:* Se o valor final for superior (ex: procedimento mais complexo), exibe destaque visual verde com valor positivo (ex: `+ R$ 50,00 (+14.3%)`).
- **Formas de Pagamento:** Suporta PIX, Dinheiro, Cartão de Débito, Cartão de Crédito (à vista) e Parcelado (carnê/promissória próprio).
- **Conclusão:** Atualiza o agendamento para `COMPLETED`, gera os registros em `financial_transactions` e sincroniza via `sync_outbox`.

#### 3. Casos de Uso Principais
- **UC15-1 (Pagamento À Vista via PIX):** Consulta de Limpeza tabelada em R$ 150,00. O dentista abre o checkout, seleciona "PIX", o paciente faz o pagamento pelo QR Code do banco, o dentista clica em "Confirmar Recebimento" e o caixa registra a entrada de R$ 150,00 no dia.
- **UC15-2 (Atendimento com Desconto de Cortesia):** Procedimento de R$ 300,00 onde o dentista combinou de fazer por R$ 250,00. Digita R$ 250,00 no total; o sistema calcula o desconto de R$ 50,00 e fecha a transação.

#### 4. Edge Cases e Salvaguardas
- **Atendimento com Valor Zerado (Cortesia Integral):** Se o total cobrado for R$ 0,00, o sistema permite a conclusão sem exigir forma de pagamento monetária, salvando a consulta como concluída e registrando o histórico clínico sem lançamentos de caixa inflados.
- **Queda de Rede durante o Checkout:** A transação inteira e a alteração de status da consulta são salvas atomicamente no Dexie.js local, garantindo que o atendimento não fique em estado pendente.

---

### F-16: Algoritmo de Rateio Ponderado de Descontos e Acréscimos

#### 1. O que faz
Distribui de forma matematicamente proporcional qualquer desconto ou acréscimo concedido no valor total entre todos os procedimentos realizados na consulta, garantindo relatórios precisos de rentabilidade por serviço.

#### 2. Como deve funcionar
- **Fórmula de Proporcionalidade Ponderada:** Para cada item $i$ com preço base $P_i$ sobre o subtotal de tabela $S = \sum P_k$:
  $$\text{peso}_i = \frac{P_i}{S}$$
  $$\text{efetivo}_i = \text{round}(\text{Total Cobrado} \times \text{peso}_i)$$
- **Ajuste de Centavos (Resíduo Matemático):** A soma dos valores efetivos $\sum \text{efetivo}_i$ deve ser exatamente igual ao Total Cobrado em centavos. Se houver diferença decorrente de arredondamento (+1 ou -1 centavo), o resíduo é atribuído ao procedimento de maior valor de tabela.
- **Preservação de Dados:** Na tabela `appointment_items`, o campo `effective_price_cents` armazena o valor apurado após o rateio, mantendo o `base_price_cents` intacto para fins de auditoria de tabela.

#### 3. Casos de Uso Principais
- **UC16-1 (Rateio Perfeito):** Procedimento A (R$ 200,00) e Procedimento B (R$ 100,00), subtotal R$ 300,00. O dentista fecha por R$ 240,00 (desconto de R$ 60,00). O algoritmo aplica R$ 160,00 ao Procedimento A e R$ 80,00 ao Procedimento B.
- **UC16-2 (Ajuste de Dízima Periódica):** 3 procedimentos de R$ 100,00 cada (Subtotal R$ 300,00) cobrados por R$ 100,00 no total. A divisão exata resultaria em R$ 33,333... O algoritmo define R$ 33,34 para o primeiro item e R$ 33,33 para os outros dois, totalizando rigorosamente R$ 100,00 sem perda de centavos.

#### 4. Edge Cases e Salvaguardas
- **Subtotal Original R$ 0,00 com Valor Informado:** Se todos os procedimentos eram R$ 0,00 e o dentista informou um valor positivo no total final, o valor é distribuído igualmente entre os procedimentos.

---

### F-17: Motor de Parcelamento e Entrada Diferenciada

#### 1. O que faz
Estrutura parcelamentos odontológicos próprios (promissória / carnê / cheques), permitindo valores de entrada personalizados, vencimentos automáticos sequenciais e projeção contábil no contas a receber.

#### 2. Como deve funcionar
- **Opção `PARCELADO`:** O parcelamento é ativado ao selecionar o método `PARCELADO` no formulário de checkout.
- **Entrada Diferenciada:** O dentista pode definir um valor de entrada pago no ato (ex: R$ 300,00 hoje). A transação de entrada é gravada imediatamente como `PAID` com `payment_date = hoje`.
- **Geração de Parcelas Restantes:** O saldo remanescente $(\text{Total Cobrado} - \text{Entrada})$ é dividido uniformemente entre o número de parcelas selecionado (de 2x a 24x).
- **Projeção de Vencimentos:** Cada parcela subsequente é gerada com status `PENDING`, data de vencimento sequencial a cada 30 dias (ou data-base escolhida) e agrupada pelo mesmo `group_id`.
- **Trava de Validação Rígida:** O sistema **bloqueia estritamente** qualquer tentativa de lançar parcelamento com valor de entrada maior ou igual ao total cobrado (`entryCents >= totalCents`), exibindo alerta orientando a selecionar o pagamento à vista.

#### 3. Casos de Uso Principais
- **UC17-1 (Tratamento Odontológico Parcelado):** Tratamento ortodôntico no valor de R$ 1.500,00. O paciente paga R$ 300,00 no ato via PIX e parcela o restante em 3 vezes de R$ 400,00. O sistema gera 1 transação paga de R$ 300,00 e 3 transações pendentes de R$ 400,00 com vencimentos para 30, 60 e 90 dias.
- **UC17-2 (Parcelamento sem Entrada):** Implante de R$ 2.000,00 parcelado em 4x de R$ 500,00 sem entrada, com a primeira parcela vencendo em 30 dias.

#### 4. Edge Cases e Salvaguardas
- **Vencimento caindo no dia 31:** Para vencimentos gerados a cada 30 dias, o cálculo de datas do JavaScript utiliza incremento mensal seguro, evitando pular meses curtos (ex: final de fevereiro).
- **Cartão de Crédito:** O método `CARTAO_CREDITO` é liquidado à vista em parcela única na clínica (pois o parcelamento com a operadora da maquininha é externo ao consultório).

---

### F-18: Agendamento Inteligente de Retorno Preventivo

#### 1. O que faz
Garante a retenção e fidelização de pacientes permitindo agendar consultas de revisão e profilaxia preventiva diretamente ao concluir o checkout, com detecção e resolução de choques de horário.

#### 2. Como deve funcionar
- **Gaveta de Retorno (*SmartReturnDrawer*):** Abre-se opcionalmente logo após a confirmação da baixa financeira da consulta.
- **Atalhos Rápidos:** Disponibiliza atalhos de 1 toque:
  - *"Daqui a 15 dias"* (retirada de pontos ou curativo);
  - *"Daqui a 30 dias"* (acompanhamento pós-cirúrgico ou clareamento);
  - *"Daqui a 6 meses"* (profilaxia e revisão preventiva geral).
- **Cenário Livre:** Se a data calculada (mesmo horário e dia da semana correspondente) estiver disponível, o sistema sugere o slot e permite confirmar com 1 toque.
- **Cenário de Conflito / Fim de Semana:** Se a data cair em feriado, domingo ou o horário estiver ocupado, o sistema **não gera erro**. Ele exibe a "Gaveta de Sugestões Inteligentes" listando os **3 horários livres mais próximos**, permitindo a escolha imediata.

#### 3. Casos de Uso Principais
- **UC18-1 (Retorno Semestral de Profilaxia):** O paciente realizou uma limpeza hoje; ao finalizar o pagamento, o dentista clica em "Daqui a 6 meses". O sistema verifica a grade daqui a 180 dias, valida que o horário das 14:00 está vago e cria o agendamento preventivo instantaneamente.
- **UC18-2 (Sugestão por Choque de Fim de Semana):** O retorno de 15 dias de uma cirurgia realizada na sexta-feira cairia em um sábado fechado. O sistema apresenta os 3 slots mais próximos: Sexta anterior às 16:00, Segunda seguinte às 08:00 ou Segunda às 09:00.

#### 4. Edge Cases e Salvaguardas
- **Paciente sem Interesse em Retorno:** O dentista pode simplesmente clicar em "Agora Não" ou fechar a gaveta sem criar nenhum agendamento adicional.

---

### F-19: Lançamento Rápido de Despesas e Recorrência (`group_id`)

#### 1. O que faz
Permite registrar saídas financeiras do consultório (materiais de consumo, contas fixas, manutenção, aluguel, laboratório de prótese) em menos de 10 segundos, com suporte a compras parceladas e gastos recorrentes mensais.

#### 2. Como deve funcionar
- **Modal de Despesa Rápida (*QuickExpenseModal*):** Acessível a partir do painel financeiro ou menu rápido.
- **Campos Obrigatórios:** Categoria de despesa, valor monetário, data do lançamento e se a despesa já foi paga ou está pendente (conta a pagar).
- **Despesas Parceladas / Recorrentes:**
  - O usuário informa a quantidade de parcelas (ex: 3x) ou periodicidade mensal.
  - O sistema gera os registros vinculando-os ao mesmo identificador `group_id` (UUID).
  - A primeira parcela adota o status escolhido (`PAID` ou `PENDING`); todas as demais nascem obrigatoriamente como `PENDING` com vencimentos mensais consecutivos.

#### 3. Casos de Uso Principais
- **UC19-1 (Compra de Material Odontológico à Vista):** O motoboy entrega caixas de anestésicos e resinas compradas na dental por R$ 380,00 no PIX. O dentista abre o modal rápido, digita 380, escolhe a categoria "Materiais & Insumos", marca como "Pago" e salva.
- **UC19-2 (Parcelamento de Instrumentais):** Compra de um novo fotopolimerizador no valor de R$ 900,00 em 3x no boleto. Lança com 3 parcelas; o sistema cria 3 despesas de R$ 300,00 com vencimentos nos meses seguintes.

#### 4. Edge Cases e Salvaguardas
- **Valor Negativo ou Zero:** Validação rejeita valores `<= 0` para evitar inconsistências contábeis.
- **Exclusão de Despesa Vinculada a Grupo:** O operador pode optar por excluir apenas o lançamento selecionado ou todas as parcelas pendentes do mesmo `group_id`.

---

### F-20: Livro Caixa, Extrato Detalhado e Quitação em Lote (`FinancialLedger`)

#### 1. O que faz
Apresenta o extrato cronológico consolidado de todas as entradas e saídas da clínica, com filtros avançados por período, busca textual, exportação de relatórios em CSV e baixa individual ou em lote de contas a receber.

#### 2. Como deve funcionar
- **Filtros Temporais por Período:** Permite alternar instantaneamente entre botões de atalho rápido:
  - *Hoje*, *Esta Semana*, *Este Mês*, *Últimos 30d*, *Seletor Mensal* ou *Filtro Customizado* (Data Inicial e Data Final).
- **Regime de Caixa Estrito:** O Livro Caixa organiza as transações considerando a data de pagamento (`payment_date`) para itens quitados (`PAID`) e a data de vencimento (`due_date`) para itens em aberto (`PENDING`).
- **Modal de Detalhes da Transação:**
  - Para Receitas (`INCOME`): Exibe o procedimento clínico de origem bloqueado com cadeado (para preservar a integridade clínica).
  - Para Despesas (`EXPENSE`): Permite editar livremente a categoria através de menu suspenso.
- **Baixa de Parcela Individual / Em Lote (*BatchSettleModal*):** Ao clicar em "✓ Baixa" em uma parcela pendente, o modal permite definir o meio de pagamento (PIX, Dinheiro, Cartão) e a data da quitação, atualizando o status para `PAID` e gerando a mutação na `sync_outbox`.
- **Edição com Escopo Global (`scope: 'ALL'`):** Ao alterar os dados de uma parcela pertencente a um `group_id` com o escopo global selecionado, apenas as parcelas **PENDENTES** subsequentes são atualizadas. As parcelas já pagas têm sua integridade histórica integralmente preservada.

#### 3. Casos de Uso Principais
- **UC20-1 (Fechamento do Caixa do Dia):** Ao final do expediente, o dentista clica em "Hoje", confere o somatório de entradas e saídas e confronta os valores com o saldo da conta e dinheiro em gaveta.
- **UC20-2 (Recebimento de Mensalidade de Ortodontia):** Um paciente vai à clínica para pagar a 3ª parcela do tratamento. O operador busca o nome do paciente no Extrato, clica em "✓ Baixa", confirma a forma de pagamento e a parcela é dada como quitada.

#### 4. Edge Cases e Salvaguardas
- **Estorno Acidental de Baixa:** É possível reverter uma transação quitada de volta para `PENDING`; o sistema anula a data de liquidação (`payment_date = null`) e ajusta os indicadores de caixa imediatamente.
- **Exportação CSV com Caracteres Especiais:** A exportação inclui cabeçalho BOM UTF-8 para garantir abertura correta no Microsoft Excel sem corrupção de acentuação em português.

---

### F-21: Categorias Financeiras Customizadas e Proteção Contábil (Regra D-06)

#### 1. O que faz
Permite a cada consultório gerenciar seu próprio plano de categorias financeiras para despesas e receitas, ao mesmo tempo em que blinda o sistema contra exclusões indevidas que distorçam relatórios contábeis.

#### 2. Como deve funcionar
- **Multi-Tenant e Auto-Seed (Regra D-05):** Cada consultório possui registros isolados na tabela `financial_categories`. Se um consultório novo for acessado e não possuir categorias cadastradas, o sistema executa um auto-seed transparente com as categorias odontológicas padrão:
  - *Materiais & Insumos*, *Aluguel & Contas*, *Laboratório & Prótese*, *Equipamentos & Manutenção*, *Marketing & Divulgação*, *Folha & Pessoal*, *Outras Despesas*.
- **Proteção Contábil de Receitas Concluídas (Regra D-06):** É expressamente proibido excluir manualmente uma transação financeira de receita que foi gerada por um agendamento com status `COMPLETED` e ativo.
  - O endpoint recusa a requisição com `HTTP 400 Bad Request` e `{ code: 'LINKED_COMPLETED_APPOINTMENT' }`.
  - Para remover a receita, o operador é obrigado a cancelar ou excluir a consulta na agenda (disparando a regra D-09 de estorno automático).

#### 3. Casos de Uso Principais
- **UC21-1 (Criação de Categoria Personalizada):** O consultório contrata um serviço de assessoria contábil mensal; o dentista acessa as configurações e cria a categoria "Honorários Contábeis".
- **UC21-2 (Tentativa de Fraude ou Exclusão Indevida):** Um funcionário tenta excluir um lançamento de entrada de R$ 500 no extrato para esconder um recebimento; o sistema bloqueia e alerta que lançamentos de consultas concluídas não podem ser apagados pelo extrato.

#### 4. Edge Cases e Salvaguardas
- **Inativação de Categoria em Uso:** Se uma categoria for desativada (`is_active = false`), lançamentos passados continuam exibindo o nome dela normalmente, mas ela deixa de ser listada para novas despesas.

---

## Módulo 5: Mensageria WhatsApp, Automação Anti-Ban e Central de Fila

---

### F-22: Pareamento de Instância WhatsApp via QR Code

#### 1. O que faz
Conecta o número de WhatsApp pessoal ou comercial do cirurgião-dentista ao gateway Evolution API (Baileys), permitindo envio e recepção de mensagens sem depender de APIs corporativas pagas ou configurações burocráticas da Meta.

#### 2. Como deve funcionar
- **Tela de Configurações:** Apresenta o card de conexão do WhatsApp com botão "Conectar WhatsApp" / "Gerar QR Code".
- **Geração do QR Code:** O backend solicita a criação de sessão na Evolution API com identificador determinístico no padrão `cliniassist_${tenantId.slice(0, 8)}` e devolve a imagem do QR Code em base64.
- **Polling Desacoplado Inteligente:** Enquanto a sessão estiver nos estados `connecting` ou `qrcode`, o frontend efetua polling a cada 3 a 5 segundos para verificar o status.
- **Reconhecimento Imediato:** Assim que o dentista lê o QR Code pelo aplicativo do WhatsApp no celular, a sessão transiciona para `open`. O frontend encerra o polling na hora, atualiza a pílula do `TopBar` para verde ("Conectado") e exibe o número de telefone conectado.
- **Desconexão Segura:** Botão para desconectar a sessão limpa os tokens de autenticação da instância na Evolution API.

#### 3. Casos de Uso Principais
- **UC22-1 (Primeiro Pareamento da Clínica):** O dentista entra nas Configurações do app, clica em "Parear WhatsApp", abre o WhatsApp no smartphone, vai em "Aparelhos Conectados", escaneia o QR Code na tela do computador e a conexão é estabelecida.
- **UC22-2 (Reconexão após Troca de Aparelho):** O dentista comprou um celular novo; clica em "Desconectar" nas configurações e gera um novo QR Code para parear o novo aparelho.

#### 4. Edge Cases e Salvaguardas
- **QR Code Expirado:** O protocolo Baileys expira o QR Code em ~60 segundos. O sistema detecta a expiração e atualiza a imagem dinamicamente com um botão de "Atualizar QR Code" sem travar o aplicativo.
- **Perda Transitória de Sinal no Smartphone:** Se o celular do dentista perder o 4G/Wi-Fi, a Evolution API sinaliza desconexão temporária. O sistema pausa a fila de envios automaticamente até que a conexão seja restabelecida.

---

### F-23: Motor de Automação Anti-Ban e Disparo em Lote (BullMQ)

#### 1. O que faz
Executa o disparo automático e humanizado de lembretes de confirmação de consulta para os pacientes do dia seguinte (D+1), eliminando o trabalho manual e protegendo o número contra bloqueios no WhatsApp.

#### 2. Como deve funcionar
- **Agendador Cron Diário (`WhatsappSchedulerService`):** Executa diariamente às 09:00 (fuso de Brasília, `America/Sao_Paulo`).
- **Janela Comercial Rígida:** Os envios ocorrem estritamente entre 08:00 e 20:00. Disparos fora dessa faixa são impedidos para não violar diretrizes de spam e perturbação.
- **Varredura D+1:** Identifica consultas com status `PENDING` agendadas para o dia seguinte civil. Consultas agendadas para o próprio dia da execução **NUNCA são disparadas automaticamente** (salvaguarda anti-ban).
- **Motor Anti-Ban no BullMQ:** As mensagens são enfileiradas no Redis via BullMQ com:
  - *Jitter Randômico:* Atraso estocástico de 20 a 50 segundos entre cada mensagem disparada.
  - *Idempotência de 12 Horas:* Consultas que já receberam mensagem outbound nas últimas 12 horas são ignoradas para evitar notificações repetidas.
  - *Retry com Backoff:* Erros de rede sofrem retentativas graduais (HTTP 502/503/429).
- **Disparo Manual Sob Demanda:** A recepcionista pode forçar o disparo a qualquer momento via botão "Disparar Lembretes de Amanhã", com opção de bypass (`force: true`).

#### 3. Casos de Uso Principais
- **UC23-1 (Lembretes Automáticos Matinais):** Às 09:00 de uma quarta-feira, o motor localiza 8 pacientes marcados para a quinta-feira. Envia uma mensagem humanizada às 09:00:23, a próxima às 09:00:58, a seguinte às 09:01:31, cobrindo todos os pacientes com cadência natural.
- **UC23-2 (Disparo Manual no Final do Expediente):** Novos agendamentos foram feitos para amanhã durante a tarde; às 17:30, a secretária clica no botão de disparo manual e os novos pacientes recebem suas mensagens.

#### 4. Edge Cases e Salvaguardas
- **Desconexão da Instância durante o Lote:** Se a conexão cair no meio do processamento da fila, os jobs pendentes são mantidos em pausa no BullMQ. Quando a conexão voltar, a fila verifica se ainda está dentro do horário comercial (antes das 20:00) antes de retomar.

---

### F-24: Templates Dinâmicos, Spintax e Limite Diário de Réplicas

#### 1. O que faz
Produz mensagens com redação variada e humanizada utilizando sintaxe Spintax e interpolação dinâmica de tags, implementando salvaguardas que impedem respostas robóticas repetitivas em loop.

#### 2. Como deve funcionar
- **Modelos Customizáveis por Consultório (`whatsapp_settings`):**
  - Modelo de Confirmação (`confirmation_message_template`);
  - Réplica de Confirmação (`confirmation_reply_template`);
  - Réplica de Remarcação (`reschedule_reply_template`);
  - Réplica de Acolhimento Humanizado (`welcome_fallback_reply_template`).
- **Motor Spintax:** Resolve estocasticamente variações no formato `{opção1|opção2|opção3}` (ex: `{Olá|Oi|Tudo bem}`).
- **Interpolação de Variáveis:** Substitui dinamicamente `{nome}` (primeiro nome do paciente), `{data}` (data formatada em português) e `{horario}` (hora da consulta).
- **Limite Diário de Réplicas Automáticas:**
  - Réplicas automáticas enviadas via webhook são registradas com a flag `is_auto_reply = true`.
  - O sistema verifica se o paciente já recebeu réplica automática no dia civil corrente (`00:00:00` às `23:59:59`).
  - Se o paciente continuar enviando mensagens no mesmo dia, as mensagens são gravadas para leitura da recepcionista, mas **nenhuma nova mensagem automática é disparada**, evitando loops infinitos e comportamentos desagradáveis.
- **Seletor de Escopo de Resposta Automática (`auto_reply_scope`):** Permite configurar se a automação responde a qualquer paciente ou apenas àqueles com consultas pendentes ativas.

#### 3. Casos de Uso Principais
- **UC24-1 (Variação Textual Orgânica):** Três pacientes recebem mensagens de confirmação: o primeiro recebe *"Olá Carlos, tudo bem? Confirmamos sua consulta amanhã..."*; o segundo recebe *"Oi Mariana! Passando para confirmar seu horário..."*. Cada mensagem tem um hash diferente, blindando o número no WhatsApp.
- **UC24-2 (Prevenção de Loop de Agradecimentos):** O paciente confirma a consulta e o sistema envia a réplica de confirmação. O paciente responde em seguida *"Muito obrigado, até amanhã!"*. O sistema armazena a mensagem no histórico sem disparar outra resposta automática.

#### 4. Edge Cases e Salvaguardas
- **Paciente com Nome Longo ou Vazio:** Se o paciente tiver apenas um nome ou caracteres especiais, o sistema higieniza a interpolação garantindo um vocativo educado.

---

### F-25: Webhooks de Resposta e Classificação Semântica

#### 1. O que faz
Recebe notificações em tempo real da Evolution API via webhook, analisa semanticamente o conteúdo da resposta enviada pelo paciente e atualiza automaticamente o status da consulta na agenda.

#### 2. Como deve funcionar
- **Endpoint Público do Webhook:** `POST /api/webhooks/whatsapp` recebe eventos `messages.upsert`.
- **Filtro de Origem:** Ignora mensagens enviadas pelo próprio consultório (`fromMe = true`) e mensagens de grupos.
- **Identificação do Paciente e Consulta:** Localiza o paciente cadastrado pelo número de telefone e busca a próxima consulta pendente associada.
- **Classificação Semântica de Intenção:**
  - **Confirmação:** Reconhecimento de `1`, *"Sim"*, *"Confirmado"*, *"Confirmo"*, *"Pode confirmar"* ou reação 👍. Transiciona a consulta para `status = 'CONFIRMED'` (Verde) e envia a réplica de agradecimento.
  - **Remarcação / Cancelamento:** Reconhecimento de `2`, *"Não posso"*, *"Remarcar"*, *"Reagendar"*, *"Trocar dia"*, *"Outro horário"*. Transiciona a consulta para `status = 'RESCHEDULE_REQUESTED'` (Laranja) e envia a réplica informando que a equipe entrará em contato.
  - **Dúvidas / Mídias / Texto Livre:** Caso o paciente envie mensagem livre, áudio ou anexo de imagem, o sistema altera o status para `MESSAGE_RECEIVED` (Azul, requer atenção) e dispara a mensagem de acolhimento humanizada.
- **Precedência Segura:** O parser semântico avalia palavras compostas garantindo que frases como *"Sim, confirmo o agendamento"* sejam computadas como confirmação legítima e não como pedido de reagendamento.
- **Preservação de Status:** Mensagens livres subsequentes de um paciente que já está confirmado não rebaixam o status da consulta para atenção.

#### 3. Casos de Uso Principais
- **UC25-1 (Confirmação com Dígito 1):** O paciente recebe o lembrete e responde "1". Em menos de 1 segundo, o webhook processa a resposta, o card da consulta fica verde no painel do dentista e o paciente recebe: *"Perfeito! Seu horário está confirmado. Te esperamos!"*.
- **UC25-2 (Envio de Áudio com Dúvida):** O paciente envia um áudio perguntando se precisa estar em jejum. O card fica azul no app com a indicação de mensagem recebida, permitindo ao dentista ouvir ou responder.

#### 4. Edge Cases e Salvaguardas
- **Número Desconhecido Não Cadastrado:** Mensagens recebidas de pessoas que não constam no cadastro de pacientes do consultório são ignoradas com resposta `HTTP 200 OK`, sem poluir o banco ou disparar erros no webhook.

---

### F-26: Central de Fila de WhatsApp com Drag-and-Drop

#### 1. O que faz
Disponibiliza um painel operacional completo para acompanhar o status de cada disparo do WhatsApp (pendentes, enviados, com falha), permitindo envio imediato, edição prévia de mensagens personalizadas, exclusão da fila e reordenação das mensagens por arrastar e soltar (drag-and-drop).

#### 2. Como deve funcionar
- **Acesso à Funcionalidade:**
  - *Mobile:* Acessível pelo hub "Mais" (`MoreMenuHub`) na barra inferior (`BottomNav`) tocando no card "Fila de Envios WhatsApp".
  - *Desktop:* Acessível diretamente pelo item dedicado "Fila WhatsApp" na barra lateral fixa (`DesktopSidebar`).
- **Métricas Operacionais:** Painel superior com contadores em tempo real: *Mensagens Pendentes*, *Enviadas com Sucesso* e *Falhas de Envio*.
- **Ações na Fila:**
  - *Envio Manual Instantâneo (`send-now`):* Botão para disparar a mensagem na mesma hora via Evolution API, cancelando qualquer agendamento futuro no BullMQ. Suporta consultas do mesmo dia.
  - *Edição de Mensagem Customizada:* Permite alterar o texto que será enviado para um paciente específico antes do disparo (salvo em `whatsapp_custom_message`).
  - *Exclusão Lógica da Fila:* Botão para remover a consulta da lista de disparos (`whatsapp_queue_excluded = true`) sem cancelar o atendimento clínico.
  - *Reordenação Drag-and-Drop:* Permite arrastar os cards para priorizar a ordem em que as mensagens serão enviadas.
- **Ações Rápidas de Resolução no Balão de Conversa:**
  - Se o paciente pediu remarcação: exibe o botão em destaque *"Reagendar Consulta"*, abrindo diretamente o `RescheduleModal`.
  - Se for mensagem de dúvida: exibe o botão *"Confirmar Manualmente"*.

#### 3. Casos de Uso Principais
- **UC26-1 (Personalização de Mensagem para Paciente Especial):** Um paciente que fará cirurgia precisa de instruções específicas sobre medicação prévia. A secretária localiza a mensagem dele na fila, edita o texto adicionando a recomendação médica e salva antes do horário de disparo.
- **UC26-2 (Priorização de Envio):** A secretária quer que um paciente receba o lembrete imediatamente; clica no ícone de avião de papel ("Enviar Agora") e a mensagem é despachada na hora.

#### 4. Edge Cases e Salvaguardas
- **Tentativa de Reordenar Fila Vazia ou Concluída:** A interface desabilita os controles de arrastar e soltar quando não houver mensagens pendentes.
- **Consulta Excluída da Fila que Sofre Remarcação:** Se a consulta for remarcada, o status de exclusão da fila pode ser revisto pelo operador.

---

## Módulo 6: Relatórios Gerenciais e Inteligência Clínica

---

### F-27: Indicador de Faltas e Perdas por No-Show

#### 1. O que faz
Mede o percentual de absenteísmo no consultório e calcula com precisão o impacto financeiro estimado em reais gerado pelas consultas perdidas.

#### 2. Como deve funcionar
- **Endpoint Analítico:** `GET /api/reports/no-show` com suporte a filtros de período (`today`, `this_month`, `last_30_days`, `all` ou datas customizadas).
- **Cálculo da Taxa de Faltas:**
  $$\text{no\_show\_rate} = \frac{\text{no\_show\_count}}{\text{total\_appointments}} \times 100$$
- **Cálculo do Prejuízo Estimado:** Soma dos preços de tabela (`effective_price_cents`) de todos os procedimentos que estavam agendados nas consultas que receberam status `NO_SHOW` no período filtrado.
- **Apresentação Visual:** Exibe cartão com a taxa percentual, resumo amigável (ex: *"3 de 24 consultas"*) e valor monetário formatado (ex: *"R$ 480,00 perdidos em cadeiras ociosas"*).

#### 3. Casos de Uso Principais
- **UC27-1 (Avaliação de Eficácia das Confirmações):** Ao final do mês, o dentista consulta o indicador e percebe que as confirmações automáticas por WhatsApp reduziram a taxa de faltas de 25% para 4%, salvando mais de R$ 2.000 em atendimentos.

#### 4. Edge Cases e Salvaguardas
- **Período sem Nenhuma Consulta Agendada:** Se o total de consultas for 0, o sistema trata a divisão por zero e retorna taxa de `0.0%` sem falha na interface.

---

### F-28: DRE Simplificado e Fluxo de Caixa (Regime de Caixa)

#### 1. O que faz
Apresenta o Demonstrativo de Resultado do Exercício simplificado da clínica sob a ótica de Regime de Caixa, confrontando receitas efetivamente recebidas com despesas pagas.

#### 2. Como deve funcionar
- **Endpoint Analítico:** `GET /api/reports/dre`.
- **Regime de Caixa Estrito:** Computa exclusivamente as transações com `status = 'PAID'`, considerando o campo `payment_date`.
- **Métricas Apuradas:**
  - *Faturamento Realizado (`total_income_paid_cents`):* Soma de receitas quitadas.
  - *Despesas Operacionais Pagas (`total_expense_paid_cents`):* Soma de saídas pagas.
  - *Lucro Líquido Realizado (`net_profit_cents`):* Receitas pagas menos Despesas pagas.
  - *Margem Líquida Operacional:* $\frac{\text{Lucro Líquido}}{\text{Receitas Pagas}} \times 100$.

#### 3. Casos de Uso Principais
- **UC28-1 (Acompanhamento Mensal de Sobra de Caixa):** No dia 30, o dentista consulta o DRE do mês corrente: Receitas pagas: R$ 18.500; Despesas pagas: R$ 6.200; Lucro Líquido do consultório: R$ 12.300 (Margem de 66.5%).

#### 4. Edge Cases e Salvaguardas
- **Receitas Pendentes não Inflam o Resultado:** Vendas parceladas cujos vencimentos estão no futuro não entram no cálculo do DRE, evitando ilusão de liquidez.

---

### F-29: Previsão de Recebíveis Futuros (Curvas de 30, 60 e 90 dias)

#### 1. O que faz
Projeta a entrada de recursos financeiros futuros com base nas parcelas a receber já negociadas e ativas no sistema.

#### 2. Como deve funcionar
- **Endpoint Analítico:** `GET /api/reports/receivables?referenceDate=YYYY-MM-DD`.
- **Segmentação por Janelas Temporais:** Filtra receitas ativas com status `PENDING` cuja data de vencimento (`due_date`) esteja no horizonte:
  - Próximos 30 dias (`window_0_30_cents`);
  - De 31 a 60 dias (`window_31_60_cents`);
  - De 61 a 90 dias (`window_61_90_cents`);
  - Total acumulado para 30, 60 e 90 dias.
- **Gráficos e Listagem:** Exibe cartões com os totais de recebíveis futuros e tabela discriminada de parcelas por paciente.

#### 3. Casos de Uso Principais
- **UC29-1 (Planejamento de Aquisição de Equipamento):** O dentista quer comprar um motor cirúrgico novo no valor de R$ 4.000; consulta o relatório de recebíveis e constata que tem R$ 5.800 garantidos para entrar nos próximos 60 dias via parcelamentos já contratados.

#### 4. Edge Cases e Salvaguardas
- **Inadimplência ou Cancelamento de Tratamento:** Se uma consulta parcelada for cancelada, as parcelas pendentes são estornadas automaticamente e a curva de recebíveis futuros se reajusta na hora.

---

### F-30: Reativação de Pacientes Inativos (+6 Meses)

#### 1. O que faz
Identifica automaticamente os pacientes cadastrados cujo último atendimento clínico ocorreu há mais de 180 dias (6 meses), fornecendo botão direto para iniciar conversa humanizada no WhatsApp convidando para revisão preventiva.

#### 2. Como deve funcionar
- **Algoritmo de Identificação:** Cruza os pacientes ativos com o histórico de consultas concluídas (`COMPLETED`), identificando aqueles onde a data da última consulta foi há mais de 6 meses.
- **Exclusão de Pacientes com Agendamento Futuro:** Se um paciente foi atendido há 8 meses, mas já possui uma consulta marcada para a próxima semana, ele **NÃO** aparece na lista de inativos.
- **Atalho de Conversa com Template Humanizado:** Ao lado de cada paciente inativo, um botão com o ícone do WhatsApp abre o aplicativo de mensagens no smartphone ou WhatsApp Web já preenchido com a mensagem:
  *"Olá {nome}! Tudo bem? Notamos que faz mais de 6 meses desde sua última avaliação preventiva. Vamos agendar uma limpeza para manter seu sorriso saudável?"*

#### 3. Casos de Uso Principais
- **UC30-1 (Campanha Preventiva de Sexta-Feira):** Em horários mais tranquilos na sexta-feira, a recepcionista abre a lista de inativos, clica no botão do WhatsApp de 10 pacientes da lista e consegue preencher 4 horários livres da semana seguinte.

#### 4. Edge Cases e Salvaguardas
- **Paciente sem Nenhuma Consulta Realizada:** Pacientes recém-cadastrados que ainda não realizaram sua primeira consulta não são tratados como inativos antigos para não gerar mensagens incoerentes.

---

## 3. Matriz de Rastreabilidade e Decisões de Arquitetura

A tabela a seguir correlaciona as decisões de design canônicas (`/grill-me`), critérios de aceite spec-driven e os componentes que suportam cada funcionalidade:

| ID | Funcionalidade | Decisão de Projeto / Spec | Componentes Principais |
|---|---|---|---|
| **F-01** | Autenticação & Multi-Tenant | AC-118 a AC-127 | `auth-controller.ts`, `AuthService`, `authMiddleware`, `tenants` |
| **F-02** | Soft-Delete Inegociável | Regras Globais Backend/Frontend | Todos os Repositórios (`is_active = false, deleted_at`) |
| **F-03** | Local-First & PWA Offline | AC-01 a AC-04, AC-201 | `localDb` (Dexie.js), `public/sw.js`, `App.tsx` |
| **F-04** | Sincronização Bidirecional | AC-166 a AC-174, AC-193/195 | `SyncManager.ts`, `localDb.sync_outbox`, `routes/sync.ts` |
| **F-05** | Gestão de Pacientes | AC-18 a AC-24, AC-185 | `PatientList.tsx`, `patient-service.ts`, `patients` |
| **F-06** | Procedimentos e Custos | AC-11 a AC-17 | `procedure-service.ts`, `procedures`, `AppointmentItem` |
| **F-07** | Horários de Atendimento | D-01, AC-05 a AC-10 | `business-hours-service.ts`, `business_hours` (sem delete) |
| **F-08** | Bloqueios de Agenda | D-01, AC-175 a AC-180 | `schedule-block-service.ts`, `schedule_blocks` |
| **F-09** | Grade Temporal & Cores | AC-25 a AC-32, AC-206 | `ScheduleGrid.tsx`, `ViewModeSelector.tsx` |
| **F-10** | Agendamento On-The-Fly | AC-33 a AC-40 | `QuickAppointmentDrawer.tsx`, `InlinePatientForm.tsx` |
| **F-11** | Atalho Agendar Paciente | AC-186 a AC-190 | `initialPatient`, `PatientCard.tsx`, `QuickAppointmentDrawer.tsx` |
| **F-12** | Conflitos e Encaixes | D-01, AC-41 a AC-48 | `appointment-service.ts`, `confirm_overtime`, `is_extra_fit` |
| **F-13** | Remarcação Segura | AC-49 a AC-55, AC-221 | `RescheduleModal.tsx`, `AppointmentDetailsDrawer.tsx` |
| **F-14** | No-Show & Estorno D-09 | D-09, AC-56 a AC-60 | `appointment-service.ts`, `financial-repository.ts` |
| **F-15** | Checkout na Cadeira | D-02, AC-61 a AC-68 | `CheckoutDrawer.tsx`, `financial-controller.ts` |
| **F-16** | Rateio de Descontos | D-02, AC-69 a AC-74 | `calculator.ts`, `calculateDiscountDistribution` |
| **F-17** | Motor de Parcelamento | D-04, AC-75 a AC-82, AC-205 | `InstallmentsForm.tsx`, `installments.ts`, `group_id` |
| **F-18** | Retorno Inteligente | AC-83 a AC-88 | `SmartReturnDrawer.tsx`, `smart-return.ts` |
| **F-19** | Despesas e Recorrência | D-04, AC-89 a AC-95 | `QuickExpenseModal.tsx`, `financial-service.ts` |
| **F-20** | Livro Caixa & Extrato | D-03, D-07, AC-96 a AC-103 | `FinancialLedger.tsx`, `BatchSettleModal.tsx`, `/metrics` |
| **F-21** | Categorias & Proteção D-06 | D-05, D-06, AC-104 a AC-110 | `financial-category-service.ts`, `LINKED_COMPLETED_APPOINTMENT` |
| **F-22** | Pareamento via QR Code | AC-128 a AC-135 | `SettingsView.tsx`, `TopBar.tsx`, `whatsapp-service.ts` |
| **F-23** | Fila Anti-Ban & BullMQ | AC-136 a AC-142 | `whatsapp-scheduler-service.ts`, `BullMQ`, `Redis` |
| **F-24** | Spintax & Limite Diário | AC-143 a AC-150, AC-222/223 | `parser.ts`, `is_auto_reply`, `whatsapp_settings` |
| **F-25** | Webhooks & Interpretação | AC-151 a AC-160, AC-219 | `webhook-service.ts`, `parser.ts`, `routes/webhooks.routes.ts` |
| **F-26** | Central de Fila WhatsApp | AC-209 a AC-218 | `WhatsappQueueView.tsx`, `whatsapp-queue-controller.ts` |
| **F-27** | Indicador de No-Show | AC-161 a AC-165 | `no-show` report, `analytics-service.ts` |
| **F-28** | DRE Regime de Caixa | D-07, AC-196 a AC-200 | `dre` report, `FinancialDashboard.tsx` |
| **F-29** | Previsão de Recebíveis | AC-191 a AC-195 | `receivables` report, `ReceivablesList.tsx` |
| **F-30** | Reativação de Inativos | AC-181 a AC-185 | `InactivePatientsList.tsx`, `ReportsView.tsx` |

---

## 4. Conclusão e Diretrizes de Manutenção

Este documento reflete a verdade de engenharia do repositório **OdontoFlow / CliniAssist**. Ao implementar novas funcionalidades ou modificar regras existentes:
1. Sempre crie ou atualize os testes unitários/integrados correspondentes anotados com a spec (`@spec:AC-xxx`).
2. Mantenha os valores financeiros representados em inteiros centavos (`cents`) e garanta o isolamento estrito por `tenant_id`.
3. Nunca execute `DELETE FROM` físico para dados de negócio; utilize sempre soft-delete.
4. Ao concluir modificações no backend ou frontend, atualize este catálogo [`docs/features.md`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/docs/features.md) e os arquivos específicos em `docs/backend/funcionalidades/` e `docs/frontend/funcionalidades/`.

