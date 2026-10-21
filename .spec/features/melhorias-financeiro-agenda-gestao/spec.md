# Spec: Melhorias em Financeiro, Agenda e Gestão de Consultório

> feature: melhorias-financeiro-agenda-gestao
> status: implementada

## Contexto

Correção de inconsistências identificadas em testes manuais (TM-FIN-03, TM-FIN-12), aprimoramento da navegação da agenda (diária/semanal/mensal), flexibilização de pagamentos com cartão parcelado e vencimentos manuais, gestão completa de despesas (pendentes, recorrentes e parceladas), ações contábeis no extrato (detalhes, baixa, estorno e soft-delete), blindagem de sincronização offline e persistência de contexto e filtros no app.

## Histórias

### US-106 — Navegação Fluida e Interação Intuitiva na Agenda

Como profissional ou recepcionista do consultório, quero alternar entre visões diária, semanal e mensal de forma coerente e clicar em qualquer dia para ir direto aos seus detalhes, além de ter certeza de que o status marcado no atendimento não será revertido indevidamente.

#### AC-183 — Transição de visualização semanal/mensal para diária e navegação temporal dinâmica
- **Dado** que estou na visualização por semana ou mês da agenda
- **Quando** eu clico em um dia do grid ou utilizo as setas de navegação anterior/próxima
- **Então** ao clicar no dia a visão muda automaticamente para diária naquele dia selecionado; e ao clicar nas setas de navegação, a data avança/retrocede 7 dias na visão semanal e 1 mês na visão mensal.

#### AC-184 — Resiliência de status local contra sobrescrita por sincronização pull desatualizada
- **Dado** que criei ou alterei um agendamento e marquei "Paciente Faltou" (NO_SHOW)
- **Quando** o ciclo de sincronização em segundo plano realiza o pull do servidor antes do push ser processado
- **Então** a mutação pendente na outbox e o timestamp local mais recente protegem o registro, impedindo que o status volte para agendado/pendente temporariamente.

---

### US-107 — Recebimento em Cartão de Crédito à Vista e Parcelamento Exclusivo da Clínica

Como recepcionista do consultório, quero que o pagamento com Cartão de Crédito seja processado à vista (sem gerar parcelas pendentes no caixa), enquanto a opção Parcelado permita dividir em até 12x com vencimentos individuais, além de poder alterar o valor cobrado livremente.

#### AC-185 — Cartão de Crédito à vista e parcelamento exclusivo na modalidade Parcelado com vencimentos individuais
- **Dado** que estou no checkout de conclusão de atendimento
- **Quando** seleciono a forma de pagamento Cartão de Crédito
- **Então** o sistema processa como pagamento único à vista sem abrir parcelamento;
- **E quando** seleciono a forma de pagamento Parcelado
- **Então** posso definir o número de parcelas (2x a 12x) e alterar a data de vencimento de cada parcela individualmente.

#### AC-186 — Ajuste manual e irrestrito de valores e procedimentos no checkout
- **Dado** que um ou mais procedimentos foram adicionados ao atendimento
- **Quando** edito o valor cobrado de qualquer procedimento ou o total geral
- **Então** o sistema permite livre digitação de valores maiores, menores ou R$ 0,00 (cortesia) sem travar a digitação ou forçar arredondamentos indesejados.

---

### US-108 — Extrato Completo com Filtros Temporais, Normalização e Ações Contábeis

Como gestor do consultório, quero filtrar o livro caixa por mês ou data específica, buscar sem se preocupar com acentos ou maiúsculas, exportar CSV com nome/telefone do paciente e poder visualizar, editar, baixar, estornar e excluir lançamentos.

#### AC-187 — Filtros temporais avançados por período e busca textual normalizada no Extrato
- **Dado** que estou na aba de Extrato (Livro Caixa)
- **Quando** utilizo a filtragem por período com data inicial e data final, mês/ano ou a busca textual
- **Então** a lista filtra instantaneamente as movimentações compreendidas no intervalo de datas definido, ignorando acentos gráficos (ex: "cartao" encontra "cartão") e localizando também pelo nome do paciente vinculado ao atendimento.

#### AC-188 — Exportação CSV do Livro Caixa com identificação de cliente e telefone em receitas
- **Dado** que filtrei movimentações no Livro Caixa
- **Quando** clico em exportar CSV
- **Então** o arquivo gerado inclui colunas de Nome do Cliente e Telefone preenchidos para entradas vinculadas a pacientes, permanecendo em branco para despesas gerais.

#### AC-189 — Detalhes, edição, estorno de pagamentos e soft-delete de transações no Extrato
- **Dado** que visualizo uma transação no Livro Caixa
- **Quando** clico sobre ela para abrir o modal de detalhes
- **Então** posso editar suas informações, realizar a baixa se estiver pendente, estornar o pagamento se estiver paga (retornando a status PENDENTE) ou realizar a exclusão lógica (soft-delete), refletindo na outbox de sincronização.

---

### US-109 — Gestão Avançada de Despesas Rápidas, Recorrência e Pendências

Como administrador do consultório, quero cadastrar despesas com campos limpos ao abrir o formulário, podendo optar por despesas pagas ou pendentes (a pagar), além de criar despesas parceladas ou recorrentes.

#### AC-190 — Despesas rápidas com reset de formulário, suporte a pendências, parcelamento e recorrência
- **Dado** que clico em "Nova Despesa"
- **Quando** o modal se abre
- **Então** os campos iniciam limpos (sem dados da despesa anterior), e posso escolher entre despesa paga ou pendente (com data de vencimento), bem como despesa única, parcelada (ex: 3x) ou recorrente mensal (ex: aluguel 12 meses).

---

### US-110 — Isolamento Estrito de Dados e Alerta Financeiro nos Pacientes

Como profissional do consultório, quero identificar imediatamente no card de cada paciente se ele possui débitos pendentes e ter a garantia de que o prontuário financeiro dele exibe apenas e exclusivamente as transações associadas a ele.

#### AC-191 — Indicador visual de débitos no card do paciente e isolamento financeiro estrito por ID
- **Dado** que visualizo a lista de clientes ou o prontuário financeiro de um paciente (ex: teste)
- **Quando** o paciente possui parcelas ou consultas pendentes
- **Então** o card do paciente exibe um badge de pendência financeira com o valor devido; e ao abrir o prontuário financeiro, somente transações estritamente vinculadas aos agendamentos do paciente aparecem, sem poluição cruzada por nomes similares (TM-FIN-12).

---

### US-111 — Persistência de Contexto de Navegação e Autenticação de Relatórios

Como usuário do sistema, quero alternar entre abas (Agenda, Clientes, Caixa, Relatórios) sem perder os filtros ou sub-abas selecionadas, e revalidar relatórios com o servidor sem erro 401 de autenticação.

#### AC-192 — Baixa individual com seleção de método e valor, persistência de abas/filtros e autenticação de relatórios
- **Dado** que navego entre diferentes telas do aplicativo ou clico em revalidar relatórios gerenciais
- **Quando** retorno a uma aba anterior ou clico no botão de revalidação
- **Então** o estado dos filtros e abas é mantido intacto (sem reset indesejado), a baixa individual permite escolher a forma de pagamento e valor quitado, e a requisição de relatórios envia o token JWT evitando erro 401.

## Fora de escopo

- Integração direta com maquininhas de cartão TEF físico ou gateways de pagamento online (Stripe/Stone).
- Emissão de notas fiscais eletrônicas de serviço (NFS-e).
- Conciliação bancária automática com arquivos OFX.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-060 | A preservação de filtros entre abas no app deve ser tratada no cliente sem reiniciar o ciclo de vida dos componentes. | confirmada | Implementação de visibilidade condicional CSS nos containers das abas principais em App.tsx. |
| ASM-061 | Despesas parceladas ou recorrentes geram múltiplas transações do tipo EXPENSE com datas de vencimento mensais sequenciais no Dexie e outbox. | confirmada | Alinhado com a modelagem do motor financeiro e persistência offline-first. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-052 | Qual o fluxo de confirmação ao estornar uma receita vinculada a consulta concluída? | respondida | Ao solicitar o estorno, exibir um modal de aviso informando que a consulta vinculada já está com status 'Concluída'. O usuário deve marcar explicitamente uma caixa de confirmação ('Estou ciente e desejo estornar este pagamento') para prosseguir com o estorno (tornando a transação PENDENTE) ou optar por cancelar a operação. |
