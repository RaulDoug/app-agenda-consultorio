/**
 * Utilitário de Rateio Proporcional de Descontos Financeiros
 * Utiliza o método dos maiores restos (Hare-Niemeyer) para garantir precisão exata de centavos sem arredondamentos espúrios.
 */

export interface ItemForDiscount {
  id: string;
  name: string;
  basePriceCents: number;
}

export interface SplitResultItem {
  id: string;
  name: string;
  basePriceCents: number;
  discountCents: number;
  effectivePriceCents: number;
}

export interface SplitResult {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  items: SplitResultItem[];
}

export function splitDiscountProportionally(
  items: ItemForDiscount[],
  discountCents: number
): SplitResult {
  const subtotalCents = items.reduce((acc, it) => acc + it.basePriceCents, 0);

  // Normalização do desconto para não exceder o subtotal nem ser negativo
  const safeDiscount = Math.max(0, Math.min(discountCents, subtotalCents));
  const totalCents = subtotalCents - safeDiscount;

  if (items.length === 0 || subtotalCents === 0 || safeDiscount === 0) {
    return {
      subtotalCents,
      discountCents: 0,
      totalCents: subtotalCents,
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        basePriceCents: it.basePriceCents,
        discountCents: 0,
        effectivePriceCents: it.basePriceCents,
      })),
    };
  }

  // Rateio inicial proporcional
  const provisional = items.map((item, index) => {
    const rawShare = (item.basePriceCents * safeDiscount) / subtotalCents;
    const floorShare = Math.floor(rawShare);
    const remainder = rawShare - floorShare;
    return {
      item,
      index,
      floorShare,
      remainder,
    };
  });

  const sumFloor = provisional.reduce((acc, p) => acc + p.floorShare, 0);
  let leftoverCents = safeDiscount - sumFloor;

  // Ordenar pelos maiores restos para distribuir centavos remanescentes
  const sortedByRemainder = [...provisional].sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < leftoverCents; i++) {
    const target = sortedByRemainder[i % sortedByRemainder.length];
    target.floorShare += 1;
  }

  // Montar itens finais na ordem original
  const resultItems: SplitResultItem[] = provisional.map((p) => {
    const itemDiscount = p.floorShare;
    return {
      id: p.item.id,
      name: p.item.name,
      basePriceCents: p.item.basePriceCents,
      discountCents: itemDiscount,
      effectivePriceCents: p.item.basePriceCents - itemDiscount,
    };
  });

  return {
    subtotalCents,
    discountCents: safeDiscount,
    totalCents,
    items: resultItems,
  };
}

export function calculateDiscountFromPercentage(subtotalCents: number, percentage: number): number {
  if (percentage <= 0 || subtotalCents <= 0) return 0;
  const safePct = Math.min(100, percentage);
  return Math.round((subtotalCents * safePct) / 100);
}
