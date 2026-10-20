# Spec: Autenticação e Gestão de Usuários

> feature: autenticacao-usuarios
> status: pronta

## Contexto

Garantir o controle estrito de acesso e isolamento multi-tenant do consultório no backend, onde a criação de novas contas e a recuperação de acessos são prerrogativas exclusivas do desenvolvedor via CLI, permitindo que o cliente autenticado gerencie sua própria senha com validações seguras via bcrypt, invalidação imediata de sessões prévias e bloqueio contra ataques de força bruta.

## Histórias

### US-072 — Criação de Usuário e Consultório Exclusivamente via CLI pelo Desenvolvedor

Como desenvolvedor e administrador do sistema, quero provisionar contas de consultório exclusivamente através de scripts no servidor, para que não existam superfícies públicas de cadastro descontrolado na API ou no app.

#### AC-118 — Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro
- **Dado** o comando administrativo de criação de usuário executado no terminal com nome e e-mail válidos
- **Quando** o script finalizar o cadastro
- **Então** o registro do consultório é persistido no PostgreSQL com a senha criptografada via `bcrypt` (salt rounds 10), e qualquer requisição externa para `POST /api/auth/register` ou `POST /api/auth/signup` deve retornar `404 Not Found`.

#### AC-119 — Rejeição de e-mails duplicados e validação cadastral na criação
- **Dado** um e-mail que já pertença a outro consultório ativo ou inativo
- **Quando** o desenvolvedor tentar criar uma nova conta com o mesmo e-mail (mesmo com variação de maiúsculas/espaços)
- **Então** o sistema recusa a operação com mensagem clara de duplicidade e não altera os dados existentes.

### US-073 — Troca de Senha Segura pelo Próprio Cliente no App

Como cliente titular de um consultório, quero alterar minha senha de acesso a qualquer momento através das configurações do aplicativo, para manter minhas credenciais seguras e atualizadas.

#### AC-120 — Alteração de senha com política segura e invalidação de tokens anteriores
- **Dado** um cliente autenticado informando a senha atual correta e uma nova senha que atenda à política (mínimo de 8 caracteres, contendo ao menos 1 letra e 1 número, diferente da atual)
- **Quando** ele enviar a requisição para `POST /api/auth/change-password`
- **Então** a senha é atualizada no banco com novo hash bcrypt, o campo `token_version` do tenant é incrementado, a flag `must_change_password` é limpa (`false`), um novo JWT é devolvido e qualquer token anterior perde a validade imediatamente.

#### AC-121 — Rejeição de troca com senha atual incorreta ou descumprimento da política
- **Dado** uma requisição de troca de senha com a senha atual incorreta ou nova senha que não respeite a política
- **Quando** o endpoint `POST /api/auth/change-password` processar o pedido
- **Então** a requisição é rejeitada com status HTTP 401 (para senha atual incorreta) ou HTTP 400 (para violação da política), sem alterar o registro no banco.

### US-074 — Recuperação de Senha com Senha Temporária pelo Desenvolvedor via CLI

Como desenvolvedor, quero resetar a senha de um cliente que perdeu o acesso através de um comando CLI seguro, para que ele receba uma senha temporária e seja obrigado a alterá-la no primeiro acesso.

#### AC-122 — Reset de senha com credencial temporária e exigência de troca obrigatória
- **Dado** um consultório existente com e-mail cadastrado
- **Quando** o desenvolvedor executar o comando de reset de senha no terminal
- **Então** o sistema gera uma senha temporária aleatória segura de 16 caracteres, atualiza o hash no banco, incrementa o `token_version` (derrubando sessões existentes), marca `must_change_password = true` e exibe a credencial uma única vez na saída do terminal.

### US-075 — Login com Bcrypt, Validações Estritas e Proteção contra Força Bruta

Como titular do consultório, quero me autenticar na API com e-mail e senha, para obter um token JWT seguro com acesso aos recursos da minha clínica.

#### AC-123 — Autenticação bem-sucedida gerando JWT com token_version e status cadastral
- **Dado** um consultório ativo e credenciais válidas (e-mail e senha correspondentes ao hash bcrypt)
- **Quando** for enviada uma requisição `POST /api/auth/login`
- **Então** o endpoint retorna status `200 OK` contendo o token JWT (com payload assinado trazendo `tenant_id` e `tv`) e os dados cadastrais do consultório, incluindo o status de `must_change_password`.

#### AC-124 — Rejeição genérica de credenciais inválidas e rate limiting contra força bruta
- **Dado** credenciais com e-mail inexistente, senha incorreta, tenant inativo ou senha igual ao próprio hash
- **Quando** o login for tentado
- **Então** a resposta deve ser invariavelmente `401 Unauthorized` com a mensagem genérica `"Credenciais inválidas ou acesso não autorizado."`, e após 5 tentativas incorretas para o mesmo e-mail/IP em uma janela de 15 minutos, requisições subsequentes devem retornar `429 Too Many Requests`.

### US-076 — Isolamento Multi-Tenant Exclusivo por JWT e Bloqueio de Sessão Obrigatória

Como arquiteto do sistema, quero que o middleware de autenticação rejeite qualquer tentativa de contorno por headers e force a troca de senha temporária, para garantir isolamento absoluto entre consultórios.

#### AC-125 — Bloqueio estrito com HTTP 403 em rotas de negócio sob flag must_change_password
- **Dado** um usuário autenticado com token válido cujo cadastro esteja com `must_change_password = true`
- **Quando** ele tentar acessar qualquer rota de negócio (ex.: agendamentos, pacientes, financeiro)
- **Então** a requisição é bloqueada com status `403 Forbidden` (`code: "PASSWORD_CHANGE_REQUIRED"`), sendo permitido acessar unicamente `POST /api/auth/change-password` e `GET /api/auth/me`.

#### AC-126 — Rejeição de requisições autenticadas apenas com o header x-tenant-id
- **Dado** uma requisição enviada sem o cabeçalho `Authorization: Bearer <token>` válido
- **Quando** ela contiver apenas o header `x-tenant-id`
- **Então** o `authMiddleware` rejeita a requisição com `401 Unauthorized`, impedindo qualquer personificação arbitrária de consultório.

#### AC-127 — Proteção obrigatória com authMiddleware em rotas de analytics e validação de token_version
- **Dado** um token JWT cujo `tv` (token_version) não corresponda ao valor registrado atualmente no banco para aquele tenant
- **Quando** for realizada uma requisição em qualquer rota protegida (incluindo `/api/analytics`)
- **Então** a requisição é imediatamente rejeitada com `401 Unauthorized`, assegurando a invalidação em tempo real após trocas de credenciais.

## Fora de escopo

- Telas ou interfaces visuais do frontend (serão tratadas em sprint de UI/frontend).
- Criação de multiusuários secundários dentro do mesmo consultório (escopo futuro).
- Envio de SMS ou e-mail automatizado transacional (o desenvolvedor entrega a credencial diretamente ao cliente).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-038 | Um consultório equivale a um login titular (`tenants`) no banco de dados. | confirmada | Alinhado via `/grill-me`. |
| ASM-039 | O rate limiting de 5 tentativas em memória atende à volumetria atual em VPS sem necessidade de Redis no momento. | confirmada | Alinhado via `/grill-me`. |
| ASM-040 | A consulta de verificação de `token_version` e `is_active` por requisição autenticada é compatível com o desempenho esperado. | confirmada | Validado na análise técnica. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-038 | Há necessidade de compatibilidade com senhas legadas em SHA-256? | respondida | Não, banco sem tenants legados; senhas nascem em bcrypt. |
| Q-039 | Qual o algoritmo e custo de hash a utilizar? | respondida | `bcrypt` com salt rounds = 10. |
| Q-040 | Qual a política de validação de senha para troca pelo cliente? | respondida | Mínimo 8 caracteres, pelo menos 1 letra e 1 número, diferente da atual. |
