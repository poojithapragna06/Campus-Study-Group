/**
 * Simulated async API layer — swap these for real fetch/axios calls.
 * TanStack Query handles caching, loading, error states throughout the app.
 */

import {
  studyGroups as _groups,
  sessions as _sessions,
  messages as _messages,
  sharedFiles as _files,
  users as _users,
} from '../data/mockData';
import { StudyGroup, StudySession, Message, SharedFile, User } from '../types';

const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function fetchGroups(): Promise<StudyGroup[]> {
  await delay();
  return [..._groups];
}

export async function fetchGroupById(id: string): Promise<StudyGroup | undefined> {
  await delay(200);
  return _groups.find(g => g.id === id);
}

export async function createGroup(payload: Omit<StudyGroup, 'id' | 'members' | 'createdAt'>): Promise<StudyGroup> {
  await delay(600);
  const newGroup: StudyGroup = {
    ...payload,
    id: 'g' + Date.now(),
    members: [],
    createdAt: new Date().toISOString(),
  };
  _groups.push(newGroup);
  return newGroup;
}

export async function archiveGroup(id: string): Promise<StudyGroup> {
  await delay(300);
  const g = _groups.find(g => g.id === id);
  if (!g) throw new Error('Group not found');
  g.status = g.status === 'active' ? 'archived' : 'active';
  return { ...g };
}

export async function deleteGroup(id: string): Promise<void> {
  await delay(300);
  const idx = _groups.findIndex(g => g.id === id);
  if (idx !== -1) _groups.splice(idx, 1);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<StudySession[]> {
  await delay();
  return [..._sessions];
}

export async function createSession(payload: Omit<StudySession, 'id'>): Promise<StudySession> {
  await delay(600);
  const newSession: StudySession = { ...payload, id: 's' + Date.now() };
  _sessions.push(newSession);
  return newSession;
}

export async function rsvpSession(sessionId: string, userId: string): Promise<StudySession> {
  await delay(200);
  const s = _sessions.find(s => s.id === sessionId);
  if (!s) throw new Error('Session not found');
  if (s.attendees.includes(userId)) {
    s.attendees = s.attendees.filter(id => id !== userId);
  } else {
    s.attendees.push(userId);
  }
  return { ...s };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function fetchMessages(groupId: string): Promise<Message[]> {
  await delay(300);
  return _messages.filter(m => m.groupId === groupId);
}

export async function sendMessage(payload: Omit<Message, 'id'>): Promise<Message> {
  await delay(150);
  const newMsg: Message = { ...payload, id: 'm' + Date.now() };
  _messages.push(newMsg);
  return newMsg;
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function fetchFiles(): Promise<SharedFile[]> {
  await delay();
  return [..._files];
}

export async function deleteFile(id: string): Promise<void> {
  await delay(300);
  const idx = _files.findIndex(f => f.id === id);
  if (idx !== -1) _files.splice(idx, 1);
}

export async function uploadFile(payload: Omit<SharedFile, 'id'>): Promise<SharedFile> {
  await delay(800);
  const newFile: SharedFile = { ...payload, id: 'f' + Date.now() };
  _files.push(newFile);
  return newFile;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  await delay();
  return [..._users];
}

export async function deleteUser(id: string): Promise<void> {
  await delay(300);
  const idx = _users.findIndex(u => u.id === id);
  if (idx !== -1) _users.splice(idx, 1);
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  groupsJoined: number;
  sessionsAttended: number;
  filesShared: number;
  studyHours: number;
}

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  await delay(350);
  const userGroups = _groups.filter(g => g.members.some(m => m.id === userId));
  const userSessions = _sessions.filter(s => s.attendees.includes(userId));
  return {
    groupsJoined: userGroups.length,
    sessionsAttended: userSessions.length,
    filesShared: _files.filter(f => userGroups.some(g => g.id === f.groupId)).length,
    studyHours: userSessions.reduce((sum, s) => sum + s.duration, 0) / 60,
  };
}
