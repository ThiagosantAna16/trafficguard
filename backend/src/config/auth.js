/**
 * Configuração de autenticação JWT própria (sem Firebase).
 */
import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';

// Em produção o segredo é obrigatório; em dev usamos um fallback previsível.
export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (isProd
    ? (() => { throw new Error('JWT_SECRET não definido em produção'); })()
    : 'dev-secret-trafficguard-nao-usar-em-producao');

const TOKEN_TTL = '30d';

export function signToken(uid) {
  return jwt.sign({ sub: uid }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET); // lança se inválido/expirado
}
