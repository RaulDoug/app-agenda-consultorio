import type { Request, Response, NextFunction } from 'express';

export interface RateLimitEntry {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

export const MAX_LOGIN_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
export const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

// Armazenamento em memória das tentativas
const attemptsStore = new Map<string, RateLimitEntry>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return list.trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-ip';
}

export function buildRateLimitKey(ip: string, email?: string): string {
  const normalizedEmail = email ? email.trim().toLowerCase() : 'no-email';
  return `${ip}::${normalizedEmail}`;
}

/**
 * Verifica se a chave está bloqueada atualmente.
 */
export function isRateLimited(key: string, now = Date.now()): { blocked: boolean; retryAfterMs?: number } {
  const entry = attemptsStore.get(key);
  if (!entry) return { blocked: false };

  // Se já expirou o período de bloqueio, limpa
  if (entry.blockedUntil) {
    if (now >= entry.blockedUntil) {
      attemptsStore.delete(key);
      return { blocked: false };
    }
    return { blocked: true, retryAfterMs: entry.blockedUntil - now };
  }

  // Se a janela de 15 minutos já expirou sem atingir o limite, limpa
  if (now - entry.firstAttemptAt > WINDOW_MS) {
    attemptsStore.delete(key);
    return { blocked: false };
  }

  return { blocked: false };
}

/**
 * Registra uma tentativa de login falha.
 * Se atingir MAX_LOGIN_ATTEMPTS, bloqueia por BLOCK_DURATION_MS.
 */
export function recordLoginFailure(key: string, now = Date.now()): void {
  const entry = attemptsStore.get(key);

  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    attemptsStore.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
  }
}

/**
 * Limpa o histórico de falhas após um login com sucesso.
 */
export function recordLoginSuccess(key: string): void {
  attemptsStore.delete(key);
}

/**
 * Limpa todo o armazenamento (útil para testes isolados).
 */
export function resetRateLimitStore(): void {
  attemptsStore.clear();
}

/**
 * Middleware Express para interceptar requisições antes do processamento de login.
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const email = req.body?.email;
  const key = buildRateLimitKey(ip, email);

  const check = isRateLimited(key);
  if (check.blocked) {
    const minutesRemaining = Math.ceil((check.retryAfterMs || BLOCK_DURATION_MS) / 60000);
    res.status(429).json({
      error: 'Muitas tentativas de login incorretas. Tente novamente em 15 minutos.',
      code: 'TOO_MANY_REQUESTS',
      retryAfterMinutes: minutesRemaining,
    });
    return;
  }

  next();
}
