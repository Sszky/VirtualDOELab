/**
 * app.js — หน้า Catapult (UX/UI ยกมาจาก waterBottleRocket/app.js เปลี่ยน engine + ตัวเครื่องในฉาก)
 * วาดฉาก (canvas เส้นทาง + SVG เครื่องยิงการ์ตูน), ตารางผล, กราฟ Main effects/Interaction,
 * สองภาษา/ธีม, โหมด deterministic/stochastic, export CSV
 * อาศัย window.CatapultPhysics จาก physics.js และ window.I18N/applyTranslations จาก i18n.js
 */
(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
  const { simulateLaunch, CONSTANTS: PHYS } = window.CatapultPhysics;
  const { I18N, formatTemplate, applyTranslations } = window;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ---------------------------------------------------------------------
  // ค่าคงที่สำหรับตาราง/กราฟ
  // ---------------------------------------------------------------------
  const FACTORS = [
    { key: 'releaseDeg', id: 'release', nameKey: 'factorNameRelease', unit: '°' },
    { key: 'firingDeg', id: 'firing', nameKey: 'factorNameFiring', unit: '°' },
    { key: 'cupCm', id: 'cup', nameKey: 'factorNameCup', unit: ' cm' },
    { key: 'pinCm', id: 'pin', nameKey: 'factorNamePin', unit: ' cm' },
    { key: 'bungeeCm', id: 'bungee', nameKey: 'factorNameBungee', unit: ' cm' },
  ];
  const SWING_WALL_S = 0.3; // เวลาแอนิเมชันแขนเหวี่ยง (วินาทีจริงบนจอ)
  const TABLE_COLS = 11;

  // ---------------------------------------------------------------------
  // อ้างอิง DOM
  // ---------------------------------------------------------------------
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
    canvas: document.getElementById('trailCanvas'),
    axisY: document.getElementById('axisY'),
    axisX: document.getElementById('axisX'),
    catapult: document.getElementById('catapultSvg'),
    liveStats: document.getElementById('liveStats'),

    resultsSidebar: document.getElementById('resultsSidebar'),
    expandTableBtn: document.getElementById('expandTableBtn'),
    tableBackdrop: document.getElementById('tableBackdrop'),
    tableBody: document.getElementById('resultsTableBody'),
    clearTableBtn: document.getElementById('clearTableBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),

  };

  const ctx2d = els.canvas.getContext('2d');

  // ---------------------------------------------------------------------
  // สถานะของแอป
  // ---------------------------------------------------------------------
  let language = window.getSiteLang ? window.getSiteLang() : 'en'; // ภาษาที่เลือกไว้จากหน้าก่อน (ค่าเริ่มต้นอังกฤษ) ดู nav.js
  const results = []; // เก็บในหน่วยความจำเท่านั้น (ไม่มี localStorage)
  let animationHandle = null;
  let tableExpanded = false;
  let lastResult = null;
  let previousTrajectory = null; // เที่ยวบินก่อนหน้า วาดเป็นเส้นจาง ๆ
  let lastLiveSample = null;
  let showingLanded = false; // true = ฉากค้างที่ผลล่าสุด (แขนที่ B, บอลที่พื้น) จนกว่าจะปรับค่า

  // สเกลแกนคงที่ ขยายได้อย่างเดียว (แบบเดียวกับจรวด) — ค่าเริ่มต้นพอสำหรับระยะ ~2–4 m
  let sceneMaxX = 3;
  let sceneMaxY = 1.5;

  // ---------------------------------------------------------------------
  // slider <-> ช่องตัวเลข
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

  const inputs = FACTORS.map((f) => ({
    key: f.key,
    range: document.getElementById(`${f.id}Range`),
    number: document.getElementById(`${f.id}Number`),
  }));
  inputs.forEach((i) => bindPair(i.range, i.number));

  function readParams() {
    const params = {};
    inputs.forEach((i) => {
      params[i.key] = Number(i.number.value);
    });
    const modeInput = document.querySelector('input[name="mode"]:checked');
    params.mode = modeInput ? modeInput.value : 'deterministic';
    return params;
  }

  // ---------------------------------------------------------------------
  // พิกัด: ตัวเครื่องกับวิถีลูกบอลใช้สเกลเดียวกัน (m -> px) — ลูกบอลออกจากถ้วยแล้วบินตามวิถีจริงตลอดเส้น
  // (เคยวาดเครื่องใหญ่กว่าสเกลแล้วค่อย ๆ ดึงบอลเข้าวิถีจริง ทำให้เส้นช่วงต้นเรื้อยผิดฟิสิกส์ — เลิกใช้แล้ว)
  // ---------------------------------------------------------------------

  function syncCanvasSize() {
    els.canvas.width = els.scene.clientWidth;
    els.canvas.height = els.scene.clientHeight;
  }

  function growSceneBounds(trajectory) {
    let maxX = 0;
    let maxY = 0;
    for (const p of trajectory) {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    if (maxX * 1.1 > sceneMaxX) sceneMaxX = maxX * 1.1;
    if (maxY * 1.2 > sceneMaxY) sceneMaxY = maxY * 1.2;
  }

  function computeTransform() {
    const w = els.scene.clientWidth;
    const h = els.scene.clientHeight;
    const groundMarginPx = 40; // เผื่อตัวเลขแกน X + แถบพื้น
    const topPad = 26;
    const rightPad = 30;
    const behindM = PHYS.ARM_LENGTH_M + 0.03; // แขนที่ง้างไปด้านหลังสุดยื่นเลยจุดหมุนไปทางซ้าย
    const usableH = Math.max(40, h - groundMarginPx - topPad);
    // หา scale ที่ทั้งตัวเครื่อง (ด้านหลังจุดหมุน) และระยะ sceneMaxX (ด้านหน้า) พอดีความกว้างฉาก
    const scale = Math.max(1, Math.min((w - 24 - rightPad) / (sceneMaxX + behindM), usableH / sceneMaxY));
    const S = scale;
    const originPx = { x: 24 + behindM * scale, y: h - groundMarginPx };
    syncHorizon(originPx.y);
    return {
      scale,
      S,
      originPx,
      maxX: sceneMaxX,
      maxY: sceneMaxY,
      toPx(x, y) {
        return { px: originPx.x + x * scale, py: originPx.y - y * scale };
      },
    };
  }

  // ---------------------------------------------------------------------
  // canvas: พื้น + เส้นทาง
  // ---------------------------------------------------------------------
  function cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return hex;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
  }

  function drawStatic(transform) {
    const w = els.canvas.width;
    const h = els.canvas.height;
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.strokeStyle = cssVar('--ground-dark') || '#588f4d';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.moveTo(0, transform.originPx.y);
    ctx2d.lineTo(w, transform.originPx.y);
    ctx2d.stroke();
  }

  /** เส้นทางของลูกบอลที่กำลังบิน — ใช้ตำแหน่ง px เดียวกับลูกบอล (รวมช่วงกลืนจากถ้วยการ์ตูน) */
  function drawTrail(points) {
    const trimmed = points; // วาดเต็มเส้นตั้งแต่ถ้วย (จรวดตัดเหลือ 150 จุด แต่ลูกบอลที่บินนานจะหัวเส้นหาย)
    const trailColor = cssVar('--trail') || '#d5a62e';
    for (let i = 1; i < trimmed.length; i++) {
      ctx2d.strokeStyle = hexToRgba(trailColor, 0.45 + 0.55 * (i / trimmed.length));
      ctx2d.lineWidth = 2.5;
      ctx2d.beginPath();
      ctx2d.moveTo(trimmed[i - 1].px, trimmed[i - 1].py);
      ctx2d.lineTo(trimmed[i].px, trimmed[i].py);
      ctx2d.stroke();
    }
  }

  function drawGhostTrail(transform, trajectory) {
    if (!trajectory || trajectory.length < 2) return;
    ctx2d.strokeStyle = hexToRgba(cssVar('--muted') || '#79656a', 0.35);
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    trajectory.forEach((p, i) => {
      const q = transform.toPx(p.x, p.y);
      if (i === 0) ctx2d.moveTo(q.px, q.py);
      else ctx2d.lineTo(q.px, q.py);
    });
    ctx2d.stroke();
  }

  // ---------------------------------------------------------------------
  // แกน X/Y (DOM text) — วางให้ตรงกับจุด 0 และสเกลจริง
  // ---------------------------------------------------------------------
  function formatTick(v) {
    return v < 10 ? v.toFixed(1) : v.toFixed(0);
  }

  function renderAxes(transform) {
    const count = window.matchMedia('(max-width: 600px)').matches ? 3 : 4;
    const h = els.scene.clientHeight;

    els.axisY.innerHTML = '';
    els.axisX.innerHTML = '';
    for (let i = 0; i <= count; i++) {
      const y = document.createElement('span');
      y.textContent = formatTick((transform.maxY * i) / count);
      els.axisY.appendChild(y);
      const x = document.createElement('span');
      x.textContent = formatTick((transform.maxX * i) / count);
      els.axisX.appendChild(x);
    }
    els.axisY.style.top = `${transform.toPx(0, transform.maxY).py - 8}px`;
    els.axisY.style.bottom = `${h - transform.originPx.y - 8}px`;
    els.axisX.style.left = `${transform.originPx.x - 8}px`;
    els.axisX.style.width = `${transform.maxX * transform.scale + 16}px`;
  }

  // ---------------------------------------------------------------------
  // เครื่องยิงการ์ตูน (SVG) — ตำแหน่งทุกชิ้นคำนวณจากพารามิเตอร์ปัจจุบัน
  // มุม θ แบบ Statapult: 90° = แขนตั้งตรง, 180° = นอนไปด้านหลัง  (SVG y ชี้ลง จึงหมุน -θ)
  // ---------------------------------------------------------------------
  function catapultParts(transform, p) {
    const S = transform.S;
    const groundY = transform.originPx.y;
    const pivot = { x: transform.originPx.x, y: groundY - PHYS.PIVOT_HEIGHT_M * S };
    const armHalf = Math.max(2, 0.011 * S);
    const ballR = Math.max(3.5, (PHYS.BALL_DIAM_M / 2) * S);
    const cupR = ballR * 1.3;
    return { S, groundY, pivot, armHalf, ballR, cupR, p };
  }

  /** แปลงจุดในแนวแขน (ระยะ along จากจุดหมุน, off = ออกด้านหน้าของแขน) -> px ของ SVG */
  function onArm(parts, thetaDeg, along, off) {
    const t = (thetaDeg * Math.PI) / 180;
    return {
      x: parts.pivot.x + along * Math.cos(t) + off * Math.sin(t),
      y: parts.pivot.y - along * Math.sin(t) + off * Math.cos(t),
    };
  }

  function ballInCup(parts, thetaDeg) {
    return onArm(parts, thetaDeg, (parts.p.cupCm / 100) * parts.S, parts.armHalf + parts.cupR * 0.95);
  }

  function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  /**
   * วาดเครื่องทั้งหมดใหม่ — thetaDeg = มุมแขนตอนนี้, ball = ตำแหน่งลูกบอล px (null = อยู่ในถ้วย)
   */
  function drawCatapult(transform, p, thetaDeg, ball) {
    const parts = catapultParts(transform, p);
    const { S, groundY, pivot, armHalf, ballR, cupR } = parts;
    const svg = els.catapult;
    svg.textContent = '';

    const wood = '#c8904f';
    const woodDark = '#7a5230';
    const baseH = Math.max(5, 0.035 * S);
    const baseTop = groundY - baseH;

    // ฐาน + ขาตั้งจุดหมุน
    svg.appendChild(el('rect', { x: pivot.x - 0.36 * S, y: baseTop, width: 0.58 * S, height: baseH, rx: 2, fill: wood, stroke: woodDark, 'stroke-width': 1 }));
    svg.appendChild(el('path', { d: `M${pivot.x - armHalf * 2.2} ${baseTop} L${pivot.x} ${pivot.y} L${pivot.x + armHalf * 2.2} ${baseTop} Z`, fill: wood, stroke: woodDark, 'stroke-width': 1 }));

    // เสาตั้ง + รูตำแหน่งหนังยาง (E)
    const towerX = pivot.x + PHYS.TOWER_OFFSET_M * S;
    const towerW = Math.max(5, 0.03 * S);
    const towerTop = pivot.y - 0.33 * S;
    svg.appendChild(el('rect', { x: towerX - towerW / 2, y: towerTop, width: towerW, height: baseTop - towerTop, rx: 2, fill: wood, stroke: woodDark, 'stroke-width': 1 }));
    for (let cm = 14; cm <= 30; cm += 4) {
      svg.appendChild(el('circle', { cx: towerX, cy: pivot.y - (cm / 100) * S, r: Math.max(1.2, towerW * 0.18), fill: woodDark, opacity: 0.45 }));
    }
    const anchor = { x: towerX, y: pivot.y - (p.bungeeCm / 100) * S };

    // ตัวกั้น (B): หมุดด้านหน้าแขนที่มุมยิง + ก้านลงไปที่ฐาน
    const pegR = Math.max(2.5, armHalf * 1.1);
    const stop = onArm(parts, p.firingDeg, 0.13 * S, armHalf + pegR);
    svg.appendChild(el('line', { x1: stop.x, y1: stop.y, x2: stop.x, y2: baseTop, stroke: '#475569', 'stroke-width': Math.max(2, pegR * 0.7), 'stroke-linecap': 'round' }));
    svg.appendChild(el('circle', { cx: stop.x, cy: stop.y, r: pegR, fill: '#1b3a6b' }));

    // แขน (หมุนทั้งกลุ่ม) + รูหมุด (D) + ถ้วย (C)
    const armLen = PHYS.ARM_LENGTH_M * S;
    const arm = el('g', { transform: `translate(${pivot.x} ${pivot.y}) rotate(${-thetaDeg})` });
    arm.appendChild(el('rect', { x: -0.03 * S, y: -armHalf, width: armLen + 0.03 * S, height: armHalf * 2, rx: armHalf, fill: '#e2ad6b', stroke: woodDark, 'stroke-width': 1 }));
    for (let cm = 8; cm <= 24; cm += 4) {
      arm.appendChild(el('circle', { cx: (cm / 100) * S, cy: 0, r: Math.max(1, armHalf * 0.35), fill: woodDark, opacity: 0.4 }));
    }
    const cx = (p.cupCm / 100) * S;
    const a = armHalf;
    arm.appendChild(el('path', { d: `M${cx - cupR} ${a + cupR * 1.1} Q${cx - cupR} ${a} ${cx} ${a} Q${cx + cupR} ${a} ${cx + cupR} ${a + cupR * 1.1} Z`, fill: '#1b6ea6', stroke: '#1b3a6b', 'stroke-width': 1 }));
    arm.appendChild(el('circle', { cx: (p.pinCm / 100) * S, cy: 0, r: Math.max(2, armHalf * 0.8), fill: '#1b3a6b' }));
    svg.appendChild(arm);

    // หนังยาง: จากจุดเกี่ยวบนเสา (E) ไปหมุดบนแขน (D)
    const pin = onArm(parts, thetaDeg, (p.pinCm / 100) * S, 0);
    svg.appendChild(el('line', { x1: anchor.x, y1: anchor.y, x2: pin.x, y2: pin.y, stroke: '#dc2626', 'stroke-width': Math.max(2, 0.009 * S), 'stroke-linecap': 'round' }));
    svg.appendChild(el('circle', { cx: anchor.x, cy: anchor.y, r: Math.max(2.5, towerW * 0.4), fill: '#1b3a6b' }));

    // จุดหมุน
    svg.appendChild(el('circle', { cx: pivot.x, cy: pivot.y, r: Math.max(2.5, armHalf * 1.1), fill: '#5b4a3f' }));

    // ลูกบอล
    const b = ball || ballInCup(parts, thetaDeg);
    svg.appendChild(el('circle', { cx: b.x, cy: b.y, r: ballR, fill: '#f97316', stroke: '#c2410c', 'stroke-width': 1 }));
  }

  // ---------------------------------------------------------------------
  // เล่นซ้ำ trajectory
  // ---------------------------------------------------------------------
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
    const lerp = (u, v) => u + (v - u) * frac;
    return { t: simT, x: lerp(a.x, b.x), y: lerp(a.y, b.y), vx: lerp(a.vx, b.vx), vy: lerp(a.vy, b.vy) };
  }

  /**
   * ตำแหน่ง px ของลูกบอลที่เวลา t: ตำแหน่งจริงตามสเกล + ส่วนชดเชยเล็ก ๆ (ไม่กี่ px) ระหว่างรูปบอลที่นั่งในถ้วย
   * กับจุดปล่อยบนแนวแขนในฟิสิกส์ ซึ่งหายไปในช่วงแรกของการบิน → จุดตกตรงกับระยะจริงบนแกน X เสมอ
   */
  function makeBallPx(transform, result) {
    const { trajectory, summary, params } = result;
    const parts = catapultParts(transform, params);
    const cup = ballInCup(parts, params.firingDeg);
    const start = transform.toPx(trajectory[0].x, trajectory[0].y);
    const off = { x: cup.x - start.px, y: cup.y - start.py };
    const blendT = Math.max(0.05, summary.flightTime * 0.3);
    return (sample) => {
      const q = transform.toPx(sample.x, sample.y);
      const f = Math.max(0, 1 - sample.t / blendT);
      const s = f * f * (3 - 2 * f);
      return { px: q.px + off.x * s, py: q.py + off.y * s };
    };
  }

  function formatLiveStats(sample) {
    const dict = I18N[language];
    const stat = (label, value) =>
      `<span class="live-stat"><span class="live-stat-label">${label}:</span><span class="live-stat-value">${value}</span></span>`;
    const dash = '—';
    return (
      stat(dict.liveTime, sample ? `${sample.t.toFixed(2)} s` : dash) +
      stat(dict.liveDistance, sample ? `${Math.max(0, sample.x).toFixed(2)} m` : dash) +
      stat(dict.liveAltitude, sample ? `${sample.y.toFixed(2)} m` : dash) +
      stat(dict.liveSpeed, sample ? `${Math.hypot(sample.vx, sample.vy).toFixed(2)} m/s` : dash)
    );
  }

  function renderLiveStats(sample) {
    lastLiveSample = sample;
    els.liveStats.innerHTML = formatLiveStats(sample);
  }

  /** ฉากนิ่ง: แขนง้างที่มุม A ลูกบอลอยู่ในถ้วย (เรียกทุกครั้งที่ปรับ slider → เครื่องขยับตามทันที) */
  function redrawIdleScene() {
    if (animationHandle) return;
    showingLanded = false;
    syncCanvasSize();
    const transform = computeTransform();
    const p = readParams();
    drawStatic(transform);
    drawGhostTrail(transform, previousTrajectory);
    renderAxes(transform);
    drawCatapult(transform, p, Math.max(p.releaseDeg, p.firingDeg + PHYS.MIN_GAP_DEG), null);
  }

  /** วาดเฟรมสุดท้ายของผลล่าสุดซ้ำ (ตอนสลับธีม/เปลี่ยนขนาดฉาก) */
  function redrawCurrentFrame() {
    if (animationHandle) return;
    if (!lastResult || !showingLanded) {
      redrawIdleScene();
      return;
    }
    syncCanvasSize();
    const transform = computeTransform();
    const { trajectory, params } = lastResult;
    const ballPx = makeBallPx(transform, lastResult);
    drawStatic(transform);
    drawGhostTrail(transform, previousTrajectory);
    drawTrail(trajectory.map(ballPx));
    renderAxes(transform);
    const end = ballPx(trajectory[trajectory.length - 1]);
    drawCatapult(transform, params, params.firingDeg, { x: end.px, y: end.py });
  }

  function startAnimation(result) {
    const { trajectory, summary, params } = result;
    syncCanvasSize();
    growSceneBounds(trajectory);
    const transform = computeTransform();
    renderAxes(transform);
    const ballPx = makeBallPx(transform, result);

    const flightTime = Math.max(summary.flightTime, 0.05);
    const playback = Math.min(4, Math.max(1.2, flightTime * 2)); // บินจริงแค่ ~0.5 s ยืดให้ดูทัน
    const timeScale = flightTime / playback;
    const startWall = performance.now();
    const trailPts = [];
    let nextTrailIdx = 0;

    setLaunchEnabled(false);
    renderLiveStats(null);
    if (animationHandle) cancelAnimationFrame(animationHandle);

    function frame(now) {
      const wall = (now - startWall) / 1000;
      drawStatic(transform);
      drawGhostTrail(transform, previousTrajectory);

      // ช่วงที่ 1: แขนเหวี่ยงจาก A ไปชนตัวกั้นที่ B (เร่งขึ้นเรื่อย ๆ)
      if (wall < SWING_WALL_S) {
        const u = wall / SWING_WALL_S;
        const theta = params.releaseDeg - (params.releaseDeg - params.firingDeg) * u * u;
        drawCatapult(transform, params, theta, null);
        animationHandle = requestAnimationFrame(frame);
        return;
      }

      // ช่วงที่ 2: ลูกบอลบิน
      const simT = (wall - SWING_WALL_S) * timeScale;
      const finished = simT >= flightTime;
      const sample = finished ? trajectory[trajectory.length - 1] : interpolateAtTime(trajectory, simT);
      while (nextTrailIdx < trajectory.length && trajectory[nextTrailIdx].t <= sample.t) {
        trailPts.push(ballPx(trajectory[nextTrailIdx]));
        nextTrailIdx++;
      }
      const b = ballPx(sample);
      drawTrail([...trailPts, b]);
      drawCatapult(transform, params, params.firingDeg, { x: b.px, y: b.py });
      renderLiveStats(sample);

      if (finished) {
        animationHandle = null;
        lastResult = result;
        showingLanded = true;
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
      .map(
        (r, i) => `<tr>
          <td>${i + 1}</td>
          ${FACTORS.map((f) => `<td>${r[f.key]}</td>`).join('')}
          <td>${r.distance.toFixed(2)}</td>
          <td class="col-extra">${r.flightTime.toFixed(2)}</td>
          <td class="col-extra">${r.maxHeight.toFixed(2)}</td>
          <td class="col-extra">${r.launchSpeed.toFixed(2)}</td>
          <td class="col-extra">${dict[r.mode] || r.mode}</td>
        </tr>`
      )
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
    factors: FACTORS.map((f) => ({
      key: f.key,
      label: () => I18N[language][f.nameKey],
      format: (v) => `${v}${f.unit}`,
    })),
    responses: [
      { key: 'distance', labelKey: 'yDistance', unit: 'm', digits: 2 },
      { key: 'flightTime', labelKey: 'yFlightTime', unit: 's', digits: 2 },
      { key: 'maxHeight', labelKey: 'yMaxHeight', unit: 'm', digits: 2 },
      { key: 'launchSpeed', labelKey: 'yLaunchSpeed', unit: 'm/s', digits: 2 },
    ],
    replicateKeys: FACTORS.map((f) => f.key),
    getResults: () => results,
    lang: () => language,
    filePrefix: 'catapult',
  });

  function renderEffectsChart() {
    effectsChart.render();
  }

  // ปุ่มเฟืองเลือกคอลัมน์ของตารางย่อ (../assets/table-settings.js)
  const tableSettings = window.TableSettings.init({
    sim: 'catapult',
    factorCount: FACTORS.length,
    factorLabel: (i) => I18N[language][FACTORS[i].nameKey],
    lang: () => language,
  });

  // ---------------------------------------------------------------------
// Create CSV content for Catapult
// ---------------------------------------------------------------------

function escapeCSVValue(value) {
  const stringValue = String(value ?? "");

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function createCSVContent() {
  const dict = I18N[language];

  const header = [
    dict.thRun,

    ...FACTORS.map(
      (factor) =>
        I18N[language][factor.nameKey],
    ),

    dict.thDistance,
    dict.thFlightTime,
    dict.thMaxAltitude,
    dict.thLaunchSpeed,
    dict.thMode,
  ];

  const rows = results.map(
    (result, index) => [
      index + 1,

      ...FACTORS.map(
        (factor) =>
          result[factor.key],
      ),

      result.distance.toFixed(2),
      result.flightTime.toFixed(2),
      result.maxHeight.toFixed(2),
      result.launchSpeed.toFixed(2),

      dict[result.mode] ||
        result.mode,
    ],
  );

  const csvContent = [
    header,
    ...rows,
  ]
    .map((row) =>
      row
        .map(escapeCSVValue)
        .join(","),
    )
    .join("\r\n");

  // BOM ช่วยป้องกันภาษาไทยเพี้ยนใน Excel
  return "\uFEFF" + csvContent;
}

window.DRIVE_EXPORT_CONFIG = {
  hasData: () =>
    results.length > 0,

  createCSVContent:
    createCSVContent,

  createFilename: () =>
    `catapult-experiments-${Date.now()}.csv`,
};

// ---------------------------------------------------------------------
// Export CSV to computer
// ---------------------------------------------------------------------

els.exportCsvBtn.addEventListener(
  "click",
  () => {
    if (results.length === 0) {
      showWarning(
        translateWarnings([
          { key: "exportEmpty" },
        ]),
      );

      return;
    }

    const csvContent =
      createCSVContent();

    const csvFile = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const fileURL =
      URL.createObjectURL(csvFile);

    const downloadLink =
      document.createElement("a");

    const timestamp = new Date()
      .toISOString()
      .replace(/[:T]/g, "-")
      .replace(/\..+/, "");

    downloadLink.href = fileURL;

    downloadLink.download =
      `catapult_results_${timestamp}.csv`;

    document.body.appendChild(
      downloadLink,
    );

    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(fileURL);
  },
);
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
    new ResizeObserver(() => redrawCurrentFrame()).observe(els.scene); // พิกัดเป็น px ต้องวาดใหม่เมื่อฉากเปลี่ยนขนาด
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
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((n) => n && n.setAttribute('inert', ''));
    setExpandButton(true);
  }

  function closeTableExpand() {
    tableExpanded = false;
    els.resultsSidebar.classList.remove('expanded');
    els.tableBackdrop.classList.remove('visible');
    document.body.classList.remove('table-modal-open');
    [els.topbar, els.intro, els.controlsPanel, els.simulationPanel].forEach((n) => n && n.removeAttribute('inert'));
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
  // ปุ่มยิง + เครื่องขยับตาม slider แบบ real-time
  // ---------------------------------------------------------------------
  els.launchBtn.addEventListener('click', () => {
    clearWarning();
    const result = simulateLaunch(readParams());
    if (result.warnings.length > 0) showWarning(translateWarnings(result.warnings));
    // มุมง้างอาจถูกปรับขึ้น (A ต้อง > B) — สะท้อนค่าที่ใช้จริงกลับไปที่ช่อง input
    const release = inputs.find((i) => i.key === 'releaseDeg');
    release.number.value = result.params.releaseDeg;
    release.range.value = result.params.releaseDeg;
    previousTrajectory = lastResult ? lastResult.trajectory : previousTrajectory;
    startAnimation(result);
  });

  inputs.forEach((i) => {
    i.range.addEventListener('input', redrawIdleScene);
    i.number.addEventListener('input', redrawIdleScene);
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
