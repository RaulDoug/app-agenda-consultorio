# Spec: Fundação Frontend — CliniAssist (Sprint FE-0)

> feature: fundacao-frontend
> status: pronta

## Contexto

Configuração da fundação da aplicação Frontend CliniAssist (PWA Mobile-First em React 18 + TypeScript + Vite + Tailwind CSS): tokens de design, layout adaptativo (Mobile Bottom Navigation em telas < 768px e Sidebar lateral em telas >= 768px), manifesto PWA com capacidade offline, e infraestrutura de testes unitários, de componentes e de integração com Vitest, React Testing Library, fake-indexeddb, MSW e Playwright.

## Histórias

### US-027 — Shell Adaptativo e Navegação Mobile/Desktop

Como profissional de saúde ou de serviços, quero uma interface limpa e responsiva que se adapte perfeitamente ao meu smartphone ou computador, para que eu possa alternar de forma intuitiva entre as áreas da minha clínica.

#### AC-049 — Layout Mobile com Bottom Navigation em viewports estreitos
- **Dado** o viewport do navegador com largura menor que 768px (Mobile)
- **Quando** a aplicação for renderizada
- **Então** o sistema deve exibir a barra de navegação inferior (Bottom Navigation) fixa com as abas "Agenda", "Clientes", "Caixa" e "Ajustes", destacando a rota ativa com tamanho de toque de pelo menos 44px, e ocultar a barra lateral (Sidebar).

#### AC-050 — Layout Desktop com Sidebar retrátil em viewports amplos
- **Dado** o viewport do navegador com largura igual ou superior a 768px (Tablet / Desktop)
- **Quando** a aplicação for renderizada
- **Então** o sistema deve exibir a Sidebar lateral esquerda com o logotipo "CliniAssist", nome da clínica, menu vertical de navegação e status de conexão, ocultando a barra de navegação inferior.

---

### US-028 — Identidade Visual e Tokens de Design Semânticos

Como usuário, quero que os elementos visuais, cores e tipografia transmitam profissionalismo, higiene e clareza, facilitando a identificação imediata dos status dos atendimentos.

#### AC-051 — Tokens de design para status da agenda e botões acessíveis
- **Dado** o sistema de tokens Tailwind configurado
- **Quando** qualquer card ou badge de agendamento for exibido
- **Então** o sistema deve aplicar as cores semânticas padronizadas: Verde (#10B981) para CONFIRMED, Amarelo (#F59E0B) para PENDING, Laranja (#F97316) para RESCHEDULE_REQUESTED, Azul (#3B82F6) para MESSAGE_RECEIVED, Cinza (#64748B) para COMPLETED e Vermelho (#EF4444) para NO_SHOW, com contraste adequado e tipografia legível.

---

### US-029 — Configuração PWA e Infraestrutura de Testes Automatizados

Como equipe de desenvolvimento, quero a infraestrutura de testes unitários, testes de componentes e Playwright configurada, juntamente com o manifesto PWA, para assegurar alta qualidade de código e operação instalável offline.

#### AC-052 — Manifesto PWA e suíte de testes com fake-indexeddb e MSW
- **Dado** o ambiente do frontend
- **Quando** o manifesto PWA for inspecionado e a suíte de testes for executada com Vitest
- **Então** o arquivo `manifest.json` deve conter nome "CliniAssist", tema, ícones e display "standalone", e os testes com React Testing Library e fake-indexeddb devem executar com sucesso.

---

## Fora de escopo

- Lógica de sincronização real com Dexie.js e IndexedDB (escopo da Sprint FE-1).
- Grade interativa de drag-and-drop e modal completo de agendamento (escopo da Sprint FE-2).
- Finalização de checkout com split financeiro e pagamento (escopo da Sprint FE-3).

---

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-017 | O aplicativo utiliza Tailwind CSS v3 com suporte a safe-area-inset no mobile e viewport dinâmico (dvh). | confirmada | Garante que a barra inferior não sobreponha a navegação por gestos de smartphones. |

---

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-017 | O layout mobile deve ter indicador visual permanente de status da sincronização/rede no topo? | respondida | Sim, alinhado com o PO na pergunta 11 ("Sim"), indicador visível de status de conexão e sincronização. |
