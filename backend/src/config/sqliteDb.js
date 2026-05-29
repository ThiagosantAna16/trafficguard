/**
 * Banco de dados local para desenvolvimento/testes.
 * Armazena dados em JSON no disco (zero dependências nativas).
 * Interface idêntica ao Firestore Admin SDK para ser drop-in no modo USE_SQLITE=true.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dir, '../../../dev-trafficguard.json');

let store = {};

if (existsSync(DATA_FILE)) {
  try {
    store = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.warn('[LocalDB] Falha ao carregar dev-trafficguard.json, iniciando vazio:', e.message);
  }
}

function persist() {
  writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function col(name) {
  if (!store[name]) store[name] = {};
  return store[name];
}

// ── DocumentSnapshot ──────────────────────────────────────────────────────────

class DocumentSnapshot {
  constructor(collectionName, id, rawData) {
    this.id = id;
    this.exists = rawData !== null;
    this._data = rawData;
    this.ref = new DocRef(collectionName, id);
  }
  data() { return this._data; }
}

// ── DocRef ────────────────────────────────────────────────────────────────────

class DocRef {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
  }

  async get() {
    const data = col(this.collection)[this.id] ?? null;
    return new DocumentSnapshot(this.collection, this.id, data ? { ...data } : null);
  }

  async set(data) {
    col(this.collection)[this.id] = { ...data };
    persist();
  }

  async update(updates) {
    const existing = col(this.collection)[this.id];
    if (!existing) throw new Error(`[LocalDB] doc ${this.collection}/${this.id} não encontrado para update`);
    col(this.collection)[this.id] = { ...existing, ...updates };
    persist();
  }

  async delete() {
    delete col(this.collection)[this.id];
    persist();
  }
}

// ── QueryBuilder ──────────────────────────────────────────────────────────────

function getField(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function toMs(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!isNaN(t)) return t;
  }
  return v;
}

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
    const bucket = col(this._col);
    let snaps = Object.entries(bucket).map(
      ([id, data]) => new DocumentSnapshot(this._col, id, { ...data })
    );

    for (const { field, op, value } of this._filters) {
      snaps = snaps.filter(s => {
        const dv = getField(s.data(), field);
        const a = toMs(dv), b = toMs(value);
        if (op === '==') return dv === value;
        if (op === '>=') return a >= b;
        if (op === '<=') return a <= b;
        if (op === '>')  return a > b;
        if (op === '<')  return a < b;
        return true;
      });
    }

    if (this._orderField) {
      const f = this._orderField;
      const sign = this._orderDir === 'desc' ? -1 : 1;
      snaps.sort((a, b) => {
        const av = toMs(getField(a.data(), f));
        const bv = toMs(getField(b.data(), f));
        if (av < bv) return -sign;
        if (av > bv) return sign;
        return 0;
      });
    }

    return { docs: snaps, size: snaps.length };
  }
}

// ── CollectionRef ─────────────────────────────────────────────────────────────

class CollectionRef {
  constructor(name) { this._name = name; }
  doc(id) { return new DocRef(this._name, id); }
  where(field, op, value) { return new QueryBuilder(this._name).where(field, op, value); }
}

// ── WriteBatch ────────────────────────────────────────────────────────────────

class WriteBatch {
  constructor() { this._ops = []; }

  delete(docRef) {
    this._ops.push(() => { delete col(docRef.collection)[docRef.id]; });
    return this;
  }

  set(docRef, data) {
    this._ops.push(() => { col(docRef.collection)[docRef.id] = { ...data }; });
    return this;
  }

  async commit() {
    for (const op of this._ops) op();
    persist();
  }
}

// ── Export ────────────────────────────────────────────────────────────────────

console.log(`[LocalDB] Arquivo de dados: ${DATA_FILE}`);

export const sqliteDb = {
  collection: (name) => new CollectionRef(name),
  batch: () => new WriteBatch(),
};
