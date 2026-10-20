# Spec: Autenticacao login frontend

> feature: autenticacao-login-frontend
> status: pronta

## Contexto

Garantir que o aplicativo CliniAssist possua uma porta de entrada segura por autenticação JWT, impedindo qualquer acesso não autorizado aos dados da clínica e permitindo operação contínua e instantânea mesmo offline através de persistência Local-First no Dexie.

## Histórias

### US-092 — Autenticação de Consultório e Porta de Entrada Padrão

Como profissional de saúde ou recepcionista, quero acessar o sistema informando meu e-mail e senha de consultório, para que apenas pessoas autorizadas visualizem a agenda, pacientes e movimentações financeiras.

#### AC-151 — Redirecionamento obrigatório para tela de login quando não há sessão ativa
- **Dado** que o aplicativo é inicializado no navegador ou instalado como PWA
- **Quando** nenhuma sessão de autenticação ativa for encontrada no banco local
- **Então** o sistema exibe obrigatoriamente a tela de Login e não renderiza nenhuma informação de pacientes, agenda ou caixa

#### AC-152 — Submissão de credenciais com normalização de e-mail e autenticação com sucesso
- **Dado** que o usuário preenche seu e-mail e senha cadastrados
- **Quando** clica no botão "Entrar"
- **Então** o e-mail é normalizado (sem espaços e em minúsculas), o botão desabilita contra duplo clique, o token JWT e dados do consultório são salvos no banco local e a tela da Agenda é exibida

#### AC-153 — Apresentação de erro amigável em caso de credenciais inválidas (HTTP 401)
- **Dado** que o usuário informa e-mail ou senha incorretos
- **Quando** a tentativa de login é rejeitada com status 401
- **Então** o sistema exibe a mensagem "Credenciais inválidas ou acesso não autorizado.", mantém o e-mail preenchido no campo e limpa o campo de senha

#### AC-154 — Tratamento de bloqueio por força bruta (HTTP 429) com tempo de espera
- **Dado** que o limite de tentativas incorretas foi excedido
- **Quando** a API retorna status 429
- **Então** a interface exibe a mensagem de bloqueio informando o tempo de espera necessário para novas tentativas

#### AC-155 — Alerta amigável de conexão de rede no primeiro login com repetição
- **Dado** que o dispositivo está sem conexão com a internet durante o primeiro login
- **Quando** o usuário tenta submeter o formulário de login
- **Então** o sistema exibe um banner de alerta amigável informando a ausência de conexão e oferecendo um botão para tentar novamente

#### AC-156 — Alternância de visibilidade da senha (mostrar/ocultar senha)
- **Dado** que o usuário está digitando sua senha
- **Quando** toca no ícone de olho no campo de senha
- **Então** a visibilidade dos caracteres alterna entre texto legível e caracteres ocultos (password)

#### AC-157 — Lembrar último e-mail autenticado com sucesso no formulário
- **Dado** que um consultório já efetuou login ou realizou logout no dispositivo
- **Quando** a tela de login é reaberta
- **Então** o campo de e-mail já vem preenchido com o último e-mail utilizado e o campo de senha vazio

---

### US-093 — Persistência Local-First e Troca Obrigatória de Senha

Como titular do consultório, quero que o aplicativo abra imediatamente sem telas de espera caso eu já esteja logado, e desejo ter uma interface segura para trocar minha senha temporária no primeiro acesso.

#### AC-158 — Abertura direta instantânea (< 5ms) do app quando há sessão salva no Dexie mesmo offline
- **Dado** que existe uma sessão válida previamente salva na tabela `auth_session` do Dexie
- **Quando** o aplicativo é aberto mesmo sem conexão com a internet
- **Então** o sistema carrega diretamente o ambiente do consultório sem bloquear a tela com spinners ou exigir login online

#### AC-159 — Splash minimalista com branding durante a checagem inicial da sessão
- **Dado** que a aplicação está iniciando e verificando a sessão local
- **Quando** o estado inicial é avaliado nos primeiros milissegundos
- **Então** uma transição visual suave com o logotipo do CliniAssist e gradiente da marca é exibida antes da renderização final

#### AC-160 — Revalidação em segundo plano via GET /api/auth/me com atualização de perfil ou logout gracioso
- **Dado** que o usuário está autenticado e o dispositivo está online
- **Quando** a revalidação em background consulta o perfil na API
- **Então** dados atualizados do consultório são sincronizados localmente e, caso o token tenha sido revogado no backend (HTTP 401), a sessão local é encerrada redirecionando para o login

#### AC-161 — Bloqueio e redirecionamento para tela de Troca Obrigatória de Senha quando must_change_password é verdadeiro
- **Dado** que o usuário autentica-se com credencial temporária marcada com `must_change_password: true`
- **Quando** o login é concluído
- **Então** o sistema redireciona obrigatoriamente para a tela de Alteração de Senha, impedindo o acesso aos recursos de negócio

#### AC-162 — Validação da política de senha e cancelamento com retorno seguro ao login
- **Dado** que o usuário está na tela de troca obrigatória de senha
- **Quando** insere a nova senha ou clica em "Voltar para o Login"
- **Então** a política de senha é validada (mínimo 8 caracteres, letra e número, diferente da atual) e a opção de voltar encerra a sessão temporária retornando à tela de login

---

### US-094 — Segurança de Comunicação, Perfil do Consultório e Logout

Como operador do sistema, quero poder visualizar as informações da clínica, encerrar minha sessão com segurança e garantir que as requisições enviadas ao servidor estejam devidamente autenticadas.

#### AC-163 — Requisições do SyncManager e WhatsApp utilizando Authorization Bearer sem x-tenant-id
- **Dado** que o motor de sincronização ou o módulo de WhatsApp realizam chamadas à API
- **Quando** as requisições HTTP são enviadas
- **Então** o cabeçalho `Authorization: Bearer <token>` é anexado e o cabeçalho legado `x-tenant-id` não é enviado

#### AC-164 — Card de Perfil do Consultório na aba Ajustes com exibição de dados e botão de logout
- **Dado** que o usuário acessa a aba de Ajustes
- **Quando** a página é renderizada
- **Então** um card de Perfil do Consultório é exibido no topo com o nome e e-mail da clínica e um botão "Sair da Conta"

#### AC-165 — Confirmação de logout com alerta de mutações pendentes na outbox e limpeza local completa
- **Dado** que o usuário solicita o logout da conta
- **Quando** existem alterações pendentes de sincronização na `sync_outbox`
- **Então** uma gaveta de confirmação avisa sobre a perda dos dados não sincronizados e, ao confirmar, todas as tabelas locais são limpas com `clearAll()` e o sistema retorna ao login

## Fora de escopo

- Criação de telas públicas de auto-cadastro (sign up) ou recuperação pública de senha por e-mail (gerenciados exclusivamente via CLI administrativa no backend).
- Gerenciamento de múltiplos perfis de recepcionistas/dentistas com permissões granulares por tenant.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-048 | O token JWT emitido pelo backend tem validade de 30 dias e a expiração é tratada com retorno ao login | confirmada | Validado com auth-service.ts do backend |
| ASM-049 | O primeiro login no dispositivo exige conectividade de rede ativa | confirmada | Confirmado na entrevista de design |
| ASM-050 | A sessão é persistida em tabela dedicada do Dexie (auth_session) fora da fila sync_outbox | confirmada | Alinhado com a arquitetura Local-First |
| ASM-051 | Frontend e API operam sob a mesma origem via proxy reverso ou Vite dev proxy | confirmada | Configurado no vite.config.ts |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-046 | Onde posicionar o logout e como alertar sobre outbox pendente? | respondida | Card no topo de Ajustes e gaveta de confirmação informando quantidade de itens pendentes |
