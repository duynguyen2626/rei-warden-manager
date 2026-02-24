const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('rei_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(secretKey) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secretKey }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Invalid Secret Key');
  return json;
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Failed to send reset link');
  return json;
}

export async function resetPassword(token, password) {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Failed to reset password');
  return json;
}

export async function getAuthConfig() {
  const res = await fetch(`${API_BASE}/api/auth/config`);
  if (!res.ok) throw new Error('Failed to get auth config');
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/api/status`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get status');
  return res.json();
}

export async function runBackup() {
  const res = await fetch(`${API_BASE}/api/backup/run`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to start backup');
  return res.json();
}

export async function getLogs(lines = 200) {
  const res = await fetch(`${API_BASE}/api/logs?lines=${lines}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to get logs');
  return res.json();
}

export async function getRemotes() {
  const res = await fetch(`${API_BASE}/api/config/remotes`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get remotes');
  return res.json();
}

export async function addRemote(data) {
  const res = await fetch(`${API_BASE}/api/config/remote`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to add remote');
  }
  return res.json();
}

export async function deleteRemote(name) {
  const res = await fetch(`${API_BASE}/api/config/remote/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete remote');
  return res.json();
}

export async function testRemote(name) {
  const res = await fetch(`${API_BASE}/api/config/remote/${encodeURIComponent(name)}/test`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || 'Connection test failed');
    err.console = json.console; // Preserve logs for debugging
    throw err;
  }
  return json;
}

export async function getRemoteFolders(name) {
  const res = await fetch(
    `${API_BASE}/api/config/remote/${encodeURIComponent(name)}/folders`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error('Failed to get folders');
  return res.json();
}

export async function getRetention() {
  const res = await fetch(`${API_BASE}/api/config/retention`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to get retention settings');
  return res.json();
}

export async function saveRetention(data) {
  const res = await fetch(`${API_BASE}/api/config/retention`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save retention settings');
  return res.json();
}

export async function changePassword(data) {
  const res = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Failed to change password');
  return json;
}

export async function getTelegram() {
  const res = await fetch(`${API_BASE}/api/config/telegram`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get Telegram settings');
  return res.json();
}

export async function saveTelegram(data) {
  const res = await fetch(`${API_BASE}/api/config/telegram`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save Telegram settings');
  return res.json();
}

export async function testTelegram() {
  const res = await fetch(`${API_BASE}/api/config/telegram/test`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Telegram test failed');
  return json;
}

export async function getBackupHistory() {
  const res = await fetch(`${API_BASE}/api/backup/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get backup history');
  return res.json();
}

export async function getDiskSpace() {
  const res = await fetch(`${API_BASE}/api/system/disk`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get disk space');
  return res.json();
}
