import { LocalProcedure } from '../../db/types';

export interface ProcedureWithMetrics {
  procedure: LocalProcedure;
  marginCents: number;
  marginPercent: number;
}

