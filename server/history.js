'use strict';
/**
 * Experiment history ("My sessions") — only for people signed in with Clerk (Google).
 * Without signing in nothing is saved.
 *
 *   GET    /api/history/config        is history on? + Clerk publishable key for the sign-in button
 *   GET    /api/history?sim=<sim>     the user's sessions (newest first)
 *   POST   /api/history/import        right after sign-in: save the runs already in the table as a new session
 *   GET    /api/history/:id           one session with all its runs
 *   PATCH  /api/history/:id           rename  { name }
 *   DELETE /api/history/:id           delete a session and its runs
 *
 * New runs are written by the server itself inside POST /api/sims/:sim/simulate?session=new|<id>
 * (see recordRun), and /import recomputes every run on the server, so a saved result is
 * always one the server really computed.
 */
const crypto = require('crypto');
const express = require('express');
const db = require('./db');
const identity = require('./identity');
const { getSim, prepareParams, SIM_NAMES } = require('./sims');

const MAX_SESSIONS_PER_OWNER = 300;
const MAX_RUNS_PER_SESSION = 500;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const httpError = (status, message) => Object.assign(new Error(message), { status });

/** History needs both the database and Clerk sign-in. */
function isEnabled() {
  return db.isEnabled() && identity.clerkEnabled();
}

function cleanName(value) {
  if (typeof value !== 'string') return null;
  // Strip control characters, collapse spaces, max 80 characters.
  const name = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return name.length <= 80 ? name : null;
}

function toSession(row) {
  return {
    id: row.id,
    sim: row.sim,
    name: row.name,
    runCount: row.run_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRun(row) {
  return { runNo: row.run_no, mode: row.mode, params: row.params, summary: row.summary, createdAt: row.created_at };
}

async function createSession(client, owner, sim) {
  const count = await client.query('select count(*)::int as n from experiment_sessions where owner = $1', [owner]);
  if (count.rows[0].n >= MAX_SESSIONS_PER_OWNER) throw httpError(409, 'Too many saved sessions. Delete some first.');
  const created = await client.query('insert into experiment_sessions (owner, sim) values ($1, $2) returning id', [owner, sim]);
  return created.rows[0].id;
}

function insertRun(client, sessionId, runNo, result) {
  const { mode, ...factors } = result.params;
  return client.query(
    `insert into experiment_runs (session_id, run_no, mode, params, summary)
     values ($1, $2, $3, $4, $5)
     returning run_no, mode, params, summary, created_at`,
    [sessionId, runNo, mode === 'stochastic' ? 'stochastic' : 'deterministic', factors, result.summary]
  );
}

/**
 * Save one simulated run. Called from the simulate route.
 * @param sessionParam 'new' to start a session, or an existing session id
 * @returns {{ saved: true, sessionId, runNo } | { saved: false, reason }}
 */
async function recordRun(req, res, { sim, sessionParam, result, allowedOrigins }) {
  if (!isEnabled()) return { saved: false, reason: 'disabled' };
  if (sessionParam !== 'new' && !UUID_RE.test(sessionParam)) return { saved: false, reason: 'bad-session' };

  const owner = await identity.resolveOwner(req, { allowedOrigins });
  if (!owner) return { saved: false, reason: 'signed-out' };
  try {
    return await db.transaction(async (client) => {
      const sessionId = sessionParam === 'new' ? await createSession(client, owner, sim) : sessionParam;
      // Lock the session row and take the next run number. Only the owner's own session of this sim qualifies.
      const updated = await client.query(
        `update experiment_sessions
            set run_count = run_count + 1, updated_at = now()
          where id = $1 and owner = $2 and sim = $3 and run_count < $4
          returning run_count`,
        [sessionId, owner, sim, MAX_RUNS_PER_SESSION]
      );
      if (updated.rowCount === 0) return { saved: false, reason: 'session-not-found-or-full' };
      const runNo = updated.rows[0].run_count;
      await insertRun(client, sessionId, runNo, result);
      return { saved: true, sessionId, runNo };
    });
  } catch (error) {
    if (error.status === 409) return { saved: false, reason: 'too-many-sessions' };
    console.error('History: could not save run', error);
    return { saved: false, reason: 'database-error' };
  }
}

function createRouter({ allowedOrigins }) {
  const router = express.Router();
  const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  router.get('/config', (req, res) => {
    const enabled = isEnabled();
    res.json({ enabled, clerkPublishableKey: enabled ? process.env.CLERK_PUBLISHABLE_KEY : null });
  });

  // Every other history route needs the database, Clerk, and a signed-in user.
  router.use((req, res, next) => (isEnabled() ? next() : next(httpError(503, 'History is not configured on this server.'))));
  router.use(
    asyncRoute(async (req, res, next) => {
      req.owner = await identity.resolveOwner(req, { allowedOrigins });
      if (!req.owner) throw httpError(401, 'Sign in to use experiment history.');
      next();
    })
  );

  router.get(
    '/',
    asyncRoute(async (req, res) => {
      const sim = req.query.sim;
      if (sim !== undefined && !SIM_NAMES.includes(sim)) throw httpError(400, 'Unknown experiment.');
      const rows = await db.query(
        `select id, sim, name, run_count, created_at, updated_at
           from experiment_sessions
          where owner = $1 and ($2::text is null or sim = $2) and run_count > 0
          order by updated_at desc
          limit 100`,
        [req.owner, sim ?? null]
      );
      res.json({ sessions: rows.rows.map(toSession) });
    })
  );

  router.post(
    '/import',
    asyncRoute(async (req, res) => {
      const body = req.body || {};
      const simDef = SIM_NAMES.includes(body.sim) ? getSim(body.sim) : null;
      if (!simDef) throw httpError(400, 'Unknown experiment.');
      if (!Array.isArray(body.rows) || body.rows.length === 0 || body.rows.length > MAX_RUNS_PER_SESSION) {
        throw httpError(400, `Send 1–${MAX_RUNS_PER_SESSION} runs.`);
      }
      // Use only the factor values from each row and compute the results again here.
      const results = body.rows.map((row) => {
        const params = row && typeof row === 'object' ? prepareParams(simDef, row) : null;
        if (!params) throw httpError(400, 'Invalid experiment parameters.');
        return simDef.simulate(params);
      });
      const saved = await db.transaction(async (client) => {
        const sessionId = await createSession(client, req.owner, body.sim);
        const runs = [];
        for (let i = 0; i < results.length; i += 1) {
          const inserted = await insertRun(client, sessionId, i + 1, results[i]);
          runs.push(toRun(inserted.rows[0]));
        }
        const session = await client.query(
          `update experiment_sessions set run_count = $2, updated_at = now() where id = $1
           returning id, sim, name, run_count, created_at, updated_at`,
          [sessionId, results.length]
        );
        return { session: toSession(session.rows[0]), runs };
      });
      res.status(201).json(saved);
    })
  );

  router.param('id', (req, res, next, id) => (UUID_RE.test(id) ? next() : next(httpError(404, 'Session not found.'))));

  router.get(
    '/:id',
    asyncRoute(async (req, res) => {
      const session = await db.query(
        'select id, sim, name, run_count, created_at, updated_at from experiment_sessions where id = $1 and owner = $2',
        [req.params.id, req.owner]
      );
      if (session.rowCount === 0) throw httpError(404, 'Session not found.');
      const runs = await db.query(
        'select run_no, mode, params, summary, created_at from experiment_runs where session_id = $1 order by run_no',
        [req.params.id]
      );
      res.json({ session: toSession(session.rows[0]), runs: runs.rows.map(toRun) });
    })
  );

  router.patch(
    '/:id',
    asyncRoute(async (req, res) => {
      const name = cleanName(req.body && req.body.name);
      if (name === null) throw httpError(400, 'Invalid session name.');
      const updated = await db.query(
        `update experiment_sessions set name = $3
          where id = $1 and owner = $2
          returning id, sim, name, run_count, created_at, updated_at`,
        [req.params.id, req.owner, name]
      );
      if (updated.rowCount === 0) throw httpError(404, 'Session not found.');
      res.json({ session: toSession(updated.rows[0]) });
    })
  );

  router.delete(
    '/:id',
    asyncRoute(async (req, res) => {
      const deleted = await db.query('delete from experiment_sessions where id = $1 and owner = $2', [req.params.id, req.owner]);
      if (deleted.rowCount === 0) throw httpError(404, 'Session not found.');
      res.json({ deleted: true });
    })
  );

  return router;
}

/**
 * GET /api/cron/keepalive — called once a day by Vercel Cron (see vercel.json).
 * Supabase's free plan pauses a project after about a week with little database activity;
 * one small query a day keeps it awake. Vercel sends "Authorization: Bearer <CRON_SECRET>".
 */
async function keepAlive(req, res) {
  const secret = process.env.CRON_SECRET || '';
  const given = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  if (!db.isEnabled()) return res.json({ ok: true, database: 'not configured' });
  const result = await db.query('select count(*)::int as sessions from experiment_sessions');
  res.json({ ok: true, sessions: result.rows[0].sessions });
}

module.exports = { createRouter, recordRun, keepAlive };
