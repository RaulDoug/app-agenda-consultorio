# Spec: Resiliencia bootstrap sw offline

> feature: resiliencia-bootstrap-sw-offline
> status: pronta

## Contexto

Prevenção do warning de `createRoot` duplicado ao recarregar a página ou sob HMR no Vite, isolando componentes de UI em `App.tsx`, garantindo montagem idempotente da raiz React no `main.tsx` e refatorando o Service Worker para estratégia Network-First com fallback offline seguro e restrito a requisições GET fora de `/api`.

## Histórias

### US-119 — Inicialização Idempotente do React Root e Cache Network-First Seguro no Service Worker

Como desenvolvedor e usuário do sistema,
quero que a inicialização do React reutilize a raiz existente e que o Service Worker priorize a rede quando online sem perder a capacidade de recarregar offline,
para que a aplicação nunca apresente warnings ou bugs de módulos obsoletos e continue funcionando perfeitamente em modo desconectado.

#### AC-207 — Isolamento de AuthenticatedApp em App.tsx e Montagem Idempotente do React Root

- **Dado** que `AuthenticatedApp` está exportado a partir de `App.tsx` e `main.tsx` atua exclusivamente como ponto de entrada imperativo
- **Quando** a rotina de montagem do `main.tsx` for executada uma ou múltiplas vezes sobre o mesmo container `#root` (ex: HMR ou recarga de módulo)
- **Então** `ReactDOM.createRoot` deve ser invocado apenas uma única vez para o elemento `#root`, reutilizando a instância existente via `root.render(...)` sem disparar avisos de duplicidade.

#### AC-208 — Estratégia Network-First com Fallback Offline e Filtro de Segurança no Service Worker

- **Dado** o Service Worker em `frontend/public/sw.js`
- **Quando** interceptar requisições da aplicação
- **Então** deve ignorar métodos diferentes de `GET` e rotas `/api`, buscar prioritariamente da rede quando online (atualizando o cache) e servir os recursos do Cache Storage apenas quando a rede falhar (modo Offline).

## Fora de escopo

- Alteração da lógica de autenticação do AuthGate ou dos hooks do Dexie.
- Modificação dos endpoints de API do backend.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-068 | O componente `AuthenticatedApp` deve residir e ser exportado em `frontend/src/App.tsx`, mantendo `App` como exportação principal compatível com todos os testes existentes. | confirmada | Confirmado pelo usuário e documentado no plano. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-058 | Qual o modo de execução das tarefas da feature? | respondida | Modo sequencial conforme aprovação explícita do usuário. |
