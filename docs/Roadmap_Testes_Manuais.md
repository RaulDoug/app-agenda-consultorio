# Roadmap de Testes Manuais e Validação de QA — OdontoFlow (CliniAssist)

> **Documento:** Guia Completo de Validação Funcional, Casos de Uso e *Edge Cases*  
> **Localização:** `docs/Roadmap_Testes_Manuais.md`  
> **Público-alvo:** Product Owners (POs), QA, Desenvolvedores e Cirurgiões-Dentistas (Beta Testers)  
> **Objetivo:** Fornecer um roteiro passo a passo, exaustivo e estruturado em fases para validar manualmente todos os fluxos de negócio, comportamentos *Local-First (Offline)*, ergonomia *Mobile-First* e casos de borda (*edge cases*) da aplicação.

---

## Como Utilizar este Roadmap

Cada caso de teste possui um identificador único (`TM-XXX-NN`), pré-condições, passos de execução e o resultado esperado detalhado. Utilize as caixas de seleção (`[ ]`) para marcar o progresso durante a sessão de testes:

- `[ ]` **Pendente**
- `[x]` **Aprovado (Pass)**
- `[!]` **Falhou (Bug Identificado)**

### Preparação do Ambiente de Teste
1. **Backend e Infraestrutura:** Certifique-se de que o PostgreSQL, Redis, API Backend (`npm run dev --workspace=@cliniassist/backend`) e, opcionalmente, a Evolution API estejam ativos.
2. **Frontend PWA:** Inicie o servidor web (`npm run dev --workspace=@cliniassist/frontend`) e acesse pelo navegador.
3. **Inspeção Mobile & Offline:** Abra o **Chrome DevTools (`F12`)**:
   - Ative o **Device Toolbar (`Ctrl+Shift+M`)** em resolução mobile (ex: *iPhone 14 Pro — 393x852*) para validar a ergonomia de uma mão (*One-Thumb*) e a barra inferior (`BottomNav`).
   - Utilize a aba **Application > IndexedDB (`CliniAssistLocalDB`)** para inspecionar o banco local e a fila `sync_outbox`.
   - Utilize a aba **Network > Throttling (Offline)** para simular quedas de internet nos testes de resiliência.

---

## Fase 1: Autenticação, Sessão Local-First e Isolamento Multi-Tenant

### Casos de Uso Principais

- [x] **`TM-AUT-01` — Bloqueio Inicial de Acesso (`AuthGate`)**
  - **Pré-condição:** Banco IndexedDB limpo (sem sessão ativa em `auth_session`).
  - **Passos:** Acessar a URL raiz da aplicação (`/`).
  - **Resultado Esperado:** O sistema exibe exclusivamente a tela de login (`LoginScreen`). Nenhuma aba da agenda, pacientes ou caixa deve ser renderizada ou acessível.

- [x] **`TM-AUT-02` — Login com Credenciais Válidas e Persistência Offline**
  - **Passos:**
    1. Preencher e-mail e senha válidos de um consultório cadastrado e tocar em **"Entrar"**.
    2. Após carregar a Agenda, recarregar a página (`F5`) com a rede em modo **Offline** no DevTools.
  - **Resultado Esperado:** O login autentica com sucesso, grava o registro `active_session` na tabela `auth_session` do IndexedDB com o token JWT e dados do tenant, e ao recarregar offline a sessão permanece ativa abrindo direto na Agenda.
  - **Status:** ✅ Corrigido — Service Worker (`sw.js`) implementado em `frontend/public/` e registrado no `main.tsx` para cache do App Shell e suporte a recarga offline (F5).

- [x] **`TM-AUT-03` — Logout Limpo (Sem Pendências de Sincronização)**
  - **Pré-condição:** Usuário logado e indicador de conexão em **"🟢 Online (Sincronizado)"** (`sync_outbox` vazia).
  - **Passos:** Ir em **Ajustes** (ou **Mais > Ajustes** no mobile) e tocar em **"Sair da Conta / Logout"**.
  - **Resultado Esperado:** O sistema realiza o flush preventivo, encerra a sessão imediatamente sem exibir modal de alerta de perda de dados e retorna para a `LoginScreen`.

### Edge Cases (Casos de Borda)

- [x] **`TM-AUT-04` — [Edge Case] Credenciais Inválidas, Campos Vazios e Proteção contra Duplo Clique**
  - **Passos:**
    1. Tentar submeter o formulário de login vazio.
    2. Informar senha incorreta e clicar repetidamente no botão **"Entrar"**.
  - **Resultado Esperado:** Validação impede envio vazio; durante a requisição o botão fica desabilitado exibindo estado de carregamento; erro `401` exibe alerta claro sem travar a tela.

- [x] **`TM-AUT-05` — [Edge Case] Tentativa de Logout com Mutações Pendentes na `sync_outbox`**
  - **Pré-condição:** Ativar modo **Offline**, criar um novo paciente ou agendamento (gerando item `PENDING` na `sync_outbox`).
  - **Passos:** Ainda offline, ir em **Ajustes** e tocar em **"Sair da Conta"**.
  - **Resultado Esperado:** O sistema **bloqueia o logout direto** e abre a gaveta de confirmação (`LogoutConfirmDrawer`), informando exatamente quantas alterações locais ainda não foram sincronizadas e exigindo confirmação explícita antes de limpar o banco local.

- [x] **`TM-AUT-06` — [Edge Case] Isolamento Multi-Tenant Estrito ao Trocar de Conta no Mesmo Dispositivo**
  - **Passos:**
    1. Logar no **Consultório A**, criar pacientes e agendamentos.
    2. Realizar logout e fazer login com as credenciais do **Consultório B** no mesmo navegador.
  - **Resultado Esperado:** O sistema detecta a mudança de `tenant.id`, executa `clearAllData()` no IndexedDB antes de iniciar a sessão do Consultório B e garante que **nenhum** paciente, agendamento ou transação do Consultório A apareça na tela.

- [x] **`TM-AUT-07` — [Edge Case] Expiração ou Invalidação de Token JWT (`HTTP 401`)**
  - **Passos:** Adulterar o token salvo no IndexedDB (`auth_session`) ou aguardar expiração e disparar uma sincronização com a API.
  - **Resultado Esperado:** Ao receber `401 Unauthorized` do backend, a aplicação limpa a sessão inválida e redireciona imediatamente para a `LoginScreen`.
  - **Status:** ✅ Validado e Tratado — `SyncManager` configurado com `onUnauthorized`, limpando a sessão e redirecionando para Login ao receber 401. Para simular manualmente no DevTools Console:
    ```javascript
    indexedDB.open('CliniAssistLocalDB').onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('auth_session', 'readwrite');
      const st = tx.objectStore('auth_session');
      st.get('active_session').onsuccess = ev => {
        const data = ev.target.result;
        if (data) { data.token = 'invalid_jwt_token'; st.put(data); }
      };
    };
    ```

---

## Fase 2: Navegação Mobile-First, Layout Responsivo e Conectividade

### Casos de Uso Principais

- [x] **`TM-NAV-01` — Alternância Desktop (Sidebar) vs Mobile (BottomNav + Hub "Mais")**
  - **Passos:**
    1. Em tela Desktop (`>= 768px`), navegar pelas abas da barra lateral esquerda (`Agenda`, `Clientes`, `Caixa`, `Relatórios`, `Ajustes`).
    2. Redimensionar para Mobile (`< 768px`) e navegar pela barra inferior (`Agenda`, `Caixa`, botão central `[+]`, `Relatórios`, `Mais`).
    3. Tocar na aba **Mais** no mobile.
  - **Resultado Esperado:** No mobile, a sidebar desaparece e a barra inferior (`BottomNav`) fica fixa ao alcance do polegar. O menu **Mais** (`MoreMenuHub`) exibe os cartões de acesso rápido para **Clientes & Pacientes** (com contador de pacientes ativos) e **Ajustes**.

- [x] **`TM-NAV-02` — Botão Flutuante Central (`+` FAB) na Barra Inferior Mobile**
  - **Passos:** Estando em qualquer aba no mobile (ex: `Relatórios` ou `Caixa`), tocar no botão central destacado **`+`** na barra inferior.
  - **Resultado Esperado:** Abre imediatamente a gaveta de **Novo Agendamento Rápido** (`QuickAppointmentDrawer`) com data e horário calculados de forma inteligente.

- [x] **`TM-NAV-03` — Indicadores Visuais de Rede e Status do WhatsApp no Cabeçalho**
  - **Passos:**
    1. Verificar o topo do `AppShell` com internet ativa.
    2. Desativar a rede no DevTools (**Offline**) e criar um registro.
    3. Reativar a rede (**Online**).
  - **Resultado Esperado:** O badge alterna em tempo real entre **🟢 Online**, **🟡 Offline (com contador de pendências)** e retorna a sincronizado após o envio automático da `sync_outbox`.

---

## Fase 3: Gestão de Clientes & Pacientes

### Casos de Uso Principais

- [x] **`TM-PAC-01` — Cadastro Direto de Paciente na Aba Clientes**
  - **Passos:**
    1. Acessar a aba **Clientes** e tocar em **"+ Novo Paciente"**.
    2. Preencher Nome (`"Mariana Costa"`), WhatsApp com máscara/símbolos (`"(11) 98877-6655"`) e Observações Clínicas (`"Alérgica a dipirona; prefere anestesia tópica antes"`).
    3. Salvar.
  - **Resultado Esperado:** O modal fecha instantaneamente (< 16ms), o paciente aparece na listagem em ordem alfabética com o telefone higienizado (`11988776655`), o selo âmbar **`Obs`** visível e o badge **"Novo / Sem consultas anteriores"**.

- [x] **`TM-PAC-02` — Busca Instantânea por Nome ou WhatsApp**
  - **Passos:** Digitar parte do nome (em maiúsculas/minúsculas) ou últimos dígitos do WhatsApp no campo de busca da lista de clientes.
  - **Resultado Esperado:** A filtragem ocorre em tempo real sobre o banco local sem engasgos, exibindo apenas os pacientes correspondentes ou estado vazio amigável se não houver resultados.

- [x] **`TM-PAC-03` — Expansão do Card, Visualização de Observações e Edição Cadastral**
  - **Passos:**
    1. Tocar sobre o card de `"Mariana Costa"` para expandi-lo.
    2. Verificar o bloco destacado **"Observações / Histórico Clínico"**, total de consultas e data de cadastro.
    3. Tocar em **"Editar Cadastro"**, alterar o nome ou observação e salvar.
  - **Resultado Esperado:** O card expande suavemente exibindo as observações completas. Após editar e salvar, os dados refletem imediatamente no card e uma mutação `UPDATE` é gravada na `sync_outbox`.

- [x] **`TM-PAC-04` — Atalho "+ Agendar" com Paciente Pré-Selecionado**
  - **Passos:** No card de um paciente na aba **Clientes**, tocar no botão **"+ Agendar"**.
  - **Resultado Esperado:** O app muda para a aba **Agenda** e abre a gaveta `QuickAppointmentDrawer` com o paciente **já selecionado** (exibindo nome, WhatsApp, botão `"Trocar"` e o alerta com suas observações clínicas), sem exigir nova busca.
  - **Status:** ✅ Corrigido — A grade diária (`ScheduleGrid`) agora expande dinamicamente para acomodar consultas de encaixe fora do expediente, renderizando slots adicionais com identificador visual "Extra".

- [x] **`TM-PAC-05` — Prontuário Financeiro do Paciente (`PatientFinancialDrawer`)**
  - **Passos:** Tocar no botão **"Finanças"** (`$`) no card de um paciente que possua consultas concluídas e parcelas pendentes.
  - **Resultado Esperado:** Abre a gaveta de prontuário financeiro exibindo o resumo de valores pagos, total em aberto, histórico de transações do paciente e opção de dar baixa rápida nas parcelas pendentes.

- [x] **`TM-PAC-06` — Exclusão Lógica Segura de Paciente (`Soft-Delete`)**
  - **Passos:**
    1. Expandir o card de um paciente (ou abrir o modal de edição) e tocar em **"Excluir"**.
    2. No modal `ConfirmDeletePatientModal`, clicar primeiro em **"Cancelar"** (validando que nada foi apagado).
    3. Tocar novamente em **"Excluir"** e confirmar em **"Sim, Excluir Paciente"**.
  - **Resultado Esperado:** O modal se fecha, o paciente desaparece reativamente da listagem ativa e das buscas de novo agendamento. No IndexedDB, o registro permanece com `is_active: false` (preservando histórico financeiro passado) e gera evento `DELETE` na `sync_outbox`.
  - **Status:** ✅ Corrigido — O endpoint `POST /api/sync/batch` agora trata `isDeleteOp` para `patients`, atualizando `is_active = false` e gravando `deleted_at` com o timestamp correspondente no PostgreSQL. O repositório local também normaliza DDI 55 para garantir unicidade.

### Edge Cases (Casos de Borda)

- [x] **`TM-PAC-07` — [Edge Case] Bloqueio de Duplicidade de WhatsApp (Criação e Edição)**
  - **Passos:**
    1. Tentar cadastrar um novo paciente informando o mesmo número de WhatsApp de `"Mariana Costa"` (mesmo formatado diferente, ex: `11 98877-6655`).
    2. Tentar editar outro paciente existente alterando o WhatsApp dele para o número da `"Mariana Costa"`.
  - **Resultado Esperado:** O repositório bloqueia a gravação e exibe alerta vermelho no formulário: *`Já existe um paciente cadastrado com este WhatsApp: "Mariana Costa"`*, mantendo o modal aberto sem criar registros duplicados.

- [x] **`TM-PAC-08` — [Edge Case] Reutilização de WhatsApp de Paciente Excluído (`is_active: false`)**
  - **Passos:** Excluir logicamente um paciente e, em seguida, cadastrar um novo paciente com o mesmo número de WhatsApp do paciente excluído.
  - **Resultado Esperado:** Como a trava de duplicidade verifica apenas pacientes ativos (`is_active: true`), o cadastro é permitido normalmente.

- [x] **`TM-PAC-09` — [Edge Case] Isolamento de Estado após Fechar Agendamento por Atalho**
  - **Passos:**
    1. Clicar em **"+ Agendar"** no card da paciente `"Mariana Costa"` (gaveta abre com Mariana pré-selecionada).
    2. Fechar a gaveta no botão **`✕`** (ou `Cancelar`).
    3. Clicar em **"+ Novo Agendamento"** no topo da agenda, no botão central **`+`** ou em um slot vazio da grade.
  - **Resultado Esperado:** A gaveta deve abrir **totalmente limpa** (exibindo o campo de busca `"Buscar por nome ou WhatsApp..."`), sem resquícios da seleção anterior da Mariana.

---

## Fase 4: Agenda, Timeline Diária/Semanal/Mensal e Agendamento Rápido

### Casos de Uso Principais

- [x] **`TM-AGE-01` — Alternância de Visões (Dia, Semana e Mês) e Navegação Temporal**
  - **Passos:**
    1. Alternar no seletor superior entre **Dia**, **Semana** e **Mês**.
    2. Usar as setas `<` (anterior), `>` (próximo) e o botão **"Hoje"**.
    3. Na visão **Mês**, clicar sobre um dia específico com agendamentos.
  - **Resultado Esperado:** A grade adapta a visualização instantaneamente. Clicar em um dia na visão mensal navega diretamente para a visão **Dia** daquela data.

- [x] **`TM-AGE-02` — Agendamento Rápido (< 10s) com Cadastro On-the-Fly de Paciente e Procedimento**
  - **Passos:**
    1. Tocar no slot vago das `10:00` na grade diária.
    2. No campo de paciente, clicar em **"+ Novo"**, digitar Nome e WhatsApp inline e confirmar.
    3. Na seção de procedimentos, clicar em **"+ Novo Procedimento"**, criar `"Clareamento a Laser"` (45 min, R$ 800,00) e selecioná-lo.
    4. Clicar em **"Salvar Agendamento"**.
  - **Resultado Esperado:** Paciente e procedimento são criados sem sair da gaveta; a duração total atualiza para `45 min`; ao salvar, o card aparece imediatamente na grade ocupando das `10:00` às `10:45` com status **Aguardando Confirmação (Amarelo)**.

- [x] **`TM-AGE-03` — Múltiplos Procedimentos e Cálculo Dinâmico de Duração / Ocupação Visual**
  - **Passos:**
    1. Abrir novo agendamento às `14:00`.
    2. Selecionar 2 procedimentos via pílulas (*chips*): um de `30 min` e outro de `60 min`.
    3. Salvar e observar a grade horária.
  - **Resultado Esperado:** O indicador **"Duração Total"** exibe `90 min` na gaveta. Na grade da agenda, o card do agendamento dimensiona sua altura ocupando continuamente os slots de `14:00`, `14:30` e `15:00` (até `15:30`), exibindo os procedimentos vinculados.

- [x] **`TM-AGE-04` — Detalhes da Consulta, Edição Interativa de Procedimentos e Status**
  - **Passos:**
    1. Tocar sobre um card de agendamento existente na grade para abrir a `AppointmentDetailsDrawer`.
    2. Adicionar ou remover um procedimento vinculado à consulta e salvar a alteração.
    3. Testar a ação **"Paciente Faltou (No-Show)"** ou **"Cancelar Consulta"**.
  - **Resultado Esperado:** A adição/remoção de procedimentos recalcula o horário de término (`end_time`) e o valor previsto da consulta. Ao marcar falta, o card muda para a cor vermelha (**No-Show**).

- [x] **`TM-AGE-05` — Remarcação de Consulta (`RescheduleModal`)**
  - **Passos:**
    1. Abrir os detalhes de um agendamento ou clicar no botão de remarcar.
    2. Escolher uma nova data no seletor e um novo horário vago (ex: dia seguinte às `11:00`).
    3. Confirmar remarcação.
  - **Resultado Esperado:** O agendamento é movido para a nova data/horário, a agenda navega para a data do agendamento remarcado e a mutação `UPDATE` vai para a `sync_outbox`.

### Edge Cases (Casos de Borda)

- [x] **`TM-AGE-06` — [Edge Case] Pré-Seleção Inteligente de Data e Horário (Dentro vs Após o Expediente)**
  - **Passos:**
    1. Acionar o botão **"+ Novo Agendamento"** durante o horário comercial (ex: `14:12`).
    2. Simular ou testar após o fim do expediente (ex: `>= 18:00`).
  - **Resultado Esperado:** Durante o expediente, sugere hoje no próximo bloco de 30min (`14:30`). Após as `18:00`, avança automaticamente a data para **amanhã** com horário inicial às **`08:00`**.

- [x] **`TM-AGE-07` — [Edge Case] Controle de Encaixe Estrito sob Demanda (Choque de Horário ou Fora de Expediente/Almoço)**
  - **Passos:**
    1. Abrir agendamento em horário livre normal (`09:00`): verificar que **não existe** aviso ou checkbox de encaixe na tela.
    2. Mudar o horário para `12:30` (horário de almoço), `19:30` (fora do expediente) ou para o mesmo horário de outra consulta ativa.
    3. Tentar clicar em **"Salvar Agendamento"** sem marcar a autorização de encaixe.
    4. Marcar o checkbox **"Permitir Encaixe / Horário Extra neste horário"** e salvar.
  - **Resultado Esperado:** Em horário livre a UI é limpa. Ao detectar conflito/almoço/fora de hora, surge o bloco âmbar **`⚡ Aviso de Encaixe`**. Tentar salvar sem autorizar exibe erro orientativo. Ao marcar o checkbox e salvar, o agendamento é criado com a flag `is_extra_fit: true` e exibe o selo de encaixe na grade.
  - **Status:** ✅ Corrigido — A grade diária inclui os slots de horário extra criados, tornando consultas de encaixe fora do expediente visíveis.

- [x] **`TM-AGE-08` — [Edge Case] Sobreposição Parcial por Soma de Procedimentos**
  - **Pré-condição:** Existe uma consulta marcada às `10:30`.
  - **Passos:** Iniciar um agendamento às `10:00` (livre) com 1 procedimento de `30 min` (sem conflito). Em seguida, selecionar um segundo procedimento de `30 min` (fazendo o término ir para `11:00`, invadindo a consulta das `10:30`).
  - **Resultado Esperado:** Assim que o segundo procedimento é marcado, o sistema detecta a sobreposição dinâmica (`10:00–11:00` vs `10:30`) e exibe imediatamente o **Aviso de Encaixe**.

- [x] **`TM-AGE-09` — [Edge Case] Consulta Cancelada Não Deve Bloquear Horário**
  - **Passos:** Cancelar uma consulta que estava às `15:00` e abrir um novo agendamento para o mesmo dia às `15:00`.
  - **Resultado Esperado:** O horário das `15:00` é considerado livre, sem disparar falso alerta de sobreposição/encaixe.

- [x] **`TM-AGE-10` — [Edge Case] Bloqueio de Scroll de Fundo e Reset de Formulário ao Reabrir Gaveta**
  - **Passos:**
    1. Abrir a gaveta de agendamento e verificar que o `body` está com rolagem bloqueada (`overflow: hidden`).
    2. Preencher notas/procedimentos, fechar sem salvar e abrir novamente em outro horário.
  - **Resultado Esperado:** O scroll da página retorna ao normal ao fechar; ao reabrir, os campos de notas, erros e procedimentos anteriores foram completamente limpos e o botão de salvar está reativado.

---

## Fase 5: Checkout Financeiro, Rateio, Parcelamento e Retorno Inteligente

### Casos de Uso Principais

- [x] **`TM-FIN-01` — Conclusão de Atendimento e Pagamento à Vista (PIX / Cartão / Dinheiro)**
  - **Passos:**
    1. Clicar em um agendamento na grade e tocar em **"Concluir Atendimento / Checkout"**.
    2. Verificar os procedimentos listados e o subtotal na `CheckoutDrawer`.
    3. Selecionar a forma de pagamento **PIX** (à vista) e confirmar em **"Finalizar e Receber"**.
  - **Resultado Esperado:** O status do agendamento muda para **Concluído (`COMPLETED` — Cinza)**, uma transação financeira `INCOME` com status `PAID` é gerada no banco local e aparece imediatamente no **Fluxo de Caixa**.

- [x] **`TM-FIN-02` — Ajuste no "Total Final Cobrado" com Rateio Proporcional (Desconto e Acréscimo)**
  - **Pré-condição:** Consulta com 2 procedimentos: Procedimento A (`R$ 100,00`) e Procedimento B (`R$ 300,00`) — Subtotal = `R$ 400,00`.
  - **Passos:**
    1. Na `CheckoutDrawer`, alterar o campo **"Total Final Cobrado"** para `R$ 300,00` (desconto de R$ 100,00 / -25%).
    2. Observar o badge de variação e os valores dos itens.
    3. Alterar o **"Total Final Cobrado"** para `R$ 440,00` (acréscimo de +10%).
  - **Resultado Esperado:**
    - Os preços de tabela originais (`basePriceCents`) continuam visíveis e intocados nos cards dos procedimentos.
    - Com `R$ 300,00`, exibe badge âmbar **`Desconto: - R$ 100,00 (-25.0%)`** e rateia proporcionalmente (`R$ 75,00` e `R$ 225,00`).
    - Com `R$ 440,00`, exibe badge verde **`Acréscimo: + R$ 40,00 (+10.0%)`**.

- [x] **`TM-FIN-03` — Pagamento Parcelado com Entrada Diferenciada e Projeção de Vencimentos**
  - **Passos:**
    1. Em um checkout de `R$ 1.500,00`, selecionar a modalidade **Parcelado**.
    2. Definir Entrada de `R$ 300,00`, número de parcelas = `3x` e informar a data de vencimento da 1ª parcela.
    3. Finalizar o checkout.
  - **Resultado Esperado:** O sistema gera 1 lançamento `PAID` hoje de `R$ 300,00` (Entrada) e 3 lançamentos `PENDING` futuros de `R$ 400,00` cada, com vencimentos projetados automaticamente a cada 30 dias/1 mês a partir da 1ª parcela.

- [x] **`TM-FIN-04` — Agendamento de Retorno Inteligente (`SmartReturnDrawer` — 15 dias, 30 dias, 6 meses)**
  - **Passos:**
    1. No checkout (ou pós-conclusão), acionar **"Agendar Retorno"**.
    2. Tocar no atalho **"Daqui a 30 dias"** (ou `15 dias` / `6 meses`) em um horário livre.
    3. Confirmar o retorno.
  - **Resultado Esperado:** O sistema calcula a data exata (+30 dias no mesmo horário da consulta original) e cria o agendamento de retorno com 1 toque.

### Edge Cases (Casos de Borda)

- [x] **`TM-FIN-05` — [Edge Case] Retorno Inteligente Caindo em Horário Ocupado ou Fim de Semana**
  - **Pré-condição:** Criar previamente um agendamento exatamente 15 dias à frente às `09:00` (ou testar quando +15 dias cai no domingo).
  - **Passos:** Abrir o **Retorno Inteligente** de uma consulta das `09:00` e clicar no atalho **"15 dias"**.
  - **Resultado Esperado:** O sistema **não sobrepõe nem trava**: ele detecta o conflito e exibe automaticamente **3 sugestões inteligentes de horários vagos próximos** para escolha com 1 toque.
  - **Status:** ✅ Corrigido — O modal de remarcação direta (`RescheduleModal`) agora valida ativamente domingo, almoço, horários fora de expediente e choque de horário, bloqueando a confirmação sem a autorização de encaixe via checkbox.

- [x] **`TM-FIN-06` — [Edge Case] Rateio de Centavos com Dízima Periódica (Soma Exata sem Perda de Centavos)**
  - **Passos:** Em uma consulta com 3 procedimentos de `R$ 100,00` (Subtotal `R$ 300,00`), alterar o Total Final Cobrado para `R$ 100,00` e parcelar em `3x` sem entrada.
  - **Resultado Esperado:** A divisão de `R$ 100,00 / 3` atribui o centavo residual à 1ª parcela (`R$ 33,34` + `R$ 33,33` + `R$ 33,33` = `R$ 100,00`), garantindo que a soma contábil nunca divirja em centavos.

- [x] **`TM-FIN-07` — [Edge Case] Validação de Entrada Maior ou Igual ao Valor Total no Parcelamento**
  - **Passos:** Em um checkout de `R$ 500,00` no modo **Parcelado**, digitar uma entrada de `R$ 500,00` ou `R$ 600,00`.
  - **Resultado Esperado:** O formulário valida o limite da entrada, impedindo a geração de parcelas zeradas ou negativas.
  - **Status:** ✅ Corrigido — `InstallmentsForm` agora bloqueia explicitamente entradas maiores ou iguais ao total (`entryCents >= totalCents`), exibindo erro que instrui a utilizar a modalidade à vista caso deseje quitar 100%.

---

## Fase 6: Fluxo de Caixa, Despesas Rápidas e Baixa de Recebíveis (Individual e Lote)

### Casos de Uso Principais

- [x] **`TM-CXA-01` — Lançamento Rápido de Despesa (< 10 Segundos)**
  - **Passos:**
    1. Na aba **Caixa**, clicar em **"+ Nova Despesa"**.
    2. No `QuickExpenseModal`, informar Descrição (`"Resina Composta 3M"`), Valor (`R$ 250,00`), selecionar a categoria **`Material Dentário`** e confirmar.
  - **Resultado Esperado:** A despesa (`EXPENSE`) é salva imediatamente no banco local, reduzindo o **Saldo Líquido / Lucro** exibido nos cards superiores do Caixa.

- [x] **`TM-CXA-02` — Baixa Individual de Parcela Pendente (`ReceivablesList`)**
  - **Passos:** Na lista de **Contas a Receber (Pendentes)** na aba Caixa, clicar em **"Dar Baixa / Receber"** em uma parcela aberta.
  - **Resultado Esperado:** O status da parcela muda instantaneamente de `PENDING` para `PAID` com data de pagamento atual, o valor soma nas **Entradas Realizadas** e a mutação `UPDATE` é enviada para a `sync_outbox`.

- [x] **`TM-CXA-03` — Seleção Múltipla e Baixa em Lote via Bottom Sheet (`BatchSettleModal`)**
  - **Passos:**
    1. Na lista de recebíveis pendentes, marcar os checkboxes de **3 parcelas diferentes**.
    2. Verificar a barra de ação flutuante inferior exibindo a quantidade selecionada e o valor total somado.
    3. Tocar em **"Baixar Selecionadas"**, escolher a forma de pagamento no `BatchSettleModal` e confirmar.
  - **Resultado Esperado:** As 3 parcelas são quitadas em uma única operação atômica no Dexie, a barra de seleção desaparece e o saldo do caixa é atualizado com a soma das 3 parcelas.

- [x] **`TM-CXA-04` — Extrato de Transações com Filtros e Exportação**
  - **Passos:**
    1. No extrato de movimentações do Caixa, filtrar por tipo (**Todas**, **Entradas**, **Saídas**) e por período.
    2. Acionar o botão de **Exportar (CSV)**.
  - **Resultado Esperado:** A lista vertical responsiva filtra os lançamentos corretamente e a exportação gera o arquivo com os dados fiéis ao filtro ativo.

### Edge Cases (Casos de Borda)

- [x] **`TM-CXA-05` — [Edge Case] Impacto de Pendências no Badge do Card de Clientes**
  - **Passos:**
    1. Gerar um parcelamento com parcelas pendentes (`PENDING`) para o paciente `"Carlos Eduardo"`.
    2. Ir até a aba **Clientes** e localizar o card de `"Carlos Eduardo"`.
    3. Voltar ao **Caixa** (ou abrir o Prontuário Financeiro do Carlos), quitar todas as parcelas pendentes dele e retornar à aba **Clientes**.
  - **Resultado Esperado:** Enquanto houver parcela pendente, o card do paciente exibe o alerta **`⚠️ Pendência: R$ X,XX`**. Assim que as parcelas são baixadas, o badge de pendência desaparece automaticamente.

---

## Fase 7: Relatórios Gerenciais, DRE e Reativação de Inativos

### Casos de Uso Principais

- [x] **`TM-REL-01` — Consistência do DRE Simplificado e Previsibilidade (30/60/90 dias)**
  - **Passos:** Acessar a aba **Relatórios** (ou `Caixa`) após registrar entradas pagas, despesas pagas e parcelas futuras para 30 e 60 dias.
  - **Resultado Esperado:** O cálculo **Entradas Realizadas (-) Despesas Pagas (=) Lucro Líquido** bate exatamente com o centavo das transações ativas, e a projeção de recebíveis futuros reflete as parcelas `PENDING` dentro de cada janela temporal.
  - **Status:** ✅ Corrigido — Função `calculateReceivablesProjection` padronizada para usar janelas de 31, 62 e 93 dias no fuso local, cobrindo integralmente as 3 parcelas mensais de R$ 300 (totalizando R$ 900 em 90 dias) mesmo em meses com 31 dias.

- [x] **`TM-REL-02` — Indicador de Taxa de No-Show (Faltas) e Faturamento por Procedimento**
  - **Passos:**
    1. Marcar 1 consulta como `NO_SHOW` em um universo de 4 consultas no período.
    2. Verificar na aba **Relatórios** o card de **Taxa de No-Show** e o ranking de **Desempenho por Procedimento**.
  - **Resultado Esperado:** A taxa de absenteísmo exibe `25%` e o ranking lista os procedimentos ordenados por volume de execução e receita gerada.

- [x] **`TM-REL-03` — Lista de Reativação de Pacientes Inativos (> 180 dias)**
  - **Pré-condição:** Paciente cujo último atendimento foi há mais de 180 dias (6 meses) e que **não** possui agendamento futuro marcado.
  - **Passos:**
    1. Visualizar a seção **"Reativação de Pacientes Inativos"** (`InactivePatientsList`).
    2. Clicar em **"💬 Chamar no WhatsApp"** (verifica o link `wa.me/55...` com mensagem amigável de retorno preventivo).
    3. Clicar em **"+ Agendar"** na linha do paciente inativo.
  - **Resultado Esperado:** O paciente aparece listado com a contagem de dias sem retorno (`X dias sem retorno`). Ao clicar em **"+ Agendar"**, abre a gaveta de agendamento rápido na aba Agenda com o paciente inativo já pré-selecionado.

### Edge Cases (Casos de Borda)

- [x] **`TM-REL-04` — [Edge Case] Remoção Imediata da Lista de Inativos após Agendar Retorno**
  - **Passos:** Agendar uma consulta futura para um paciente que estava na lista de **Pacientes Inativos** e voltar à lista de inativos.
  - **Resultado Esperado:** Como o paciente agora possui um retorno futuro agendado, ele deixa de ser considerado inativo e sai imediatamente da lista de reativação.

---

## Fase 8: Automação WhatsApp (Evolution API, QR Code e Webhooks)

### Casos de Uso Principais

- [x] **`TM-WPP-01` — Pareamento Live via QR Code na Aba Ajustes**
  - **Passos:**
    1. Acessar a aba **Ajustes** com o WhatsApp desconectado.
    2. Clicar em **"Conectar / Atualizar QR Code"**.
    3. Ler o QR Code exibido na tela usando o aplicativo do WhatsApp no celular.
  - **Resultado Esperado:** O QR Code em Base64 é renderizado nitidamente; o polling leve (a cada 3s na aba Ajustes) detecta a leitura, oculta o QR Code, muda o indicador para **Conectado (Verde)** e exibe o número pareado.

- [x] **`TM-WPP-02` — Atualização Automática de Status da Consulta via Resposta do Paciente (Webhook + Sync)**
  - **Passos:**
    1. Ter um agendamento com status `PENDING` (Amarelo).
    2. Simular (ou enviar pelo WhatsApp do paciente) a resposta:
       - Cenário A: Responder `"1"` ou `"Sim"` (ou reagir com 👍).
       - Cenário B: Responder `"2"` ou `"Preciso remarcar"`.
       - Cenário C: Responder texto livre (`"Doutor, posso ir 15 minutos mais tarde?"`).
  - **Resultado Esperado:** O webhook no backend processa a intenção e, no ciclo de sincronização delta em segundo plano (`4s`), o card na grade do frontend muda automaticamente de cor sem precisar recarregar a página:
    - Cenário A ➔ **🟢 Verde (`CONFIRMED`)**
    - Cenário B ➔ **🟠 Laranja (`RESCHEDULE_REQUESTED`)**
    - Cenário C ➔ **🔵 Azul (`MESSAGE_RECEIVED`)**
  - **Status:** ✅ Corrigido — Script interativo `backend/scripts/test-confirmation-flow.ts` agora aceita consultório, paciente e telefone (na ordem direta `<tenant> <paciente> <numero>` ou via flags `--tenant`, `--paciente`, `--numero`), carrega automaticamente o `.env` e evita duplicatas. Comandos suportados:
    ```bash
    # Ordem direta recomendada: <tenant> <paciente> <numero>
    npx tsx backend/scripts/test-confirmation-flow.ts "Consultorio teste" "Teste Whatsapp" 3798231077

    # Ou com flags explícitas:
    npx tsx backend/scripts/test-confirmation-flow.ts --tenant "Consultorio teste" --paciente "Teste Whatsapp" --numero 3798231077

    # Ou passando telefone e paciente:
    npx tsx backend/scripts/test-confirmation-flow.ts 3798231077 "Teste Whatsapp" "Consultorio teste"
    ```

### Edge Cases (Casos de Borda)

- [ ] **`TM-WPP-03` — [Edge Case] Resiliência quando a Evolution API está Indisponível ou QR Code Expira**
  - **Passos:** Tentar atualizar o QR Code ou desconectar o WhatsApp na aba **Ajustes** com o container da Evolution API desligado.
  - **Resultado Esperado:** A interface trata a falha graciosamente sem quebrar o React, mantendo as configurações locais do consultório (expediente/almoço) 100% funcionais.

---

## Fase 9: Configurações do Consultório e Resiliência Offline-First Extrema

### Casos de Uso Principais

- [ ] **`TM-CFG-01` — Customização de Horário de Expediente e Intervalo de Almoço**
  - **Passos:**
    1. Ir na aba **Ajustes**.
    2. Alterar o horário de início/término do expediente (ex: `07:00` às `20:00`) e o intervalo de almoço (ex: `12:00` às `13:30`) e salvar.
  - **Resultado Esperado:** As configurações são persistidas no Dexie (`settings`) e na `sync_outbox`, passando a reger a validação de encaixes fora de horário.

### Edge Cases de Sincronização e Operação Offline (`Local-First`)

- [ ] **`TM-OFF-01` — [Edge Case Crítico] Jornada Completa 100% Offline ("Modo Avião")**
  - **Passos:**
    1. No DevTools (`Network`), marcar a opção **Offline**.
    2. Cadastrar um novo paciente (`"Paciente Offline"`).
    3. Criar um novo procedimento e agendar uma consulta para `"Paciente Offline"`.
    4. Abrir a consulta, realizar o **Checkout Financeiro** parcelado em `2x` com entrada e lançar uma **Nova Despesa**.
    5. Inspecionar a tabela `sync_outbox` no IndexedDB.
    6. Voltar a rede para **Online** e aguardar até 5 segundos.
  - **Resultado Esperado:**
    - Todas as etapas (1 a 4) funcionam com **latência zero (< 5ms)** e sem nenhum erro bloqueante na interface.
    - Todas as mutações ficam enfileiradas na ordem exata (FIFO) na tabela `sync_outbox` com `status = 'PENDING'`.
    - Ao reconectar a internet, o `SyncManager` despacha o lote para `/api/sync/batch`, marca os registros da outbox como sincronizados e o indicador no topo volta para **🟢 Online**.

- [ ] **`TM-OFF-02` — [Edge Case] Resolução de Conflito Concorrente (`Server-Wins`)**
  - **Passos:**
    1. Enquanto o dentista está **Offline** visualizando uma consulta `PENDING`, o paciente responde `"1"` no WhatsApp (o servidor atualiza o status para `CONFIRMED` com timestamp mais recente).
    2. O dentista reconecta à internet.
  - **Resultado Esperado:** Na sincronização bidirecional (Push + Pull Delta), prevalece a autoridade do servidor para status concorrentes mais recentes, atualizando o card local para **🟢 Confirmado**.

---

## Matriz Resumo de Aprovação (Sign-Off de Release)

| Fase | Módulo Avaliado | Total de Testes | Aprovados | Pendentes / Falhas | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Fase 1** | Autenticação, Sessão e Multi-Tenant | 7 | 7 | 0 | ✅ Aprovado |
| **Fase 2** | Navegação Mobile-First e Conectividade | 3 | 3 | 0 | ✅ Aprovado |
| **Fase 3** | Gestão de Clientes & Pacientes | 9 | 9 | 0 | ✅ Aprovado |
| **Fase 4** | Agenda, Timeline e Agendamento Rápido | 10 | 10 | 0 | ✅ Aprovado |
| **Fase 5** | Checkout, Rateio, Parcelas e Retorno | 7 | 7 | 0 | ✅ Aprovado |
| **Fase 6** | Fluxo de Caixa, Despesas e Baixa em Lote | 5 | 5 | 0 | ✅ Aprovado |
| **Fase 7** | Relatórios, DRE e Pacientes Inativos | 4 | 4 | 0 | ✅ Aprovado |
| **Fase 8** | Automação WhatsApp e Pareamento Live | 3 | 2 | 1 | ⏳ Parcial |
| **Fase 9** | Ajustes e Resiliência Offline Extrema | 3 | 0 | 3 | ⏳ Pendente |
| **TOTAL** | **Cobertura End-to-End Manual** | **51** | **47** | **4** | 🚀 92% Concluído |

