'use strict';
/**
 * Who owns an experiment history.
 *
 * Only people who signed in with Clerk (Google) have a history: 'user:<Clerk user id>'.
 * Without signing in nothing is saved — results stay in the page until it is closed.
 * The page sends the Clerk session token as "Authorization: Bearer <token>".
 */

function clerkEnabled() {
  return Boolean(process.env.CLERK_PUBLISHABLE_KEY && (process.env.CLERK_SECRET_KEY || process.env.CLERK_JWT_KEY));
}

let verifyTokenFn = null;
function verifier() {
  if (!verifyTokenFn) verifyTokenFn = require('@clerk/backend').verifyToken;
  return verifyTokenFn;
}

/** Websites allowed to have created the token: this API's own site + ALLOWED_ORIGINS. */
function authorizedParties(req, allowedOrigins) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return [`${proto}://${req.headers.host}`, ...allowedOrigins];
}

/** The Clerk user id, or null when there is no valid token. Never throws. */
async function readClerkUserId(req, allowedOrigins) {
  if (!clerkEnabled()) return null;
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+([A-Za-z0-9._-]{20,4096})$/.exec(header);
  if (!match) return null;
  try {
    const result = await verifier()(match[1], {
      secretKey: process.env.CLERK_SECRET_KEY || undefined,
      jwtKey: process.env.CLERK_JWT_KEY || undefined,
      authorizedParties: authorizedParties(req, allowedOrigins),
    });
    // @clerk/backend returns the token's claims (some versions wrap them as { data, errors }).
    if (result && result.errors) return null;
    const claims = result && result.data ? result.data : result;
    return claims && typeof claims.sub === 'string' ? claims.sub : null;
  } catch {
    return null; // expired, wrong signature, other website, …
  }
}

/**
 * The owner key of this request, or null when the caller is not signed in.
 * @returns {Promise<string|null>} 'user:<Clerk user id>' | null
 */
async function resolveOwner(req, { allowedOrigins }) {
  const userId = await readClerkUserId(req, allowedOrigins);
  return userId ? `user:${userId}` : null;
}

module.exports = { clerkEnabled, resolveOwner };
