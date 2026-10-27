# Spec: Cards expansiveis templates whatsapp

> feature: cards-expansiveis-templates-whatsapp
> status: pronta

## Contexto

Na gaveta de configuração de mensagens de WhatsApp (`WhatsappTemplatesDrawer`), os quatro templates eram exibidos abertos simultaneamente em uma lista longa, com um único botão de salvar no rodapé da gaveta. Para melhorar a ergonomia e foco visual, cada template passa a ser apresentado em um card expansível/recolhível independente. Ao clicar no card, ele se expande exibindo o campo de texto, atalhos de variáveis, a prévia simulada daquela mensagem e um botão de salvar exclusivo daquele card.

## Histórias

### US-129 — Edição de Templates de WhatsApp com Cards Expansíveis Individuais

Como usuário da Central de WhatsApp, quero que cada template seja editado dentro de um card expansível próprio com campo de edição, prévia e botão de salvar individual, para que a interface fique mais limpa, focada e ágil de manipular.

#### AC-230 — Expansão e recolhimento individual dos cards de template

- **Dado** que a gaveta de templates de WhatsApp está aberta com a lista de mensagens padrão
- **Quando** o usuário clica no cabeçalho de um dos cards de template
- **Então** o card deve expandir revelando sua área de edição (textarea, botões de tags e prévia) e permitir o recolhimento ao ser clicado novamente.

#### AC-231 — Exibição de prévia simulada contextual dentro do card expandido

- **Dado** que um card de mensagem está no estado expandido
- **Quando** o usuário digita ou altera o texto do template
- **Então** deve ser exibido dentro do próprio card expandido o balão de prévia do WhatsApp com simulação em tempo real daquele texto.

#### AC-232 — Botão de salvar individual por card de mensagem

- **Dado** que o usuário alterou o texto de um template dentro do seu card expandido
- **Quando** ele clica no botão "Salvar" exclusivo daquele card
- **Então** o sistema deve invocar a persistência das configurações daquele template e exibir confirmação visual de salvamento.

## Fora de escopo

- Alteração dos nomes das chaves de templates existentes no backend.
- Exclusão de templates padrão (os 4 tipos permanecem fixos).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-077 | Cada card pode ser expandido/recolhido de forma intuitiva, mantendo no cabeçalho um snippet resumido do texto atual quando recolhido. | confirmada | Melhora a visão geral dos 4 templates de uma vez. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-064 | Ao clicar em salvar dentro de um card, a gaveta deve permanecer aberta? | respondida | Sim, permanece aberta exibindo indicador de sucesso no card, permitindo ao usuário editar outros cards se desejar. |
