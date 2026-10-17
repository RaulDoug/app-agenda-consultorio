const VALID_BRAZILIAN_DDDS = new Set([
  // SP
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  // RJ / ES
  21, 22, 24, 27, 28,
  // MG
  31, 32, 33, 34, 35, 37, 38,
  // PR / SC
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  // RS
  51, 53, 54, 55,
  // Centro-Oeste / Norte
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  // Nordeste (BA / SE)
  71, 73, 74, 75, 77, 79,
  // Nordeste
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  // Norte / MA
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export interface NormalizedPhoneResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

export function normalizeBrazilianPhone(rawPhone: string): NormalizedPhoneResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      error: 'Telefone não informado ou em formato inválido.',
    };
  }

  // Remove tudo que não for dígito
  const digits = rawPhone.replace(/\D/g, '');

  let cleanNumber = digits;

  // Se tiver 13 dígitos e começar com 55 (DDI Brasil)
  if (cleanNumber.length === 13 && cleanNumber.startsWith('55')) {
    cleanNumber = cleanNumber.slice(2);
  }

  // Um celular brasileiro válido tem 11 dígitos: DDD (2) + 9 dígitos começando com 9
  if (cleanNumber.length !== 11) {
    return {
      isValid: false,
      error: `Quantidade de dígitos inválida (${digits.length}). Esperado número de celular com DDD (11 dígitos).`,
    };
  }

  const ddd = parseInt(cleanNumber.slice(0, 2), 10);
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) {
    return {
      isValid: false,
      error: `DDD inválido: ${ddd}.`,
    };
  }

  // Celulares no Brasil sempre começam com '9'
  if (cleanNumber[2] !== '9') {
    return {
      isValid: false,
      error: 'Número de celular brasileiro deve iniciar com o dígito 9 após o DDD.',
    };
  }

  return {
    isValid: true,
    normalized: `55${cleanNumber}`,
  };
}
