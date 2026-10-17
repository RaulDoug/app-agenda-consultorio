# Especificação de Arquitetura Local-First & UX Mobile — Frontend
## OdontoFlow — Aplicação PWA em React, Dexie.js (IndexedDB) e Wireframes Mobile

---

### 1. Arquitetura Técnica do Frontend (PWA & Local-First)

O frontend do **OdontoFlow** foi desenhado como uma aplicação **Local-First (Offline por Padrão)**: todas as leituras e escritas da interface acontecem diretamente no banco local do dispositivo (`IndexedDB` via `Dexie.js`) em menos de **5 milissegundos**, garantindo fluidez instantânea mesmo em salas de atendimento sem sinal de internet.

```mermaid
flowchart LR
    subgraph Dispositivo ["Smartphone / Desktop do Dentista"]
        UI["Componentes React 18 + Tailwind CSS"]
        HOOKS["useLiveQuery (Reatividade Instantânea)"]
        DEXIE[("Banco Local IndexedDB (Dexie.js)")]
        OUTBOX[("Fila de Sincronização (sync_outbox)")]
        SW["Service Worker (Cache Offline do App)"]

        UI -->|Leitura < 5ms| HOOKS
        HOOKS <--> DEXIE
        UI -->|Escrita Otimista| DEXIE
        DEXIE -->|Registra mutação| OUTBOX
    end

    subgraph Nuvem ["Servidor VPS (Quando Online)"]
        API["API Express.js (/api/sync/batch)"]
    end

    OUTBOX -->|Background Sync / Reconexão| API
    API -->|Delta de atualizações (Webhooks WhatsApp)| DEXIE
```

---

### 2. Stack Tecnológica do Frontend

* **Framework & Build:** **React 18+ com TypeScript e Vite** (geração de bundle estático ultraleve servido pelo Nginx).
* **Contrato Compartilhado:** Importação direta de tipos e interfaces do pacote `@odontoflow/shared`.
* **Estilização:** **Tailwind CSS** (foco em *One-Thumb Ergonomics* para celulares e layout responsivo adaptável para desktop).
* **Camada PWA:** `vite-plugin-pwa` com estratégia *Stale-While-Revalidate* para assets e instalação nativa na tela inicial (iOS e Android) + Web Push Notifications.
* **Banco de Dados Local:** **Dexie.js** sobre **IndexedDB**:
  * Tabelas locais espelhadas: `patients`, `procedures`, `appointments`, `appointment_items`, `financial_transactions`, `business_hours`, `schedule_blocks`, `sync_outbox`.
  * **Janela Ativa de Cache:** Mantém localmente o catálogo completo + últimos 90 dias de agenda + 100% dos agendamentos futuros + financeiro do ano corrente (~2,5 MB por ano).
* **Stack de Testes do Frontend (TDD):**
  * **Vitest** + **React Testing Library** + **@testing-library/user-event**.
  * **fake-indexeddb:** Emulação 100% fiel do IndexedDB em memória para testar o Dexie.js e a fila offline antes de construir a interface.
  * **MSW (Mock Service Worker):** Simulação da API do backend e cenários de queda de internet.
  * **Playwright:** Testes End-to-End (E2E) simulando viewport mobile e modo avião.

---

### 3. Princípios de Design & Ergonomia para o "Dentista-Operador"

1. **Operação com uma só mão (One-Thumb Friendly):**
   * Botões primários, gavetas (bottom sheets) e barra de navegação posicionados no terço inferior da tela.
2. **Zero Fricção de Digitação:**
   * Uso de chips/pills de seleção rápida, busca preditiva unificada e criação *on-the-fly* de pacientes e procedimentos sem sair do modal.
3. **Indicador de Conectividade e WhatsApp no Topo:**
   * 🟢 **Online:** Sincronizado.
   * 🟡 **Offline (X pendentes):** Operando normalmente no banco local; sincroniza automaticamente ao reconectar.
   * 📱 **Status do WhatsApp:** Verde quando conectado; banner de alerta caso a sessão QR Code precise ser reconectada.
4. **Visibilidade Imediata de Status por Cor nos Cards da Agenda:**
   * 🟢 **Verde:** Confirmado pelo paciente via WhatsApp.
   * 🟡 **Amarelo:** Aguardando confirmação (mensagem disparada).
   * 🟠 **Laranja:** Paciente solicitou remarcação / Cancelamento.
   * 🔵 **Azul:** Paciente respondeu com texto/dúvida (requer atenção humana).
   * ⚪ **Cinza:** Atendimento concluído.
   * 🔴 **Vermelho:** Faltou (*No-Show*).
   * ⚡ **Selo de Encaixe:** Destaque sutil quando agendado fora do expediente regular.

---

### 4. Wireframes Base das Telas Principais

---

#### Tela 1: Timeline Diária da Agenda (Home Mobile)

```text
+-------------------------------------------------------------+
| [≡] OdontoFlow          🟢 Online  | 📱 WhatsApp Conectado |
+-------------------------------------------------------------+
|  Outubro, 2026                     [ <  Hoje: 17 Sáb  > ]   |
|  [15 Qui]   [16 Sex]   [ 17 SÁB ]   [19 Seg]   [20 Ter]     |
|     •          ••          •••         •          ••        |
+-------------------------------------------------------------+
| 08:00 |                                                     |
| 08:30 |                                                     |
| 09:00 | +-------------------------------------------------+ |
|       | | 🟢 09:00 - 09:45  •  R$ 250                     | |
|       | | **Mariana Costa**                               | |
|       | | Profilaxia (Limpeza)          [💬 Zap]  [⋮ Mais] | |
|       | +-------------------------------------------------+ |
| 09:45 |                                                     |
| 10:00 | +-------------------------------------------------+ |
|       | | 🟠 10:00 - 11:30  •  R$ 800  [⚠️ Pediu Remarcar] | |
|       | | **Roberto Nunes**                               | |
|       | | Endodontia (Canal)            [💬 Zap]  [⋮ Mais] | |
|       | +-------------------------------------------------+ |
| 11:30 |                                                     |
| 12:00 | [ - - - - - - - - - ALMOÇO - - - - - - - - - - - ]  |
| 14:00 | +-------------------------------------------------+ |
|       | | 🟡 14:00 - 15:00  •  R$ 350                     | |
|       | | **Carla Silva** (Aguardando resposta WhatsApp)  | |
|       | +-------------------------------------------------+ |
| 15:00 | [ + Tocar para agendar neste horário vago ]        |
| 16:00 |                                                     |
+-------------------------------------------------------------+
|                                                      [ + ]  | (FAB Criar)
+-------------------------------------------------------------+
|   [📅 Agenda]     [👥 Pacientes]     [💰 Caixa]     [⚙️ Ajustes]  |
+-------------------------------------------------------------+
```

---

#### Tela 2: Gaveta de Criação Rápida (< 10 Segundos)

```text
+-------------------------------------------------------------+
| (—) Novo Agendamento                        [ X Fechar ]    |
+-------------------------------------------------------------+
| Data: Sábado, 17/10    Horário de início: [ 15:00 ▼ ]       |
|                                                             |
| PACIENTE                                                    |
| [ 🔍 Digite o nome ou WhatsApp...                         ] |
| ↳ Sugestões:                                                |
|   • Carlos Drummond (11 98888-7777)                         |
|   • [+ Cadastrar novo: "Carlos Eduardo" | WhatsApp: [     ] ]|
|                                                             |
| PROCEDIMENTOS (Selecione 1 ou mais)                         |
| [✓ Profilaxia (45m)]  [+ Restauração (60m)]  [+ Canal (90m)]|
| [+ Clareamento]       [+ Criar Novo Procedimento...]        |
|                                                             |
| RESUMO DO TEMPO E VALOR                                     |
| ⏱ Duração: 45 min  ➔ Término previsto: 15:45               |
| 💵 Valor Padrão: R$ 250,00                                  |
|                                                             |
| OBSERVAÇÕES (Opcional)                                      |
| [ Dente 36 sensível...                                    ] |
|                                                             |
| +---------------------------------------------------------+ |
| |                  [ SALVAR AGENDAMENTO ]                 | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

* **Soft Warning de Encaixe:** Se o horário selecionado ou o término ultrapassar o expediente regular do dia (ex: após as 18:00), exibe um aviso amigável perguntando se deseja confirmar como **⚡ Encaixe Extraordinário**, sem bloquear o dentista.

---

#### Tela 3: Conclusão de Atendimento & Caixa ("Checkout do Dentista")

```text
+-------------------------------------------------------------+
| (—) Concluir Atendimento: Mariana Costa                     |
+-------------------------------------------------------------+
| PROCEDIMENTOS REALIZADOS (Clique no valor para editar)      |
| • Profilaxia (Limpeza)                   R$ [ 200,00 ]      |
| • Restauração Resina (Dente 24)          R$ [ 250,00 ]      |
| ----------------------------------------------------------- |
| Subtotal Padrão: R$ 450,00                                  |
| TOTAL FINAL COBRADO:                     R$ [ 400,00 ]      |
| 💡 Desconto de R$ 50 rateado proporcionalmente entre os itens|
|                                                             |
| FORMA DE PAGAMENTO                                          |
| ( ) Pix     (•) Cartão de Crédito     ( ) Dinheiro          |
|                                                             |
| CONDIÇÃO DE PAGAMENTO                                       |
| ( ) À Vista                                                 |
| (•) Parcelado com Entrada:                                  |
|     Entrada (Hoje):                      R$ [ 100,00 ]      |
|     Restante parcelado em:               [ 3x ▼ ]           |
|     Valor de cada parcela:               R$ 100,00          |
|     Vencimento da 1ª Parcela:            [ 17/11/2026 📅 ]  |
|                                                             |
| Projeção das Parcelas:                                      |
|   • Entrada: R$ 100 (Recebido Hoje via Pix)                 |
|   • Parcela 1: R$ 100 em 17/11/2026 (A Receber)             |
|   • Parcela 2: R$ 100 em 17/12/2026 (A Receber)             |
|   • Parcela 3: R$ 100 em 17/01/2027 (A Receber)             |
|                                                             |
| +---------------------------------------------------------+ |
| |               [ CONFIRMAR & FINALIZAR ]                 | |
| +---------------------------------------------------------+ |
| |             [ 🔁 FINALIZAR & AGENDAR RETORNO ]           | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

---

#### Tela 4: Modal Inteligente de Retorno Rápido (com Detecção de Conflito)

```text
+-------------------------------------------------------------+
| Agendar Retorno: Mariana Costa                              |
+-------------------------------------------------------------+
| Escolha o prazo sugerido:                                   |
| [ Em 15 dias ]   [ Em 30 dias ]   [ Em 6 meses ]   [ Livre ]|
|                                                             |
| *O dentista tocou em [ Em 15 dias ] (Alvo: 01/Nov às 09:00)*|
|                                                             |
| ⚠️ ATENÇÃO: Domingo, 01/Nov às 09:00 está fora do expediente|
|                                                             |
| SUGESTÕES DE HORÁRIOS VAGOS MAIS PRÓXIMOS:                  |
| +---------------------------------------------------------+ |
| | (•) Opção 1: Segunda, 02/Nov às 09:00 (Recomendado)     | |
| | ( ) Opção 2: Segunda, 02/Nov às 10:00                   | |
| | ( ) Opção 3: Terça, 03/Nov às 09:00                     | |
| +---------------------------------------------------------+ |
| Procedimento: [ Retorno / Avaliação (30 min) ▼ ]            |
|                                                             |
| +---------------------------------------------------------+ |
| |                [ CONFIRMAR AGENDAMENTO ]                | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

---

#### Tela 5: Gestão Financeira & Caixa ("Caixa de Bolso")

```text
+-------------------------------------------------------------+
| Caixa & Finanças                               [ + Despesa ]|
+-------------------------------------------------------------+
| RESUMO DO MÊS (OUTUBRO)                                     |
| +-------------------------+ +-----------------------------+ |
| | 💵 Entrou no Caixa      | | ⏳ A Receber no Mês         | |
| | R$ 14.850,00            | | R$ 5.400,00 (Parcelas)      | |
| +-------------------------+ +-----------------------------+ |
| | 🔻 Despesas Pagas       | | 🚀 Lucro Líquido Real       | |
| | R$ 3.200,00             | | R$ 11.650,00                | |
| +-------------------------+ +-----------------------------+ |
|                                                             |
| ABAS: [ Entradas de Hoje ]  [ Próximas Parcelas ]  [ Despesas]|
|                                                             |
| ENTRADAS DE HOJE (Sáb, 17/10) - Total: R$ 550,00            |
| • 09:45  Mariana Costa (Profilaxia)         R$ 200,00 [Pix] |
| • 11:30  Roberto Nunes (Entrada Canal)      R$ 350,00 [Pix] |
|                                                             |
| PRÓXIMAS PARCELAS A VENCER ESTA SEMANA                      |
| • 20/Out  João Souza (Parcela 2/3)       R$ 300,00 [Cartão] |
| • 22/Out  Ana Beatriz (Parcela 3/3)      R$ 150,00 [Boleto] |
+-------------------------------------------------------------+
```
