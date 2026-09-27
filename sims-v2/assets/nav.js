/**
 * nav.js — navbar ที่ใช้ร่วมกันทุกหน้า
 *  - รวมคำแปลของ navbar เข้าไปใน window.I18N ของหน้านั้น (applyTranslations ของแต่ละหน้าจะแปลให้เอง)
 *  - dropdown เลือกการทดลอง (เปิด/ปิด, คลิกข้างนอก/กด Esc เพื่อปิด)
 *  - ไฮไลต์การทดลองที่เปิดอยู่ (อ่านจาก <body data-sim="...">)
 * โหลดหลัง i18n.js และก่อน app.js
 */
(function (global) {
  'use strict';

  const NAV_I18N = {
    en: {
      brandLab: 'Virtual DOE Lab',
      navHome: 'Home',
      navSims: 'Simulators',
      simParachute: 'Parachute',
      simHelicopter: 'Paper Helicopter',
      simRocket: 'Water Bottle Rocket',
      simCatapult: 'Catapult',
      scrollHint: 'Analysis charts',
    },
    th: {
      brandLab: 'Virtual DOE Lab',
      navHome: 'หน้าแรก',
      navSims: 'การทดลอง',
      simParachute: 'ร่มชูชีพ',
      simHelicopter: 'เฮลิคอปเตอร์กระดาษ',
      simRocket: 'จรวดขวดน้ำ',
      simCatapult: 'เครื่องยิงหิน',
      scrollHint: 'กราฟวิเคราะห์ผล',
    },
  };

  /** เติมคำแปลของ navbar ลงพจนานุกรมของหน้า (ไม่ทับ key ที่หน้านั้นมีอยู่แล้ว) */
  function mergeNavI18N(dict) {
    if (!dict) return;
    Object.keys(NAV_I18N).forEach((lang) => {
      dict[lang] = dict[lang] || {};
      Object.keys(NAV_I18N[lang]).forEach((key) => {
        if (!(key in dict[lang])) dict[lang][key] = NAV_I18N[lang][key];
      });
    });
  }

  mergeNavI18N(global.I18N);
  global.mergeNavI18N = mergeNavI18N;

  function initDropdown() {
    const toggle = document.querySelector('.nav-dropdown-toggle');
    const menu = document.querySelector('.nav-dropdown-menu');
    if (!toggle || !menu) return;

    const current = document.body.dataset.sim;
    if (current) {
      const link = menu.querySelector(`a[data-sim="${current}"]`);
      if (link) link.setAttribute('aria-current', 'page');
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(menu.hidden);
    });
    document.addEventListener('click', (e) => {
      if (!menu.hidden && !menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /**
   * เปิดหน้าใหม่ (กดลิงก์มา ไม่ใช่กดย้อนกลับ/รีเฟรช และไม่มี #anchor) -> เริ่มที่บนสุดเสมอ
   * iPhone: ตอนเปิดผ่านตัวแสดง artifact (หน้าเว็บอยู่ในกรอบ iframe) ตำแหน่งเลื่อนของหน้าก่อนติดมาหน้าใหม่
   * เช่นเลื่อนหน้า home ลงไปที่การ์ด แล้วกดเข้าหน้าทดลอง -> ไปโผล่ที่ตาราง/โซนกราฟ
   */
  function resetScrollOnNewPage() {
    const entry = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    if (location.hash || (entry && entry.type !== 'navigate')) return;
    const root = document.documentElement;
    const toTop = () => {
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto'; // ไม่ให้ smooth scroll ใน CSS ทำให้เห็นการเลื่อน
      window.scrollTo(0, 1); // ขยับก่อน 1px: บางเครื่องคิดว่าอยู่ที่ 0 แล้วจึงไม่เลื่อนให้จริง
      window.scrollTo(0, 0);
      root.style.scrollBehavior = prev;
    };
    toTop();
    requestAnimationFrame(toTop);
    window.addEventListener('load', toTop, { once: true });
  }

  resetScrollOnNewPage();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdown);
  } else {
    initDropdown();
  }
})(window);
