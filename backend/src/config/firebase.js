import admin from 'firebase-admin';
import { sqliteDb } from './sqliteDb.js';

export const USE_SQLITE = process.env.USE_SQLITE === 'true';

let _db, _auth, _messaging;

if (USE_SQLITE) {
  _db = sqliteDb;
  _auth = null;      // auth.js verifica USE_SQLITE e usa token de teste
  _messaging = null; // fcmService.js verifica USE_SQLITE e faz mock
  console.log('[Firebase] Modo SQLite ativo — Firebase Admin não inicializado');
} else {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT não definido. Use USE_SQLITE=true para modo local.');

  const serviceAccount = JSON.parse(raw);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  _db = admin.firestore();
  _auth = admin.auth();
  _messaging = admin.messaging();
}

export const db = _db;
export const auth = _auth;
export const messaging = _messaging;
export default admin;
