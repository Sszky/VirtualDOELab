/* ==================== I18N (Lang TH/EN) ==================== */

const I18N = {
  menu_project: { th: 'โปรเจค', en: 'Project' },
  menu_factors: { th: 'ปัจจัย', en: 'Factors' },
  menu_tools: { th: 'เครื่องมือ', en: 'Tools' },
  menu_help: { th: 'ช่วยเหลือ', en: 'Help' },
  menu_new_project: { th: 'โปรเจคใหม่', en: 'New Project' },
  menu_save: { th: 'บันทึก', en: 'Save' },
  menu_export: { th: 'ส่งออกไฟล์ CSV', en: 'Export as File CSV' },
  menu_theme: { th: 'ธีม', en: 'Theme' },
  menu_tutorial: { th: 'แนะนำการใช้งาน', en: 'Tutorial guide' },
  menu_runall: { th: 'รันครบ 2⁴ ครั้ง (16 รัน)', en: 'Run full 2⁴ (16 runs)' },
  menu_clear: { th: 'ล้างข้อมูล', en: 'Clear data' },
  menu_undo: { th: 'ย้อนกลับรันล่าสุด', en: 'Undo last run' },
  menu_fit: { th: 'รีเซ็ตซูม', en: 'Reset zoom' },
  menu_about: { th: 'เกี่ยวกับโมเดลจำลอง', en: 'About this model' },

  user_chip: { th: '👤 นักศึกษา', en: '👤 Student' },
  theme_modal_title: { th: 'เลือกธีม', en: 'Select Theme' },
  theme_dark_label: { th: 'Dark Theme', en: 'Dark Theme' },
  theme_light_label: { th: 'Light Theme', en: 'Light Theme' },
  theme_apply: { th: 'ใช้ธีมนี้', en: 'Apply Theme' },

  tab_experiment: { th: 'การทดลอง', en: 'Experiment' },

  panel_factors_title: { th: 'ปัจจัยการทดลอง', en: 'Experiment Factors' },
  search_placeholder: { th: 'ค้นหาปัจจัย...', en: 'Search factors...' },
  wing_title: { th: 'ปีก', en: 'Wing Dimensions' },
  body_title: { th: 'ลำตัว', en: 'Body Dimensions' },
  misc_title: { th: 'อื่น ๆ', en: 'Misc' },
  misc_note: {
    th: 'โมเดลจำลองนี้ใช้สมการประมาณค่าเชิงเส้นจากปัจจัย WL, WW, BL, BW เพื่อสาธิตหลักการออกแบบการทดลองแบบ 2⁴ full-factorial ไม่ใช่ข้อมูลจากการทดลองจริง',
    en: 'This simulation uses a linear approximation from factors WL, WW, BL, BW to demonstrate 2⁴ full-factorial DOE principles — it is not real experimental data.'
  },
  th_factor: { th: 'ปัจจัย', en: 'Factor' },
  th_low: { th: 'ต่ำ', en: 'Low' },
  th_high: { th: 'สูง', en: 'High' },

  chip_stage: { th: 'พื้นที่จำลอง', en: 'Simulation Area' },

  tt_drag: { th: 'ลาก', en: 'Drag' },
  tt_reset: { th: 'รีเซ็ตตำแหน่ง', en: 'Reset position' },
  tt_export: { th: 'ส่งออก CSV', en: 'Export CSV' },
  tt_clear: { th: 'ล้างข้อมูล', en: 'Clear data' },
  tt_overview: { th: 'ภาพรวม', en: 'Overview' },
  tt_fit: { th: 'พอดีหน้าจอ', en: 'Fit' },
  tt_undo: { th: 'ย้อนกลับ', en: 'Undo' },
  tt_run: { th: 'เริ่มทดลอง', en: 'Run experiment' },

  readout_time: { th: 'เวลาในการตก', en: 'Fall Time' },
  readout_height: { th: 'ความสูงที่ปล่อย', en: 'Drop Height' },

  panel_props_title: { th: 'คุณสมบัติ', en: 'Properties' },
  section_props: { th: 'คุณสมบัติการทดลอง', en: 'Experiment Properties' },
  label_projname: { th: 'ชื่อโปรเจค:', en: 'Project Name:' },
  label_design: { th: 'รูปแบบการทดลอง:', en: 'Design Type:' },
  label_height: { th: 'ความสูงที่ปล่อย (ซม.):', en: 'Drop Height (cm):' },
  toggle_sto: { th: 'โหมดสุ่ม (Stochastic):', en: 'Stochastic Mode:' },
  toggle_grid: { th: 'แสดงกริด (Grid):', en: 'Show Grid:' },

  mode_status_label: { th: 'โหมด', en: 'Mode' },

  btn_run: { th: 'เริ่มทดลอง', en: 'Run Experiment' },
  btn_runall: { th: 'รันครบ 2⁴ ครั้ง (16 รัน)', en: 'Run full 2⁴ (16 runs)' },
  btn_clear: { th: 'ล้างข้อมูล', en: 'Clear Data' },

  card_log_title: { th: 'ตารางบันทึกผลการทดลอง', en: 'Experiment Log' },
  th_flighttime: { th: 'เวลา (s)', en: 'Time (s)' },
  card_main_effects_title: { th: 'กราฟผลกระทบหลัก', en: 'Main Effects Plot' },
  main_effects_note: {
    th: 'ค่าเฉลี่ยผลลัพธ์ฝั่งต่ำเทียบกับฝั่งสูงของแต่ละปัจจัย',
    en: 'Average result at the low vs. high side of each factor.'
  },
  card_interaction_title: { th: 'กราฟอันตรกิริยา (WL × WW)', en: 'Interaction Plot (WL × WW)' },
  legend_low: { th: 'WW = ต่ำ', en: 'WW = Low' },
  legend_high: { th: 'WW = สูง', en: 'WW = High' },

  factorA: { th: 'ความยาวปีก (WL)', en: 'Wing Length (WL)' },
  factorB: { th: 'ความกว้างปีก (WW)', en: 'Wing Width (WW)' },
  factorC: { th: 'ความยาวลำตัว (BL)', en: 'Body Length (BL)' },
  factorD: { th: 'ความกว้างลำตัว (BW)', en: 'Body Width (BW)' },

  badge_low: { th: 'ต่ำ (-)', en: 'Low (-)' },
  badge_high: { th: 'สูง (+)', en: 'High (+)' },
  badge_mid: { th: 'กลาง', en: 'Mid' },

  msg_simulating: {
    th: 'กำลังจำลอง... ปล่อยจากความสูง',
    en: 'Simulating... dropped from height'
  },
  msg_flighttime: { th: 'เวลาบิน:', en: 'Flight time:' },
  msg_runall_done: { th: 'รันครบ 16 การทดลองแล้ว', en: 'All 16 runs complete' },
  msg_about: {
    th: 'โมเดลจำลองสาธิตหลักการ DOE 2⁴ full-factorial (ไม่ใช่ข้อมูลจากการทดลองจริง)',
    en: 'This model demonstrates 2⁴ full-factorial DOE principles (not real experimental data).'
  },
  msg_export_none: { th: 'ไม่มีข้อมูลให้ส่งออก', en: 'No data to export' },
  msg_export_done: { th: 'ดาวน์โหลดไฟล์แล้ว', en: 'File downloaded' },
  chart_no_data: { th: 'ยังไม่มีข้อมูลเพียงพอ', en: 'Not enough data yet' },

  confirm_new_project: {
    th: 'สร้างโปรเจคใหม่? ข้อมูลที่ยังไม่ได้บันทึกจะหายไป',
    en: 'Start a new project? Unsaved data will be lost.'
  },
  msg_new_project: { th: 'สร้างโปรเจคใหม่แล้ว', en: 'New project created' },
  msg_saved: { th: 'บันทึกโปรเจคแล้ว', en: 'Project saved' },
  msg_save_failed: {
    th: 'บันทึกไม่สำเร็จ (เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล)',
    en: 'Could not save (browser storage is unavailable)'
  },

  tut_skip: { th: 'ข้าม', en: 'Skip' },
  tut_prev: { th: 'ย้อนกลับ', en: 'Back' },
  tut_next: { th: 'ถัดไป', en: 'Next' },
  tut_finish: { th: 'เสร็จสิ้น', en: 'Finish' },

  tut1_title: { th: 'ยินดีต้อนรับสู่ Paper Helicopter DOE Lab', en: 'Welcome to Paper Helicopter DOE Lab' },
  tut1_text: {
    th: 'จำลองการทดลองเฮลิคอปเตอร์กระดาษเพื่อฝึกออกแบบการทดลอง (DOE) ทัวร์สั้น ๆ นี้จะพาไปรู้จักส่วนสำคัญของหน้าจอ',
    en: 'Simulate paper helicopter experiments to practice Design of Experiments (DOE). This short tour introduces the main parts of the screen.'
  },
  tut2_title: { th: 'ปัจจัยการทดลอง', en: 'Experiment factors' },
  tut2_text: {
    th: 'เลื่อนแถบ WL, WW, BL, BW เพื่อกำหนดขนาดปีกและลำตัว ระดับต่ำ (−) หรือสูง (+) เฮลิคอปเตอร์ในพื้นที่จำลองจะเปลี่ยนตามทันที',
    en: 'Move the WL, WW, BL, BW sliders to set wing and body sizes at the low (−) or high (+) level. The helicopter in the simulation area updates right away.'
  },
  tut3_title: { th: 'พื้นที่จำลอง', en: 'Simulation area' },
  tut3_text: {
    th: 'เฮลิคอปเตอร์จะถูกปล่อยจากความสูงที่กำหนดและหมุนตกลงมา เวลาที่ตกแสดงที่มุมขวาบน ใช้ลูกกลิ้งเมาส์เพื่อซูมได้',
    en: 'The helicopter is dropped from the chosen height and spins down. The fall time appears at the top right. Use the mouse wheel to zoom.'
  },
  tut4_title: { th: 'แถบเครื่องมือ', en: 'Toolbar' },
  tut4_text: {
    th: 'รีเซ็ตตำแหน่ง ส่งออก CSV ล้างข้อมูล ย้อนกลับรันล่าสุด ปรับซูม และปุ่ม ▶ สำหรับเริ่มทดลอง',
    en: 'Reset position, export CSV, clear data, undo the last run, adjust zoom, and press ▶ to run an experiment.'
  },
  tut5_title: { th: 'คุณสมบัติการทดลอง', en: 'Experiment properties' },
  tut5_text: {
    th: 'ตั้งความสูงที่ปล่อย เปิดโหมดสุ่ม (Stochastic) เพื่อใส่ความแปรปรวนแบบการทดลองจริง แล้วกด "เริ่มทดลอง" หรือ "รันครบ 2⁴ (16 รัน)"',
    en: 'Set the drop height and turn on Stochastic mode to add real-experiment noise. Then press "Run Experiment" or "Run full 2⁴ (16 runs)".'
  },
  tut6_title: { th: 'เมนูโปรเจค', en: 'Project menu' },
  tut6_text: {
    th: 'สร้างโปรเจคใหม่ บันทึกงานไว้ในเบราว์เซอร์ (Ctrl+S) หรือส่งออกเป็นไฟล์ CSV เพื่อวิเคราะห์ต่อในโปรแกรมสถิติ',
    en: 'Start a new project, save your work in the browser (Ctrl+S), or export a CSV file to analyze in statistical software.'
  },
  tut7_title: { th: 'เมนูปัจจัย', en: 'Factors menu' },
  tut7_text: {
    th: 'รันครบ 16 รัน ล้างข้อมูล และเปลี่ยนธีมสว่าง/มืดได้จากเมนูนี้',
    en: 'Run all 16 runs, clear data, and switch between light and dark themes from this menu.'
  },
  tut8_title: { th: 'ตารางผลและกราฟ', en: 'Results and plots' },
  tut8_text: {
    th: 'ทุกรันถูกบันทึกในตาราง พร้อมกราฟผลกระทบหลักและกราฟอันตรกิริยา WL × WW ที่อัปเดตอัตโนมัติ',
    en: 'Every run is logged in the table, with main effects and WL × WW interaction plots that update automatically.'
  }
};

let LANG = 'th';

function t(key) {
  return (I18N[key] && I18N[key][LANG]) || key;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    element.title = t(element.dataset.i18nTitle);
  });
}

function setLanguage(language) {
  LANG = language;
  document.documentElement.lang = language;

  document.getElementById('btnTh').classList.toggle('active', language === 'th');
  document.getElementById('btnEn').classList.toggle('active', language === 'en');

  applyI18n();

  document.querySelectorAll('.slider-field').forEach(element => {
    const factor = FACTORS.find(item => item.key === element.dataset.key);
    if (factor) {
      element.querySelector('.factor-label').textContent = t(factor.i18nKey);
    }
  });

  FACTORS.forEach(factor => updateSliderReadout(factor.key));
  updateGridStatus();
  renderCharts();

  if (tutorialActive) {
    showTutorialStep(tutorialIndex);
  }
}

document.getElementById('btnTh').onclick = () => setLanguage('th');
document.getElementById('btnEn').onclick = () => setLanguage('en');

/* ============================================================
   2) FACTORS
   ============================================================ */
 
const FACTORS = [
  { key: 'WL', i18nKey: 'factorA', unit: 'cm', low: 8, high: 12 },
  { key: 'WW', i18nKey: 'factorB', unit: 'cm', low: 3, high: 5 },
  { key: 'BL', i18nKey: 'factorC', unit: 'cm', low: 5, high: 8 },
  { key: 'BW', i18nKey: 'factorD', unit: 'cm', low: 2, high: 3 }
];
 
let DROP_HEIGHT_CM = 200;
 
const DEFAULT_VAL = {
  WL: 10,
  WW: 4,
  BL: 6.5,
  BW: 2.5
};
 
let VAL = { ...DEFAULT_VAL };
 
function coded(key) {
  const factor = FACTORS.find(item => item.key === key);
  return -1 + 2 * (VAL[key] - factor.low) / (factor.high - factor.low);
}
 
function levelBadge(codedValue) {
  if (codedValue <= -0.85) {
    return { cls: 'low', key: 'badge_low' };
  }
 
  if (codedValue >= 0.85) {
    return { cls: 'high', key: 'badge_high' };
  }
 
  return { cls: '', key: 'badge_mid' };
}
 
document.getElementById('factorTable').innerHTML = FACTORS.map(factor =>
  `<tr>
    <td><b>${factor.key}</b></td>
    <td>${factor.low}</td>
    <td>${factor.high}</td>
  </tr>`
).join('');
 
function buildSlider(factor) {
  const step = ((factor.high - factor.low) / 40).toFixed(2);
 
  return `
    <div class="slider-field" data-key="${factor.key}">
      <div class="field-head">
        <span class="factor-label">${t(factor.i18nKey)}</span>
        <span class="val" id="val${factor.key}">
          ${VAL[factor.key].toFixed(1)} ${factor.unit}
        </span>
      </div>
 
      <input
        type="range"
        id="sl${factor.key}"
        min="${factor.low}"
        max="${factor.high}"
        step="${step}"
        value="${VAL[factor.key]}"
      >
 
      <div class="range-labels">
        <span>${factor.low}${factor.unit}</span>
        <span>${factor.high}${factor.unit}</span>
      </div>
 
      <span class="level-badge" id="badge${factor.key}"></span>
    </div>
  `;
}
 
document.getElementById('wingSliders').innerHTML =
  buildSlider(FACTORS[0]) + buildSlider(FACTORS[1]);
 
document.getElementById('bodySliders').innerHTML =
  buildSlider(FACTORS[2]) + buildSlider(FACTORS[3]);
 
FACTORS.forEach(factor => {
  document.getElementById('sl' + factor.key).addEventListener('input', event => {
    VAL[factor.key] = parseFloat(event.target.value);
    updateSliderReadout(factor.key);
    updateHelicopterPreview();
  });
});
 
function updateSliderReadout(key) {
  const factor = FACTORS.find(item => item.key === key);
  const valueElement = document.getElementById('val' + key);
  const badgeElement = document.getElementById('badge' + key);
 
  valueElement.textContent = `${VAL[key].toFixed(1)} ${factor.unit}`;
 
  const badge = levelBadge(coded(key));
  badgeElement.textContent = t(badge.key);
  badgeElement.className = `level-badge ${badge.cls}`;
}
 
FACTORS.forEach(factor => updateSliderReadout(factor.key));
 
/* ============================================================
   3) FACTOR SEARCH
   ============================================================ */
 
document.getElementById('factorSearch').addEventListener('input', event => {
  const query = event.target.value.trim().toLowerCase();
 
  document.querySelectorAll('.slider-field').forEach(element => {
    const factor = FACTORS.find(item => item.key === element.dataset.key);
 
    const searchText = (
      I18N[factor.i18nKey].th + ' ' +
      I18N[factor.i18nKey].en
    ).toLowerCase();
 
    element.style.display = searchText.includes(query) ? '' : 'none';
  });
});
 
/* ============================================================
   4) HELICOPTER PREVIEW
   ============================================================ */
 
function updateHelicopterPreview() {
  const helicopter = document.getElementById('heliWrap');
 
  const wingLength = Math.round(24 + VAL.WL * 5.2);
  const wingWidth = Math.round(10 + VAL.WW * 4.4);
  const bodyHeight = Math.round(18 + VAL.BL * 4.6);
  const bodyWidth = Math.round(6 + VAL.BW * 3.2);
 
  helicopter.style.setProperty('--wingL', `${wingLength}px`);
  helicopter.style.setProperty('--wingW', `${wingWidth}px`);
  helicopter.style.setProperty('--bodyH', `${bodyHeight}px`);
  helicopter.style.setProperty('--bodyW', `${bodyWidth}px`);
}
 
updateHelicopterPreview();
 
/* ============================================================
   5) PROJECT TITLE
   ============================================================ */
 
document.getElementById('projNameInput').addEventListener('input', event => {
  document.getElementById('projectTitle').textContent =
    event.target.value.trim() || 'Untitled';
});
 
/* ============================================================
   6) DROP HEIGHT
   ============================================================ */
 
function refreshHeightDisplay() {
  document.getElementById('heightInput').value = DROP_HEIGHT_CM;
  document.getElementById('heightReadout').textContent =
    (DROP_HEIGHT_CM / 100).toFixed(2);
}
 
document.getElementById('heightMinus').onclick = () => {
  DROP_HEIGHT_CM = Math.max(100, DROP_HEIGHT_CM - 10);
  refreshHeightDisplay();
};
 
document.getElementById('heightPlus').onclick = () => {
  DROP_HEIGHT_CM = Math.min(400, DROP_HEIGHT_CM + 10);
  refreshHeightDisplay();
};
 
refreshHeightDisplay();
 
/* ==================== SIMULATION MODES ==================== */
 
function currentMode() {
  return document.getElementById('stoToggle').checked ? 'sto' : 'det';
}
 
/* ==================== GRID DISPLAY ==================== */
 
function isGridEnabled() {
  return document.getElementById('gridToggle').checked;
}
 
function updateGridDisplay() {
  const canvasArea = document.getElementById('simulatorCanvasArea');
  canvasArea.classList.toggle('grid-off', !isGridEnabled());
  updateGridStatus();
}
 
function updateGridStatus() {
  const statusElement = document.getElementById('gridStatus');
  statusElement.textContent = isGridEnabled() ? 'ON' : 'OFF';
}
 
document.getElementById('gridToggle').addEventListener('change', updateGridDisplay);
 
/* ==================== PHYSICS-ISH RESPONSE MODEL ==================== */
 
function flightTime(a, b, c, d, mode) {
  let time =
    3.0 +
    0.5 * a +
    0.3 * b -
    0.20 * c -
    0.15 * d +
    0.10 * a * b;
 
  time *= DROP_HEIGHT_CM / 200;
 
  if (mode === 'sto') {
    time += (Math.random() - 0.5) * 0.3;
  }
 
  time = Math.max(0.6, time);
 
  return Math.round(time * 100) / 100;
}
 
/* ==================== EXPERIMENT LOG ==================== */
 
let LOG = [];
 
function addRun(wlCm, wwCm, blCm, bwCm, time) {
  LOG.push({
    run: LOG.length + 1,
    WL: wlCm,
    WW: wwCm,
    BL: blCm,
    BW: bwCm,
    t: time
  });
 
  renderLog();
  renderCharts();
}
 
function removeLastRun() {
  if (!LOG.length) {
    return;
  }
 
  LOG.pop();
 
  LOG.forEach((row, index) => {
    row.run = index + 1;
  });
 
  renderLog();
  renderCharts();
}
 
function renderLog() {
  document.getElementById('logBody').innerHTML = LOG.map(row =>
    `<tr>
      <td>${row.run}</td>
      <td>${row.WL.toFixed(1)}</td>
      <td>${row.WW.toFixed(1)}</td>
      <td>${row.BL.toFixed(1)}</td>
      <td>${row.BW.toFixed(1)}</td>
      <td>${row.t.toFixed(2)}</td>
    </tr>`
  ).join('');
}
 
/* ==================== DROP ANIMATION ==================== */
 
function animateDrop(time, callback) {
  const helicopter = document.getElementById('heliWrap');
  const stage = document.getElementById('stage');
 
  const maxY = Math.max(30, stage.clientHeight - 46);
 
  helicopter.style.transition = 'none';
  helicopter.style.top = '8px';
  helicopter.style.transform = 'translate(-50%, 0) rotate(0deg)';
 
  requestAnimationFrame(() => {
    helicopter.style.transition =
      `top ${time}s linear, transform ${time}s linear`;
 
    helicopter.style.top = `${maxY}px`;
    helicopter.style.transform =
      'translate(-50%, 0) rotate(2520deg)';
  });
 
  setTimeout(callback, time * 1000);
}
 
function runOne() {
  const a = coded('WL');
  const b = coded('WW');
  const c = coded('BL');
  const d = coded('BW');
 
  const mode = currentMode();
  const flightT = flightTime(a, b, c, d, mode);
  const heightM = (DROP_HEIGHT_CM / 100).toFixed(2);
 
  document.getElementById('result').textContent =
    `${t('msg_simulating')} ${heightM} m`;
 
  document.getElementById('timeVal').textContent = '…';
 
  animateDrop(Math.min(flightT, 4), () => {
    document.getElementById('timeVal').textContent = flightT.toFixed(2);
 
    document.getElementById('result').innerHTML =
      `${t('msg_flighttime')} <b>${flightT.toFixed(2)} s</b>`;
 
    addRun(VAL.WL, VAL.WW, VAL.BL, VAL.BW, flightT);
  });
}
 
function runAll() {
  const mode = currentMode();
  const combinations = [];
 
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      for (const c of [-1, 1]) {
        for (const d of [-1, 1]) {
          combinations.push([a, b, c, d]);
        }
      }
    }
  }
 
  function cmOf(factor, codedValue) {
    return codedValue > 0 ? factor.high : factor.low;
  }
 
  combinations.forEach(([a, b, c, d]) => {
    const time = flightTime(a, b, c, d, mode);
 
    addRun(
      cmOf(FACTORS[0], a),
      cmOf(FACTORS[1], b),
      cmOf(FACTORS[2], c),
      cmOf(FACTORS[3], d),
      time
    );
  });
 
  document.getElementById('result').textContent = t('msg_runall_done');
}
 
function clearLog() {
  LOG = [];
  renderLog();
  renderCharts();
 
  document.getElementById('result').textContent = '';
  document.getElementById('timeVal').textContent = '—';
 
  resetHelicopterPosition();
}
 
/* ==================== CSV EXPORT ==================== */
 
function exportCSV() {
  const messageElement = document.getElementById('exportMsg');
 
  if (!LOG.length) {
    messageElement.textContent = t('msg_export_none');
    showToast(t('msg_export_none'));
    return;
  }
 
  let csv = 'Run,WL_cm,WW_cm,BL_cm,BW_cm,FlightTime_s\n';
 
  LOG.forEach(row => {
    csv +=
      `${row.run},${row.WL.toFixed(1)},${row.WW.toFixed(1)},` +
      `${row.BL.toFixed(1)},${row.BW.toFixed(1)},${row.t.toFixed(2)}\n`;
  });
 
  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  });
 
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
 
  downloadLink.href = url;
  downloadLink.download = 'paper_helicopter_doe_log.csv';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
 
  URL.revokeObjectURL(url);
 
  messageElement.textContent = t('msg_export_done');
  showToast(t('msg_export_done'));
}
 
/* ==================== HELICOPTER RESET ==================== */
 
function resetHelicopterPosition() {
  const helicopter = document.getElementById('heliWrap');
 
  helicopter.style.transition = 'none';
  helicopter.style.top = '8px';
  helicopter.style.transform = 'translate(-50%, 0) rotate(0deg)';
}
 
/* ==================== TOOLBAR + MAIN BUTTON EVENTS ==================== */
 
document.getElementById('runBtn').onclick = runOne;
document.getElementById('runAllBtn').onclick = runAll;
document.getElementById('clearBtn').onclick = clearLog;
 
document.getElementById('tbRun').onclick = runOne;
document.getElementById('tbExport').onclick = exportCSV;
document.getElementById('tbClear').onclick = clearLog;
document.getElementById('tbUndo').onclick = removeLastRun;
 
document.getElementById('tbReset').onclick = () => {
  resetHelicopterPosition();
};
 
document.getElementById('tbFit').onclick = () => {
  setZoom(100);
};
 
document.getElementById('tbOverview').onclick = () => {
  resetHelicopterPosition();
  setZoom(100);
};
 
document.getElementById('menuExport').onclick = exportCSV;
document.getElementById('menuRunAll').onclick = runAll;
document.getElementById('menuClear').onclick = clearLog;
document.getElementById('menuUndo').onclick = removeLastRun;
 
document.getElementById('menuFit').onclick = () => {
  setZoom(100);
};
 
document.getElementById('menuAbout').onclick = () => {
  document.getElementById('result').textContent = t('msg_about');
};
 
/* ==================== ZOOM ==================== */
 
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
 
let zoomLevel = 100;
 
function updateZoomLabel() {
  document.getElementById('zoomValue').textContent = `${zoomLevel}%`;
}
 
function setZoom(value) {
  zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));
 
  document.getElementById('zoomSlider').value = zoomLevel;
  document.getElementById('simulatorStageFrame').style.transform =
    `scale(${zoomLevel / 100})`;
 
  updateZoomLabel();
}
 
function applyZoom() {
  setZoom(Number(document.getElementById('zoomSlider').value));
}
 
document.getElementById('zoomSlider').addEventListener('input', applyZoom);
 
document.getElementById('zoomMinus').onclick = () => {
  setZoom(zoomLevel - 10);
};
 
document.getElementById('zoomPlus').onclick = () => {
  setZoom(zoomLevel + 10);
};
 
document.getElementById('simulatorCanvasArea').addEventListener(
  'wheel',
  event => {
    event.preventDefault();
 
    const speed = event.ctrlKey ? 0.6 : 0.18;
    setZoom(zoomLevel - event.deltaY * speed);
  },
  { passive: false }
);
 
setZoom(100);
 
/* ==================== NAVBAR DROPDOWN ==================== */
 
const menuItems = Array.from(document.querySelectorAll('.nav-item'));
const menuOverlay = document.getElementById('menuOverlay');
 
function closeAllMenus() {
  menuItems.forEach(item => {
    item.classList.remove('open');
 
    const button = item.querySelector('.nav-button');
    if (button) {
      button.setAttribute('aria-expanded', 'false');
    }
  });
 
  menuOverlay.classList.remove('show');
}
 
menuItems.forEach(item => {
  const menuButton = item.querySelector('.nav-button');
 
  menuButton.addEventListener('click', event => {
    event.stopPropagation();
 
    const isOpen = item.classList.contains('open');
 
    closeAllMenus();
 
    if (!isOpen) {
      item.classList.add('open');
      menuButton.setAttribute('aria-expanded', 'true');
      menuOverlay.classList.add('show');
    }
  });
 
  item.querySelectorAll('.dropdown-item').forEach(dropdownItem => {
    dropdownItem.addEventListener('click', () => {
      closeAllMenus();
    });
  });
});
 
menuOverlay.addEventListener('click', closeAllMenus);
 
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-item')) {
    closeAllMenus();
  }
});
 
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeAllMenus();
  }
});
 
/* ==================== THEME SELECTOR ==================== */
 
const themeButton = document.getElementById('menuTheme');
const themeOverlay = document.getElementById('themeModalOverlay');
const themeCloseButton = document.getElementById('themeModalClose');
const themeApplyButton = document.getElementById('themeApplyBtn');
 
const darkThemeCard = document.getElementById('cardDark');
const lightThemeCard = document.getElementById('cardLight');
 
const darkThemeRadio = document.getElementById('radioDark');
const lightThemeRadio = document.getElementById('radioLight');
 
function setActiveThemeCard(theme) {
  darkThemeCard.classList.toggle('selected', theme === 'dark');
  lightThemeCard.classList.toggle('selected', theme === 'light');
 
  darkThemeRadio.checked = theme === 'dark';
  lightThemeRadio.checked = theme === 'light';
}
 
function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  localStorage.setItem('helicopterDoeTheme', theme);
 
  setActiveThemeCard(theme);
}
 
themeButton.onclick = () => {
  themeOverlay.classList.add('show');
};
 
themeCloseButton.onclick = () => {
  themeOverlay.classList.remove('show');
};
 
themeOverlay.addEventListener('click', event => {
  if (event.target === themeOverlay) {
    themeOverlay.classList.remove('show');
  }
});
 
darkThemeCard.onclick = () => setActiveThemeCard('dark');
lightThemeCard.onclick = () => setActiveThemeCard('light');
 
themeApplyButton.onclick = () => {
  const selectedTheme = lightThemeRadio.checked ? 'light' : 'dark';
 
  applyTheme(selectedTheme);
  themeOverlay.classList.remove('show');
};
 
applyTheme(localStorage.getItem('helicopterDoeTheme') || 'light');
 
/* ==================== CHARTS ==================== */
 
function codedOfRow(row, key) {
  const factor = FACTORS.find(item => item.key === key);
  return -1 + 2 * (row[key] - factor.low) / (factor.high - factor.low);
}
 
function avgWhere(predicate) {
  const rows = LOG.filter(predicate);
 
  if (!rows.length) {
    return null;
  }
 
  return rows.reduce((sum, row) => sum + row.t, 0) / rows.length;
}
 
function renderCharts() {
  renderMainEffects();
  renderInteraction();
}
 
function renderMainEffects() {
  const svg = document.getElementById('mainEffectsChart');
  const keys = ['WL', 'WW', 'BL', 'BW'];
 
  const effects = keys.map(key => {
    const lowAverage = avgWhere(row => codedOfRow(row, key) < 0);
    const highAverage = avgWhere(row => codedOfRow(row, key) > 0);
 
    if (lowAverage === null || highAverage === null) {
      return null;
    }
 
    return highAverage - lowAverage;
  });
 
  const maxEffect = Math.max(
    0.5,
    ...effects.map(effect => Math.abs(effect || 0))
  );
 
  const height = 180;
  const middleY = 90;
  const barWidth = 50;
 
  let bars = '';
 
  keys.forEach((key, index) => {
    const effect = effects[index];
    const x = 40 + index * 80;
 
    if (effect === null) {
      bars += `
        <text
          x="${x + barWidth / 2}"
          y="${middleY}"
          font-size="10"
          fill="var(--muted)"
          text-anchor="middle"
        >n/a</text>
      `;
    } else {
      const barHeight =
        (Math.abs(effect) / maxEffect) * 70;
 
      const y = effect >= 0
        ? middleY - barHeight
        : middleY;
 
      const color = effect >= 0
        ? '#3f8efc'
        : '#f5a524';
 
      bars += `
        <rect
          x="${x}"
          y="${y}"
          width="${barWidth}"
          height="${barHeight}"
          fill="${color}"
          rx="3"
        ></rect>
 
        <text
          x="${x + barWidth / 2}"
          y="${effect >= 0 ? y - 4 : y + barHeight + 12}"
          font-size="10"
          fill="var(--text)"
          text-anchor="middle"
        >${effect.toFixed(2)}</text>
      `;
    }
 
    bars += `
      <text
        x="${x + barWidth / 2}"
        y="${height - 6}"
        font-size="11"
        fill="var(--text)"
        text-anchor="middle"
      >${key}</text>
    `;
  });
 
  svg.innerHTML =
    `<line
      x1="20"
      y1="${middleY}"
      x2="380"
      y2="${middleY}"
      stroke="var(--border)"
    ></line>${bars}`;
}
 
function renderInteraction() {
  const svg = document.getElementById('interactionChart');
 
  const aLevels = [-1, 1];
 
  const seriesLow = aLevels.map(a =>
    avgWhere(row =>
      Math.sign(codedOfRow(row, 'WL')) === a &&
      codedOfRow(row, 'WW') < 0
    )
  );
 
  const seriesHigh = aLevels.map(a =>
    avgWhere(row =>
      Math.sign(codedOfRow(row, 'WL')) === a &&
      codedOfRow(row, 'WW') > 0
    )
  );
 
  const allValues = [...seriesLow, ...seriesHigh]
    .filter(value => value !== null);
 
  if (!allValues.length) {
    svg.innerHTML = `
      <text
        x="200"
        y="90"
        font-size="12"
        fill="var(--muted)"
        text-anchor="middle"
      >${t('chart_no_data')}</text>
    `;
    return;
  }
 
  const minValue = Math.min(...allValues) - 0.2;
  const maxValue = Math.max(...allValues) + 0.2;
 
  const x0 = 60;
  const x1 = 340;
  const y0 = 150;
  const y1 = 20;
 
  function px(index) {
    return index === 0 ? x0 : x1;
  }
 
  function py(value) {
    return y0 -
      (value - minValue) /
      (maxValue - minValue) *
      (y0 - y1);
  }
 
  function pathFor(values, color) {
    const points = values
      .map((value, index) =>
        value === null
          ? null
          : [px(index), py(value)]
      )
      .filter(Boolean);
 
    if (points.length < 2) {
      return '';
    }
 
    return `
      <polyline
        points="${points.map(point => point.join(',')).join(' ')}"
        fill="none"
        stroke="${color}"
        stroke-width="2.5"
      ></polyline>
      ${points.map(point =>
        `<circle
          cx="${point[0]}"
          cy="${point[1]}"
          r="4"
          fill="${color}"
        ></circle>`
      ).join('')}
    `;
  }
 
  svg.innerHTML =
    `
      <line
        x1="${x0}"
        y1="${y0}"
        x2="${x1}"
        y2="${y0}"
        stroke="var(--border)"
      ></line>
 
      <line
        x1="${x0}"
        y1="${y0}"
        x2="${x0}"
        y2="${y1}"
        stroke="var(--border)"
      ></line>
 
      <text
        x="${x0}"
        y="${y0 + 18}"
        font-size="11"
        fill="var(--text)"
        text-anchor="middle"
      >WL -</text>
 
      <text
        x="${x1}"
        y="${y0 + 18}"
        font-size="11"
        fill="var(--text)"
        text-anchor="middle"
      >WL +</text>
    ` +
    pathFor(seriesLow, '#3f8efc') +
    pathFor(seriesHigh, '#f5a524');
}
 
/* ==================== TOAST ==================== */
 
let toastTimer = null;
 
function showToast(message) {
  const toast = document.getElementById('toast');
 
  toast.textContent = message;
  toast.classList.add('show');
 
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
 
/* ==================== Features: NEW / SAVE / LOAD ==================== */
 
const PROJECT_STORAGE_KEY = 'helicopterDoeProject';
const DEFAULT_PROJECT_NAME = 'Paper Helicopter DOE Lab';
 
function collectProjectState() {
  return {
    name: document.getElementById('projNameInput').value,
    VAL: { ...VAL },
    height: DROP_HEIGHT_CM,
    stochastic: document.getElementById('stoToggle').checked,
    grid: document.getElementById('gridToggle').checked,
    log: LOG
  };
}
 
function applyProjectState(state) {
  const name = (state.name || DEFAULT_PROJECT_NAME);
 
  VAL = { ...DEFAULT_VAL };
  FACTORS.forEach(factor => {
    const value = state.VAL && Number(state.VAL[factor.key]);
    if (Number.isFinite(value)) {
      VAL[factor.key] = Math.min(factor.high, Math.max(factor.low, value));
    }
  });
 
  DROP_HEIGHT_CM = Number.isFinite(state.height)
    ? Math.min(400, Math.max(100, state.height))
    : 200;
 
  document.getElementById('stoToggle').checked = !!state.stochastic;
  document.getElementById('gridToggle').checked = state.grid !== false;
 
  document.getElementById('projNameInput').value = name;
  document.getElementById('projectTitle').textContent = name.trim() || 'Untitled';
 
  LOG = (Array.isArray(state.log) ? state.log : [])
    .filter(row => row && ['WL', 'WW', 'BL', 'BW', 't'].every(key => Number.isFinite(row[key])))
    .map((row, index) => ({ ...row, run: index + 1 }));
 
  FACTORS.forEach(factor => {
    document.getElementById('sl' + factor.key).value = VAL[factor.key];
    updateSliderReadout(factor.key);
  });
 
  updateHelicopterPreview();
  refreshHeightDisplay();
  updateGridDisplay();
  renderLog();
  renderCharts();
  setZoom(100);
  resetHelicopterPosition();
 
  document.getElementById('timeVal').textContent = '—';
  document.getElementById('result').textContent = '';
  document.getElementById('exportMsg').textContent = '';
}
 
function newProject() {
  if (LOG.length && !window.confirm(t('confirm_new_project'))) {
    return;
  }
 
  applyProjectState({});
  showToast(t('msg_new_project'));
}
 
function saveProject() {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(collectProjectState()));
    showToast(t('msg_saved'));
  } catch (error) {
    showToast(t('msg_save_failed'));
  }
}
 
function loadSavedProject() {
  try {
    const saved = localStorage.getItem(PROJECT_STORAGE_KEY);
 
    if (saved) {
      applyProjectState(JSON.parse(saved));
    }
  } catch (error) {
    // Ignore corrupted or unavailable storage and start with a fresh project.
  }
}
 
document.getElementById('menuNewProject').onclick = newProject;
document.getElementById('menuSave').onclick = saveProject;
 
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    saveProject();
  }
});
 
/* ==================== TUTORIAL GUIDE ==================== */
 
const TUTORIAL_STEPS = [
  { title: 'tut1_title', text: 'tut1_text', target: null },
  { title: 'tut2_title', text: 'tut2_text', target: '#factorPanel' },
  { title: 'tut3_title', text: 'tut3_text', target: '#simulatorStageFrame' },
  { title: 'tut4_title', text: 'tut4_text', target: '#simulatorToolbar' },
  { title: 'tut5_title', text: 'tut5_text', target: '#propertiesPanel' },
  { title: 'tut6_title', text: 'tut6_text', target: '#projectMenu' },
  { title: 'tut7_title', text: 'tut7_text', target: '#factorMenu' },
  { title: 'tut8_title', text: 'tut8_text', target: '.result-card', scroll: 'start' }
];
 
const tutorialLayer = document.getElementById('tutorialLayer');
const tutorialSpotlight = document.getElementById('tutorialSpotlight');
const tutorialPopover = document.getElementById('tutorialPopover');
const tutorialPrev = document.getElementById('tutorialPrev');
const tutorialNext = document.getElementById('tutorialNext');
 
let tutorialActive = false;
let tutorialIndex = 0;
 
function startTutorial() {
  tutorialActive = true;
  tutorialLayer.classList.add('show');
  tutorialLayer.setAttribute('aria-hidden', 'false');
  showTutorialStep(0);
  tutorialNext.focus();
}
 
function endTutorial() {
  tutorialActive = false;
  tutorialLayer.classList.remove('show');
  tutorialLayer.setAttribute('aria-hidden', 'true');
}
 
function showTutorialStep(index) {
  const step = TUTORIAL_STEPS[index];
  const isLast = index === TUTORIAL_STEPS.length - 1;
 
  tutorialIndex = index;
 
  document.getElementById('tutorialCount').textContent =
    `${index + 1} / ${TUTORIAL_STEPS.length}`;
  document.getElementById('tutorialTitle').textContent = t(step.title);
  document.getElementById('tutorialText').textContent = t(step.text);
 
  tutorialPrev.disabled = index === 0;
  tutorialNext.textContent = t(isLast ? 'tut_finish' : 'tut_next');
 
  const target = step.target ? document.querySelector(step.target) : null;
 
  if (target) {
    target.scrollIntoView({ block: step.scroll || 'nearest', behavior: 'smooth' });
  }
 
  positionTutorial();
}
 
function positionTutorial() {
  if (!tutorialActive) {
    return;
  }
 
  const step = TUTORIAL_STEPS[tutorialIndex];
  const target = step.target ? document.querySelector(step.target) : null;
 
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 12;
  const margin = 8;
 
  tutorialLayer.classList.toggle('no-target', !target);
 
  const popW = tutorialPopover.offsetWidth;
  const popH = tutorialPopover.offsetHeight;
 
  let x = (vw - popW) / 2;
  let y = (vh - popH) / 2;
 
  if (target) {
    const rect = target.getBoundingClientRect();
    const pad = 6;
 
    const left = Math.max(rect.left - pad, 0);
    const top = Math.max(rect.top - pad, 0);
    const right = Math.min(rect.right + pad, vw);
    const bottom = Math.min(rect.bottom + pad, vh);
 
    tutorialSpotlight.style.left = `${left}px`;
    tutorialSpotlight.style.top = `${top}px`;
    tutorialSpotlight.style.width = `${Math.max(0, right - left)}px`;
    tutorialSpotlight.style.height = `${Math.max(0, bottom - top)}px`;
 
    const clampX = value => Math.min(Math.max(value, margin), vw - popW - margin);
    const clampY = value => Math.min(Math.max(value, margin), vh - popH - margin);
 
    const order = vw >= 700
      ? ['right', 'left', 'bottom', 'top']
      : ['bottom', 'top', 'right', 'left'];
 
    let placed = false;
 
    for (const side of order) {
      if (side === 'right' && right + gap + popW <= vw - margin) {
        x = right + gap;
        y = clampY(top);
        placed = true;
      } else if (side === 'left' && left - gap - popW >= margin) {
        x = left - gap - popW;
        y = clampY(top);
        placed = true;
      } else if (side === 'bottom' && bottom + gap + popH <= vh - margin) {
        x = clampX(left);
        y = bottom + gap;
        placed = true;
      } else if (side === 'top' && top - gap - popH >= margin) {
        x = clampX(left);
        y = top - gap - popH;
        placed = true;
      }
 
      if (placed) {
        break;
      }
    }
 
    if (!placed) {
      x = (vw - popW) / 2;
      y = vh - popH - 16;
    }
  }
 
  tutorialPopover.style.left = `${x}px`;
  tutorialPopover.style.top = `${y}px`;
}
 
document.getElementById('menuTutorial').onclick = startTutorial;
document.getElementById('tutorialSkip').onclick = endTutorial;
 
tutorialPrev.onclick = () => {
  if (tutorialIndex > 0) {
    showTutorialStep(tutorialIndex - 1);
  }
};
 
tutorialNext.onclick = () => {
  if (tutorialIndex >= TUTORIAL_STEPS.length - 1) {
    endTutorial();
  } else {
    showTutorialStep(tutorialIndex + 1);
  }
};
 
window.addEventListener('resize', positionTutorial);
window.addEventListener('scroll', positionTutorial, true);
 
document.addEventListener('keydown', event => {
  if (!tutorialActive) {
    return;
  }
 
  if (event.key === 'Escape') {
    endTutorial();
  } else if (event.key === 'ArrowRight') {
    tutorialNext.click();
  } else if (event.key === 'ArrowLeft') {
    tutorialPrev.click();
  }
});
 
/* ==================== INIT ==================== */
 
applyI18n();
renderLog();
renderCharts();
updateGridDisplay();
resetHelicopterPosition();
loadSavedProject();