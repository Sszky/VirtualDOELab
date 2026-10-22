// ============================================================
// SHARED GOOGLE DRIVE SERVICE — VIRTUAL DOE LAB
// ============================================================
// ต้องเปิด API ใน Google Cloud:
// 1. Google Drive API
// 2. Google Picker API

(function (global) {
  "use strict";

  // ============================================================
  // 1. GOOGLE CLOUD SETTINGS
  // ============================================================
  // Client ID / API Key / Project Number ไม่ได้เขียนไว้ในไฟล์นี้แล้ว
  // backend ส่งมาให้จาก environment variables (GET /api/auth/config)
  // ส่วน Client Secret อยู่ที่ server เท่านั้น — ใช้แลก token และต่ออายุ session

  let GOOGLE_CLIENT_ID = "";
  let GOOGLE_API_KEY = "";
  let GOOGLE_APP_ID = "";
  let GOOGLE_DRIVE_SCOPE = "";

  const GOOGLE_LOAD_TIMEOUT_MS = 10000;

  // ============================================================
  // 2. STATE
  // ============================================================

  let driveOperationInProgress = false;
  let codeClient = null;
  let accessToken = "";
  let accessTokenExpiresAt = 0;
  let settingsPromise = null;
  let pickerLoadPromise = null;
  let languageObserver = null;

  // ============================================================
  // 3. TEXT
  // ============================================================

  const text = {
    en: {
      idle: "Save to Drive",
      authorizing: "Connecting...",
      choosingFolder: "Choose folder...",
      saving: "Saving...",
      saved: "Saved!",
      empty:
        "Run at least one experiment before saving to Drive.",
      success: "The CSV file was saved to",
      open: "Open file",
      cancelled: "Folder selection was cancelled.",
      pickerTitle:
        "Choose a folder for the CSV file",
      genericError:
        "Unable to save the CSV file to Google Drive.",
      dialogTitle: "Save results to Google Drive",
      fileLabel: "File name",
      fileNameEmpty: "Type a file name.",
      fileNameInvalid: "A file name can't contain / or \\ and must be 120 characters or less.",
      whereLabel: "Where do you want to save it?",
      optRoot: "My Drive",
      optRootHint: "Save straight into My Drive, no folder",
      optPick: "An existing folder",
      optPickHint: "Pick a folder from your Drive in the next step",
      optNew: "A new folder",
      optNewHint: "Create a folder in My Drive and save into it",
      newFolderPlaceholder: "Folder name",
      newFolderDefault: "Virtual DOE Lab",
      newFolderEmpty: "Type a name for the new folder.",
      creatingFolder: "Creating folder...",
      myDrive: "My Drive",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      busyCancelHint: "Please wait until saving finishes.",
    },

    th: {
      idle: "บันทึกลง Drive",
      authorizing: "กำลังเชื่อมต่อ...",
      choosingFolder: "กำลังเลือกโฟลเดอร์...",
      saving: "กำลังบันทึก...",
      saved: "บันทึกแล้ว",
      empty:
        "กรุณาทดลองอย่างน้อย 1 ครั้งก่อนบันทึกลง Drive",
      success: "บันทึกไฟล์ CSV ลงใน",
      open: "เปิดไฟล์",
      cancelled: "ยกเลิกการเลือกโฟลเดอร์แล้ว",
      pickerTitle:
        "เลือกโฟลเดอร์สำหรับบันทึกไฟล์ CSV",
      genericError:
        "ไม่สามารถบันทึกไฟล์ CSV ลง Google Drive ได้",
      dialogTitle: "บันทึกผลการทดลองลง Google Drive",
      fileLabel: "ชื่อไฟล์",
      fileNameEmpty: "กรุณาพิมพ์ชื่อไฟล์",
      fileNameInvalid: "ชื่อไฟล์ห้ามมี / หรือ \\ และยาวไม่เกิน 120 ตัวอักษร",
      whereLabel: "ต้องการบันทึกไว้ที่ไหน?",
      optRoot: "ไดรฟ์ของฉัน (My Drive)",
      optRootHint: "บันทึกลง My Drive โดยตรง ไม่ต้องเลือกโฟลเดอร์",
      optPick: "โฟลเดอร์ที่มีอยู่แล้ว",
      optPickHint: "เลือกโฟลเดอร์ใน Drive ในขั้นตอนถัดไป",
      optNew: "สร้างโฟลเดอร์ใหม่",
      optNewHint: "สร้างโฟลเดอร์ใน My Drive แล้วบันทึกไฟล์ไว้ในนั้น",
      newFolderPlaceholder: "ชื่อโฟลเดอร์",
      newFolderDefault: "Virtual DOE Lab",
      newFolderEmpty: "กรุณาพิมพ์ชื่อโฟลเดอร์ใหม่",
      creatingFolder: "กำลังสร้างโฟลเดอร์...",
      myDrive: "ไดรฟ์ของฉัน",
      save: "บันทึก",
      cancel: "ยกเลิก",
      close: "ปิด",
      busyCancelHint: "กรุณารอให้บันทึกเสร็จก่อน",
    },
  };

  // ============================================================
  // 4. LANGUAGE AND UI HELPERS
  // ============================================================

  function currentLanguage() {
    return document.documentElement.lang
      .toLowerCase()
      .startsWith("th")
      ? "th"
      : "en";
  }

  function message(key) {
    return text[currentLanguage()][key];
  }

  function setButtonState(key, disabled) {
    const button =
      document.getElementById("driveButton");

    const label = button?.querySelector(
      ".drive-label, .btn-label"
    );

    if (!button) {
      return;
    }

    button.disabled = disabled;

    if (label) {
      label.textContent = message(key);
    } else {
      button.textContent = message(key);
    }
  }

  function setStatus(content = "", type = "") {
    const status =
      document.getElementById("driveStatus");

    if (!status) {
      return;
    }

    status.className =
      `drive-status${type ? ` is-${type}` : ""}`;

    status.replaceChildren();

    if (content instanceof Node) {
      status.append(content);
    } else {
      status.textContent = content;
    }
  }

  // ============================================================
  // 5. GET EXPORT CONFIG FROM APP.JS
  // ============================================================

  function getDriveExportConfig() {
    return global.DRIVE_EXPORT_CONFIG || {};
  }

  function hasExperimentData() {
    const config = getDriveExportConfig();

    if (typeof config.hasData === "function") {
      return Boolean(config.hasData());
    }

    // ใช้เป็น fallback ถ้า app.js ไม่มี DRIVE_EXPORT_CONFIG
    return [
      ...document.querySelectorAll(
        "#resultsTableBody tr"
      ),
    ].some(
      (row) =>
        row.querySelectorAll("td").length > 1
    );
  }

  function getExportFilename() {
    const config = getDriveExportConfig();

    if (
      typeof config.createFilename === "function"
    ) {
      const filename = config.createFilename();

      if (filename) {
        return filename;
      }
    }

    if (
      typeof global.driveExportFilename ===
      "function"
    ) {
      const filename =
        global.driveExportFilename();

      if (filename) {
        return filename;
      }
    }

    const simulatorName =
      document.body.dataset.sim || "experiment";

    return (
      `${simulatorName}-experiments-` +
      `${Date.now()}.csv`
    );
  }

  // ============================================================
  // 6. CREATE CSV FROM RESULTS TABLE
  // ============================================================

  function escapeCSV(value) {
    const stringValue = String(value ?? "")
      .replace(/\r?\n/g, " ");

    if (/[",]/.test(stringValue)) {
      return (
        `"${stringValue.replace(/"/g, '""')}"`
      );
    }

    return stringValue;
  }

  function createCSVFromResultsTable() {
    const table =
      document.getElementById("resultsTable");

    if (!table) {
      return "";
    }

    const headerCells = [
      ...table.querySelectorAll("thead th"),
    ];

    const dataRows = [
      ...table.querySelectorAll("tbody tr"),
    ]
      .map((row) => [
        ...row.querySelectorAll("td"),
      ])
      .filter((cells) => cells.length > 1);

    if (
      headerCells.length === 0 ||
      dataRows.length === 0
    ) {
      return "";
    }

    const rows = [
      headerCells.map((cell) =>
        cell.textContent.trim()
      ),

      ...dataRows.map((cells) =>
        cells.map((cell) =>
          cell.textContent.trim()
        )
      ),
    ];

    return rows
      .map((row) =>
        row.map(escapeCSV).join(",")
      )
      .join("\r\n");
  }

  function getExperimentCSV() {
    const config = getDriveExportConfig();

    if (
      typeof config.createCSVContent ===
      "function"
    ) {
      const csv = config.createCSVContent();

      if (
        typeof csv === "string" &&
        csv.trim()
      ) {
        return csv;
      }
    }

    if (
      typeof global.createCSVContent ===
      "function"
    ) {
      const csv =
        global.createCSVContent();

      if (
        typeof csv === "string" &&
        csv.trim()
      ) {
        return csv;
      }
    }

    return createCSVFromResultsTable();
  }

  // ============================================================
  // 7. LOAD GOOGLE SETTINGS FROM THE SERVER
  // ============================================================

  function api() {
    if (!global.VDL_API) {
      throw new Error(
        "assets/api.js must be loaded before drive.js."
      );
    }
    return global.VDL_API;
  }

  async function loadGoogleSettings() {
    if (!settingsPromise) {
      settingsPromise = api()
        .request("/auth/config")
        .then((config) => {
          GOOGLE_CLIENT_ID = config.clientId;
          GOOGLE_API_KEY = config.apiKey;
          GOOGLE_APP_ID = config.appId;
          GOOGLE_DRIVE_SCOPE = config.scope;
        })
        .catch((error) => {
          settingsPromise = null; // ลองใหม่ได้ในการกดครั้งถัดไป
          throw error;
        });
    }
    return settingsPromise;
  }

  // ============================================================
  // 8. WAIT FOR GOOGLE SCRIPT
  // ============================================================

  async function waitFor(
    check,
    errorMessage
  ) {
    const startedAt = Date.now();

    while (!check()) {
      if (
        Date.now() - startedAt >=
        GOOGLE_LOAD_TIMEOUT_MS
      ) {
        throw new Error(errorMessage);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );
    }
  }

  async function waitForGoogleIdentityServices() {
    await waitFor(
      () =>
        Boolean(
          global.google?.accounts?.oauth2
        ),
      "Google Identity Services did not load. " +
        "Check your internet connection and script URL."
    );

    return global.google.accounts.oauth2;
  }

  // ============================================================
  // 9. GOOGLE OAUTH (session อยู่ที่ server)
  // ============================================================
  // 1) ถาม server ก่อนว่ายังมี Google session อยู่ไหม (cookie แบบ httpOnly)
  //    → ถ้ามี ได้ access token ทันทีโดยไม่ต้องเปิด popup (ต่ออายุให้อัตโนมัติ)
  // 2) ถ้าไม่มี → เปิด popup ของ Google ได้ "code" ครั้งเดียว
  //    → ส่งให้ server แลกเป็น token ด้วย Client Secret แล้วเก็บเป็น session

  function rememberToken(data) {
    accessToken = data.accessToken;
    accessTokenExpiresAt = Number(data.expiresAt) || 0;
    api().setSignedIn(true);
    return accessToken;
  }

  // api.js ออกจากระบบให้ (ไม่ได้ใช้งาน 1 ชม.) → ลืม token ที่จำไว้ในหน้านี้
  global.addEventListener("vdl:signed-out", () => {
    accessToken = "";
    accessTokenExpiresAt = 0;
  });

  function requestAuthorizationCode(oauth) {
    return new Promise((resolve, reject) => {
      if (!codeClient) {
        codeClient = oauth.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_DRIVE_SCOPE,
          ux_mode: "popup",
          // ทุกครั้งที่ login ใหม่ ให้เลือกบัญชี Google เอง (เครื่องในห้องแล็บอาจใช้ร่วมกัน)
          select_account: true,
          callback: () => {},
          error_callback: () => {},
        });
      }

      codeClient.callback = (response) => {
        if (response.error || !response.code) {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Google Drive permission was not granted."
            )
          );
          return;
        }
        resolve(response.code);
      };

      codeClient.error_callback = (error) => {
        const errorMessages = {
          popup_closed: "Google sign-in was cancelled.",
          popup_failed_to_open:
            "Google sign-in popup was blocked. " +
            "Allow popups and try again.",
        };
        reject(
          new Error(
            errorMessages[error.type] ||
              "Google sign-in could not start."
          )
        );
      };

      codeClient.requestCode();
    });
  }

  async function requestDriveAccessToken() {
    // ถ้าเพิ่งเปิดเว็บใหม่/รีโหลด api.js กำลังล้าง session เก่าอยู่ — รอให้เสร็จก่อน
    await api().sessionReady;

    if (accessToken && Date.now() < accessTokenExpiresAt) {
      return accessToken;
    }

    // มี session เดิมอยู่แล้ว?
    try {
      return rememberToken(await api().request("/auth/token"));
    } catch (error) {
      if (error.status !== 401) {
        throw error;
      }
    }

    // ยังไม่ได้ login → เปิด popup ของ Google
    const oauth = await waitForGoogleIdentityServices();
    const code = await requestAuthorizationCode(oauth);

    return rememberToken(
      await api().request("/auth/google", {
        method: "POST",
        body: { code },
      })
    );
  }

  async function signOutOfGoogleDrive() {
    await api().signOut();
  }

  // ============================================================
  // 10. LOAD GOOGLE PICKER
  // ============================================================

  async function loadGooglePicker() {
    if (
      global.google?.picker?.PickerBuilder
    ) {
      return;
    }

    await waitFor(
      () => Boolean(global.gapi?.load),
      "Google Picker API did not load. " +
        "Check the api.js script in index.html."
    );

    if (!pickerLoadPromise) {
      pickerLoadPromise =
        new Promise((resolve, reject) => {
          global.gapi.load("picker", {
            callback: resolve,

            onerror: () => {
              reject(
                new Error(
                  "Google Picker could not load."
                )
              );
            },

            timeout:
              GOOGLE_LOAD_TIMEOUT_MS,

            ontimeout: () => {
              reject(
                new Error(
                  "Google Picker loading timed out."
                )
              );
            },
          });
        });
    }

    try {
      await pickerLoadPromise;
    } catch (error) {
      pickerLoadPromise = null;
      throw error;
    }

    if (
      !global.google?.picker?.PickerBuilder
    ) {
      pickerLoadPromise = null;

      throw new Error(
        "Google Picker loaded without the Picker library."
      );
    }
  }

  // ============================================================
  // 11. OPEN FOLDER PICKER
  // ============================================================

  async function chooseGoogleDriveFolder(
    token
  ) {
    await loadGooglePicker();

    return new Promise(
      (resolve, reject) => {
        try {
          const pickerApi =
            global.google.picker;

          const folderView =
            new pickerApi.DocsView(
              pickerApi.ViewId.FOLDERS
            )
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true);

          const pickerBuilder =
            new pickerApi.PickerBuilder()
              .addView(folderView)

              .setSelectableMimeTypes(
                "application/vnd.google-apps.folder"
              )

              .setOAuthToken(token)
              .setDeveloperKey(
                GOOGLE_API_KEY
              )
              .setAppId(GOOGLE_APP_ID)
              .setTitle(
                message("pickerTitle")
              )

              .setCallback((data) => {
                const action =
                  data[
                    pickerApi.Response.ACTION
                  ];

                if (
                  action ===
                  pickerApi.Action.PICKED
                ) {
                  const documents =
                    data[
                      pickerApi.Response
                        .DOCUMENTS
                    ] || [];

                  const folder =
                    documents[0];

                  const folderId =
                    folder?.[
                      pickerApi.Document.ID
                    ];

                  if (!folderId) {
                    reject(
                      new Error(
                        "Google Picker did not return a folder ID."
                      )
                    );

                    return;
                  }

                  resolve({
                    id: folderId,

                    name:
                      folder[
                        pickerApi.Document
                          .NAME
                      ] ||
                      "Google Drive",
                  });
                }

                if (
                  action ===
                  pickerApi.Action.CANCEL
                ) {
                  resolve(null);
                }
              });

          if (
            global.location.protocol ===
              "http:" ||
            global.location.protocol ===
              "https:"
          ) {
            pickerBuilder.setOrigin(
              global.location.origin
            );
          }

          const picker =
            pickerBuilder.build();

          picker.setVisible(true);
        } catch (error) {
          reject(error);
        }
      }
    );
  }

  // ============================================================
  // 12. UPLOAD FILE TO SELECTED FOLDER (ผ่าน server)
  // ============================================================

  async function uploadFileToGoogleDrive(
    content,
    filename,
    folderId
  ) {
    try {
      return await api().request("/drive/upload", {
        method: "POST",
        body: { content, filename, folderId },
      });
    } catch (error) {
      if (error.status === 401) {
        // session หมดอายุ/ถูกยกเลิก → ครั้งหน้าจะขอ login ใหม่
        accessToken = "";
        accessTokenExpiresAt = 0;
      }
      throw error;
    }
  }


  // ============================================================
  // 14. PUBLIC SAVE FUNCTION
  // ============================================================

  async function saveFileToGoogleDrive({
    content,
    filename,
    folderId = "",
  }) {
    if (driveOperationInProgress) {
      throw new Error(
        "A Google Drive operation is already in progress."
      );
    }

    if (
      typeof content !== "string" ||
      !content.trim() ||
      !filename
    ) {
      throw new Error(
        "There is no file content or filename to save."
      );
    }

    driveOperationInProgress = true;

    try {
      await loadGoogleSettings();

      return await uploadFileToGoogleDrive(
        content,
        filename,
        folderId
      );
    } finally {
      driveOperationInProgress = false;
    }
  }

  // ============================================================
  // 15. SAVE DIALOG (เลือกที่บันทึก + ล็อกหน้าเว็บไว้จนกว่าจะบันทึกหรือยกเลิก)
  // ============================================================
  // ตัวเลือก: My Drive โดยตรง / โฟลเดอร์ที่มีอยู่ (Google Picker) / สร้างโฟลเดอร์ใหม่
  // ระหว่างที่ dialog เปิด: หน้าเว็บเลื่อนไม่ได้ กดอะไรข้างหลังไม่ได้
  // ปิดได้ด้วยปุ่ม ยกเลิก / X / Esc เท่านั้น (ยกเว้นตอนกำลังบันทึก)

  const DIALOG_STYLE = `
    .dd-dialog { width: min(92vw, 440px); }
    .dd-file { display: block; margin: 10px 0 14px; }
    .dd-file-label { display: block; margin-bottom: 4px; font-weight: 600; font-size: 0.95rem; }
    .dd-file-row { display: flex; align-items: center; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
    .dd-file-row:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-100); }
    .dd-file-name { flex: 1; min-width: 0; padding: 8px 10px; border: 0; outline: 0; font: inherit; background: transparent; }
    .dd-file-ext { padding: 8px 10px; color: var(--muted); background: var(--bg); border-left: 1px solid var(--line); }
    .dd-where { margin: 0 0 8px; font-weight: 600; font-size: 0.95rem; }
    .dd-options { display: grid; gap: 8px; margin: 0 0 12px; padding: 0; border: 0; }
    .dd-option { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; align-items: start;
      padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; cursor: pointer; }
    .dd-option:has(input:checked) { border-color: var(--blue); background: var(--blue-50); }
    .dd-option input[type="radio"] { margin: 3px 0 0; grid-row: span 2; accent-color: var(--blue); }
    .dd-option-title { font-weight: 600; }
    .dd-option-hint { color: var(--muted); font-size: 0.8rem; }
    .dd-new-name { grid-column: 2; width: 100%; margin-top: 6px; padding: 8px 10px;
      border: 1px solid var(--line); border-radius: 8px; font: inherit; }
    .dd-new-name[hidden] { display: none; }
    .dd-status { min-height: 1.3em; margin: 0 0 12px; font-size: 0.85rem; color: var(--muted); }
    .dd-status.is-error { color: #b91c1c; }
    .dd-status.is-success { color: #15803d; }
    .dd-status a { margin-left: 4px; color: var(--blue); font-weight: 600; }
    .dd-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .dd-dialog button:disabled, .dd-dialog input:disabled { opacity: 0.55; cursor: not-allowed; }
    html.dd-open, body.dd-open { overflow: hidden; }
  `;

  let dialog = null; // { backdrop, panel, ...elements }
  let dialogBusy = false;
  let dialogDone = false;
  let lastFocused = null;

  function buildDialog() {
    if (dialog) {
      return dialog;
    }

    const style = document.createElement("style");
    style.textContent = DIALOG_STYLE;
    document.head.append(style);

    const backdrop = document.createElement("div");
    backdrop.className = "ts-backdrop dd-backdrop";
    backdrop.hidden = true;

    const panel = document.createElement("div");
    panel.className = "ts-dialog dd-dialog";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "ddTitle");
    panel.innerHTML = `
      <div class="ts-head">
        <h2 id="ddTitle"></h2>
        <button type="button" class="secondary-button ts-close dd-x" aria-label="">
          <svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg>
        </button>
      </div>
      <label class="dd-file">
        <span class="dd-file-label"></span>
        <span class="dd-file-row">
          <input type="text" class="dd-file-name" maxlength="116" spellcheck="false">
          <span class="dd-file-ext">.csv</span>
        </span>
      </label>
      <p class="dd-where"></p>
      <fieldset class="dd-options">
        <label class="dd-option">
          <input type="radio" name="ddTarget" value="root" checked>
          <span class="dd-option-title" data-dd="optRoot"></span>
          <span class="dd-option-hint" data-dd="optRootHint"></span>
        </label>
        <label class="dd-option">
          <input type="radio" name="ddTarget" value="pick">
          <span class="dd-option-title" data-dd="optPick"></span>
          <span class="dd-option-hint" data-dd="optPickHint"></span>
        </label>
        <label class="dd-option">
          <input type="radio" name="ddTarget" value="new">
          <span class="dd-option-title" data-dd="optNew"></span>
          <span class="dd-option-hint" data-dd="optNewHint"></span>
          <input type="text" class="dd-new-name" maxlength="100" hidden>
        </label>
      </fieldset>
      <p class="dd-status" role="status" aria-live="polite"></p>
      <div class="dd-actions">
        <button type="button" class="secondary-button dd-cancel"></button>
        <button type="button" class="primary-button dd-save"><span class="btn-label"></span></button>
      </div>`;

    document.body.append(backdrop, panel);

    dialog = {
      backdrop,
      panel,
      title: panel.querySelector("#ddTitle"),
      closeX: panel.querySelector(".dd-x"),
      fileLabel: panel.querySelector(".dd-file-label"),
      fileName: panel.querySelector(".dd-file-name"),
      where: panel.querySelector(".dd-where"),
      radios: [...panel.querySelectorAll('input[name="ddTarget"]')],
      newName: panel.querySelector(".dd-new-name"),
      status: panel.querySelector(".dd-status"),
      cancel: panel.querySelector(".dd-cancel"),
      save: panel.querySelector(".dd-save"),
      saveLabel: panel.querySelector(".dd-save .btn-label"),
    };

    dialog.radios.forEach((radio) =>
      radio.addEventListener("change", updateNewFolderInput)
    );
    dialog.cancel.addEventListener("click", closeDialog);
    dialog.closeX.addEventListener("click", closeDialog);
    dialog.save.addEventListener("click", () => {
      if (dialogDone) {
        closeDialog();
      } else {
        runSave();
      }
    });
    // พิมพ์แก้แล้วข้อความเตือนเก่าหายไป
    [dialog.fileName, dialog.newName].forEach((input) =>
      input.addEventListener("input", () => {
        if (!dialogBusy && !dialogDone) {
          setDialogStatus("");
        }
      })
    );
    // ถ้าพิมพ์ .csv เองมาด้วย ตัดออก (มี .csv ต่อท้ายให้อยู่แล้ว)
    dialog.fileName.addEventListener("blur", () => {
      dialog.fileName.value = dialog.fileName.value.replace(/\.csv\s*$/i, "").trimEnd();
    });
    dialog.fileName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runSave();
      }
    });
    dialog.newName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runSave();
      }
    });

    // กดที่ฉากหลังแล้วไม่ปิด และไม่ทำให้ focus หลุดออกจาก dialog
    // — ต้องเลือก บันทึก หรือ ยกเลิก เท่านั้น
    backdrop.addEventListener("mousedown", (event) => event.preventDefault());
    backdrop.addEventListener("click", (event) => event.stopPropagation());

    // ฟังทั้งหน้า (ไม่ใช่แค่ใน dialog) เพื่อให้ Esc / Tab ใช้ได้เสมอขณะ dialog เปิด
    document.addEventListener(
      "keydown",
      (event) => {
        if (!dialog || dialog.panel.hidden) {
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation(); // ไม่ให้ Esc ไปปิดอย่างอื่นบนหน้า (เช่น ตารางขยาย)
          closeDialog();
        }
        if (event.key === "Tab") {
          trapFocus(event);
        }
      },
      true
    );
    document.addEventListener("focusin", (event) => {
      if (dialog && !dialog.panel.hidden && !dialog.panel.contains(event.target)) {
        dialog.save.focus();
      }
    });

    return dialog;
  }

  // ให้ปุ่ม Tab วนอยู่ใน dialog เท่านั้น (ไปกดปุ่มบนหน้าเว็บข้างหลังไม่ได้)
  function trapFocus(event) {
    const focusable = [
      ...dialog.panel.querySelectorAll(
        "button, input, a[href]"
      ),
    ].filter((el) => !el.disabled && !el.hidden && el.offsetParent !== null);

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!dialog.panel.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function selectedTarget() {
    return dialog.radios.find((radio) => radio.checked)?.value || "root";
  }

  function updateNewFolderInput() {
    const isNew = selectedTarget() === "new";
    dialog.newName.hidden = !isNew;
    if (isNew) {
      if (!dialog.newName.value) {
        dialog.newName.value = message("newFolderDefault");
      }
      dialog.newName.focus();
      dialog.newName.select();
    }
  }

  function translateDialog() {
    if (!dialog) {
      return;
    }
    dialog.title.textContent = message("dialogTitle");
    dialog.closeX.setAttribute("aria-label", message("cancel"));
    dialog.fileLabel.textContent = message("fileLabel");
    dialog.where.textContent = message("whereLabel");
    dialog.panel.querySelectorAll("[data-dd]").forEach((el) => {
      el.textContent = message(el.dataset.dd);
    });
    dialog.newName.placeholder = message("newFolderPlaceholder");
    dialog.cancel.textContent = message("cancel");
    if (!dialogBusy) {
      dialog.saveLabel.textContent = message(dialogDone ? "close" : "save");
    }
  }

  function setDialogStatus(content = "", type = "") {
    dialog.status.className = `dd-status${type ? ` is-${type}` : ""}`;
    dialog.status.replaceChildren();
    if (content instanceof Node) {
      dialog.status.append(content);
    } else {
      dialog.status.textContent = content;
    }
  }

  function setDialogBusy(busy, labelKey = "save") {
    dialogBusy = busy;
    dialog.radios.forEach((radio) => (radio.disabled = busy || dialogDone));
    dialog.newName.disabled = busy || dialogDone;
    dialog.fileName.disabled = busy || dialogDone;
    dialog.cancel.disabled = busy;
    dialog.cancel.hidden = dialogDone; // บันทึกเสร็จแล้วเหลือแค่ปุ่ม ปิด
    dialog.closeX.disabled = busy;
    dialog.save.disabled = busy;
    dialog.saveLabel.textContent = message(labelKey);
    setButtonState(busy ? labelKey : "idle", true);
  }

  function lockPage(locked) {
    document.documentElement.classList.toggle("dd-open", locked);
    document.body.classList.toggle("dd-open", locked);
  }

  function openDialog() {
    if (dialog && !dialog.panel.hidden) {
      return;
    }
    buildDialog();
    lastFocused = document.activeElement;
    dialogDone = false;
    // ชื่อไฟล์เริ่มต้นจาก app.js แก้ได้ในช่อง (นามสกุล .csv ใส่ให้เอง)
    dialog.fileName.value = getExportFilename().replace(/\.csv$/i, "");
    dialog.radios[0].checked = true;
    dialog.newName.value = "";
    updateNewFolderInput();
    translateDialog();
    setDialogStatus("");
    setDialogBusy(false);
    setButtonState("idle", true); // ปุ่มบนหน้าเว็บกดซ้ำไม่ได้ระหว่างเปิด dialog
    setStatus("");

    dialog.backdrop.hidden = false;
    dialog.panel.hidden = false;
    lockPage(true);
    dialog.save.focus();
  }

  function closeDialog() {
    if (!dialog || dialog.panel.hidden) {
      return;
    }
    if (dialogBusy) {
      setDialogStatus(message("busyCancelHint"));
      return;
    }
    dialog.backdrop.hidden = true;
    dialog.panel.hidden = true;
    lockPage(false);
    setButtonState("idle", false);
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  async function runSave() {
    if (dialogBusy || dialogDone) {
      return;
    }

    const target = selectedTarget();
    const folderName = dialog.newName.value.trim();
    const baseName = dialog.fileName.value.trim().replace(/\.csv$/i, "").trim();

    if (!baseName) {
      setDialogStatus(message("fileNameEmpty"), "error");
      dialog.fileName.focus();
      return;
    }
    if (/[\\/\u0000-\u001f]/.test(baseName) || baseName.length > 116) {
      setDialogStatus(message("fileNameInvalid"), "error");
      dialog.fileName.focus();
      return;
    }
    const filename = `${baseName}.csv`;

    if (target === "new" && !folderName) {
      setDialogStatus(message("newFolderEmpty"), "error");
      dialog.newName.focus();
      return;
    }

    setDialogStatus("");
    setDialogBusy(true, "authorizing");

    try {
      driveOperationInProgress = true;

      const csv = getExperimentCSV();
      if (!csv.trim()) {
        throw new Error(message("empty"));
      }

      await loadGoogleSettings();

      // ขอสิทธิ์ Google Drive (ถ้ายังไม่มี session จะเปิด popup ให้ login)
      const token = await requestDriveAccessToken();

      let folder = { id: "", name: message("myDrive") };

      if (target === "pick") {
        setDialogBusy(true, "choosingFolder");
        // ซ่อนกล่อง dialog ระหว่างเปิด Picker แต่ฉากหลังยังล็อกหน้าเว็บอยู่
        dialog.panel.hidden = true;
        let picked;
        try {
          picked = await chooseGoogleDriveFolder(token);
        } finally {
          dialog.panel.hidden = false;
        }
        if (!picked) {
          setDialogStatus(message("cancelled"));
          return; // กลับมาที่ dialog ให้เลือกใหม่ได้
        }
        folder = picked;
      }

      if (target === "new") {
        setDialogBusy(true, "creatingFolder");
        folder = await api().request("/drive/folder", {
          method: "POST",
          body: { name: folderName },
        });
      }

      setDialogBusy(true, "saving");
      const uploadedFile = await uploadFileToGoogleDrive(
        csv,
        filename,
        folder.id
      );

      dialogDone = true;
      api().setUnsavedResults(false); // บันทึกลง Drive แล้ว ไม่ต้องเตือนตอนออกจากหน้า
      const resultMessage = document.createDocumentFragment();
      resultMessage.append(`${message("success")} ${folder.name}.`);
      if (uploadedFile.webViewLink) {
        const link = document.createElement("a");
        link.href = uploadedFile.webViewLink;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = message("open");
        resultMessage.append(link);
      }
      setDialogStatus(resultMessage.cloneNode(true), "success");
      setStatus(resultMessage, "success"); // ข้อความเดิมใต้ปุ่ม ยังเห็นหลังปิด dialog
    } catch (error) {
      console.error("Google Drive save failed:", error);
      setDialogStatus(error.message || message("genericError"), "error");
    } finally {
      driveOperationInProgress = false;
      setDialogBusy(false, dialogDone ? "close" : "save");
      setButtonState("idle", true);
      if (dialogDone) {
        dialog.save.focus();
      }
    }
  }

  function saveExperimentResultsToDrive() {
    if (driveOperationInProgress) {
      return;
    }
    if (!hasExperimentData()) {
      setStatus(message("empty"), "error");
      return;
    }
    openDialog();
  }

  // ============================================================
  // 16. INITIALIZE BUTTON
  // ============================================================

  function initializeDriveButton() {
    const button =
      document.getElementById(
        "driveButton"
      );

    if (
      !button ||
      button.dataset.driveReady ===
        "true"
    ) {
      return;
    }

    button.dataset.driveReady =
      "true";

    button.addEventListener(
      "click",
      saveExperimentResultsToDrive
    );

    setButtonState("idle", false);

    // เปลี่ยนข้อความปุ่มตามภาษา
    if (
      typeof MutationObserver ===
        "function" &&
      !languageObserver
    ) {
      languageObserver =
        new MutationObserver(() => {
          translateDialog();
          if (
            !driveOperationInProgress &&
            (!dialog || dialog.panel.hidden)
          ) {
            setButtonState(
              "idle",
              false
            );
          }
        });

      languageObserver.observe(
        document.documentElement,
        {
          attributes: true,
          attributeFilter: ["lang"],
        }
      );
    }
  }

  // ============================================================
  // 17. EXPOSE FUNCTIONS
  // ============================================================

  global.saveFileToGoogleDrive =
    saveFileToGoogleDrive;

  global.chooseGoogleDriveFolder =
    async function () {
      await loadGoogleSettings();

      const token =
        await requestDriveAccessToken();

      return chooseGoogleDriveFolder(
        token
      );
    };

  global.saveExperimentResultsToDrive =
    saveExperimentResultsToDrive;

  global.saveToGoogleDrive =
    saveExperimentResultsToDrive;

  global.signOutOfGoogleDrive =
    signOutOfGoogleDrive;

  // ============================================================
  // 18. PAGE SETUP
  // ============================================================

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initializeDriveButton
    );
  } else {
    initializeDriveButton();
  }
})(window);