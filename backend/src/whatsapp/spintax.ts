/**
 * Motor Spintax Anti-Ban para Mensageria WhatsApp
 * Resolve blocos {opção1|opção2|opção3} de forma recursiva e interpola variáveis ({nome}, {hora}, etc.)
 */

export interface SpintaxVariables {
  [key: string]: string | number | undefined;
}

/**
 * Processa uma string Spintax, selecionando estocasticamente uma opção para cada bloco.
 * Suporta blocos aninhados e variáveis dinâmicas com limpeza de pontuação para tags omitidas/vazias.
 */
export function processSpintax(template: string, variables?: SpintaxVariables): string {
  // 1. Resolve blocos spintax mais internos recursivamente
  const spintaxRegex = /\{([^{}]+)\}/g;

  let result = template;
  let hasMatches = true;

  // Itera até resolver todos os blocos {a|b} sem quebrar variáveis como {nome}
  while (hasMatches) {
    hasMatches = false;
    result = result.replace(spintaxRegex, (match, contents) => {
      // Se contiver pipe '|', é um bloco de variação Spintax
      if (contents.includes('|')) {
        hasMatches = true;
        const options = contents.split('|');
        const randomIndex = Math.floor(Math.random() * options.length);
        return options[randomIndex];
      }
      // Se não contiver pipe, mantém como está para o passo de variáveis
      return match;
    });
  }

  // 2. Interpolação de variáveis
  if (variables) {
    for (const [key, val] of Object.entries(variables)) {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const varRegex = new RegExp(`\\{${key}\\}`, 'gi');
        result = result.replace(varRegex, String(val));
      }
    }
  }

  // 3. Limpeza de variáveis residuais não preenchidas (especialmente {nome}) e pontuações órfãs
  result = result
    .replace(/,\s*\{nome\}\s*([!?.])/gi, '$1')
    .replace(/\{nome\}\s*([!?.])/gi, '$1')
    .replace(/,\s*\{nome\}/gi, '')
    .replace(/\{nome\}\s*,\s*/gi, ', ')
    .replace(/\{nome\}/gi, '')
    .replace(/\s+,\s*/g, ', ')
    .replace(/,\s*([!?.])/g, '$1')
    .replace(/\s+([!?.])/g, '$1')
    .replace(/\s{2,}/g, ' ');

  return result.trim();
}

/**
 * Gera N variações de mensagem a partir de um mesmo modelo Spintax.
 */
export function generateSpintaxVariations(
  template: string,
  count: number,
  variables?: SpintaxVariables
): string[] {
  const variations: string[] = [];
  for (let i = 0; i < count; i++) {
    variations.push(processSpintax(template, variables));
  }
  return variations;
}
