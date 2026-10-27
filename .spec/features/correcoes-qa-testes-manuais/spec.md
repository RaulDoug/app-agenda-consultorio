# Spec: Correções de QA dos Testes Manuais

> feature: correcoes-qa-testes-manuais
> status: implementada

## Contexto

Correção de 7 comportamentos anômalos identificados durante a execução do roteiro de testes manuais (`Roadmap_Testes_Manuais.md`): ausência de Service Worker para recarregar offline, agendamentos de encaixe fora do expediente ocultos na grade diária, remarcação permitindo choque de horário sem confirmação de encaixe, soft-delete de pacientes ignorado no PostgreSQL, parcelamento aceitando entrada igual ao valor total, projeção de 90 dias omitindo parcelas em meses de 31 dias e duplicação de paciente pelo script de teste WhatsApp.

## Histórias

### US-114 — Resiliência PWA Offline e Tratamento de 401 no Sync

Como usuário do consultório,
quero que a página recarregue mesmo sem conexão à internet e que qualquer token expirado deslogue a aplicação com segurança,
para que o sistema opere verdadeiramente Offline-First e proteja o acesso aos dados clínicos.

#### AC-196 — Carregamento do App Shell em Modo Offline via Service Worker
- **Dado** que a aplicação foi carregada anteriormente e possui o Service Worker registrado
- **Quando** o usuário recarrega a página (`F5`) com a rede em modo desconectado / offline
- **Então** o Service Worker intercepta a navegação e serve o `/index.html` e os ativos estáticos em cache sem exibir o erro do dinossauro do navegador.

#### AC-197 — Deslogar imediatamente quando a sincronização em lote receber 401 Unauthorized
- **Dado** que o consultório está autenticado e o token JWT foi revogado ou adulterado no IndexedDB
- **Quando** o `SyncManager` executa o envio da outbox (`push`) ou busca de deltas (`pull`) e a API responde `HTTP 401`
- **Então** o sistema limpa a sessão local e redireciona o usuário imediatamente para a tela de Login.

---

### US-115 — Visibilidade de Encaixes e Validações de Remarcação na Agenda

Como cirurgião-dentista ou recepcionista,
quero que agendamentos de encaixe fora do horário padrão apareçam na visão diária e que a remarcação direta avise sobre conflitos,
para que eu não perca a visualização de consultas marcadas e não crie sobreposições acidentais ao remarcar.

#### AC-198 — Renderização visível de agendamentos de encaixe fora do expediente na grade diária
- **Dado** que existe um agendamento com `is_extra_fit: true` marcado antes do início ou após o término do expediente regular da clínica
- **Quando** o usuário visualiza a agenda na visão Diária (`viewMode === 'day'`)
- **Então** a grade horária inclui dinamicamente o slot correspondente exibindo o card da consulta com identificação de horário extra.

#### AC-199 — Alerta de encaixe e autorização obrigatória na remarcação direta pelo card
- **Dado** que o usuário abre o modal de remarcação (`RescheduleModal`) a partir de um card de consulta existente
- **Quando** seleciona uma nova data/horário que colide com outra consulta, cai no intervalo de almoço, fora do expediente ou em domingo
- **Então** o modal exibe o aviso destacado de Encaixe e bloqueia o botão de confirmação até que o usuário marque explicitamente o checkbox de autorização de horário extra.

---

### US-116 — Integridade Cadastral de Pacientes e Soft-Delete no Backend

Como operador do sistema,
quero que a exclusão lógica de pacientes seja replicada fielmente no PostgreSQL e que variações de telefone com/sem DDI 55 não dupliquem o cadastro,
para que a base de dados permaneça consistente e livre de pacientes duplicados.

#### AC-200 — Soft-delete de pacientes no endpoint /api/sync/batch preservando deleted_at e is_active no PostgreSQL
- **Dado** que um paciente é excluído logicamente no frontend gerando uma mutação `DELETE` na outbox
- **Quando** o lote é transmitido para `POST /api/sync/batch`
- **Então** o PostgreSQL atualiza o paciente definindo `is_active = false` e preenchendo a coluna `deleted_at` com o timestamp da exclusão.

#### AC-201 — Prevenção de duplicidade de pacientes com e sem DDI 55
- **Dado** que um paciente já está cadastrado com o número de WhatsApp no formato nacional (ex: `3798231077`)
- **Quando** uma tentativa de cadastro ou busca é realizada informando o mesmo número com o prefixo internacional `55` (ex: `553798231077`)
- **Então** o sistema reconhece a equivalência dos números, impedindo a criação de um registro duplicado.

---

### US-117 — Regras Contábeis de Checkout e Projeção de Recebíveis DRE

Como gestor do consultório,
quero que o parcelamento exija valor a parcelar e que a previsão financeira considere trimestres completos,
para que o fluxo de caixa futuro reflita exatamente as parcelas contratadas.

#### AC-202 — Bloqueio estrito de entrada igual ou superior ao total no modo parcelado
- **Dado** que o usuário está no checkout com a opção `PARCELADO` selecionada
- **Quando** digita um valor de entrada igual ou maior que o valor total cobrado
- **Então** o formulário exibe alerta de erro orientativo e desabilita a finalização enquanto o valor da entrada não for estritamente menor que o total.

#### AC-203 — Projeção trimestral de recebíveis (30, 60 e 90 dias) considerando meses de 31 dias
- **Dado** que existem 3 parcelas mensais futuras de R$ 300 cada uma com vencimentos distribuídos ao longo de 3 meses de calendário
- **Quando** a função de projeção de recebíveis (`calculateReceivablesProjection`) é executada
- **Então** os valores acumulados são de R$ 300 em até 30 dias, R$ 600 em até 60 dias e R$ 900 em até 90 dias, mesmo em períodos com meses de 31 dias.

---

## Fora de escopo

- Alteração da biblioteca de componentes ou frameworks visuais.
- Emissão de notas fiscais eletrônicas de serviço (NFS-e).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-064 | A grade diária deve expandir seus slots de forma dinâmica para acomodar agendamentos fora do expediente. | confirmada | Confirmado pelo usuário na pergunta 1. |
| ASM-065 | A projeção de recebíveis de 90 dias deve cobrir os 3 meses de parcelamento mesmo com meses de 31 dias. | confirmada | Confirmado pelo usuário e verificado no cálculo. |
| ASM-066 | Telefones com ou sem DDI 55 representam a mesma linha telefônica para efeitos de unicidade de paciente. | confirmada | Confirmado pelo usuário e alinhado com regras de sanitização. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-054 | Como exibir encaixes fora do expediente na grade diária? | respondida | Expandir a grade diária exibindo os slots onde existem encaixes com badge "Horário Extra". |
| Q-055 | Como tratar a remarcação direta para horários com conflito/fora de expediente? | respondida | Exibir aviso de encaixe e exigir confirmação via checkbox. |
| Q-056 | Qual a estratégia de execução das tarefas? | respondida | Execução sequencial no workspace atual. |
