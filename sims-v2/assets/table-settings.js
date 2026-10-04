/**
 * table-settings.js — ปุ่มเฟืองข้างหัวข้อ "Run history" เลือกคอลัมน์ที่ตารางย่อแสดง
 *  - เปิดเป็นการ์ดลอยกลางจอ ด้านหลังเป็นฝ้า (แบบเดียวกับตารางขยาย)
 *  - มีผลเฉพาะตารางย่อ — ตารางขยายและไฟล์ CSV มีครบทุกคอลัมน์เสมอ
 *  - ซ่อน/แสดงคอลัมน์ด้วย CSS (:nth-child) จึงไม่ต้องแก้โค้ดสร้างแถวของแต่ละการทดลอง
 *  - จำค่าที่เลือกแยกต่อการทดลองใน localStorage
 *
 * โหลดหลัง i18n.js และก่อน app.js — แต่ละหน้าเรียก TableSettings.init(config)
 * config: { sim, factorCount, factorLabel(i): string, lang(): string }
 *   คอลัมน์ที่ 1 = ลำดับ (#) แสดงเสมอ, ถัดไป factorCount คอลัมน์ = ปัจจัย, ที่เหลือ = ผลลัพธ์
 *   ค่าเริ่มต้น = คอลัมน์ที่ไม่มี class "col-extra" ใน <thead>
 */
(function (global) {
  'use strict';

  const DICT = {
    en: {
      tsOpen: 'Table settings',
      tsTitle: 'Table columns',
      tsIntro: 'Choose the columns shown in the compact table. The expanded table and CSV export always include every column.',
      tsFactors: 'Factors',
      tsResults: 'Results',
      tsReset: 'Reset',
      tsDone: 'Done',
      tsClose: 'Close',
    },
    th: {
      tsOpen: 'ตั้งค่าตาราง',
      tsTitle: 'คอลัมน์ในตาราง',
      tsIntro: 'เลือกคอลัมน์ที่จะแสดงในตารางย่อ ตารางขยายและไฟล์ CSV มีครบทุกคอลัมน์เสมอ',
      tsFactors: 'ปัจจัย',
      tsResults: 'ผลลัพธ์',
      tsReset: 'ค่าเริ่มต้น',
      tsDone: 'เสร็จ',
      tsClose: 'ปิด',
    },
  };

  if (global.I18N) {
    Object.keys(DICT).forEach((lang) => {
      global.I18N[lang] = global.I18N[lang] || {};
      Object.keys(DICT[lang]).forEach((key) => {
        if (!(key in global.I18N[lang])) global.I18N[lang][key] = DICT[lang][key];
      });
    });
  }

  function init(cfg) {
    const table = document.getElementById('resultsTable');
    const openBtn = document.getElementById('tableSettingsBtn');
    if (!table || !openBtn) return;

    const t = (key) => {
      const dict = (global.I18N && global.I18N[cfg.lang()]) || DICT.en;
      return key in dict ? dict[key] : DICT.en[key];
    };
    const headers = () => Array.from(table.tHead.rows[0].cells);
    const defaults = headers().map((th, i) => i === 0 || !th.classList.contains('col-extra'));
    const storageKey = `vdoe-cols-${cfg.sim}`;

    function load() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (Array.isArray(saved) && saved.length === defaults.length) return saved.map(Boolean);
      } catch (e) {
        /* storage ถูกปิด หรือค่าเสีย */
      }
      return defaults.slice();
    }

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(visible));
      } catch (e) {
        /* storage ถูกปิด */
      }
    }

    let visible = load();
    visible[0] = true;

    // กฎซ่อน/แสดงคอลัมน์ของตารางย่อ (id ซ้อนกันชนะ .col-extra เดิมใน sim.css)
    // + สีสลับคอลัมน์ นับเฉพาะคอลัมน์ที่แสดงอยู่ (ที่ 1, 3, 5… ขาว / 2, 4, 6… เทาอ่อน) ไม่งั้นซ่อนคอลัมน์แล้วสีจะติดกัน
    const style = document.createElement('style');
    document.head.appendChild(style);
    function applyColumns() {
      let shown = 0;
      style.textContent = visible
        .map((on, i) => {
          const cell = `#resultsSidebar:not(.expanded) #resultsTable tr > :nth-child(${i + 1})`;
          if (!on) return `${cell} { display: none; }`;
          shown += 1;
          return `${cell} { display: table-cell; background: ${shown % 2 === 0 ? 'var(--col-alt)' : 'var(--white)'}; }`;
        })
        .join('\n');
    }
    applyColumns();

    // ---------------------------------------------------------------- dialog
    const backdrop = document.createElement('div');
    backdrop.className = 'ts-backdrop';
    backdrop.hidden = true;
    const dialog = document.createElement('div');
    dialog.className = 'ts-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'tsTitle');
    dialog.hidden = true;
    document.body.append(backdrop, dialog);

    function option(col, label) {
      return `<label class="ts-option"><input type="checkbox" data-col="${col}"${visible[col] ? ' checked' : ''} /><span>${label}</span></label>`;
    }

    function renderDialog() {
      const ths = headers();
      const factorOptions = [];
      for (let i = 0; i < cfg.factorCount; i++) factorOptions.push(option(i + 1, cfg.factorLabel(i)));
      const resultOptions = [];
      for (let col = cfg.factorCount + 1; col < ths.length; col++) resultOptions.push(option(col, ths[col].textContent.trim()));

      dialog.innerHTML = `
        <div class="ts-head">
          <h2 id="tsTitle">${t('tsTitle')}</h2>
          <button type="button" class="secondary-button ts-close" aria-label="${t('tsClose')}"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>
        </div>
        <p class="ts-intro">${t('tsIntro')}</p>
        <fieldset class="ts-group"><legend>${t('tsFactors')}</legend>${factorOptions.join('')}</fieldset>
        <fieldset class="ts-group"><legend>${t('tsResults')}</legend>${resultOptions.join('')}</fieldset>
        <div class="ts-actions">
          <button type="button" class="secondary-button ts-reset">${t('tsReset')}</button>
          <button type="button" class="primary-button ts-done">${t('tsDone')}</button>
        </div>`;
      guardLastColumn();
    }

    /** ต้องเหลือคอลัมน์ข้อมูลอย่างน้อย 1 คอลัมน์ — ช่องสุดท้ายที่ติ๊กอยู่จะกดเอาออกไม่ได้ */
    function guardLastColumn() {
      const boxes = Array.from(dialog.querySelectorAll('input[type="checkbox"]'));
      const checked = boxes.filter((b) => b.checked);
      boxes.forEach((b) => {
        b.disabled = checked.length === 1 && b.checked;
      });
    }

    function open() {
      renderDialog();
      backdrop.hidden = false;
      dialog.hidden = false;
      document.body.classList.add('ts-open');
      const first = dialog.querySelector('input[type="checkbox"]:not(:disabled)');
      if (first) first.focus();
    }

    function close() {
      backdrop.hidden = true;
      dialog.hidden = true;
      document.body.classList.remove('ts-open');
      openBtn.focus();
    }

    dialog.addEventListener('change', (e) => {
      const box = e.target.closest('input[type="checkbox"]');
      if (!box) return;
      visible[Number(box.dataset.col)] = box.checked;
      applyColumns();
      save();
      guardLastColumn();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target.closest('.ts-close') || e.target.closest('.ts-done')) close();
      if (e.target.closest('.ts-reset')) {
        visible = defaults.slice();
        applyColumns();
        save();
        renderDialog();
        dialog.querySelector('.ts-reset').focus();
      }
    });

    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dialog.hidden) close();
    });

    openBtn.addEventListener('click', open);

    return {
      /** แปลชื่อปุ่มเฟืองใหม่หลังเปลี่ยนภาษา */
      refresh() {
        openBtn.setAttribute('aria-label', t('tsOpen'));
        openBtn.title = t('tsOpen');
      },
    };
  }

  global.TableSettings = { init };
})(window);
