# Funcionalidade: Relatórios Gerenciais e Fluxo de Caixa

> **Localização:** `docs/frontend/funcionalidades/relatorios_fluxo_caixa.md`  
> **Status:** Ativo / Implementado  
> **Camadas Envolvidas:** `src/features/analytics/components/`, `src/db/repositories/financial-local-repository.ts`

---

## 1. Visão Geral
Módulo de inteligência analítica e acompanhamento financeiro do consultório. Apresenta resumos de faturamento, comparativos de despesas versus receitas, métricas de ocupação de agenda e identificação proativa de pacientes inativos há mais de 6 meses para campanhas de retorno.

---

## 2. Componentes Principais
- `ReportsView.tsx`: Visão agregadora acessada pelo menu principal/hub.
- `CashFlowDashboard.tsx`: Dashboard financeiro com cartões de entradas, saídas, saldo previsto, gráficos sintetizados e aba do Extrato (Livro Caixa).
- `FinancialLedger.tsx`: Extrato detalhado (Livro Caixa) com lista vertical de movimentações, filtros avançados por período (Data Inicial e Data Final), busca textual normalizada e exportação CSV.
- `InactivePatientsList.tsx`: Listagem inteligente de pacientes sem consultas recentes com atalhos de contato direto via WhatsApp.

---

## 3. Regras de Interação e Negócio
1. **Agregação Local Instantânea:**
   - As métricas financeiras e contagens são processadas diretamente sobre o banco local IndexedDB via Dexie.js, permitindo visualização imediata mesmo offline.
2. **Filtro Temporal por Período no Extrato (`FinancialLedger`):**
   - O Livro Caixa suporta filtragem estrita por intervalo de datas através dos campos **Data Inicial** e **Data Final**.
   - Disponibiliza botões de atalho rápido de 1 toque: *Hoje*, *Esta Semana*, *Este Mês*, *Últimos 30d* e *Limpar*, além de seletor rápido por mês.
   - O cálculo respeita a data efetiva de liquidação (`payment_date`) para transações pagas e a data de vencimento (`due_date`) para transações pendentes.
3. **Atalhos de Engajamento:**
   - Pacientes na lista de inativos possuem botão para disparo com template amigável de mensagem convidando para avaliação de rotina.
4. **Edição e Detalhes de Lançamentos (`TransactionDetailModal`):**
   - **Entradas (`INCOME`):** O campo de categoria adota o rótulo **"Procedimento/Serviço"** e carrega dinamicamente o **serviço prestado no agendamento** (ex: *Atendimento Padrão*, *Consulta Inicial / Avaliação*), ficando bloqueado para edição (`disabled`/`readOnly`) com ícone de cadeado.
   - **Saídas (`EXPENSE`):** O campo mantém o rótulo **"Categoria"** e apresenta um menu suspenso (`<select>`) com a listagem de categorias de despesa disponíveis (*Materiais & Insumos*, *Aluguel & Contas*, *Laboratório & Prótese*, *Equipamentos & Manutenção*, *Marketing & Divulgação*, *Folha & Pessoal*, *Outras Despesas*), além de preservar quaisquer categorias legadas já vinculadas.
5. **Baixa de Parcela Individual (`ReceivablesList` / `BatchSettleModal`):**
   - Ao clicar no botão de ação **"✓ Baixa"** em uma parcela individual na listagem de contas a receber, o sistema abre o modal interativo de quitação (`BatchSettleModal`) com o título contextualizado **"Baixa de Parcela"**.
   - O modal permite selecionar a **Forma de Pagamento** (PIX, Dinheiro, Cartão de Débito, Cartão de Crédito) e a **Data do Pagamento** antes de confirmar a baixa.
   - A baixa atualiza atomicamente o status da transação para `PAID`, grava o método escolhido e a data informada no Dexie e enfileira a mutação na `sync_outbox`.
