/* -------------------- I18N : Language TH/EN -------------------- */
const I18N = {
  module_title: { th: 'เฮลิคอปเตอร์กระดาษ', en: 'Paper Helicopter' },
  module_subtitle: { th: 'การออกแบบการทดลอง', en: 'Design of Experiments' },
  kicker: { th: 'การทดลองเสมือน DOE · เฮลิคอปเตอร์กระดาษ', en: 'Virtual DOE experiment · Paper Helicopter' },
  page_title: { th: 'การจำลองเฮลิคอปเตอร์กระดาษ', en: 'Paper Helicopter Simulation' },
  page_lede: {
    th: 'ปรับพารามิเตอร์แล้วกด "เริ่มทดลอง" เพื่อดูวิถีการร่อนลงและบันทึกผลการทดลอง',
    en: 'Adjust the parameters and press "Run experiment" to watch it descend and log the result.'
  },
  factors_title: { th: 'กำหนดปัจจัย', en: 'Set factors' },
  reset_label: { th: 'รีเซ็ต', en: 'Reset' },
  mode_label: { th: 'โหมดการทดลอง', en: 'Experiment mode' },
  mode_det: { th: 'ค่าคงที่', en: 'Deterministic' },
  mode_sto: { th: 'มีการสุ่ม', en: 'Stochastic' },
  mode_note_det: { th: 'ปัจจัยเดิมจะให้ผลลัพธ์เท่าเดิมเสมอ', en: 'Same factors always produce the same result.' },
  mode_note_sto: { th: 'ผลลัพธ์จะมีความคลาดเคลื่อนเล็กน้อยแบบสุ่มทุกครั้งที่ทดลอง', en: 'Results include small random noise on every run.' },
  run_label: { th: 'เริ่มทดลอง', en: 'Run experiment' },
  simulate_title: { th: 'การจำลอง', en: 'Simulate' },
  status_ready: { th: 'พร้อม', en: 'READY' },
  status_running: { th: 'กำลังทดลอง', en: 'RUNNING' },
  stat_time: { th: 'เวลาในการตก', en: 'Fall time' },
  stat_height: { th: 'ความสูงที่ปล่อย', en: 'Drop height' },
  stat_speed: { th: 'ความเร็วเฉลี่ย', en: 'Average speed' },
  results_title: { th: 'ตารางผลการทดลอง', en: 'Results table' },
  clear_label: { th: 'ล้างตาราง', en: 'Clear' },
  export_label: { th: 'ส่งออก CSV', en: 'Export CSV' },
  col_time: { th: 'เวลา (s)', en: 'Time (s)' },
  table_empty: {
    th: 'ยังไม่มีผลการทดลอง — กด "เริ่มทดลอง" เพื่อเริ่มต้น',
    en: 'No results yet — press "Run experiment" to start.'
  },
  table_footnote: {
    th: '* ผลการทดลองเก็บไว้ในหน่วยความจำของหน้านี้เท่านั้น รีเฟรชหน้าเว็บแล้วข้อมูลจะหายไป — ใช้ปุ่ม "ส่งออก CSV" เพื่อบันทึกเป็นไฟล์',
    en: '* Results live only in this page\'s memory — refreshing clears them. Use "Export CSV" to save a file.'
  },
  charts_title: { th: 'กราฟผลกระทบหลัก / กราฟปฏิสัมพันธ์', en: 'Main Effects / Interaction Plots' },
  charts_lede: {
    th: 'ดูว่าแต่ละปัจจัยส่งผลต่อเวลาในการตกอย่างไร จากผลการทดลองที่บันทึกไว้',
    en: 'See how each factor affects fall time, based on the results you have logged.'
  },
  chart_type_label: { th: 'ชนิดกราฟ', en: 'Chart type' },
  chart_main: { th: 'ผลกระทบหลัก (Main Effects)', en: 'Main Effects' },
  chart_interaction: { th: 'ปฏิสัมพันธ์ (Interaction)', en: 'Interaction' },
  axis_x_label: { th: 'ปัจจัย (แกน X)', en: 'Factor (X axis)' },
  axis_trace_label: { th: 'ปัจจัยที่สอง (เส้น)', en: 'Second factor (line)' },
  axis_y_note: { th: 'แกน Y: เวลาในการตกเฉลี่ย (s)', en: 'Y axis: average fall time (s)' },
  chart_note: { th: 'ค่าเฉลี่ยเวลาต่อค่าที่บันทึกไว้', en: 'Average time from logged runs' },
  chart_empty: {
    th: 'บันทึกผลอย่างน้อย 2 ครั้งที่มีค่าปัจจัยนี้ต่างกัน เพื่อดูกราฟนี้',
    en: 'Log at least 2 runs with different values of this factor to see this chart.'
  },
  search_placeholder: { th: 'ค้นหาปัจจัย...', en: 'Search factors...' },
  search_empty: { th: 'ไม่พบปัจจัยที่ค้นหา', en: 'No matching factors.' },
  group_wing: { th: 'มิติปีก', en: 'Wing Dimensions' },
  group_body: { th: 'มิติลำตัว', en: 'Body Dimensions' },
  tt_reset: { th: 'รีเซ็ตตำแหน่ง', en: 'Reset position' },
  tt_undo: { th: 'ย้อนกลับรันล่าสุด', en: 'Undo last run' },
  tt_export: { th: 'ส่งออก CSV', en: 'Export CSV' },
  tt_clear: { th: 'ล้างข้อมูล', en: 'Clear data' },
  tt_run: { th: 'เริ่มทดลอง', en: 'Run experiment' },
  theme_modal_title: { th: 'เลือกธีม', en: 'Choose theme' },
  theme_light: { th: 'สว่าง (Light)', en: 'Light' },
  theme_dark: { th: 'มืด (Dark)', en: 'Dark' },
  close_label: { th: 'ปิด', en: 'Close' },
  footer_left: { th: 'Virtual DOE Lab · Paper Helicopter Module', en: 'Virtual DOE Lab · Paper Helicopter Module' },
  footer_right: {
    th: 'การจำลองเพื่อการศึกษา — ผลลัพธ์เป็นค่าประมาณจากแบบจำลอง',
    en: 'Educational simulation — results are model estimates.'
  }
};

let LANG = 'th';

function t(key) {
  return (I18N[key] && I18N[key][LANG]) || key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = t(element.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    element.title = t(element.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    element.placeholder = t(element.getAttribute('data-i18n-placeholder'));
  });
  document.getElementById('langToggle').textContent = LANG === 'th' ? 'EN' : 'TH';
}

document.getElementById('langToggle').addEventListener('click', () => {
  LANG = LANG === 'th' ? 'en' : 'th';
  applyI18n();
  renderFactorFields();
  renderModeNote();
  populateFactorSelects();
  renderChart();
});

/* -------------------- Theme -------------------- */
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀' : '☾';
  try {
    localStorage.setItem('paperHeliDoeTheme', theme);
  } catch (error) {
    /* storage unavailable (e.g. restricted file:// context) - ignore */
  }
}

function openThemeModal() {
  document.getElementById('themeModalOverlay').classList.add('show');
}

function closeThemeModal() {
  document.getElementById('themeModalOverlay').classList.remove('show');
}

document.getElementById('themeToggle').addEventListener('click', openThemeModal);

document.getElementById('themeModalClose').addEventListener('click', closeThemeModal);

document.getElementById('themeModalOverlay').addEventListener('click', event => {
  if (event.target.id === 'themeModalOverlay') closeThemeModal();
});

document.getElementById('themeOptionLight').addEventListener('click', () => {
  applyTheme('light');
  closeThemeModal();
});

document.getElementById('themeOptionDark').addEventListener('click', () => {
  applyTheme('dark');
  closeThemeModal();
});

let storedTheme = 'light';
try {
  storedTheme = localStorage.getItem('paperHeliDoeTheme') || 'light';
} catch (error) {
  /* storage unavailable - fall back to light */
}
applyTheme(storedTheme);

/* -------------------- Factors -------------------- */
const FACTORS = [
  { key: 'A', th: 'ความยาวปีก (A)', en: 'Wing length (A)', unit: 'cm', low: 8, high: 12 },
  { key: 'B', th: 'ความกว้างปีก (B)', en: 'Wing width (B)', unit: 'cm', low: 3, high: 5 },
  { key: 'C', th: 'ความยาวลำตัว (C)', en: 'Body length (C)', unit: 'cm', low: 5, high: 8 },
  { key: 'D', th: 'ความกว้างลำตัว (D)', en: 'Body width (D)', unit: 'cm', low: 2, high: 3 }
];
const FACTOR_GROUPS = [
  { id: 'wing', th: 'มิติปีก', en: 'Wing Dimensions', keys: ['A', 'B'] },
  { id: 'body', th: 'มิติลำตัว', en: 'Body Dimensions', keys: ['C', 'D'] }
];
let OPEN_GROUPS = new Set(['wing', 'body']);
let SEARCH_QUERY = '';

const DROP_HEIGHT_M = 2.0;
const DEFAULTS = { A: 10, B: 4, C: 6.5, D: 2.5 };
let VAL = { ...DEFAULTS };

function coded(key) {
  const factor = FACTORS.find(item => item.key === key);
  return -1 + 2 * (VAL[key] - factor.low) / (factor.high - factor.low);
}

function factorFieldHtml(factor) {
  const step = ((factor.high - factor.low) / 40).toFixed(2);
  return `
    <div class="factor-field">
      <div class="factor-field-head">
        <label for="sl${factor.key}">${LANG === 'th' ? factor.th : factor.en}</label>
        <input type="number" id="num${factor.key}" class="factor-number"
          min="${factor.low}" max="${factor.high}" step="${step}" value="${VAL[factor.key].toFixed(1)}">
      </div>
      <input type="range" id="sl${factor.key}"
        min="${factor.low}" max="${factor.high}" step="${step}" value="${VAL[factor.key]}">
      <p class="factor-hint">${LANG === 'th' ? 'ค่าตามตาราง' : 'Range'} ${factor.low}–${factor.high} ${factor.unit}</p>
    </div>
  `;
}

function renderFactorFields() {
  const container = document.getElementById('factorAccordion');
  const query = SEARCH_QUERY.trim().toLowerCase();

  const groupsHtml = FACTOR_GROUPS.map(group => {
    const items = FACTORS.filter(f => group.keys.includes(f.key));
    const visibleItems = items.filter(f => {
      const label = (LANG === 'th' ? f.th : f.en).toLowerCase();
      return !query || label.includes(query);
    });

    if (!visibleItems.length) return '';

    const isOpen = query ? true : OPEN_GROUPS.has(group.id);
    const groupLabel = LANG === 'th' ? group.th : group.en;

    return `
      <div class="accordion-group ${isOpen ? 'open' : ''}" data-group="${group.id}">
        <button class="accordion-header" type="button" data-group="${group.id}">
          <span>${groupLabel}</span>
          <span class="accordion-chevron">▾</span>
        </button>
        <div class="accordion-body">
          ${visibleItems.map(factorFieldHtml).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = groupsHtml || `<p class="empty-state">${t('search_empty')}</p>`;

  FACTORS.forEach(factor => {
    const slider = document.getElementById('sl' + factor.key);
    const number = document.getElementById('num' + factor.key);
    if (!slider || !number) return;

    slider.addEventListener('input', () => {
      VAL[factor.key] = parseFloat(slider.value);
      number.value = VAL[factor.key].toFixed(1);
      updateHeliPreview();
    });

    number.addEventListener('change', () => {
      let value = parseFloat(number.value);
      if (Number.isNaN(value)) value = DEFAULTS[factor.key];
      value = Math.min(factor.high, Math.max(factor.low, value));
      VAL[factor.key] = value;
      slider.value = value;
      number.value = value.toFixed(1);
      updateHeliPreview();
    });
  });

  container.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      if (SEARCH_QUERY.trim()) return;
      const groupId = header.dataset.group;
      if (OPEN_GROUPS.has(groupId)) {
        OPEN_GROUPS.delete(groupId);
      } else {
        OPEN_GROUPS.add(groupId);
      }
      header.closest('.accordion-group').classList.toggle('open');
    });
  });
}

document.getElementById('factorSearch').addEventListener('input', event => {
  SEARCH_QUERY = event.target.value;
  renderFactorFields();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  VAL = { ...DEFAULTS };
  renderFactorFields();
  updateHeliPreview();
});

/* -------------------- Live Helicopter Preview -------------------- */
function updateHeliPreview() {
  const wrap = document.getElementById('heliWrap');
  wrap.style.setProperty('--wingL', Math.round(24 + VAL.A * 5.2) + 'px');
  wrap.style.setProperty('--wingW', Math.round(10 + VAL.B * 4.4) + 'px');
  wrap.style.setProperty('--bodyH', Math.round(18 + VAL.C * 4.6) + 'px');
  wrap.style.setProperty('--bodyW', Math.round(6 + VAL.D * 3.2) + 'px');
}

function resetHeliPosition() {
  const wrap = document.getElementById('heliWrap');
  wrap.style.transition = 'none';
  wrap.style.top = '14px';
  wrap.style.transform = 'translate(-50%,0) rotate(0deg)';
}

document.getElementById('tbReset').addEventListener('click', resetHeliPosition);

/* -------------------- Mode (Deterministic / Stochastic) -------------------- */
let MODE = 'det';

function renderModeNote() {
  document.getElementById('modeNote').textContent = t(MODE === 'det' ? 'mode_note_det' : 'mode_note_sto');
}

document.querySelectorAll('#modeSegmented .seg-btn').forEach(button => {
  button.addEventListener('click', () => {
    MODE = button.dataset.mode;
    document.querySelectorAll('#modeSegmented .seg-btn').forEach(btn => btn.classList.toggle('active', btn === button));
    renderModeNote();
  });
});

/* -------------------- Response Model -------------------- */
function flightTime(a, b, c, d, mode) {
  let time = 3.0 + 0.5 * a + 0.3 * b - 0.20 * c - 0.15 * d + 0.10 * a * b;
  if (mode === 'sto') time += (Math.random() - 0.5) * 0.3;
  return Math.max(0.6, Math.round(time * 100) / 100);
}

/* -------------------- Run + Animation -------------------- */
function animateDrop(time, callback) {
  const wrap = document.getElementById('heliWrap');
  const stage = document.getElementById('stageVisual');
  const maxY = stage.clientHeight - 50;

  wrap.style.transition = 'none';
  wrap.style.top = '14px';
  wrap.style.transform = 'translate(-50%,0) rotate(0deg)';

  requestAnimationFrame(() => {
    wrap.style.transition = `top ${time}s linear, transform ${time}s linear`;
    wrap.style.top = maxY + 'px';
    wrap.style.transform = `translate(-50%,0) rotate(${360 * 7}deg)`;
  });

  setTimeout(callback, time * 1000);
}

let isRunning = false;

function setRunningState(running) {
  isRunning = running;
  document.getElementById('runBtn').disabled = running;
  document.getElementById('tbRun').disabled = running;
}

function runExperiment() {
  if (isRunning) return;
  setRunningState(true);

  const a = coded('A'), b = coded('B'), c = coded('C'), d = coded('D');
  const time = flightTime(a, b, c, d, MODE);

  document.getElementById('statusPill').textContent = t('status_running');
  document.getElementById('timeVal').textContent = '…';
  document.getElementById('speedVal').textContent = '…';

  animateDrop(Math.min(time, 4), () => {
    document.getElementById('statusPill').textContent = t('status_ready');
    document.getElementById('timeVal').textContent = time.toFixed(2);
    document.getElementById('speedVal').textContent = (DROP_HEIGHT_M / time).toFixed(2);
    addRun(VAL.A, VAL.B, VAL.C, VAL.D, time);
    setRunningState(false);
  });
}

document.getElementById('runBtn').addEventListener('click', runExperiment);
document.getElementById('tbRun').addEventListener('click', runExperiment);

/* -------------------- Log -------------------- */
let LOG = [];

function addRun(aCm, bCm, cCm, dCm, time) {
  LOG.push({ run: LOG.length + 1, A: aCm, B: bCm, C: cCm, D: dCm, t: time });
  renderLog();
  renderChart();
}

function renderLog() {
  const body = document.getElementById('logBody');
  const empty = document.getElementById('tableEmpty');

  body.innerHTML = LOG.map(row =>
    `<tr><td>${row.run}</td><td>${row.A.toFixed(1)}</td><td>${row.B.toFixed(1)}</td>` +
    `<td>${row.C.toFixed(1)}</td><td>${row.D.toFixed(1)}</td><td>${row.t.toFixed(2)}</td></tr>`
  ).join('');

  empty.style.display = LOG.length ? 'none' : 'block';
}

function undoLastRun() {
  if (!LOG.length) return;
  LOG.pop();
  LOG.forEach((row, index) => { row.run = index + 1; });
  renderLog();
  renderChart();
}

document.getElementById('tbUndo').addEventListener('click', undoLastRun);
document.getElementById('tbExport').addEventListener('click', () => document.getElementById('exportBtn').click());
document.getElementById('tbClear').addEventListener('click', () => document.getElementById('clearBtn').click());

document.getElementById('clearBtn').addEventListener('click', () => {
  LOG = [];
  renderLog();
  renderChart();
  document.getElementById('timeVal').textContent = '—';
  document.getElementById('speedVal').textContent = '—';
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!LOG.length) return;

  let csv = 'Run,A_cm,B_cm,C_cm,D_cm,FlightTime_s\n';
  LOG.forEach(row => {
    csv += `${row.run},${row.A.toFixed(1)},${row.B.toFixed(1)},${row.C.toFixed(1)},${row.D.toFixed(1)},${row.t.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'paper_helicopter_doe_log.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

/* -------------------- Chart Control -------------------- */
let CHART_TYPE = 'main';
let CHART_X = 'A';
let CHART_TRACE = 'B';

function populateFactorSelects() {
  const xSelect = document.getElementById('factorXSelect');
  const traceSelect = document.getElementById('factorTraceSelect');

  xSelect.innerHTML = FACTORS.map(f =>
    `<option value="${f.key}" ${f.key === CHART_X ? 'selected' : ''}>${LANG === 'th' ? f.th : f.en}</option>`
  ).join('');

  traceSelect.innerHTML = FACTORS
    .filter(f => f.key !== CHART_X)
    .map(f => `<option value="${f.key}" ${f.key === CHART_TRACE ? 'selected' : ''}>${LANG === 'th' ? f.th : f.en}</option>`)
    .join('');
}

document.getElementById('factorXSelect').addEventListener('change', event => {
  CHART_X = event.target.value;
  if (CHART_TRACE === CHART_X) {
    CHART_TRACE = FACTORS.find(f => f.key !== CHART_X).key;
  }
  populateFactorSelects();
  renderChart();
});

document.getElementById('factorTraceSelect').addEventListener('change', event => {
  CHART_TRACE = event.target.value;
  renderChart();
});

document.querySelectorAll('#chartTypeSegmented .seg-btn').forEach(button => {
  button.addEventListener('click', () => {
    CHART_TYPE = button.dataset.chart;
    document.querySelectorAll('#chartTypeSegmented .seg-btn').forEach(btn => btn.classList.toggle('active', btn === button));
    document.getElementById('factorTraceBlock').style.display = CHART_TYPE === 'interaction' ? 'block' : 'none';
    renderChart();
  });
});

/* -------------------- Chart Rendering -------------------- */
function factorLabel(key) {
  const factor = FACTORS.find(f => f.key === key);
  return LANG === 'th' ? factor.th : factor.en;
}

function codedOfRow(row, key) {
  const factor = FACTORS.find(f => f.key === key);
  return -1 + 2 * (row[key] - factor.low) / (factor.high - factor.low);
}

function avgWhere(predicate) {
  const rows = LOG.filter(predicate);
  if (!rows.length) return null;
  return rows.reduce((sum, row) => sum + row.t, 0) / rows.length;
}

function renderChart() {
  document.getElementById('chartFactorTitle').textContent = factorLabel(CHART_X);

  if (CHART_TYPE === 'main') {
    renderMainEffectChart();
  } else {
    renderInteractionChart();
  }
}

function drawAxes(svg, x0, x1, y0, y1, minValue, maxValue, tickCount) {
  let ticks = '';
  for (let i = 0; i <= tickCount; i++) {
    const value = minValue + (i / tickCount) * (maxValue - minValue);
    const y = y0 - (value - minValue) / (maxValue - minValue) * (y0 - y1);
    ticks += `
      <line x1="${x0}" y1="${y.toFixed(1)}" x2="${x1}" y2="${y.toFixed(1)}"
        stroke="var(--border)" stroke-dasharray="2,3"></line>
      <text x="${x0 - 8}" y="${(y + 3).toFixed(1)}" font-size="10" fill="var(--muted)"
        text-anchor="end">${value.toFixed(2)}</text>
    `;
  }
  return ticks +
    `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="var(--border)"></line>
     <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="var(--border)"></line>`;
}

function renderMainEffectChart() {
  const svg = document.getElementById('chartSvg');
  const emptyState = document.getElementById('chartEmpty');

  const lowAverage = avgWhere(row => codedOfRow(row, CHART_X) < 0);
  const highAverage = avgWhere(row => codedOfRow(row, CHART_X) > 0);

  if (lowAverage === null || highAverage === null) {
    svg.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  const factor = FACTORS.find(f => f.key === CHART_X);
  const x0 = 66, x1 = 400, y0 = 220, y1 = 30;
  const minValue = Math.min(lowAverage, highAverage) - 0.2;
  const maxValue = Math.max(lowAverage, highAverage) + 0.2;

  const px = value => x0 + (value - factor.low) / (factor.high - factor.low) * (x1 - x0);
  const py = value => y0 - (value - minValue) / (maxValue - minValue) * (y0 - y1);

  svg.innerHTML = `
    ${drawAxes(svg, x0, x1, y0, y1, minValue, maxValue, 4)}
    <text x="${x0}" y="${y0 + 22}" font-size="11" fill="var(--text)" text-anchor="middle">${factor.low}${factor.unit}</text>
    <text x="${x1}" y="${y0 + 22}" font-size="11" fill="var(--text)" text-anchor="middle">${factor.high}${factor.unit}</text>
    <polyline points="${px(factor.low)},${py(lowAverage)} ${px(factor.high)},${py(highAverage)}"
      fill="none" stroke="#7c2233" stroke-width="3"></polyline>
    <circle cx="${px(factor.low)}" cy="${py(lowAverage)}" r="5" fill="#7c2233"></circle>
    <circle cx="${px(factor.high)}" cy="${py(highAverage)}" r="5" fill="#7c2233"></circle>
    <text x="${px(factor.low)}" y="${py(lowAverage) - 10}" font-size="10" fill="var(--text)" text-anchor="middle">${lowAverage.toFixed(2)} s</text>
    <text x="${px(factor.high)}" y="${py(highAverage) - 10}" font-size="10" fill="var(--text)" text-anchor="middle">${highAverage.toFixed(2)} s</text>
  `;
}

function renderInteractionChart() {
  const svg = document.getElementById('chartSvg');
  const emptyState = document.getElementById('chartEmpty');
  const factor = FACTORS.find(f => f.key === CHART_X);

  const cellAverage = (xSign, traceSign) =>
    avgWhere(row => Math.sign(codedOfRow(row, CHART_X)) === xSign && Math.sign(codedOfRow(row, CHART_TRACE)) === traceSign);

  const traceLow = [cellAverage(-1, -1), cellAverage(1, -1)];
  const traceHigh = [cellAverage(-1, 1), cellAverage(1, 1)];
  const allValues = [...traceLow, ...traceHigh].filter(v => v !== null);

  if (allValues.length < 2) {
    svg.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  const x0 = 66, x1 = 400, y0 = 220, y1 = 30;
  const minValue = Math.min(...allValues) - 0.2;
  const maxValue = Math.max(...allValues) + 0.2;
  const px = index => (index === 0 ? x0 : x1);
  const py = value => y0 - (value - minValue) / (maxValue - minValue) * (y0 - y1);

  function lineFor(values, color) {
    const points = values.map((v, i) => (v === null ? null : [px(i), py(v)])).filter(Boolean);
    if (points.length < 2) return '';
    return `
      <polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="3"></polyline>
      ${points.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${color}"></circle>`).join('')}
    `;
  }
  function labelsFor(values, color) {
    return values.map((v, i) => v === null ? '' :
      `<text x="${px(i)}" y="${(py(v) - 10).toFixed(1)}" font-size="10" fill="${color}" text-anchor="middle">${v.toFixed(2)} s</text>`
    ).join('');
  }

  svg.innerHTML = `
    ${drawAxes(svg, x0, x1, y0, y1, minValue, maxValue, 4)}
    <text x="${x0}" y="${y0 + 22}" font-size="11" fill="var(--text)" text-anchor="middle">${factor.low}${factor.unit}</text>
    <text x="${x1}" y="${y0 + 22}" font-size="11" fill="var(--text)" text-anchor="middle">${factor.high}${factor.unit}</text>
    ${lineFor(traceLow, '#7c2233')}
    ${lineFor(traceHigh, '#e0a63a')}
    ${labelsFor(traceLow, '#7c2233')}
    ${labelsFor(traceHigh, '#c17a00')}
    <text x="${x1 - 4}" y="20" font-size="10" fill="#7c2233" text-anchor="end">${factorLabel(CHART_TRACE)} ${LANG === 'th' ? 'ต่ำ' : 'low'}</text>
    <text x="${x1 - 4}" y="34" font-size="10" fill="#c17a00" text-anchor="end">${factorLabel(CHART_TRACE)} ${LANG === 'th' ? 'สูง' : 'high'}</text>
  `;
}

applyI18n();
renderFactorFields();
renderModeNote();
updateHeliPreview();
renderLog();
populateFactorSelects();
renderChart();