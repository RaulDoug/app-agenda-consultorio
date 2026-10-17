/**
 * Motor Spintax Anti-Ban para Mensageria WhatsApp
 * Resolve blocos {opção1|opção2|opção3} de forma recursiva e interpola variáveis ({nome}, {hora}, etc.)
 */

export interface SpintaxVariables {
  [key: string]: string | number | undefined;
}

/**
 * Processa uma string Spintax, selecionando estocasticamente uma opção para cada bloco.
 * Suporta blocos aninhados e variáveis dinâmicas.
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
      if (val !== undefined && val !== null) {
        const varRegex = new RegExp(`\\{${key}\\}`, 'gi');
        result = result.replace(varRegex, String(val));
      }
    }
  }

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
