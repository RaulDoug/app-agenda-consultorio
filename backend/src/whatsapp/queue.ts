import { Queue, Worker, type Job } from 'bullmq';
import { getEvolutionClient, BULLMQ_RETRY_BACKOFF_CONFIG, type SendMessageResponse } from './evolution-client.js';
import { processSpintax } from './spintax.js';

export interface ConfirmationJobData {
  appointmentId: string;
  tenantId: string;
  instanceName: string;
  phone: string;
  patientName: string;
  appointmentStartTime: string; // ISO 8601
  messageTemplate?: string;
  createdAt?: string;
}

export interface EnqueuedJobRecord {
  id: string;
  name: string;
  data: ConfirmationJobData;
  delay: number;
  enqueuedAt: number;
}

export interface IConfirmationQueue {
  addJob(
    name: string,
    data: ConfirmationJobData,
    options?: { delay?: number; attempts?: number }
  ): Promise<{ id: string; delay: number }>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  isPaused(): Promise<boolean>;
  getPendingJobs(): Promise<EnqueuedJobRecord[]>;
  clear(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Fila em Memória para testes determinísticos rápidos (< 10ms)
 */
export class InMemoryConfirmationQueue implements IConfirmationQueue {
  private jobs: EnqueuedJobRecord[] = [];
  private paused: boolean = false;

  async addJob(
    name: string,
    data: ConfirmationJobData,
    options?: { delay?: number; attempts?: number }
  ): Promise<{ id: string; delay: number }> {
    const delay = options?.delay ?? 0;
    const jobRecord: EnqueuedJobRecord = {
      id: `inmem-job-${this.jobs.length + 1}-${Date.now()}`,
      name,
      data,
      delay,
      enqueuedAt: Date.now(),
    };
    this.jobs.push(jobRecord);
    return { id: jobRecord.id, delay };
  }

  async pause(): Promise<void> {
    this.paused = true;
  }

  async resume(): Promise<void> {
    this.paused = false;
  }

  async isPaused(): Promise<boolean> {
    return this.paused;
  }

  async getPendingJobs(): Promise<EnqueuedJobRecord[]> {
    return [...this.jobs];
  }

  async removeJob(id: string): Promise<boolean> {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      this.jobs.splice(idx, 1);
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.jobs = [];
    this.paused = false;
  }

  async close(): Promise<void> {
    // no-op
  }
}

/**
 * Implementação Real BullMQ conectada ao Redis (para Docker / Produção)
 */
export class BullMQConfirmationQueue implements IConfirmationQueue {
  private queue: Queue<ConfirmationJobData>;
  private worker?: Worker<ConfirmationJobData>;

  constructor(redisUrl?: string) {
    const connection = {
      url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
    };
    this.queue = new Queue<ConfirmationJobData>('whatsapp-confirmations', {
      connection: connection as any,
      defaultJobOptions: {
        attempts: BULLMQ_RETRY_BACKOFF_CONFIG.attempts,
        backoff: BULLMQ_RETRY_BACKOFF_CONFIG.backoff,
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    if (process.env.NODE_ENV !== 'test') {
      try {
        const evolutionClient = getEvolutionClient();
        this.worker = new Worker<ConfirmationJobData>(
          'whatsapp-confirmations',
          async (job: Job<ConfirmationJobData>) => {
            const { instanceName, phone, patientName, appointmentStartTime, messageTemplate } = job.data;
            const cleanPhone = phone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

            const rawMessage = messageTemplate || `Olá {nome}, confirmamos seu agendamento para {horario}? Responda 1 para Sim ou 2 para Remarcar.`;
            const text = processSpintax(rawMessage)
              .replace('{nome}', patientName)
              .replace('{horario}', new Date(appointmentStartTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

            console.log(`[BullMQ Worker] Enviando confirmação para ${patientName} (${formattedPhone})...`);
            const res = await evolutionClient.sendTextMessage({
              instanceName,
              number: formattedPhone,
              text,
            });
            console.log(`[BullMQ Worker] Mensagem enviada com sucesso! ID: ${res.id}`);
            return res;
          },
          { connection: connection as any }
        );
      } catch (err: any) {
        console.warn('[BullMQ Worker] Não foi possível iniciar o worker:', err.message);
      }
    }
  }

  async addJob(
    name: string,
    data: ConfirmationJobData,
    options?: { delay?: number; attempts?: number }
  ): Promise<{ id: string; delay: number }> {
    const delay = options?.delay ?? 0;
    const job = await this.queue.add(name, data, {
      delay,
      attempts: options?.attempts ?? BULLMQ_RETRY_BACKOFF_CONFIG.attempts,
    });
    return { id: job.id || '', delay };
  }

  async pause(): Promise<void> {
    await this.queue.pause();
  }

  async resume(): Promise<void> {
    await this.queue.resume();
  }

  async isPaused(): Promise<boolean> {
    return await this.queue.isPaused();
  }

  async getPendingJobs(): Promise<EnqueuedJobRecord[]> {
    const jobs = await this.queue.getJobs(['delayed', 'waiting']);
    return jobs.map((j) => ({
      id: j.id || '',
      name: j.name,
      data: j.data,
      delay: j.opts.delay || 0,
      enqueuedAt: j.timestamp,
    }));
  }

  async clear(): Promise<void> {
    await this.queue.drain();
  }

  async close(): Promise<void> {
    if (this.worker) await this.worker.close();
    await this.queue.close();
  }
}

let activeQueue: IConfirmationQueue | null = null;

export function getConfirmationQueue(): IConfirmationQueue {
  if (!activeQueue) {
    if (process.env.NODE_ENV === 'test' || !process.env.REDIS_URL) {
      activeQueue = new InMemoryConfirmationQueue();
    } else {
      activeQueue = new BullMQConfirmationQueue();
    }
  }
  return activeQueue;
}

export function setConfirmationQueue(queue: IConfirmationQueue | null): void {
  activeQueue = queue;
}
