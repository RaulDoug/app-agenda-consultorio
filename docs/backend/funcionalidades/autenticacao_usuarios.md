# Autenticação e Gestão de Usuários / Consultórios — Backend OdontoFlow

> **Módulo:** Autenticação, Identidade e Sessão Multi-Tenant  
> **Arquivo:** `docs/backend/funcionalidades/autenticacao_usuarios.md`  
> **Última Atualização:** 2026-10-20  
> **Feature Spec-Driven:** `autenticacao-usuarios` (AC-118 a AC-127)  

---

## 1. Visão Geral e Finalidade

Este módulo gerencia o ciclo completo de credenciais, identidade e controle de acesso dos consultórios (tenants) no backend OdontoFlow. Ele implementa uma política de segurança estrita voltada para modelo SaaS odontológico:
- **Criação de contas centralizada no desenvolvedor:** Não há tela ou rota de cadastro público para auto-registro de clínicas.
- **Armazenamento criptográfico com bcrypt:** Salt rounds configurado em 10.
- **Recuperação assistida pelo desenvolvedor:** Emissão de senhas temporárias via CLI com obrigatoriedade de troca no primeiro acesso.
- **Troca de senha pelo próprio cliente:** Rota autenticada no app para atualização de senha e invalidação instantânea de sessões anteriores.
- **Segurança multi-tenant estrita:** Isolamento baseado em JWT assinado com `token_version` e bloqueio com `HTTP 403` caso a troca de senha seja obrigatória.

---

## 2. Arquitetura da Funcionalidade (4 Camadas)

A funcionalidade segue com rigor a arquitetura do backend:

```
[CLI Scripts / HTTP Requests]
           │
           ▼
[Routes] backend/src/routes/auth.ts (POST /login, POST /change-password, GET /me)
           │
           ▼
[Controllers] backend/src/controllers/auth-controller.ts (tratamento de req/res, rate limiter)
           │
           ▼
[Services]
   ├── AuthService (login, changePassword, getProfile)
   ├── UserAdminService (createUser, resetPassword via CLI)
   └── PasswordService (bcrypt hash, compare, validação de política, gerador temporário)
           │
           ▼
[Repositories] backend/src/repositories/tenant-repository.ts (findByEmail, findById, create, updatePassword, getSessionState)
           │
           ▼
[PostgreSQL] Tabela `tenants` (colunas must_change_password, token_version, password_changed_at)
```

---

## 3. Regras de Negócio e Comportamento Detalhado

### 3.1 Provisionamento de Consultório / Usuário (CLI)
- **Comando:**
  ```bash
  npm run user:create -- --name "Clínica Dr. Silva" --email "silva@odonto.com" [--password "SenhaOpcional123"]
  ```
- **Regras:**
  1. O e-mail é normalizado (`trim().toLowerCase()`) e deve ser único no banco. E-mails duplicados disparam erro e não criam registro.
  2. Se `--password` não for informado, o sistema gera uma senha temporária aleatória segura de 16 caracteres e marca `must_change_password = true`.
  3. A senha é gravada via hash `bcrypt` (10 rounds). O banco nunca armazena senhas em texto puro.
  4. O `token_version` inicial é `0` e `is_active` é `true`.
  5. **Rotas Públicas Inexistentes:** Requisições a `POST /api/auth/register` ou `POST /api/auth/signup` retornam invariavelmente `404 Not Found`.

### 3.2 Recuperação de Senha pelo Desenvolvedor (CLI)
- **Comando:**
  ```bash
  npm run user:reset-password -- --email "silva@odonto.com"
  ```
- **Regras:**
  1. O sistema localiza o consultório pelo e-mail (ou retorna erro se não existir).
  2. Gera uma senha temporária aleatória de 16 caracteres com maiúsculas, minúsculas, dígitos e símbolos.
  3. Atualiza o `password_hash` no banco, marca `must_change_password = true` e **incrementa atomicamente o `token_version`**.
  4. Derruba imediatamente todas as sessões e tokens JWT anteriores em circulação.
  5. Exibe a credencial temporária uma única vez na saída do console.

### 3.3 Autenticação de Login (`POST /api/auth/login`)
- **Corpo da Requisição:**
  ```json
  {
    "email": "silva@odonto.com",
    "password": "SenhaDoUsuario123"
  }
  ```
- **Regras de Negócio:**
  1. **Proteção contra Força Bruta (Rate Limiting):**
     - Máximo de **5 tentativas falhas** por IP + e-mail em janela de **15 minutos**.
     - A partir da 6ª falha, bloqueia com `HTTP 429 Too Many Requests` (`code: "TOO_MANY_REQUESTS"`).
     - Login com sucesso limpa o histórico de falhas daquele IP/e-mail.
  2. **Resposta Padronizada e Genérica:**
     - Falhas por usuário inexistente, senha incorreta ou consultório inativo (`is_active = false`) retornam `HTTP 401 Unauthorized` com a mensagem idêntica: `"Credenciais inválidas ou acesso não autorizado."`.
  3. **Segurança contra Hash Leak:**
     - `PasswordService.verifyPassword` não aceita senha em texto puro igual ao hash armazenado.
  4. **Emissão de JWT:**
     - O token emitido contém: `{ tenant_id, tv, email, name, user_id }`.
     - Retorna também os dados cadastrais do consultório, incluindo o status de `must_change_password`.

### 3.4 Troca Autenticada de Senha (`POST /api/auth/change-password`)
- **Autenticação:** Exige `Authorization: Bearer <token_jwt>`. Aceita tanto tokens normais quanto tokens com `must_change_password = true`.
- **Corpo da Requisição (suporta snake_case e camelCase):**
  ```json
  {
    "current_password": "SenhaAtual123",
    "new_password": "NovaSenhaForte2026"
  }
  ```
- **Regras de Validação:**
  1. Senha atual incorreta: rejeita com `HTTP 401 Unauthorized` (`"Senha atual incorreta."`).
  2. Política de senha: nova senha deve conter no mínimo 8 caracteres, ao menos uma letra e ao menos um número. Caso contrário, retorna `HTTP 400 Bad Request`.
  3. Reutilização imediata: a nova senha deve ser diferente da atual (`HTTP 400`).
- **Efeito no Banco:**
  1. Atualiza `password_hash` com novo hash bcrypt.
  2. Define `must_change_password = false`.
  3. Atualiza `password_changed_at = CURRENT_TIMESTAMP`.
  4. **Incrementa atomicamente `token_version = token_version + 1`**.
  5. Retorna um **novo token JWT** assinado já contendo o novo `tv`.
  6. **Invalidação:** Qualquer requisição utilizando o token JWT anterior falhará com `HTTP 401` em todas as rotas da API.

### 3.5 Consulta de Perfil e Estado de Sessão (`GET /api/auth/me`)
- **Autenticação:** `Authorization: Bearer <token_jwt>`.
- **Retorno (200 OK):**
  ```json
  {
    "tenant": {
      "id": "uuid-do-consultorio",
      "name": "Clínica Dr. Silva",
      "email": "silva@odonto.com",
      "must_change_password": false,
      "whatsapp_instance_name": "instancia_silva",
      "whatsapp_connected": true
    }
  }
  ```

### 3.6 Middlewares e Políticas de Proteção

#### 1. `authMiddleware`
- **Validação de Token:** Verifica a assinatura do JWT (`jwt.verify`).
- **Validação de Versão em Tempo Real:** Consulta `TenantRepository.getSessionState(tenantId)`. Se `tenant.token_version !== payload.tv`, rejeita com `HTTP 401` (`"Sessão expirada devido a alteração de credenciais. Faça login novamente."`).
- **Validação de Ativação:** Se `tenant.is_active` for falso, rejeita com `HTTP 401`.
- **Bloqueio Obrigatório (`must_change_password`):**
  - Se `tenant.must_change_password === true`, o middleware bloqueia a requisição com `HTTP 403 Forbidden` (`code: "PASSWORD_CHANGE_REQUIRED"`).
  - Rotas de negócio (pacientes, agenda, financeiro, relatórios, WhatsApp) ficam totalmente inacessíveis até que a senha seja trocada.
- **Proibição de Bypass:** O cabeçalho `x-tenant-id` **não** é aceito como substituto do token JWT. Requisições sem `Authorization: Bearer` retornam `401`.

#### 2. `authAllowPasswordChange`
- Variante do middleware de autenticação aplicada especificamente na rota `POST /api/auth/change-password` e `GET /api/auth/me`.
- Realiza todas as validações de integridade, `token_version` e `is_active`, mas **não** bloqueia caso `must_change_password` seja `true`, permitindo que o usuário conclua a alteração da sua credencial.

#### 3. Proteção Global em Rotas de Analytics
- O arquivo `backend/src/routes/analytics.ts` foi blindado com `router.use(authMiddleware)`. Todas as rotas de métricas, no-show, DRE, fluxo de caixa e relatórios exigem token válido.

---

## 4. Scripts e Executáveis Disponíveis

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| **Migração do Banco** | `npm run db:migrate` | Executa migrations pendentes no PostgreSQL configurado em `DATABASE_URL`. |
| **Criação de Usuário** | `npm run user:create -- --name "..." --email "..."` | Provisiona um novo consultório com hash bcrypt e validação de e-mail único. |
| **Reset de Senha** | `npm run user:reset-password -- --email "..."` | Reseta a senha, gera credencial temporária, derruba sessões e marca troca obrigatória. |

---

## 5. Arquivos e Testes Relacionados

| Camada / Arquivo | Teste Associado | Cobertura |
| :--- | :--- | :--- |
| `backend/src/services/password-service.ts` | `password-service.spec.ts` | Hash bcrypt, compare, política de 8 chars/letra/número, gerador temporário. |
| `backend/src/repositories/tenant-repository.ts` | `tenant-repository.spec.ts` | `findByEmail`, `findById`, `create`, `updatePassword` atômico, `getSessionState`. |
| `backend/src/services/auth-service.ts` | `auth-service.spec.ts` | Lógica de `login`, `changePassword`, `getProfile`, emissão de JWT com `tv`. |
| `backend/src/services/user-admin-service.ts` | `user-admin-service.spec.ts` | Validações de provisionamento e recuperação de credenciais via CLI. |
| `backend/src/middlewares/auth.ts` | `auth.spec.ts` | Rejeição sem token, verificação de `token_version`, bloqueio 403 por `must_change_password`. |
| `backend/src/middlewares/login-rate-limiter.ts` | `login-rate-limiter.spec.ts` | 5 tentativas falhas por IP/e-mail, bloqueio 429 por 15 minutos, limpeza no sucesso. |
| `backend/src/controllers/auth-controller.ts` | `auth.routes.spec.ts` | Rotas `/api/auth/login`, `/api/auth/change-password`, `/api/auth/me`. |
| `backend/src/routes/__tests__/autenticacao-usuarios.spec.ts` | `autenticacao-usuarios.spec.ts` | Prova mecânica dos critérios spec-driven **AC-118 a AC-127**. |

---

## 6. Orientações para Futuras Tarefas e IAs

1. **Nunca recrie rotas de cadastro público:** Toda criação de tenant continuará sendo conduzida via CLI (`UserAdminService`).
2. **Ao criar novas rotas no backend:** Sempre anexe `authMiddleware` na rota ou no roteador, e utilize `req.tenantId` (garantido pelo token) para filtrar consultas SQL no repositório.
3. **Ao escrever testes:** Utilize o utilitário `seedTestTenant(db)` em `backend/src/test-utils/auth.ts` ou gere tokens via `generateTestToken({ tenant_id, tv: 0 })`. Nunca envie requisições usando apenas `x-tenant-id`.
