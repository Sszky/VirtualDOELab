'use strict';
/**
 * Local development: serves the website (sims-v2/) and the API on one port,
 * the same way Vercel does. Run with `npm run dev`, then open http://localhost:3000
 */
const path = require('path');
const express = require('express');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env')); // Node 20.12+: read .env if it exists
} catch {
  /* no .env file — fine for running the experiments; Google Drive needs it */
}

const api = require('./app');
const site = express();
site.use(api);
site.use(express.static(path.join(__dirname, '..', 'sims-v2')));

const port = Number(process.env.PORT) || 3000;
site.listen(port, () => console.log(`Virtual DOE Lab running at http://localhost:${port}`));
