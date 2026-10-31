'use strict';
/**
 * Virtual DOE Lab — backend (Express). Runs on Vercel as a serverless function
 * (see api/index.js and vercel.json) or locally with `npm run dev`.
 *
 *   GET  /api                         API index: list of endpoints + link to the docs
 *   GET  /api/health                  check the server is up
 *   GET  /api/sims/:sim               constants the page needs for drawing
 *   POST /api/sims/:sim/simulate      run one experiment (physics + random noise on the server)
 *   GET  /api/auth/config             Google client ID / API key / app ID (public values)
 *   GET  /api/auth/session            is the user signed in to Google right now?
 *   POST /api/auth/ping               the page is still being used → restart the 1-hour idle timer
 *   POST /api/auth/google             swap the popup's one-time code for tokens → session cookie
 *   GET  /api/auth/token              short-lived access token for the Google Picker
 *   POST /api/auth/logout             end the Google session
 *   POST /api/drive/upload            upload a CSV to the chosen Drive folder
 *   POST /api/drive/folder            create a new folder in the user's Drive
 */
const express = require('express');
const { getSim, prepareParams, SIM_NAMES } = require('./sims');
const google = require('./google');
const { readSession, writeSession, clearSession } = require('./session');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// ---------------------------------------------------------------------------
// CORS + origin check
// The frontend can be on the same domain (Vercel) or on GitHub Pages.
// ALLOWED_ORIGINS = comma-separated list, e.g. "https://sszky.github.io"
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

function isSameOrigin(req, origin) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return origin === `${proto}://${req.headers.host}`;
}

app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  const allowed = !origin || isSameOrigin(req, origin) || allowedOrigins.includes(origin);

  if (origin && allowed) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    if (!allowed) return res.sendStatus(403);
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '600');
    return res.sendStatus(204);
  }
  // Block requests that change something (login, upload) from unknown websites.
  if (req.method !== 'GET' && !allowed) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  res.set('Cache-Control', 'no-store');
  next();
});

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// Experiments
// ---------------------------------------------------------------------------
// API index: what anyone sees when they open the base URL in a browser.
app.get('/api', (req, res) => {
  res.json({
    name: 'Virtual DOE Lab API',
    description: 'Runs the physics of four Design of Experiments labs and returns the result as JSON.',
    baseUrl: 'https://virtual-doe-lab.vercel.app/api',
    docs: 'https://github.com/Sszky/VirtualDOELab#web-api',
    experiments: SIM_NAMES,
    endpoints: {
      'GET /api/health': 'Check that the API is up',
      'GET /api/sims/:sim': 'Constants a client needs to draw the scene',
      'POST /api/sims/:sim/simulate': 'Run one experiment (JSON body = factor values) and get the result',
    },
    example: {
      request: 'POST /api/sims/waterBottleRocket/simulate',
      body: { angleDeg: 45, fins: 4, waterVolumeML: 500, pressurePSI: 60, mode: 'deterministic' },
    },
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/sims/:sim', (req, res) => {
  const sim = getSim(req.params.sim);
  if (!sim) return res.status(404).json({ error: 'Unknown experiment.' });
  res.json({ constants: sim.publicConstants });
});

app.post('/api/sims/:sim/simulate', (req, res) => {
  const sim = getSim(req.params.sim);
  if (!sim) return res.status(404).json({ error: 'Unknown experiment.' });
  const params = req.body && typeof req.body === 'object' ? prepareParams(sim, req.body) : null;
  if (!params) return res.status(400).json({ error: 'Invalid experiment parameters.' });
  res.json(sim.simulate(params));
});

// ---------------------------------------------------------------------------
// Google session (Drive)
// ---------------------------------------------------------------------------
app.get('/api/auth/config', (req, res) => res.json(google.publicConfig()));

app.get('/api/auth/session', (req, res) => {
  res.json({ signedIn: Boolean(readSession(req)) });
});

app.post('/api/auth/ping', (req, res) => {
  const session = readSession(req);
  if (!session) return res.json({ signedIn: false });
  writeSession(res, session);
  res.json({ signedIn: true });
});

app.post(
  '/api/auth/google',
  asyncRoute(async (req, res) => {
    const code = req.body?.code;
    if (typeof code !== 'string' || !code || code.length > 512) {
      return res.status(400).json({ error: 'Missing Google authorization code.' });
    }
    const tokens = await google.exchangeCode(code);
    const session = { createdAt: Date.now(), ...tokens };
    writeSession(res, session);
    res.json({ accessToken: session.accessToken, expiresAt: session.accessTokenExpiresAt });
  })
);

/** Returns a valid access token, refreshing it with the refresh token if needed. */
async function sessionAccessToken(req, res) {
  const session = readSession(req);
  if (!session) return null;
  if (session.accessToken && Date.now() < session.accessTokenExpiresAt) {
    writeSession(res, session); // used now → restart the idle timer
    return session;
  }
  if (!session.refreshToken) return null;
  try {
    const tokens = await google.refreshAccessToken(session.refreshToken);
    const updated = { ...session, ...tokens };
    writeSession(res, updated);
    return updated;
  } catch (error) {
    if (error.status === 401) {
      clearSession(res); // user removed access in their Google account
      return null;
    }
    throw error;
  }
}

app.get(
  '/api/auth/token',
  asyncRoute(async (req, res) => {
    const session = await sessionAccessToken(req, res);
    if (!session) return res.status(401).json({ error: 'Not signed in to Google.' });
    res.json({ accessToken: session.accessToken, expiresAt: session.accessTokenExpiresAt });
  })
);

app.post(
  '/api/auth/logout',
  asyncRoute(async (req, res) => {
    const session = readSession(req);
    clearSession(res);
    if (session) await google.revoke(session.refreshToken || session.accessToken);
    res.json({ signedIn: false });
  })
);

app.post(
  '/api/drive/upload',
  asyncRoute(async (req, res) => {
    const { content, filename, folderId = '' } = req.body || {};
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'There is no file content to save.' });
    }
    // Any readable name is fine (Thai included); block only control characters,
    // slashes, and anything that is not a .csv file.
    if (
      typeof filename !== 'string' ||
      filename.length > 120 ||
      !/\.csv$/i.test(filename) ||
      filename.trim().length <= 4 ||
      /[\u0000-\u001f\\/]/.test(filename)
    ) {
      return res.status(400).json({ error: 'Invalid file name.' });
    }
    if (typeof folderId !== 'string' || (folderId && !/^[\w-]{1,128}$/.test(folderId))) {
      return res.status(400).json({ error: 'Invalid Drive folder.' });
    }
    const session = await sessionAccessToken(req, res);
    if (!session) return res.status(401).json({ error: 'Not signed in to Google.' });

    const file = await google.uploadFile(session.accessToken, {
      content,
      filename,
      mimeType: 'text/csv',
      folderId,
    });
    res.json({ id: file.id, name: file.name, webViewLink: file.webViewLink });
  })
);

app.post(
  '/api/drive/folder',
  asyncRoute(async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const parentId = req.body?.parentId || '';
    // Drive allows almost any name; block only empty, very long, or control characters.
    if (!name || name.length > 100 || /[\u0000-\u001f]/.test(name)) {
      return res.status(400).json({ error: 'Invalid folder name.' });
    }
    if (typeof parentId !== 'string' || (parentId && !/^[\w-]{1,128}$/.test(parentId))) {
      return res.status(400).json({ error: 'Invalid Drive folder.' });
    }
    const session = await sessionAccessToken(req, res);
    if (!session) return res.status(401).json({ error: 'Not signed in to Google.' });

    const folder = await google.createFolder(session.accessToken, { name, parentId });
    res.json({ id: folder.id, name: folder.name, webViewLink: folder.webViewLink });
  })
);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Server error.' });
});

module.exports = app;
