/**
 * Motor Financeiro — Parcelamento Inteligente e Projeção de Vencimentos
 * CliniAssist
 */

export interface InstallmentPlanParams {
  totalAmountCents: number;
  downPaymentCents?: number;
  installmentsCount: number;
  firstDueDate?: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD para entrada imediata
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  totalInstallments: number;
  amountCents: number;
  status: 'PAID' | 'PENDING';
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
}

/**
 * Valida a consistência de um plano de parcelamento
 */
export function validateInstallmentPlan(params: InstallmentPlanParams): void {
  const { totalAmountCents, downPaymentCents = 0, installmentsCount } = params;

  if (totalAmountCents <= 0) {
    throw new Error('Valor total deve ser maior que zero');
  }

  if (downPaymentCents < 0) {
    throw new Error('Valor da entrada não pode ser negativo');
  }

  if (installmentsCount < 1) {
    throw new Error('Número de parcelas deve ser pelo menos 1');
  }

  // Rejeição de entrada maior ou igual ao total em plano com mais de 1 parcela
  if (installmentsCount > 1 && downPaymentCents >= totalAmountCents) {
    throw new Error('Valor da entrada não pode ser maior ou igual ao valor total em plano parcelado');
  }
}

/**
 * Retorna o número de dias em um determinado mês/ano civil
 */
export function getDaysInCivilMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

/**
 * Projeta o vencimento da n-ésima parcela a partir de uma data-base YYYY-MM-DD,
 * tratando rigorosamente virada de ano e ajuste de meses com menos de 31 dias.
 */
export function projectCivilDueDate(firstDueDate: string, monthOffset: number): string {
  const parts = firstDueDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Data de vencimento inválida: ${firstDueDate}. Esperado formato YYYY-MM-DD`);
  }

  const [baseYear, baseMonth, baseDay] = parts;

  // monthOffset 0 = firstDueDate
  const totalMonths = (baseMonth - 1) + monthOffset;
  const targetYear = baseYear + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;

  const maxDays = getDaysInCivilMonth(targetYear, targetMonth);
  const targetDay = Math.min(baseDay, maxDays);

  const mm = String(targetMonth).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');

  return `${targetYear}-${mm}-${dd}`;
}

/**
 * Gera o cronograma completo de parcelas (entrada + parcelas futuras)
 * com resolução exata de centavos e projeção contábil de vencimentos.
 */
export function generateInstallmentSchedule(params: InstallmentPlanParams): InstallmentScheduleItem[] {
  validateInstallmentPlan(params);

  const {
    totalAmountCents,
    downPaymentCents = 0,
    installmentsCount,
    firstDueDate = new Date().toISOString().slice(0, 10),
    paymentDate = new Date().toISOString().slice(0, 10),
  } = params;

  const hasDownPayment = downPaymentCents > 0;
  const totalTransactionsCount = (hasDownPayment ? 1 : 0) + installmentsCount;
  const schedule: InstallmentScheduleItem[] = [];

  // 1. Registro de Entrada (status PAID)
  if (hasDownPayment) {
    schedule.push({
      installmentNumber: 1,
      totalInstallments: totalTransactionsCount,
      amountCents: downPaymentCents,
      status: 'PAID',
      dueDate: paymentDate,
      paymentDate: paymentDate,
    });
  }

  // 2. Saldo e Parcelas Futuras (status PENDING)
  const remainingCents = totalAmountCents - downPaymentCents;

  if (installmentsCount > 0 && remainingCents > 0) {
    const baseShare = Math.floor(remainingCents / installmentsCount);
    const remainder = remainingCents - (baseShare * installmentsCount);

    const startingNumber = hasDownPayment ? 2 : 1;

    for (let i = 0; i < installmentsCount; i++) {
      const installmentAmount = baseShare + (i < remainder ? 1 : 0);
      const dueDate = projectCivilDueDate(firstDueDate, i);

      schedule.push({
        installmentNumber: startingNumber + i,
        totalInstallments: totalTransactionsCount,
        amountCents: installmentAmount,
        status: 'PENDING',
        dueDate,
      });
    }
  }

  return schedule;
}
