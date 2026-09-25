/**
 * i18n.js — พจนานุกรมสองภาษา (ไทย/อังกฤษ) ของหน้า Paper Helicopter ล้วน ๆ ไม่มี DOM logic
 * โครงสร้างเดียวกับ waterBottleRocket/i18n.js — app.js เป็นคนเรียก applyTranslations()
 */
(function (global) {
  'use strict';

  const I18N = {
    en: {
      brandName: 'Paper Helicopter Lab',
      brandTagline: 'Design of Experiments',
      eyebrow: 'VIRTUAL DOE LAB · PAPER HELICOPTER MODULE',
      title: 'Paper Helicopter Experiment',
      subtitle: 'Set the paper dimensions and press Drop to watch the helicopter spin down and record the flight time.',

      factorsHeading: 'Set factors',
      wlLabel: 'A: Wing length WL (cm)',
      wlHint: 'Table range 8–12 cm',
      wwLabel: 'B: Wing width WW (cm)',
      wwHint: 'Table range 3–5 cm',
      blLabel: 'C: Body length BL (cm)',
      blHint: 'Table range 5–8 cm',
      bwLabel: 'D: Body width BW (cm)',
      bwHint: 'Table range 2–3 cm',
      heightLabel: 'Drop height (m)',
      heightHint: 'Constant, not a factor',
      mode: 'Experiment mode',
      deterministic: 'Deterministic',
      stochastic: 'Stochastic',
      detHint: 'Same factors always produce the same result.',
      stochHint: 'Adds random noise (±3% drag and mass) to imitate hand-cut paper.',
      launch: '🚁 Drop',
      launching: '🚁 Spinning down…',
      constantsSummary: 'Fixed constants used in the model',
      constantsPaper: 'Paper 80 g/m² (A4) + paper clip 0.5 g; mass = paper area × 80 g/m² + clip.',
      constantsRotor: 'Rotor acts as a disc of area π·WL²; Cd = 0.8 × (WW / 4 cm)^0.8.',
      constantsSpinup: 'Blades need ~0.3 s to spin up after release — drag ramps from 25% to 100%.',
      constantsMethod: 'Gravity + quadratic air drag (½ρCdAv²), integrated with RK4 every 0.001 s.',

      simulateHeading: 'Simulate',
      axisAltitude: 'Height (m)',
      liveTime: 'Time',
      liveAltitude: 'Height',
      liveSpeed: 'Speed',

      resultsHeading: 'Run history',
      clearTable: '🗑️ Clear',
      exportCsv: '⬇️ Export CSV',
      expandTable: '⤢ Expand',
      collapseTable: '✕ Close',
      tableEmpty: 'No results yet — press Drop to start',
      tableNote: '* Results are kept in this page\'s memory only; refreshing clears them — use "Export CSV" to save a file.',
      thRun: '#',
      thWL: 'A',
      thWW: 'B',
      thBL: 'C',
      thBW: 'D',
      thTime: 'Time(s)',
      thImpactSpeed: 'Landing speed(m/s)',
      thMass: 'Mass(g)',
      thHeight: 'Height(m)',
      thMode: 'Mode',

      effectsHeading: 'Main Effects / Interaction Plot',
      effectsSubheading: 'See how each factor affects flight time across your logged runs.',
      effectsModeLabel: 'Plot type',
      effectsModeMain: 'Main Effects Plot',
      effectsModeInteraction: 'Interaction Plot',
      effectsFactorXLabel: 'Factor (X-axis)',
      effectsFactorGroupLabel: 'Grouping factor (color)',
      effectsResponseNote: 'Y-axis: mean flight time (s)',
      effectsChartHint: 'Mean flight time per value, from logged runs',
      effectsEmptyDefault: 'Log at least 2 runs with different {factor} values to see this chart.',
      effectsEmptySameFactor: 'Choose two different factors to compare.',
      factorName_WL: 'Wing length (A)',
      factorName_WW: 'Wing width (B)',
      factorName_BL: 'Body length (C)',
      factorName_BW: 'Body width (D)',

      warnings: {
        maxSimTimeExceeded: 'Maximum simulation time exceeded before landing — results may be incomplete.',
        exportEmpty: 'No results to export yet.',
      },
    },

    th: {
      brandName: 'เฮลิคอปเตอร์กระดาษ',
      brandTagline: 'การออกแบบการทดลอง',
      eyebrow: 'การทดลองเสมือน DOE · เฮลิคอปเตอร์กระดาษ',
      title: 'การทดลองเฮลิคอปเตอร์กระดาษ',
      subtitle: 'ปรับขนาดกระดาษแล้วกด "ปล่อย" เพื่อดูเฮลิคอปเตอร์หมุนตกลงมาและบันทึกเวลาลอยตัว',

      factorsHeading: 'กำหนดปัจจัย',
      wlLabel: 'A: ความยาวใบพัด WL (cm)',
      wlHint: 'ค่าตามตาราง 8–12 cm',
      wwLabel: 'B: ความกว้างใบพัด WW (cm)',
      wwHint: 'ค่าตามตาราง 3–5 cm',
      blLabel: 'C: ความยาวลำตัว BL (cm)',
      blHint: 'ค่าตามตาราง 5–8 cm',
      bwLabel: 'D: ความกว้างลำตัว BW (cm)',
      bwHint: 'ค่าตามตาราง 2–3 cm',
      heightLabel: 'ความสูงที่ปล่อย (m)',
      heightHint: 'ค่าคงที่ ไม่นับเป็นปัจจัย',
      mode: 'โหมดการทดลอง',
      deterministic: 'ค่าคงที่',
      stochastic: 'มีความสุ่ม',
      detHint: 'ปัจจัยเดิมจะให้ผลลัพธ์เท่าเดิมเสมอ',
      stochHint: 'เพิ่มความสุ่ม (แรงต้านและมวล ±3%) ให้เหมือนกระดาษที่ตัดด้วยมือจริง',
      launch: '🚁 ปล่อย',
      launching: '🚁 กำลังหมุนลง...',
      constantsSummary: 'ค่าคงที่ที่ใช้ในแบบจำลอง (ไม่สามารถปรับได้)',
      constantsPaper: 'กระดาษ 80 แกรม (A4) + คลิปหนีบกระดาษ 0.5 g; มวล = พื้นที่กระดาษ × 80 g/m² + คลิป',
      constantsRotor: 'ใบพัดที่หมุนทำตัวเหมือนจานพื้นที่ π·WL²; Cd = 0.8 × (WW / 4 cm)^0.8',
      constantsSpinup: 'หลังปล่อยใบพัดต้องใช้เวลา ~0.3 วินาทีกว่าจะหมุนเต็มที่ — แรงต้านค่อย ๆ เพิ่มจาก 25% ถึง 100%',
      constantsMethod: 'แรงโน้มถ่วง + แรงต้านอากาศแบบกำลังสอง (½ρCdAv²) คำนวณด้วย RK4 ทีละ 0.001 วินาที',

      simulateHeading: 'การจำลอง',
      axisAltitude: 'ความสูง (m)',
      liveTime: 'เวลา',
      liveAltitude: 'ความสูง',
      liveSpeed: 'ความเร็ว',

      resultsHeading: 'ตารางผลการทดลอง',
      clearTable: '🗑️ ล้างตาราง',
      exportCsv: '⬇️ ส่งออก CSV',
      expandTable: '⤢ ขยายตาราง',
      collapseTable: '✕ ปิด',
      tableEmpty: 'ยังไม่มีผลการทดลอง — กด "ปล่อย" เพื่อเริ่มต้น',
      tableNote: '* ผลการทดลองเก็บไว้ในหน่วยความจำของหน้านี้เท่านั้น รีเฟรชหน้าเว็บแล้วข้อมูลจะหายไป — ใช้ปุ่ม "ส่งออก CSV" เพื่อบันทึกเป็นไฟล์',
      thRun: '#',
      thWL: 'A',
      thWW: 'B',
      thBL: 'C',
      thBW: 'D',
      thTime: 'เวลา(s)',
      thImpactSpeed: 'ความเร็วถึงพื้น(m/s)',
      thMass: 'มวล(g)',
      thHeight: 'ความสูง(m)',
      thMode: 'โหมด',

      effectsHeading: 'กราฟผลกระทบหลัก / กราฟปฏิสัมพันธ์',
      effectsSubheading: 'ดูว่าแต่ละปัจจัยส่งผลต่อเวลาลอยตัวอย่างไร จากผลการทดลองที่บันทึกไว้',
      effectsModeLabel: 'ชนิดกราฟ',
      effectsModeMain: 'ผลกระทบหลัก (Main Effects)',
      effectsModeInteraction: 'ปฏิสัมพันธ์ (Interaction)',
      effectsFactorXLabel: 'ปัจจัย (แกน X)',
      effectsFactorGroupLabel: 'ปัจจัยจัดกลุ่ม (สี)',
      effectsResponseNote: 'แกน Y: เวลาลอยตัวเฉลี่ย (s)',
      effectsChartHint: 'ค่าเฉลี่ยเวลาลอยตัวต่อค่าที่บันทึกไว้',
      effectsEmptyDefault: 'บันทึกผลอย่างน้อย 2 ครั้งที่มีค่า {factor} ต่างกัน เพื่อดูกราฟนี้',
      effectsEmptySameFactor: 'เลือกปัจจัยสองตัวที่ต่างกันเพื่อเปรียบเทียบ',
      factorName_WL: 'ความยาวใบพัด (A)',
      factorName_WW: 'ความกว้างใบพัด (B)',
      factorName_BL: 'ความยาวลำตัว (C)',
      factorName_BW: 'ความกว้างลำตัว (D)',

      warnings: {
        maxSimTimeExceeded: 'เกินเวลาจำลองสูงสุดก่อนถึงพื้น — ผลลัพธ์อาจไม่สมบูรณ์',
        exportEmpty: 'ยังไม่มีผลการทดลองให้ส่งออก',
      },
    },
  };

  function formatTemplate(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, key) => (key in params ? params[key] : `{${key}}`));
  }

  function applyTranslations(lang) {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (key in dict) {
        el.textContent = dict[key];
      }
    });
  }

  global.I18N = I18N;
  global.formatTemplate = formatTemplate;
  global.applyTranslations = applyTranslations;
})(window);
