# Regra Mandatória: Desenvolvimento com onp-spec-driven

Neste projeto, o desenvolvimento DEVE sempre seguir a metodologia e a skill `onp-spec-driven` (`.agents/skills/onp-spec-driven/SKILL.md`), cobrindo o fluxo:
1. **Especificar** (`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs new <feature>`)
2. **Tarefas** (`tasks.md` ancorado com rastreabilidade `US-xxx` e `AC-xxx`)
3. **Plano de Execução** (`plano <feature>`)
4. **Executar** com TDD e testes anotados `@spec:AC-xxx`
5. **Verificar** (`verify <feature>`)
6. **Auditar** (`audit --ci` como gate com exit code 0)

**Exceção:** Apenas quando expressamente solicitado pelo usuário o não uso da skill.
