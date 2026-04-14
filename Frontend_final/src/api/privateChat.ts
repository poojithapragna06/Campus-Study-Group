const BASE = 'http://localhost:5000/api/friends';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── Fetch private chat messages ──────────────────────────────────────────────
export async function apiFetchPrivateChat(friendId: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/private-chat?friendId=${encodeURIComponent(friendId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch private chat');
  return res.json(); // { status, chat_id, messages }
}

// ── Send text message in private chat ────────────────────────────────────────
export async function apiSendPrivateMessage(friendId: string, content: string) {
  const res = await fetch(`${BASE}/send-message`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ friendId, content }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json(); // { status, message }
}

// ── Upload file in private chat ──────────────────────────────────────────────
export async function apiUploadFileMessage(friendId: string, file: File) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('friendId', friendId);
  formData.append('file', file);

  const res = await fetch(`${BASE}/upload-file`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return res.json(); // { status, message, fileUrl, fileName, fileSize }
}
