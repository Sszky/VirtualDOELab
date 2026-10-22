'use strict';
/**
 * Google session stored in an encrypted, httpOnly cookie (no database needed).
 *
 * The cookie holds the Google refresh token + current access token, encrypted
 * with AES-256-GCM using SESSION_SECRET. JavaScript in the page cannot read it,
 * and nobody can read or change it without the secret.
 */
const crypto = require('crypto');

const COOKIE_NAME = 'vdl_session';
// The Google session is temporary:
//  - signed out after SESSION_IDLE_S without any activity (default 1 hour)
//  - and never lasts longer than SESSION_MAX_AGE_S in total (default 8 hours)
// The page also signs out on reload / reopening the site (see sims-v2/assets/api.js).
const SESSION_IDLE_S = Number(process.env.SESSION_IDLE_S) || 60 * 60; // 1 hour
const SESSION_MAX_AGE_S = Number(process.env.SESSION_MAX_AGE_S) || 8 * 60 * 60; // 8 hours

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set (at least 32 characters).');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}

function decrypt(value) {
  try {
    const raw = Buffer.from(value, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    return JSON.parse(json);
  } catch {
    return null; // tampered, wrong secret, or old format → treat as signed out
  }
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Cross-site (frontend on github.io, API on vercel.app) needs SameSite=None; Secure.
// Local http://localhost development uses Lax so the cookie still works without https.
function cookieAttributes(maxAge) {
  const production = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
  const sameSite = production ? 'None; Secure' : 'Lax';
  return `Path=/api; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}`;
}

function readSession(req) {
  const value = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!value) return null;
  const session = decrypt(value);
  const now = Date.now();
  if (
    !session ||
    !session.createdAt ||
    now - session.createdAt > SESSION_MAX_AGE_S * 1000 ||
    now - (session.lastActive || session.createdAt) > SESSION_IDLE_S * 1000
  ) {
    return null;
  }
  return session;
}

/** Save the session and mark it as used right now (restarts the idle timer). */
function writeSession(res, session) {
  session.lastActive = Date.now();
  const untilMax = session.createdAt + SESSION_MAX_AGE_S * 1000 - session.lastActive;
  const maxAge = Math.max(1, Math.floor(Math.min(untilMax, SESSION_IDLE_S * 1000) / 1000));
  res.append('Set-Cookie', `${COOKIE_NAME}=${encrypt(session)}; ${cookieAttributes(maxAge)}`);
}

function clearSession(res) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; ${cookieAttributes(0)}`);
}

module.exports = { readSession, writeSession, clearSession, SESSION_IDLE_S, SESSION_MAX_AGE_S };
