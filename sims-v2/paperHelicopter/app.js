/**
 * app.js — หน้า Paper Helicopter (UX/UI ยกมาจาก waterBottleRocket/app.js ทั้งหมด เปลี่ยนแค่ engine + ตัวละครในฉาก)
 *
 * โครงไฟล์:
 *  1) MODULE — ทุกอย่างที่เฉพาะของโมดูลนี้ (engine, ปัจจัย, คอลัมน์ตาราง, รูปวาดในฉาก)
 *  2) ส่วนที่เหลือ — ใช้ร่วมกันแบบเดียวกับ parachute/app.js (ฉากตกแนวดิ่ง, ตาราง, กราฟ, ภาษา/ธีม, responsive)
 * อาศัย window.HelicopterPhysics จาก physics.js และ window.I18N/applyTranslations จาก i18n.js
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
  // 1) MODULE — ส่วนเฉพาะของเฮลิคอปเตอร์กระดาษ
  // =====================================================================
  let actorGeom = null; // ขนาด px ของตัวล่าสุด ใช้หมุนทั้งตัวใน applyPose

  const MODULE = {
    simulate: window.HelicopterPhysics.simulateDrop,
    csvPrefix: 'paper_helicopter_results',
    // type 'range' = slider `${id}Range` + ช่องตัวเลข `${id}Number`
    factors: [
      { key: 'WL', type: 'range', id: 'wl', unit: ' cm', thKey: 'thWL' },
      { key: 'WW', type: 'range', id: 'ww', unit: ' cm', thKey: 'thWW' },
      { key: 'BL', type: 'range', id: 'bl', unit: ' cm', thKey: 'thBL' },
      { key: 'BW', type: 'range', id: 'bw', unit: ' cm', thKey: 'thBW' },
    ],
    constant: { key: 'heightM', id: 'height' },
    // ผลตอบที่เลือกเป็นแกน Y ของกราฟได้ (ตัวแรก = ค่าเริ่มต้น)
    responses: [
      { key: 'time', labelKey: 'yTime', unit: 's', digits: 2 },
      { key: 'impactSpeed', labelKey: 'yImpactSpeed', unit: 'm/s', digits: 2 },
      { key: 'massG', labelKey: 'yMass', unit: 'g', digits: 2 },
    ],
    // คอลัมน์เสริม (แสดงตอนขยายตาราง)
    extras: [
      { key: 'impactSpeed', thKey: 'thImpactSpeed', digits: 2 },
      { key: 'massG', thKey: 'thMass', digits: 2 },
      { key: 'heightM', thKey: 'thHeight', digits: 1 },
    ],

    /** วาดเฮลิคอปเตอร์กระดาษมองด้านข้างเป็น SVG ขนาดจริง (px) ตามปัจจัย — คืน {svg, w, h} */
    buildActor(p) {
      const blade = 26 + ((p.WL - 5) / 10) * 34; // WL 5–15 cm -> 26–60 px ต่อใบ
      const bladeT = 4 + ((p.WW - 2) / 4) * 6; // WW 2–6 cm -> ความหนาที่เห็น 4–10 px
      const bodyL = 18 + ((p.BL - 3) / 7) * 30; // BL 3–10 cm -> 18–48 px
      const bodyW = 7 + ((p.BW - 1) / 3) * 8; // BW 1–4 cm -> 7–15 px
      const W = blade * 2 + 2;
      const H = bladeT + bodyL + 4;
      const cx = W / 2;
      actorGeom = { cx, WL: p.WL, heightM: p.heightM };
      const svg = `<svg class="actor-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g class="heli-body">
          <rect class="heli-body-face" x="${cx - bodyW / 2}" y="${bladeT - 1}" width="${bodyW}" height="${bodyL}" rx="1.5" fill="#fffaf0" stroke="#9c6b3c" stroke-width="1" />
          <line x1="${cx}" y1="${bladeT + 3}" x2="${cx}" y2="${bladeT + bodyL - 9}" stroke="#d9b98f" stroke-width="1" stroke-dasharray="3 2" />
          <rect x="${cx - bodyW / 2 - 1}" y="${bladeT + bodyL - 7}" width="${bodyW + 2}" height="9" rx="2" fill="#94a3b8" stroke="#64748b" stroke-width="1" />
        </g>
        <g class="rotor">
          <rect x="${cx - blade}" y="0" width="${blade}" height="${bladeT}" rx="1.5" fill="#fffaf0" stroke="#9c6b3c" stroke-width="1" />
          <rect x="${cx}" y="0" width="${blade}" height="${bladeT}" rx="1.5" fill="#f1d3a6" stroke="#9c6b3c" stroke-width="1" />
          <rect x="${cx - 2}" y="-1" width="4" height="${bladeT + 2}" rx="1" fill="#a61936" />
        </g>
      </svg>`;
      return { svg, w: W, h: H };
    },

    /**
     * หมุนทั้งตัวรอบแกนตั้ง + ส่าย
     * - มุมหมุนตามระยะที่ตกลงมา (ความเร็วปลายใบ ≈ ความเร็วตก → มุม = ระยะตก / ความยาวใบ)
     * - มองจากด้านข้าง ของที่หมุนรอบแกนตั้งจะแคบลงตาม cos(มุม): ใบพัดบีบเต็มที่ ลำตัวบีบน้อยกว่า (ลำตัวแคบ บีบเต็มจะหายวูบ)
     *   ตอน cos < 0 = เห็นอีกด้าน → ใบซ้าย/ขวาสลับกัน และลำตัวเป็นสีด้านหลังของกระดาษ
     * - ส่าย (คืนเป็นองศาให้ updateActorFrame หมุนรอบจุดบนสุด): ช่วงใบพัดยังหมุนไม่เต็มที่ (spin-up) ส่ายแรง ~8° แล้วลดเหลือ ~3°
     */
    applyPose(actorEl, sample, simT, falling) {
      const rotor = actorEl.querySelector('.rotor');
      const body = actorEl.querySelector('.heli-body');
      if (!rotor || !body || !actorGeom) return 0;
      const angle = ((actorGeom.heightM - sample.y) / (actorGeom.WL / 100)) * 1.5;
      const c = Math.cos(angle);
      const side = c < 0 ? -1 : 1;
      const squeeze = (s) => `translate(${actorGeom.cx} 0) scale(${s.toFixed(3)} 1) translate(${-actorGeom.cx} 0)`;
      rotor.setAttribute('transform', squeeze(side * Math.max(0.08, Math.abs(c))));
      body.setAttribute('transform', squeeze(side * (0.45 + 0.55 * Math.abs(c))));
      body.querySelector('.heli-body-face').setAttribute('fill', side > 0 ? '#fffaf0' : '#f1d3a6');
      if (!falling) return 0;
      const spinup = window.HelicopterPhysics.CONSTANTS.SPINUP_TIME_S;
      const amplitude = 3 + 5 * Math.exp(-simT / spinup);
      return amplitude * Math.sin(simT * 7 + angle * 0.35);
    },
  };

  // =====================================================================
  // 2) ส่วนร่วม — ฉากตกแนวดิ่ง / ตาราง / กราฟ / ภาษา / ธีม / responsive
  // =====================================================================
  const RESPONSE_KEY = 'time';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const els = {
    modeRadios: document.querySelectorAll('input[name="mode"]'),
    modeHint: document.getElementById('modeHint'),
    launchBtn: document.getElementById('launchBtn'),
    warningBox: document.getElementById('warningBox'),

    languageButton: document.getElementById('languageButton'),

    topbar: document.querySelector('.navbar'),
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

  };

  let language = window.getSiteLang ? window.getSiteLang() : 'en'; // ภาษาที่เลือกไว้จากหน้าก่อน (ค่าเริ่มต้นอังกฤษ) ดู nav.js
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
    syncHorizon(groundY);
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
    els.launchBtn.querySelector('.btn-label').textContent = enabled ? I18N[language].launch : I18N[language].launching;
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
  // กราฟ Main Effects / Interaction — ตัววาด/error bar/tooltip/PNG อยู่ใน ../assets/effects-chart.js (ใช้ร่วมกันทั้ง 4 การทดลอง)
  // ---------------------------------------------------------------------
  const effectsChart = window.EffectsChart.create({
    factors: MODULE.factors.map((f) => ({
      key: f.key,
      levels: f.type === 'choice' ? f.levels : undefined,
      label: () => I18N[language][`factorName_${f.key}`] || f.key,
      format: (v) => formatFactorValue(f.key, f.type === 'choice' ? v : Number(v), true),
    })),
    responses: MODULE.responses,
    replicateKeys: [...MODULE.factors.map((f) => f.key), MODULE.constant.key],
    getResults: () => results,
    lang: () => language,
    filePrefix: MODULE.csvPrefix.replace(/_results$/, ''),
  });

  function renderEffectsChart() {
    effectsChart.render();
  }

  // ปุ่มเฟืองเลือกคอลัมน์ของตารางย่อ (../assets/table-settings.js)
  const tableSettings = window.TableSettings.init({
    sim: MODULE.csvPrefix.replace(/_results$/, ''),
    factorCount: MODULE.factors.length,
    factorLabel: (i) => I18N[language][`factorName_${MODULE.factors[i].key}`],
    lang: () => language,
  });

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

  /** ให้เส้นขอบฟ้าของพื้นหลังโซน A ตรงกับเส้นพื้น (0 m) ของฉากจำลองจริง */
  function syncHorizon(groundYInScene) {
    const zone = els.scene.closest('.zone-experiment');
    if (!zone) return;
    const z = zone.getBoundingClientRect();
    const s = els.scene.getBoundingClientRect();
    zone.style.setProperty('--horizon', `${Math.round(s.top - z.top + groundYInScene)}px`);
  }

  function syncPanelHeights() {
    // ความสูงของ 3 ส่วนในโซน A คุมด้วย CSS แล้ว (โซนเต็มจอ) — แค่ล้างค่าเดิมที่อาจค้างอยู่
    els.simulationPanel.style.height = '';
    els.resultsSidebar.style.height = '';
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
  /** ปุ่มขยาย/ปิดตาราง: สลับข้อความ + ไอคอน (ข้อความอยู่ใน .btn-label แยกจากไอคอน) */
  function setExpandButton(expanded) {
    const key = expanded ? 'collapseTable' : 'expandTable';
    const label = els.expandTableBtn.querySelector('.btn-label');
    label.dataset.i18n = key;
    label.textContent = I18N[language][key];
    els.expandTableBtn.querySelector('use').setAttribute('href', `#${expanded ? 'i-close' : 'i-expand'}`);
    els.expandTableBtn.setAttribute('aria-label', expanded ? 'Collapse table' : 'Expand table');
  }

  function openTableExpand() {
    tableExpanded = true;
    els.resultsSidebar.style.height = '';
    els.resultsSidebar.classList.add('expanded');
    els.tableBackdrop.classList.add('visible');
    document.body.classList.add('table-modal-open');
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((el) => el && el.setAttribute('inert', ''));
    setExpandButton(true);
  }

  function closeTableExpand() {
    tableExpanded = false;
    els.resultsSidebar.classList.remove('expanded');
    els.tableBackdrop.classList.remove('visible');
    document.body.classList.remove('table-modal-open');
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((el) => el && el.removeAttribute('inert'));
    setExpandButton(false);
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
    if (window.setSiteLang) window.setSiteLang(language); // จำไว้ให้หน้าอื่นใช้ภาษาเดียวกัน
    applyTranslations(language);
    tableSettings.refresh();
    updateModeHint();
    renderTable();
    setLaunchEnabled(!els.launchBtn.disabled);
    renderLiveStats(lastLiveSample);
    renderEffectsChart();
  }


  els.languageButton.addEventListener('click', changeLanguage);

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
  els.languageButton.textContent = language === 'en' ? 'TH' : 'EN';
  document.documentElement.lang = language;
  applyTranslations(language);
  tableSettings.refresh();
  updateModeHint();
  setLaunchEnabled(true);
  renderTable();
  renderLiveStats(null);
  syncPanelHeights();
  redrawIdleScene();
  renderEffectsChart();
  } // ปิด init()
})();
