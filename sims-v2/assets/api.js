/**
 * api.js — ตัวเชื่อมกับ backend (server/) ใช้ร่วมกันทุกหน้า (หน้าแรก + 4 การทดลอง) และ drive.js
 *
 *  - VDL_API.request(path, options)   เรียก /api/... (ส่ง cookie ของ Google session ไปด้วย)
 *  - VDL_API.simConfig(sim)           ค่าคงที่ที่หน้าเว็บต้องใช้วาดฉาก
 *  - VDL_API.simulate(sim, params)    ให้ server คำนวณฟิสิกส์ (รวม noise โหมด stochastic)
 *
 * กติกาของ Google login (session) — เป็น "ชั่วคราว" เท่านั้น:
 *  - อยู่หน้าเดิม / สลับไปหน้าต่างอื่นแล้วกลับมา   → ยัง login อยู่
 *  - กดลิงก์ไปการทดลองอื่นหรือหน้าแรกในเว็บนี้     → ยัง login อยู่ (แต่ผลการทดลองเริ่มใหม่)
 *  - รีโหลดหน้า / ปิดแล้วเปิดเว็บใหม่              → ออกจากระบบ (ครั้งหน้าต้องเลือกบัญชี + อนุญาตใหม่)
 *  - ไม่ได้ขยับเมาส์/กดแป้นบนเว็บเลย 1 ชั่วโมง    → ออกจากระบบ
 */
(function (global) {
  'use strict';

  // ตอนเว็บอยู่บน Vercel หรือรัน `npm run dev` → frontend กับ API อยู่โดเมนเดียวกัน ไม่ต้องตั้งค่า
  // ตอนเว็บยังอยู่บน GitHub Pages → ใส่ URL ของ backend บน Vercel ตรงนี้
  const VERCEL_API_URL = 'https://virtual-doe-lab.vercel.app/'; // เช่น 'https://virtual-doe-lab.vercel.app'

  const API_BASE = global.location.hostname.endsWith('github.io') ? VERCEL_API_URL.replace(/\/$/, '') : '';
  const REQUEST_TIMEOUT_MS = 20000;

  const IDLE_LIMIT_MS = 60 * 60 * 1000; // ไม่มีการใช้งาน 1 ชั่วโมง → ออกจากระบบ (ต้องตรงกับ SESSION_IDLE_S ที่ server)
  const PING_EVERY_MS = 5 * 60 * 1000; // ระหว่างที่ยังใช้งานอยู่ บอก server ทุก ๆ 5 นาทีว่ายังไม่ idle

  // history.js ตั้งตัวนี้ไว้เมื่อผู้ใช้ sign in ด้วย Clerk → ทุก request แนบ token ไปให้ server รู้ว่าเป็นใคร
  let authTokenProvider = null;
  function setAuthTokenProvider(provider) {
    authTokenProvider = typeof provider === 'function' ? provider : null;
  }

  async function request(path, { method = 'GET', body } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (authTokenProvider) {
      const token = await Promise.resolve()
        .then(authTokenProvider)
        .catch(() => null);
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(`${API_BASE}/api${path}`, {
        method,
        credentials: 'include',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      const networkError = new Error(
        error.name === 'AbortError' ? 'The server took too long to respond.' : 'Cannot reach the server.'
      );
      networkError.status = 0;
      throw networkError;
    } finally {
      clearTimeout(timeout);
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && /^\/(auth|drive)\//.test(path)) {
        setSignedIn(false); // Google session หมดอายุ/ถูกล้างที่ server → ครั้งหน้าต้อง login ใหม่
      }
      const error = new Error((data && data.error) || `Server error (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  const configCache = {};
  function simConfig(sim) {
    if (!configCache[sim]) {
      configCache[sim] = request(`/sims/${sim}`).catch((error) => {
        delete configCache[sim]; // ลองใหม่ได้ครั้งหน้า
        throw error;
      });
    }
    return configCache[sim];
  }

  function simulate(sim, params) {
    return request(`/sims/${sim}/simulate`, { method: 'POST', body: params });
  }

  /** ใช้ตอนโหลดหน้าแล้วติดต่อ server ไม่ได้ (ยังไม่มีค่าคงที่สำหรับวาดฉาก) */
  function showStartupError(error) {
    console.error('Virtual DOE Lab: backend unavailable', error);
    const th = (global.document.documentElement.lang || '').toLowerCase().startsWith('th');
    const box = global.document.getElementById('warningBox');
    const launch = global.document.getElementById('launchBtn');
    if (launch) launch.disabled = true;
    if (box) {
      box.textContent = th
        ? `ติดต่อ server ไม่ได้ (${error.message}) กรุณารีเฟรชหน้าอีกครั้ง`
        : `Cannot connect to the server (${error.message}). Please refresh the page.`;
      box.hidden = false;
    }
  }

  // =====================================================================
  // Google session ชั่วคราว
  // =====================================================================

  /**
   * true = เปิดเว็บ "ใหม่" → ต้องล้าง login เดิม
   *  - รีโหลดหน้า
   *  - เปิดจากนอกเว็บ (พิมพ์ URL, bookmark, เปิดหลังปิดเบราว์เซอร์/แท็บ, ลิงก์จากเว็บอื่น)
   * false = เดินภายในเว็บนี้ (กดเมนู/ลิงก์ไปหน้าอื่นของเว็บ หรือปุ่ม Back/Forward)
   */
  function isNewVisit() {
    // เพิ่งกลับมาจากหน้า Sign in ของ Google/Clerk (history.js ฝากเครื่องหมายไว้ก่อนออกไป) → ยังถือว่าเดินในเว็บ
    if (returningFromSignIn) return false;
    // หน้านี้ถูกโหลดใหม่เองจากปุ่ม Back (ดู pageshow ด้านล่าง) → ยังถือว่าเดินในเว็บ
    try {
      if (global.sessionStorage.getItem(BACK_RELOAD_KEY)) {
        global.sessionStorage.removeItem(BACK_RELOAD_KEY);
        return false;
      }
    } catch {
      /* ignore */
    }
    const nav = global.performance?.getEntriesByType?.('navigation')?.[0];
    const type = nav ? nav.type : 'navigate';
    if (type === 'reload') return true;
    if (type === 'back_forward') return false;
    try {
      return !document.referrer || new URL(document.referrer).origin !== global.location.origin;
    } catch {
      return true;
    }
  }

  const BACK_RELOAD_KEY = 'vdl:back-reload';

  // ---- ออกไป Sign in (Clerk/Google พาออกจากหน้าแล้วพากลับมา) ไม่นับเป็น "เปิดเว็บใหม่" ----
  const SIGN_IN_KEY = 'vdl:leaving-to-sign-in';
  const SIGN_IN_MAX_AGE_MS = 15 * 60 * 1000;

  /** history.js เรียกก่อนเปิดหน้า Sign in */
  function markLeavingToSignIn() {
    try {
      global.sessionStorage.setItem(SIGN_IN_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  /** history.js เรียกเมื่อ sign in สำเร็จในหน้าเดิม (ไม่ต้องใช้เครื่องหมายแล้ว) */
  function clearLeavingToSignIn() {
    try {
      global.sessionStorage.removeItem(SIGN_IN_KEY);
    } catch {
      /* ignore */
    }
  }

  const returningFromSignIn = (() => {
    try {
      const at = Number(global.sessionStorage.getItem(SIGN_IN_KEY));
      global.sessionStorage.removeItem(SIGN_IN_KEY);
      return at > 0 && Date.now() - at < SIGN_IN_MAX_AGE_MS;
    } catch {
      return false;
    }
  })();

  // กดปุ่ม Back แล้วเบราว์เซอร์อาจคืนหน้าเดิมจากหน่วยความจำ (ผลการทดลองเก่ายังค้าง)
  // → โหลดหน้าใหม่ให้เริ่มจากศูนย์ แต่ไม่นับเป็นการรีโหลด (ยัง login อยู่)
  global.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      try {
        global.sessionStorage.setItem(BACK_RELOAD_KEY, '1');
      } catch {
        /* ignore */
      }
      global.location.reload();
    }
  });

  // ปุ่ม Back: เบราว์เซอร์จะคืนค่าที่เคยพิมพ์/เลื่อนไว้ในช่องต่าง ๆ ให้เอง
  // → ตั้งกลับเป็นค่าเริ่มต้นของหน้า (ก่อนที่ app.js จะอ่านค่า) เพื่อให้เริ่มใหม่จริง ๆ
  function resetFormControls() {
    global.document.querySelectorAll('input, select, textarea').forEach((el) => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = el.defaultChecked;
      else if (el.tagName === 'SELECT') [...el.options].forEach((o) => (o.selected = o.defaultSelected));
      else if (el.type !== 'file') el.value = el.defaultValue;
    });
  }
  // บอกเบราว์เซอร์ว่าไม่ต้องจำค่าในช่องเหล่านี้ไว้คืนให้ตอนกด Back
  global.document.querySelectorAll('input, select, textarea').forEach((el) => {
    el.setAttribute('autocomplete', 'off');
  });
  // เผื่อเบราว์เซอร์ที่ยังคืนค่าให้อยู่ดี (ทำหลังโหลดหน้าเสร็จ ซึ่งเป็นจังหวะที่เบราว์เซอร์คืนค่า)
  const navType = global.performance?.getEntriesByType?.('navigation')?.[0]?.type;
  if (navType === 'back_forward') {
    resetFormControls();
    global.addEventListener('pageshow', (event) => {
      if (!event.persisted) resetFormControls();
    });
  }

  let signedIn = false;

  function setSignedIn(value) {
    const changed = signedIn !== value;
    signedIn = value;
    if (changed && !value) {
      // ให้ drive.js ล้าง access token ที่จำไว้ในหน้านี้
      global.dispatchEvent(new CustomEvent('vdl:signed-out'));
    }
  }

  async function signOut() {
    setSignedIn(false);
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      /* server ไม่ตอบก็ไม่เป็นไร — cookie จะหมดอายุเองที่ server */
    }
  }

  // ทำครั้งเดียวตอนโหลดหน้า: เปิดเว็บใหม่ → logout, เดินในเว็บ → ถามว่ายัง login อยู่ไหม
  // drive.js รอ promise นี้ก่อนขอ token เพื่อไม่ให้ใช้ session เก่าโดยไม่ตั้งใจ
  // คำนวณครั้งเดียว: Google (Drive) และ Clerk (history.js) ใช้กติกาเดียวกัน
  const newVisit = isNewVisit();
  const sessionReady = (newVisit
    ? signOut()
    : request('/auth/session')
        .then((data) => setSignedIn(Boolean(data && data.signedIn)))
        .catch(() => setSignedIn(false))
  ).then(() => undefined);

  // ---- นับเวลา idle จากการใช้งานจริง (เมาส์ แป้นพิมพ์ แตะจอ เลื่อนหน้า) ----
  let lastActivity = Date.now();
  let lastPing = Date.now();

  function onActivity() {
    const now = Date.now();
    lastActivity = now;
    if (signedIn && now - lastPing > PING_EVERY_MS) {
      lastPing = now;
      request('/auth/ping', { method: 'POST' })
        .then((data) => setSignedIn(Boolean(data && data.signedIn)))
        .catch(() => {});
    }
  }

  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'].forEach((type) =>
    global.addEventListener(type, onActivity, { passive: true, capture: true })
  );

  function checkIdle() {
    if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
      if (signedIn) signOut();
      // ให้ history.js ออกจาก Clerk ด้วย (กติกาเดียวกับ Google)
      global.dispatchEvent(new CustomEvent('vdl:idle'));
    }
  }
  global.setInterval(checkIdle, 60 * 1000);
  // ตอนกลับมาที่หน้านี้หลังจากไปหน้าต่างอื่นนาน ๆ ให้เช็กทันที (timer อาจถูกพักไว้ระหว่างนั้น)
  global.document.addEventListener('visibilitychange', () => {
    if (global.document.visibilityState === 'visible') checkIdle();
  });

  // =====================================================================
  // เตือนก่อนออกจากหน้า ถ้ามีผลการทดลองที่ยังไม่ได้บันทึก
  // (รีโหลด / ปิดแท็บ / ไปการทดลองอื่น = ผลในตารางหายหมด)
  // =====================================================================
  let unsavedResults = false;

  /** app.js เรียก true เมื่อมีผลใหม่, false เมื่อ Export CSV / บันทึกลง Drive / ล้างตาราง */
  function setUnsavedResults(value) {
    unsavedResults = Boolean(value);
  }

  global.addEventListener('beforeunload', (event) => {
    if (!unsavedResults) return;
    // เบราว์เซอร์จะแสดงข้อความมาตรฐานของตัวเอง (เช่น "Leave site? Changes you made may not be saved.")
    event.preventDefault();
    event.returnValue = '';
  });

  global.VDL_API = {
    base: API_BASE,
    setUnsavedResults,
    setAuthTokenProvider,
    request,
    simConfig,
    simulate,
    showStartupError,
    sessionReady,
    setSignedIn,
    signOut,
    newVisit,
    markLeavingToSignIn,
    clearLeavingToSignIn,
  };
})(window);
