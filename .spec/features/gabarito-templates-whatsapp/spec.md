# Spec: Gabarito templates whatsapp

> feature: gabarito-templates-whatsapp
> status: pronta

## Contexto

Na tela de configuração de templates de WhatsApp, os atendentes e dentistas precisam saber exatamente quais variáveis dinâmicas podem ser utilizadas (`{nome}`, `{data}`, `{horario}`) e como funciona a variação de palavras anti-bloqueio (Spintax `{opção1|opção2}`). Atualmente os campos de texto não possuem nenhuma instrução visual ou botão auxiliar, o que dificulta a personalização correta. Esta feature adiciona um painel de gabarito visual, chips para inserção rápida de tags e prévia em tempo real.

## Histórias

### US-128 — Gabarito e Auxiliares de Inserção de Tags nos Templates de WhatsApp

Como atendente ou dentista do consultório, quero visualizar um gabarito explicativo sobre as tags e regras de variação Spintax na tela de edição de templates padrão de WhatsApp, além de botões de inserção rápida e prévia simulada, para que eu possa personalizar as mensagens automáticas com facilidade e sem cometer erros de digitação.

#### AC-227 — Exibição do painel informativo com gabarito de variáveis e regras de Spintax

- **Dado** que o usuário abre a gaveta de templates de WhatsApp (`WhatsappTemplatesDrawer`)
- **Quando** a gaveta é exibida na tela
- **Então** o sistema deve renderizar um card de ajuda contendo o gabarito das variáveis disponíveis (`{nome}`, `{data}`, `{horario}`) e instruções sobre a sintaxe de variação Spintax (`{opção1|opção2}`).

#### AC-228 — Inserção rápida de variáveis e Spintax via botões/chips

- **Dado** que o usuário está visualizando os campos de template na gaveta
- **Quando** ele clica em um dos botões de inserção rápida (ex.: `{nome}`, `{data}`, `{horario}` ou `{opção1|opção2}`)
- **Então** a tag correspondente deve ser inserida automaticamente no campo de texto de template selecionado.

#### AC-229 — Prévia simulada em tempo real da mensagem

- **Dado** que o campo de mensagem inicial contém texto com variáveis dinâmicas e Spintax
- **Quando** o usuário digita ou insere tags no campo
- **Então** o sistema deve exibir uma prévia simulada de exemplo demonstrando como a mensagem será renderizada para o paciente.

## Fora de escopo

- Criação de novos campos de template no banco de dados além dos 4 já existentes.
- Edição de regras de envio de e-mail ou SMS.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-076 | O motor Spintax do backend processa variáveis de paciente e blocos de variação textual. | confirmada | Confirmado pela implementação em `spintax.ts`. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-063 | A prévia deve usar dados simulados estáticos (ex: Carlos, 28/10 às 14:30)? | respondida | Sim, dados fictícios padrão para ilustrar imediatamente o resultado ao usuário. |
