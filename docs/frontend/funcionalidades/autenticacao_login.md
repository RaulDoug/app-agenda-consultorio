# Funcionalidade: Autenticação, Tela de Login e Gestão de Sessão (Mobile-First)

> **Localização:** `docs/frontend/funcionalidades/autenticacao_login.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:**
> - Apresentação: `src/features/auth/components/` (`LoginScreen`, `ChangePasswordScreen`, `SessionSplash`, `AuthGate`, `LogoutConfirmDrawer`), `src/features/settings/components/ClinicProfileCard`
> - Orquestração: `src/features/auth/hooks/` (`AuthContext`, `useAuth`, `useLoginForm`, `useChangePasswordForm`)
> - Repositório: `src/db/repositories/auth-session-local-repository.ts` (`auth_session`, `sync_metadata`)
> - Sync & API: `src/services/api-client.ts`, `src/services/auth-api.ts`
> - Compartilhado: `@cliniassist/shared` (`LoginRequest`, `LoginResponse`, `ChangePasswordRequest`, `AuthTenantProfile`, `validatePasswordPolicy`)

---

## 1. Visão Geral
A funcionalidade de autenticação é a porta de entrada única do aplicativo OdontoFlow / CliniAssist. Nenhum dado do consultório (agenda, pacientes, financeiro) é acessível sem que haja uma sessão válida e autenticada.

O sistema adota o paradigma **Local-First para a sessão**, armazenando o token JWT, dados do usuário autenticado e perfil do consultório no banco local `IndexedDB` (`Dexie.js`, tabela `auth_session`), permitindo que o dentista continue operando mesmo se abrir o aplicativo offline ou com conexão intermitente após já ter feito login.

---

## 2. Componentes Principais
- `SessionSplash.tsx`: Splash minimalista exibido enquanto a sessão local é lida do Dexie (< 300ms), apresentando gradiente suave da marca e spinner discreto.
- `LoginScreen.tsx`: Tela inicial padrão com design mobile-first e One-Thumb. Contém campo de e-mail (com memorização do último e-mail logado com sucesso), campo de senha com alternância de visibilidade (ícones Eye/EyeOff), botão de submissão com proteção contra duplo clique e banner de erro com mensagens normalizadas e amigáveis.
- `ChangePasswordScreen.tsx`: Tela de troca de senha obrigatória disparada quando o usuário possui a flag `mustChangePassword: true` ou a API responde com código 403 `PASSWORD_CHANGE_REQUIRED`. Valida a política forte de senhas em tempo real (8+ caracteres, letras, números, diferente da atual) e fornece botão "Voltar para o Login".
- `AuthGate.tsx`: Componente de roteamento condicional que intercepta a renderização do `App`. Avalia o status da autenticação (`loading`, `unauthenticated`, `must_change_password`, `authenticated`) e só libera os módulos internos se o status for `authenticated`.
- `LogoutConfirmDrawer.tsx`: Gaveta inferior (*bottom sheet*) de confirmação de logout acionada quando o usuário solicita "Sair da Conta" e existem mutações pendentes na `sync_outbox`. Informa a quantidade exata de pendências que serão perdidas e exige confirmação explícita antes de limpar o banco local.
- `ClinicProfileCard.tsx`: Card fixado no topo da aba de Ajustes apresentando o nome do consultório, badge de administrador/profissional, e-mail do usuário e o botão One-Thumb "Sair da Conta".

---

## 3. Regras de Negócio e Comportamento
1. **Porta de Entrada Obrigatória:**
   - O aplicativo abre direto na tela de login caso não haja sessão válida em IndexedDB.
2. **Memorização de E-mail:**
   - O último e-mail autenticado com sucesso é persistido na chave `last_authenticated_email` de `sync_metadata` e pré-carregado no input de login para facilitar acessos futuros.
3. **Isolamento Multi-Tenant Estrito:**
   - Caso um login seja realizado com um consultório (`tenant.id`) diferente do que estava ativo anteriormente no dispositivo, o repositório local executa a limpeza completa de todas as tabelas (`clearAllData()`) antes de salvar a nova sessão, impedindo vazamento de dados entre consultórios distintos.
4. **Resiliência a Falhas de Rede:**
   - Falhas de rede no primeiro login são exibidas com feedback amigável orientando o usuário a verificar a conexão com a internet.
   - Uma vez autenticado, a sessão local permanece válida para operação offline.
5. **Revalidação em Segundo Plano:**
   - Ao iniciar com sessão local, o `AuthProvider` consulta `/api/auth/me` em segundo plano de forma silenciosa para sincronizar alterações de perfil ou invalidar a sessão caso o token tenha expirado ou sido revogado no backend (erro 401).
6. **Proteção de Outbox no Logout:**
   - Se o usuário tentar sair com alterações pendentes na `sync_outbox`, o sistema alerta com a contagem de itens via `LogoutConfirmDrawer`. Ao confirmar a saída, todo o banco local é expurgado por segurança.
7. **Injeção de Cabeçalhos e Expiração de Sessão:**
   - Todas as requisições autenticadas (incluindo `SyncManager` e `WhatsAppService`) utilizam o header padrão `Authorization: Bearer <token>`. O cabeçalho legado `x-tenant-id` foi descontinuado no cliente.
   - Respostas de erro 401 disparam automaticamente a limpeza da sessão e o retorno para a tela de login, sem corromper a outbox antes da confirmação do usuário.
