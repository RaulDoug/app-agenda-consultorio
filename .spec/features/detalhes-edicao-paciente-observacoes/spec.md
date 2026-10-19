# Spec: Detalhes, Observações Clínicas e Edição de Pacientes

> feature: detalhes-edicao-paciente-observacoes
> status: pronta

## Contexto

Na gestão diária de consultórios, profissionais e recepcionistas precisam:
1. Identificar visualmente quais clientes possuem anotações e observações clínicas relevantes cadastradas.
2. Acessar com facilidade os detalhes completos e anotações do cliente expandindo o card de forma intuitiva.
3. Conseguir editar o cadastro de pacientes existentes (nome, WhatsApp, observações) a partir do próprio card.
4. Ter visibilidade imediata das observações clínicas no momento em que selecionam um paciente durante o agendamento de uma consulta.

## Histórias

### US-067 — Visualização Expandida de Detalhes e Observações Clínicas no Card de Paciente

Como recepcionista ou profissional de saúde,
quero ver um indicador visual no card do paciente quando houver observações e poder clicar no card para expandir seus detalhes,
para consultar as notas clínicas e histórico do cliente sem sair da tela.

#### AC-110 — Ícone Indicativo de Observações no Card do Paciente

- **Dado** que a lista de pacientes é exibida na tela de Clientes
- **Quando** um paciente possui o campo de observações (`notes`) preenchido com texto não vazio
- **Então** o card desse paciente deve exibir um ícone/badge indicativo de observações clínicas (`data-testid="badge-notes-{id}"`)
- **E** para pacientes sem observações cadastradas, esse badge não deve ser exibido.

#### AC-111 — Expansão Interativa do Card do Paciente com Detalhes e Observações

- **Dado** que um card de paciente está na visualização padrão recolhida
- **Quando** o usuário clica no corpo do card
- **Então** o card deve se expandir suavemente exibindo o bloco de observações clínicas (`data-testid="patient-notes-content-{id}"`), detalhes cadastrais e o botão de edição
- **E** ao clicar novamente no card, ele deve retornar ao estado recolhido.

### US-068 — Edição do Cadastro de Pacientes

Como gestor ou recepcionista do consultório,
quero poder editar os dados e observações de um paciente já cadastrado,
para manter a base de clientes atualizada com novas preferências ou correções.

#### AC-112 — Ação de Edição no Card Expandido com Persistência no Banco Local

- **Dado** que o card do paciente está expandido na tela de Clientes
- **Quando** o usuário clica no botão "Editar Cadastro" (`data-testid="btn-edit-patient-{id}"`)
- **Então** o modal de paciente deve abrir em modo de edição com o título "Editar Paciente", os dados atuais pré-carregados (Nome, WhatsApp e Observações) e o botão "Salvar Alterações"
- **E** ao submeter alterações válidas, os dados devem ser atualizados no repositório IndexedDB (`patientRepo.updatePatient`) e refletir instantaneamente na interface.

### US-069 — Exibição Contextual das Observações do Paciente no Agendamento Rápido

Como profissional ao realizar um agendamento rápido de consulta,
quero visualizar imediatamente as observações clínicas do paciente selecionado,
para estar ciente de restrições ou preferências do paciente no momento de marcar a consulta.

#### AC-113 — Bloco de Observações Clínicas na Gaveta de Agendamento

- **Dado** que a gaveta de agendamento rápido está aberta
- **Quando** um paciente que possui observações cadastradas é selecionado no formulário
- **Então** deve ser exibido um destaque informativo (`data-testid="selected-patient-notes"`) com o texto das observações clínicas logo abaixo dos dados do paciente.

## Fora de escopo

- Exclusão física permanente (soft delete) com expurgo de prontuários.
- Anexos de imagens radiográficas no cadastro do paciente.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-035 | O campo de observações permanece opcional no cadastro e na edição do paciente | confirmada | Aceita string vazia ou nulo |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-035 | Nenhuma pergunta em aberto | respondida | Especificação validada e aprovada pelo usuário |
