/**
 * Motor Financeiro — Calculadora Contábil e Rateio de Descontos
 * OdontoFlow
 */

export interface ProcedurePricingItem {
  procedureId: string;
  priceCents: number;
}

export interface DiscountOptions {
  discountCents?: number;
  discountPercent?: number;
}

export interface EffectivePricingItem {
  procedureId: string;
  originalPriceCents: number;
  effectivePriceCents: number;
  discountAllocatedCents: number;
}

export interface DiscountDistributionResult {
  totalOriginalCents: number;
  discountAppliedCents: number;
  totalEffectiveCents: number;
  items: EffectivePricingItem[];
}

/**
 * Calcula o rateio proporcional de descontos entre procedimentos
 * garantindo resolução estrita da dízima periódica (O Teste do Centavo)
 * sem sobras nem perdas de centavos residuais.
 */
export function calculateDiscountDistribution(
  items: ProcedurePricingItem[],
  discountInput: number | DiscountOptions = 0
): DiscountDistributionResult {
  if (!items || items.length === 0) {
    return {
      totalOriginalCents: 0,
      discountAppliedCents: 0,
      totalEffectiveCents: 0,
      items: [],
    };
  }

  // Validação de integridade dos itens
  let totalOriginalCents = 0;
  for (const item of items) {
    if (typeof item.priceCents !== 'number' || isNaN(item.priceCents) || item.priceCents < 0) {
      throw new Error(`Preço inválido para o procedimento ${item.procedureId}: deve ser um valor inteiro >= 0`);
    }
    totalOriginalCents += Math.round(item.priceCents);
  }

  // Resolução das opções de desconto
  let discountCents = 0;
  if (typeof discountInput === 'number') {
    discountCents = discountInput;
  } else if (discountInput) {
    if (typeof discountInput.discountCents === 'number') {
      discountCents = discountInput.discountCents;
    } else if (typeof discountInput.discountPercent === 'number') {
      if (discountInput.discountPercent < 0 || discountInput.discountPercent > 100) {
        throw new Error('Percentual de desconto deve estar entre 0 e 100%');
      }
      discountCents = Math.round((totalOriginalCents * discountInput.discountPercent) / 100);
    }
  }

  if (discountCents < 0) {
    throw new Error('Valor do desconto não pode ser negativo');
  }

  // Limita o desconto ao valor total (Q-007: desconto máximo = 100%, nunca negativo)
  const discountAppliedCents = Math.min(discountCents, totalOriginalCents);
  const totalEffectiveCents = totalOriginalCents - discountAppliedCents;

  if (totalOriginalCents === 0 || totalEffectiveCents === 0) {
    return {
      totalOriginalCents,
      discountAppliedCents,
      totalEffectiveCents: 0,
      items: items.map((it) => ({
        procedureId: it.procedureId,
        originalPriceCents: it.priceCents,
        effectivePriceCents: 0,
        discountAllocatedCents: it.priceCents,
      })),
    };
  }

  // Rateio proporcional com truncamento inteiro (Math.floor)
  const effectiveItems: EffectivePricingItem[] = [];
  let allocatedSum = 0;

  for (const it of items) {
    const rawShare = (it.priceCents * totalEffectiveCents) / totalOriginalCents;
    const floorShare = Math.floor(rawShare);
    allocatedSum += floorShare;

    effectiveItems.push({
      procedureId: it.procedureId,
      originalPriceCents: it.priceCents,
      effectivePriceCents: floorShare,
      discountAllocatedCents: it.priceCents - floorShare,
    });
  }

  // Resolução da Dízima Periódica (O Teste do Centavo):
  // O resíduo (remainder) é distribuído centavo a centavo nos primeiros itens
  const remainder = totalEffectiveCents - allocatedSum;
  for (let i = 0; i < remainder; i++) {
    effectiveItems[i % effectiveItems.length].effectivePriceCents += 1;
    effectiveItems[i % effectiveItems.length].discountAllocatedCents -= 1;
  }

  return {
    totalOriginalCents,
    discountAppliedCents,
    totalEffectiveCents,
    items: effectiveItems,
  };
}
