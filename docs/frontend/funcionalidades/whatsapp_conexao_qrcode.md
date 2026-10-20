# Funcionalidade: Conexão e Pareamento WhatsApp (Evolution API)

> **Localização:** `docs/frontend/funcionalidades/whatsapp_conexao_qrcode.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:** `src/features/settings/components/`, `src/features/settings/hooks/`, `src/components/layout/TopBar.tsx`

---

## 1. Visão Geral
Interface de gestão da integração do consultório com a Evolution API via WhatsApp. Permite visualizar o status da conexão em tempo real, gerar e ler o QR Code de pareamento, desconectar e testar a automação de mensagens de confirmação de agendamentos.

---

## 2. Componentes Principais
- `SettingsView.tsx`: Tela de ajustes e configurações que abriga o card de Conexão WhatsApp.
- `TopBar.tsx`: Barra superior global que exibe a pílula de conectividade com a Evolution API (Verde = Conectado, Amarelo/Vermelho = Ação necessária).
- Subcomponente de Pareamento / QR Code: Exibição dinâmica da imagem base64 do QR Code gerado pelo backend com contagem regressiva e polling reativo para detectar a leitura pelo smartphone do dentista.

---

## 3. Regras de Interação e Negócio
1. **Polling Resiliente e Desacoplado:**
   - Enquanto a sessão estiver desconectada ou em estado `connecting`/`qrcode`, o frontend realiza polling em intervalos curtos para atualizar o QR Code ou capturar o momento em que a sessão se torna `open`.
   - Assim que o pareamento é concluído, o polling é pausado imediatamente para economizar tráfego.
2. **Feedback Visual Imediato:**
   - Ao ler o QR Code, a interface transiciona sem recarregamento de página para o estado conectado, exibindo o número de telefone pareado e o botão de desconexão segura.
