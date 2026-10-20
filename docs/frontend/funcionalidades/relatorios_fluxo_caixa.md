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
- `CashFlowDashboard.tsx`: Dashboard financeiro com cartões de entradas, saídas, saldo previsto e gráficos sintetizados.
- `InactivePatientsList.tsx`: Listagem inteligente de pacientes sem consultas recentes com atalhos de contato direto via WhatsApp.

---

## 3. Regras de Interação e Negócio
1. **Agregação Local Instantânea:**
   - As métricas financeiras e contagens são processadas diretamente sobre o banco local IndexedDB via Dexie.js, permitindo visualização imediata mesmo offline.
2. **Atalhos de Engajamento:**
   - Pacientes na lista de inativos possuem botão para disparo com template amigável de mensagem convidando para avaliação de rotina.
