const BASE = 'http://localhost:5000/api/sessions';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface SessionPayload {
  title: string;
  groupId: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  isOnline: boolean;
  description: string;
  maxAttendees: number;
}

// ── Get sessions for my groups ───────────────────────────────────────────────
export async function apiFetchMySessions() {
  const res = await fetch(`${BASE}/my`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json(); // { status, sessions }
}

// ── Create a session ─────────────────────────────────────────────────────────
export async function apiCreateSession(payload: SessionPayload) {
  const res = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json(); // { status, session }
}

// ── Toggle RSVP ──────────────────────────────────────────────────────────────
export async function apiRsvpSession(sessionId: string) {
  const res = await fetch(`${BASE}/rsvp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error('Failed to RSVP');
  return res.json(); // { status, session }
}

// ── Delete session ───────────────────────────────────────────────────────────
export async function apiDeleteSession(sessionId: string) {
  const res = await fetch(`${BASE}/delete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error('Failed to delete session');
  return res.json();
}
