// Shared Google Drive service for all Virtual DOE Lab modules.
// Replace this placeholder with your Google OAuth Web Client ID.
const GOOGLE_CLIENT_ID =
  "727908987568-u75jn6bubub7f67jfqr3fvpntkf08jbc.apps.googleusercontent.com";

const GOOGLE_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";

let driveUploadInProgress = false;

async function saveFileToGoogleDrive({
  content,
  filename,
  mimeType = "text/csv",
}) {
  if (driveUploadInProgress) {
    throw new Error("A Google Drive upload is already in progress.");
  }

  if (typeof content !== "string" || !content || !filename) {
    throw new Error("There is no file content or filename to save.");
  }

  if (
    !GOOGLE_CLIENT_ID ||
    GOOGLE_CLIENT_ID === "-" ||
    GOOGLE_CLIENT_ID.includes("PUT_YOUR_CLIENT_ID_HERE")
  ) {
    throw new Error("Please set GOOGLE_CLIENT_ID in drive.js.");
  }

  const oauth = window.google?.accounts?.oauth2;

  if (!oauth) {
    throw new Error(
      "Google Identity Services has not loaded. Check your connection and try again."
    );
  }

  driveUploadInProgress = true;

  try {
    const accessToken = await new Promise((resolve, reject) => {
      const tokenClient = oauth.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_DRIVE_SCOPE,
        include_granted_scopes: false,

        callback: (response) => {
          if (response.error) {
            reject(
              new Error(
                response.error_description || response.error
              )
            );
            return;
          }

          if (
            !response.access_token ||
            !oauth.hasGrantedAllScopes(
              response,
              GOOGLE_DRIVE_SCOPE
            )
          ) {
            reject(
              new Error("Google Drive permission was not granted.")
            );
            return;
          }

          resolve(response.access_token);
        },

        error_callback: (error) => {
          reject(
            new Error(
              error.type === "popup_closed"
                ? "Google sign-in was cancelled."
                : error.type === "popup_failed_to_open"
                  ? "Please allow popups for this website and try again."
                  : "Google sign-in could not start."
            )
          );
        },
      });

      tokenClient.requestAccessToken({ prompt: "" });
    });

    return await uploadFileToGoogleDrive(
      accessToken,
      content,
      filename,
      mimeType
    );
  } finally {
    driveUploadInProgress = false;
  }
}

async function uploadFileToGoogleDrive(
  accessToken,
  content,
  filename,
  mimeType
) {
  if (/[\r\n]/.test(mimeType)) {
    throw new Error("Invalid file MIME type.");
  }

  let boundary;

  do {
    boundary = "virtual_doe_lab_" + crypto.randomUUID();
  } while (content.includes(boundary));

  const requestBody = new Blob([
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify({
      name: filename,
      mimeType,
    }),
    `\r\n--${boundary}\r\n`,
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n`,
    content,
    `\r\n--${boundary}--\r\n`,
  ]);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files" +
        "?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type":
            `multipart/related; boundary=${boundary}`,
        },
        body: requestBody,
        signal: controller.signal,
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error?.message ||
        `Google Drive upload failed (HTTP ${response.status}).`
      );
    }

    if (!result?.id) {
      throw new Error(
        "Google Drive returned an unexpected response. Check Drive before retrying."
      );
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}