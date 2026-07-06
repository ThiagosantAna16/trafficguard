/**
 * Seleção do datastore.
 * - DATABASE_URL definido  → Postgres (Railway) — banco real de produção.
 * - Caso contrário          → store local em arquivo JSON (dev, zero dependências).
 *
 * Ambos expõem a mesma interface estilo Firestore, então o resto do código não muda.
 */
import { sqliteDb } from './sqliteDb.js';

export const USE_LOCAL = !process.env.DATABASE_URL;

let _db;
let _init = async () => {};

if (USE_LOCAL) {
  _db = sqliteDb;
  console.log('[DB] Modo local (arquivo JSON) — defina DATABASE_URL para usar Postgres');
} else {
  const { postgresDb, initPostgres } = await import('./postgresDb.js');
  _db = postgresDb;
  _init = initPostgres;
}

export const db = _db;
export const initDb = _init;
