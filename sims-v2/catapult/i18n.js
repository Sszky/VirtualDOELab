/**
 * i18n.js — พจนานุกรมสองภาษา (ไทย/อังกฤษ) ของหน้า Catapult ล้วน ๆ ไม่มี DOM logic
 * โครงสร้างเดียวกับ waterBottleRocket/i18n.js — app.js เป็นคนเรียก applyTranslations()
 */
(function (global) {
  'use strict';

  const I18N = {
    en: {
      brandName: 'Catapult Lab',
      brandTagline: 'Design of Experiments',
      eyebrow: 'VIRTUAL DOE LAB · CATAPULT MODULE',
      title: 'Catapult Experiment',
      subtitle: 'Set up the catapult, press Fire, and record how far the ball lands.',

      factorsHeading: 'Set factors',
      releaseLabel: 'A: Release angle (°)',
      releaseHint: 'How far the arm is pulled back',
      firingLabel: 'B: Firing angle (°)',
      firingHint: 'Where the stop halts the arm',
      cupLabel: 'C: Cup elevation (cm)',
      cupHint: 'Cup distance from the pivot',
      pinLabel: 'D: Pin elevation (cm)',
      pinHint: 'Band pin distance on the arm',
      bungeeLabel: 'E: Bungee position (cm)',
      bungeeHint: 'Band hook height on the tower',
      mode: 'Experiment mode',
      deterministic: 'Deterministic',
      stochastic: 'Stochastic',
      detHint: 'Same factors always produce the same result.',
      stochHint: 'Adds random noise (band strength, friction, stop angle) to imitate real shots.',
      launch: '🎯 Fire',
      launching: '🎯 In flight…',
      constantsSummary: 'Fixed constants used in the model',
      constantsArm: 'Arm 45 cm / 60 g pivoting 8 cm above the ground; cup 10 g; ping-pong ball 2.7 g, Ø40 mm.',
      constantsBand: 'Rubber band: spring k = 95 N/m, rest length 10 cm, stretched from the tower hook (E) to the arm pin (D).',
      constantsEnergy: 'Band energy released between angles A and B, minus the work to lift the arm, × 80% efficiency → arm speed. The ball leaves at angle B, perpendicular to the arm.',
      constantsMethod: 'Ball flight: gravity + quadratic air drag (Cd 0.5), integrated with RK4. Distance is measured from the pivot.',

      simulateHeading: 'Simulate',
      axisAltitude: 'Height (m)',
      axisDistance: 'Distance (m)',
      liveTime: 'Time',
      liveDistance: 'Distance',
      liveAltitude: 'Height',
      liveSpeed: 'Speed',

      resultsHeading: 'Run history',
      clearTable: '🗑️ Clear',
      exportCsv: '⬇️ Export CSV',
      expandTable: '⤢ Expand',
      collapseTable: '✕ Close',
      tableEmpty: 'No results yet — press Fire to start',
      tableNote: '* Results are kept in this page\'s memory only; refreshing clears them — use "Export CSV" to save a file.',
      thRun: '#',
      thRelease: 'A',
      thFiring: 'B',
      thCup: 'C',
      thPin: 'D',
      thBungee: 'E',
      thDistance: 'Dist.(m)',
      thFlightTime: 'Flight time(s)',
      thMaxAltitude: 'Max height(m)',
      thLaunchSpeed: 'Launch speed(m/s)',
      thMode: 'Mode',

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
      factorNameRelease: 'Release angle (A)',
      factorNameFiring: 'Firing angle (B)',
      factorNameCup: 'Cup elevation (C)',
      factorNamePin: 'Pin elevation (D)',
      factorNameBungee: 'Bungee position (E)',

      warnings: {
        releaseRaised: 'Release angle must be at least 5° more than the firing angle — raised to {value}°.',
        noLaunch: 'The band is too weak for this setup — the ball barely leaves the cup.',
        maxSimTimeExceeded: 'Maximum simulation time exceeded before landing — results may be incomplete.',
        exportEmpty: 'No results to export yet.',
      },
    },

    th: {
      brandName: 'เครื่องยิงหิน',
      brandTagline: 'การออกแบบการทดลอง',
      eyebrow: 'การทดลองเสมือน DOE · เครื่องยิงหิน',
      title: 'การทดลองเครื่องยิงหิน',
      subtitle: 'ตั้งค่าเครื่องยิงแล้วกด "ยิง" เพื่อดูลูกบอลลอยไปและบันทึกระยะที่ตก',

      factorsHeading: 'กำหนดปัจจัย',
      releaseLabel: 'A: มุมง้าง Release angle (°)',
      releaseHint: 'ง้างแขนไปด้านหลังแค่ไหน',
      firingLabel: 'B: มุมยิง Firing angle (°)',
      firingHint: 'ตำแหน่งตัวกั้นที่แขนไปหยุด',
      cupLabel: 'C: ตำแหน่งถ้วย Cup elevation (cm)',
      cupHint: 'ระยะถ้วยจากจุดหมุน',
      pinLabel: 'D: ตำแหน่งหมุด Pin elevation (cm)',
      pinHint: 'ระยะหมุดเกี่ยวหนังยางบนแขน',
      bungeeLabel: 'E: ตำแหน่งหนังยาง Bungee position (cm)',
      bungeeHint: 'ความสูงจุดเกี่ยวบนเสา',
      mode: 'โหมดการทดลอง',
      deterministic: 'ค่าคงที่',
      stochastic: 'มีความสุ่ม',
      detHint: 'ปัจจัยเดิมจะให้ผลลัพธ์เท่าเดิมเสมอ',
      stochHint: 'เพิ่มความสุ่ม (แรงหนังยาง, แรงเสียดทาน, มุมตัวกั้น) ให้เหมือนการยิงจริง',
      launch: '🎯 ยิง',
      launching: '🎯 กำลังลอย...',
      constantsSummary: 'ค่าคงที่ที่ใช้ในแบบจำลอง (ไม่สามารถปรับได้)',
      constantsArm: 'แขนยาว 45 cm หนัก 60 g หมุนรอบจุดที่สูงจากพื้น 8 cm; ถ้วย 10 g; ลูกปิงปอง 2.7 g เส้นผ่านศูนย์กลาง 40 mm',
      constantsBand: 'หนังยางเป็นสปริง k = 95 N/m ความยาวตอนไม่ยืด 10 cm ขึงจากจุดเกี่ยวบนเสา (E) ไปหมุดบนแขน (D)',
      constantsEnergy: 'พลังงานที่หนังยางปล่อยระหว่างมุม A ถึง B หักงานที่ใช้ยกแขน แล้วคูณประสิทธิภาพ 80% → ความเร็วแขน ลูกบอลหลุดที่มุม B ในทิศตั้งฉากกับแขน',
      constantsMethod: 'การลอยของลูกบอล: แรงโน้มถ่วง + แรงต้านอากาศแบบกำลังสอง (Cd 0.5) คำนวณด้วย RK4 ระยะทางวัดจากจุดหมุน',

      simulateHeading: 'การจำลอง',
      axisAltitude: 'ความสูง (m)',
      axisDistance: 'ระยะทาง (m)',
      liveTime: 'เวลา',
      liveDistance: 'ระยะทาง',
      liveAltitude: 'ความสูง',
      liveSpeed: 'ความเร็ว',

      resultsHeading: 'ตารางผลการทดลอง',
      clearTable: '🗑️ ล้างตาราง',
      exportCsv: '⬇️ ส่งออก CSV',
      expandTable: '⤢ ขยายตาราง',
      collapseTable: '✕ ปิด',
      tableEmpty: 'ยังไม่มีผลการทดลอง — กด "ยิง" เพื่อเริ่มต้น',
      tableNote: '* ผลการทดลองเก็บไว้ในหน่วยความจำของหน้านี้เท่านั้น รีเฟรชหน้าเว็บแล้วข้อมูลจะหายไป — ใช้ปุ่ม "ส่งออก CSV" เพื่อบันทึกเป็นไฟล์',
      thRun: '#',
      thRelease: 'A',
      thFiring: 'B',
      thCup: 'C',
      thPin: 'D',
      thBungee: 'E',
      thDistance: 'ระยะ(m)',
      thFlightTime: 'เวลาลอย(s)',
      thMaxAltitude: 'ความสูงสูงสุด(m)',
      thLaunchSpeed: 'ความเร็วตอนหลุด(m/s)',
      thMode: 'โหมด',

      effectsHeading: 'กราฟผลกระทบหลัก / กราฟปฏิสัมพันธ์',
      effectsSubheading: 'ดูว่าแต่ละปัจจัยส่งผลต่อระยะที่ลูกบอลตกอย่างไร จากผลการทดลองที่บันทึกไว้',
      effectsModeLabel: 'ชนิดกราฟ',
      effectsModeMain: 'ผลกระทบหลัก (Main Effects)',
      effectsModeInteraction: 'ปฏิสัมพันธ์ (Interaction)',
      effectsFactorXLabel: 'ปัจจัย (แกน X)',
      effectsFactorGroupLabel: 'ปัจจัยจัดกลุ่ม (สี)',
      effectsResponseNote: 'แกน Y: ระยะทางเฉลี่ย (m)',
      effectsChartHint: 'ค่าเฉลี่ยระยะทางต่อค่าที่บันทึกไว้',
      effectsEmptyDefault: 'บันทึกผลอย่างน้อย 2 ครั้งที่มีค่า {factor} ต่างกัน เพื่อดูกราฟนี้',
      effectsEmptySameFactor: 'เลือกปัจจัยสองตัวที่ต่างกันเพื่อเปรียบเทียบ',
      factorNameRelease: 'มุมง้าง (A)',
      factorNameFiring: 'มุมยิง (B)',
      factorNameCup: 'ตำแหน่งถ้วย (C)',
      factorNamePin: 'ตำแหน่งหมุด (D)',
      factorNameBungee: 'ตำแหน่งหนังยาง (E)',

      warnings: {
        releaseRaised: 'มุมง้างต้องมากกว่ามุมยิงอย่างน้อย 5° — ปรับเป็น {value}° ให้แล้ว',
        noLaunch: 'หนังยางแรงไม่พอสำหรับการตั้งค่านี้ — ลูกบอลแทบไม่หลุดจากถ้วย',
        maxSimTimeExceeded: 'เกินเวลาจำลองสูงสุดก่อนตกพื้น — ผลลัพธ์อาจไม่สมบูรณ์',
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
