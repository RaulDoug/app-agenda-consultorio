# Tasks: Autenticação e Gestão de Usuários

> feature: autenticacao-usuarios

## T-106 — DDL, Schema e Migrations: colunas must_change_password, token_version e password_changed_at [pendente]
- Refs: US-072, US-073, US-074, AC-118, AC-120, AC-122
- Arquivos: backend/src/db/schema.sql, backend/src/db/migrations/001_tenant_auth_columns.sql, backend/scripts/db-migrate.ts
- Notas: Criar migration idempotente, atualizar schema.sql para novos ambientes e criar runner de migração.

## T-107 — Instalação de bcrypt e PasswordService com hash, compare, política e gerador seguro [pendente]
- Refs: US-072, US-073, US-074, AC-118, AC-120, AC-121, AC-122
- Arquivos: backend/package.json, backend/src/services/password-service.ts, backend/src/services/__tests__/password-service.spec.ts
- Notas: Adicionar bcrypt e @types/bcrypt, implementar hash com 10 rounds, comparação segura, gerador de senha temporária e política de validação.

## T-108 — TenantRepository com consultas estritas multi-tenant de autenticação e sessão [pendente]
- Refs: US-072, US-073, US-074, US-075, US-076, AC-118, AC-119, AC-120, AC-122, AC-123, AC-127
- Arquivos: backend/src/repositories/tenant-repository.ts, backend/src/repositories/__tests__/tenant-repository.spec.ts
- Notas: Métodos findByEmail, findById, createTenant, updatePassword (com incremento atômico de token_version) e getSessionState. Zero DELETE físico.

## T-109 — AuthService: regras de negócio de login, changePassword e getProfile [pendente]
- Refs: US-073, US-075, AC-120, AC-121, AC-123, AC-124
- Arquivos: backend/src/services/auth-service.ts, backend/src/services/__tests__/auth-service.spec.ts
- Notas: Desacoplar AuthService de SQL, usando TenantRepository e PasswordService, emitindo JWT com tv e gerando dados cadastrais.

## T-110 — UserAdminService e Scripts CLI de Criação e Reset de Senha [pendente]
- Refs: US-072, US-074, AC-118, AC-119, AC-122
- Arquivos: backend/src/services/user-admin-service.ts, backend/scripts/user-create.ts, backend/scripts/user-reset-password.ts, backend/src/services/__tests__/user-admin-service.spec.ts
- Notas: Implementar CLI com saída limpa de senha temporária e validação de DATABASE_URL obrigatória.

## T-111 — Middleware de Autenticação Endurecido (remoção de x-tenant-id, validação de token_version e 403) [pendente]
- Refs: US-076, AC-125, AC-126, AC-127
- Arquivos: backend/src/middlewares/auth.ts, backend/src/middlewares/__tests__/auth.spec.ts
- Notas: Remover bypass de x-tenant-id, checar token_version no banco a cada request e bloquear rotas de negócio com 403 se must_change_password for true.

## T-112 — Rate Limiter de Login em Memória [pendente]
- Refs: US-075, AC-124
- Arquivos: backend/src/middlewares/login-rate-limiter.ts, backend/src/middlewares/__tests__/login-rate-limiter.spec.ts
- Notas: Bloquear tentativas de login após 5 falhas por IP + email em janela de 15 minutos com HTTP 429.

## T-113 — AuthController, Rotas de Autenticação e Proteção da Rota de Analytics [pendente]
- Refs: US-072, US-073, US-075, US-076, AC-118, AC-120, AC-121, AC-123, AC-124, AC-125, AC-126, AC-127
- Arquivos: backend/src/controllers/auth-controller.ts, backend/src/routes/auth.ts, backend/src/routes/analytics.ts, backend/src/routes/financial.ts, backend/src/app.ts, backend/src/routes/__tests__/auth.routes.spec.ts
- Notas: Conectar rotas ao AuthController, adicionar authMiddleware em analytics.ts e garantir ausência de rotas de registro público.

## T-114 — Migração dos Testes Existentes do Backend para Bearer Token [pendente]
- Refs: US-076, AC-126, AC-127
- Arquivos: backend/src/routes/__tests__/api.spec.ts, backend/src/api-complementar/__tests__/api-complementar.spec.ts, backend/src/analytics/__tests__/analytics.spec.ts, backend/src/financial/__tests__/financial.spec.ts, backend/src/whatsapp/__tests__/whatsapp-live-pairing.spec.ts, backend/src/whatsapp/__tests__/whatsapp-qrcode-resilience.spec.ts
- Notas: Substituir uso de x-tenant-id direto por token JWT assinado com token_version válido inserido no banco para todos os testes passarem no CI.

## T-115 — Documentação de Funcionalidade e Atualização de Regras Globais [pendente]
- Refs: US-072, US-073, US-074, US-075, US-076, AC-118, AC-120, AC-122, AC-123, AC-125, AC-126, AC-127
- Arquivos: docs/backend/funcionalidades/autenticacao_usuarios.md, docs/backend/funcionalidades/regras_globais.md
- Notas: Criar documento detalhado da funcionalidade e atualizar regras globais com as novas diretrizes de autenticação e segurança.
