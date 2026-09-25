/**
 * i18n.js — พจนานุกรมสองภาษา (ไทย/อังกฤษ) ล้วน ๆ ไม่มี DOM logic
 * โหลดก่อน app.js เสมอ (ดู index.html) — app.js เป็นคนเรียก applyTranslations()
 */
(function (global) {
  'use strict';

  const I18N = {
    en: {
      // Header / brand
      brandName: 'Water Rocket Lab',
      brandTagline: 'Design of Experiments',
      eyebrow: 'VIRTUAL DOE LAB · WATER BOTTLE ROCKET MODULE',
      title: 'Water Bottle Rocket Experiment',
      subtitle: 'Adjust the parameters and press Launch to see the flight path and record results.',

      // Controls panel
      factorsHeading: 'Set factors',
      angleLabel: 'A: Launch Angle (°)',
      angleHint: 'Table range 45–60°',
      finsLabel: 'B: Number of Fins',
      finsHint: 'Table range 3–4',
      waterLabel: 'C: Water Volume (mL)',
      waterHint: 'Table range 300–500 mL',
      pressureLabel: 'D: Chamber Pressure (PSI)',
      pressureHint: 'Table range 30–40 psi',
      mode: 'Experiment mode',
      deterministic: 'Deterministic',
      stochastic: 'Stochastic',
      detHint: 'Same factors always produce the same result.',
      stochHint: 'Adds small random noise to imitate real launches.',
      launch: '🔥 Launch',
      launching: '🚀 In flight…',
      constantsSummary: 'Fixed constants used in the model',
      constantsBottle: 'Bottle volume 1.5 L, nozzle diameter 22 mm.',
      constantsMass: 'Dry rocket mass 0.15 kg + 0.01 kg per fin.',
      constantsDrag: 'Base drag coefficient 0.4 + 0.02 per fin.',
      constantsMethod: 'Thrust derived from Bernoulli + adiabatic expansion, integrated with RK4.',

      // Simulation panel
      simulateHeading: 'Simulate',
      axisAltitude: 'Altitude (m)',
      axisDistance: 'Distance (m)',
      liveTime: 'Time',
      liveDistance: 'Distance',
      liveAltitude: 'Altitude',
      liveSpeed: 'Speed',

      // Results table
      resultsHeading: 'Run history',
      clearTable: '🗑️ Clear',
      exportCsv: '⬇️ Export CSV',
      expandTable: '⤢ Expand',
      collapseTable: '✕ Close',
      tableEmpty: 'No results yet — press Launch to start',
      tableNote: '* Results are kept in this page\'s memory only; refreshing clears them — use "Export CSV" to save a file.',
      thRun: '#',
      thAngle: 'A(°)',
      thFins: 'B',
      thWater: 'C(mL)',
      thPressure: 'D(psi)',
      thDistance: 'Distance(m)',
      thFlightTime: 'Flight time(s)',
      thMaxAltitude: 'Max altitude(m)',
      thMode: 'Mode',

      // Main effects / interaction plot section
      effectsHeading: 'Main Effects / Interaction Plot',
      effectsSubheading: 'See how each factor affects landing distance across your logged runs.',
      effectsModeLabel: 'Plot type',
      effectsModeMain: 'Main Effects Plot',
      effectsModeInteraction: 'Interaction Plot',
      effectsFactorXLabel: 'Factor (X-axis)',
      effectsFactorGroupLabel: 'Grouping factor (color)',
      effectsResponseNote: 'Y-axis: mean landing distance (m)',
      effectsChartHint: 'Mean distance per value, from logged runs',
      effectsEmptyDefault: 'Log at least 2 runs with different {factor} values to see this chart.',
      effectsEmptySameFactor: 'Choose two different factors to compare.',
      factorNameAngle: 'Launch Angle (A)',
      factorNameFins: 'Number of Fins (B)',
      factorNameWater: 'Water Volume (C)',
      factorNamePressure: 'Chamber Pressure (D)',

      warnings: {
        waterClamped: 'Water volume reduced to {max} mL to leave enough air space in the bottle.',
        numericalInstability: 'Numerical instability detected — simulation stopped early.',
        maxSimTimeExceeded: 'Maximum simulation time exceeded before landing — results may be incomplete.',
        exportEmpty: 'No results to export yet.',
      },
    },

    th: {
      // Header / brand
      brandName: 'ห้องทดลองจรวดขวดน้ำ',
      brandTagline: 'การออกแบบการทดลอง',
      eyebrow: 'การทดลองเสมือน DOE · จรวดขวดน้ำ',
      title: 'การทดลองจรวดขวดน้ำ',
      subtitle: 'ปรับพารามิเตอร์แล้วกด "ยิง" เพื่อดูวิถีการเคลื่อนที่และบันทึกผลการทดลอง',

      // Controls panel
      factorsHeading: 'กำหนดปัจจัย',
      angleLabel: 'A: องศาการยิง (°)',
      angleHint: 'ค่าตามตาราง 45–60°',
      finsLabel: 'B: จำนวนปีก',
      finsHint: 'ค่าตามตาราง 3–4',
      waterLabel: 'C: ปริมาณน้ำ (mL)',
      waterHint: 'ค่าตามตาราง 300–500 mL',
      pressureLabel: 'D: แรงดัน (PSI)',
      pressureHint: 'ค่าตามตาราง 30–40 psi',
      mode: 'โหมดการทดลอง',
      deterministic: 'ค่าคงที่',
      stochastic: 'มีความสุ่ม',
      detHint: 'ปัจจัยเดิมจะให้ผลลัพธ์เท่าเดิมเสมอ',
      stochHint: 'เพิ่มสัญญาณรบกวนแบบสุ่มเล็กน้อยให้เหมือนการยิงจริง',
      launch: '🔥 ยิง',
      launching: '🚀 กำลังบิน...',
      constantsSummary: 'ค่าคงที่ที่ใช้ในแบบจำลอง (ไม่สามารถปรับได้)',
      constantsBottle: 'ปริมาตรขวด 1.5 ลิตร, เส้นผ่านศูนย์กลางคอขวด 22 มม.',
      constantsMass: 'มวลจรวดเปล่า 0.15 กก. + 0.01 กก. ต่อปีก',
      constantsDrag: 'สัมประสิทธิ์แรงต้านอากาศ 0.4 + 0.02 ต่อปีก',
      constantsMethod: 'ใช้สมการ Bernoulli + adiabatic expansion หาแรงขับ แล้วอินทิเกรตด้วย RK4',

      // Simulation panel
      simulateHeading: 'การจำลอง',
      axisAltitude: 'ความสูง (m)',
      axisDistance: 'ระยะทาง (m)',
      liveTime: 'เวลา',
      liveDistance: 'ระยะทาง',
      liveAltitude: 'ความสูง',
      liveSpeed: 'ความเร็ว',

      // Results table
      resultsHeading: 'ตารางผลการทดลอง',
      clearTable: '🗑️ ล้างตาราง',
      exportCsv: '⬇️ ส่งออก CSV',
      expandTable: '⤢ ขยายตาราง',
      collapseTable: '✕ ปิด',
      tableEmpty: 'ยังไม่มีผลการทดลอง — กด "ยิง" เพื่อเริ่มต้น',
      tableNote: '* ผลการทดลองเก็บไว้ในหน่วยความจำของหน้านี้เท่านั้น รีเฟรชหน้าเว็บแล้วข้อมูลจะหายไป — ใช้ปุ่ม "ส่งออก CSV" เพื่อบันทึกเป็นไฟล์',
      thRun: '#',
      thAngle: 'A(°)',
      thFins: 'B',
      thWater: 'C(mL)',
      thPressure: 'D(psi)',
      thDistance: 'ระยะทาง(m)',
      thFlightTime: 'เวลาบิน(s)',
      thMaxAltitude: 'ความสูงสูงสุด(m)',
      thMode: 'โหมด',

      // ส่วนกราฟ Main effects / Interaction plot
      effectsHeading: 'กราฟผลกระทบหลัก / กราฟปฏิสัมพันธ์',
      effectsSubheading: 'ดูว่าแต่ละปัจจัยส่งผลต่อระยะทางตกอย่างไร จากผลการทดลองที่บันทึกไว้',
      effectsModeLabel: 'ชนิดกราฟ',
      effectsModeMain: 'ผลกระทบหลัก (Main Effects)',
      effectsModeInteraction: 'ปฏิสัมพันธ์ (Interaction)',
      effectsFactorXLabel: 'ปัจจัย (แกน X)',
      effectsFactorGroupLabel: 'ปัจจัยจัดกลุ่ม (สี)',
      effectsResponseNote: 'แกน Y: ระยะทางเฉลี่ย (m)',
      effectsChartHint: 'ค่าเฉลี่ยระยะทางต่อค่าที่บันทึกไว้',
      effectsEmptyDefault: 'บันทึกผลอย่างน้อย 2 ครั้งที่มีค่า {factor} ต่างกัน เพื่อดูกราฟนี้',
      effectsEmptySameFactor: 'เลือกปัจจัยสองตัวที่ต่างกันเพื่อเปรียบเทียบ',
      factorNameAngle: 'องศาการยิง (A)',
      factorNameFins: 'จำนวนปีก (B)',
      factorNameWater: 'ปริมาณน้ำ (C)',
      factorNamePressure: 'แรงดัน (D)',

      warnings: {
        waterClamped: 'ปริมาณน้ำถูกปรับลดเหลือ {max} mL เพื่อให้มีที่ว่างอากาศเพียงพอในขวด',
        numericalInstability: 'การคำนวณไม่เสถียร (numerical instability) — หยุดการจำลองก่อนกำหนด',
        maxSimTimeExceeded: 'เกินเวลาจำลองสูงสุดก่อนตกพื้น — ผลลัพธ์อาจไม่สมบูรณ์',
        exportEmpty: 'ยังไม่มีผลการทดลองให้ส่งออก',
      },
    },
  };

  /**
   * แทนที่ {key} ในสตริงเทมเพลตด้วยค่าจริง เช่น formatTemplate('...{max}...', {max: 1450}) -> '...1450...'
   */
  function formatTemplate(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, key) => (key in params ? params[key] : `{${key}}`));
  }

  /**
   * วน [data-i18n] ทุกตัวในหน้าแล้วแทนที่ textContent ด้วยคำแปลของภาษาที่เลือก
   */
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
