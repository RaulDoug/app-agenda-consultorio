# Módulo: Correções de QA dos Testes Manuais (Frontend)

> **Documento:** Especificação Técnica de Ajustes de QA  
> **Localização:** `docs/frontend/funcionalidades/correcoes_qa_testes_manuais.md`  
> **Feature Spec-Driven:** `correcoes-qa-testes-manuais`  
> **Status:** Implementado e Auditado (Código 0)  

---

## 1. PWA Offline Shell via Service Worker (`public/sw.js`)

- **Objetivo:** Garantir que recarregar a página (F5) em modo offline não mostre tela inacessível do navegador.
- **Implementação:**
  - `frontend/public/sw.js`: Intercepta requisições `fetch` com `request.mode === 'navigate'` e devolve o `/index.html` em cache quando offline.
  - `frontend/src/main.tsx`: Registra o Service Worker no carregamento do navegador (`navigator.serviceWorker.register('/sw.js')`).

---

## 2. Tratamento Imediato de Token Inválido / Expirado (`SyncManager`)

- **Objetivo:** Redirecionar para o login imediatamente quando requisições de sincronização receberem HTTP 401.
- **Implementação:**
  - Callback `onUnauthorized?: () => void` adicionado ao `SyncManager`.
  - Tratamento nos métodos `push()` e `pull()`: ao detectar `res.status === 401`, invoca `onUnauthorized` e aborta a sincronização.
  - Conexão no `App.tsx` repassando `onLogout` ao `SyncManager`.

---

## 3. Expansão Dinâmica da Grade Diária para Encaixes (`ScheduleGrid`)

- **Objetivo:** Exibir agendamentos de encaixe que ocorram fora do horário comercial regular (ex: antes das 08:00 ou após as 18:00).
- **Implementação:**
  - Detecção de consultas fora da faixa `[businessHours.startHour, businessHours.endHour)` para a data selecionada.
  - Inserção de slots adicionais com chave `out-of-hours-slot-<time>` contendo badge semântico `Extra`.
  - Ordenação cronológica correta preservada.

---

## 4. Validações Estritas na Remarcação de Consulta (`RescheduleModal`)

- **Objetivo:** Impedir remarcações acidentais em horários de sobreposição, almoço, domingo ou fora de expediente sem ciência explícita.
- **Implementação:**
  - Checagem automática do slot pretendido:
    - Domingo (`getDay() === 0`);
    - Fora do expediente (`slotStartMinutes < businessStartMin || slotEndMinutes > businessEndMin`);
    - Intervalo de almoço (`slotStartMinutes < lunchEndMin && slotEndMinutes > lunchStartMin`);
    - Conflito com consulta ativa na mesma data.
  - Exibição de alerta destacado (`reschedule-extra-fit-warning`) e checkbox obrigatório de autorização de encaixe (`reschedule-allow-extra-fit-checkbox`).

---

## 5. Bloqueio de Entrada Maior ou Igual ao Total (`InstallmentsForm`)

- **Objetivo:** Evitar que o parcelamento gere 0 parcelas ou valor negativo quando a entrada for igual ou superior ao total cobrado.
- **Implementação:**
  - Trava estrita `totalCents > 0 && entryCents >= totalCents`.
  - Mensagem de erro informativa orientando a selecionar o modo À Vista.
  - Desabilitação do botão de finalização enquanto a entrada for inválida.

---

## 6. Projeção de Recebíveis DRE em Trimestre Completo (`reports-calculator.ts`)

- **Objetivo:** Garantir que 3 parcelas mensais futuras de R$ 300 totalizem exatamente R$ 900 na projeção de 90 dias, mesmo em meses com 31 dias.
- **Implementação:**
  - Limiares de 31 dias (1º mês), 62 dias (2º mês) e 93 dias (3º trimestre) calculados a partir da meia-noite local da data de referência.

