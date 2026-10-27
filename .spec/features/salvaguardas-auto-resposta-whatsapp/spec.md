# Spec: Salvaguardas auto resposta whatsapp

> feature: salvaguardas-auto-resposta-whatsapp
> status: pronta

## Contexto

Profissionais e clínicas que conectam seu número de WhatsApp ao sistema precisam controlar quem recebe respostas automáticas quando uma mensagem chega no aparelho pareado. Sem esse controle, há risco de responder automaticamente conversas pessoais, fornecedores ou grupos, ou inversamente deixar de acolher novos contatos em números comerciais dedicados. Esta feature adiciona um seletor de 3 opções junto ao card de conexão/QR Code do WhatsApp nos Ajustes ("Apenas Cadastrados", "Todos os Contatos" e "Desativado") e implementa salvaguardas no webhook para filtrar destinatários, bloquear grupos/status, limpar a variável `{nome}` para números sem cadastro e limitar a 1 resposta automática por dia por número.

## Histórias

### US-130 — Configuração de Escopo e Salvaguardas de Resposta Automática no WhatsApp

Como dentista ou gestor do consultório, quero escolher nas configurações do WhatsApp se as respostas automáticas devem ser enviadas apenas para pacientes cadastrados, para todos os contatos que enviarem mensagem ou ficar desativadas, para que eu evite o envio de mensagens automáticas indevidas e personalize o atendimento conforme o perfil do meu número.

#### AC-233 — Seletor de escopo de resposta automática junto ao card de QR Code do WhatsApp

- **Dado** que o usuário acessa a seção "Comunicação e Notificações" na tela de Ajustes (`SettingsView` / `WhatsAppPairingView`)
- **Quando** o card de integração do WhatsApp é exibido (tanto conectado quanto exibindo QR Code)
- **Então** a tela apresenta um botão seletor com 3 opções ("Apenas Cadastrados" como padrão, "Todos os Contatos" e "Desativado") que atualiza as configurações do consultório (`PUT /api/whatsapp/settings`) e exibe confirmação visual imediata.

#### AC-234 — Salvaguarda para modo Apenas Cadastrados (`REGISTERED_ONLY`) e modo Desativado (`DISABLED`)

- **Dado** que o consultório está configurado com escopo `REGISTERED_ONLY` (padrão) ou `DISABLED` (`auto_reply_enabled = false`)
- **Quando** o webhook recebe uma mensagem no WhatsApp do consultório
- **Então** no modo `REGISTERED_ONLY` mensagens de números não cadastrados são ignoradas silenciosamente (`ignored_unknown_number`) sem disparo de réplica, e no modo `DISABLED` nenhuma réplica automática é enviada mesmo para pacientes cadastrados.

#### AC-235 — Acolhimento automático para não cadastrados no modo `ALL` com limpeza de `{nome}` e limite diário

- **Dado** que o consultório está configurado com escopo `ALL` ("Todos os Contatos") e respostas automáticas ativas
- **Quando** um número não cadastrado envia mensagem individual no WhatsApp
- **Então** o sistema envia apenas a réplica de acolhimento (`welcome_fallback_reply_template`) omitindo a tag `{nome}` com limpeza da pontuação adjacente (ex.: `"Olá! Recebemos sua mensagem..."`), grava o log em `whatsapp_messages` (`patient_id = null`, `is_auto_reply = true`) sem inserir o número desconhecido na Central de Fila de consultas, e bloqueia novas réplicas automáticas para o mesmo número no mesmo dia civil.

#### AC-236 — Bloqueio estrito de resposta automática para grupos, listas de transmissão e status

- **Dado** que o webhook recebe um evento de mensagem da Evolution API
- **Quando** o remetente (`remoteJid`) for um grupo (`@g.us`), status/lista de transmissão (`@broadcast`) ou canal (`@newsletter`)
- **Então** o sistema ignora o evento imediatamente (`ignored_group_or_broadcast`) sem enviar qualquer resposta automática, independentemente do escopo configurado.

## Fora de escopo

- Criação automática de cadastro de paciente a partir de números desconhecidos.
- Exibição de conversas de números sem agendamento na Central de Fila de Consultas.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-078 | Contatos não cadastrados no modo `ALL` nunca possuem consulta agendada vinculada, portanto recebem sempre o template de acolhimento (`welcome_fallback_reply_template`), mesmo que enviem "1" ou "2". | confirmada | Impede falsas confirmações de consultas inexistentes. |
| ASM-079 | Mensagens originadas em grupos (`@g.us`), broadcasts (`@broadcast`) e canais (`@newsletter`) nunca devem acionar respostas automáticas do consultório. | confirmada | Salvaguarda crítica para números pessoais/híbridos de profissionais. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-065 | Quais opções devem compor o seletor junto ao card do QR Code? | respondida | 3 opções: "Apenas Cadastrados" (Padrão), "Todos os Contatos" e "Desativado". |
| Q-066 | Como tratar a variável `{nome}` quando o modo "Todos os Contatos" responder a um número não cadastrado? | respondida | Omitir o `{nome}` com limpeza automática da pontuação (ex: "Olá! Recebemos sua mensagem...") para evitar apelidos ou emojis do perfil. |
| Q-067 | O que deve acontecer no painel após responder automaticamente a um contato não cadastrado no modo "Todos os Contatos"? | respondida | Apenas enviar a réplica de acolhimento e gravar no log de auditoria (`whatsapp_messages`), mantendo a Fila exclusiva para pacientes com consulta. |
