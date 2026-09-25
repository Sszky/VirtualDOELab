/**
 * app.js — ผูก UI, วาดฉากแอนิเมชัน (canvas เส้นทาง + จรวดการ์ตูนแบบ DOM/CSS), จัดการตารางผล,
 * ระบบสองภาษา/ธีม, โหมด deterministic/stochastic, และ export CSV
 * อาศัย window.RocketPhysics จาก physics.js และ window.I18N/applyTranslations จาก i18n.js
 */
(function () {
  'use strict';

  // รันหลัง DOM พร้อมเสมอ (กันกรณีสภาพแวดล้อมบางอย่างรัน script ก่อน body parse เสร็จ
  // แม้ปกติ <script> ท้าย body จะพร้อมอยู่แล้ว แต่การ guard ด้วย DOMContentLoaded ไว้ปลอดภัยกว่า)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
  const { simulateFlight } = window.RocketPhysics;
  const { I18N, formatTemplate, applyTranslations } = window;

  // ---------------------------------------------------------------------
  // ค่าคงที่สำหรับกราฟ Main Effects / Interaction
  // ---------------------------------------------------------------------
  const FACTORS = [
    { key: 'angleDeg', nameKey: 'factorNameAngle', unit: '°' },
    { key: 'fins', nameKey: 'factorNameFins', unit: '' },
    { key: 'waterVolumeML', nameKey: 'factorNameWater', unit: ' mL' },
    { key: 'pressurePSI', nameKey: 'factorNamePressure', unit: ' psi' },
  ];
  const RESPONSE_KEY = 'distance'; // ยืนยันกับผู้ใช้แล้วว่าคงที่ ไม่ต้องมีตัวเลือก response
  const EFFECTS_PALETTE = ['#a61936', '#1b6ea6', '#2f8f46', '#d5a62e', '#6a4c93', '#c2571b', '#0f766e', '#b45309'];

  // ---------------------------------------------------------------------
  // อ้างอิง DOM
  // ---------------------------------------------------------------------
  const els = {
    angleRange: document.getElementById('angleRange'),
    angleNumber: document.getElementById('angleNumber'),
    finsRange: document.getElementById('finsRange'),
    finsNumber: document.getElementById('finsNumber'),
    waterRange: document.getElementById('waterRange'),
    waterNumber: document.getElementById('waterNumber'),
    pressureRange: document.getElementById('pressureRange'),
    pressureNumber: document.getElementById('pressureNumber'),
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
    canvas: document.getElementById('trailCanvas'),
    axisY: document.getElementById('axisY'),
    axisX: document.getElementById('axisX'),
    rocket: document.getElementById('rocket'),
    rocketFlame: document.getElementById('rocketFlame'),
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

  const ctx2d = els.canvas.getContext('2d');

  // ---------------------------------------------------------------------
  // สถานะของแอป
  // ---------------------------------------------------------------------
  let language = 'th'; // ค่าเริ่มต้นยืนยันแล้วกับผู้ใช้
  // ธีมเริ่มต้น = สว่าง (ไม่ใส่คลาส 'dark' บน body ตอนโหลด) ยืนยันแล้วกับผู้ใช้

  // ผลการทดลองทั้งหมดในเซสชันนี้ — เก็บในหน่วยความจำเท่านั้น (ไม่มี localStorage)
  // รีเฟรชหน้าเว็บแล้วข้อมูลชุดนี้จะหายไปทั้งหมด
  const results = [];

  let animationHandle = null;
  let tableExpanded = false;

  // แคชผลการยิงล่าสุดไว้ วาดฉากใหม่ได้ทันทีตอนสลับธีม/ภาษาโดยไม่ต้องยิงใหม่
  let lastResult = null;

  // เที่ยวบินก่อนหน้า (ไม่ใช่ล่าสุด) — ใช้วาดเป็นเงาจาง ๆ ค้างไว้เทียบกับครั้งปัจจุบัน
  let previousTrajectory = null;

  // สเกลแกน X/Y คงที่ (ไม่ auto-fit ใหม่ทุกครั้งที่ยิง) — ขยายได้เฉพาะตอนเที่ยวบินเกินขอบเขตเดิมเท่านั้น ไม่มีวันหด
  // ค่าเริ่มต้นกว้างพอสำหรับพารามิเตอร์ default (ระยะ ~62m, ความสูง ~23m)
  let sceneMaxX = 90;
  let sceneMaxY = 55;

  // ---------------------------------------------------------------------
  // ผูก slider <-> numeric input แบบสองทางสำหรับแต่ละพารามิเตอร์
  // ---------------------------------------------------------------------
  function bindPair(rangeEl, numberEl) {
    rangeEl.addEventListener('input', () => {
      numberEl.value = rangeEl.value;
    });
    numberEl.addEventListener('input', () => {
      let v = Number(numberEl.value);
      const min = Number(rangeEl.min);
      const max = Number(rangeEl.max);
      if (!isNaN(v)) {
        v = Math.min(max, Math.max(min, v));
        rangeEl.value = v;
      }
    });
    numberEl.addEventListener('change', () => {
      let v = Number(numberEl.value);
      const min = Number(rangeEl.min);
      const max = Number(rangeEl.max);
      if (isNaN(v)) v = min;
      v = Math.min(max, Math.max(min, v));
      numberEl.value = v;
      rangeEl.value = v;
    });
  }

  bindPair(els.angleRange, els.angleNumber);
  bindPair(els.finsRange, els.finsNumber);
  bindPair(els.waterRange, els.waterNumber);
  bindPair(els.pressureRange, els.pressureNumber);

  function readParams() {
    const modeInput = document.querySelector('input[name="mode"]:checked');
    return {
      angleDeg: Number(els.angleNumber.value),
      fins: Math.round(Number(els.finsNumber.value)),
      waterVolumeML: Number(els.waterNumber.value),
      pressurePSI: Number(els.pressureNumber.value),
      mode: modeInput ? modeInput.value : 'deterministic',
    };
  }

  // ---------------------------------------------------------------------
  // การแปลงพิกัด เมตร -> พิกเซล (คำนวณใหม่ทุกครั้งที่ยิง จาก bounding box ของ trajectory
  // และขนาดจริงของ .scene ในตอนนั้น)
  // ---------------------------------------------------------------------
  function syncCanvasSize() {
    els.canvas.width = els.scene.clientWidth;
    els.canvas.height = els.scene.clientHeight;
  }

  /**
   * ขยาย sceneMaxX/sceneMaxY ให้พอดีกับ trajectory ที่เพิ่งยิง — ขยายได้ทางเดียว (ไม่มีวันหด)
   * เพื่อให้สเกลแกนคงที่ระหว่างการยิงหลายครั้ง (ยกเว้นกรณีที่ยิงได้ไกล/สูงกว่าขอบเขตเดิมจริง ๆ)
   */
  function growSceneBounds(trajectory) {
    let maxX = 0;
    let maxY = 0;
    for (const p of trajectory) {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const paddedX = maxX * 1.1;
    const paddedY = maxY * 1.1;
    if (paddedX > sceneMaxX) sceneMaxX = paddedX;
    if (paddedY > sceneMaxY) sceneMaxY = paddedY;
  }

  function computeTransform() {
    const w = els.scene.clientWidth;
    const h = els.scene.clientHeight;
    const groundMarginPx = 40; // เผื่อพื้นที่ตัวเลขแกน X + แถบพื้น
    const topPad = 26;
    const sidePad = 40; // เผื่อพื้นที่ตัวเลขแกน Y

    const usableW = w - sidePad * 2;
    const usableH = h - groundMarginPx - topPad;
    const scale = Math.min(usableW / sceneMaxX, usableH / sceneMaxY);

    const originPx = { x: sidePad, y: h - groundMarginPx };

    return {
      scale,
      originPx,
      maxX: sceneMaxX,
      maxY: sceneMaxY,
      toPx(x, y) {
        return { px: originPx.x + x * scale, py: originPx.y - y * scale };
      },
    };
  }

  // ---------------------------------------------------------------------
  // การวาดเส้นทาง (canvas) — สีอ่านจาก CSS variable เพื่อให้ตรงธีมเสมอ
  // ---------------------------------------------------------------------
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawStatic(transform, angleRad) {
    const w = els.canvas.width;
    const h = els.canvas.height;
    ctx2d.clearRect(0, 0, w, h);

    // เส้นพื้น (y = 0)
    ctx2d.strokeStyle = cssVar('--ground-dark') || '#588f4d';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(0, transform.originPx.y);
    ctx2d.lineTo(w, transform.originPx.y);
    ctx2d.stroke();

    // แท่นยิง (เส้นตามมุม A)
    const railLen = 34;
    const tip = transform.toPx(
      (railLen / transform.scale) * Math.cos(angleRad),
      (railLen / transform.scale) * Math.sin(angleRad)
    );
    ctx2d.strokeStyle = cssVar('--muted') || '#5b6b82';
    ctx2d.lineWidth = 4;
    ctx2d.beginPath();
    ctx2d.moveTo(transform.originPx.x, transform.originPx.y);
    ctx2d.lineTo(tip.px, tip.py);
    ctx2d.stroke();
  }

  function drawTrail(transform, trajectory, upToT) {
    const pts = trajectory.filter((p) => p.t <= upToT);
    const trimmed = pts.slice(Math.max(0, pts.length - 150));
    const trailColor = cssVar('--trail') || '#fb923c';
    for (let i = 1; i < trimmed.length; i++) {
      const a = transform.toPx(trimmed[i - 1].x, trimmed[i - 1].y);
      const b = transform.toPx(trimmed[i].x, trimmed[i].y);
      const alpha = 0.15 + 0.85 * (i / trimmed.length);
      ctx2d.strokeStyle = hexToRgba(trailColor, alpha);
      ctx2d.lineWidth = 2.5;
      ctx2d.beginPath();
      ctx2d.moveTo(a.px, a.py);
      ctx2d.lineTo(b.px, b.py);
      ctx2d.stroke();
    }
  }

  /** วาดเส้นทางของเที่ยวบิน "ก่อนหน้า" (ไม่ใช่ครั้งปัจจุบัน) แบบจาง ๆ เต็มเส้นทันที ไม่ progressive ตามเวลา */
  function drawGhostTrail(transform, trajectory) {
    if (!trajectory || trajectory.length < 2) return;
    const color = cssVar('--muted') || '#79656a';
    ctx2d.strokeStyle = hexToRgba(color, 0.35);
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    const first = transform.toPx(trajectory[0].x, trajectory[0].y);
    ctx2d.moveTo(first.px, first.py);
    for (let i = 1; i < trajectory.length; i++) {
      const p = transform.toPx(trajectory[i].x, trajectory[i].y);
      ctx2d.lineTo(p.px, p.py);
    }
    ctx2d.stroke();
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
  }

  // ---------------------------------------------------------------------
  // แกน X/Y — สร้างจาก DOM text จริง (ไม่ใช่ canvas) เพื่อความคมชัด + แปลภาษาง่าย
  // ---------------------------------------------------------------------
  function computeAxisTicks(maxVal, count) {
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      ticks.push((maxVal * i) / count);
    }
    return ticks;
  }

  function formatTick(v) {
    return v < 10 ? v.toFixed(1) : v.toFixed(0);
  }

  function renderAxes(maxX, maxY) {
    const compact = window.matchMedia('(max-width: 600px)').matches;
    const count = compact ? 3 : 4;

    els.axisY.innerHTML = '';
    computeAxisTicks(maxY, count).forEach((v) => {
      const span = document.createElement('span');
      span.textContent = formatTick(v);
      els.axisY.appendChild(span);
    });

    els.axisX.innerHTML = '';
    computeAxisTicks(maxX, count).forEach((v) => {
      const span = document.createElement('span');
      span.textContent = formatTick(v);
      els.axisX.appendChild(span);
    });
  }

  // ---------------------------------------------------------------------
  // จรวดการ์ตูน (DOM/CSS) — เคลื่อนที่ด้วย style.transform ต่อเฟรม
  // ---------------------------------------------------------------------
  function updateRocketFrame(transform, sample, headingRad, phase) {
    const { px, py } = transform.toPx(sample.x, sample.y);
    const headingDeg = (headingRad * 180) / Math.PI;
    // อ่านขนาดจริงที่ CSS กำหนด (แทนค่าคงที่ตายตัว) เพราะขนาดจรวดเปลี่ยนตาม breakpoint ได้ (เช่น มือถือ)
    const w = els.rocket.offsetWidth;
    const h = els.rocket.offsetHeight;
    // รูปจรวดวาดแบบ "หัวชี้ขึ้น" เป็นค่าเริ่มต้น (ไม่ใช่ชี้ขวา) จึงต้องหมุนจาก 90° ลบมุม heading
    // (heading=90°/ขึ้นตรง -> หมุน 0° หัวชี้ขึ้นพอดี, heading=0°/ขนานพื้น -> หมุน 90deg ตามเข็มไปทางขวา)
    els.rocket.style.transform = `translate(${px - w / 2}px, ${py - h / 2}px) rotate(${90 - headingDeg}deg)`;

    const active = phase === 1;
    els.rocketFlame.style.visibility = active ? 'visible' : 'hidden';
    els.rocketFlame.dataset.active = active ? 'true' : 'false';
  }

  /** binary search + lerp หาสถานะที่เวลา simT จาก trajectory ที่บันทึกไว้ */
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
    const lerp = (x, y) => x + (y - x) * frac;
    return {
      t: simT,
      x: lerp(a.x, b.x),
      y: lerp(a.y, b.y),
      vx: lerp(a.vx, b.vx),
      vy: lerp(a.vy, b.vy),
      phase: a.phase,
    };
  }

  /**
   * สร้าง HTML แถบสรุปผลเรียลไทม์ 4 ช่อง — sample เป็น null ได้ (ยังไม่เคยยิง) จะแสดง "—" แทน
   * ต้องมีเนื้อหาเสมอตั้งแต่โหลดหน้า เพื่อไม่ให้แถบนี้ "โผล่" ตอนยิงครั้งแรกแล้วดัน .scene ให้เตี้ยลงกลางแอนิเมชัน
   * (เคยเป็นบั๊ก: ยิงครั้งแรกจรวดอยู่ต่ำกว่าเส้นทาง เพราะพิกัดคำนวณจากขนาด scene ก่อนแถบนี้โผล่)
   */
  function formatLiveStats(sample) {
    const dict = I18N[language];
    const stat = (label, value) =>
      `<span class="live-stat"><span class="live-stat-label">${label}:</span><span class="live-stat-value">${value}</span></span>`;
    const dash = '—';
    return (
      stat(dict.liveTime, sample ? `${sample.t.toFixed(2)} s` : dash) +
      stat(dict.liveDistance, sample ? `${sample.x.toFixed(2)} m` : dash) +
      stat(dict.liveAltitude, sample ? `${sample.y.toFixed(2)} m` : dash) +
      stat(dict.liveSpeed, sample ? `${Math.hypot(sample.vx, sample.vy).toFixed(1)} m/s` : dash)
    );
  }

  let lastLiveSample = null;
  function renderLiveStats(sample) {
    lastLiveSample = sample;
    els.liveStats.innerHTML = formatLiveStats(sample);
  }

  // ---------------------------------------------------------------------
  // วาดฉากนิ่ง (ไม่มีเที่ยวบิน) — ตอนโหลดหน้า หรือหลังสลับธีม/ภาษาตอนไม่มีแอนิเมชันวิ่งอยู่
  // ---------------------------------------------------------------------
  function redrawIdleScene() {
    if (animationHandle) return; // กันชนกับตอนแอนิเมชันกำลังวิ่งอยู่
    syncCanvasSize();
    const angleRad = (Number(els.angleNumber.value) * Math.PI) / 180;
    const transform = computeTransform();
    drawStatic(transform, angleRad);
    drawGhostTrail(transform, previousTrajectory);
    renderAxes(transform.maxX, transform.maxY);
    updateRocketFrame(transform, { x: 0, y: 0, vx: 0, vy: 0 }, angleRad, 0);
  }

  /** วาดเฟรมสุดท้ายของผลการยิงล่าสุดซ้ำ (ใช้ตอนสลับธีมเพื่อให้สีบน canvas อัปเดตทันที) */
  function redrawLastResultFinalFrame() {
    if (!lastResult) {
      redrawIdleScene();
      return;
    }
    syncCanvasSize();
    const { trajectory, params } = lastResult;
    const transform = computeTransform();
    const angleRad = (params.angleDeg * Math.PI) / 180;
    const last = trajectory[trajectory.length - 1];
    const heading = Math.atan2(last.vy, last.vx) || angleRad;
    drawStatic(transform, angleRad);
    drawGhostTrail(transform, previousTrajectory);
    drawTrail(transform, trajectory, last.t);
    renderAxes(transform.maxX, transform.maxY);
    updateRocketFrame(transform, last, heading, 2);
  }

  // ---------------------------------------------------------------------
  // เล่นแอนิเมชัน — เล่นซ้ำ trajectory ที่คำนวณไว้ล่วงหน้าแล้วทั้งหมด
  // ---------------------------------------------------------------------
  function startAnimation(result) {
    const { trajectory, summary, params } = result;
    const angleRad = (params.angleDeg * Math.PI) / 180;

    syncCanvasSize();
    growSceneBounds(trajectory);
    const transform = computeTransform();
    renderAxes(transform.maxX, transform.maxY);

    lastResult = result;

    const realFlightTime = Math.max(summary.flightTime, 0.05);
    const playbackDuration = Math.min(6, Math.max(1.5, realFlightTime));
    const timeScale = realFlightTime / playbackDuration;
    const startWall = performance.now();

    setLaunchEnabled(false);

    if (animationHandle) cancelAnimationFrame(animationHandle);

    function frame(now) {
      const wallElapsed = (now - startWall) / 1000;
      const simT = wallElapsed * timeScale;

      const finished = simT >= realFlightTime;
      const sample = finished
        ? trajectory[trajectory.length - 1]
        : interpolateAtTime(trajectory, simT);
      const heading = finished
        ? Math.atan2(trajectory[trajectory.length - 1].vy, trajectory[trajectory.length - 1].vx) || angleRad
        : Math.hypot(sample.vx, sample.vy) > 0.05
        ? Math.atan2(sample.vy, sample.vx)
        : angleRad;

      drawStatic(transform, angleRad);
      drawGhostTrail(transform, previousTrajectory);
      drawTrail(transform, trajectory, sample.t);
      updateRocketFrame(transform, sample, heading, sample.phase);
      renderLiveStats(sample);

      if (finished) {
        setLaunchEnabled(true);
        appendResultRow(result);
        animationHandle = null;
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
  function appendResultRow(result) {
    const { params, summary } = result;
    results.push({ ...params, ...summary });
    renderTable();
    renderEffectsChart();
  }

  function renderTable() {
    const dict = I18N[language];
    if (results.length === 0) {
      els.tableBody.innerHTML = `<tr class="empty-row"><td colspan="9">${dict.tableEmpty}</td></tr>`;
      return;
    }
    els.tableBody.innerHTML = results
      .map((r, i) => {
        const modeLabel = dict[r.mode] || r.mode;
        return `<tr>
          <td>${i + 1}</td>
          <td>${r.angleDeg}</td>
          <td>${r.fins}</td>
          <td>${r.waterVolumeML}</td>
          <td>${r.pressurePSI}</td>
          <td>${r.distance.toFixed(2)}</td>
          <td class="col-extra">${r.flightTime.toFixed(2)}</td>
          <td class="col-extra">${r.maxAltitude.toFixed(2)}</td>
          <td class="col-extra">${modeLabel}</td>
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
  // Main Effects / Interaction Plot — วิเคราะห์ผลจากข้อมูลใน results array
  // (ไม่แตะ physics.js เลย เป็นแค่การรวม/เฉลี่ยข้อมูลที่มีอยู่แล้ว)
  // ---------------------------------------------------------------------
  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function factorLabel(key) {
    const f = FACTORS.find((f) => f.key === key);
    return f ? I18N[language][f.nameKey] : key;
  }

  function factorUnit(key) {
    const f = FACTORS.find((f) => f.key === key);
    return f ? f.unit : '';
  }

  /**
   * รวมกลุ่ม results ตาม factor ที่เลือก หาค่าเฉลี่ย RESPONSE_KEY ต่อค่า
   * ไม่มี factorGroupKey (main effects) -> series เดียว
   * มี factorGroupKey (interaction) -> 1 series ต่อค่าที่ต่างกันของ grouping factor
   */
  function computeEffectsSeries(factorXKey, factorGroupKey) {
    if (!factorGroupKey) {
      const groups = {};
      results.forEach((r) => {
        (groups[r[factorXKey]] = groups[r[factorXKey]] || []).push(r[RESPONSE_KEY]);
      });
      const xValues = Object.keys(groups)
        .map(Number)
        .sort((a, b) => a - b);
      const points = xValues.map((x) => ({ x, y: mean(groups[x]) }));
      return { series: [{ key: '__single__', label: null, points }], xValues };
    }

    const byGroup = {};
    results.forEach((r) => {
      const gv = r[factorGroupKey];
      byGroup[gv] = byGroup[gv] || {};
      byGroup[gv][r[factorXKey]] = byGroup[gv][r[factorXKey]] || [];
      byGroup[gv][r[factorXKey]].push(r[RESPONSE_KEY]);
    });
    const xValues = [...new Set(results.map((r) => r[factorXKey]))].map(Number).sort((a, b) => a - b);
    const groupValues = Object.keys(byGroup)
      .map(Number)
      .sort((a, b) => a - b);
    const series = groupValues.map((gv) => ({
      key: gv,
      label: gv,
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

  /** วาดกราฟเส้น+จุด (เทคนิคเดียวกับ parachute.js drawChart) รองรับหลาย series พร้อมกัน */
  function drawEffectsSeries(context, width, height, series, xValues, xKey) {
    const padding = { left: 46, right: 16, top: 18, bottom: 34 };
    const allY = series.flatMap((s) => s.points.map((p) => p.y));
    const minimumY = Math.min(...allY) * 0.95;
    const maximumY = Math.max(...allY) * 1.05 || 1;
    const xStep = (width - padding.left - padding.right) / Math.max(1, xValues.length - 1);
    const xIndex = new Map(xValues.map((v, i) => [v, i]));

    function toY(value) {
      const graphHeight = height - padding.top - padding.bottom;
      return padding.top + ((maximumY - value) / (maximumY - minimumY || 1)) * graphHeight;
    }

    context.strokeStyle = cssVar('--line') || '#e7dadd';
    context.fillStyle = cssVar('--muted') || '#79656a';
    context.lineWidth = 1;
    context.font = '11px system-ui';

    // เส้นกริดแนวนอน + label แกน Y
    for (let i = 0; i < 4; i++) {
      const y = padding.top + (i * (height - padding.top - padding.bottom)) / 3;
      const labelValue = maximumY - (i * (maximumY - minimumY)) / 3;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(width - padding.right, y);
      context.stroke();
      context.fillText(labelValue.toFixed(1), 4, y + 4);
    }

    // label แกน X — ถ้าค่าเยอะเกิน ~10 ค่า ให้เว้นบางจุดกันตัวเลขทับกัน
    const stride = Math.ceil(xValues.length / 10);
    context.fillStyle = cssVar('--muted') || '#79656a';
    xValues.forEach((x, i) => {
      if (i % stride !== 0 && i !== xValues.length - 1) return;
      const px = padding.left + i * xStep;
      context.fillText(`${x}${factorUnit(xKey)}`, px - 14, height - 10);
    });

    // เส้น + จุดของแต่ละ series
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

  function renderEffectsLegend(mode, series, groupKey) {
    if (mode !== 'interaction') {
      els.effectsLegend.hidden = true;
      els.effectsLegend.innerHTML = '';
      return;
    }
    els.effectsLegend.hidden = false;
    els.effectsLegend.innerHTML = series
      .map((s, i) => {
        const color = EFFECTS_PALETTE[i % EFFECTS_PALETTE.length];
        return `<span class="effects-legend-item"><span class="effects-legend-swatch" style="background:${color}"></span>${s.label}${factorUnit(groupKey)}</span>`;
      })
      .join('');
  }

  /** กันเลือก factor ซ้ำกันระหว่าง X กับ grouping */
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

  function updateEffectsModeVisibility() {
    const mode = document.querySelector('input[name="effectsMode"]:checked')?.value || 'main';
    els.effectsFactorGroupWrap.hidden = mode !== 'interaction';
  }

  function renderEffectsChart() {
    const mode = document.querySelector('input[name="effectsMode"]:checked')?.value || 'main';
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
    const distinctXCount = new Set(results.map((r) => r[xKey])).size;

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
    renderEffectsLegend(mode, series, groupKey);
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

  els.exportCsvBtn.addEventListener('click', () => {
    if (results.length === 0) {
      showWarning(translateWarnings([{ key: 'exportEmpty' }]));
      return;
    }
    const dict = I18N[language];
    const header = [
      dict.thRun,
      dict.thAngle,
      dict.thFins,
      dict.thWater,
      dict.thPressure,
      dict.thDistance,
      dict.thFlightTime,
      dict.thMaxAltitude,
      dict.thMode,
    ].join(',');
    const rows = results.map((r, i) => {
      const modeLabel = dict[r.mode] || r.mode;
      return [
        i + 1,
        r.angleDeg,
        r.fins,
        r.waterVolumeML,
        r.pressurePSI,
        r.distance.toFixed(2),
        r.flightTime.toFixed(2),
        r.maxAltitude.toFixed(2),
        modeLabel,
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+/, '');
    a.href = url;
    a.download = `water_rocket_results_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ---------------------------------------------------------------------
  // ความสูงเท่ากัน 3 กล่อง (desktop เท่านั้น) — อ้างอิงจากกล่องตั้งค่าปัจจัย
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
      // มือถือ/tablet: ปล่อยความสูงอิสระตามเนื้อหา (ยืนยันแล้วว่าคนละกรณีกับ desktop)
      els.simulationPanel.style.height = '';
      els.resultsSidebar.style.height = '';
      return;
    }
    if (tableExpanded) return; // ตอนตารางเป็น modal ไม่ต้อง sync (จะ sync ใหม่ตอนปิด)
    const h = `${els.controlsPanel.offsetHeight}px`;
    els.simulationPanel.style.height = h;
    els.resultsSidebar.style.height = h;
  }

  // ---------------------------------------------------------------------
  // มือถือ: ซ่อน header ตอนเลื่อนลง คืนพื้นที่ให้ sim/factors — โผล่กลับทันทีตอนเลื่อนขึ้น
  // ---------------------------------------------------------------------
  let lastScrollY = window.scrollY;
  let upDistance = 0; // ระยะที่เลื่อนขึ้นสะสมต่อเนื่อง (รีเซ็ตทุกครั้งที่เปลี่ยนไปเลื่อนลง)
  function handleHeaderScroll() {
    if (!window.matchMedia('(max-width: 600px)').matches) {
      els.topbar.classList.remove('topbar-hidden'); // desktop/tablet: ไม่ยุ่งกับ header เลย
      lastScrollY = window.scrollY;
      upDistance = 0;
      return;
    }
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;
    lastScrollY = currentY;
    if (delta === 0) return; // ไม่มีการเลื่อนจริง -> ไม่เปลี่ยนสถานะ header (กันโผล่เองโดยไม่ได้เลื่อนขึ้น)

    if (delta > 0) {
      upDistance = 0;
      if (currentY > 80) els.topbar.classList.add('topbar-hidden'); // เลื่อนลง (เลยช่วงบนสุด) -> ซ่อน
      return;
    }
    // เลื่อนขึ้น: สะสมระยะ แล้วโชว์เมื่อขึ้นมาจริงเกิน 12px (นิ้วเลื่อนช้า ๆ ก็ทำงาน แต่ layout ขยับจิ๊บจ๊อยไม่ทำให้โผล่)
    upDistance += -delta;
    if (upDistance > 12 || currentY <= 80) {
      els.topbar.classList.remove('topbar-hidden');
    }
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  // รีเซ็ต header เฉพาะตอน "ข้าม breakpoint" จริง ๆ (มือถือ <-> ไม่ใช่มือถือ) ผ่าน matchMedia change event
  // โดยเฉพาะ — ต้อง "ไม่" ผูกกับการเปลี่ยนขนาดของ body ทั่วไป (เช่น ตารางผลยาวขึ้นหลังกดยิง) มิเช่นนั้น
  // header จะโผล่กลับมาเองทั้งที่ผู้ใช้ไม่ได้เลื่อนจอขึ้นเลย (บั๊กที่เจอจริง — แก้แล้ว)
  const mobileHeaderQuery = window.matchMedia('(max-width: 600px)');
  function resetHeaderOnBreakpointChange() {
    if (!mobileHeaderQuery.matches) {
      els.topbar.classList.remove('topbar-hidden');
    }
    lastScrollY = window.scrollY;
  }
  mobileHeaderQuery.addEventListener('change', resetHeaderOnBreakpointChange);

  const debouncedSyncPanelHeights = debounce(syncPanelHeights, 150);
  if (window.ResizeObserver) {
    new ResizeObserver(syncPanelHeights).observe(els.controlsPanel);
    // เผื่อกรณี viewport เปลี่ยนโดยไม่ยิง 'resize' event ตรง ๆ (เช่น browser dev tools บาง engine) — ดัก body ด้วย
    // (ใช้แค่ syncPanelHeights ไม่แตะ header — header จัดการแยกด้วย matchMedia ข้างบนแล้ว)
    new ResizeObserver(debouncedSyncPanelHeights).observe(document.body);
  }
  window.addEventListener('resize', debouncedSyncPanelHeights);

  // ---------------------------------------------------------------------
  // ตารางขยาย — modal ลอยกลางจอ (ทุกขนาดจอ)
  // ---------------------------------------------------------------------
  function openTableExpand() {
    tableExpanded = true;
    els.resultsSidebar.style.height = ''; // เคลียร์ความสูงที่ sync ไว้ ไม่ให้ชนกับ max-height ตอนเป็น modal
    els.resultsSidebar.classList.add('expanded');
    els.tableBackdrop.classList.add('visible');
    document.body.classList.add('table-modal-open');
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((el) => {
      if (el) el.setAttribute('inert', '');
    });
    els.expandTableBtn.dataset.i18n = 'collapseTable';
    els.expandTableBtn.setAttribute('aria-label', 'Collapse table');
    els.expandTableBtn.textContent = I18N[language].collapseTable;
  }

  function closeTableExpand() {
    tableExpanded = false;
    els.resultsSidebar.classList.remove('expanded');
    els.tableBackdrop.classList.remove('visible');
    document.body.classList.remove('table-modal-open');
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((el) => {
      if (el) el.removeAttribute('inert');
    });
    els.expandTableBtn.dataset.i18n = 'expandTable';
    els.expandTableBtn.setAttribute('aria-label', 'Expand table');
    els.expandTableBtn.textContent = I18N[language].expandTable;
    syncPanelHeights(); // คืนความสูงที่ sync กับกล่องปัจจัยไว้
  }

  function toggleTableExpand() {
    if (tableExpanded) closeTableExpand();
    else openTableExpand();
  }

  els.expandTableBtn.addEventListener('click', toggleTableExpand);
  els.tableBackdrop.addEventListener('click', () => {
    if (tableExpanded) closeTableExpand();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tableExpanded) closeTableExpand();
  });

  // ---------------------------------------------------------------------
  // คำเตือน
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

  // ---------------------------------------------------------------------
  // โหมดการทดลอง (deterministic / stochastic)
  // ---------------------------------------------------------------------
  function updateModeHint() {
    const selected = document.querySelector('input[name="mode"]:checked');
    const value = selected ? selected.value : 'deterministic';
    els.modeHint.textContent = value === 'stochastic' ? I18N[language].stochHint : I18N[language].detHint;
  }

  els.modeRadios.forEach((radio) => radio.addEventListener('change', updateModeHint));

  // ---------------------------------------------------------------------
  // ภาษา / ธีม
  // ---------------------------------------------------------------------
  function changeLanguage() {
    language = language === 'th' ? 'en' : 'th';
    els.languageButton.textContent = language === 'en' ? 'TH' : 'EN';
    document.documentElement.lang = language;

    applyTranslations(language); // ครอบคลุม #expandTableBtn ด้วยเพราะมี data-i18n ที่ถูกสลับใน open/closeTableExpand
    updateModeHint();
    renderTable();
    setLaunchEnabled(!els.launchBtn.disabled);
    renderLiveStats(lastLiveSample);
    renderEffectsChart(); // title/empty-state/legend เป็นข้อความที่ JS สร้างเอง ต้องสั่งแปลใหม่ตรง ๆ
  }

  function changeTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    els.themeButton.textContent = isDark ? '☀' : '☾';
    if (!animationHandle) redrawLastResultFinalFrame();
    renderEffectsChart(); // ไม่ผูกกับแอนิเมชัน วาดใหม่ได้เสมอเพื่อรีเฟรชสีกริด/จุดตามธีม
  }

  els.languageButton.addEventListener('click', changeLanguage);
  els.themeButton.addEventListener('click', changeTheme);

  // ---------------------------------------------------------------------
  // ปุ่มยิง
  // ---------------------------------------------------------------------
  els.launchBtn.addEventListener('click', () => {
    clearWarning();
    const params = readParams();
    const result = simulateFlight(params);
    if (result.warnings.length > 0) {
      showWarning(translateWarnings(result.warnings));
    }
    // เก็บเที่ยวบินก่อนหน้า (ถ้ามี) ไว้เป็นเงาจาง ๆ ก่อนที่ lastResult จะถูกเขียนทับด้วยผลใหม่
    previousTrajectory = lastResult ? lastResult.trajectory : previousTrajectory;
    startAnimation(result);
  });

  // ---------------------------------------------------------------------
  // Live preview มุมยิง — ลากสไลเดอร์/พิมพ์เลขตอนไม่มีแอนิเมชันวิ่งอยู่ ให้จรวดที่แท่นยิงหมุนตามทันที
  // ---------------------------------------------------------------------
  els.angleRange.addEventListener('input', redrawIdleScene);
  els.angleNumber.addEventListener('input', redrawIdleScene);

  // ---------------------------------------------------------------------
  // เริ่มต้น
  // ---------------------------------------------------------------------
  applyTranslations(language);
  updateModeHint();
  setLaunchEnabled(true);
  renderTable();
  renderLiveStats(null); // จองพื้นที่แถบ live-stats ตั้งแต่แรก (ต้องมาก่อนวัดขนาด scene)
  syncPanelHeights(); // ต้องเรียกก่อน redrawIdleScene() เพื่อให้ .scene มีขนาดจริงตั้งแต่เฟรมแรก
  redrawIdleScene();
  updateEffectsModeVisibility();
  syncFactorSelectOptions();
  renderEffectsChart();
  } // ปิดฟังก์ชัน init()
})();
