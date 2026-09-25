// ============================================================
// GOOGLE DRIVE SERVICE
// Shared by all Virtual DOE Lab modules
// ============================================================

const GOOGLE_CLIENT_ID =
  "727908987568-u75jn6bubub7f67jfqr3fvpntkf08jbc.apps.googleusercontent.com";

const GOOGLE_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";

let googleTokenClient = null;


// ============================================================
// INITIALIZE GOOGLE AUTH
// ============================================================

function initializeGoogleDrive() {
  if (
    typeof google === "undefined" ||
    !google.accounts ||
    !google.accounts.oauth2
  ) {
    console.error("Google Identity Services is not loaded.");

    alert(
      "Google services are still loading. Please try again."
    );

    return false;
  }

  googleTokenClient =
    google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_DRIVE_SCOPE,

      callback: () => {
        // Callback will be replaced when uploading.
      },
    });

  return true;
}


// ============================================================
// SAVE FILE TO GOOGLE DRIVE
// ============================================================

function saveFileToGoogleDrive({
  content,
  filename,
  mimeType = "text/csv",
}) {
  if (!content) {
    alert("There is no data to save.");
    return;
  }

  if (!googleTokenClient) {
    const initialized = initializeGoogleDrive();

    if (!initialized) {
      return;
    }
  }

  googleTokenClient.callback =
    async (tokenResponse) => {
      if (tokenResponse.error) {
        console.error(
          "Google authorization error:",
          tokenResponse
        );

        alert("Google authorization failed.");
        return;
      }

      try {
        await uploadFileToGoogleDrive(
          tokenResponse.access_token,
          content,
          filename,
          mimeType
        );
      } catch (error) {
        console.error(error);

        alert(
          "Unable to save the file to Google Drive."
        );
      }
    };

  googleTokenClient.requestAccessToken({
    prompt: "",
  });
}


// ============================================================
// UPLOAD FILE
// ============================================================

async function uploadFileToGoogleDrive(
  accessToken,
  content,
  filename,
  mimeType
) {
  const metadata = {
    name: filename,
    mimeType: mimeType,
  };

  const boundary =
    "virtual_doe_lab_boundary_" + Date.now();

  const requestBody =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +

    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +

    `--${boundary}--`;

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
    }
  );

  if (!response.ok) {
    const errorData = await response.json();

    console.error(
      "Google Drive upload error:",
      errorData
    );

    throw new Error(
      "Google Drive upload failed."
    );
  }

  const uploadedFile = await response.json();

  console.log(
    "File saved to Google Drive:",
    uploadedFile
  );

  alert(
    `${uploadedFile.name} was saved to Google Drive.`
  );

  return uploadedFile;
}