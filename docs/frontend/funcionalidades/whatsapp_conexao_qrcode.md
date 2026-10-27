# Funcionalidade: Conexão e Pareamento WhatsApp (Evolution API) & Central de Fila

> **Localização:** `docs/frontend/funcionalidades/whatsapp_conexao_qrcode.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:** `src/features/settings/components/`, `src/features/settings/hooks/`, `src/features/whatsapp/`, `src/components/layout/TopBar.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/MoreMenuHub.tsx`, `src/components/layout/DesktopSidebar.tsx`

---

## 1. Visão Geral
Interface de gestão da integração do consultório com a Evolution API via WhatsApp e acompanhamento da Central de Fila de Mensagens. Permite visualizar o status da conexão em tempo real, gerar e ler o QR Code de pareamento, desconectar, testar a automação de mensagens de confirmação de agendamentos e monitorar/gerenciar a fila de disparos.

---

## 2. Componentes Principais
- `SettingsView.tsx`: Tela de ajustes e configurações que abriga o card de Conexão WhatsApp.
- `TopBar.tsx`: Barra superior global que exibe a pílula de conectividade com a Evolution API (Verde = Conectado, Amarelo/Vermelho = Ação necessária).
- Subcomponente de Pareamento / QR Code: Exibição dinâmica da imagem base64 do QR Code gerado pelo backend com contagem regressiva e polling reativo para detectar a leitura pelo smartphone do dentista.
- `MoreMenuHub.tsx`: Hub central da aba "Mais" no layout mobile, disponibilizando o card de acesso à "Fila de Envios WhatsApp" (`more-card-whatsapp`).
- `WhatsappQueueView.tsx`: Tela principal da Central de Fila WhatsApp com status da sessão, métricas de envio (pendentes, enviadas, falhas), listagem paginada, filtros por status e ações de reprocessamento manual.
- `BottomNav.tsx`: Barra de navegação inferior mobile (One-Thumb ergonomics) direcionando para o hub `Mais` sem interceptações físicas ou botões invisíveis sobrepostos.
- `DesktopSidebar.tsx`: Barra lateral para telas amplas (desktop) com navegação direta para a aba de Fila WhatsApp.

---

## 3. Regras de Interação e Negócio
1. **Polling Resiliente e Desacoplado:**
   - Enquanto a sessão estiver desconectada ou em estado `connecting`/`qrcode`, o frontend realiza polling em intervalos curtos para atualizar o QR Code ou capturar o momento em que a sessão se torna `open`.
   - Assim que o pareamento é concluído, o polling é pausado imediatamente para economizar tráfego.
2. **Feedback Visual Imediato:**
   - Ao ler o QR Code, a interface transiciona sem recarregamento de página para o estado conectado, exibindo o número de telefone pareado e o botão de desconexão segura.

---

## 4. Navegação e Acesso à Central de Fila WhatsApp
1. **Fluxo Mobile (One-Thumb Ergonomics via MoreMenuHub):**
   - O acesso à Fila de Envios WhatsApp em telas móveis ocorre através do botão "Mais" (`nav-tab-mais`) na barra inferior (`BottomNav`).
   - Ao clicar em "Mais", a visão é alternada para o `MoreMenuHub`, onde o card "Fila de Envios WhatsApp" (`more-card-whatsapp`) dispara a transição para a aba `whatsapp`.
   - A barra `BottomNav` mantém seus botões de navegação com touch targets acessíveis (mínimo de 44x44px) livres de elementos sobrepostos invisíveis que possam interceptar cliques (`pointer-events-none` e `sr-only` para nós de compatibilidade de testes legados).
2. **Fluxo Desktop:**
   - Em telas maiores (>= 768px), a `DesktopSidebar` exibe o item dedicado "Fila WhatsApp" (`sidebar-tab-whatsapp`), permitindo acesso direto sem transitar pelo menu intermediário.

---

## 5. Ações de Resolução de Mensagens e Reagendamento (`WhatsappQueueView.tsx`)
1. **Alternância Dinâmica entre Confirmação e Reagendamento (`AC-220`):**
   - Ao exibir a resposta do paciente no balão de interação:
     - Se o paciente enviou pedido de reagendamento ou agendamento (`RESCHEDULE_REQUESTED` ou texto com intenção de novo horário), o botão 'Confirmar Manualmente' é substituído pelo botão de ação destacada 'Reagendar Consulta' (`btn-resolve-reschedule-${item.appointment_id}`) com ícone de calendário.
     - Se a resposta for uma dúvida comum ou mensagem genérica (`HUMAN_ATTENTION`), o botão permanece como 'Confirmar Manualmente'.
2. **Integração com RescheduleModal (`AC-221`):**
   - Ao tocar em 'Reagendar Consulta', a interface aciona a abertura do `RescheduleModal` repassando o agendamento completo via prop `onOpenReschedule` (ou fallback interno no componente).
   - O profissional escolhe a nova data e horário, confirma a remarcação, e o sistema sincroniza a mutação no banco local e outbox, disparando `runSync` e atualizando a fila em tempo real.
