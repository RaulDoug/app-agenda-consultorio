export interface CalculatedAppointmentTime {
  startTime: Date;
  endTime: Date;
  totalDurationMinutes: number;
}

export function calculateAppointmentDuration(
  startTimeInput: Date | string,
  durations: number[]
): CalculatedAppointmentTime {
  if (!durations || durations.length === 0) {
    throw new Error('Pelo menos uma duração de procedimento deve ser fornecida.');
  }

  for (const duration of durations) {
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
      throw new Error(`Duração inválida do procedimento: ${duration}. A duração deve ser maior que zero.`);
    }
  }

  const startTime = new Date(startTimeInput);
  if (isNaN(startTime.getTime())) {
    throw new Error(`Horário de início inválido: ${startTimeInput}`);
  }

  const totalDurationMinutes = durations.reduce((acc, curr) => acc + curr, 0);
  const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60 * 1000);

  return {
    startTime,
    endTime,
    totalDurationMinutes,
  };
}

export function validateProcedureDuration(durationMinutes: number): { isValid: boolean; error?: string } {
  if (typeof durationMinutes !== 'number' || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return {
      isValid: false,
      error: 'A duração do procedimento deve ser maior que zero.',
    };
  }
  return { isValid: true };
}
