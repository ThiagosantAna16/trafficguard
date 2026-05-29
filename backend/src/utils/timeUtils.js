import { redis } from '../config/redis.js';

const DAILY_QUOTA_LIMIT = 500;  // requisições/dia à Routes API
const CIRCUIT_BREAKER_THRESHOLD = 0.80; // dispara ao atingir 80% (P4)

function quotaKey() {
  return `quota:${new Date().toISOString().split('T')[0]}`; // "quota:2026-05-28"
}

/**
 * Converte horário de saída + antecedência em expressão cron para America/Sao_Paulo.
 *
 * Exemplo: departureTime="07:30", alertAdvance=30, daysOfWeek=[1,2,3,4,5]
 * Resultado: "0 7 * * 1,2,3,4,5"  (verifica às 07:00, seg-sex)
 */
export function buildCronExpression(departureTime, alertAdvanceMinutes, daysOfWeek) {
  if (!departureTime || !alertAdvanceMinutes || !daysOfWeek?.length) return null;

  const [hours, minutes] = departureTime.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes - alertAdvanceMinutes;

  // Passa para o dia anterior se negativo (raro, mas protege)
  if (totalMinutes < 0) totalMinutes = 0;

  const checkHour = Math.floor(totalMinutes / 60) % 24;
  const checkMinute = totalMinutes % 60;
  const cronDays = daysOfWeek.join(',');

  return `${checkMinute} ${checkHour} * * ${cronDays}`;
}

/** Retorna true se ainda há quota disponível (abaixo de 80%). */
export async function isWithinQuotaLimit() {
  const count = await redis.get(quotaKey());
  if (!count) return true;
  return parseInt(count, 10) < DAILY_QUOTA_LIMIT * CIRCUIT_BREAKER_THRESHOLD;
}

/** Incrementa o contador de uso diário da API. */
export async function incrementDailyUsage() {
  const key = quotaKey();
  await redis.incr(key);
  await redis.expire(key, 86400); // expira em 24h
}

/** Formata segundos em string legível: "1h02" ou "45min". */
export function secondsToHumanTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}min`;
}
