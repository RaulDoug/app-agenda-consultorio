# Spec: Pareamento whatsapp live

> feature: pareamento-whatsapp-live
> status: pronta

## Contexto

Correção da inicialização do servidor backend em modo desenvolvimento com TypeScript watch e integração em tempo real do ciclo de vida de conexão com o WhatsApp na Evolution API v2, permitindo pareamento com smartphone físico via QR Code dinâmico, detecção automática de conexão e capacidade de desconexão limpa na aba de Ajustes.

## Histórias

### US-048 — Inicialização Dev com TypeScript Watch

Como desenvolvedor ou operador do CliniAssist,
quero inicializar a API backend em modo desenvolvimento com hot-reload ativo e variáveis de ambiente carregadas,
para que alterações no código sejam recarregadas instantaneamente sem erros de resolução de módulos.

#### AC-079 — Inicialização do backend com tsx watch e flag de ambiente

- **Dado** o comando de inicialização dev configurado no `package.json` do backend
- **Quando** o script `npm run dev:backend` (ou `npm run dev`) for executado
- **Então** o executável `tsx` deve receber `watch` como subcomando primário antes das flags, carregando o `.env` e subindo o servidor HTTP na porta 3000 sem erro `ERR_MODULE_NOT_FOUND`.

---

### US-049 — Gestão de Sessão e Ciclo de Vida na Evolution API

Como consultório odontológico ou profissional de saúde,
quero que o backend consulte e sincronize em tempo real o estado de conexão do WhatsApp na Evolution API e auto-crie a instância caso ainda não exista,
para que o QR Code seja gerado dinamicamente para leitura pelo celular e a desconexão encerre a sessão na API.

#### AC-080 — Consulta de sessão com sincronização do estado e auto-criação de instância para QR Code

- **Dado** uma requisição `GET /api/whatsapp/session` autenticada com tenant válido
- **Quando** a instância WhatsApp for consultada
- **Então** o sistema deve verificar o status na Evolution API; se estiver aberta (`open`), atualiza `tenants.whatsapp_connected = true` no banco; se estiver fechada ou inexistente, auto-cria a instância, solicita o QR Code e retorna `connected: false` com o payload base64 da imagem.

#### AC-081 — Desconexão controlada de instância WhatsApp via API

- **Dado** uma instância de WhatsApp conectada para o consultório
- **Quando** o endpoint `POST /api/whatsapp/disconnect` for acionado
- **Então** o backend deve invocar o endpoint de logout na Evolution API, atualizar `whatsapp_connected = false` na tabela `tenants` do PostgreSQL e retornar confirmação de desconexão.

---

### US-050 — Interface de Pareamento em Tempo Real no Frontend

Como profissional utilizando o CliniAssist no consultório,
quero abrir a aba de Ajustes, visualizar o QR Code real gerado para o meu consultório e ver a tela atualizar para "Conectado" assim que eu escanear pelo celular,
para ter total autonomia e visibilidade sobre a integração de mensagens automáticas.

#### AC-082 — Exibição dinâmica do QR Code e polling reativo de conexão na interface

- **Dado** que o usuário acessa a aba de Ajustes e a integração do WhatsApp está desconectada
- **Quando** a visualização for montada
- **Então** a tela deve exibir a imagem do QR Code obtido do backend e realizar verificação periódica de status, comutando automaticamente para o badge "Conectado (Verde)" assim que o pareamento com o celular for concluído.

## Fora de escopo

- Suporte a múltiplas instâncias de WhatsApp simultâneas para o mesmo tenant (modelo mono-instância por consultório).
- Pareamento por código numérico de 8 dígitos (foco no QR Code visual padrão).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-025 | A Evolution API v2 retorna 404 ao buscar conexão de uma instância que ainda não foi criada, sendo necessário disparar `/instance/create` com o nome da instância. | confirmada | Comportamento padrão verificado na documentação da Evolution API v2. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-025 | Qual o intervalo ideal de polling do frontend na tela de Ajustes enquanto aguarda a leitura do QR Code? | respondida | Intervalo de 3 segundos enquanto a aba de Ajustes estiver visível e desconectada, pausando imediatamente após a conexão ser confirmada. |
