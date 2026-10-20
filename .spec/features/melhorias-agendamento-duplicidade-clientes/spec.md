# Spec: Melhorias em Agendamento e Bloqueio de Duplicidade de Clientes

> feature: melhorias-agendamento-duplicidade-clientes
> status: pronta

## Contexto

Garante consistência ergonômica e integridade cadastral no consultório: pré-seleciona horários inteligentes (evitando horários passados e avançando para o dia seguinte após o encerramento), oculta opções desnecessárias de encaixe em horários livres e bloqueia cadastros duplicados de clientes com o mesmo número de WhatsApp.

## Histórias

### US-098 — Pré-seleção Inteligente de Horário e Data ao Agendar

Como profissional ou recepcionista do consultório, quero que a tela de agendamento sugira automaticamente uma data e horário válidos ao abrir, para que eu não precise ajustar manualmente horários que já passaram ou que ultrapassam o expediente.

#### AC-175 — Pré-seleção de data e horário inteligente sem horário passado e com avanço pós-expediente

- **Dado** que o usuário clica para realizar um novo agendamento rápido (via botão principal "+ Novo Agendamento" ou botão de ação rápida) sem ter clicado em um slot específico da grade;
- **Quando** a data base for o dia atual e o horário atual estiver dentro do expediente de funcionamento do consultório;
- **Então** o horário pré-selecionado deve ser o próximo slot de atendimento disponível (arredondado para o próximo múltiplo de 30 minutos ou posterior ao almoço);
- **E** se o horário atual for igual ou posterior ao fechamento do expediente do consultório (18:00), a data pré-selecionada deve avançar para o dia seguinte com o horário configurado para a abertura do consultório (08:00).

---

### US-099 — Exibição da Opção de Encaixe Estritamente sob Demanda

Como usuário do sistema, quero que o controle de encaixe apareça somente quando houver conflito real ou necessidade clínica, para não poluir a interface em agendamentos normais.

#### AC-176 — Ocultação da opção de encaixe em horários regulares livres e exibição estrita sob conflito

- **Dado** que a gaveta de agendamento rápido está aberta com uma data e horário válidos selecionados;
- **Quando** o horário não apresentar sobreposição com outros atendimentos e estiver dentro do expediente normal de trabalho;
- **Então** a opção/checkbox de encaixe não deve ser visível na interface do agendamento;
- **E** somente quando houver conflito de horário (sobreposição) ou horário fora do expediente regular/almoço, o aviso destacado e a opção de permitir encaixe extraordinário devem ser exibidos.

---

### US-100 — Bloqueio de Duplicidade de WhatsApp de Clientes

Como recepcionista do consultório, quero que o sistema me impeça de cadastrar mais de um cliente com o mesmo número de telefone, para manter o histórico de prontuários e agendamentos organizado sem dados duplicados.

#### AC-177 — Bloqueio de cadastro e atualização de cliente com WhatsApp duplicado

- **Dado** que já existe um paciente ativo cadastrado no consultório com um determinado número de WhatsApp;
- **Quando** o usuário tenta cadastrar um novo paciente ou atualizar um paciente existente utilizando o mesmo número de WhatsApp (considerando apenas dígitos numéricos);
- **Então** a operação deve ser bloqueada tanto no repositório local (IndexedDB) quanto na API backend com mensagem clara indicando o nome do cliente já cadastrado com aquele telefone;
- **E** a interface do usuário deve exibir o alerta impeditivo sem fechar o formulário nem enfileirar mutações duplicadas.

## Fora de escopo

- Unificação ou mesclagem automática de prontuários de clientes já cadastrados previamente com números repetidos antes desta regra.
- Alteração nos slots de 30 minutos da grade do calendário.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-055 | O avanço de data para o dia seguinte quando o horário atual ultrapassa o encerramento do consultório define o dia como D+1 e o horário inicial como 08:00 (início padrão de expediente). | confirmada | Confirmado e aprovado pelo usuário na análise prévia. |
| ASM-056 | O bloqueio de duplicidade de clientes considera a comparação dos dígitos numéricos normalizados do WhatsApp (`replace(/\D/g, '')`) entre pacientes ativos (`is_active = true`) do mesmo `tenant_id`. | confirmada | Garante consistência multi-tenant e ignora pontuações ou máscaras de telefone. |

## Perguntas em aberto

Nenhuma.
