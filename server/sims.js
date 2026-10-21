'use strict';
/**
 * Registry of the 4 experiments: which physics function runs each one,
 * the allowed inputs (same min/max as the sliders in each index.html),
 * and which constants the browser is allowed to see (only what it needs to
 * draw the scene — noise levels and model coefficients stay on the server).
 */
const { ParachutePhysics } = require('./physics/parachute');
const { HelicopterPhysics } = require('./physics/paperHelicopter');
const { RocketPhysics } = require('./physics/waterBottleRocket');
const { CatapultPhysics } = require('./physics/catapult');

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}

const SIMS = {
  parachute: {
    choices: { shape: ['round', 'square', 'hexagon'], material: ['plastic', 'nylon', 'paper'] },
    ranges: { diameterCm: [30, 90], stringCm: [20, 80], heightM: [10, 50] },
    simulate: ParachutePhysics.simulateDrop,
    publicConstants: {},
  },
  paperHelicopter: {
    ranges: { WL: [5, 15], WW: [2, 6], BL: [3, 10], BW: [1, 4], heightM: [1, 4] },
    simulate: HelicopterPhysics.simulateDrop,
    publicConstants: pick(HelicopterPhysics.CONSTANTS, ['SPINUP_TIME_S']),
  },
  waterBottleRocket: {
    ranges: { angleDeg: [1, 89], fins: [2, 8], waterVolumeML: [50, 1000], pressurePSI: [10, 100] },
    simulate: RocketPhysics.simulateFlight,
    publicConstants: {},
  },
  catapult: {
    ranges: { releaseDeg: [120, 185], firingDeg: [90, 140], cupCm: [20, 40], pinCm: [8, 24], bungeeCm: [14, 30] },
    simulate: CatapultPhysics.simulateLaunch,
    publicConstants: pick(CatapultPhysics.CONSTANTS, [
      'PIVOT_HEIGHT_M',
      'TOWER_OFFSET_M',
      'ARM_LENGTH_M',
      'BALL_DIAM_M',
      'MIN_GAP_DEG',
    ]),
  },
};

/**
 * Build the parameters for one run from the request body.
 * Returns null if a factor is missing; numbers outside the slider range are
 * clamped (the same thing the page does), so nobody can send impossible values.
 */
function prepareParams(sim, body) {
  const params = { mode: body.mode === 'stochastic' ? 'stochastic' : 'deterministic' };
  for (const [key, levels] of Object.entries(sim.choices || {})) {
    if (!levels.includes(body[key])) return null;
    params[key] = body[key];
  }
  for (const [key, [min, max]] of Object.entries(sim.ranges)) {
    const value = body[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    params[key] = Math.min(max, Math.max(min, value));
  }
  return params;
}

function getSim(name) {
  return Object.prototype.hasOwnProperty.call(SIMS, name) ? SIMS[name] : null;
}

module.exports = { getSim, prepareParams, SIM_NAMES: Object.keys(SIMS) };
