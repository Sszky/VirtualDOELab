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

  const GOOGLE_CLIENT_ID =
    "727908987568-u75jn6bubub7f67jfqr3fvpntkf08jbc.apps.googleusercontent.com";

  // นำ API Key จาก Google Cloud Console มาใส่ตรงนี้
  const GOOGLE_API_KEY =
    "AIzaSyD6NFay3ZdNL_My8lHheqBknoryOMM64Fo";

  // Google Cloud Project Number
  const GOOGLE_APP_ID = "727908987568";

  const GOOGLE_DRIVE_SCOPE =
    "https://www.googleapis.com/auth/drive.file";

  const GOOGLE_LOAD_TIMEOUT_MS = 10000;
  const UPLOAD_TIMEOUT_MS = 60000;

  // ============================================================
  // 2. STATE
  // ============================================================

  let driveOperationInProgress = false;
  let tokenClient = null;
  let accessToken = "";
  let accessTokenExpiresAt = 0;
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
  // 7. VALIDATE GOOGLE SETTINGS
  // ============================================================

  function validateGoogleSettings() {
    if (
      !GOOGLE_CLIENT_ID.endsWith(
        ".apps.googleusercontent.com"
      )
    ) {
      throw new Error(
        "Set a valid Google OAuth Client ID in drive.js."
      );
    }

    if (
      !GOOGLE_API_KEY ||
      GOOGLE_API_KEY ===
        "PUT_YOUR_GOOGLE_API_KEY_HERE"
    ) {
      throw new Error(
        "Add your Google API Key to GOOGLE_API_KEY in drive.js."
      );
    }

    if (!/^\d+$/.test(GOOGLE_APP_ID)) {
      throw new Error(
        "Set GOOGLE_APP_ID to your Google Cloud Project Number."
      );
    }
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
  // 9. GOOGLE OAUTH
  // ============================================================

  async function requestDriveAccessToken() {
    if (
      accessToken &&
      Date.now() < accessTokenExpiresAt
    ) {
      return accessToken;
    }

    const oauth =
      await waitForGoogleIdentityServices();

    return new Promise((resolve, reject) => {
      if (!tokenClient) {
        tokenClient =
          oauth.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_DRIVE_SCOPE,

            include_granted_scopes: true,

            callback: () => {},
            error_callback: () => {},
          });
      }

      tokenClient.callback = (response) => {
        if (
          response.error ||
          !response.access_token
        ) {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Google Drive permission was not granted."
            )
          );

          return;
        }

        accessToken =
          response.access_token;

        const expiresIn =
          Number(response.expires_in) ||
          3600;

        accessTokenExpiresAt =
          Date.now() +
          Math.max(0, expiresIn - 60) *
            1000;

        resolve(accessToken);
      };

      tokenClient.error_callback = (
        error
      ) => {
        const errorMessages = {
          popup_closed:
            "Google sign-in was cancelled.",

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

      tokenClient.requestAccessToken({
        prompt: accessToken
          ? ""
          : "consent",
      });
    });
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
  // 12. CREATE MULTIPART REQUEST
  // ============================================================

  function createMultipartBoundary(
    content
  ) {
    let boundary;

    do {
      const id =
        global.crypto?.randomUUID?.() ||
        `${Date.now()}_${Math.random()
          .toString(16)
          .slice(2)}`;

      boundary =
        `virtual_doe_lab_${id}`;
    } while (content.includes(boundary));

    return boundary;
  }

  // ============================================================
  // 13. UPLOAD FILE TO SELECTED FOLDER
  // ============================================================

  async function uploadFileToGoogleDrive(
    token,
    content,
    filename,
    mimeType,
    folderId
  ) {
    if (/\r|\n/.test(mimeType)) {
      throw new Error(
        "Invalid file MIME type."
      );
    }

    const metadata = {
      name: filename,
      mimeType,
    };

    // บันทึกไฟล์ลงโฟลเดอร์ที่เลือก
    if (folderId) {
      metadata.parents = [folderId];
    }

    const boundary =
      createMultipartBoundary(content);

    const requestBody = new Blob([
      `--${boundary}\r\n`,

      "Content-Type: application/json; " +
        "charset=UTF-8\r\n\r\n",

      JSON.stringify(metadata),

      `\r\n--${boundary}\r\n`,

      `Content-Type: ${mimeType}; ` +
        "charset=UTF-8\r\n\r\n",

      content,

      `\r\n--${boundary}--\r\n`,
    ]);

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      UPLOAD_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        "https://www.googleapis.com/" +
          "upload/drive/v3/files" +
          "?uploadType=multipart" +
          "&fields=id,name,webViewLink,parents",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              `multipart/related; ` +
              `boundary=${boundary}`,
          },

          body: requestBody,
          signal: controller.signal,
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          accessToken = "";
          accessTokenExpiresAt = 0;
        }

        throw new Error(
          result?.error?.message ||
            `Google Drive upload failed ` +
              `(HTTP ${response.status}).`
        );
      }

      if (!result?.id) {
        throw new Error(
          "Google Drive returned an unexpected response."
        );
      }

      return result;
    } catch (error) {
      if (
        error.name === "AbortError"
      ) {
        throw new Error(
          "Google Drive upload timed out. Please try again."
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ============================================================
  // 14. PUBLIC SAVE FUNCTION
  // ============================================================

  async function saveFileToGoogleDrive({
    content,
    filename,
    mimeType = "text/csv",
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

    validateGoogleSettings();

    driveOperationInProgress = true;

    try {
      const token =
        await requestDriveAccessToken();

      return await uploadFileToGoogleDrive(
        token,
        content,
        filename,
        mimeType,
        folderId
      );
    } finally {
      driveOperationInProgress = false;
    }
  }

  // ============================================================
  // 15. SAVE EXPERIMENT RESULTS
  // ============================================================

  async function saveExperimentResultsToDrive() {
    if (driveOperationInProgress) {
      return;
    }

    if (!hasExperimentData()) {
      setStatus(
        message("empty"),
        "error"
      );

      return;
    }

    setStatus("");
    setButtonState(
      "authorizing",
      true
    );

    try {
      validateGoogleSettings();

      driveOperationInProgress = true;

      const csv = getExperimentCSV();

      if (!csv.trim()) {
        throw new Error(
          "No experiment CSV data was found."
        );
      }

      // ขอสิทธิ์ Google Drive
      const token =
        await requestDriveAccessToken();

      // เปิดหน้าต่างเลือกโฟลเดอร์
      setButtonState(
        "choosingFolder",
        true
      );

      const folder =
        await chooseGoogleDriveFolder(
          token
        );

      // ผู้ใช้กด Cancel
      if (!folder) {
        setStatus(
          message("cancelled")
        );

        return;
      }

      // อัปโหลดเข้าโฟลเดอร์ที่เลือก
      setButtonState("saving", true);

      const uploadedFile =
        await uploadFileToGoogleDrive(
          token,
          csv,
          getExportFilename(),
          "text/csv",
          folder.id
        );

      setButtonState("saved", true);

      const resultMessage =
        document.createDocumentFragment();

      resultMessage.append(
        `${message("success")} ` +
          `${folder.name}. `
      );

      if (uploadedFile.webViewLink) {
        const link =
          document.createElement("a");

        link.href =
          uploadedFile.webViewLink;

        link.target = "_blank";
        link.rel =
          "noopener noreferrer";

        link.textContent =
          message("open");

        resultMessage.append(link);
      }

      setStatus(
        resultMessage,
        "success"
      );
    } catch (error) {
      console.error(
        "Google Drive save failed:",
        error
      );

      setStatus(
        error.message ||
          message("genericError"),
        "error"
      );
    } finally {
      driveOperationInProgress = false;

      setButtonState(
        "idle",
        false
      );
    }
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
          if (
            !driveOperationInProgress
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
      validateGoogleSettings();

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