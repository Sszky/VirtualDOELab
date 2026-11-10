'use strict';
/**
 * Postgres (Supabase) connection for the experiment history.
 *
 * Set DATABASE_URL (or POSTGRES_URL) to the Supabase **Transaction pooler** URI
 * (port 6543). Without it, history is switched off and the rest of the site
 * works exactly as before.
 */
const { Pool } = require('pg');

let pool = null;

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

function isEnabled() {
  return Boolean(connectionString());
}

function getPool() {
  if (!isEnabled()) return null;
  if (pool) return pool;

  const url = new URL(connectionString());
  // Query options meant for other clients; the pg driver would pass them on to the server.
  url.searchParams.delete('workaround');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('pgbouncer');
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);

  pool = new Pool({
    connectionString: url.toString(),
    // Supabase requires TLS. Set DATABASE_SSL_CA to Supabase's CA certificate to also verify it.
    ssl: local
      ? false
      : process.env.DATABASE_SSL_CA
        ? { ca: process.env.DATABASE_SSL_CA }
        : { rejectUnauthorized: false },
    max: 3, // serverless: keep few connections per instance; the pooler does the rest
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
  });
  pool.on('error', (error) => console.error('Postgres pool error', error));
  return pool;
}

async function query(text, values) {
  const db = getPool();
  if (!db) throw Object.assign(new Error('History is not configured on this server.'), { status: 503 });
  return db.query(text, values);
}

/** Run several queries in one transaction. */
async function transaction(fn) {
  const db = getPool();
  if (!db) throw Object.assign(new Error('History is not configured on this server.'), { status: 503 });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { isEnabled, query, transaction };
