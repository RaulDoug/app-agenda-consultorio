# Especificação de Wireframes & Experiência de Uso (UX Mobile)
## OdontoFlow — Aplicação Mobile-First para Consultórios Odontológicos

---

### 1. Princípios de Design & Ergonomia para o "Dentista-Operador"

1. **Operação com uma só mão (One-Thumb Friendly):**
   * Ações críticas, botões de salvar e atalhos rápidos ficam posicionados no terço inferior da tela do celular.
2. **Zero Fricção de Digitação:**
   * Uso massivo de botões de seleção rápida (chips/pills), campos numéricos pré-formatados e preenchimento automático.
3. **Visibilidade Imediata de Status por Cor:**
   * Cores funcionais universais no calendário para bater o olho e entender o dia sem ler texto:
     * 🟢 **Verde:** Confirmado pelo paciente via WhatsApp.
     * 🟡 **Amarelo:** Aguardando confirmação (mensagem disparada).
     * 🟠 **Laranja:** Paciente solicitou remarcação / Cancelamento.
     * 🔵 **Azul:** Paciente respondeu com texto/dúvida (requer atenção humana).
     * ⚪ **Cinza:** Atendimento concluído.
     * 🔴 **Vermelho:** Faltou (*No-Show*).

---

### 2. Arquitetura de Navegação

A navegação principal do PWA utiliza uma **Bottom Navigation Bar** fixa com 4 seções:
* 📅 **Agenda:** Grade diária/semanal e agendamento rápido (Home).
* 👥 **Pacientes:** Lista de contatos, histórico e filtro de reativação (6+ meses).
* 💰 **Caixa:** Entradas do dia, contas a receber (parcelas), despesas e DRE simples.
* ⚙️ **Ajustes:** QR Code de conexão do WhatsApp, procedimentos e horários de trabalho.

---

### 3. Wireframes Detalhados das Telas Centrais

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

* **Microinterações:**
  * Toque no card: abre a **Ficha de Ação da Consulta**.
  * Toque em horário vago: abre instantaneamente a **Gaveta de Criação Rápida** com a data e horário pré-selecionados.
  * Deslizar a fita de datas horizontalmente: transição fluida entre dias.

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

* **Cálculo de Tempo Automático:** Se marcar *Profilaxia (45m)* e *Restauração (60m)*, o card exibe imediatamente: *Duração Total: 1h45 | Término previsto: 16:45*.

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

---

### 4. Resumo da Eficiência Operacional

| Ação do Dentista | Telas / Toques | Tempo Estimado |
| :--- | :--- | :--- |
| **Criar Agendamento** | 1 modal / 3 toques | ~8 segundos |
| **Concluir + Lançar Entrada + Parcelas** | 1 tela / 4 toques | ~12 segundos |
| **Agendar Retorno com conflito resolvido** | 1 clique no atalho + 1 toque na sugestão | ~4 segundos |
| **Marcar Paciente Faltoso (*No-Show*)** | 1 toque no card | ~1 segundo |
