/**
 * zone-snap.js — มือถือ/แท็บเล็ต (จอ ≤ 900px): ดูดเข้าโซนกราฟแบบควบคุมเอง แทน CSS scroll-snap
 *
 * ทำไมไม่ใช้ CSS: บนมือถือ (โดยเฉพาะ Safari) เบราว์เซอร์ดูดเข้าจุด snap แรงมาก และ "re-snap" เองตอนหน้ากำลังโหลด
 * (ฟอนต์/ฉากจัดตำแหน่งเสร็จ) ทำให้เปิดหน้าทดลองแล้วเด้งไปโซนกราฟหรือตารางผลเอง
 *
 * กติกาที่นี่: ดูดเข้าหัวโซนกราฟ "เฉพาะ" ตอนที่ผู้ใช้เลื่อนลงเอง แล้วหยุดใกล้หัวโซน (ไม่เกิน 35% ของความสูงจอ)
 *  - ไม่ทำอะไรตอนโหลดหน้า (ต้องมีการแตะ/เลื่อนจากผู้ใช้ก่อน)
 *  - ไม่ดูดตอนเลื่อนขึ้น และไม่ดูดตอนเปิดตารางแบบ modal อยู่
 * desktop ยังใช้ CSS scroll-snap ตามเดิม (โซนพอดีจอ ไม่มีปัญหา)
 */
(function () {
  'use strict';

  const zone = document.getElementById('effectsSection');
  if (!zone) return;

  const mobile = window.matchMedia('(max-width: 900px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const PULL_RANGE = 0.35; // ดูดเมื่อหัวโซนกราฟห่างจากขอบบนจอไม่เกินสัดส่วนนี้ของความสูงจอ

  let userInteracted = false;
  let lastY = window.scrollY;
  let direction = 0;
  let timer = null;

  /** ความสูงของ navbar ที่ยังเห็นอยู่ (มือถือ navbar ซ่อนตอนเลื่อนลง -> 0) */
  function visibleNavHeight() {
    const nav = document.querySelector('.navbar');
    return nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
  }

  function settle() {
    if (!mobile.matches || !userInteracted || direction <= 0) return;
    if (document.body.classList.contains('table-modal-open')) return;
    const distance = zone.getBoundingClientRect().top - visibleNavHeight();
    if (distance > 2 && distance < window.innerHeight * PULL_RANGE) {
      window.scrollTo({ top: window.scrollY + distance, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (y !== lastY) direction = Math.sign(y - lastY);
      lastY = y;
      clearTimeout(timer);
      timer = setTimeout(settle, 140); // รอให้เลื่อน (รวมแรงเฉื่อยของนิ้ว) หยุดก่อน
    },
    { passive: true }
  );

  ['touchstart', 'wheel', 'pointerdown', 'keydown'].forEach((type) =>
    window.addEventListener(type, () => (userInteracted = true), { passive: true })
  );
})();
