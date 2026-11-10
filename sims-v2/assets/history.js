/**
 * history.js — ประวัติการทดลอง ("My sessions") ใช้ร่วมกันทั้ง 4 การทดลอง
 *
 *  - ไม่ login: ไม่บันทึกอะไรเลย ผลอยู่ในหน้าจนกว่าจะปิด (มีข้อความบอก + เตือนตอนออกจากหน้า)
 *  - Sign in ด้วย Google ผ่าน Clerk: ทุกครั้งที่ยิง server บันทึกผลลงบัญชีให้เอง เปิดได้ทุกเครื่อง
 *  - Sign in ตอนที่มีผลในตารางแล้ว: ส่งผลในตารางขึ้นไปเป็น session ใหม่
 *    (server คำนวณผลใหม่จากค่าปัจจัย — โหมดสุ่มจะได้ตัวเลขใหม่ ตารางจะแสดงตัวเลขที่บันทึกจริง)
 *  - กด Clear = เริ่ม session ใหม่ (session เดิมยังอยู่ในประวัติ)
 *  - Sign in ของ Clerk ใช้กติกาเดียวกับ Google Drive login (api.js):
 *    รีโหลด / ปิดแล้วเปิดใหม่ = ออกจากระบบ, ไม่ใช้งาน 1 ชั่วโมง = ออก, login นานเกิน 8 ชั่วโมง = ออก
 *    (เดินไปหน้าอื่นในเว็บ / ปุ่ม Back / กลับมาจากหน้า Sign in = ยัง login อยู่)
 *
 * ถ้า server ยังไม่ได้ตั้งค่า database + Clerk → ไม่แสดงอะไรเลย เว็บทำงานเหมือนเดิม
 *
 * แต่ละหน้าการทดลอง (app.js) เรียก:
 *   VDL_HISTORY.attach({ sim, getRows(), setRows(rows), rowCount() })   หลังสร้างตาราง
 *   VDL_HISTORY.newSession()                                  ตอนกด Clear
 */
(function (global) {
  'use strict';

  const document = global.document;
  const API = global.VDL_API;

  // ---------------------------------------------------------------------------
  // ข้อความ ไทย / อังกฤษ
  // ---------------------------------------------------------------------------
  const TEXT = {
    en: {
      mySessions: 'My sessions',
      signIn: 'Sign in',
      notSavedGuest: 'Results are not saved · Sign in to keep them',
      tableNoteUser:
        '* Your results are saved to your account automatically — open them again from "My sessions" on any device. Use "Export CSV" or "Save to Drive" to keep a file.',
      savingUser: 'Auto-saving to your account',
      savedRun: 'Saved · run {n}',
      notSaved: 'This run was not saved to history',
      continueLast: 'Continue last session ({n} runs)',
      dialogTitle: 'My sessions',
      newSession: 'New session',
      empty: 'No saved sessions for this experiment yet. Run an experiment and it is saved automatically.',
      userNote: 'Saved to your account. Open them from any device.',
      runs: '{n} runs',
      oneRun: '1 run',
      untitled: 'Session {date}',
      open: 'Open',
      rename: 'Rename',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirmDelete: 'Delete this session?',
      yesDelete: 'Delete',
      current: 'Current',
      close: 'Close',
      loading: 'Loading…',
      loadError: 'Could not load your sessions. Please try again.',
      opened: 'Opened “{name}” · new runs are added to it',
      imported: '{n} run(s) from the table saved to your account',
      importError: 'Could not save the runs in the table. New runs will still be saved.',
      signInError: 'Sign-in is not available right now.',
    },
    th: {
      mySessions: 'ประวัติการทดลอง',
      signIn: 'เข้าสู่ระบบ',
      notSavedGuest: 'ผลยังไม่ถูกบันทึก · เข้าสู่ระบบเพื่อเก็บผลไว้',
      tableNoteUser:
        '* ผลการทดลองบันทึกในบัญชีของคุณอัตโนมัติ เปิดดูอีกครั้งได้จาก "ประวัติการทดลอง" ทุกเครื่อง — ใช้ปุ่ม "ส่งออก CSV" หรือ "บันทึกลง Drive" เพื่อเก็บเป็นไฟล์',
      savingUser: 'บันทึกอัตโนมัติในบัญชีของคุณ',
      savedRun: 'บันทึกแล้ว · ครั้งที่ {n}',
      notSaved: 'ครั้งนี้ไม่ได้บันทึกลงประวัติ',
      continueLast: 'ทำต่อจาก session ล่าสุด ({n} ครั้ง)',
      dialogTitle: 'ประวัติการทดลอง',
      newSession: 'เริ่ม session ใหม่',
      empty: 'ยังไม่มีประวัติของการทดลองนี้ ลองยิงดูได้เลย ระบบจะบันทึกให้อัตโนมัติ',
      userNote: 'เก็บไว้ในบัญชีของคุณ เปิดได้จากทุกเครื่อง',
      runs: '{n} ครั้ง',
      oneRun: '1 ครั้ง',
      untitled: 'Session {date}',
      open: 'เปิด',
      rename: 'เปลี่ยนชื่อ',
      delete: 'ลบ',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      confirmDelete: 'ลบ session นี้?',
      yesDelete: 'ลบ',
      current: 'กำลังใช้',
      close: 'ปิด',
      loading: 'กำลังโหลด…',
      loadError: 'โหลดประวัติไม่สำเร็จ กรุณาลองใหม่',
      opened: 'เปิด “{name}” แล้ว · ผลใหม่จะต่อท้าย session นี้',
      imported: 'บันทึกผล {n} ครั้งจากตารางลงบัญชีแล้ว',
      importError: 'บันทึกผลที่อยู่ในตารางไม่สำเร็จ ผลครั้งต่อไปจะบันทึกตามปกติ',
      signInError: 'ตอนนี้เข้าสู่ระบบไม่ได้',
    },
  };

  const lang = () => ((document.documentElement.lang || '').toLowerCase().startsWith('th') ? 'th' : 'en');
  const t = (key, vars = {}) =>
    String(TEXT[lang()][key] ?? TEXT.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));

  // ---------------------------------------------------------------------------
  // สถานะ
  // ---------------------------------------------------------------------------
  const state = {
    config: null, // { enabled, clerkPublishableKey }
    app: null, // { sim, getRows, setRows, rowCount }
    sessionId: null, // session ที่ผลใหม่จะต่อท้าย (null = เริ่มใหม่ตอนยิงครั้งถัดไป)
    lastRunNo: 0,
    clerk: null,
    latest: null, // session ล่าสุดของการทดลองนี้ (สำหรับปุ่ม "ทำต่อ")
    message: null, // [key, vars] แปลตอนแสดงผล (เปลี่ยนภาษาแล้วแปลตามได้)
  };

  const configReady = API.request('/history/config').then(
    (config) => (state.config = config),
    () => (state.config = { enabled: false, clerkPublishableKey: null })
  );

  // ---------------------------------------------------------------------------
  // ห่อ VDL_API.simulate: บอก server ให้บันทึกผลลง session ของเรา
  // ---------------------------------------------------------------------------
  const originalSimulate = API.simulate;
  API.simulate = async function simulateAndSave(sim, params) {
    await configReady;
    if (state.app && state.app.sim === sim) dropPendingRows(); // ยังอยู่หน้าเดิม → ไม่ต้องใช้ผลที่ฝากไว้
    if (!state.config.enabled || !state.app || state.app.sim !== sim || !isSignedIn()) {
      return originalSimulate(sim, params); // ไม่ login → ไม่บันทึก
    }
    const session = state.sessionId || 'new';
    const result = await API.request(`/sims/${sim}/simulate?session=${encodeURIComponent(session)}`, {
      method: 'POST',
      body: params,
    });
    const saved = result.history && result.history.saved;
    if (saved) {
      state.sessionId = result.history.sessionId;
      state.lastRunNo = result.history.runNo;
      state.latest = null;
      state.message = ['savedRun', { n: result.history.runNo }];
    } else if (result.history) {
      state.message = ['notSaved', {}];
    }
    renderBar();
    return result;
  };

  // ---------------------------------------------------------------------------
  // แถบประวัติ (อยู่เหนือปุ่ม Clear / Export / Drive ในตารางผล)
  // ---------------------------------------------------------------------------
  let bar = null;
  // เก็บ element ของแถบไว้ตั้งแต่ตอนสร้าง (Clerk วาดปุ่มผู้ใช้ลงใน ui.userMount ซึ่งเป็นของ Clerk ทั้งกล่อง
  // และอาจแทนที่ node ข้างในได้ จึงไม่ querySelector หาใหม่ทุกครั้ง)
  let ui = null;

  function icon(name) {
    return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }

  function buildBar() {
    const anchor = document.querySelector('#resultsSidebar .table-buttons');
    if (!anchor || bar) return;
    bar = document.createElement('div');
    bar.className = 'history-bar';
    bar.innerHTML = `
      <div class="history-row">
        <button type="button" class="secondary-button history-open" hidden>${icon('history')}<span class="btn-label"></span></button>
        <span class="history-account">
          <button type="button" class="secondary-button history-signin" hidden>${icon('user')}<span class="btn-label"></span></button>
          <span class="history-user" hidden><span class="history-user-mount"></span></span>
        </span>
      </div>
      <p class="history-status" role="status" aria-live="polite"></p>
      <button type="button" class="history-continue" hidden></button>`;
    ui = {
      open: bar.querySelector('.history-open'),
      openLabel: bar.querySelector('.history-open .btn-label'),
      signin: bar.querySelector('.history-signin'),
      signinLabel: bar.querySelector('.history-signin .btn-label'),
      user: bar.querySelector('.history-user'),
      userMount: bar.querySelector('.history-user-mount'),
      status: bar.querySelector('.history-status'),
      cont: bar.querySelector('.history-continue'),
    };
    anchor.parentNode.insertBefore(bar, anchor);
    // หมายเหตุใต้ตาราง "ผลเก็บไว้เฉพาะตอนเปิดหน้านี้" ไม่จริงสำหรับคนที่ sign in → สลับเป็นข้อความของเรา
    ui.noteGuest = document.querySelector('#resultsSidebar .note[data-i18n="tableNote"]');
    if (ui.noteGuest) {
      ui.noteUser = document.createElement('p');
      ui.noteUser.className = 'note history-note';
      ui.noteUser.hidden = true;
      ui.noteGuest.after(ui.noteUser);
    }
    ui.open.addEventListener('click', openDialog);
    ui.signin.addEventListener('click', signIn);
    ui.cont.addEventListener('click', () => state.latest && openSession(state.latest.id));
    renderBar();
  }

  function renderBar() {
    if (!bar || !ui) return;
    try {
      ui.openLabel.textContent = t('mySessions');
      ui.signinLabel.textContent = t('signIn');
      const signedIn = isSignedIn();
      ui.open.hidden = !signedIn; // ประวัติมีเฉพาะคนที่ login
      if (ui.noteGuest && ui.noteUser) {
        ui.noteGuest.style.display = signedIn ? 'none' : '';
        ui.noteUser.hidden = !signedIn;
        ui.noteUser.textContent = t('tableNoteUser');
      }
      ui.signin.hidden = !state.clerk || signedIn;
      ui.user.hidden = !signedIn;
      if (signedIn) {
        const message = state.message ? t(state.message[0], state.message[1]) : '';
        ui.status.textContent = message ? `${t('savingUser')} · ${message}` : t('savingUser');
      } else {
        ui.status.textContent = t('notSavedGuest');
      }
      const showContinue = Boolean(
        signedIn && state.latest && !state.sessionId && state.app && state.app.rowCount() === 0
      );
      ui.cont.hidden = !showContinue;
      if (showContinue) ui.cont.textContent = t('continueLast', { n: state.latest.runCount });
    } catch (error) {
      // แถบประวัติพังต้องไม่ทำให้การทดลองพัง
      console.warn('History bar could not update:', error);
    }
  }

  function isSignedIn() {
    return Boolean(state.clerk && state.clerk.isSignedIn);
  }

  async function refreshLatest() {
    if (!state.app || !isSignedIn()) {
      state.latest = null;
      renderBar();
      return;
    }
    try {
      const data = await API.request(`/history?sim=${encodeURIComponent(state.app.sim)}`);
      state.latest = data.sessions[0] || null;
    } catch {
      state.latest = null;
    }
    renderBar();
  }

  // ---------------------------------------------------------------------------
  // เปิด session เดิม → ใส่ผลกลับเข้าตารางและกราฟ
  // ---------------------------------------------------------------------------
  async function openSession(id) {
    const data = await API.request(`/history/${encodeURIComponent(id)}`);
    const rows = data.runs.map((run) => ({ ...run.params, mode: run.mode, ...run.summary }));
    state.app.setRows(rows);
    state.sessionId = data.session.id;
    state.lastRunNo = data.session.runCount;
    state.latest = null;
    state.message = ['opened', { name: displayName(data.session) }];
    API.setUnsavedResults(false); // อยู่ในประวัติแล้ว
    renderBar();
  }

  function displayName(session) {
    if (session.name) return session.name;
    return t('untitled', { date: formatDate(session.createdAt) });
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleString(lang() === 'th' ? 'th-TH' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  // ---------------------------------------------------------------------------
  // หน้าต่าง "ประวัติการทดลอง"
  // ---------------------------------------------------------------------------
  let dialog = null;
  let lastFocused = null;

  function buildDialog() {
    if (dialog) return dialog;
    const backdrop = document.createElement('div');
    backdrop.className = 'ts-backdrop hs-backdrop';
    backdrop.hidden = true;
    const panel = document.createElement('div');
    panel.className = 'ts-dialog hs-dialog';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'hsTitle');
    panel.innerHTML = `
      <div class="ts-head">
        <h2 id="hsTitle"></h2>
        <button type="button" class="secondary-button ts-close hs-x">${icon('close')}</button>
      </div>
      <p class="hs-note"></p>
      <button type="button" class="primary-button hs-new">${icon('plus')}<span class="btn-label"></span></button>
      <p class="hs-status" role="status" aria-live="polite"></p>
      <ul class="hs-list"></ul>`;
    document.body.append(backdrop, panel);
    dialog = { backdrop, panel, list: panel.querySelector('.hs-list'), status: panel.querySelector('.hs-status') };
    backdrop.addEventListener('click', closeDialog);
    panel.querySelector('.hs-x').addEventListener('click', closeDialog);
    panel.querySelector('.hs-new').addEventListener('click', () => {
      newSession();
      state.app.setRows([]);
      closeDialog();
    });
    // ฟังทั้งหน้า: หลังเปลี่ยนชื่อ/ลบ ช่องที่ focus อยู่หายไป focus เลยหลุดออกจากหน้าต่าง
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && !panel.hidden) {
          event.preventDefault();
          event.stopPropagation();
          closeDialog();
        }
      },
      true
    );
    return dialog;
  }

  function translateDialog() {
    if (!dialog) return;
    dialog.panel.querySelector('#hsTitle').textContent = t('dialogTitle');
    dialog.panel.querySelector('.hs-x').setAttribute('aria-label', t('close'));
    dialog.panel.querySelector('.hs-new .btn-label').textContent = t('newSession');
    dialog.panel.querySelector('.hs-note').textContent = t('userNote');
  }

  async function openDialog() {
    buildDialog();
    lastFocused = document.activeElement;
    translateDialog();
    dialog.backdrop.hidden = false;
    dialog.panel.hidden = false;
    document.documentElement.classList.add('dd-open'); // ล็อกการเลื่อนหน้า (style เดียวกับหน้าต่าง Save to Drive)
    document.body.classList.add('dd-open');
    dialog.panel.querySelector('.hs-x').focus();
    await loadList();
  }

  function closeDialog() {
    if (!dialog || dialog.panel.hidden) return;
    dialog.backdrop.hidden = true;
    dialog.panel.hidden = true;
    document.documentElement.classList.remove('dd-open');
    document.body.classList.remove('dd-open');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  async function loadList() {
    dialog.status.textContent = t('loading');
    dialog.list.replaceChildren();
    try {
      const data = await API.request(`/history?sim=${encodeURIComponent(state.app.sim)}`);
      dialog.status.textContent = data.sessions.length ? '' : t('empty');
      data.sessions.forEach((session) => dialog.list.append(sessionItem(session)));
    } catch {
      dialog.status.textContent = t('loadError');
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text; // ชื่อ session มาจากผู้ใช้ → ใส่เป็นข้อความเสมอ
    return node;
  }

  function sessionItem(session) {
    const li = el('li', 'hs-item');
    const info = el('div', 'hs-info');
    const name = el('strong', 'hs-name', displayName(session));
    const runsText = session.runCount === 1 ? t('oneRun') : t('runs', { n: session.runCount });
    const meta = el('span', 'hs-meta', `${runsText} · ${formatDate(session.updatedAt)}`);
    info.append(name, meta);
    if (session.id === state.sessionId) info.append(el('span', 'hs-badge', t('current')));
    const actions = el('div', 'hs-actions');

    const openBtn = el('button', 'secondary-button', t('open'));
    openBtn.type = 'button';
    openBtn.addEventListener('click', async () => {
      try {
        await openSession(session.id);
        closeDialog();
      } catch {
        dialog.status.textContent = t('loadError');
      }
    });

    const renameBtn = el('button', 'secondary-button', t('rename'));
    renameBtn.type = 'button';
    renameBtn.addEventListener('click', () => {
      const input = el('input', 'hs-rename');
      input.type = 'text';
      input.maxLength = 80;
      input.value = session.name;
      input.placeholder = displayName(session);
      const save = el('button', 'primary-button', t('save'));
      save.type = 'button';
      const cancel = el('button', 'secondary-button', t('cancel'));
      cancel.type = 'button';
      const submit = async () => {
        try {
          const data = await API.request(`/history/${encodeURIComponent(session.id)}`, {
            method: 'PATCH',
            body: { name: input.value },
          });
          li.replaceWith(sessionItem(data.session));
        } catch (error) {
          dialog.status.textContent = error.message;
        }
      };
      save.addEventListener('click', submit);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') submit();
      });
      cancel.addEventListener('click', () => li.replaceWith(sessionItem(session)));
      info.replaceChildren(input);
      actions.replaceChildren(save, cancel);
      input.focus();
    });

    const deleteBtn = el('button', 'secondary-button hs-danger', t('delete'));
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => {
      const yes = el('button', 'secondary-button hs-danger', t('yesDelete'));
      yes.type = 'button';
      const no = el('button', 'secondary-button', t('cancel'));
      no.type = 'button';
      yes.addEventListener('click', async () => {
        try {
          await API.request(`/history/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
          if (session.id === state.sessionId) state.sessionId = null; // ผลใหม่จะเริ่ม session ใหม่
          li.remove();
          if (!dialog.list.children.length) dialog.status.textContent = t('empty');
          refreshLatest();
        } catch (error) {
          dialog.status.textContent = error.message;
        }
      });
      no.addEventListener('click', () => li.replaceWith(sessionItem(session)));
      actions.replaceChildren(el('span', 'hs-confirm', t('confirmDelete')), yes, no);
    });

    actions.append(openBtn, renameBtn, deleteBtn);
    li.append(info, actions);
    return li;
  }

  // ---------------------------------------------------------------------------
  // Clerk (ไม่บังคับ) — sign in ด้วย Google
  // ---------------------------------------------------------------------------
  function frontendApiFromKey(key) {
    // pk_test_<base64("xxx.clerk.accounts.dev$")>
    const match = /^pk_(test|live)_([A-Za-z0-9+/=]+)$/.exec(key || '');
    if (!match) return null;
    try {
      const host = global.atob(match[2]).replace(/\$$/, '');
      return /^[a-z0-9.-]+$/i.test(host) ? host : null;
    } catch {
      return null;
    }
  }

  function loadScript(src, attributes = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      Object.entries(attributes).forEach(([k, v]) => script.setAttribute(k, v));
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.append(script);
    });
  }

  async function loadClerk(publishableKey) {
    const host = frontendApiFromKey(publishableKey);
    if (!host) return;
    try {
      await loadScript(`https://${host}/npm/@clerk/ui@1/dist/ui.browser.js`);
      await loadScript(`https://${host}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, {
        'data-clerk-publishable-key': publishableKey,
      });
      const clerk = global.Clerk;
      // หลัง sign in / sign up / sign out ให้กลับมาหน้าการทดลองนี้ (ค่าเริ่มต้นของ Clerk คือ "/" ซึ่งบน
      // GitHub Pages คือ sszky.github.io ไม่ใช่หน้าโปรเจกต์)
      const here = global.location.href.split('#')[0];
      await clerk.load({
        ui: { ClerkUI: global.__internal_ClerkUICtor },
        afterSignOutUrl: here,
        signInFallbackRedirectUrl: here,
        signUpFallbackRedirectUrl: here,
      });
      state.clerk = clerk;

      // กติกาเดียวกับ Google Drive: เปิดเว็บใหม่ (รีโหลด/เปิดใหม่) หรือ login นานเกิน 8 ชั่วโมง → ออกจากระบบ
      if (clerk.isSignedIn && (API.newVisit || sessionTooOld())) {
        dropPendingRows();
        await signOutOfClerk();
        return; // Clerk โหลดหน้านี้ใหม่หลังออกจากระบบ
      }
      API.setAuthTokenProvider(() => (clerk.isSignedIn && clerk.session ? clerk.session.getToken() : null));

      let wasSignedIn = clerk.isSignedIn;
      clerk.addListener(async () => {
        const nowSignedIn = clerk.isSignedIn;
        if (nowSignedIn === wasSignedIn) return; // อัปเดตข้อมูลผู้ใช้ทั่วไป ไม่ใช่ sign in / sign out
        wasSignedIn = nowSignedIn;
        mountUser();
        if (nowSignedIn) {
          API.clearLeavingToSignIn(); // sign in เสร็จในหน้าเดิม ไม่ได้ออกไปไหน
          await saveTableToAccount();
        } else {
          // sign out → ล้างตาราง (ผลอยู่ในบัญชีแล้ว และไม่ควรค้างบนจอเครื่องที่ใช้ร่วมกัน); ผลต่อไปไม่บันทึก
          state.sessionId = null;
          state.message = null;
          closeDialog();
          if (state.app) state.app.setRows([]);
          API.setUnsavedResults(false);
        }
        renderBar();
        refreshLatest();
      });
      mountUser();
      // sign in ค้างไว้จากครั้งก่อน แต่ยิงไปแล้วก่อน Clerk โหลดเสร็จ → เก็บผลนั้นด้วย
      if (clerk.isSignedIn) await saveTableToAccount();
      renderBar();
      refreshLatest();
    } catch (error) {
      console.warn('Clerk sign-in unavailable:', error);
      state.clerk = null;
      renderBar();
    }
  }

  let userMounted = false;
  function mountUser() {
    if (!ui || !state.clerk) return;
    const holder = ui.userMount;
    try {
      if (state.clerk.isSignedIn && !userMounted) {
        state.clerk.mountUserButton(holder);
        userMounted = true;
      } else if (!state.clerk.isSignedIn && userMounted) {
        state.clerk.unmountUserButton(holder);
        userMounted = false;
      }
    } catch (error) {
      console.warn('Clerk user button:', error);
    }
  }

  /** เพิ่ง sign in และมีผลในตารางอยู่แล้ว → ส่งขึ้นไปเป็น session ใหม่ในบัญชี */
  async function saveTableToAccount() {
    if (!state.app || state.sessionId) return;
    const rows = state.app.getRows();
    if (!rows.length) return;
    try {
      const data = await API.request('/history/import', { method: 'POST', body: { sim: state.app.sim, rows } });
      // แสดงตัวเลขที่บันทึกจริง (server คำนวณใหม่ โหมดสุ่มอาจต่างจากเดิมเล็กน้อย)
      state.app.setRows(data.runs.map((run) => ({ ...run.params, mode: run.mode, ...run.summary })));
      state.sessionId = data.session.id;
      state.lastRunNo = data.session.runCount;
      state.latest = null;
      state.message = ['imported', { n: data.runs.length }];
      API.setUnsavedResults(false);
    } catch (error) {
      console.warn('History: could not save the table', error);
      state.message = ['importError', {}];
    }
  }

  function signIn() {
    if (!state.clerk) {
      state.message = ['signInError', {}];
      renderBar();
      return;
    }
    // Google sign in ของ Clerk อาจพาออกจากหน้า (redirect) → ฝากผลในตารางไว้ในแท็บนี้ก่อน
    // ฝากสำเร็จ = ไม่ต้องขึ้น "Leave site?" ตอนออกไป sign in (กลับมาแล้วใส่คืน + บันทึกให้)
    if (stashPendingRows()) API.setUnsavedResults(false);
    API.markLeavingToSignIn(); // กลับมาจากหน้า Sign in แล้วไม่นับเป็น "เปิดเว็บใหม่" (ไม่ถูก logout ทันที)
    // เปิด Google เป็น popup เพื่อให้หน้านี้ (และผลในตาราง) อยู่ต่อ
    state.clerk.openSignIn({ oauthFlow: 'popup' });
  }

  // ---------------------------------------------------------------------------
  // ออกจากระบบอัตโนมัติ (กติกาเดียวกับ Google Drive login ใน api.js)
  // ---------------------------------------------------------------------------
  const CLERK_MAX_AGE_MS = 8 * 60 * 60 * 1000; // = SESSION_MAX_AGE_S เริ่มต้นของ server (8 ชั่วโมง)
  let signingOut = false;

  function sessionTooOld() {
    const created = state.clerk && state.clerk.session && state.clerk.session.createdAt;
    return Boolean(created) && Date.now() - new Date(created).getTime() >= CLERK_MAX_AGE_MS;
  }

  async function signOutOfClerk() {
    if (signingOut || !state.clerk || !state.clerk.isSignedIn) return;
    signingOut = true;
    try {
      await state.clerk.signOut({ redirectUrl: global.location.href.split('#')[0] });
    } catch (error) {
      console.warn('Clerk sign-out failed:', error);
    } finally {
      signingOut = false;
    }
  }

  // ไม่ใช้งาน 1 ชั่วโมง (api.js นับเวลาและส่งสัญญาณนี้ทุกนาทีที่ยัง idle อยู่)
  global.addEventListener('vdl:idle', () => signOutOfClerk());
  // login นานเกิน 8 ชั่วโมง: เช็กทุกนาที และทันทีที่กลับมาที่แท็บนี้
  global.setInterval(() => sessionTooOld() && signOutOfClerk(), 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && sessionTooOld()) signOutOfClerk();
  });

  // ---------------------------------------------------------------------------
  // ฝากผลในตารางไว้ระหว่าง sign in (sessionStorage = เฉพาะแท็บนี้ หายเมื่อปิดแท็บ)
  // ---------------------------------------------------------------------------
  const PENDING_KEY = 'vdl_pending_rows';
  const PENDING_MAX_AGE_MS = 15 * 60 * 1000;

  function stashPendingRows() {
    try {
      const rows = state.app ? state.app.getRows() : [];
      if (rows.length && !state.sessionId) {
        global.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ sim: state.app.sim, at: Date.now(), rows }));
        return true;
      }
    } catch {
      /* sessionStorage ใช้ไม่ได้ (เช่น private mode) → ยังเตือนตอนออกจากหน้าเหมือนเดิม */
    }
    return false;
  }

  function dropPendingRows() {
    try {
      global.sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
  }

  /** กลับมาจาก sign in แบบ redirect → ใส่ผลที่ฝากไว้กลับเข้าตาราง */
  function restorePendingRows() {
    let pending = null;
    try {
      pending = JSON.parse(global.sessionStorage.getItem(PENDING_KEY) || 'null');
    } catch {
      pending = null;
    }
    dropPendingRows();
    if (!pending || pending.sim !== state.app.sim || !Array.isArray(pending.rows) || !pending.rows.length) return;
    if (Date.now() - pending.at > PENDING_MAX_AGE_MS || state.app.rowCount() > 0) return;
    state.app.setRows(pending.rows);
    API.setUnsavedResults(true); // ยังไม่ได้บันทึก จนกว่าจะ sign in สำเร็จ
  }

  // ---------------------------------------------------------------------------
  // API สำหรับ app.js
  // ---------------------------------------------------------------------------
  function newSession() {
    dropPendingRows();
    state.sessionId = null;
    state.lastRunNo = 0;
    state.message = null;
    renderBar();
  }

  async function attach(app) {
    state.app = app;
    await configReady;
    if (!state.config.enabled) return; // ยังไม่ได้ตั้งค่า database → ไม่แสดงอะไร
    restorePendingRows(); // ก่อนโหลด Clerk: ถ้า sign in แล้ว ผลเหล่านี้จะถูกบันทึกเข้าบัญชี
    buildBar();
    refreshLatest();
    if (state.config.clerkPublishableKey) loadClerk(state.config.clerkPublishableKey);
  }

  // ตารางว่าง/มีผล เปลี่ยน → ปุ่ม "ทำต่อ" แสดง/ซ่อน; เปลี่ยนภาษา → แปลใหม่
  new MutationObserver(() => {
    renderBar();
    translateDialog();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  global.VDL_HISTORY = { attach, newSession, refresh: renderBar };
})(window);
