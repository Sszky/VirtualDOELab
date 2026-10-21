'use strict';
/**
 * Talks to Google with the OAuth Client Secret, which only exists on the server
 * (Vercel environment variable GOOGLE_CLIENT_SECRET — never in the frontend or git).
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,parents';

const FOLDER_URL = 'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const UPLOAD_TIMEOUT_MS = 60000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Server is missing the ${name} environment variable.`);
  return value;
}

/** Values the browser needs for the Google popup + Picker. None of these are secret. */
function publicConfig() {
  return {
    clientId: requireEnv('GOOGLE_CLIENT_ID'),
    apiKey: requireEnv('GOOGLE_API_KEY'),
    appId: requireEnv('GOOGLE_APP_ID'),
    scope: DRIVE_SCOPE,
  };
}

async function tokenRequest(params) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      ...params,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const error = new Error(data.error_description || data.error || 'Google token request failed.');
    error.status = response.status === 400 || response.status === 401 ? 401 : 502;
    throw error;
  }
  return data;
}

/** Popup "code" flow: the browser gets a one-time code, the server swaps it for tokens. */
async function exchangeCode(code) {
  // 'postmessage' is the redirect_uri Google expects for the popup code flow.
  const data = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: 'postmessage' });
  return toTokens(data);
}

async function refreshAccessToken(refreshToken) {
  const data = await tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' });
  return toTokens(data, refreshToken);
}

function toTokens(data, previousRefreshToken) {
  return {
    accessToken: data.access_token,
    // keep a 60 s margin so we refresh before Google rejects the token
    accessTokenExpiresAt: Date.now() + Math.max(0, (Number(data.expires_in) || 3600) - 60) * 1000,
    refreshToken: data.refresh_token || previousRefreshToken || null,
  };
}

async function revoke(token) {
  if (!token) return;
  await fetch(REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  }).catch(() => {});
}

async function uploadFile(accessToken, { content, filename, mimeType, folderId }) {
  const metadata = { name: filename, mimeType };
  if (folderId) metadata.parents = [folderId];

  let boundary;
  do {
    boundary = `virtual_doe_lab_${require('crypto').randomUUID()}`;
  } while (content.includes(boundary));

  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}` +
    `\r\n--${boundary}\r\nContent-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}` +
    `\r\n--${boundary}--\r\n`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.id) {
      const error = new Error(result?.error?.message || `Google Drive upload failed (HTTP ${response.status}).`);
      error.status = response.status === 401 ? 401 : 502;
      throw error;
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Google Drive upload timed out. Please try again.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Create a new folder (in My Drive, or inside parentId). drive.file scope allows this. */
async function createFolder(accessToken, { name, parentId }) {
  const metadata = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) metadata.parents = [parentId];
  const response = await fetch(FOLDER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.id) {
    const error = new Error(result?.error?.message || `Could not create the folder (HTTP ${response.status}).`);
    error.status = response.status === 401 ? 401 : 502;
    throw error;
  }
  return result;
}

module.exports = { publicConfig, exchangeCode, refreshAccessToken, revoke, uploadFile, createFolder };
