import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../config/db.js';
import { signToken } from '../config/auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u) {
  return { uid: u.uid, name: u.name, email: u.email, plan: u.plan, routesCount: u.routesCount };
}

export default async function authRoutes(app) {
  // Cria conta com e-mail/senha
  app.post('/auth/register', async (request, reply) => {
    const { name, email, password, pushToken } = request.body ?? {};

    if (!name || !email || !password) {
      return reply.status(400).send({ error: 'Informe nome, e-mail e senha' });
    }
    if (!EMAIL_RE.test(email)) {
      return reply.status(400).send({ error: 'E-mail inválido' });
    }
    if (password.length < 6) {
      return reply.status(400).send({ error: 'Senha muito curta — mínimo 6 caracteres' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.collection('users').where('email', '==', normalizedEmail).get();
    if (existing.size > 0) {
      return reply.status(409).send({ error: 'E-mail já cadastrado' });
    }

    const uid = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      uid,
      name,
      email: normalizedEmail,
      passwordHash,
      pushToken: pushToken ?? null,
      plan: 'free',
      routesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(uid).set(user);
    const token = signToken(uid);
    return reply.status(201).send({ token, user: publicUser(user) });
  });

  // Login com e-mail/senha
  app.post('/auth/login', async (request, reply) => {
    const { email, password, pushToken } = request.body ?? {};
    if (!email || !password) {
      return reply.status(400).send({ error: 'Informe e-mail e senha' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const snap = await db.collection('users').where('email', '==', normalizedEmail).get();
    const doc = snap.docs[0];
    if (!doc) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos' });
    }

    const user = doc.data();
    const ok = await bcrypt.compare(password, user.passwordHash ?? '');
    if (!ok) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos' });
    }

    // Atualiza o push token no login, se enviado
    if (pushToken && pushToken !== user.pushToken) {
      await db.collection('users').doc(user.uid).update({ pushToken, updatedAt: new Date() });
    }

    const token = signToken(user.uid);
    return { token, user: publicUser(user) };
  });
}
