/**
 * Motor Financeiro — Calculadora Contábil e Rateio de Descontos
 * CliniAssist
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
 * Calcula o rateio proporcional de descontos entre procedimentos/serviços
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
  } else if (discountInput && typeof discountInput === 'object') {
    if (typeof discountInput.discountCents === 'number') {
      discountCents = discountInput.discountCents;
    } else if (typeof discountInput.discountPercent === 'number') {
      const pct = discountInput.discountPercent;
      if (pct < 0 || pct > 100) {
        throw new Error('Percentual de desconto deve estar entre 0 e 100');
      }
      discountCents = Math.round((totalOriginalCents * pct) / 100);
    }
  }

  if (discountCents < 0) {
    throw new Error('Desconto não pode ser negativo');
  }

  // Não permite desconto superior a 100% do total
  const finalDiscountCents = Math.min(discountCents, totalOriginalCents);
  const totalEffectiveCents = totalOriginalCents - finalDiscountCents;

  if (totalOriginalCents === 0 || finalDiscountCents === 0) {
    return {
      totalOriginalCents,
      discountAppliedCents: 0,
      totalEffectiveCents: totalOriginalCents,
      items: items.map((it) => ({
        procedureId: it.procedureId,
        originalPriceCents: Math.round(it.priceCents),
        effectivePriceCents: Math.round(it.priceCents),
        discountAllocatedCents: 0,
      })),
    };
  }

  // Rateio Proporcional com Resolução da Dízima Periódica (O Teste do Centavo)
  let allocatedDiscountAcc = 0;
  const resultItems: EffectivePricingItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const originalPrice = Math.round(item.priceCents);

    let allocatedDiscount = 0;
    if (i === items.length - 1) {
      // O último item absorve o centavo residual para fechar o somatório exato
      allocatedDiscount = finalDiscountCents - allocatedDiscountAcc;
    } else {
      allocatedDiscount = Math.round((originalPrice / totalOriginalCents) * finalDiscountCents);
      allocatedDiscountAcc += allocatedDiscount;
    }

    const effectivePrice = originalPrice - allocatedDiscount;

    resultItems.push({
      procedureId: item.procedureId,
      originalPriceCents: originalPrice,
      effectivePriceCents: effectivePrice,
      discountAllocatedCents: allocatedDiscount,
    });
  }

  return {
    totalOriginalCents,
    discountAppliedCents: finalDiscountCents,
    totalEffectiveCents,
    items: resultItems,
  };
}
