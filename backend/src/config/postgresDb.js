/**
 * Adaptador Postgres com interface idêntica ao Firestore Admin SDK.
 * Todos os documentos ficam numa única tabela `documents(collection, id, data jsonb)`,
 * o que mantém 100% do código de negócio (cronService, rotas, etc.) sem alterações.
 *
 * Ativado quando DATABASE_URL está definido (Railway Postgres).
 */
import pg from 'pg';

const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL ?? '';
// A rede privada do Railway (*.railway.internal) e o localhost não usam SSL.
// Só habilita SSL para conexões públicas/externas.
const needsSsl = !/localhost|127\.0\.0\.1|\.railway\.internal/.test(DB_URL);

const pool = new Pool({
  connectionString: DB_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

pool.on('error', (err) => console.error('[Postgres] Erro no pool:', err.message));

/** Cria a tabela de documentos e índices auxiliares (idempotente). */
export async function initPostgres() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      collection TEXT NOT NULL,
      id         TEXT NOT NULL,
      data       JSONB NOT NULL,
      PRIMARY KEY (collection, id)
    );
  `);
  // Índice para filtros por userId (campo mais consultado em routes/alerts)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_userid
    ON documents (collection, (data->>'userId'));
  `);
  console.log('[Postgres] Conectado e schema pronto');
}

// ── helpers de comparação (espelham o adaptador local) ──────────────────────────

function getField(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function toComparable(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!isNaN(t) && /\d{4}-\d{2}-\d{2}T/.test(v)) return t;
  }
  return v;
}

function applyFilters(rows, filters) {
  return rows.filter(({ data }) => {
    return filters.every(({ field, op, value }) => {
      const dv = getField(data, field);
      if (op === '==') return dv === value;
      const a = toComparable(dv), b = toComparable(value);
      if (op === '>=') return a >= b;
      if (op === '<=') return a <= b;
      if (op === '>') return a > b;
      if (op === '<') return a < b;
      return true;
    });
  });
}

// ── Snapshot / Refs ─────────────────────────────────────────────────────────────

class DocumentSnapshot {
  constructor(collection, id, rawData) {
    this.id = id;
    this.exists = rawData != null;
    this._data = rawData;
    this.ref = new DocRef(collection, id);
  }
  data() { return this._data; }
}

class DocRef {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
  }

  async get() {
    const { rows } = await pool.query(
      'SELECT data FROM documents WHERE collection = $1 AND id = $2',
      [this.collection, this.id]
    );
    const data = rows[0]?.data ?? null;
    return new DocumentSnapshot(this.collection, this.id, data);
  }

  async set(data) {
    await pool.query(
      `INSERT INTO documents (collection, id, data) VALUES ($1, $2, $3)
       ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data`,
      [this.collection, this.id, JSON.stringify(data)]
    );
  }

  async update(updates) {
    // Merge raso (`||`) equivalente ao update() do Firestore
    const { rowCount } = await pool.query(
      `UPDATE documents SET data = data || $3::jsonb
       WHERE collection = $1 AND id = $2`,
      [this.collection, this.id, JSON.stringify(updates)]
    );
    if (rowCount === 0) {
      throw new Error(`[Postgres] doc ${this.collection}/${this.id} não encontrado para update`);
    }
  }

  async delete() {
    await pool.query('DELETE FROM documents WHERE collection = $1 AND id = $2', [this.collection, this.id]);
  }
}

// ── Query ───────────────────────────────────────────────────────────────────────

class QueryBuilder {
  constructor(collection) {
    this._col = collection;
    this._filters = [];
    this._orderField = null;
    this._orderDir = 'asc';
  }

  where(field, op, value) {
    this._filters.push({ field, op, value });
    return this;
  }

  orderBy(field, dir = 'asc') {
    this._orderField = field;
    this._orderDir = dir;
    return this;
  }

  async get() {
    // Empurra a igualdade por userId para o SQL (usa o índice); o resto filtra em JS
    const eqUser = this._filters.find(f => f.field === 'userId' && f.op === '==');
    let rows;
    if (eqUser) {
      ({ rows } = await pool.query(
        `SELECT id, data FROM documents WHERE collection = $1 AND data->>'userId' = $2`,
        [this._col, eqUser.value]
      ));
    } else {
      ({ rows } = await pool.query('SELECT id, data FROM documents WHERE collection = $1', [this._col]));
    }

    let filtered = applyFilters(rows, this._filters);

    if (this._orderField) {
      const f = this._orderField;
      const sign = this._orderDir === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        const av = toComparable(getField(a.data, f));
        const bv = toComparable(getField(b.data, f));
        if (av < bv) return -sign;
        if (av > bv) return sign;
        return 0;
      });
    }

    const docs = filtered.map(r => new DocumentSnapshot(this._col, r.id, r.data));
    return { docs, size: docs.length };
  }
}

class CollectionRef {
  constructor(name) { this._name = name; }
  doc(id) { return new DocRef(this._name, id); }
  where(field, op, value) { return new QueryBuilder(this._name).where(field, op, value); }
  orderBy(field, dir) { return new QueryBuilder(this._name).orderBy(field, dir); }
}

// ── Batch ─────────────────────────────────────────────────────────────────────

class WriteBatch {
  constructor() { this._ops = []; }

  delete(docRef) {
    this._ops.push({ sql: 'DELETE FROM documents WHERE collection = $1 AND id = $2', params: [docRef.collection, docRef.id] });
    return this;
  }

  set(docRef, data) {
    this._ops.push({
      sql: `INSERT INTO documents (collection, id, data) VALUES ($1, $2, $3)
            ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data`,
      params: [docRef.collection, docRef.id, JSON.stringify(data)],
    });
    return this;
  }

  async commit() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { sql, params } of this._ops) await client.query(sql, params);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export const postgresDb = {
  collection: (name) => new CollectionRef(name),
  batch: () => new WriteBatch(),
};
