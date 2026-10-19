# Spec: Correção do QR Code e Resiliência na Evolution API

> feature: correcao-qrcode-evolution
> status: pronta

## Contexto

Correção definitiva da geração e exibição do QR Code de pareamento do WhatsApp, eliminando fallbacks corrompidos em base64 no backend, garantindo feedback visual amigável (spinner/placeholder) no frontend caso o QR Code esteja em processamento, e limpando instâncias órfãs concorrentes na Evolution API para estabilizar o handshake do Baileys com os servidores do WhatsApp.

## Histórias

### US-051 — Resiliência na Emissão e Renderização do QR Code WhatsApp

Como profissional do consultório utilizando a interface de Ajustes do CliniAssist,
quero visualizar o QR Code íntegro para pareamento com meu celular ou uma indicação clara de carregamento,
para que a tela nunca exiba ícone de imagem corrompida e a sessão seja estabelecida sem interferência de instâncias órfãs.

#### AC-083 — Backend não emite base64 corrompido e retorna qrcode nulo em caso de sessão em processamento

- **Dado** uma requisição de consulta de status de sessão `GET /api/whatsapp/session`
- **Quando** a Evolution API responder com `count: 0`, erro transitório ou sem o campo `base64`
- **Então** o backend deve retornar status HTTP 200 com `connected: false`, `state: 'close'` (ou `'connecting'`) e `qrcode: null`, sem jamais injetar strings base64 corrompidas ou truncadas.

#### AC-084 — Frontend exibe placeholder amigável com spinner e proteção contra falha de imagem

- **Dado** o componente de pareamento do WhatsApp na aba de Ajustes
- **Quando** a propriedade `qrCodeBase64` for nula/vazia ou quando a tag `<img>` disparar o evento `onError`
- **Então** a interface deve renderizar o placeholder com spinner animado e mensagem amigável de aguardo ("Aguardando QR Code / Gerando sessão com a Evolution API..."), prevenindo qualquer renderização de imagem quebrada no navegador.

#### AC-085 — Limpeza de instâncias órfãs e isolamento de sessão única na Evolution API

- **Dado** o container Docker da Evolution API executando instâncias órfãs de testes passados
- **Quando** a rotina de limpeza for executada
- **Então** as instâncias residuais (`test_instance`, `instancia_sorriso`, `instancia_inativa`) devem ser removidas via API da Evolution, restando apenas a instância ativa `cliniassist_default` sem concorrência de reconexão do Baileys.

## Fora de escopo

- Alteração da arquitetura de filas BullMQ ou envio assíncrono de mensagens de lembrete.
- Conexão simultânea de múltiplos números de WhatsApp em um único consultório.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-026 | A Evolution API v2 permite a deleção pontual de instâncias pelo endpoint `DELETE /instance/delete/:instanceName` liberando sockets em memória. | confirmada | Confirmado pela documentação oficial da Evolution API v2. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-026 | Como o frontend deve reagir se a imagem do QR Code sofrer timeout de rede durante o carregamento? | respondida | O evento `onError` da tag `<img>` alternará o estado para exibir o card de carregamento com opção manual de "Atualizar QR Code". |
