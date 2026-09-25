/**
 * app.js — หน้า Parachute (UX/UI ยกมาจาก waterBottleRocket/app.js ทั้งหมด เปลี่ยนแค่ engine + ตัวละครในฉาก)
 *
 * โครงไฟล์:
 *  1) MODULE — ทุกอย่างที่เฉพาะของโมดูลนี้ (engine, ปัจจัย, คอลัมน์ตาราง, รูปวาดในฉาก)
 *  2) ส่วนที่เหลือ — ใช้ร่วมกันแบบเดียวกับ paperHelicopter/app.js (ฉากตกแนวดิ่ง, ตาราง, กราฟ, ภาษา/ธีม, responsive)
 * อาศัย window.ParachutePhysics จาก physics.js และ window.I18N/applyTranslations จาก i18n.js
 */
(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
  const { I18N, formatTemplate, applyTranslations } = window;

  // =====================================================================
  // 1) MODULE — ส่วนเฉพาะของร่มชูชีพ
  // =====================================================================
  const MATERIAL_COLORS = { plastic: '#a61936', nylon: '#7a0019', paper: '#d5a62e' };

  const MODULE = {
    simulate: window.ParachutePhysics.simulateDrop,
    csvPrefix: 'parachute_results',
    // type 'choice' = ปุ่มเลือก (radio name = key), 'range' = slider `${id}Range` + ช่องตัวเลข `${id}Number`
    factors: [
      { key: 'shape', type: 'choice', levels: ['round', 'square', 'hexagon'], thKey: 'thShape' },
      { key: 'material', type: 'choice', levels: ['plastic', 'nylon', 'paper'], thKey: 'thMaterial' },
      { key: 'diameterCm', type: 'range', id: 'size', unit: ' cm', thKey: 'thSize' },
      { key: 'stringCm', type: 'range', id: 'string', unit: ' cm', thKey: 'thString' },
    ],
    constant: { key: 'heightM', id: 'height' },
    // คอลัมน์เสริม (แสดงตอนขยายตาราง)
    extras: [
      { key: 'impactSpeed', thKey: 'thImpactSpeed', digits: 2 },
      { key: 'cd', thKey: 'thCd', digits: 3 },
      { key: 'heightM', thKey: 'thHeight', digits: 0 },
    ],

    /** วาดร่มการ์ตูนเป็น SVG ขนาดจริง (px) ตามปัจจัย — คืน {svg, w, h} */
    buildActor(p) {
      const W = 50 + ((p.diameterCm - 30) / 60) * 50; // 30–90 cm -> 50–100 px
      const ch = W * 0.42;
      const cord = 18 + ((p.stringCm - 20) / 60) * 30; // 20–80 cm -> 18–48 px
      const payW = 14;
      const payH = 11;
      const H = ch + cord + payH;
      const mouth = `Q${W / 2} ${ch * 0.82} 0 ${ch} Z`;
      const canopyPaths = {
        round: `M0 ${ch} C0 ${-ch / 3} ${W} ${-ch / 3} ${W} ${ch} ${mouth}`,
        square: `M0 ${ch} L${W * 0.05} ${ch * 0.14} Q${W * 0.05} 0 ${W * 0.13} 0 L${W * 0.87} 0 Q${W * 0.95} 0 ${W * 0.95} ${ch * 0.14} L${W} ${ch} ${mouth}`,
        hexagon: `M0 ${ch} L${W * 0.13} ${ch * 0.32} L${W * 0.34} 0 L${W * 0.66} 0 L${W * 0.87} ${ch * 0.32} L${W} ${ch} ${mouth}`,
      };
      const d = canopyPaths[p.shape] || canopyPaths.round;
      const color = MATERIAL_COLORS[p.material] || MATERIAL_COLORS.plastic;
      const px = W / 2;
      const py = ch + cord;
      const cords = [2, W * 0.3, W * 0.7, W - 2]
        .map((x) => `<line x1="${x}" y1="${ch * 0.93}" x2="${px + (x < px ? -4 : 4)}" y2="${py}" />`)
        .join('');
      const gores = [0.3, 0.5, 0.7]
        .map((f) => `<line x1="${W * f}" y1="0" x2="${W * (0.5 + (f - 0.5) * 1.25)}" y2="${ch}" />`)
        .join('');
      const svg = `<svg class="actor-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs><clipPath id="canopyClip"><path d="${d}" /></clipPath></defs>
        <g stroke="#5b4a3f" stroke-width="1" stroke-linecap="round">${cords}</g>
        <path d="${d}" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="1" stroke-linejoin="round" />
        <g clip-path="url(#canopyClip)" stroke="rgba(255,255,255,0.35)" stroke-width="2">${gores}</g>
        <path d="M${W * 0.18} ${ch * 0.42} Q${W * 0.3} ${ch * 0.12} ${W * 0.45} ${ch * 0.08}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2.5" stroke-linecap="round" />
        <rect x="${px - payW / 2}" y="${py}" width="${payW}" height="${payH}" rx="2" fill="#1b3a6b" />
        <rect x="${px - payW / 2 + 2}" y="${py + 2}" width="${payW - 4}" height="3" rx="1" fill="#7fb2e0" />
      </svg>`;
      return { svg, w: W, h: H };
    },

    /** ท่าทางระหว่างตก: แกว่งเบา ๆ ตอนกำลังตก (หมุนรอบจุดบนสุดของ actor) */
    applyPose(actorEl, sample, simT, falling) {
      return falling ? 3 * Math.sin(simT * 2.4) : 0;
    },
  };

  // =====================================================================
  // 2) ส่วนร่วม — ฉากตกแนวดิ่ง / ตาราง / กราฟ / ภาษา / ธีม / responsive
  // =====================================================================
  const RESPONSE_KEY = 'time';
  const EFFECTS_PALETTE = ['#a61936', '#1b6ea6', '#2f8f46', '#d5a62e', '#6a4c93', '#c2571b', '#0f766e', '#b45309'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const els = {
    modeRadios: document.querySelectorAll('input[name="mode"]'),
    modeHint: document.getElementById('modeHint'),
    launchBtn: document.getElementById('launchBtn'),
    warningBox: document.getElementById('warningBox'),

    languageButton: document.getElementById('languageButton'),
    themeButton: document.getElementById('themeButton'),

    topbar: document.querySelector('.topbar'),
    intro: document.querySelector('.intro'),
    controlsPanel: document.querySelector('.controls-panel'),
    simulationPanel: document.querySelector('.simulation-panel'),

    scene: document.getElementById('scene'),
    axisY: document.getElementById('axisY'),
    ground: document.querySelector('.scene-ground'),
    releaseLine: document.getElementById('releaseLine'),
    actor: document.getElementById('actor'),
    liveStats: document.getElementById('liveStats'),

    resultsSidebar: document.getElementById('resultsSidebar'),
    expandTableBtn: document.getElementById('expandTableBtn'),
    tableBackdrop: document.getElementById('tableBackdrop'),
    tableBody: document.getElementById('resultsTableBody'),
    clearTableBtn: document.getElementById('clearTableBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),

    effectsModeRadios: document.querySelectorAll('input[name="effectsMode"]'),
    effectsFactorX: document.getElementById('effectsFactorX'),
    effectsFactorGroup: document.getElementById('effectsFactorGroup'),
    effectsFactorGroupWrap: document.getElementById('effectsFactorGroupWrap'),
    effectsChartTitle: document.getElementById('effectsChartTitle'),
    effectsChart: document.getElementById('effectsChart'),
    effectsChartEmpty: document.getElementById('effectsChartEmpty'),
    effectsLegend: document.getElementById('effectsLegend'),
  };

  let language = 'th';
  const results = []; // เก็บในหน่วยความจำเท่านั้น (ไม่มี localStorage)
  let animationHandle = null;
  let tableExpanded = false;
  let lastResult = null;
  let actorKey = ''; // กันสร้าง SVG ใหม่ทุกเฟรมถ้าปัจจัยไม่เปลี่ยน
  const TABLE_COLS = 1 + MODULE.factors.length + 1 + MODULE.extras.length + 1;

  // ---------------------------------------------------------------------
  // input: slider <-> ช่องตัวเลข
  // ---------------------------------------------------------------------
  function bindPair(rangeEl, numberEl) {
    rangeEl.addEventListener('input', () => {
      numberEl.value = rangeEl.value;
    });
    numberEl.addEventListener('input', () => {
      let v = Number(numberEl.value);
      if (!isNaN(v)) {
        v = Math.min(Number(rangeEl.max), Math.max(Number(rangeEl.min), v));
        rangeEl.value = v;
      }
    });
    numberEl.addEventListener('change', () => {
      let v = Number(numberEl.value);
      if (isNaN(v)) v = Number(rangeEl.min);
      v = Math.min(Number(rangeEl.max), Math.max(Number(rangeEl.min), v));
      numberEl.value = v;
      rangeEl.value = v;
    });
  }

  const rangeInputs = [...MODULE.factors.filter((f) => f.type === 'range'), MODULE.constant].map((f) => ({
    key: f.key,
    range: document.getElementById(`${f.id}Range`),
    number: document.getElementById(`${f.id}Number`),
  }));
  rangeInputs.forEach((r) => bindPair(r.range, r.number));

  function readParams() {
    const params = {};
    MODULE.factors.forEach((f) => {
      if (f.type === 'choice') {
        const checked = document.querySelector(`input[name="${f.key}"]:checked`);
        params[f.key] = checked ? checked.value : f.levels[0];
      }
    });
    rangeInputs.forEach((r) => {
      params[r.key] = Number(r.number.value);
    });
    const modeInput = document.querySelector('input[name="mode"]:checked');
    params.mode = modeInput ? modeInput.value : 'deterministic';
    return params;
  }

  // ---------------------------------------------------------------------
  // ฉาก: แกน Y แกนเดียว (ความสูง) สเกลตายตัวตามความสูงที่ปล่อย
  // ---------------------------------------------------------------------
  function actorScale() {
    if (window.matchMedia('(max-width: 600px)').matches) return 0.5;
    if (window.matchMedia('(max-width: 900px)').matches) return 0.85;
    return 1;
  }

  function renderActor(params) {
    const s = actorScale();
    const key = JSON.stringify([params, s]);
    if (key === actorKey) return;
    actorKey = key;
    const { svg, w, h } = MODULE.buildActor(params);
    els.actor.innerHTML = svg;
    const svgEl = els.actor.firstElementChild;
    svgEl.setAttribute('width', w * s);
    svgEl.setAttribute('height', h * s);
    els.actor.style.width = `${w * s}px`;
    els.actor.style.height = `${h * s}px`;
  }

  function computeTransform(heightM) {
    const w = els.scene.clientWidth;
    const h = els.scene.clientHeight;
    const compact = window.matchMedia('(max-width: 600px)').matches;
    const groundY = h - els.ground.offsetHeight; // 0 m = ขอบบนของแถบหญ้า
    const topPad = compact ? 26 : 38; // เว้นที่ป้าย "ความสูง (m)"
    const actorH = els.actor.offsetHeight;
    const usable = Math.max(10, groundY - topPad - actorH);
    const scale = usable / Math.max(heightM, 0.01);
    return {
      w,
      h,
      heightM,
      groundY,
      cx: w / 2,
      toPy: (y) => groundY - y * scale,
    };
  }

  function formatTick(v) {
    return v < 10 ? v.toFixed(1) : v.toFixed(0);
  }

  function renderAxes(transform) {
    const count = window.matchMedia('(max-width: 600px)').matches ? 2 : 4;
    els.axisY.innerHTML = '';
    for (let i = 0; i <= count; i++) {
      const span = document.createElement('span');
      span.textContent = formatTick((transform.heightM * i) / count);
      els.axisY.appendChild(span);
    }
    const topPx = transform.toPy(transform.heightM);
    els.axisY.style.top = `${topPx - 8}px`;
    els.axisY.style.bottom = `${transform.h - transform.groundY - 8}px`;
    els.releaseLine.style.top = `${topPx}px`;
  }

  /** actor ยึดจุด "ล่างกลาง" ไว้ที่ตำแหน่งความสูง y */
  function updateActorFrame(transform, sample, simT, falling) {
    const aw = els.actor.offsetWidth;
    const ah = els.actor.offsetHeight;
    const py = transform.toPy(sample.y);
    const tilt = reducedMotion.matches ? 0 : MODULE.applyPose(els.actor, sample, simT, falling) || 0;
    els.actor.style.transform = `translate(${transform.cx - aw / 2}px, ${py - ah}px) rotate(${tilt}deg)`;
  }

  function interpolateAtTime(trajectory, simT) {
    if (simT <= trajectory[0].t) return trajectory[0];
    const last = trajectory[trajectory.length - 1];
    if (simT >= last.t) return last;
    let lo = 0;
    let hi = trajectory.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (trajectory[mid].t <= simT) lo = mid;
      else hi = mid;
    }
    const a = trajectory[lo];
    const b = trajectory[hi];
    const frac = b.t === a.t ? 0 : (simT - a.t) / (b.t - a.t);
    return { t: simT, y: a.y + (b.y - a.y) * frac, v: a.v + (b.v - a.v) * frac };
  }

  function formatLiveStats(sample) {
    const dict = I18N[language];
    const stat = (label, value) =>
      `<span class="live-stat"><span class="live-stat-label">${label}:</span><span class="live-stat-value">${value}</span></span>`;
    const dash = '—';
    return (
      stat(dict.liveTime, sample ? `${sample.t.toFixed(2)} s` : dash) +
      stat(dict.liveAltitude, sample ? `${sample.y.toFixed(2)} m` : dash) +
      stat(dict.liveSpeed, sample ? `${sample.v.toFixed(2)} m/s` : dash)
    );
  }

  let lastLiveSample = null;
  function renderLiveStats(sample) {
    lastLiveSample = sample;
    els.liveStats.innerHTML = formatLiveStats(sample);
  }

  /** ฉากนิ่ง: actor ค้างที่จุดปล่อย รูปร่างตามปัจจัยปัจจุบัน */
  function redrawIdleScene() {
    if (animationHandle) return;
    lastResult = null;
    const params = readParams();
    renderActor(params);
    const transform = computeTransform(params.heightM);
    renderAxes(transform);
    updateActorFrame(transform, { t: 0, y: params.heightM, v: 0 }, 0, false);
  }

  /** วาดซ้ำเฟรมปัจจุบัน (ตอน scene เปลี่ยนขนาด) — ถ้ามีผลล่าสุดให้ค้างที่พื้น ไม่งั้นกลับไปจุดปล่อย */
  function redrawCurrentFrame() {
    if (animationHandle) return;
    if (!lastResult) {
      redrawIdleScene();
      return;
    }
    const { params, trajectory } = lastResult;
    actorKey = '';
    renderActor(params);
    const transform = computeTransform(params.heightM);
    renderAxes(transform);
    const last = trajectory[trajectory.length - 1];
    updateActorFrame(transform, last, last.t, false);
  }

  function startAnimation(result) {
    const { trajectory, summary, params } = result;
    renderActor(params);
    const transform = computeTransform(params.heightM);
    renderAxes(transform);

    const realTime = Math.max(summary.time, 0.05);
    const playbackDuration = Math.min(6, Math.max(1.5, realTime));
    const timeScale = realTime / playbackDuration;
    const startWall = performance.now();

    setLaunchEnabled(false);
    if (animationHandle) cancelAnimationFrame(animationHandle);

    function frame(now) {
      const simT = ((now - startWall) / 1000) * timeScale;
      const finished = simT >= realTime;
      const sample = finished ? trajectory[trajectory.length - 1] : interpolateAtTime(trajectory, simT);

      updateActorFrame(transform, sample, sample.t, !finished);
      renderLiveStats(sample);

      if (finished) {
        animationHandle = null;
        lastResult = result;
        setLaunchEnabled(true);
        appendResultRow(result);
        return;
      }
      animationHandle = requestAnimationFrame(frame);
    }

    animationHandle = requestAnimationFrame(frame);
  }

  function setLaunchEnabled(enabled) {
    els.launchBtn.disabled = !enabled;
    els.launchBtn.textContent = enabled ? I18N[language].launch : I18N[language].launching;
  }

  // ---------------------------------------------------------------------
  // ตารางผล
  // ---------------------------------------------------------------------
  function factorDef(key) {
    return MODULE.factors.find((f) => f.key === key);
  }

  /** ค่าปัจจัยเป็นข้อความที่แสดงผล (ปัจจัยแบบเลือกจะแปลภาษา) */
  function formatFactorValue(key, value, withUnit) {
    const f = factorDef(key);
    if (f && f.type === 'choice') return I18N[language][value] || value;
    return withUnit && f ? `${value}${f.unit}` : String(value);
  }

  function appendResultRow(result) {
    results.push({ ...result.params, ...result.summary });
    renderTable();
    renderEffectsChart();
  }

  function renderTable() {
    const dict = I18N[language];
    if (results.length === 0) {
      els.tableBody.innerHTML = `<tr class="empty-row"><td colspan="${TABLE_COLS}">${dict.tableEmpty}</td></tr>`;
      return;
    }
    els.tableBody.innerHTML = results
      .map((r, i) => {
        const factorCells = MODULE.factors.map((f) => `<td>${formatFactorValue(f.key, r[f.key], false)}</td>`).join('');
        const extraCells = MODULE.extras
          .map((x) => `<td class="col-extra">${Number(r[x.key]).toFixed(x.digits)}</td>`)
          .join('');
        return `<tr>
          <td>${i + 1}</td>
          ${factorCells}
          <td>${r[RESPONSE_KEY].toFixed(2)}</td>
          ${extraCells}
          <td class="col-extra">${dict[r.mode] || r.mode}</td>
        </tr>`;
      })
      .join('');
  }

  els.clearTableBtn.addEventListener('click', () => {
    results.length = 0;
    renderTable();
    renderEffectsChart();
  });

  // ---------------------------------------------------------------------
  // Main Effects / Interaction Plot — ปัจจัยแบบเลือกเรียงตามลำดับ levels, แบบตัวเลขเรียงน้อย→มาก
  // ---------------------------------------------------------------------
  function cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function factorLabel(key) {
    return I18N[language][`factorName_${key}`] || key;
  }

  function orderedValues(key, values) {
    const f = factorDef(key);
    const unique = [...new Set(values.map(String))];
    if (f && f.type === 'choice') return f.levels.filter((l) => unique.includes(l));
    return unique.map(Number).sort((a, b) => a - b).map(String);
  }

  function computeEffectsSeries(xKey, groupKey) {
    const xValues = orderedValues(xKey, results.map((r) => r[xKey]));
    if (!groupKey) {
      const groups = {};
      results.forEach((r) => {
        (groups[String(r[xKey])] = groups[String(r[xKey])] || []).push(r[RESPONSE_KEY]);
      });
      const points = xValues.map((x) => ({ x, y: mean(groups[x]) }));
      return { series: [{ key: '__single__', label: null, points }], xValues };
    }
    const byGroup = {};
    results.forEach((r) => {
      const gv = String(r[groupKey]);
      const xv = String(r[xKey]);
      byGroup[gv] = byGroup[gv] || {};
      (byGroup[gv][xv] = byGroup[gv][xv] || []).push(r[RESPONSE_KEY]);
    });
    const groupValues = orderedValues(groupKey, results.map((r) => r[groupKey]));
    const series = groupValues.map((gv) => ({
      key: gv,
      label: formatFactorValue(groupKey, factorDef(groupKey).type === 'choice' ? gv : Number(gv), true),
      points: xValues.filter((xv) => byGroup[gv][xv]).map((xv) => ({ x: xv, y: mean(byGroup[gv][xv]) })),
    }));
    return { series, xValues };
  }

  function updateEffectsTitle(mode, xKey, groupKey) {
    els.effectsChartTitle.textContent =
      mode === 'interaction' && groupKey && groupKey !== xKey
        ? `${factorLabel(xKey)} × ${factorLabel(groupKey)}`
        : factorLabel(xKey);
  }

  function drawEffectsSeries(context, width, height, series, xValues, xKey) {
    const padding = { left: 46, right: 24, top: 18, bottom: 34 };
    const allY = series.flatMap((s) => s.points.map((p) => p.y));
    const minimumY = Math.min(...allY) * 0.95;
    const maximumY = Math.max(...allY) * 1.05 || 1;
    const xStep = (width - padding.left - padding.right) / Math.max(1, xValues.length - 1);
    const xIndex = new Map(xValues.map((v, i) => [v, i]));
    const toY = (value) =>
      padding.top + ((maximumY - value) / (maximumY - minimumY || 1)) * (height - padding.top - padding.bottom);

    context.strokeStyle = cssVar('--line') || '#e7dadd';
    context.fillStyle = cssVar('--muted') || '#79656a';
    context.lineWidth = 1;
    context.font = '11px system-ui';

    for (let i = 0; i < 4; i++) {
      const y = padding.top + (i * (height - padding.top - padding.bottom)) / 3;
      const labelValue = maximumY - (i * (maximumY - minimumY)) / 3;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
      context.fillText(labelValue.toFixed(2), 4, y + 4);
    }

    const stride = Math.ceil(xValues.length / 10);
    const f = factorDef(xKey);
    xValues.forEach((x, i) => {
      if (i % stride !== 0 && i !== xValues.length - 1) return;
      const px = padding.left + i * xStep;
      const text = formatFactorValue(xKey, f.type === 'choice' ? x : Number(x), true);
      const tw = context.measureText(text).width;
      context.fillText(text, Math.min(width - tw - 2, Math.max(2, px - tw / 2)), height - 10);
    });

    series.forEach((s, si) => {
      const color = EFFECTS_PALETTE[si % EFFECTS_PALETTE.length];
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.beginPath();
      s.points.forEach((p, pi) => {
        const px = padding.left + xIndex.get(p.x) * xStep;
        const py = toY(p.y);
        if (pi === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      });
      context.stroke();

      s.points.forEach((p) => {
        const px = padding.left + xIndex.get(p.x) * xStep;
        const py = toY(p.y);
        context.fillStyle = cssVar('--panel') || '#ffffff';
        context.beginPath();
        context.arc(px, py, 5, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.stroke();
      });
    });
  }

  function renderEffectsLegend(mode, series) {
    if (mode !== 'interaction') {
      els.effectsLegend.hidden = true;
      els.effectsLegend.innerHTML = '';
      return;
    }
    els.effectsLegend.hidden = false;
    els.effectsLegend.innerHTML = series
      .map((s, i) => {
        const color = EFFECTS_PALETTE[i % EFFECTS_PALETTE.length];
        return `<span class="effects-legend-item"><span class="effects-legend-swatch" style="background:${color}"></span>${s.label}</span>`;
      })
      .join('');
  }

  function syncFactorSelectOptions() {
    const xVal = els.effectsFactorX.value;
    Array.from(els.effectsFactorGroup.options).forEach((opt) => {
      opt.disabled = opt.value === xVal;
    });
    if (els.effectsFactorGroup.value === xVal) {
      const next = Array.from(els.effectsFactorGroup.options).find((o) => !o.disabled);
      if (next) els.effectsFactorGroup.value = next.value;
    }
  }

  function currentEffectsMode() {
    return document.querySelector('input[name="effectsMode"]:checked')?.value || 'main';
  }

  function updateEffectsModeVisibility() {
    els.effectsFactorGroupWrap.hidden = currentEffectsMode() !== 'interaction';
  }

  function renderEffectsChart() {
    const mode = currentEffectsMode();
    const xKey = els.effectsFactorX.value;
    const groupKey = mode === 'interaction' ? els.effectsFactorGroup.value : null;
    updateEffectsTitle(mode, xKey, groupKey);

    const canvas = els.effectsChart;
    const context = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 700;
    const height = canvas.clientHeight || 260;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(pixelRatio, pixelRatio);
    context.clearRect(0, 0, width, height);

    const sameFactor = mode === 'interaction' && groupKey === xKey;
    const distinctXCount = new Set(results.map((r) => String(r[xKey]))).size;
    if (sameFactor || results.length === 0 || distinctXCount < 2) {
      els.effectsChartEmpty.textContent = sameFactor
        ? I18N[language].effectsEmptySameFactor
        : formatTemplate(I18N[language].effectsEmptyDefault, { factor: factorLabel(xKey) });
      els.effectsChartEmpty.hidden = false;
      els.effectsLegend.hidden = true;
      els.effectsLegend.innerHTML = '';
      return;
    }
    els.effectsChartEmpty.hidden = true;

    const { series, xValues } = computeEffectsSeries(xKey, groupKey);
    drawEffectsSeries(context, width, height, series, xValues, xKey);
    renderEffectsLegend(mode, series);
  }

  els.effectsModeRadios.forEach((r) =>
    r.addEventListener('change', () => {
      updateEffectsModeVisibility();
      renderEffectsChart();
    })
  );
  els.effectsFactorX.addEventListener('change', () => {
    syncFactorSelectOptions();
    renderEffectsChart();
  });
  els.effectsFactorGroup.addEventListener('change', renderEffectsChart);

  // ---------------------------------------------------------------------
  // Export CSV
  // ---------------------------------------------------------------------
  els.exportCsvBtn.addEventListener('click', () => {
    if (results.length === 0) {
      showWarning(translateWarnings([{ key: 'exportEmpty' }]));
      return;
    }
    const dict = I18N[language];
    const header = [
      dict.thRun,
      ...MODULE.factors.map((f) => dict[f.thKey]),
      dict.thTime,
      ...MODULE.extras.map((x) => dict[x.thKey]),
      dict.thMode,
    ].join(',');
    const rows = results.map((r, i) =>
      [
        i + 1,
        ...MODULE.factors.map((f) => formatFactorValue(f.key, r[f.key], false)),
        r[RESPONSE_KEY].toFixed(2),
        ...MODULE.extras.map((x) => Number(r[x.key]).toFixed(x.digits)),
        dict[r.mode] || r.mode,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+/, '');
    a.href = url;
    a.download = `${MODULE.csvPrefix}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ---------------------------------------------------------------------
  // ความสูงเท่ากัน 3 กล่อง (desktop) + header มือถือ + resize
  // ---------------------------------------------------------------------
  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function syncPanelHeights() {
    if (!window.matchMedia('(min-width: 901px)').matches) {
      els.simulationPanel.style.height = '';
      els.resultsSidebar.style.height = '';
      return;
    }
    if (tableExpanded) return;
    const h = `${els.controlsPanel.offsetHeight}px`;
    els.simulationPanel.style.height = h;
    els.resultsSidebar.style.height = h;
  }

  let lastScrollY = window.scrollY;
  let upDistance = 0;
  function handleHeaderScroll() {
    if (!window.matchMedia('(max-width: 600px)').matches) {
      els.topbar.classList.remove('topbar-hidden');
      lastScrollY = window.scrollY;
      upDistance = 0;
      return;
    }
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;
    lastScrollY = currentY;
    if (delta === 0) return;
    if (delta > 0) {
      upDistance = 0;
      if (currentY > 80) els.topbar.classList.add('topbar-hidden');
      return;
    }
    upDistance += -delta;
    if (upDistance > 12 || currentY <= 80) {
      els.topbar.classList.remove('topbar-hidden');
    }
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  const mobileHeaderQuery = window.matchMedia('(max-width: 600px)');
  mobileHeaderQuery.addEventListener('change', () => {
    if (!mobileHeaderQuery.matches) els.topbar.classList.remove('topbar-hidden');
    lastScrollY = window.scrollY;
  });

  const debouncedSyncPanelHeights = debounce(syncPanelHeights, 150);
  if (window.ResizeObserver) {
    new ResizeObserver(syncPanelHeights).observe(els.controlsPanel);
    new ResizeObserver(debouncedSyncPanelHeights).observe(document.body);
    // ตำแหน่ง actor/แกนเป็น px ต้องคำนวณใหม่เมื่อฉากเปลี่ยนขนาด
    new ResizeObserver(() => {
      actorKey = '';
      redrawCurrentFrame();
    }).observe(els.scene);
  }
  window.addEventListener('resize', debouncedSyncPanelHeights);

  // ---------------------------------------------------------------------
  // ตารางขยาย — modal กลางจอ
  // ---------------------------------------------------------------------
  function openTableExpand() {
    tableExpanded = true;
    els.resultsSidebar.style.height = '';
    els.resultsSidebar.classList.add('expanded');
    els.tableBackdrop.classList.add('visible');
    document.body.classList.add('table-modal-open');
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((el) => el && el.setAttribute('inert', ''));
    els.expandTableBtn.dataset.i18n = 'collapseTable';
    els.expandTableBtn.setAttribute('aria-label', 'Collapse table');
    els.expandTableBtn.textContent = I18N[language].collapseTable;
  }

  function closeTableExpand() {
    tableExpanded = false;
    els.resultsSidebar.classList.remove('expanded');
    els.tableBackdrop.classList.remove('visible');
    document.body.classList.remove('table-modal-open');
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((el) => el && el.removeAttribute('inert'));
    els.expandTableBtn.dataset.i18n = 'expandTable';
    els.expandTableBtn.setAttribute('aria-label', 'Expand table');
    els.expandTableBtn.textContent = I18N[language].expandTable;
    syncPanelHeights();
  }

  els.expandTableBtn.addEventListener('click', () => (tableExpanded ? closeTableExpand() : openTableExpand()));
  els.tableBackdrop.addEventListener('click', () => tableExpanded && closeTableExpand());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tableExpanded) closeTableExpand();
  });

  // ---------------------------------------------------------------------
  // คำเตือน / โหมด / ภาษา / ธีม
  // ---------------------------------------------------------------------
  function translateWarnings(warningList) {
    const dict = I18N[language].warnings;
    return warningList.map((w) => formatTemplate(dict[w.key] || w.key, w.params));
  }

  function showWarning(messages) {
    els.warningBox.textContent = messages.join(' / ');
    els.warningBox.hidden = false;
  }

  function clearWarning() {
    els.warningBox.hidden = true;
    els.warningBox.textContent = '';
  }

  function updateModeHint() {
    const selected = document.querySelector('input[name="mode"]:checked');
    els.modeHint.textContent =
      selected && selected.value === 'stochastic' ? I18N[language].stochHint : I18N[language].detHint;
  }
  els.modeRadios.forEach((radio) => radio.addEventListener('change', updateModeHint));

  function changeLanguage() {
    language = language === 'th' ? 'en' : 'th';
    els.languageButton.textContent = language === 'en' ? 'TH' : 'EN';
    document.documentElement.lang = language;
    applyTranslations(language);
    updateModeHint();
    renderTable();
    setLaunchEnabled(!els.launchBtn.disabled);
    renderLiveStats(lastLiveSample);
    renderEffectsChart();
  }

  function changeTheme() {
    document.body.classList.toggle('dark');
    els.themeButton.textContent = document.body.classList.contains('dark') ? '☀' : '☾';
    renderEffectsChart();
  }

  els.languageButton.addEventListener('click', changeLanguage);
  els.themeButton.addEventListener('click', changeTheme);

  // ---------------------------------------------------------------------
  // ปุ่มปล่อย + preview รูปร่างตามปัจจัยแบบ real-time
  // ---------------------------------------------------------------------
  els.launchBtn.addEventListener('click', () => {
    clearWarning();
    const result = MODULE.simulate(readParams());
    if (result.warnings.length > 0) showWarning(translateWarnings(result.warnings));
    startAnimation(result);
  });

  els.controlsPanel.addEventListener('input', (e) => {
    if (e.target.name === 'mode') return;
    redrawIdleScene();
  });

  // ---------------------------------------------------------------------
  // เริ่มต้น
  // ---------------------------------------------------------------------
  applyTranslations(language);
  updateModeHint();
  setLaunchEnabled(true);
  renderTable();
  renderLiveStats(null);
  syncPanelHeights();
  redrawIdleScene();
  updateEffectsModeVisibility();
  syncFactorSelectOptions();
  renderEffectsChart();
  } // ปิด init()
})();
