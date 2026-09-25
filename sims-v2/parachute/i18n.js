/**
 * i18n.js — พจนานุกรมสองภาษา (ไทย/อังกฤษ) ของหน้า Parachute ล้วน ๆ ไม่มี DOM logic
 * โครงสร้างเดียวกับ waterBottleRocket/i18n.js — app.js เป็นคนเรียก applyTranslations()
 */
(function (global) {
  'use strict';

  const I18N = {
    en: {
      brandName: 'Parachute Lab',
      brandTagline: 'Design of Experiments',
      eyebrow: 'VIRTUAL DOE LAB · PARACHUTE MODULE',
      title: 'Parachute Experiment',
      subtitle: 'Set the factors and press Drop to watch the parachute fall and record the fall time.',

      factorsHeading: 'Set factors',
      shapeLabel: 'A: Canopy shape',
      materialLabel: 'B: Material',
      sizeLabel: 'C: Canopy diameter (cm)',
      sizeHint: 'Range 30–90 cm',
      stringLabel: 'D: String length (cm)',
      stringHint: 'Range 20–80 cm',
      heightLabel: 'Drop height (m)',
      heightHint: 'Constant, not a factor',
      round: 'Round',
      square: 'Square',
      hexagon: 'Hexagon',
      plastic: 'Plastic',
      nylon: 'Nylon',
      paper: 'Paper',
      mode: 'Experiment mode',
      deterministic: 'Deterministic',
      stochastic: 'Stochastic',
      detHint: 'Same factors always produce the same result.',
      stochHint: 'Adds random noise to imitate real experiments.',
      launch: '🪂 Drop',
      launching: '🪂 Falling…',
      constantsSummary: 'Fixed constants used in the model',
      constantsMass: 'Payload + parachute mass 0.12 kg.',
      constantsShape: 'Base Cd by shape: round 1.50, square 1.28, hexagon 1.40.',
      constantsMaterial: 'Material factor: plastic ×1.02, nylon ×1.08, paper ×0.92; string length adds 0.15% Cd per cm above 40 cm.',
      constantsMethod: 'Gravity + quadratic air drag (½ρCdAv²), integrated every 0.005 s.',

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
      thShape: 'A',
      thMaterial: 'B',
      thSize: 'C',
      thString: 'D',
      thTime: 'Time(s)',
      thImpactSpeed: 'Impact speed(m/s)',
      thCd: 'Cd',
      thHeight: 'Height(m)',
      thMode: 'Mode',

      effectsHeading: 'Main Effects / Interaction Plot',
      effectsSubheading: 'See how each factor affects fall time across your logged runs.',
      effectsModeLabel: 'Plot type',
      effectsModeMain: 'Main Effects Plot',
      effectsModeInteraction: 'Interaction Plot',
      effectsFactorXLabel: 'Factor (X-axis)',
      effectsFactorGroupLabel: 'Grouping factor (color)',
      effectsResponseNote: 'Y-axis: mean fall time (s)',
      effectsChartHint: 'Mean fall time per value, from logged runs',
      effectsEmptyDefault: 'Log at least 2 runs with different {factor} values to see this chart.',
      effectsEmptySameFactor: 'Choose two different factors to compare.',
      factorName_shape: 'Canopy shape (A)',
      factorName_material: 'Material (B)',
      factorName_diameterCm: 'Canopy diameter (C)',
      factorName_stringCm: 'String length (D)',

      warnings: {
        maxSimTimeExceeded: 'Maximum simulation time exceeded before landing — results may be incomplete.',
        exportEmpty: 'No results to export yet.',
      },
    },

    th: {
      brandName: 'ห้องทดลองร่มชูชีพ',
      brandTagline: 'การออกแบบการทดลอง',
      eyebrow: 'การทดลองเสมือน DOE · ร่มชูชีพ',
      title: 'การทดลองร่มชูชีพ',
      subtitle: 'ปรับปัจจัยแล้วกด "ปล่อย" เพื่อดูร่มตกลงมาและบันทึกเวลาตก',

      factorsHeading: 'กำหนดปัจจัย',
      shapeLabel: 'A: รูปทรงร่ม',
      materialLabel: 'B: วัสดุ',
      sizeLabel: 'C: เส้นผ่านศูนย์กลางร่ม (cm)',
      sizeHint: 'ช่วง 30–90 cm',
      stringLabel: 'D: ความยาวเชือก (cm)',
      stringHint: 'ช่วง 20–80 cm',
      heightLabel: 'ความสูงที่ปล่อย (m)',
      heightHint: 'ค่าคงที่ ไม่นับเป็นปัจจัย',
      round: 'วงกลม',
      square: 'สี่เหลี่ยม',
      hexagon: 'หกเหลี่ยม',
      plastic: 'พลาสติก',
      nylon: 'ไนลอน',
      paper: 'กระดาษ',
      mode: 'โหมดการทดลอง',
      deterministic: 'ค่าคงที่',
      stochastic: 'มีความสุ่ม',
      detHint: 'ปัจจัยเดิมจะให้ผลลัพธ์เท่าเดิมเสมอ',
      stochHint: 'เพิ่มสัญญาณรบกวนแบบสุ่มให้เหมือนการทดลองจริง',
      launch: '🪂 ปล่อย',
      launching: '🪂 กำลังตก...',
      constantsSummary: 'ค่าคงที่ที่ใช้ในแบบจำลอง (ไม่สามารถปรับได้)',
      constantsMass: 'มวลร่ม + สัมภาระ 0.12 กก.',
      constantsShape: 'Cd ตั้งต้นตามรูปทรง: วงกลม 1.50, สี่เหลี่ยม 1.28, หกเหลี่ยม 1.40',
      constantsMaterial: 'ตัวคูณวัสดุ: พลาสติก ×1.02, ไนลอน ×1.08, กระดาษ ×0.92; เชือกยาวเกิน 40 cm เพิ่ม Cd 0.15% ต่อ cm',
      constantsMethod: 'แรงโน้มถ่วง + แรงต้านอากาศแบบกำลังสอง (½ρCdAv²) คำนวณทีละ 0.005 วินาที',

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
      thShape: 'A',
      thMaterial: 'B',
      thSize: 'C',
      thString: 'D',
      thTime: 'เวลา(s)',
      thImpactSpeed: 'ความเร็วกระทบพื้น(m/s)',
      thCd: 'Cd',
      thHeight: 'ความสูง(m)',
      thMode: 'โหมด',

      effectsHeading: 'กราฟผลกระทบหลัก / กราฟปฏิสัมพันธ์',
      effectsSubheading: 'ดูว่าแต่ละปัจจัยส่งผลต่อเวลาตกอย่างไร จากผลการทดลองที่บันทึกไว้',
      effectsModeLabel: 'ชนิดกราฟ',
      effectsModeMain: 'ผลกระทบหลัก (Main Effects)',
      effectsModeInteraction: 'ปฏิสัมพันธ์ (Interaction)',
      effectsFactorXLabel: 'ปัจจัย (แกน X)',
      effectsFactorGroupLabel: 'ปัจจัยจัดกลุ่ม (สี)',
      effectsResponseNote: 'แกน Y: เวลาตกเฉลี่ย (s)',
      effectsChartHint: 'ค่าเฉลี่ยเวลาตกต่อค่าที่บันทึกไว้',
      effectsEmptyDefault: 'บันทึกผลอย่างน้อย 2 ครั้งที่มีค่า {factor} ต่างกัน เพื่อดูกราฟนี้',
      effectsEmptySameFactor: 'เลือกปัจจัยสองตัวที่ต่างกันเพื่อเปรียบเทียบ',
      factorName_shape: 'รูปทรงร่ม (A)',
      factorName_material: 'วัสดุ (B)',
      factorName_diameterCm: 'เส้นผ่านศูนย์กลางร่ม (C)',
      factorName_stringCm: 'ความยาวเชือก (D)',

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
